#!/usr/bin/env python3
"""Visualize public data trends (institutions, users, support)."""

from __future__ import annotations

import sys
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import DATA_RAW, OUTPUT_FIGURES, configure_matplotlib_korean, ensure_dirs, load_csv_glob

configure_matplotlib_korean()


def main() -> int:
    ensure_dirs()
    df = load_csv_glob(DATA_RAW / "public")
    if df.empty:
        print("Place public CSV in data/raw/public/ (see sample_language_rehab.csv)")
        return 1

    if "year" not in df.columns:
        print("Public CSV must include 'year' column")
        return 1

    df = df.sort_values("year")
    fig, axes = plt.subplots(1, 3, figsize=(14, 4))

    metrics = [
        ("institutions", "기관 수"),
        ("users", "이용자 수"),
        ("support_amount", "지원금"),
    ]

    for ax, (col, label) in zip(axes, metrics):
        if col in df.columns:
            ax.plot(df["year"], df[col], marker="o", color="#2563eb")
            ax.set_title(label)
            ax.set_xlabel("연도")
            ax.grid(True, alpha=0.3)

    plt.suptitle("발달재활·언어치료 공공데이터 추이 (샘플)")
    plt.tight_layout()

    out = OUTPUT_FIGURES / "public_trends.png"
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"Public trends chart -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
