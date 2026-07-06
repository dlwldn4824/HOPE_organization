"""augment.py unit tests."""

from __future__ import annotations

import random

import numpy as np

from speech_coach.data.augment import AugmentConfig, augment_waveform, _speed_perturb


def test_speed_perturb_changes_length() -> None:
    wav = np.ones(16_000, dtype=np.float32) * 0.1
    slower = _speed_perturb(wav, 0.9)
    faster = _speed_perturb(wav, 1.1)
    assert slower.shape[0] > wav.shape[0]
    assert faster.shape[0] < wav.shape[0]


def test_augment_waveform_noop_without_config() -> None:
    wav = np.linspace(-0.5, 0.5, 1000, dtype=np.float32)
    assert np.array_equal(augment_waveform(wav, config=None), wav)


def test_augment_waveform_runs() -> None:
    wav = np.random.default_rng(0).normal(0, 0.05, 8000).astype(np.float32)
    cfg = AugmentConfig(
        p_speed=1.0,
        p_pitch=0.0,
        p_noise=1.0,
        p_time_mask=0.0,
        rng=random.Random(42),
    )
    out = augment_waveform(wav, config=cfg)
    assert out.shape[0] > 0
    assert out.dtype == np.float32
