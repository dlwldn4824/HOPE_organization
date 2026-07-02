#!/usr/bin/env python3
"""Stub for public data — place downloaded CSV in data/raw/public/."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import DATA_RAW, ensure_dirs, load_csv_glob

PUBLIC_DIR = DATA_RAW / "public"

SOURCES = """
수동 다운로드 권장:
- 보건복지부 발달재활서비스 (data.go.kr)
- 건강보험심사평가원 언어재활 통계
- KOSIS 장애아동 통계
- 장애인개발원 발달재활 통계

CSV 컬럼 예시: year, region, institutions, users, support_amount
샘플: data/raw/public/sample_language_rehab.csv
"""


def main() -> int:
    ensure_dirs()
    df = load_csv_glob(PUBLIC_DIR)

    if df.empty:
        print(SOURCES)
        return 1

    print(f"Loaded {len(df)} public data rows from {PUBLIC_DIR}")
    print(df.head())
    return 0


if __name__ == "__main__":
    sys.exit(main())
