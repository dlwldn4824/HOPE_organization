#!/usr/bin/env python3
"""compute_pcc.py 출력(CSV)으로 PCC 비교 그림 3종 생성.

## 색상

- **모델별 색상 고정**(카테고리 팔레트, 순서 고정): own=blue `#2a78d6`,
  whisper=green `#008300`, 상용(clova/google)=magenta `#e87ba4`. 세 hex는
  `validate_palette.js --mode light`로 검증 통과(WARN 1건: magenta가 배경
  대비 3:1 미만이라 "relief" 필요 -> 모든 박스/마커에 어두운 외곽선을 그려
  색상 하나에만 의존하지 않게 했다).
- **임상 판정 밴드**는 상태 팔레트(good/warning/serious/critical)를 의미에
  맞게 그대로 매핑(mild=good, moderate=warning, severe=serious,
  profound=critical)하되, 배경 밴드이므로 옅은 알파로 깐다 — 전경의 산점과
  겹쳐도 값이 가려지지 않게.

## Figure

1. 모델 3종 PCC 분포 박스플롯 (x축=모델, 이미 직접 라벨링되어 있어 범례 생략)
2. 임상 판정 밴드 배경 + 자체 모델 PCC 산포도 (카테고리별 지터)
3. condition(normal/misart) × 모델 그룹 박스플롯 (범례 있음 — 색만으로
   모델을 구분해야 하므로)

## 실행 예시

    python visualize_pcc.py --input results/pcc_rows.csv --out_dir results/figs
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

import matplotlib.font_manager as fm
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

logger = logging.getLogger("visualize_pcc")

MODEL_COLORS: dict[str, str] = {
    "own": "#2a78d6",
    "whisper": "#008300",
    "clova": "#e87ba4",
    "google": "#e87ba4",
}
MODEL_ORDER: list[str] = ["own", "whisper", "clova", "google"]

# 임상 판정 밴드 <- 프로젝트 status 팔레트 그대로 매핑 (의미가 정확히 대응됨).
SEVERITY_BANDS: list[tuple[str, float, float, str]] = [
    # (band, y_low, y_high, hex)
    ("profound", 0.0, 50.0, "#d03b3b"),
    ("severe", 50.0, 65.0, "#ec835a"),
    ("moderate", 65.0, 85.0, "#fab219"),
    ("mild", 85.0, 100.0, "#0ca30c"),
]

_INK_PRIMARY = "#0b0b0b"
_INK_MUTED = "#898781"
_GRID = "#e1e0d9"

_FONT_CANDIDATES = [
    "Noto Sans CJK KR",
    "Noto Sans KR",
    "Apple SD Gothic Neo",
    "AppleGothic",
    "NanumGothic",
    "Malgun Gothic",
]


def setup_font() -> None:
    available = {f.name for f in fm.fontManager.ttflist}
    for name in _FONT_CANDIDATES:
        if name in available:
            plt.rcParams["font.family"] = name
            plt.rcParams["axes.unicode_minus"] = False
            logger.info("폰트: %s", name)
            return
    logger.warning("한국어 폰트를 찾지 못함 (%s 중 없음) — 한글이 깨질 수 있음", _FONT_CANDIDATES)
    plt.rcParams["axes.unicode_minus"] = False


def _style_axes(ax: plt.Axes) -> None:
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(_INK_MUTED)
    ax.spines["bottom"].set_color(_INK_MUTED)
    ax.tick_params(colors=_INK_MUTED)
    ax.yaxis.grid(True, color=_GRID, linewidth=0.8, zorder=0)
    ax.set_axisbelow(True)


def _save(fig: plt.Figure, out_dir: Path, name: str) -> None:
    fig.savefig(out_dir / f"{name}.png", dpi=300, bbox_inches="tight")
    fig.savefig(out_dir / f"{name}.pdf", bbox_inches="tight")
    plt.close(fig)


def figure1_model_boxplot(df: pd.DataFrame, out_dir: Path) -> None:
    models = [m for m in MODEL_ORDER if m in df["model"].unique()]
    data = [df.loc[df["model"] == m, "pcc"].to_numpy() for m in models]
    colors = [MODEL_COLORS[m] for m in models]

    fig, ax = plt.subplots(figsize=(6, 4.5))
    bp = ax.boxplot(data, labels=models, patch_artist=True, widths=0.5, medianprops={"color": _INK_PRIMARY})
    for patch, color in zip(bp["boxes"], colors, strict=True):
        patch.set_facecolor(color)
        patch.set_alpha(0.75)
        patch.set_edgecolor(_INK_PRIMARY)
        patch.set_linewidth(1.2)
    for element in ("whiskers", "caps"):
        for line in bp[element]:
            line.set_color(_INK_MUTED)

    ax.set_ylabel("PCC (%)", color=_INK_PRIMARY)
    ax.set_title("모델별 PCC 분포", color=_INK_PRIMARY)
    ax.set_ylim(0, 105)
    _style_axes(ax)
    _save(fig, out_dir, "figure1_model_pcc_boxplot")


def figure2_severity_scatter(df: pd.DataFrame, out_dir: Path) -> None:
    own = df[df["model"] == "own"].copy()
    if own.empty:
        logger.warning("model=='own' 행이 없어 Figure 2를 건너뜀")
        return

    categories = sorted(own["category"].dropna().unique())
    x_positions = {c: i for i, c in enumerate(categories)}
    rng = np.random.default_rng(42)
    xs = own["category"].map(x_positions).to_numpy(dtype=float) + rng.uniform(-0.15, 0.15, size=len(own))

    fig, ax = plt.subplots(figsize=(8, 5))
    for band, y_low, y_high, hex_color in SEVERITY_BANDS:
        ax.axhspan(y_low, y_high, facecolor=hex_color, alpha=0.15, zorder=0)
        ax.text(
            len(categories) - 0.4,
            (y_low + y_high) / 2,
            f"{band} ({y_low:.0f}–{y_high:.0f}%)",
            va="center",
            ha="left",
            fontsize=8,
            color=_INK_MUTED,
        )

    ax.scatter(xs, own["pcc"], color=MODEL_COLORS["own"], edgecolor=_INK_PRIMARY, linewidth=0.6, s=28, zorder=3)

    ax.set_xticks(range(len(categories)))
    ax.set_xticklabels(categories, rotation=20, ha="right", color=_INK_PRIMARY)
    ax.set_xlim(-0.5, len(categories) - 0.5 + 1.8)  # 오른쪽에 밴드 라벨 공간 확보
    ax.set_ylim(0, 105)
    ax.set_ylabel("PCC (%)", color=_INK_PRIMARY)
    ax.set_title("자체 모델 PCC — 임상 판정 밴드 대비", color=_INK_PRIMARY)
    _style_axes(ax)
    ax.xaxis.grid(False)
    _save(fig, out_dir, "figure2_severity_band_scatter")


def figure3_condition_boxplot(df: pd.DataFrame, out_dir: Path) -> None:
    models = [m for m in MODEL_ORDER if m in df["model"].unique()]
    conditions = [c for c in ("normal", "misart") if c in df["condition"].unique()]
    if not conditions:
        logger.warning("condition 값이 normal/misart가 아님 — Figure 3를 건너뜀")
        return

    n_models = len(models)
    group_width = 0.8
    box_width = group_width / n_models

    fig, ax = plt.subplots(figsize=(7, 5))
    for gi, cond in enumerate(conditions):
        for mi, model in enumerate(models):
            vals = df.loc[(df["condition"] == cond) & (df["model"] == model), "pcc"].to_numpy()
            if len(vals) == 0:
                continue
            pos = gi + (mi - (n_models - 1) / 2) * box_width
            bp = ax.boxplot(
                [vals],
                positions=[pos],
                widths=box_width * 0.85,
                patch_artist=True,
                medianprops={"color": _INK_PRIMARY},
            )
            bp["boxes"][0].set_facecolor(MODEL_COLORS[model])
            bp["boxes"][0].set_alpha(0.75)
            bp["boxes"][0].set_edgecolor(_INK_PRIMARY)
            bp["boxes"][0].set_linewidth(1.2)
            for element in ("whiskers", "caps"):
                for line in bp[element]:
                    line.set_color(_INK_MUTED)

    ax.set_xticks(range(len(conditions)))
    ax.set_xticklabels(conditions, color=_INK_PRIMARY)
    ax.set_ylim(0, 105)
    ax.set_ylabel("PCC (%)", color=_INK_PRIMARY)
    ax.set_title("발화 조건(normal/misart) × 모델별 PCC", color=_INK_PRIMARY)
    _style_axes(ax)

    handles = [plt.Rectangle((0, 0), 1, 1, facecolor=MODEL_COLORS[m], edgecolor=_INK_PRIMARY, alpha=0.75) for m in models]
    ax.legend(handles, models, frameon=False, loc="lower left")
    _save(fig, out_dir, "figure3_condition_model_boxplot")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--input", type=Path, required=True, help="compute_pcc.py의 --out CSV")
    p.add_argument("--out_dir", type=Path, required=True)
    p.add_argument("--verbose", action="store_true")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    setup_font()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(args.input)
    logger.info("입력 로드: %d행", len(df))

    figure1_model_boxplot(df, args.out_dir)
    figure2_severity_scatter(df, args.out_dir)
    figure3_condition_boxplot(df, args.out_dir)
    logger.info("완료: %s", args.out_dir)


if __name__ == "__main__":
    main()
