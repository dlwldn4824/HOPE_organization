"""CTC 디코딩·라벨 변환 (PER 평가용)."""

from __future__ import annotations

import numpy as np

from speech_coach.data.ipa_vocab import ID_TO_PHONEME

_SKIP_LABEL_IDS = frozenset({0})  # <pad> blank


def ctc_collapse(token_ids: list[int], *, blank_id: int = 0) -> list[int]:
    out: list[int] = []
    prev: int | None = None
    for token_id in token_ids:
        if token_id == blank_id:
            prev = token_id
            continue
        if token_id != prev:
            out.append(int(token_id))
        prev = token_id
    return out


def ids_to_phonemes(token_ids: list[int]) -> list[str]:
    phonemes: list[str] = []
    for token_id in token_ids:
        if token_id < 0 or token_id in _SKIP_LABEL_IDS:
            continue
        symbol = ID_TO_PHONEME.get(int(token_id))
        if not symbol or symbol in {"<unk>", "<sil>", "<eos>"}:
            continue
        phonemes.append(symbol)
    return phonemes


def pred_ids_to_phoneme_sequences(pred_ids: np.ndarray, *, blank_id: int = 0) -> list[list[str]]:
    sequences: list[list[str]] = []
    for row in pred_ids:
        collapsed = ctc_collapse([int(x) for x in row.tolist()], blank_id=blank_id)
        sequences.append(ids_to_phonemes(collapsed))
    return sequences


def label_ids_to_phoneme_sequences(label_ids: np.ndarray) -> list[list[str]]:
    sequences: list[list[str]] = []
    for row in label_ids:
        tokens = [int(x) for x in row.tolist() if int(x) >= 0]
        sequences.append(ids_to_phonemes(tokens))
    return sequences
