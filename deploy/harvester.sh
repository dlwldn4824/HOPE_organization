#!/usr/bin/env bash
# HOPE 백엔드를 Harvester 서버로 배포.
#
# Usage:
#   ./deploy/harvester.sh                # 전체 (기본 = hope-backend)
#   ./deploy/harvester.sh hope-backend   # 명시적으로
#
# Prereq (한 번만 세팅):
#   - ~/.ssh/config 에 Harvester 호스트가 있어야 함 (Game 프로젝트에서 이미 세팅됨)
#   - Harvester ~/hope/deploy/.env 가 세팅되어 있어야 함 (deploy/.env.example 참고)
#   - Cloudflare 터널 55cbfbbf-... 에 hope.harvester.kr → localhost:8093 ingress 규칙 추가
#     (자세한 내용: docs/DEPLOY.md §3)

set -euo pipefail

REMOTE_HOST="${HOPE_DEPLOY_HOST:-Harvester}"
REMOTE_DIR="${HOPE_REMOTE_DIR:-hope}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SERVICES=("$@")
if [ ${#SERVICES[@]} -eq 0 ]; then
  SERVICES=(hope-backend)
fi

echo "🔁  [1/3] rsync ${ROOT} → ${REMOTE_HOST}:${REMOTE_DIR}/"
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

echo "🐳  [2/3] docker compose up -d --build  (${SERVICES[*]})"
# --env-file 은 host 의 deploy/.env 를 읽어 CORS_ORIGIN 등 값을 주입한다.
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && \
  docker compose \
    -f deploy/compose.harvester.yml \
    --env-file deploy/.env \
    up -d --build ${SERVICES[*]}"

echo "📋  [3/3] ps"
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && \
  docker compose -f deploy/compose.harvester.yml ps"

echo ""
echo "✅  Deploy submitted. Verify:"
echo "    curl -s https://hope.harvester.kr/health | jq ."
echo "    ssh ${REMOTE_HOST} 'docker logs hope-backend --tail 20'"
