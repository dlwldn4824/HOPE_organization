"""설계서 §6.2 augmentation — speed / pitch / noise / time mask."""

from __future__ import annotations

from dataclasses import dataclass, field
import random

import numpy as np

_SAMPLE_RATE = 16_000


@dataclass
class AugmentConfig:
    """Stage2 기본값 (설계서 §6.2)."""

    speed_factors: tuple[float, ...] = (0.9, 1.0, 1.1)
    pitch_semitones_max: float = 2.0
    noise_snr_min_db: float = 10.0
    noise_snr_max_db: float = 30.0
    time_mask_max_frames: int = 30
    time_mask_count: int = 2
    feature_mask_max_channels: int = 27
    feature_mask_count: int = 2
    apply_time_mask: bool = True
    apply_feature_mask: bool = True
    p_speed: float = 0.5
    p_pitch: float = 0.5
    p_noise: float = 0.5
    p_time_mask: float = 0.5
    rng: random.Random = field(default_factory=random.Random)


def _speed_perturb(wav: np.ndarray, factor: float) -> np.ndarray:
    if factor == 1.0:
        return wav
    import torch
    import torch.nn.functional as F

    x = torch.from_numpy(wav).float().view(1, 1, -1)
    target_len = max(1, int(round(wav.shape[0] / factor)))
    out = F.interpolate(x, size=target_len, mode="linear", align_corners=False)
    return out.view(-1).numpy()


def _pitch_shift(wav: np.ndarray, sample_rate: int, semitones: float) -> np.ndarray:
    import torch
    import torchaudio

    x = torch.from_numpy(wav).float().unsqueeze(0)
    shifted = torchaudio.functional.pitch_shift(x, sample_rate, semitones)
    return shifted.squeeze(0).numpy()


def _add_noise(wav: np.ndarray, snr_db: float, rng: random.Random) -> np.ndarray:
    signal_power = float(np.mean(wav**2)) + 1e-12
    noise_power = signal_power / (10 ** (snr_db / 10.0))
    noise = np.random.default_rng(rng.randint(0, 2**31 - 1)).normal(
        0.0, np.sqrt(noise_power), wav.shape
    )
    out = wav + noise.astype(np.float32)
    return np.clip(out, -1.0, 1.0)


def _time_mask_waveform(wav: np.ndarray, max_frames: int, count: int, rng: random.Random) -> np.ndarray:
    """Mel frame 기준 time mask를 10ms 프레임으로 근사 (Wav2Vec2 stride 20ms 전 단계)."""
    out = wav.copy()
    frame_samples = max(1, int(0.01 * _SAMPLE_RATE))
    max_width = max(frame_samples, max_frames * frame_samples)
    for _ in range(count):
        width = rng.randint(frame_samples, max_width)
        if width >= out.shape[0]:
            continue
        start = rng.randint(0, out.shape[0] - width)
        out[start : start + width] = 0.0
    return out


def _feature_mask_waveform(wav: np.ndarray, max_channels: int, count: int, rng: random.Random) -> np.ndarray:
    """주파수 대역 마스킹 근사 — 랜덤 저역/고역 감쇠."""
    import torch
    import torchaudio

    x = torch.from_numpy(wav).float().unsqueeze(0)
    out = x.clone()
    n_fft = 512
    for _ in range(count):
        spec = torch.stft(out, n_fft=n_fft, return_complex=True)
        n_bins = spec.shape[-2]
        width = min(max(1, max_channels), n_bins)
        start = rng.randint(0, max(0, n_bins - width))
        spec[:, start : start + width, :] = 0.0
        out = torch.istft(spec, n_fft=n_fft, length=out.shape[-1])
    return out.squeeze(0).numpy()


def augment_waveform(
    wav: np.ndarray,
    *,
    sample_rate: int = _SAMPLE_RATE,
    config: AugmentConfig | None = None,
    rng: random.Random | None = None,
) -> np.ndarray:
    """학습용 waveform augmentation (eval/val에는 적용하지 않음)."""
    if config is None:
        return wav
    gen = rng or config.rng
    out = np.asarray(wav, dtype=np.float32).copy()

    if gen.random() < config.p_speed:
        factor = gen.choice(config.speed_factors)
        out = _speed_perturb(out, factor)

    if config.pitch_semitones_max > 0 and gen.random() < config.p_pitch:
        semitones = gen.uniform(-config.pitch_semitones_max, config.pitch_semitones_max)
        if abs(semitones) >= 0.05:
            out = _pitch_shift(out, sample_rate, semitones)

    if gen.random() < config.p_noise:
        snr = gen.uniform(config.noise_snr_min_db, config.noise_snr_max_db)
        out = _add_noise(out, snr, gen)

    if config.apply_time_mask and gen.random() < config.p_time_mask:
        out = _time_mask_waveform(out, config.time_mask_max_frames, config.time_mask_count, gen)

    if config.apply_feature_mask and gen.random() < config.p_time_mask:
        out = _feature_mask_waveform(out, config.feature_mask_max_channels, config.feature_mask_count, gen)

    return np.asarray(out, dtype=np.float32)
