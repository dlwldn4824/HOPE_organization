#!/usr/bin/env python3
"""Run full pipeline 00-09 in order."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

SCRIPTS = [
    "00_setup_check.py",
    "02_collect_papers.py",
    "03_collect_public.py",
    "04_preprocess.py",
    "05_tfidf_keywords.py",
    "06_lda_topics.py",
    "07_network_analysis.py",
    "08_public_viz.py",
    "09_cross_compare.py",
]


def main() -> int:
    root = Path(__file__).resolve().parent
    for name in SCRIPTS:
        path = root / name
        print(f"\n=== {name} ===")
        result = subprocess.run([sys.executable, str(path)], cwd=root.parent)
        if result.returncode != 0 and name not in ("02_collect_papers.py", "03_collect_public.py"):
            return result.returncode
    print("\nPipeline complete. Check outputs/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
