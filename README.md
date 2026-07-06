# HOPE — 음소(IPA) CTC 학습

한국어 조음·발화 피드백용 **Wav2Vec2-CTC** 학습 패키지입니다.

**브랜치:** GPU 학습·평가는 **`Hope-AI`** (`git checkout Hope-AI && git pull`).

## 빠른 시작 (GPU / 이주석 형님)

1. **필독:** [`이주석형님께 드리는 부탁.md`](./이주석형님께%20드리는%20부탁.md) — **A.6 / A.12** (데이터 incoming + Stage별 학습 명령)
2. AI Hub zip → [`data/incoming/`](./data/incoming/README.md) (본학습 **D1 + D2**만 필수)
3. 학습 (Stage 1-B 예시):

```bash
cd speech-coach
python -m venv .venv && source .venv/bin/activate
pip install -e .

python scripts/extract_hope_data.py --check-only
python scripts/extract_hope_data.py
python scripts/prepare_all_manifests.py --stage1b
python scripts/split_manifests.py --manifest ../data/manifests/stage1b_d1_60_d2_40.jsonl

python -m speech_coach.training.train_ctc \
  --repo_root .. \
  --manifest ../data/manifests/stage1b_d1_60_d2_40_train.jsonl \
  --train_batch_size 16 \
  --gradient_accumulation_steps 2 \
  --eval_steps 500 \
  --bf16
```

**Stage 2 (D1 50% + D2 50%):** `prepare --stage2-mix` → `split` → `train_ctc --resume_from stage1b-mix/final --augment` (상세는 부탁 md §A.6).

## 저장소 구조

```text
speech-coach/          # 학습·g2p·데이터 파이프라인 (소스)
data/incoming/         # zip 드롭 존 (README만 Git 추적)
data/manifests/        # prepare 후 생성 (로컬)
hope_Ai_model/         # 래퍼 스크립트·추가 문서
AI설계서_v0.8.txt
```

## Git에 없는 것

대용량 zip, `data/raw/`, `checkpoints/`, `.venv` — [.gitignore](./.gitignore) 참고.

## 설계

[`AI설계서_v0.8.txt`](./AI설계서_v0.8.txt)
