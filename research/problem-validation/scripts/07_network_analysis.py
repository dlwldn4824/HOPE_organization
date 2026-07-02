#!/usr/bin/env python3
"""Co-occurrence network analysis from tokenized documents."""

from __future__ import annotations

import sys
from collections import Counter
from itertools import combinations
from pathlib import Path

import matplotlib.pyplot as plt
import networkx as nx
import pandas as pd
from matplotlib.font_manager import FontProperties

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import (
    DATA_PROCESSED,
    OUTPUT_FIGURES,
    configure_matplotlib_korean,
    ensure_dirs,
    load_keywords_config,
    resolve_korean_font_path,
)

configure_matplotlib_korean()


def build_cooccurrence(docs: list[list[str]], min_count: int) -> Counter:
    pairs: Counter = Counter()
    for doc in docs:
        unique = sorted(set(doc))
        for a, b in combinations(unique, 2):
            pairs[(a, b)] += 1
    return Counter({k: v for k, v in pairs.items() if v >= min_count})


def plot_network(pairs: Counter, source: str) -> None:
    graph = nx.Graph()
    for (a, b), weight in pairs.items():
        graph.add_edge(a, b, weight=weight)

    if graph.number_of_nodes() == 0:
        print(f"No network edges for {source}")
        return

    config = load_keywords_config()
    max_nodes = config.get("network", {}).get("max_nodes", 40)
    if graph.number_of_nodes() > max_nodes:
        degrees = sorted(graph.degree, key=lambda x: x[1], reverse=True)
        keep = {node for node, _ in degrees[:max_nodes]}
        graph = graph.subgraph(keep).copy()

    pos = nx.spring_layout(graph, seed=42, k=1.2)
    weights = [graph[u][v]["weight"] for u, v in graph.edges()]

    korean_font_path = resolve_korean_font_path()
    label_font = (
        FontProperties(fname=korean_font_path).get_name() if korean_font_path else "sans-serif"
    )

    plt.figure(figsize=(12, 10))
    nx.draw_networkx_nodes(graph, pos, node_size=800, node_color="#4caf3d", alpha=0.85)
    nx.draw_networkx_labels(
        graph, pos, font_size=9, font_color="white", font_family=label_font
    )
    nx.draw_networkx_edges(graph, pos, width=[w * 0.8 for w in weights], alpha=0.6, edge_color="#64748b")
    plt.title(f"{source} Keyword Co-occurrence Network")
    plt.axis("off")
    plt.tight_layout()

    out = OUTPUT_FIGURES / f"{source}_keyword_network.png"
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"Network graph -> {out}")


def main() -> int:
    ensure_dirs()
    config = load_keywords_config()
    min_co = config.get("network", {}).get("min_cooccurrence", 2)

    token_files = list(DATA_PROCESSED.glob("*_tokens.csv"))
    if not token_files:
        print("Run 04_preprocess.py first")
        return 1

    for path in token_files:
        source = path.stem.replace("_tokens", "")
        df = pd.read_csv(path)
        docs = [str(row).split() for row in df["tokens"].fillna("")]
        pairs = build_cooccurrence(docs, min_co)
        plot_network(pairs, source)

    return 0


if __name__ == "__main__":
    sys.exit(main())
