#!/usr/bin/env python3
"""Cross-source keyword comparison: news vs papers vs public labels."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import OUTPUT_REPORTS, OUTPUT_TABLES, ensure_dirs, load_keywords_config

# Public data dimension labels (not from NLP — manual mapping for matrix)
PUBLIC_KEYWORDS = ["기관", "이용자", "지원금", "접근성", "증가"]


def load_top_keywords(source: str, top_n: int = 15) -> list[str]:
    path = OUTPUT_TABLES / f"{source}_tfidf_top{top_n}.csv"
    alt = list(OUTPUT_TABLES.glob(f"{source}_tfidf_top*.csv"))
    if not path.exists() and alt:
        path = alt[0]
    if not path.exists():
        return []
    df = pd.read_csv(path)
    return df["keyword"].head(top_n).tolist()


def main() -> int:
    ensure_dirs()
    config = load_keywords_config()
    top_n = config.get("tfidf", {}).get("top_n", 30)

    news_kw = load_top_keywords("news", min(top_n, 15))
    papers_kw = load_top_keywords("papers", min(top_n, 15))

    all_kw = sorted(set(news_kw + papers_kw + PUBLIC_KEYWORDS))

    rows = []
    for kw in all_kw:
        rows.append(
            {
                "keyword": kw,
                "news": "O" if kw in news_kw else "",
                "papers": "O" if kw in papers_kw else "",
                "public": "O" if kw in PUBLIC_KEYWORDS else "",
                "overlap_count": sum(
                    [
                        kw in news_kw,
                        kw in papers_kw,
                        kw in PUBLIC_KEYWORDS,
                    ]
                ),
            }
        )

    matrix = pd.DataFrame(rows).sort_values("overlap_count", ascending=False)
    out = OUTPUT_TABLES / "cross_source_matrix.csv"
    matrix.to_csv(out, index=False, encoding="utf-8-sig")
    print(f"Cross-source matrix -> {out}")

    pain_candidates = matrix[matrix["overlap_count"] >= 2]["keyword"].tolist()
    report_lines = [
        "# Cross-Source Comparison\n",
        "## Top overlapping keywords\n",
        ", ".join(pain_candidates[:10]) if pain_candidates else "(run after TF-IDF)",
        "\n## Suggested Pain Point themes\n",
        "- 비용/지원: 비용, 바우처, 지원",
        "- 접근성/대기: 대기, 기관, 지역",
        "- 가정학습/피드백: 부모, 가정, 연습, 피드백",
        "- 학술(논문): 일반화, 보호자",
        "\nSee synthesis/pain-points.md to finalize.",
    ]
    report = OUTPUT_REPORTS / "cross_source_summary.md"
    report.write_text("\n".join(report_lines), encoding="utf-8")
    print(f"Summary report -> {report}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
