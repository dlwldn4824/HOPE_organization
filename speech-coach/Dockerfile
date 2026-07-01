# syntax=docker/dockerfile:1.6

# ---------- deps: install Python deps + torch CPU wheel ----------
FROM python:3.11-slim AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# PyTorch/torchaudio CPU 전용 휠로 설치 (nvidia 12GB 안 받아옴).
# --index-url 을 requirements.txt 앞에서 먼저 잡아 CPU wheel 을 사용.
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    "torch>=2.1" "torchaudio>=2.1"

COPY requirements.txt .
# torch/torchaudio 는 위에서 이미 설치했으니 재설치 안 되게 --no-deps 로
# torch 만 필터 후 나머지 설치. 안전하게 그냥 requirements 를 그대로 밀고
# 이미 설치된 torch 는 그대로 유지되게 함.
RUN pip install --no-cache-dir -r requirements.txt

COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install --no-cache-dir -e .

# ---------- runtime: slim final image ----------
FROM python:3.11-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Non-root 실행
RUN groupadd --system --gid 1001 speech \
    && useradd --system --uid 1001 --gid speech --home-dir /app speech

WORKDIR /app

# Python site-packages 통째로 복사 (torch, transformers, etc.)
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# 소스 코드
COPY --chown=speech:speech src ./src
COPY --chown=speech:speech pyproject.toml README.md ./

# 체크포인트 마운트 지점 (실제 파일은 볼륨으로 주입)
RUN mkdir -p /checkpoints && chown -R speech:speech /checkpoints

USER speech

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOPE_CKPT_DIR=/checkpoints/stage1b-mix/final \
    HOPE_MODEL_VERSION=stage1b-mix \
    HF_HOME=/tmp/hf-cache \
    TRANSFORMERS_CACHE=/tmp/hf-cache

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=8s --start-period=90s --retries=3 \
    CMD curl -sf http://localhost:8000/health || exit 1

CMD ["uvicorn", "speech_coach.serving.api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
