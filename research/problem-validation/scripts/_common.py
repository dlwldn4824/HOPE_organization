"""Shared utilities for problem-validation pipeline."""

from __future__ import annotations

import re
from pathlib import Path

import pandas as pd
import yaml

ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"
DATA_RAW = ROOT / "data" / "raw"
DATA_PROCESSED = ROOT / "data" / "processed"
OUTPUT_FIGURES = ROOT / "outputs" / "figures"
OUTPUT_TABLES = ROOT / "outputs" / "tables"
OUTPUT_REPORTS = ROOT / "outputs" / "reports"

_OKT = None
_OKT_FAILED = False
_CACHED_FONT_PATH: str | None = None

KOREAN_FONT_NAMES = ("AppleGothic", "Apple SD Gothic Neo", "NanumGothic", "Malgun Gothic")
KOREAN_FONT_FALLBACK_PATHS = (
    Path("/System/Library/Fonts/AppleSDGothicNeo.ttc"),
    Path("/System/Library/Fonts/Supplemental/AppleGothic.ttf"),
    Path("/Library/Fonts/NanumGothic.ttf"),
)


def resolve_korean_font_path() -> str | None:
    """Return a TTF/TTC path that supports Hangul for wordcloud/matplotlib."""
    global _CACHED_FONT_PATH
    if _CACHED_FONT_PATH is not None:
        return _CACHED_FONT_PATH

    for path in KOREAN_FONT_FALLBACK_PATHS:
        if path.exists():
            _CACHED_FONT_PATH = str(path)
            return _CACHED_FONT_PATH

    try:
        from matplotlib import font_manager

        for name in KOREAN_FONT_NAMES:
            for font in font_manager.fontManager.ttflist:
                if font.name == name and Path(font.fname).exists():
                    _CACHED_FONT_PATH = font.fname
                    return _CACHED_FONT_PATH
    except Exception:
        pass

    return None


def configure_matplotlib_korean() -> str | None:
    """Set matplotlib rcParams to a Hangul-capable font. Returns font path."""
    import matplotlib.pyplot as plt
    from matplotlib import font_manager

    font_path = resolve_korean_font_path()
    if font_path:
        try:
            font_manager.fontManager.addfont(font_path)
        except Exception:
            pass
        font_name = font_manager.FontProperties(fname=font_path).get_name()
        plt.rcParams["font.family"] = font_name
    else:
        plt.rcParams["font.family"] = list(KOREAN_FONT_NAMES) + ["sans-serif"]

    plt.rcParams["axes.unicode_minus"] = False
    return font_path


def ensure_dirs() -> None:
    for path in [
        DATA_RAW / "news",
        DATA_RAW / "papers",
        DATA_RAW / "public",
        DATA_PROCESSED,
        OUTPUT_FIGURES,
        OUTPUT_TABLES,
        OUTPUT_REPORTS,
    ]:
        path.mkdir(parents=True, exist_ok=True)


def load_keywords_config() -> dict:
    with (CONFIG_DIR / "keywords.yaml").open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_stopwords() -> set[str]:
    path = CONFIG_DIR / "stopwords.txt"
    words = {line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}
    return words


def _get_okt():
    global _OKT, _OKT_FAILED
    if _OKT_FAILED:
        return None
    if _OKT is not None:
        return _OKT
    try:
        from konlpy.tag import Okt

        _OKT = Okt()
        return _OKT
    except Exception:
        _OKT_FAILED = True
        return None


def extract_nouns(text: str) -> list[str]:
    if not text or not str(text).strip():
        return []

    okt = _get_okt()
    if okt is not None:
        try:
            return [noun for noun in okt.nouns(str(text)) if len(noun) >= 2]
        except Exception:
            pass

    # Fallback: Hangul sequences length >= 2
    return re.findall(r"[가-힣]{2,}", str(text))


def tokenize_document(text: str, stopwords: set[str] | None = None) -> list[str]:
    stop = stopwords or load_stopwords()
    nouns = extract_nouns(text)
    return [noun for noun in nouns if noun not in stop and len(noun) >= 2]


def load_csv_glob(folder: Path, pattern: str = "*.csv") -> pd.DataFrame:
    files = sorted(folder.glob(pattern))
    if not files:
        return pd.DataFrame()

    frames = []
    for file in files:
        try:
            frames.append(pd.read_csv(file))
        except Exception:
            continue

    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, ignore_index=True)


def save_tokens_csv(tokens_by_doc: list[list[str]], source: str) -> Path:
    rows = []
    for index, tokens in enumerate(tokens_by_doc):
        rows.append({"doc_id": index, "source": source, "tokens": " ".join(tokens)})
    out = DATA_PROCESSED / f"{source}_tokens.csv"
    pd.DataFrame(rows).to_csv(out, index=False, encoding="utf-8-sig")
    return out
