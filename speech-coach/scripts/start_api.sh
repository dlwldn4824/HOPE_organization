#!/usr/bin/env bash
# 서버에서 hope-api 수동 시작/재시작
set -euo pipefail
cd "$(dirname "$0")/.."
API_PORT="${HOPE_API_PORT:-8000}"

pkill -f "uvicorn speech_coach.serving.api:app" 2>/dev/null || true
sleep 1

source .venv/bin/activate
exec uvicorn speech_coach.serving.api:app --host 0.0.0.0 --port "$API_PORT"
