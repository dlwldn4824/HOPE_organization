#!/usr/bin/env python3
"""Collect news via Google News RSS (optional) or use existing CSV in data/raw/news/."""

from __future__ import annotations

import sys
import urllib.parse
from datetime import datetime
from pathlib import Path

import feedparser
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import DATA_RAW, ensure_dirs, load_keywords_config

NEWS_DIR = DATA_RAW / "news"


def collect_rss(query: str, max_items: int = 20) -> pd.DataFrame:
    encoded = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={encoded}&hl=ko&gl=KR&ceid=KR:ko"
    feed = feedparser.parse(url)
    rows = []
    for entry in feed.entries[:max_items]:
        rows.append(
            {
                "source": "google_news_rss",
                "query": query,
                "title": entry.get("title", ""),
                "body": entry.get("summary", ""),
                "date": entry.get("published", "")[:10] if entry.get("published") else "",
                "url": entry.get("link", ""),
            }
        )
    return pd.DataFrame(rows)


def main() -> int:
    ensure_dirs()
    config = load_keywords_config()
    queries = config.get("news", {}).get("queries", [])

    existing = list(NEWS_DIR.glob("*.csv"))
    if existing:
        print(f"Found {len(existing)} existing CSV file(s) in {NEWS_DIR}")
        for file in existing:
            print(f"  - {file.name}")
        print("Skipping RSS collection. Delete CSVs or use --fetch to append RSS data.")
        if "--fetch" not in sys.argv:
            return 0

    all_frames = []
    for query in queries[:3]:  # limit RSS calls in demo
        print(f"Fetching RSS: {query}")
        try:
            frame = collect_rss(query)
            if not frame.empty:
                all_frames.append(frame)
        except Exception as exc:
            print(f"  RSS failed for {query}: {exc}")

    if all_frames:
        merged = pd.concat(all_frames, ignore_index=True)
        stamp = datetime.now().strftime("%Y%m%d")
        out = NEWS_DIR / f"google_news_rss_{stamp}.csv"
        merged.to_csv(out, index=False, encoding="utf-8-sig")
        print(f"Saved {len(merged)} rows -> {out}")
    else:
        print("No RSS data collected. Use sample_news.csv or add CSV manually.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
