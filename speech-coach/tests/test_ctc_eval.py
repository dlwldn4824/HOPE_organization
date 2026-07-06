"""CTC decode / PER 평가 유틸."""

from __future__ import annotations

import numpy as np

from speech_coach.eval.ctc_decode import (
    ctc_collapse,
    ids_to_phonemes,
    label_ids_to_phoneme_sequences,
    pred_ids_to_phoneme_sequences,
)
from speech_coach.eval.ctc_eval import compute_per_from_predictions, infer_val_manifest
from speech_coach.eval.metrics import phoneme_error_rate


def test_ctc_collapse_removes_blanks_and_repeats() -> None:
    assert ctc_collapse([0, 0, 3, 3, 0, 5, 5, 5], blank_id=0) == [3, 5]


def test_ids_to_phonemes_skips_special() -> None:
    # id 2 = "k", id 23 = "a" per PHONEME_ORDER
    assert ids_to_phonemes([2, 23]) == ["k", "a"]


def test_pred_and_label_sequences() -> None:
    pred = np.array([[0, 2, 2, 23, 0], [0, 2, 23, 0, 0]])
    labels = np.array([[2, 23, -100, -100, -100], [2, 23, -100, -100, -100]])
    hyps = pred_ids_to_phoneme_sequences(pred, blank_id=0)
    refs = label_ids_to_phoneme_sequences(labels)
    assert hyps == [["k", "a"], ["k", "a"]]
    assert refs == [["k", "a"], ["k", "a"]]
    assert phoneme_error_rate(refs, hyps) == 0.0


def test_compute_per_from_predictions() -> None:
    pred = np.array([[0, 2, 23, 0]])
    labels = np.array([[2, 5, 23, -100]])  # t instead of k
    per, n_ref, n_err = compute_per_from_predictions(pred, labels, blank_id=0)
    assert n_ref == 3
    assert n_err == 1
    assert per > 0.0


def test_infer_val_manifest(tmp_path) -> None:
    train = tmp_path / "stage2_train.jsonl"
    val = tmp_path / "stage2_val.jsonl"
    train.write_text("{}\n", encoding="utf-8")
    val.write_text("{}\n", encoding="utf-8")
    assert infer_val_manifest(train) == val
    assert infer_val_manifest(tmp_path / "other.jsonl") is None
