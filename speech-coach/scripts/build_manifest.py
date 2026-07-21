#!/usr/bin/env python3
"""무의미어 테스트셋 CSV + 화자별 녹음 wav를 병합해 평가용 manifest.jsonl 생성.

## 입력

- `--csv`: 컬럼 `id, category, nonword, target_ipa, target_phoneme,
  expected_error_types, notes`
- `--audio_root`: `spk{XX}/spk{XX}_{ID}_{condition}.wav` 구조의 디렉토리
  (예: `data/nonword_test/spk01/spk01_A01_normal.wav`, condition은
  `normal` / `misart` / `misart_st2pl` 등 자유 태그)

## 정답 음소 (target_phonemes)

CSV의 `target_ipa`는 유성음 이음(b/d/g/dʑ/ɾ 등)까지 반영한 정밀 표기라
Wav2Vec2 CTC 모델의 35토큰 vocab(무성 p/t/k, tɕ, l만 존재)과 호환되지
않는다. 그래서 이 스크립트는 `nonword`(한글) 컬럼을 `g2p_sentence`로
변환해 **vocab과 호환되는** `target_phonemes`(list)를 만들어 넣는다.
`target_ipa`/`target_phoneme`/`expected_error_types`/`notes`는 참고용
원본 그대로 유지한다.

## 실행 예시

    python build_manifest.py \\
        --csv nonword_testset.csv \\
        --audio_root data/nonword_test \\
        --out manifest.jsonl \\
        --speakers spk01,spk02,spk03,spk04,spk05,spk06

## 산출물

- `<out>`: 매칭된 발화들의 manifest.jsonl
- `<out과 같은 폴더>/missing_files.txt`: CSV에는 있으나 해당 화자 아래
  오디오가 하나도 없는 (speaker, id) 목록
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from pathlib import Path

import pandas as pd
import soundfile as sf

REPO_SRC = Path(__file__).resolve().parents[1] / "src"
if str(REPO_SRC) not in sys.path:
    sys.path.insert(0, str(REPO_SRC))

from speech_coach.data.g2p_ko import g2p_sentence  # noqa: E402

logger = logging.getLogger("build_manifest")

_FILENAME_RE = re.compile(r"^(spk\d{2})_([A-Za-z]\d+)_(.+)\.wav$", re.IGNORECASE)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--csv", type=Path, required=True)
    p.add_argument("--audio_root", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    p.add_argument(
        "--speakers",
        type=str,
        default="spk01,spk02,spk03,spk04,spk05,spk06",
        help="쉼표 구분 화자 목록 (기본 spk01~spk06)",
    )
    p.add_argument("--verbose", action="store_true")
    return p.parse_args()


def load_csv(path: Path) -> dict[str, dict]:
    df = pd.read_csv(path, dtype=str).fillna("")
    required = {"id", "category", "nonword", "target_ipa", "target_phoneme", "expected_error_types", "notes"}
    missing_cols = required - set(df.columns)
    if missing_cols:
        raise ValueError(f"CSV에 필수 컬럼 누락: {missing_cols}")
    return {row["id"]: row.to_dict() for _, row in df.iterrows()}


def scan_audio(audio_root: Path, speakers: list[str]) -> list[dict]:
    """speaker 디렉토리를 스캔해 파일명 규칙에 맞는 wav만 (speaker, id, condition, path)로 반환."""
    found: list[dict] = []
    for speaker in speakers:
        spk_dir = audio_root / speaker
        if not spk_dir.is_dir():
            logger.warning("화자 디렉토리 없음: %s", spk_dir)
            continue
        for wav_path in sorted(spk_dir.glob("*.wav")):
            m = _FILENAME_RE.match(wav_path.name)
            if not m:
                logger.warning("파일명 규칙 위반, 스킵: %s", wav_path.name)
                continue
            file_speaker, utt_id, condition = m.group(1), m.group(2), m.group(3)
            if file_speaker.lower() != speaker.lower():
                logger.warning(
                    "파일명의 화자(%s)가 디렉토리(%s)와 다름, 스킵: %s", file_speaker, speaker, wav_path
                )
                continue
            found.append({"speaker": speaker, "id": utt_id, "condition": condition, "path": wav_path})
    return found


def main() -> None:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    speakers = [s.strip() for s in args.speakers.split(",") if s.strip()]

    csv_rows = load_csv(args.csv)
    logger.info("CSV 로드: %d개 항목 (%s)", len(csv_rows), args.csv)

    audio_files = scan_audio(args.audio_root, speakers)
    logger.info("오디오 스캔: %d개 wav 매칭됨 (화자 %s)", len(audio_files), speakers)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    matched_ids: set[tuple[str, str]] = set()
    n_written = 0
    n_audio_without_csv = 0

    with args.out.open("w", encoding="utf-8") as f:
        for entry in audio_files:
            utt_id = entry["id"]
            if utt_id not in csv_rows:
                logger.warning("오디오는 있으나 CSV에 없는 id: %s (%s)", utt_id, entry["path"])
                n_audio_without_csv += 1
                continue

            row = csv_rows[utt_id]

            try:
                duration = sf.info(str(entry["path"])).duration
            except (RuntimeError, OSError) as e:
                logger.warning("오디오 duration 읽기 실패, 스킵: %s (%s)", entry["path"], e)
                continue

            target_phonemes = g2p_sentence(row["nonword"])
            record = {
                "utt_id": f"{entry['speaker']}_{utt_id}_{entry['condition']}",
                "audio_path": str(entry["path"].resolve()),
                "speaker": entry["speaker"],
                "nonword": row["nonword"],
                "category": row["category"],
                "condition": entry["condition"],
                "target_ipa": row["target_ipa"],
                "target_phonemes": target_phonemes,
                "target_phoneme": row["target_phoneme"],
                "expected_error_types": row["expected_error_types"],
                "notes": row["notes"],
                "duration_sec": round(duration, 4),
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            n_written += 1
            matched_ids.add((entry["speaker"], utt_id))

    # CSV에는 있지만 해당 화자 아래 오디오가 하나도 없는 (speaker, id) 조합
    missing: list[str] = []
    for speaker in speakers:
        for utt_id in csv_rows:
            if (speaker, utt_id) not in matched_ids:
                missing.append(f"{speaker}\t{utt_id}\t{csv_rows[utt_id]['nonword']}")

    missing_path = args.out.parent / "missing_files.txt"
    missing_path.write_text("\n".join(missing) + ("\n" if missing else ""), encoding="utf-8")

    logger.info("완료: %s (%d줄)", args.out, n_written)
    logger.info(
        "missing_files.txt: %s (%d건, CSV에는 있으나 해당 화자 오디오 없음)", missing_path, len(missing)
    )
    if n_audio_without_csv:
        logger.warning("CSV에 없는 id로 스킵된 오디오: %d개", n_audio_without_csv)


if __name__ == "__main__":
    main()
