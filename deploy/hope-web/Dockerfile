# syntax=docker/dockerfile:1.6

# ---------- builder: Vite 빌드 ----------
FROM node:20-slim AS builder
WORKDIR /app

# 의존성 설치 (레이어 캐시)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 소스 복사 후 빌드
COPY tsconfig*.json vite.config.ts index.html eslint.config.js ./
COPY public ./public
COPY src ./src

# 정적 자산은 상대 경로로 API 호출 (같은 오리진에서 nginx 가 프록시)
ENV VITE_API_BASE_URL=""
RUN npm run build

# ---------- runtime: nginx 로 정적 파일 + 백엔드 프록시 ----------
FROM nginx:1.27-alpine AS runtime

# 기본 default.conf 제거 후 우리 것으로 교체
RUN rm /etc/nginx/conf.d/default.conf
COPY deploy/hope-web/nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 산출물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx 는 기본 포트 80 리스닝
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
