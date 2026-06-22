#!/usr/bin/env bash
# HOPE speech-coach → DGX 서버 배포 (Swagger /docs)
set -euo pipefail

HOST="${HOPE_DEPLOY_HOST:-qlak315.iptime.org}"
USER="${HOPE_DEPLOY_USER:-root}"
PORT="${HOPE_DEPLOY_PORT:-20012}"
REMOTE_DIR="${HOPE_REMOTE_DIR:-/root/hope/speech-coach}"
API_PORT="${HOPE_API_PORT:-8000}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -z "${HOPE_DEPLOY_PASSWORD:-}" ]]; then
  echo "HOPE_DEPLOY_PASSWORD 환경변수를 설정하세요." >&2
  exit 1
fi

export SSHPASS="$HOPE_DEPLOY_PASSWORD"
SSH=(sshpass -e ssh -p "$PORT" -o StrictHostKeyChecking=accept-new "${USER}@${HOST}")
echo "==> SSH 연결 확인 ($USER@$HOST:$PORT)"
"${SSH[@]}" "echo ok && uname -a"

echo "==> 코드 동기화 → $REMOTE_DIR (tar)"
"${SSH[@]}" "mkdir -p $REMOTE_DIR"
tar -C "$ROOT" \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude '.pytest_cache' \
  --exclude 'checkpoints' \
  --exclude '*.pyc' \
  -czf - . | sshpass -e ssh -p "$PORT" -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" \
  "tar -xzf - -C $REMOTE_DIR"

echo "==> 서버 설정 및 API 시작"
"${SSH[@]}" bash -s <<REMOTE
set -euo pipefail
REMOTE_DIR="$REMOTE_DIR"
API_PORT="$API_PORT"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq software-properties-common curl

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="\$HOME/.local/bin:\$PATH"
fi
export PATH="\$HOME/.local/bin:\$PATH"

cd "\$REMOTE_DIR"
uv python install 3.11
uv venv --python 3.11 .venv
source .venv/bin/activate
uv pip install -r requirements.txt
uv pip install -e .

if ! command -v cloudflared >/dev/null 2>&1; then
  mkdir -p --mode=0755 /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | tee /etc/apt/sources.list.d/cloudflared.list
  apt-get update -qq
  apt-get install -y -qq cloudflared
fi

# hope-api SysV 서비스 (재부팅 시 자동 시작)
if [[ ! -f /etc/init.d/hope-api ]]; then
  cat > /etc/init.d/hope-api <<'HOPEINIT'
#!/bin/sh
DIR=/root/hope/speech-coach
PIDFILE=/var/run/hope-api.pid
case "$1" in
  start)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then exit 0; fi
    cd "$DIR" || exit 1
    export HOPE_CKPT_DIR="${HOPE_CKPT_DIR:-/root/hope/checkpoints/stage1b-mix/final}"
    export HOPE_MODEL_VERSION="${HOPE_MODEL_VERSION:-stage1b-mix}"
    nohup "$DIR/.venv/bin/uvicorn" speech_coach.serving.api:app --host 0.0.0.0 --port 8000 \
      >> /var/log/hope-api.log 2>&1 &
    echo $! > "$PIDFILE"
    ;;
  stop)
    if [ -f "$PIDFILE" ]; then kill "$(cat "$PIDFILE")" 2>/dev/null; rm -f "$PIDFILE"; fi
    pkill -f "uvicorn speech_coach.serving.api:app" 2>/dev/null || true
    ;;
  restart) $0 stop; sleep 1; $0 start ;;
  status)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then echo Running; else echo Stopped; fi
    ;;
  *) echo "Usage: $0 {start|stop|restart|status}"; exit 1 ;;
esac
HOPEINIT
  chmod +x /etc/init.d/hope-api
  update-rc.d hope-api defaults 2>/dev/null || true
fi

service hope-api restart 2>/dev/null || service hope-api start

sleep 3
curl -sf "http://127.0.0.1:\$API_PORT/health"
echo ""
curl -sf -o /dev/null -w "docs HTTP %{http_code}\n" "http://127.0.0.1:\$API_PORT/docs"

# Named Tunnel: CLOUDFLARE_TUNNEL_TOKEN 이 있으면 cloudflared 서비스 사용
if [[ -n "\${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
  pkill -f "cloudflared tunnel --url" 2>/dev/null || true
  if ! service cloudflared status >/dev/null 2>&1; then
    cloudflared service install "\$CLOUDFLARE_TUNNEL_TOKEN"
  fi
  service cloudflared restart || service cloudflared start
  service cloudflared status
else
  echo "CLOUDFLARE_TUNNEL_TOKEN 없음 — quick tunnel 스킵 (서버에 이미 named tunnel 설치됨)"
  service cloudflared status 2>/dev/null || true
fi
REMOTE

echo ""
echo "배포 완료!"
echo "  서버 내부 Swagger: http://127.0.0.1:${API_PORT}/docs"
echo "  Cloudflare Tunnel: Zero Trust 대시보드에 설정한 Public Hostname 사용"
echo "  서비스: service hope-api {status|restart}  /  service cloudflared {status|restart}"
