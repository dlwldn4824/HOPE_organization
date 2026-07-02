#!/usr/bin/env python3
"""Verify Python dependencies and KoNLPy availability."""

from __future__ import annotations

import importlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import ROOT, ensure_dirs, extract_nouns, load_stopwords

REQUIRED = [
    "pandas",
    "yaml",
    "sklearn",
    "gensim",
    "networkx",
    "matplotlib",
    "wordcloud",
    "requests",
    "bs4",
    "feedparser",
]


def main() -> int:
    ensure_dirs()
    print(f"ROOT: {ROOT}")

    missing = []
    for name in REQUIRED:
        try:
            importlib.import_module(name if name != "yaml" else "yaml")
            print(f"  OK  {name}")
        except ImportError:
            missing.append(name)
            print(f"  MISSING  {name}")

    try:
        import konlpy  # noqa: F401

        print("  OK  konlpy")
        konlpy_ok = True
    except ImportError:
        print("  MISSING  konlpy (fallback tokenizer will be used)")
        konlpy_ok = False

    sample = "언어치료를 받는 아동과 부모의 가정 연습이 중요합니다."
    nouns = extract_nouns(sample)
    stop = load_stopwords()
    filtered = [n for n in nouns if n not in stop]
    print(f"Sample nouns: {filtered}")

    if missing:
        print("\nInstall: pip install -r requirements.txt")
        return 1

    print("\nSetup check passed.", "(KoNLPy OK)" if konlpy_ok else "(KoNLPy fallback mode)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
