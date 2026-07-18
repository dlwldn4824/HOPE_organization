# Stage 2 성능 검증 요청 가이드

> **누구를 위한 문서인가:** `Stage2_성능저하_원인분석_보고서.pdf`에 나온 8개 평가 세트 숫자를,
> 발화 단위 raw 결과로 재현해서 보내주실 분(AI 담당)을 위한 실행 가이드입니다.
> **왜 필요한가:** 지금 보고서에는 세트별 평균 PER만 있고, 그 숫자가 어떻게 나왔는지
> (원본 오디오 목록, 발화별 예측, 실행 로그)가 없어서 검증이 불가능합니다. 아래 스크립트로
> 발화 단위 결과를 뽑아서 공유해주시면, 그걸로 통계 검정(Wilcoxon, paired bootstrap)까지
> 재현해서 확인할 수 있습니다.

---

## 1. 무엇을 실행하면 되나요

레포에 이미 올라가 있는 스크립트 하나만 실행하시면 됩니다.

```
speech-coach/scripts/eval_per_utterance.py
```

이 스크립트는 **Stage 1-B 체크포인트와 Stage 2 체크포인트를 같은 오디오 세트에 돌려서**,
발화(파일) 하나하나마다 정답 IPA, 두 모델의 예측 IPA, 오류 유형(치환/삽입/삭제) 개수,
PER을 JSONL 한 줄씩으로 남깁니다. 세트 평균/중앙값이 담긴 요약 JSON도 같이 나옵니다.

---

## 2. 준비물

### 2.1 환경 (GPU 서버 기준)

```bash
pip install torch transformers soundfile librosa tqdm numpy
```

(이미 학습 환경에 torch/transformers는 설치되어 있을 테니, `soundfile`, `librosa`,
`tqdm`만 추가로 필요할 수 있습니다.)

### 2.2 두 체크포인트 경로

- `--s1b_ckpt` : Stage 1-B 체크포인트 디렉토리 (`config.json`, `vocab.json`,
  `model.safetensors` 등이 들어있는 폴더)
- `--s2_ckpt` : Stage 2 체크포인트 디렉토리 (같은 구조)

보고서에서 실제로 비교에 쓴 그 체크포인트 경로 그대로 넣어주시면 됩니다.

### 2.3 평가할 오디오 목록 (manifest.jsonl)

세트 하나당 manifest 파일 하나가 필요합니다. 한 줄에 발화 하나씩, JSON 형식입니다.

**형식 A — 정답 음소를 이미 알고 있는 경우 (권장):**

```json
{"utt_id": "kids_sn266_0001", "audio_path": "/data/eval/sn266/0001.wav", "target_phonemes": ["s", "a", "k", "w", "a"]}
```

**형식 B — 한글 전사만 있는 경우 (자동으로 음소 변환됨):**

```json
{"utt_id": "kids_sn266_0001", "audio_path": "/data/eval/sn266/0001.wav", "transcript": "사과"}
```

- `target_phonemes`가 있으면 그대로 정답으로 쓰고, 없으면 `transcript`를 자동으로
  음소열로 변환합니다 (`speech_coach.data.g2p_ko`).
- `audio_path`는 16kHz mono wav 권장. 다른 샘플링레이트면 자동 리샘플링됩니다 (warning 남음).
- 보고서에 나온 8개 세트(성인 eval_clean/eval_other/test, 아동 sn=266 test, 아동
  깨끗함/잡음15dB/잡음5dB) 각각에 대해 이 manifest를 만들어주시면 됩니다. 평가 스크립트를
  만들 때 이미 오디오 목록을 갖고 계실 테니, 그 목록을 이 형식으로 변환만 하면 됩니다.

---

## 3. 실행 방법

세트 하나씩, 아래 형태로 실행합니다. **가장 작은 세트(아동 깨끗함, 500개)부터 먼저 하나만
해서 보내주시면 좋겠습니다** — 결과 포맷이 맞는지 먼저 확인하고 나머지를 이어가는 게 안전합니다.

```bash
python speech-coach/scripts/eval_per_utterance.py \
  --manifest /data/eval/kids_clean_500.jsonl \
  --s1b_ckpt /ckpt/stage1b/final \
  --s2_ckpt /ckpt/stage2/final \
  --out results/kids_clean_500_per.jsonl \
  --eval_set_name kids_clean_500 \
  --batch_size 8 \
  --device cuda:0
```

### 옵션 참고
- `--batch_size` : GPU 메모리 부족하면 줄이세요 (기본 8)
- `--device` : GPU 여러 개면 `cuda:0`, `cuda:1` 등으로 지정
- `--sequential_load` : 두 모델을 동시에 GPU에 올리기 부담되면 이 옵션을 켜세요.
  한 모델씩 순서대로 로드 → 추론 → 언로드합니다.
- `--verbose` : 더 자세한 로그(DEBUG 레벨)가 필요하면 추가

### 실행하면 나오는 것
같은 폴더에 파일 2개가 생깁니다.
- `kids_clean_500_per.jsonl` — 발화 500개 각각의 정답/예측/PER (라인 하나 = 발화 하나)
- `kids_clean_500_per_summary.json` — 세트 평균/중앙값 PER, 사용한 체크포인트 경로,
  torch/transformers 버전, **실행 시각과 소요 시간**까지 자동 기록됨

---

## 4. 저한테 보내주실 때

각 세트마다 **위 두 파일(`*_per.jsonl`, `*_per_summary.json`) 그대로** 보내주시면 됩니다.
가공하거나 요약하지 말고 원본 그대로 주세요 — 그래야 발화 단위로 통계 검정을 돌릴 수 있습니다.

만약 실행 중 에러가 나거나, manifest 만들기 애매한 부분이 있으면 에러 메시지/상황
그대로 알려주세요.

---

## 5. 왜 이렇게까지 하는지 (참고)

- 지금까지 나온 숫자들(팀 테스트 PER 0.8, loss 3.0→0.8, 자음오류율 0.8 등)이 서로 다른
  지표를 같은 숫자로 착각해서 나온 것으로 보이는 정황이 있었습니다.
- 보고서의 8개 세트 결과는 숫자만 있고 재현 근거(원본 오디오 목록, 발화별 결과, 실행 로그)가
  없어서, 그 자체로는 검증이 안 됩니다.
- 발화 단위 raw 결과가 있으면 Wilcoxon signed-rank test, paired bootstrap 95% CI 같은
  통계 검정을 실제로 돌려서, "Stage 2가 정말 더 나은지"를 숫자가 아니라 근거로 확인할 수
  있습니다.
