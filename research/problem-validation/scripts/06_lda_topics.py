#!/usr/bin/env python3
"""LDA topic modeling on preprocessed token documents."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
from gensim import corpora
from gensim.models import LdaModel

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import DATA_PROCESSED, OUTPUT_REPORTS, ensure_dirs, load_keywords_config

TOPIC_HINTS = {
    "비용": ["비용", "바우처", "지원", "부담", "보험"],
    "접근성": ["대기", "기관", "접근", "지역", "격차"],
    "가정학습": ["부모", "가정", "연습", "보호자", "피드백", "일반화"],
    "치료": ["치료", "언어", "재활", "아동", "발달"],
}


def label_topic(words: list[str]) -> str:
    scores = {}
    for label, hints in TOPIC_HINTS.items():
        scores[label] = sum(1 for word in words if any(h in word for h in hints))
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "기타"


def run_lda(tokens_path: Path, source: str) -> None:
    df = pd.read_csv(tokens_path)
    docs = [str(row).split() for row in df["tokens"].fillna("")]
    docs = [doc for doc in docs if doc]
    if len(docs) < 2:
        print(f"Skip LDA for {source}: not enough documents")
        return

    config = load_keywords_config()
    num_topics = min(config.get("lda", {}).get("num_topics", 4), len(docs))
    passes = config.get("lda", {}).get("passes", 15)

    dictionary = corpora.Dictionary(docs)
    dictionary.filter_extremes(no_below=1, no_above=0.9)
    corpus = [dictionary.doc2bow(doc) for doc in docs]

    model = LdaModel(
        corpus=corpus,
        id2word=dictionary,
        num_topics=num_topics,
        passes=passes,
        random_state=42,
    )

    lines = [f"# LDA Topics — {source}\n", f"Documents: {len(docs)}, Topics: {num_topics}\n"]
    for topic_id in range(num_topics):
        terms = model.show_topic(topic_id, topn=8)
        words = [word for word, _ in terms]
        hint = label_topic(words)
        lines.append(f"\n## Topic {topic_id + 1} ({hint})\n")
        for word, weight in terms:
            lines.append(f"- {word}: {weight:.4f}")

    out = OUTPUT_REPORTS / f"{source}_lda_topics.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"LDA report -> {out}")


def main() -> int:
    ensure_dirs()
    token_files = list(DATA_PROCESSED.glob("*_tokens.csv"))
    if not token_files:
        print("Run 04_preprocess.py first")
        return 1

    for path in token_files:
        source = path.stem.replace("_tokens", "")
        run_lda(path, source)

    return 0


if __name__ == "__main__":
    sys.exit(main())
