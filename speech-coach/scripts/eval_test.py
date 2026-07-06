#!/usr/bin/env python3
"""음소 인식기를 manifest에 대해 평가하고 PER을 보고한다.

설계서 §7 통과 기준:
- D1(KsponSpeech) test split PER ≤ 25 %
- D2(AIHub 어린이 음성) test split PER ≤ 35 %

Usage (PhonemeRecognizer, utterance 단위):
    python scripts/eval_test.py \\
      --manifest /path/to/test.jsonl \\
      --ckpt /path/to/checkpoints/stage1b-mix/final \\
      [--limit 500] \\
      [--report-target 0.25]

Usage (Wav2Vec2-CTC 배치, 학습 val/test용):
    python scripts/eval_test.py \\
      --backend ctc \\
      --manifest ../data/manifests/stage1b_val.jsonl \\
      --ckpt checkpoints/stage1b-mix/final \\
      --repo_root .. \\
      [--output eval_val.json]

Manifest entry shape:
    {"audio_path": "...wav", "target_phonemes": ["s","a"]}
또는
    {"audio_path": "...wav", "transcript": "사과"}  # g2p_ko 로 자동 변환

recognizer 백엔드에서 체크포인트가 없으면 PhonemeRecognizerStub 모드로 동작한다.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import torch

from speech_coach.data.hope_paths import HOPE_ROOT
from speech_coach.eval.ctc_eval import evaluate_manifest, save_eval_report
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


def run_recognizer_eval(args: argparse.Namespace) -> int:
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
    print("=== PER report (recognizer) ===")
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


def run_ctc_eval(args: argparse.Namespace) -> int:
    if args.ckpt is None:
        print("[error] --ckpt is required for --backend ctc", file=sys.stderr)
        return 2

    report = evaluate_manifest(
        args.ckpt,
        args.manifest,
        repo_root=args.repo_root,
        batch_size=args.batch_size,
        max_samples=args.limit or None,
        device=args.device,
    )

    print()
    print("=== PER report (ctc) ===")
    print(f"samples evaluated : {report.num_utterances}")
    print(f"total edits       : {report.num_errors}")
    print(f"ref phonemes      : {report.num_ref_phonemes}")
    print(f"PER               : {report.per:.4f}  ({report.per_percent} %)")
    print(f"manifest          : {report.manifest}")
    print(f"checkpoint        : {report.checkpoint}")

    if args.output is not None:
        save_eval_report(report, args.output)
        print(f"saved             : {args.output}")

    if args.report_target is not None:
        passed = report.per <= args.report_target
        marker = "PASS" if passed else "FAIL"
        print(f"target            : {args.report_target:.4f}  → {marker}")
        if not passed:
            return 1

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate phoneme recognizer PER on a manifest.")
    parser.add_argument("--manifest", type=Path, required=True, help="JSONL test manifest")
    parser.add_argument("--ckpt", type=Path, default=None, help="Checkpoint directory")
    parser.add_argument(
        "--backend",
        choices=("recognizer", "ctc"),
        default="recognizer",
        help="recognizer=PhonemeRecognizer loop, ctc=batched Wav2Vec2-CTC",
    )
    parser.add_argument("--repo_root", type=Path, default=HOPE_ROOT, help="ctc: manifest audio_path root")
    parser.add_argument("--output", type=Path, default=None, help="ctc: write JSON report")
    parser.add_argument("--batch_size", type=int, default=4, help="ctc: eval batch size")
    parser.add_argument("--device", type=str, default=None, help="ctc: cpu | cuda (default auto)")
    parser.add_argument("--limit", type=int, default=0, help="Optional cap on samples")
    parser.add_argument(
        "--report-target",
        type=float,
        default=None,
        help="Optional PER target (0~1). Exit 1 if exceeded — useful for CI gates.",
    )
    args = parser.parse_args()

    if args.backend == "ctc":
        return run_ctc_eval(args)
    return run_recognizer_eval(args)


if __name__ == "__main__":
    raise SystemExit(main())
