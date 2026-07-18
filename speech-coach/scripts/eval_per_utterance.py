#!/usr/bin/env python3
"""발화 단위 PER 로깅 — Stage 1-B vs Stage 2 체크포인트 비교용.

두 CTC 체크포인트로 동일 manifest를 추론하고, 발화(utterance)마다 정답 IPA,
두 모델의 예측 IPA, 오류 유형별 카운트(sub/ins/del), PER을 JSONL로 남긴다.
통계 검정(Wilcoxon, paired bootstrap, Cohen's d)은 이 출력물을 입력으로 삼는
별도 스크립트에서 수행한다 (이 스크립트의 범위 밖).

## Manifest 스키마 (JSONL, 한 줄 한 발화)

    {"utt_id": "...", "audio_path": "...", "target_phonemes": ["s","a","k","w","a"]}
    {"utt_id": "...", "audio_path": "...", "transcript": "사과"}

`target_phonemes`가 있으면 그대로 정답으로 쓰고, 없으면 `transcript`를 g2p
(`speech_coach.data.g2p_ko.g2p_sentence`)로 변환한다. 프로젝트 기존 manifest
(`speech-coach/data/manifest.example.jsonl`)는 `target_phonemes`를 이미 갖고
있으므로 그대로 재사용 가능하다.

## 실행 예시

    python eval_per_utterance.py \\
        --manifest /data/eval/kids_sn266_test.jsonl \\
        --s1b_ckpt /ckpt/stage1b/final \\
        --s2_ckpt /ckpt/stage2/final \\
        --out /results/kids_sn266_test_per.jsonl \\
        --eval_set_name kids_sn266_test \\
        --batch_size 8 \\
        --device cuda:0

## 출력

- `<out>`: 발화 단위 JSONL (스키마는 README 참고 — 요청 스펙과 동일)
- `<out 확장자 제외>_summary.json`: 세트 요약 (평균/중앙값 PER, 환경 정보 등)
"""

from __future__ import annotations

import argparse
import json
import logging
import random
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import torch
from tqdm import tqdm
from transformers import Wav2Vec2CTCTokenizer, Wav2Vec2FeatureExtractor, Wav2Vec2ForCTC

REPO_SRC = Path(__file__).resolve().parents[1] / "src"
if str(REPO_SRC) not in sys.path:
    sys.path.insert(0, str(REPO_SRC))

from speech_coach.data.g2p_ko import g2p_sentence  # noqa: E402
from speech_coach.data.ipa_vocab import filter_to_vocab  # noqa: E402

logger = logging.getLogger("eval_per_utterance")

_SKIP_TOKENS = frozenset({"<pad>", "<unk>", "<sil>", "<eos>", "<s>", "</s>", "|", ""})


def set_seed(seed: int = 42) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


# --------------------------------------------------------------------------
# I/O
# --------------------------------------------------------------------------


def load_manifest(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open(encoding="utf-8") as f:
        for lineno, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as e:
                logger.warning("manifest line %d: JSON 파싱 실패, 스킵 (%s)", lineno, e)
    return rows


def load_audio(path: Path, target_sr: int = 16000) -> np.ndarray:
    import soundfile as sf

    wav, sr = sf.read(str(path), dtype="float32", always_2d=False)
    wav = np.asarray(wav, dtype=np.float32)
    if wav.ndim > 1:
        wav = wav.mean(axis=-1)
    if sr != target_sr:
        import librosa

        logger.warning("%s: sr=%d != %d, 리샘플링", path, sr, target_sr)
        wav = librosa.resample(wav, orig_sr=sr, target_sr=target_sr)
    duration = len(wav) / target_sr
    if duration > 30.0:
        logger.warning("%s: %.1fs > 30s, 자르지 않고 그대로 처리", path, duration)
    return wav


def gt_ipa_for_row(row: dict) -> list[str]:
    tp = row.get("target_phonemes")
    if tp:
        return filter_to_vocab([str(x) for x in tp])
    transcript = (row.get("transcript") or "").strip()
    return g2p_sentence(transcript)


# --------------------------------------------------------------------------
# Model
# --------------------------------------------------------------------------


@dataclass
class LoadedModel:
    model: Wav2Vec2ForCTC
    tokenizer: Wav2Vec2CTCTokenizer
    feature_extractor: Wav2Vec2FeatureExtractor
    device: str
    blank_id: int
    vocab: set[str] = field(default_factory=set)


def load_model(ckpt_dir: Path, device: str, base_model: str) -> LoadedModel:
    feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(base_model)
    tokenizer = Wav2Vec2CTCTokenizer.from_pretrained(str(ckpt_dir))
    model = Wav2Vec2ForCTC.from_pretrained(str(ckpt_dir))
    model.to(device)
    model.eval()
    blank_id = int(tokenizer.pad_token_id)
    vocab = set(tokenizer.get_vocab().keys())
    return LoadedModel(
        model=model,
        tokenizer=tokenizer,
        feature_extractor=feature_extractor,
        device=device,
        blank_id=blank_id,
        vocab=vocab,
    )


def _ctc_collapse(ids: list[int], blank_id: int) -> list[int]:
    out: list[int] = []
    prev: int | None = None
    for token_id in ids:
        if token_id == blank_id:
            prev = token_id
            continue
        if token_id != prev:
            out.append(token_id)
        prev = token_id
    return out


def batch_infer(lm: LoadedModel, audios: list[np.ndarray], batch_size: int) -> list[list[str]]:
    """오디오 리스트 -> 발화별 예측 IPA 토큰 리스트 (배치 처리, CTC greedy)."""
    results: list[list[str]] = []
    for start in tqdm(range(0, len(audios), batch_size), desc=f"infer[{lm.device}]", leave=False):
        chunk = audios[start : start + batch_size]
        inputs = lm.feature_extractor(
            chunk,
            sampling_rate=16000,
            return_tensors="pt",
            padding=True,
            return_attention_mask=True,
        )
        input_values = inputs.input_values.to(lm.device)
        attention_mask = inputs.attention_mask.to(lm.device)

        autocast_kwargs = (
            {"device_type": "cuda", "dtype": torch.bfloat16}
            if lm.device.startswith("cuda")
            else {"device_type": "cpu", "enabled": False}
        )
        with torch.no_grad(), torch.autocast(**autocast_kwargs):
            logits = lm.model(input_values=input_values, attention_mask=attention_mask).logits

        pred_ids_batch = logits.float().argmax(dim=-1).cpu().tolist()
        for pred_ids in pred_ids_batch:
            collapsed = _ctc_collapse(pred_ids, lm.blank_id)
            tokens = lm.tokenizer.convert_ids_to_tokens(collapsed)
            phonemes = [t for t in tokens if t not in _SKIP_TOKENS]
            results.append(phonemes)
    return results


# --------------------------------------------------------------------------
# PER / edit distance with op breakdown
# --------------------------------------------------------------------------


def compute_per_and_errors(ref_ipa: list[str], hyp_ipa: list[str]) -> dict:
    """Levenshtein 정렬 기반 sub/ins/del 개별 카운트 + PER.

    n_ref == 0 인 경우는 호출부에서 스킵하므로 여기서는 다루지 않는다.
    hyp가 빈 리스트면 ref 전체가 del로 처리된다 (PER = 100%).
    """
    n, m = len(ref_ipa), len(hyp_ipa)
    # dp[i][j] = (cost, op) 역추적을 위해 별도 backtrace 테이블 사용
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    bt = [[""] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        dp[i][0] = i
        bt[i][0] = "D"
    for j in range(1, m + 1):
        dp[0][j] = j
        bt[0][j] = "I"
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if ref_ipa[i - 1] == hyp_ipa[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
                bt[i][j] = "M"
                continue
            sub_cost = dp[i - 1][j - 1] + 1
            del_cost = dp[i - 1][j] + 1
            ins_cost = dp[i][j - 1] + 1
            best = min(sub_cost, del_cost, ins_cost)
            dp[i][j] = best
            if best == sub_cost:
                bt[i][j] = "S"
            elif best == del_cost:
                bt[i][j] = "D"
            else:
                bt[i][j] = "I"

    sub = ins = del_ = 0
    i, j = n, m
    while i > 0 or j > 0:
        op = bt[i][j]
        if op == "M":
            i, j = i - 1, j - 1
        elif op == "S":
            sub += 1
            i, j = i - 1, j - 1
        elif op == "D":
            del_ += 1
            i -= 1
        elif op == "I":
            ins += 1
            j -= 1
        else:  # i == 0 and j == 0
            break

    edit_distance = dp[n][m]
    per = 100.0 * edit_distance / n if n > 0 else 0.0
    return {
        "sub": sub,
        "ins": ins,
        "del": del_,
        "edit_distance": edit_distance,
        "per": per,
        "n_ref": n,
    }


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--manifest", type=Path, required=True)
    p.add_argument("--s1b_ckpt", type=Path, required=True)
    p.add_argument("--s2_ckpt", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--eval_set_name", type=str, required=True)
    p.add_argument("--batch_size", type=int, default=8)
    p.add_argument("--device", type=str, default="cuda:0")
    p.add_argument(
        "--sequential_load",
        action="store_true",
        help="두 모델을 동시에 GPU에 올리지 않고, 한 모델씩 순차 추론 후 언로드 (VRAM 부족 시)",
    )
    p.add_argument(
        "--base_model",
        type=str,
        default="facebook/wav2vec2-xls-r-300m",
        help="feature extractor(정규화 설정)를 가져올 베이스 모델. 체크포인트에 preprocessor_config.json이 없을 때 사용",
    )
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--verbose", action="store_true")
    return p.parse_args()


def _infer_for_ckpt(
    tag: str,
    ckpt_dir: Path,
    audios: list[np.ndarray],
    device: str,
    batch_size: int,
    base_model: str,
) -> tuple[list[list[str]], set[str]]:
    logger.info("[%s] 체크포인트 로드: %s", tag, ckpt_dir)
    lm = load_model(ckpt_dir, device, base_model)
    preds = batch_infer(lm, audios, batch_size)
    vocab = lm.vocab
    del lm.model
    if device.startswith("cuda"):
        torch.cuda.empty_cache()
    return preds, vocab


def _warn_unknown_symbols(tag: str, ipa: list[str], vocab: set[str]) -> list[str]:
    kept: list[str] = []
    for sym in ipa:
        if sym in vocab or sym in _SKIP_TOKENS:
            kept.append(sym)
        else:
            logger.warning("[%s] vocab에 없는 IPA 심볼 무시: %r", tag, sym)
    return kept


def main() -> None:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    set_seed(args.seed)
    t0 = time.time()

    rows = load_manifest(args.manifest)
    logger.info("manifest 로드: %d개 발화 (%s)", len(rows), args.manifest)

    # 정답 IPA 준비(n_ref==0 스킵) + 오디오 로드(경로 없거나 손상 시 스킵)
    utt_records: list[dict] = []
    for row in rows:
        gt = gt_ipa_for_row(row)
        if len(gt) == 0:
            logger.warning("utt_id=%s: 정답 IPA 빈 값, 스킵", row.get("utt_id"))
            continue
        audio_path = Path(row["audio_path"])
        try:
            wav = load_audio(audio_path)
        except (FileNotFoundError, OSError, RuntimeError) as e:
            logger.warning("utt_id=%s: 오디오 로드 실패 (%s), 스킵", row.get("utt_id"), e)
            continue
        utt_records.append({"row": row, "gt": gt, "wav": wav, "duration": len(wav) / 16000.0})

    n_skipped = len(rows) - len(utt_records)
    audios = [r["wav"] for r in utt_records]
    logger.info("유효 발화: %d개, 스킵: %d개", len(utt_records), n_skipped)

    if not utt_records:
        logger.error("유효한 발화가 없습니다. manifest/audio_path를 확인하세요.")
        sys.exit(1)

    # 추론
    if args.sequential_load:
        s1b_preds, s1b_vocab = _infer_for_ckpt(
            "stage1b", args.s1b_ckpt, audios, args.device, args.batch_size, args.base_model
        )
        s2_preds, s2_vocab = _infer_for_ckpt(
            "stage2", args.s2_ckpt, audios, args.device, args.batch_size, args.base_model
        )
    else:
        logger.info("[stage1b] 체크포인트 로드: %s", args.s1b_ckpt)
        lm_1b = load_model(args.s1b_ckpt, args.device, args.base_model)
        logger.info("[stage2] 체크포인트 로드: %s", args.s2_ckpt)
        lm_2 = load_model(args.s2_ckpt, args.device, args.base_model)
        s1b_preds = batch_infer(lm_1b, audios, args.batch_size)
        s2_preds = batch_infer(lm_2, audios, args.batch_size)
        s1b_vocab = lm_1b.vocab
        s2_vocab = lm_2.vocab
        del lm_1b.model, lm_2.model
        if args.device.startswith("cuda"):
            torch.cuda.empty_cache()

    # 발화별 결과 기록
    args.out.parent.mkdir(parents=True, exist_ok=True)
    s1b_pers: list[float] = []
    s2_pers: list[float] = []
    with args.out.open("w", encoding="utf-8") as f:
        for rec, s1b_pred_raw, s2_pred_raw in zip(utt_records, s1b_preds, s2_preds, strict=True):
            row = rec["row"]
            gt = rec["gt"]
            s1b_pred = _warn_unknown_symbols("stage1b-pred", s1b_pred_raw, s1b_vocab) if s1b_vocab else s1b_pred_raw
            s2_pred = _warn_unknown_symbols("stage2-pred", s2_pred_raw, s2_vocab) if s2_vocab else s2_pred_raw

            s1b_err = compute_per_and_errors(gt, s1b_pred)
            s2_err = compute_per_and_errors(gt, s2_pred)
            s1b_pers.append(s1b_err["per"])
            s2_pers.append(s2_err["per"])

            record = {
                "utt_id": row.get("utt_id"),
                "audio_path": row.get("audio_path"),
                "duration_sec": round(rec["duration"], 4),
                "gt_transcript": row.get("transcript"),
                "gt_ipa": " ".join(gt),
                "n_ref_phonemes": s1b_err["n_ref"],
                "s1b_pred_ipa": " ".join(s1b_pred),
                "s1b_sub": s1b_err["sub"],
                "s1b_ins": s1b_err["ins"],
                "s1b_del": s1b_err["del"],
                "s1b_edit_distance": s1b_err["edit_distance"],
                "s1b_per": round(s1b_err["per"], 4),
                "s2_pred_ipa": " ".join(s2_pred),
                "s2_sub": s2_err["sub"],
                "s2_ins": s2_err["ins"],
                "s2_del": s2_err["del"],
                "s2_edit_distance": s2_err["edit_distance"],
                "s2_per": round(s2_err["per"], 4),
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    elapsed = time.time() - t0

    def _median(vals: list[float]) -> float:
        s = sorted(vals)
        n = len(s)
        if n == 0:
            return 0.0
        mid = n // 2
        return s[mid] if n % 2 else (s[mid - 1] + s[mid]) / 2

    summary = {
        "eval_set_name": args.eval_set_name,
        "n_utterances_total": len(rows),
        "n_utterances_valid": len(utt_records),
        "n_skipped": n_skipped,
        "s1b_ckpt": str(args.s1b_ckpt),
        "s2_ckpt": str(args.s2_ckpt),
        "s1b_mean_per": round(sum(s1b_pers) / len(s1b_pers), 4) if s1b_pers else None,
        "s1b_median_per": round(_median(s1b_pers), 4),
        "s2_mean_per": round(sum(s2_pers) / len(s2_pers), 4) if s2_pers else None,
        "s2_median_per": round(_median(s2_pers), 4),
        "torch_version": torch.__version__,
        "transformers_version": __import__("transformers").__version__,
        "device": args.device,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "elapsed_sec": round(elapsed, 1),
    }
    summary_path = args.out.with_name(args.out.stem + "_summary.json")
    summary_text = json.dumps(summary, ensure_ascii=False, indent=2)
    summary_path.write_text(summary_text, encoding="utf-8")

    logger.info("완료: %s (%.1fs)", args.out, elapsed)
    logger.info("요약: %s", summary_path)
    logger.info(
        "s1b_mean_per=%.2f%% s2_mean_per=%.2f%%",
        summary["s1b_mean_per"] or 0.0,
        summary["s2_mean_per"] or 0.0,
    )


if __name__ == "__main__":
    main()
