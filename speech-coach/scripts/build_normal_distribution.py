#!/usr/bin/env python3
"""§6.4 정상 분포 reference 빌더.

음소별로 eGeMAPS Functionals(88차원)의 mean/std 통계를 수집해서
data/normal_distribution_ref.json 으로 저장한다.

OpenSmileAnalyzer 의 z-score 산출에 사용된다.

Usage:
    python scripts/build_normal_distribution.py \\
      --manifest /path/to/normal-utterances.jsonl \\
      --ckpt /path/to/checkpoints/stage1b-mix/final \\
      [--limit 1000]

Manifest entries:
    {"audio_path": "...wav", "target_phonemes": ["s","a"]}

체크포인트 + opensmile 둘 다 가용해야 의미 있는 통계가 생성된다.
하나라도 빠지면 placeholder를 쓰고 경고를 출력한다.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np
import torch

from speech_coach.data.ipa_vocab import PHONEME_TO_ID
from speech_coach.eval.normal_distribution import build_reference_placeholder


def load_manifest(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as fp:
        for line in fp:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def load_waveform(path: str) -> torch.Tensor:
    import torchaudio

    waveform, sr = torchaudio.load(path)
    if sr != 16000:
        waveform = torchaudio.functional.resample(waveform, sr, 16000)
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)
    return waveform.squeeze(0)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=False)
    parser.add_argument("--ckpt", type=Path, default=None)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "normal_distribution_ref.json",
    )
    args = parser.parse_args()

    if args.manifest is None:
        print("[warn] no --manifest provided — writing placeholder only", file=sys.stderr)
        build_reference_placeholder(args.out)
        print(f"Wrote placeholder {args.out}")
        return 0

    try:
        from speech_coach.models.forced_aligner import ForcedAligner
        from speech_coach.models.opensmile_analyzer import OpenSmileAnalyzer
        from speech_coach.models.phoneme_recognizer import PhonemeRecognizer
    except ImportError as e:
        print(f"[warn] required modules unavailable ({e}) — placeholder fallback", file=sys.stderr)
        build_reference_placeholder(args.out)
        return 0

    analyzer = OpenSmileAnalyzer()
    if not analyzer.is_active:
        print(
            "[warn] opensmile-python not installed — placeholder fallback. "
            'Install with `pip install -e ".[opensmile]"`',
            file=sys.stderr,
        )
        build_reference_placeholder(args.out)
        return 0

    if args.ckpt and (
        (args.ckpt / "model.safetensors").exists()
        or (args.ckpt / "pytorch_model.bin").exists()
    ):
        recognizer = PhonemeRecognizer.from_pretrained(str(args.ckpt), stub=False)
        print(f"[info] loaded recognizer from {args.ckpt}", file=sys.stderr)
    else:
        recognizer = PhonemeRecognizer.from_pretrained(None, stub=True)
        print("[warn] no checkpoint — stub recognizer (alignment will be approximate)", file=sys.stderr)

    aligner = ForcedAligner()

    rows = load_manifest(args.manifest)
    if args.limit:
        rows = rows[: args.limit]

    samples: dict[int, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    processed = 0
    skipped = 0

    for row in rows:
        try:
            audio_path = row["audio_path"]
            target = [str(p) for p in row.get("target_phonemes", [])]
            if not target:
                skipped += 1
                continue
            waveform = load_waveform(audio_path)
            _hyp, logits, _conf = recognizer.predict(waveform, target_phonemes=target)

            # logits shape (1, T, V) → (T, V); map target phonemes to ids
            frame_logits = logits.squeeze(0) if logits.ndim == 3 else logits
            target_ids = torch.tensor(
                [PHONEME_TO_ID.get(p, 0) for p in target],
                dtype=torch.long,
            )
            boundaries = aligner(frame_logits, target_ids)

            features = analyzer.analyze(waveform, boundaries)
            for entry in features["per_phoneme"]:
                idx = entry["phoneme_index"]
                for name, value in entry["features"].items():
                    if math.isfinite(value):
                        samples[idx][name].append(value)
            processed += 1
            if processed % 50 == 0:
                print(f"[info] {processed} samples processed", file=sys.stderr)
        except Exception as e:  # noqa: BLE001
            print(f"[warn] skip {row.get('audio_path')}: {e}", file=sys.stderr)
            skipped += 1

    if not samples:
        print("[error] no usable samples — keeping placeholder", file=sys.stderr)
        build_reference_placeholder(args.out)
        return 2

    ref: dict[str, Any] = {}
    for phoneme_idx, feat_map in samples.items():
        per_feat: dict[str, dict[str, float]] = {}
        for name, values in feat_map.items():
            if len(values) < 3:
                continue
            arr = np.asarray(values, dtype=np.float64)
            per_feat[name] = {
                "mean": float(arr.mean()),
                "std": float(arr.std(ddof=1) if arr.size > 1 else 0.0),
                "count": int(arr.size),
            }
        ref[str(phoneme_idx)] = per_feat

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(ref, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ok] wrote {args.out} ({processed} samples, {skipped} skipped)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
