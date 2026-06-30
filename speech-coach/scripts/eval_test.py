#!/usr/bin/env python3
"""음소 인식기를 manifest에 대해 평가하고 PER을 보고한다.

설계서 §7 통과 기준:
- D1(KsponSpeech) test split PER ≤ 25 %
- D2(AIHub 어린이 음성) test split PER ≤ 35 %

Usage:
    python scripts/eval_test.py \\
      --manifest /path/to/test.jsonl \\
      --ckpt /path/to/checkpoints/stage1b-mix/final \\
      [--limit 500] \\
      [--report-target 0.25]

Manifest entry shape:
    {"audio_path": "...wav", "target_phonemes": ["s","a"]}
또는
    {"audio_path": "...wav", "transcript": "사과"}  # g2p_ko 로 자동 변환

체크포인트가 없으면 PhonemeRecognizerStub 모드로 동작하고 stub임을 출력한다.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import torch

from speech_coach.eval.metrics import _edit_distance, phoneme_error_rate


def load_manifest(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as fp:
        for line in fp:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def resolve_target(row: dict) -> list[str]:
    if "target_phonemes" in row and isinstance(row["target_phonemes"], list):
        return [str(p) for p in row["target_phonemes"]]
    transcript = row.get("transcript") or row.get("text")
    if transcript:
        try:
            from speech_coach.data.g2p_ko import korean_to_ipa

            return list(korean_to_ipa(str(transcript)))
        except Exception:  # noqa: BLE001
            return []
    return []


def load_recognizer(ckpt_path: Path | None):
    from speech_coach.models.phoneme_recognizer import PhonemeRecognizer

    if ckpt_path and (
        (ckpt_path / "model.safetensors").exists()
        or (ckpt_path / "pytorch_model.bin").exists()
    ):
        print(f"[info] loading checkpoint from {ckpt_path}", file=sys.stderr)
        return PhonemeRecognizer.from_pretrained(str(ckpt_path), stub=False), False
    print("[warn] no checkpoint — falling back to PhonemeRecognizerStub", file=sys.stderr)
    return PhonemeRecognizer.from_pretrained(None, stub=True), True


def load_waveform(path: str) -> torch.Tensor:
    """16kHz mono float32 tensor (samples,)."""
    import torchaudio

    waveform, sr = torchaudio.load(path)
    if sr != 16000:
        waveform = torchaudio.functional.resample(waveform, sr, 16000)
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)
    return waveform.squeeze(0)


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate phoneme recognizer PER on a manifest.")
    parser.add_argument("--manifest", type=Path, required=True, help="JSONL test manifest")
    parser.add_argument("--ckpt", type=Path, default=None, help="Checkpoint directory")
    parser.add_argument("--limit", type=int, default=0, help="Optional cap on samples")
    parser.add_argument(
        "--report-target",
        type=float,
        default=None,
        help="Optional PER target (0~1). Exit 1 if exceeded — useful for CI gates.",
    )
    args = parser.parse_args()

    rows = load_manifest(args.manifest)
    if args.limit:
        rows = rows[: args.limit]
    if not rows:
        print("[error] manifest is empty", file=sys.stderr)
        return 2

    recognizer, is_stub = load_recognizer(args.ckpt)

    refs: list[list[str]] = []
    hyps: list[list[str]] = []
    per_sample_errors: list[int] = []
    skipped = 0
    started = time.time()

    for idx, row in enumerate(rows):
        ref = resolve_target(row)
        if not ref or "audio_path" not in row:
            skipped += 1
            continue
        try:
            waveform = load_waveform(row["audio_path"])
            hyp, _logits, _conf = recognizer.predict(waveform, target_phonemes=ref)
        except Exception as e:  # noqa: BLE001
            print(f"[warn] skip {row.get('audio_path')}: {e}", file=sys.stderr)
            skipped += 1
            continue

        refs.append(ref)
        hyps.append(list(hyp))
        per_sample_errors.append(_edit_distance(ref, list(hyp)))

        if (idx + 1) % 50 == 0:
            elapsed = time.time() - started
            print(f"[info] {idx + 1}/{len(rows)} processed in {elapsed:.1f}s", file=sys.stderr)

    if not refs:
        print("[error] no samples evaluated", file=sys.stderr)
        return 2

    per = phoneme_error_rate(refs, hyps)
    total_ref = sum(len(r) for r in refs)
    total_errs = sum(per_sample_errors)
    avg_ref_len = total_ref / len(refs)

    print()
    print("=== PER report ===")
    print(f"samples evaluated : {len(refs)}")
    print(f"samples skipped   : {skipped}")
    print(f"avg ref length    : {avg_ref_len:.2f}")
    print(f"total edits       : {total_errs}")
    print(f"PER               : {per:.4f}  ({per * 100:.2f} %)")
    print(f"mode              : {'STUB' if is_stub else 'real-checkpoint'}")

    if args.report_target is not None:
        passed = per <= args.report_target
        marker = "PASS" if passed else "FAIL"
        print(f"target            : {args.report_target:.4f}  → {marker}")
        if not passed:
            return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
