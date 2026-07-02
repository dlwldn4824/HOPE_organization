# syntax=docker/dockerfile:1.6

# ---------- deps: install production node_modules ----------
FROM node:20-slim AS deps

# better-sqlite3 & bcryptjs 는 대부분 prebuilt 로 해결되지만,
# 특정 아키텍처에서 컴파일 fallback 을 위해 최소 툴체인을 심는다.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- runtime: slim final image ----------
FROM node:20-slim AS runtime

# 비루트 실행 (base 이미지의 기본 node:1000 유저 대신 명시적으로 UID 지정)
RUN groupadd --system --gid 1001 hope \
    && useradd --system --uid 1001 --gid hope --home-dir /app hope

WORKDIR /app
COPY --from=deps --chown=hope:hope /app/node_modules ./node_modules
COPY --chown=hope:hope backend/src ./src
COPY --chown=hope:hope backend/package.json ./
RUN mkdir -p /app/data && chown -R hope:hope /app/data

USER hope

ENV NODE_ENV=production \
    PORT=4000 \
    HOPE_DB_PATH=/app/data/hope.db

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
