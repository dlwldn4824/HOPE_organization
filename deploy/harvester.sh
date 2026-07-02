#!/usr/bin/env bash
# HOPE (백엔드 + 옵션으로 AI) 를 Harvester 서버로 배포.
#
# Usage:
#   ./deploy/harvester.sh                        # 모든 서비스
#   ./deploy/harvester.sh hope-backend           # 특정 서비스만
#   ./deploy/harvester.sh hope-backend hope-ai
#
# 서버 구조:
#   ~/hope/       ← main 브랜치 (백엔드 + compose 설정)     rsync
#   ~/hope-ai/    ← Hope-AI 브랜치 (AI Python 소스)         git pull
#   ~/hope-checkpoints/  ← 체크포인트 (별도 scp)
#
# Prereq (한 번만 세팅):
#   - ~/.ssh/config 에 Harvester 호스트 (Game 프로젝트 세팅과 동일)
#   - Harvester ~/hope/deploy/.env (deploy/.env.example 참고)
#   - Cloudflare 터널 55cbfbbf-... 에 ddobakddobak.harvester.kr → localhost:8093 ingress
#   - hope-ai 사용 시:
#     * ssh Harvester "sudo mkdir -p ~/hope-checkpoints && sudo chown harvester:harvester ~/hope-checkpoints"
#     * ssh Harvester "git clone -b Hope-AI https://github.com/dlwldn4824/HOPE_organization.git ~/hope-ai"
#     * scp /path/to/checkpoints/stage1b-mix Harvester:~/hope-checkpoints/

set -euo pipefail

REMOTE_HOST="${HOPE_DEPLOY_HOST:-Harvester}"
REMOTE_DIR="${HOPE_REMOTE_DIR:-hope}"
REMOTE_AI_DIR="${HOPE_REMOTE_AI_DIR:-hope-ai}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SERVICES=("$@")
DEFAULT_SERVICES=(hope-web hope-backend hope-ai)
if [ ${#SERVICES[@]} -eq 0 ]; then
  SERVICES=("${DEFAULT_SERVICES[@]}")
fi

# hope-ai 가 배포 대상이면 Hope-AI 브랜치도 최신화
DEPLOY_AI=0
for s in "${SERVICES[@]}"; do
  if [ "$s" = "hope-ai" ]; then DEPLOY_AI=1; fi
done

echo "🔁  [1/4] rsync main → ${REMOTE_HOST}:${REMOTE_DIR}/"
rsync -az --delete \
  --exclude '.git' \
  --exclude '.venv' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude 'dist-ssr' \
  --exclude 'backend/data' \
  --exclude 'backend/.env' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '*.db' \
  --exclude '*.db-*' \
  --exclude 'deploy/.env' \
  --exclude '.DS_Store' \
  "${ROOT}/" "${REMOTE_HOST}:${REMOTE_DIR}/"

if [ "$DEPLOY_AI" = "1" ]; then
  echo "🐍  [2/4] git pull Hope-AI 브랜치 → ${REMOTE_HOST}:~/${REMOTE_AI_DIR}/"
  ssh "${REMOTE_HOST}" "
    set -euo pipefail
    if [ ! -d ~/${REMOTE_AI_DIR}/.git ]; then
      echo '  ~/${REMOTE_AI_DIR} 최초 clone'
      git clone -b Hope-AI https://github.com/dlwldn4824/HOPE_organization.git ~/${REMOTE_AI_DIR}
    else
      cd ~/${REMOTE_AI_DIR}
      git fetch origin Hope-AI
      git reset --hard origin/Hope-AI
    fi
    echo '  현재 커밋:' \$(cd ~/${REMOTE_AI_DIR} && git log -1 --oneline)
  "

  echo "🎯  [3/4] 체크포인트 존재 확인"
  ssh "${REMOTE_HOST}" "
    if [ -f ~/hope-checkpoints/stage1b-mix/final/model.safetensors ]; then
      echo '  ✅ 체크포인트 있음 (' \$(du -h ~/hope-checkpoints/stage1b-mix/final/model.safetensors | cut -f1) ')'
    else
      echo '  ⚠️  ~/hope-checkpoints/stage1b-mix/final/model.safetensors 없음'
      echo '     → hope-ai 는 PhonemeRecognizerStub 폴백으로 뜬다.'
      echo '     scp 로 미리 올려두려면:'
      echo '       scp -r /path/to/checkpoints/stage1b-mix ${REMOTE_HOST}:~/hope-checkpoints/'
    fi
  "
else
  echo "⏩  [2/4] hope-ai 배포 대상 아님 — Hope-AI git pull 건너뜀"
  echo "⏩  [3/4] hope-ai 배포 대상 아님 — 체크포인트 확인 건너뜀"
fi

echo "🐳  [4/4] docker compose up -d --build  (${SERVICES[*]})"
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && \
  docker compose \
    -f deploy/compose.harvester.yml \
    --env-file deploy/.env \
    up -d --build ${SERVICES[*]}"

echo ""
echo "📋  ps"
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && \
  docker compose -f deploy/compose.harvester.yml ps"

echo ""
echo "✅  Deploy submitted. Verify:"
echo "    curl -s https://ddobakddobak.harvester.kr/health | jq .upstream"
echo "    curl -sI https://ddobakddobak.harvester.kr/ | head -3   # 프론트 (200)"
echo "    ssh ${REMOTE_HOST} 'docker logs hope-web --tail 10'"
echo "    ssh ${REMOTE_HOST} 'docker logs hope-backend --tail 20'"
if [ "$DEPLOY_AI" = "1" ]; then
  echo "    ssh ${REMOTE_HOST} 'docker logs hope-ai --tail 30'   # 모델 로드 대기"
fi
