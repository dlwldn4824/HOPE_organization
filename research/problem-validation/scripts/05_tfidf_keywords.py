#!/usr/bin/env python3
"""TF-IDF top keywords and word cloud from preprocessed tokens."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from wordcloud import WordCloud

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import (
    DATA_PROCESSED,
    OUTPUT_FIGURES,
    OUTPUT_TABLES,
    ensure_dirs,
    load_keywords_config,
    resolve_korean_font_path,
)


def run_tfidf(tokens_path: Path, source: str) -> pd.DataFrame:
    df = pd.read_csv(tokens_path)
    docs = df["tokens"].fillna("").tolist()
    if not docs:
        return pd.DataFrame()

    config = load_keywords_config()
    top_n = config.get("tfidf", {}).get("top_n", 30)

    vectorizer = TfidfVectorizer(token_pattern=r"(?u)\b\w+\b")
    matrix = vectorizer.fit_transform(docs)
    scores = matrix.sum(axis=0).A1
    terms = vectorizer.get_feature_names_out()
    ranking = sorted(zip(terms, scores), key=lambda x: x[1], reverse=True)[:top_n]

    out = pd.DataFrame(ranking, columns=["keyword", "tfidf_score"])
    out["source"] = source
    table_path = OUTPUT_TABLES / f"{source}_tfidf_top{top_n}.csv"
    out.to_csv(table_path, index=False, encoding="utf-8-sig")
    print(f"TF-IDF table -> {table_path}")

    freq = {term: float(score) for term, score in ranking}
    font_path = resolve_korean_font_path()
    if not font_path:
        print("Warning: Korean font not found; word cloud may show broken glyphs.")

    wc = WordCloud(
        width=1200,
        height=600,
        background_color="white",
        font_path=font_path,
        collocations=False,
        prefer_horizontal=0.85,
    ).generate_from_frequencies(freq)

    fig_path = OUTPUT_FIGURES / f"{source}_wordcloud.png"
    wc.to_file(str(fig_path))
    print(f"Word cloud -> {fig_path} (font: {font_path or 'default'})")
    return out


def main() -> int:
    ensure_dirs()
    token_files = list(DATA_PROCESSED.glob("*_tokens.csv"))
    if not token_files:
        print("Run 04_preprocess.py first")
        return 1

    for path in token_files:
        source = path.stem.replace("_tokens", "")
        run_tfidf(path, source)

    return 0


if __name__ == "__main__":
    sys.exit(main())
