#!/usr/bin/env python3
"""Preprocess text: noun extraction and token CSV export."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import (
    DATA_PROCESSED,
    DATA_RAW,
    ensure_dirs,
    load_csv_glob,
    load_stopwords,
    save_tokens_csv,
    tokenize_document,
)


def texts_from_news(df: pd.DataFrame) -> list[str]:
    return (df["title"].fillna("") + " " + df["body"].fillna("")).tolist()


def texts_from_papers(df: pd.DataFrame) -> list[str]:
    texts = df["title"].fillna("").astype(str)
    if "abstract" in df.columns:
        texts = texts + " " + df["abstract"].fillna("").astype(str)
    if "keywords" in df.columns:
        texts = texts + " " + df["keywords"].fillna("").astype(str)
    return texts.tolist()


def process_source(name: str, texts: list[str]) -> Path | None:
    if not texts:
        return None
    stop = load_stopwords()
    tokens = [tokenize_document(text, stop) for text in texts]
    return save_tokens_csv(tokens, name)


def main() -> int:
    ensure_dirs()
    stop = load_stopwords()

    news_df = load_csv_glob(DATA_RAW / "news")
    papers_df = load_csv_glob(DATA_RAW / "papers")

    if not news_df.empty:
        path = process_source("news", texts_from_news(news_df))
        print(f"News tokens -> {path}")

    if not papers_df.empty:
        path = process_source("papers", texts_from_papers(papers_df))
        print(f"Papers tokens -> {path}")

    if news_df.empty and papers_df.empty:
        print("No raw data found. Add CSV to data/raw/news or data/raw/papers")
        return 1

    print(f"Stopwords loaded: {len(stop)}")
    print(f"Processed dir: {DATA_PROCESSED}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
