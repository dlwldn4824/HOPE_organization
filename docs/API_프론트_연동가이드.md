# HOPE Speech API — 프론트 연동 가이드

> **Base URL:** `https://go-neung.activejang.com`  
> **Swagger (테스트):** https://go-neung.activejang.com/docs  
> **버전:** v0.1.0 (2026-06)

---

## 1. 개요

아이가 단어를 말하면 **음소 단위로 맞았는지** 분석하고, **PCC 점수**와 **아이용 피드백 문장**을 돌려주는 API입니다.

| 항목 | 내용 |
|------|------|
| 프로토콜 | HTTPS |
| 인증 | 없음 (현재) |
| 요청 형식 | `multipart/form-data` |
| 오디오 | **16kHz mono WAV**, 5초 이하 권장 |

---

## 2. 엔드포인트 목록

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/` | Swagger UI로 리다이렉트 |
| `GET` | `/health` | 서버 상태 확인 |
| `GET` | `/docs` | Swagger UI (브라우저 테스트) |
| `GET` | `/redoc` | ReDoc 문서 |
| `POST` | `/v1/utterance/analyze` | **발화 1회 분석 (메인)** |

---

## 3. Health Check

```http
GET /health
```

**응답 예시 (200)**

```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

앱 시작 전·설정 화면에서 서버 연결 확인용으로 쓰면 됩니다.

---

## 4. 발화 분석 API (메인)

### `POST /v1/utterance/analyze`

**Content-Type:** `multipart/form-data`

### 요청 필드

| 필드 | 필수 | 타입 | 설명 |
|------|------|------|------|
| `audio` | ✅ | file | 녹음 wav (16kHz mono, ≤5초) |
| `target_word` | ✅ | string | 연습 목표 단어 (예: `사과`) |
| `target_phonemes` | ❌ | string | 목표 IPA 음소열. **비우면 `target_word`에서 자동 변환** |
| `user_id` | ❌ | string | 사용자 ID (로깅·진도용, 현재 미사용) |

#### `target_phonemes` 입력 방법 (선택)

직접 넣지 않아도 됩니다. 아래 중 하나만 쓰면 됩니다.

1. **비움 (권장)** → `target_word`만내면 서버가 자동 변환
2. JSON 배열: `["s","a","g","w","a"]`
3. 쉼표 구분: `s,a,g,w,a`

### 응답 (200)

```json
{
  "pcc": 75.0,
  "phoneme_results": [
    {
      "target": "s",
      "actual": "s",
      "status": "OK",
      "variation": null,
      "acoustic_deviation_z": 0.3
    },
    {
      "target": "a",
      "actual": "a",
      "status": "OK",
      "variation": null,
      "acoustic_deviation_z": 0.1
    }
  ],
  "feedback": {
    "kid_text": "잘했어! 다음에도 해볼까?",
    "practice_word_next": null
  },
  "latency_ms": 120,
  "model_version": "kspc-v0.8-stub"
}
```

### 필드 설명

| 필드 | 설명 |
|------|------|
| `pcc` | Percent Consonants Correct (0~100, 높을수록 잘함) |
| `phoneme_results[].target` | 목표 음소 (IPA) |
| `phoneme_results[].actual` | 모델이 인식한 음소 |
| `phoneme_results[].status` | `OK` / `SUB`(대체) / `DEL`(생략) / `DIS`(왜곡) |
| `phoneme_results[].variation` | 변동 유형 (있을 때만) |
| `feedback.kid_text` | 아이에게 보여줄 멘트 |
| `feedback.practice_word_next` | 다음 연습 단어 제안 (있을 때) |
| `latency_ms` | 서버 처리 시간(ms) |
| `model_version` | 모델 버전 문자열 |

### 에러 응답

| 코드 | 원인 | 예시 `detail` |
|------|------|----------------|
| `400` | 잘못된 요청 | `target_word 또는 target_phonemes 중 하나는 필요합니다.` |
| `400` | 오디오 너무 큼 | `audio too large` |
| `422` | 필수 필드 누락 | FastAPI validation error |

---

## 5. Swagger에서 테스트하는 방법

1. https://go-neung.activejang.com/docs 접속
2. `POST /v1/utterance/analyze` → **Try it out**
3. 입력:
   - `audio`: wav 파일 선택 (예: `apple_ok_1.wav`)
   - `target_word`: `사과`
   - `target_phonemes`: **비우고** 「Send empty value」 체크 (또는 예시값 그대로)
   - `user_id`: (선택)
4. **Execute** → Response body 확인

---

## 6. 프론트 연동 예시 (React / TypeScript)

### 6.1 환경 변수

```env
VITE_HOPE_API_BASE=https://go-neung.activejang.com
```

### 6.2 API 호출

```ts
const API_BASE = import.meta.env.VITE_HOPE_API_BASE;

export type AnalyzeResponse = {
  pcc: number;
  phoneme_results: {
    target: string;
    actual: string | null;
    status: string;
    variation: string | null;
    acoustic_deviation_z: number | null;
  }[];
  feedback: { kid_text: string; practice_word_next: string | null };
  latency_ms: number;
  model_version: string;
};

export async function analyzeUtterance(
  wavBlob: Blob,
  targetWord: string,
  userId?: string,
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("audio", wavBlob, "utterance.wav");
  form.append("target_word", targetWord);
  // target_phonemes 는 생략 가능 (서버 자동 변환)

  if (userId) form.append("user_id", userId);

  const res = await fetch(`${API_BASE}/v1/utterance/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }

  return res.json();
}
```

### 6.3 녹음 → wav 변환 참고

브라우저 `MediaRecorder`는 보통 webm/m4a로 나옵니다. 서버는 **wav**를 권장하므로:

- 클라이언트에서 16kHz mono wav로 변환 후 전송, **또는**
- 추후 서버에서 webm 수용 (미구현 — 현재는 wav 권장)

### 6.4 UI에서 쓸 값

```ts
const result = await analyzeUtterance(wavBlob, "사과");

// 점수 표시
setScore(result.pcc);

// 음소별 O/X
result.phoneme_results.forEach((p) => {
  console.log(p.target, p.actual, p.status); // OK / SUB / ...
});

// 아이 멘트
setMessage(result.feedback.kid_text);
```

---

## 7. HOPE 연습 단어 (1차)

앱에서 쓸 목표 단어 예시 (ok/err 쌍):

| 목표(ok) | 오류(err) |
|----------|-----------|
| 사과 | 다과 |
| 자두 | 차두 |
| 바다 | 파다 |
| 소리 | 도리 |
| 가방 | 카방 |
| 불 | 물 |

프론트는 **`target_word`만**내면 됩니다. 음소열은 서버가 자동 생성합니다.

---

## 8. 현재 제한 사항 (중요)

| 항목 | 상태 |
|------|------|
| API 형식·Swagger | ✅ 사용 가능 |
| 실제 Wav2Vec2 모델 추론 | 🔄 연동 예정 (현재 스텁 응답) |
| webm/m4a 직접 업로드 | ❌ wav 권장 |
| 인증/API Key | ❌ 없음 |

스텁 모드에서는 응답 형식은 맞지만, **실제 발음 분석 점수는 아직 참고용**입니다. UI·연동 개발은 지금부터 진행해도 됩니다.

---

## 9. 문의

- API 문서: https://go-neung.activejang.com/docs
- AI/백엔드: 장원준
- 이슈 시 `health` 응답 + 요청 필드 스크린샷 공유
