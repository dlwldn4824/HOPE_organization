#!/usr/bin/env python3
"""Import paper metadata from manual CSV exports (RISS/KCI/DBpia)."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import DATA_RAW, ensure_dirs, load_csv_glob

PAPERS_DIR = DATA_RAW / "papers"


def main() -> int:
    ensure_dirs()
    df = load_csv_glob(PAPERS_DIR)

    if df.empty:
        print(f"No CSV in {PAPERS_DIR}")
        print("Export papers from RISS/KCI/DBpia with columns: title, abstract, keywords, year")
        print("See data/raw/papers/sample_papers.csv for format.")
        return 1

    required = {"title", "abstract"}
    missing = required - set(df.columns)
    if missing:
        print(f"Missing columns: {missing}")
        return 1

    print(f"Loaded {len(df)} paper records from {PAPERS_DIR}")
    print(df[["title", "year"]].head() if "year" in df.columns else df[["title"]].head())
    return 0


if __name__ == "__main__":
    sys.exit(main())
