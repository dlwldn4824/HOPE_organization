# HOPE 백엔드 + AI 배포 가이드

> `hope.harvester.kr` 로 HOPE 백엔드를, 같은 Harvester 서버에 AI 추론 컨테이너(내부)를 배포. 이미 뜬 [Harvester 서버 · Cloudflare Tunnel 인프라](../../Game/docs/DEPLOY.md)를 재사용한다.

---

## 1. 전체 그림

```
[맥: 개발/배포 명령]
     │ rsync main + git pull Hope-AI + ssh Harvester → docker compose up
     ▼
[Harvester 10.3.10.168 · Ubuntu · Docker · GPU 없음]
     │
     ├─ hope-backend 컨테이너  (호스트 8093 → 컨테이너 4000)
     │   ├─ Node.js 20 (slim)
     │   ├─ SQLite 파일: Docker volume `hopedata` (재빌드해도 유지)
     │   └─ /health · /docs · /api/*
     │           ↓  Docker network 내부 호출
     ├─ hope-ai 컨테이너 (외부 노출 X, docker network 만)
     │   ├─ Python 3.11 + PyTorch CPU + Wav2Vec2
     │   ├─ 체크포인트 마운트: ~/hope-checkpoints → /checkpoints (읽기전용)
     │   └─ FastAPI :8000
     │
     └─ cloudflared 컨테이너  (dduckyee 스택 공용, host network)
         └─ ingress: hope.harvester.kr → localhost:8093
     ▼
[Cloudflare 엣지] ──▶ https://hope.harvester.kr
```

- 인바운드 포트 개방 불필요. cloudflared 가 아웃바운드 터널만 맺음.
- SQLite 파일은 `hopedata` 볼륨에 저장 → 재배포·재부팅해도 데이터 유지.
- 컨테이너 안에서 non-root(uid 1001) 로 실행.
- **hope-ai 는 외부에 노출되지 않음** — hope-backend 만 docker network 로 붙는다.
- 체크포인트는 이미지 안에 안 넣고 **host bind mount** 로 주입 → 이미지 슬림, 체크포인트 교체 쉬움.

### AI 라우팅 옵션

| `SPEECH_COACH_API_BASE` 값 (deploy/.env) | 어디로 붙나 | 성능 |
|---|---|---|
| `http://hope-ai:8000` (기본) | Harvester 내 hope-ai | 3-8s (CPU) |
| `https://go-neung.activejang.com` | 이주석님 GPU 서버 | ~400ms |

---

## 2. 사전 준비 (최초 1회)

### 2.1 Cloudflare 터널에 hope.harvester.kr 라우팅 추가

터널: `55cbfbbf-21a0-48fe-84d2-a390ff660d62` (dduckyee 게임 스택과 같은 터널)

**대시보드 방식 (권장)**
1. Cloudflare → Zero Trust → Networks → Tunnels → `55cbfbbf-...` 선택
2. **Public Hostname** 탭 → **Add a public hostname**
   - Subdomain: `hope`
   - Domain: `harvester.kr`
   - Service: **HTTP** · `localhost:8093`
3. Save → DNS CNAME(`hope.harvester.kr` → `55cbfbbf-...cfargotunnel.com`, proxied)이 자동 생성됨

**API 방식** — Game 프로젝트의 `~/.cf-deploy/api_token` 활용:
```bash
# 현재 config 조회
curl -H "Authorization: Bearer $(cat ~/.cf-deploy/api_token)" \
  "https://api.cloudflare.com/client/v4/accounts/2c846e96d04e762f8e8ebc3087cf9a7b/cfd_tunnel/55cbfbbf-21a0-48fe-84d2-a390ff660d62/configurations"
# 응답의 ingress 배열 맨 앞에 아래 규칙을 추가한 뒤 PUT
# { "hostname": "hope.harvester.kr", "service": "http://localhost:8093" }
# 그리고 DNS CNAME 생성 (zone_id = 30e78bc81598c995f8f041a35b975e28)
```

⚠️ **harvester.kr 은 공유 존.** 다른 서비스 레코드는 절대 건드리지 말 것. `dig +short hope.harvester.kr` 이 비어 있는지 확인 후 진행 (2026-07 현재 비어 있음).

### 2.2 Harvester 서버에 .env 두기

```bash
ssh Harvester
mkdir -p ~/hope/deploy

cat > ~/hope/deploy/.env <<'EOF'
HOPE_TOKEN_TTL_HOURS=24
LOG_LEVEL=info
CORS_ORIGIN=*

# 기본은 http://hope-ai:8000 (같은 스택 안 내부 컨테이너).
# go-neung 을 계속 쓰려면 아래 주석 해제.
# SPEECH_COACH_API_BASE=https://go-neung.activejang.com

SPEECH_TIMEOUT_MS=30000
SPEECH_RETRIES=1
SPEECH_MAX_BODY_BYTES=10485760
EOF

chmod 600 ~/hope/deploy/.env
```

`deploy/.env.example` 을 복사한 뒤 값만 채워도 됨. rsync 는 `deploy/.env` 를 제외하므로 실수로 덮어써지지 않는다.

### 2.3 hope-ai 사용 시 (Harvester 로컬 AI)

```bash
# 체크포인트 저장 디렉토리 생성
ssh Harvester "mkdir -p ~/hope-checkpoints"

# 로컬 체크포인트 서버로 전송 (약 1.2GB, 5분 소요 예상)
scp -r /path/to/checkpoints/stage1b-mix Harvester:~/hope-checkpoints/

# Hope-AI 브랜치 소스는 deploy/harvester.sh 가 자동 clone/pull.
```

체크포인트 없이 배포하면 hope-ai 는 `PhonemeRecognizerStub` 폴백으로 뜬다 (개발용 에코 모드).

---

## 3. 배포

```bash
# 프로젝트 루트에서
./deploy/harvester.sh                       # 모든 서비스 (hope-backend + hope-ai)
./deploy/harvester.sh hope-backend          # 백엔드만
./deploy/harvester.sh hope-backend hope-ai  # 명시적으로 둘 다
```

내부 동작:
1. **rsync** — 코드 전송. `.git`, `node_modules`, `dist`, `backend/data`, `*.db`, `.env`, `deploy/.env` 제외
2. **docker compose up -d --build** — 이미지 빌드 + 재시작 (기존 컨테이너 자동 교체)
3. **ps** — 상태 출력

`restart: unless-stopped` + Docker 부팅 자동시작 → 서버 재부팅해도 자동 복구.

---

## 4. 검증

```bash
# 외부에서 헬스 체크
curl -s https://hope.harvester.kr/health | jq .
# 기대:
# {
#   "ok": true,
#   "service": "hope-backend",
#   "upstream": { "ok": true, "status": "ok", "version": "0.1.0" }
# }

# 데모 계정 로그인
curl -s -X POST https://hope.harvester.kr/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"demo","password":"hope1234"}' | jq .

# 구조화 로그 확인
ssh Harvester "docker logs hope-backend --tail 30"

# 컨테이너 상태
ssh Harvester "cd ~/hope && docker compose -f deploy/compose.harvester.yml ps"
```

Swagger UI: <https://hope.harvester.kr/docs>

---

## 5. 프론트엔드 연결

프론트는 아직 로컬 Vite dev 로 굴리는 게 기본. `.env.local` 에 백엔드 URL만 지정하면 됨.

```bash
# 프로젝트 루트 (프론트용) — .gitignore 됨
cat > .env.local <<'EOF'
VITE_API_BASE_URL=https://hope.harvester.kr
EOF

npm run dev   # 프론트가 hope.harvester.kr/api/* 로 붙는다
```

**CORS**: `hope.harvester.kr` 이 다른 오리진(로컬 프론트)에서 호출될 때 CORS 필요. `deploy/.env` 의 `CORS_ORIGIN` 값을 프론트 오리진으로 좁혀 두면 안전:
```env
CORS_ORIGIN=https://hope-web.harvester.kr
```
데모 단계에선 `*` 로 두고 나중에 좁혀도 됨.

---

## 6. 데이터 관리

### 백업
```bash
ssh Harvester "docker run --rm -v hope_hopedata:/data -v /tmp:/backup alpine \
  tar czf /backup/hope-$(date +%Y%m%d).tar.gz -C /data ."
scp Harvester:/tmp/hope-*.tar.gz ~/backups/
```

### 복원
```bash
scp ~/backups/hope-YYYYMMDD.tar.gz Harvester:/tmp/
ssh Harvester "docker compose -f ~/hope/deploy/compose.harvester.yml stop hope-backend && \
  docker run --rm -v hope_hopedata:/data -v /tmp:/backup alpine \
    sh -c 'rm -rf /data/* && tar xzf /backup/hope-YYYYMMDD.tar.gz -C /data' && \
  docker compose -f ~/hope/deploy/compose.harvester.yml start hope-backend"
```

### 완전 리셋 (⚠️ 모든 유저·학습기록·지갑 소멸)
```bash
ssh Harvester "cd ~/hope && docker compose -f deploy/compose.harvester.yml down -v"
./deploy/harvester.sh   # 재배포 → 데모 계정 자동 시드
```

---

## 7. 트러블슈팅

### `502 Bad Gateway`
1. 컨테이너 살아있나:
   ```bash
   ssh Harvester "docker ps | grep hope-backend"
   ```
2. 컨테이너 자체는 응답하나:
   ```bash
   ssh Harvester "curl -sS http://localhost:8093/health"
   ```
3. cloudflared 로그:
   ```bash
   ssh Harvester "docker logs dduckyee-cloudflared-1 --tail 20"
   ```
4. 그래도 안 되면 터널 재시작:
   ```bash
   ssh Harvester "cd ~/dduckyee && docker compose -f deploy/compose.harvester.yml restart cloudflared"
   ```

### 배포는 됐는데 라이브에 반영 안 됨
- 컨테이너 교체에 몇 초 필요. `curl -s https://hope.harvester.kr/health` 를 몇 번 재시도.
- 강제 재빌드: `./deploy/harvester.sh` (이미 --build 옵션 포함)

### `CORS error` — 프론트가 백엔드를 못 부름
- `deploy/.env` 의 `CORS_ORIGIN` 값이 프론트 오리진과 일치하는지 확인
- 응답 헤더 검증: `curl -I https://hope.harvester.kr/health | grep -i access-control`
- 값 바꾼 뒤 `./deploy/harvester.sh` 로 재배포

### better-sqlite3 빌드 실패
- Dockerfile 에 이미 `python3 make g++` 포함되어 있어 대부분 해결
- 아키텍처가 arm64 인데 prebuild 가 없다면 시간이 걸릴 수 있음 (첫 빌드 2-5분)

### DB 파일이 사라짐
- `hopedata` 볼륨 존재 확인: `ssh Harvester "docker volume ls | grep hope"`
- `docker compose down -v` 실행 안 했는지 확인 (`-v` 가 볼륨 삭제)

---

## 8. 롤백

특정 커밋으로 되돌리기:
```bash
git checkout <이전-커밋-sha>
./deploy/harvester.sh
git checkout <원래-브랜치>
```

컨테이너만 재시작 (코드 변경 없이):
```bash
ssh Harvester "cd ~/hope && docker compose -f deploy/compose.harvester.yml restart hope-backend"
```

---

## 9. 참고 — 왜 이런 구조인가

- **왜 hope.harvester.kr?** Game 인프라의 Cloudflare Tunnel(55cbfbbf) · cloudflared 컨테이너를 그대로 재사용. HOPE 는 컨테이너 하나만 추가.
- **왜 8093 포트?** dduckyee 스택이 이미 쓰는 8090/8091/8092/8095/2567 과 충돌 없음. `ssh Harvester "sudo lsof -i -P -n | grep LISTEN"` 로 확인 가능.
- **왜 SQLite 유지?** 데모/베타 규모엔 오버스펙 안 만듦. 유저 수천 명 넘어가면 Postgres 로 이전 (스키마는 이미 표준 SQL 이라 무리 없음).
- **왜 non-root?** 컨테이너 탈옥 시 피해 최소화. UID 1001 로 실행.
