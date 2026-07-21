#!/usr/bin/env python3
"""자체 모델(Wav2Vec2-CTC) vs Whisper large-v3 vs 상용 STT(Clova/Google) 비교.

## 왜 필요한가

상용 STT는 언어모델(LM)로 결과를 "그럴듯한 문장"으로 보정하는 경향이 있어,
무의미어(nonword)를 발음했을 때 조음 오류가 실제 단어로 은폐될 수 있다. 자체
Wav2Vec2-CTC 모델은 IPA를 직접 출력(LM 없음)하므로 이런 은폐가 상대적으로
적을 것이라는 가설을, 무의미어 테스트셋(`nonword_testset.csv` 기반 manifest)
으로 정량 검증한다.

## 정답(ground truth) 정의

manifest의 `target_phonemes`(g2p로 생성된, vocab 호환 리스트)를 세 모델 모두의
채점 기준으로 사용한다. CSV의 `target_ipa`(유성음 이음 포함 정밀 표기)는 참고용
으로만 함께 출력하고, PER 계산에는 쓰지 않는다 — b/d/g/dʑ/ɾ 등은 어느 모델도
낼 수 없는 기호라 채점 기준으로 쓰면 모두에게 불공정하게 불리해진다.

## corrected / concealed_error 플래그

- `corrected` (모든 모델·모든 condition): 예측 IPA가 target_phonemes와 정확히
  일치하지 않으면(edit distance > 0) True. "실제 단어로 교정되었는지"를 사전
  없이 판별할 수 없어, PER>0을 대리 지표로 쓴다.
- `concealed_error` (misart condition, 모델별): CSV `expected_error_types`에
  `(X→Y)` 형태의 명시적 치환 패턴이 있는 행에서만 계산한다 (40개 중 9개).
  Y(실제 오류음)가 예측 IPA에 없으면 그 오류를 "은폐"한 것으로 판정한다.
  패턴이 없는 행은 `null`로 남기고 killer_out 문서 하단에 수동 검토 후보로만
  나열한다 — 자동 오판정을 피하기 위함.

## 실행 예시

    python compare_models.py \\
        --manifest manifest.jsonl \\
        --own_ckpt /ckpt/stage2/final \\
        --out results/comparison.jsonl \\
        --summary_out results/summary.json \\
        --killer_out results/killer_examples.md \\
        --batch_size 8 \\
        --device cuda:0
"""

from __future__ import annotations

import argparse
import json
import logging
import random
import re
import sys
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch
from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).resolve().parent))
from providers.own import OwnModelProvider  # noqa: E402
from providers.whisper import WhisperProvider  # noqa: E402
from utils.g2p import text_to_ipa  # noqa: E402
from utils.per import compute_per_and_errors  # noqa: E402

logger = logging.getLogger("compare_models")

# 초성 자모 -> IPA (project g2p_ko.py의 _CHO_IPA와 동일한, 안정적인 한국어 음운표).
_CHO_IPA: dict[str, str] = {
    "ㄱ": "k", "ㄲ": "k͈", "ㄴ": "n", "ㄷ": "t", "ㄸ": "t͈", "ㄹ": "l", "ㅁ": "m",
    "ㅂ": "p", "ㅃ": "p͈", "ㅅ": "s", "ㅆ": "s͈", "ㅈ": "tɕ", "ㅉ": "tɕ͈",
    "ㅊ": "tɕʰ", "ㅋ": "kʰ", "ㅌ": "tʰ", "ㅍ": "pʰ", "ㅎ": "h",
}
_ARROW_RE = re.compile(r"\(([ㄱ-ㅎ])\s*→\s*([ㄱ-ㅎ])\)")


def set_seed(seed: int = 42) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def parse_error_arrow(note: str) -> tuple[str, str] | None:
    """"파열음화(ㅆ→ㄸ)" -> ("s͈", "t͈"). 패턴 없으면 None."""
    m = _ARROW_RE.search(note or "")
    if not m:
        return None
    from_jamo, to_jamo = m.group(1), m.group(2)
    from_ipa, to_ipa = _CHO_IPA.get(from_jamo), _CHO_IPA.get(to_jamo)
    if from_ipa is None or to_ipa is None:
        return None
    return from_ipa, to_ipa


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
    return wav


def resolve_commercial_provider(choice: str, retries: int):
    from providers.clova import ClovaProvider, is_configured as clova_configured
    from providers.google import GoogleProvider

    if choice == "clova":
        return "clova", ClovaProvider(retries=retries)
    if choice == "google":
        return "google", GoogleProvider(retries=retries)
    # auto
    if clova_configured():
        logger.info("CLOVA_INVOKE_URL 설정 감지 -> Clova 사용")
        return "clova", ClovaProvider(retries=retries)
    logger.info("Clova 미설정 -> Google STT로 폴백")
    return "google", GoogleProvider(retries=retries)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--manifest", type=Path, required=True)
    p.add_argument("--own_ckpt", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--summary_out", type=Path, required=True)
    p.add_argument("--killer_out", type=Path, required=True)
    p.add_argument("--batch_size", type=int, default=8)
    p.add_argument("--device", type=str, default="cuda:0")
    p.add_argument("--commercial_stt", choices=["auto", "clova", "google"], default="auto")
    p.add_argument("--commercial_retries", type=int, default=3)
    p.add_argument("--whisper_model", type=str, default="openai/whisper-large-v3")
    p.add_argument("--base_model", type=str, default="facebook/wav2vec2-xls-r-300m")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--verbose", action="store_true")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    set_seed(args.seed)

    rows = [json.loads(line) for line in args.manifest.read_text(encoding="utf-8").splitlines() if line.strip()]
    logger.info("manifest 로드: %d개 발화", len(rows))

    records: list[dict] = []
    audios: list[np.ndarray] = []
    for row in rows:
        target_phonemes = row.get("target_phonemes") or text_to_ipa(row.get("nonword", ""))
        if not target_phonemes:
            logger.warning("utt_id=%s: target_phonemes 비어 있음, 스킵", row.get("utt_id"))
            continue
        try:
            wav = load_audio(Path(row["audio_path"]))
        except (FileNotFoundError, OSError, RuntimeError) as e:
            logger.warning("utt_id=%s: 오디오 로드 실패 (%s), 스킵", row.get("utt_id"), e)
            continue
        records.append({"row": row, "target_phonemes": target_phonemes, "audio_path": Path(row["audio_path"])})
        audios.append(wav)

    logger.info("유효 발화: %d개", len(records))
    if not records:
        logger.error("유효한 발화가 없습니다.")
        sys.exit(1)

    logger.info("자체 모델 로드: %s", args.own_ckpt)
    own = OwnModelProvider(args.own_ckpt, args.device, args.base_model)
    logger.info("Whisper 로드: %s", args.whisper_model)
    whisper = WhisperProvider(args.device, args.whisper_model)
    commercial_name, commercial = resolve_commercial_provider(args.commercial_stt, args.commercial_retries)
    logger.info("상용 STT: %s", commercial_name)

    logger.info("자체 모델 추론 중...")
    own_preds = own.predict_batch(audios, args.batch_size)
    logger.info("Whisper 추론 중...")
    whisper_preds = whisper.predict_batch(audios, args.batch_size)

    logger.info("상용 STT(%s) 추론 중 (순차)...", commercial_name)
    commercial_preds = []
    for rec in tqdm(records, desc=f"infer[{commercial_name}]"):
        commercial_preds.append(commercial.predict_one(rec["audio_path"]))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.summary_out.parent.mkdir(parents=True, exist_ok=True)
    args.killer_out.parent.mkdir(parents=True, exist_ok=True)

    per_by_model_condition: dict[tuple[str, str], list[float]] = defaultdict(list)
    per_by_model_category: dict[tuple[str, str], list[float]] = defaultdict(list)
    corrected_by_model_condition: dict[tuple[str, str], list[bool]] = defaultdict(list)
    all_records: list[dict] = []

    with args.out.open("w", encoding="utf-8") as f:
        for rec, own_p, whisper_p, comm_p in zip(records, own_preds, whisper_preds, commercial_preds, strict=True):
            row = rec["row"]
            target_phonemes = rec["target_phonemes"]
            condition = row.get("condition", "unknown")
            category = row.get("category", "unknown")

            whisper_ipa = text_to_ipa(whisper_p.pred_text)
            comm_ipa = text_to_ipa(comm_p.pred_text) if not comm_p.error else []

            model_blocks = {}
            for name, pred_text, pred_ipa, elapsed, has_error in [
                ("own", own_p.pred_text, own_p.pred_ipa, own_p.elapsed_sec, False),
                ("whisper", whisper_p.pred_text, whisper_ipa, whisper_p.elapsed_sec, False),
                (commercial_name, comm_p.pred_text, comm_ipa, comm_p.elapsed_sec, bool(comm_p.error)),
            ]:
                if has_error:
                    block = {
                        "pred_text": pred_text,
                        "pred_ipa": "",
                        "per": None,
                        "corrected": None,
                        "elapsed_sec": elapsed,
                        "error": comm_p.error,
                    }
                else:
                    err = compute_per_and_errors(target_phonemes, pred_ipa)
                    corrected = err["edit_distance"] > 0
                    block = {
                        "pred_text": pred_text,
                        "pred_ipa": " ".join(pred_ipa),
                        "per": round(err["per"], 4),
                        "corrected": corrected,
                        "elapsed_sec": round(elapsed, 4),
                    }
                    per_by_model_condition[(name, condition)].append(err["per"])
                    per_by_model_category[(name, category)].append(err["per"])
                    corrected_by_model_condition[(name, condition)].append(corrected)
                model_blocks[name] = block

            parsed_error = parse_error_arrow(row.get("expected_error_types", "")) if condition == "misart" else None
            concealed_errors = {}
            if parsed_error is not None:
                _from_ipa, to_ipa = parsed_error
                for name in ("own", "whisper", commercial_name):
                    pred_ipa_str = model_blocks[name]["pred_ipa"]
                    if model_blocks[name].get("error"):
                        concealed_errors[name] = None
                    else:
                        concealed_errors[name] = to_ipa not in pred_ipa_str.split()
            else:
                concealed_errors = {name: None for name in ("own", "whisper", commercial_name)}

            record = {
                "utt_id": row.get("utt_id"),
                "target_ipa": row.get("target_ipa"),
                "target_phonemes": " ".join(target_phonemes),
                "nonword_hangul": row.get("nonword"),
                "category": category,
                "condition": condition,
                "expected_error_types": row.get("expected_error_types"),
                "parsed_error": {"from": parsed_error[0], "to": parsed_error[1]} if parsed_error else None,
                "own": model_blocks["own"],
                "whisper": model_blocks["whisper"],
                commercial_name: model_blocks[commercial_name],
                "concealed_error": concealed_errors,
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            all_records.append(record)

    # ---- summary ----
    def _mean(xs: list[float]) -> float | None:
        return round(sum(xs) / len(xs), 4) if xs else None

    per_condition_summary = {
        f"{model}|{cond}": _mean(vals) for (model, cond), vals in per_by_model_condition.items()
    }
    per_category_summary = {
        f"{model}|{cat}": {"mean": _mean(vals), "n": len(vals)} for (model, cat), vals in per_by_model_category.items()
    }
    correction_rate_summary = {
        f"{model}|{cond}": _mean([1.0 if c else 0.0 for c in vals])
        for (model, cond), vals in corrected_by_model_condition.items()
    }
    preservation_rate_summary = {k: round(1 - v, 4) if v is not None else None for k, v in correction_rate_summary.items()}

    summary = {
        "n_utterances": len(all_records),
        "commercial_provider": commercial_name,
        "per_by_model_and_condition": per_condition_summary,
        "per_by_model_and_category": per_category_summary,
        "correction_rate_by_model_and_condition": correction_rate_summary,
        "preservation_rate_by_model_and_condition": preservation_rate_summary,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    args.summary_out.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info("요약 저장: %s", args.summary_out)

    write_killer_examples(all_records, commercial_name, args.killer_out)
    logger.info("완료: %s / %s / %s", args.out, args.summary_out, args.killer_out)


def write_killer_examples(records: list[dict], commercial_name: str, out_path: Path) -> None:
    def fmt_row(r: dict) -> str:
        own, comm = r["own"], r[commercial_name]
        return (
            f"- **{r['utt_id']}** ({r['nonword_hangul']}, {r['category']}, {r['condition']})\n"
            f"  - target: `{r['target_phonemes']}`\n"
            f"  - own: `{own['pred_ipa']}` (PER {own['per']})\n"
            f"  - {commercial_name}: pred_text=\"{comm['pred_text']}\" -> `{comm['pred_ipa']}` "
            f"(PER {comm['per']})\n"
            f"  - expected_error_types: {r['expected_error_types']}\n"
        )

    crit1 = [
        r
        for r in records
        if r["condition"] == "normal"
        and r[commercial_name].get("per") is not None
        and r[commercial_name]["per"] >= 50.0
        and r["own"].get("per") == 0.0
    ]
    crit1.sort(key=lambda r: r[commercial_name]["per"], reverse=True)

    crit2 = [
        r
        for r in records
        if r["condition"] == "misart"
        and r["concealed_error"].get(commercial_name) is True
        and (r["own"].get("per") or 0.0) > 0.0
    ]
    crit2.sort(key=lambda r: (r["own"]["per"] - (r[commercial_name]["per"] or 0.0)), reverse=True)

    needs_review = [
        r
        for r in records
        if r["condition"] == "misart"
        and r["parsed_error"] is None
        and (r["own"].get("per") or 0.0) > (r[commercial_name].get("per") or 0.0)
    ]
    needs_review.sort(key=lambda r: (r["own"]["per"] - (r[commercial_name]["per"] or 0.0)), reverse=True)

    def _extend_or_none(target: list[str], items: list[dict]) -> None:
        if items:
            target.extend(fmt_row(r) for r in items)
        else:
            target.append("_해당 없음_\n")

    lines = ["# 킬링 예시\n"]
    lines.append("## 1. normal — 상용 오인식 vs 자체 정확 (자동 판정)\n")
    _extend_or_none(lines, crit1[:5])
    lines.append("\n## 2. misart — 상용이 오류 은폐, 자체는 검출 (자동 판정, (X→Y) 패턴 있는 행만)\n")
    _extend_or_none(lines, crit2[:5])
    lines.append(
        "\n## 3. 수동 검토 필요 (misart, expected_error_types에 (X→Y) 패턴 없어 자동 판정 불가)\n"
        "아래는 own PER이 상용 PER보다 높은 상위 후보일 뿐, 실제로 오류를 은폐했는지는 "
        "expected_error_types를 사람이 직접 읽고 확인해야 합니다.\n"
    )
    _extend_or_none(lines, needs_review[:10])

    out_path.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
