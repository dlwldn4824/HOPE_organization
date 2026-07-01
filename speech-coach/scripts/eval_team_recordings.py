#!/usr/bin/env python3
"""팀원 녹음 파일(파일명 불일치)을 정규화해 HOPE Speech API로 일괄 평가."""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from dataclasses import dataclass
from pathlib import Path

# (ok_word, err_word, romanization aliases for ok/err)
WORD_PAIRS: list[tuple[str, str, tuple[str, ...], tuple[str, ...]]] = [
    ("사과", "다과", ("apple",), ("apple_err",)),  # apple_err handled via label in name
    ("자두", "차두", ("jadu",), ()),
    ("바다", "파다", ("bada", "pada"), ("풀",)),  # 풀 = 파다 오타
    ("소리", "도리", ("see", "sori"), ()),
    ("가방", "카방", ("gabang", "kabang"), ()),
    ("불", "물", ("bul",), ()),
]

OK_WORDS = {pair[0] for pair in WORD_PAIRS}
ERR_WORDS = {pair[1] for pair in WORD_PAIRS}
WORD_TO_TARGET: dict[str, str] = {}
ALIAS_TO_WORD: dict[str, str] = {}
for ok, err, ok_aliases, err_aliases in WORD_PAIRS:
    WORD_TO_TARGET[ok] = ok
    WORD_TO_TARGET[err] = ok
    for alias in ok_aliases:
        ALIAS_TO_WORD[alias.lower()] = ok
    for alias in err_aliases:
        ALIAS_TO_WORD[alias.lower()] = err


@dataclass
class ParsedFile:
    speaker: str
    source_path: Path
    spoken_word: str
    target_word: str
    label: str  # ok | err
    pair: str
    trial: int
    parse_method: str


def _nfc(text: str) -> str:
    return unicodedata.normalize("NFC", text.strip())


def _normalize_stem(name: str) -> str:
    stem = _nfc(Path(name).stem)
    stem = stem.replace("_", " ")
    stem = re.sub(r"\s+", " ", stem)
    return stem


def _parse_romanized(stem: str) -> tuple[str, str, int, str] | None:
    """apple_ok_1, see_err_2, jadu_ok_3"""
    raw = Path(stem).stem if "/" in stem else stem
    raw = raw.replace(" ", "")
    m = re.match(r"^([a-zA-Z]+)_(ok|err)_(\d+)$", raw, re.I)
    if not m:
        return None
    raw_word, label, trial = m.group(1).lower(), m.group(2).lower(), int(m.group(3))
    spoken: str | None = None
    for ok, err, ok_aliases, _ in WORD_PAIRS:
        if raw_word in {a.lower() for a in ok_aliases}:
            spoken = ok if label == "ok" else err
            break
    if spoken is None:
        return None
    target = WORD_TO_TARGET[spoken]
    pair = f"{target}/{next(e for o, e, _, _ in WORD_PAIRS if o == target)}"
    return spoken, target, trial, pair


def _pair_for_ok_word(ok_word: str) -> tuple[str, str]:
    for ok, err, _, _ in WORD_PAIRS:
        if ok == ok_word:
            return ok, err
    raise KeyError(ok_word)


def _parse_korean(stem: str) -> tuple[str, str, int, str] | None:
    """사과 1, 사과1, 물.m4a, 가방_err_1, 소리 err 2"""
    cleaned = _nfc(stem.replace("_", " "))
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    # pair-side naming: 가방_ok_1 / 소리 err 2 → ok word 기준 err 녹음은 err_word
    m_side = re.match(r"^(.+?)\s*(ok|err)\s*(\d+)$", cleaned, re.I)
    if m_side:
        anchor, side, trial = _nfc(m_side.group(1)), m_side.group(2).lower(), int(m_side.group(3))
        if anchor in OK_WORDS:
            ok, err = _pair_for_ok_word(anchor)
            spoken = ok if side == "ok" else err
            pair = f"{ok}/{err}"
            return spoken, ok, trial, pair

    m_num = re.match(r"^(.+?)\s*(\d+)$", cleaned)
    if m_num:
        word_raw, trial = _nfc(m_num.group(1)), int(m_num.group(2))
    else:
        word_raw, trial = cleaned, 1

    word = _nfc(word_raw)
    if word in ALIAS_TO_WORD:
        word = ALIAS_TO_WORD[word]

    if word in OK_WORDS or word in ERR_WORDS:
        target = WORD_TO_TARGET[word]
        pair = f"{target}/{next(e for o, e, _, _ in WORD_PAIRS if o == target)}"
        return word, target, trial, pair

    return None


def parse_file(speaker: str, path: Path) -> ParsedFile | None:
    raw_stem = _nfc(path.stem)
    parsed = _parse_romanized(raw_stem) or _parse_korean(_normalize_stem(path.name))
    if parsed is None:
        return None
    spoken, target, trial, pair = parsed
    label = "ok" if spoken in OK_WORDS else "err"
    method = "romanized" if _parse_romanized(raw_stem) else "korean"
    return ParsedFile(
        speaker=speaker,
        source_path=path,
        spoken_word=spoken,
        target_word=target,
        label=label,
        pair=pair,
        trial=trial,
        parse_method=method,
    )


def discover_speaker_dirs(root: Path) -> list[tuple[str, Path]]:
    dirs: list[tuple[str, Path]] = []
    if not root.exists():
        return dirs
    for child in sorted(root.iterdir()):
        if not child.is_dir():
            continue
        try:
            audio_dir = child
            if (child / "음성").is_dir():
                audio_dir = child / "음성"
        except OSError:
            continue
        dirs.append((child.name, audio_dir))
    return dirs


def to_wav_16k(src: Path, out_dir: Path) -> Path:
    out = out_dir / f"{src.stem}.wav"
    if src.suffix.lower() == ".wav":
        shutil.copy2(src, out)
        return out
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        subprocess.run(
            [ffmpeg, "-y", "-i", str(src), "-ar", "16000", "-ac", "1", "-f", "wav", str(out)],
            check=True,
            capture_output=True,
        )
        return out
    afconvert = shutil.which("afconvert")
    if afconvert:
        subprocess.run(
            [afconvert, "-f", "WAVE", "-d", "LEI16@16000", str(src), str(out)],
            check=True,
            capture_output=True,
        )
        return out
    raise RuntimeError(f"오디오 변환 도구 없음 (ffmpeg/afconvert): {src}")


_pipeline = None


def get_local_pipeline():
    global _pipeline
    if _pipeline is None:
        import os

        from speech_coach.serving.pipeline import InferencePipeline

        ckpt = os.environ.get("HOPE_CKPT_DIR", "/root/hope/checkpoints/stage1b-mix/final")
        _pipeline = InferencePipeline.from_checkpoint(ckpt)
    return _pipeline


def call_analyze_direct(wav_path: Path, target_word: str) -> dict:
    from speech_coach.serving.form_parsers import parse_target_phonemes

    phones = parse_target_phonemes("", target_word)
    out = get_local_pipeline()(wav_path.read_bytes(), target_word, phones)
    d = out.model_dump()
    return d


def call_analyze(api_base: str, wav_path: Path, target_word: str) -> dict:
    curl = shutil.which("curl")
    if curl is None:
        raise RuntimeError("curl 이 필요합니다.")
    cmd = [
        curl,
        "-sS",
        "-X",
        "POST",
        f"{api_base.rstrip('/')}/v1/utterance/analyze",
        "-F",
        f"audio=@{wav_path}",
        "-F",
        f"target_word={target_word}",
    ]
    proc = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return json.loads(proc.stdout)


def best_threshold(rows: list[dict]) -> tuple[float, float]:
    scores = sorted({float(r["pcc"]) for r in rows})
    if len(scores) < 2:
        return 50.0, 0.0
    best_t, best_acc = 50.0, 0.0
    for i in range(len(scores) - 1):
        t = (scores[i] + scores[i + 1]) / 2
        ok = [r for r in rows if r["label"] == "ok"]
        err = [r for r in rows if r["label"] == "err"]
        correct = sum(1 for r in ok if r["pcc"] >= t) + sum(1 for r in err if r["pcc"] < t)
        acc = correct / len(rows)
        if acc >= best_acc:
            best_acc, best_t = acc, t
    return best_t, best_acc


def main() -> int:
    parser = argparse.ArgumentParser(description="팀 녹음 → HOPE API 일괄 PCC 평가")
    parser.add_argument(
        "--recordings-root",
        type=Path,
        nargs="*",
        default=[],
        help="팀원 폴더들이 있는 경로 (이름/음성/*.wav)",
    )
    parser.add_argument(
        "--extra-dir",
        action="append",
        default=[],
        help="speaker_name=path 형식으로 개별 폴더 추가",
    )
    parser.add_argument(
        "--api-base",
        default="https://go-neung.activejang.com",
        help="Speech API base URL (--direct 일 때 무시)",
    )
    parser.add_argument(
        "--direct",
        action="store_true",
        help="HTTP 없이 DGX 로컬 InferencePipeline 직접 호출",
    )
    parser.add_argument("--max-trial", type=int, default=3, help="trial 번호 상한 (기본 3)")
    parser.add_argument("--output", type=Path, default=Path("eval_team_results.csv"))
    parser.add_argument("--summary", type=Path, default=Path("eval_team_summary.json"))
    args = parser.parse_args()

    speaker_dirs: list[tuple[str, Path]] = []
    for root in args.recordings_root:
        speaker_dirs.extend(discover_speaker_dirs(root))
    for item in args.extra_dir:
        name, _, path_str = item.partition("=")
        speaker_dirs.append((name, Path(path_str)))

    audio_ext = {".wav", ".m4a", ".mp3"}
    parsed_all: list[ParsedFile] = []
    unparsed: list[tuple[str, Path]] = []

    for speaker, folder in speaker_dirs:
        if not folder.exists():
            print(f"[WARN] 폴더 없음: {speaker} -> {folder}", file=sys.stderr)
            continue
        for path in sorted(folder.iterdir()):
            if path.suffix.lower() not in audio_ext or path.name.startswith("."):
                continue
            item = parse_file(speaker, path)
            if item is None:
                unparsed.append((speaker, path))
                continue
            if item.trial > args.max_trial:
                continue
            parsed_all.append(item)

    if not parsed_all:
        print("파싱된 파일이 없습니다.", file=sys.stderr)
        return 1

    rows: list[dict] = []
    with tempfile.TemporaryDirectory(prefix="hope_eval_") as tmp:
        tmp_dir = Path(tmp)
        for i, item in enumerate(parsed_all, 1):
            print(f"[{i}/{len(parsed_all)}] {item.speaker} {item.source_path.name} -> target={item.target_word} ({item.label})")
            try:
                wav = to_wav_16k(item.source_path, tmp_dir)
                if args.direct:
                    result = call_analyze_direct(wav, item.target_word)
                else:
                    result = call_analyze(args.api_base, wav, item.target_word)
                rows.append(
                    {
                        "speaker": item.speaker,
                        "file": item.source_path.name,
                        "spoken_word": item.spoken_word,
                        "target_word": item.target_word,
                        "label": item.label,
                        "pair": item.pair,
                        "trial": item.trial,
                        "pcc": result.get("pcc"),
                        "model_version": result.get("model_version"),
                        "latency_ms": result.get("latency_ms"),
                        "parse_method": item.parse_method,
                    }
                )
            except (subprocess.CalledProcessError, RuntimeError, json.JSONDecodeError) as exc:
                rows.append(
                    {
                        "speaker": item.speaker,
                        "file": item.source_path.name,
                        "spoken_word": item.spoken_word,
                        "target_word": item.target_word,
                        "label": item.label,
                        "pair": item.pair,
                        "trial": item.trial,
                        "pcc": None,
                        "error": str(exc),
                        "parse_method": item.parse_method,
                    }
                )

    valid = [r for r in rows if r.get("pcc") is not None]
    threshold, threshold_acc = best_threshold(valid) if valid else (0.0, 0.0)

    by_speaker: dict[str, dict] = {}
    for spk in sorted({r["speaker"] for r in valid}):
        spk_rows = [r for r in valid if r["speaker"] == spk]
        ok_pcc = [r["pcc"] for r in spk_rows if r["label"] == "ok"]
        err_pcc = [r["pcc"] for r in spk_rows if r["label"] == "err"]
        by_speaker[spk] = {
            "count": len(spk_rows),
            "ok_mean_pcc": round(sum(ok_pcc) / len(ok_pcc), 2) if ok_pcc else None,
            "err_mean_pcc": round(sum(err_pcc) / len(err_pcc), 2) if err_pcc else None,
            "gap": round((sum(ok_pcc) / len(ok_pcc)) - (sum(err_pcc) / len(err_pcc)), 2)
            if ok_pcc and err_pcc
            else None,
            "accuracy_at_best_threshold": round(
                (
                    sum(1 for r in spk_rows if r["label"] == "ok" and r["pcc"] >= threshold)
                    + sum(1 for r in spk_rows if r["label"] == "err" and r["pcc"] < threshold)
                )
                / len(spk_rows),
                3,
            ),
        }

    by_pair: dict[str, dict] = {}
    for pair in sorted({r["pair"] for r in valid}):
        pair_rows = [r for r in valid if r["pair"] == pair]
        ok_pcc = [r["pcc"] for r in pair_rows if r["label"] == "ok"]
        err_pcc = [r["pcc"] for r in pair_rows if r["label"] == "err"]
        by_pair[pair] = {
            "ok_mean_pcc": round(sum(ok_pcc) / len(ok_pcc), 2) if ok_pcc else None,
            "err_mean_pcc": round(sum(err_pcc) / len(err_pcc), 2) if err_pcc else None,
            "count": len(pair_rows),
        }

    summary = {
        "api_base": "direct-pipeline" if args.direct else args.api_base,
        "total_parsed": len(parsed_all),
        "total_evaluated": len(valid),
        "total_errors": len(rows) - len(valid),
        "unparsed_files": [{"speaker": s, "file": p.name} for s, p in unparsed],
        "overall_ok_mean_pcc": round(
            sum(r["pcc"] for r in valid if r["label"] == "ok") / max(1, sum(1 for r in valid if r["label"] == "ok")),
            2,
        ),
        "overall_err_mean_pcc": round(
            sum(r["pcc"] for r in valid if r["label"] == "err") / max(1, sum(1 for r in valid if r["label"] == "err")),
            2,
        ),
        "best_pcc_threshold": threshold,
        "accuracy_at_best_threshold": round(threshold_acc, 3),
        "by_speaker": by_speaker,
        "by_pair": by_pair,
        "model_version": valid[0].get("model_version") if valid else None,
    }

    fieldnames = sorted({k for r in rows for k in r})
    with args.output.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    args.summary.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n=== 요약 ===")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"\nCSV: {args.output.resolve()}")
    print(f"Summary: {args.summary.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
