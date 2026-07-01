"""Module A++ — OpenSMILE eGeMAPS 음향 특징 추출 + z-score 계산.

설계서 §4.4 — 정상 발화 분포(normal_distribution_ref.json)를 로드하고,
음소 구간별로 eGeMAPS Functionals(88차원)을 뽑아 z-score를 산출한다.

opensmile-python 미설치 환경에서는 빈 dict를 돌려주는 안전 fallback.
설치: `pip install -e ".[opensmile]"`
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import numpy as np
import torch

# Default eGeMAPS Functionals dimensionality (per opensmile docs).
EGEMAPS_DIM = 88


def _opensmile_available() -> bool:
    try:
        import opensmile  # noqa: F401

        return True
    except ImportError:
        return False


class OpenSmileAnalyzer:
    """음소 구간별 eGeMAPS 추출 + 정상 분포 대비 z-score 산출."""

    def __init__(
        self,
        normal_dist_path: str | Path | None = None,
        sample_rate: int = 16000,
    ) -> None:
        self.sample_rate = sample_rate
        self.normal_dist_path = Path(normal_dist_path) if normal_dist_path else None
        self._ref: dict[str, dict[str, float]] = {}
        if self.normal_dist_path and self.normal_dist_path.is_file():
            self._ref = json.loads(self.normal_dist_path.read_text(encoding="utf-8"))

        self._smile: Any | None = None
        if _opensmile_available():
            import opensmile

            self._smile = opensmile.Smile(
                feature_set=opensmile.FeatureSet.eGeMAPSv02,
                feature_level=opensmile.FeatureLevel.Functionals,
            )

    @property
    def is_active(self) -> bool:
        return self._smile is not None

    def analyze(
        self,
        audio_waveform: torch.Tensor | np.ndarray,
        phoneme_boundaries: list,
    ) -> dict[str, Any]:
        """음소 구간별 eGeMAPS 특징과 (정상 분포가 있다면) z-score 반환.

        Args:
            audio_waveform: (samples,) 16kHz 모노 파형.
            phoneme_boundaries: ForcedAligner 출력 — PhonemeBoundary(phoneme_index,
                                start_frame, end_frame) 리스트. frame 인덱스는
                                wav2vec2 stride 기준 (보통 20ms hop).

        Returns:
            {
              "per_phoneme": [{"phoneme_index": int, "features": {name: value}, "z": {name: z}}],
              "global_z_mean": float | None,   # 음소 평균 |z| (DIS 신호)
              "opensmile_active": bool,
            }
        """
        if not self.is_active or not phoneme_boundaries:
            return {"per_phoneme": [], "global_z_mean": None, "opensmile_active": self.is_active}

        wav = self._to_numpy(audio_waveform)
        frame_to_sample = self._frame_to_sample_ratio(num_frames_hint=len(wav))

        per_phoneme: list[dict[str, Any]] = []
        z_magnitudes: list[float] = []
        for boundary in phoneme_boundaries:
            start_sample = int(boundary.start_frame * frame_to_sample)
            end_sample = int((boundary.end_frame + 1) * frame_to_sample)
            segment = wav[start_sample:end_sample]
            if len(segment) < self.sample_rate * 0.02:  # < 20ms — skip
                continue
            features = self._extract_features(segment)
            z_scores, z_mean = self._compute_z(features, boundary.phoneme_index)
            per_phoneme.append(
                {
                    "phoneme_index": int(boundary.phoneme_index),
                    "features": features,
                    "z": z_scores,
                }
            )
            if z_mean is not None and math.isfinite(z_mean):
                z_magnitudes.append(z_mean)

        global_z_mean = (
            float(sum(z_magnitudes) / len(z_magnitudes)) if z_magnitudes else None
        )
        return {
            "per_phoneme": per_phoneme,
            "global_z_mean": global_z_mean,
            "opensmile_active": True,
        }

    # --- helpers ---

    @staticmethod
    def _to_numpy(audio: torch.Tensor | np.ndarray) -> np.ndarray:
        if isinstance(audio, torch.Tensor):
            audio = audio.detach().cpu().numpy()
        return np.asarray(audio, dtype=np.float32).squeeze()

    def _frame_to_sample_ratio(self, num_frames_hint: int) -> float:
        # wav2vec2 hop is 20ms by default → sample_rate / 50.
        return self.sample_rate / 50.0

    def _extract_features(self, segment: np.ndarray) -> dict[str, float]:
        import pandas as pd  # opensmile depends on pandas

        result: pd.DataFrame = self._smile.process_signal(  # type: ignore[union-attr]
            segment,
            self.sample_rate,
        )
        row = result.iloc[0].to_dict()
        return {str(k): float(v) for k, v in row.items() if not math.isnan(float(v))}

    def _compute_z(
        self,
        features: dict[str, float],
        phoneme_index: int,
    ) -> tuple[dict[str, float], float | None]:
        ref = self._ref.get(str(phoneme_index)) or self._ref.get("default")
        if not ref:
            return {}, None
        z_scores: dict[str, float] = {}
        for name, value in features.items():
            stats = ref.get(name)
            if not stats:
                continue
            mean = float(stats.get("mean", 0.0))
            std = float(stats.get("std", 0.0))
            if std <= 0:
                continue
            z_scores[name] = (value - mean) / std
        if not z_scores:
            return {}, None
        magnitudes = [abs(v) for v in z_scores.values() if math.isfinite(v)]
        z_mean = float(sum(magnitudes) / len(magnitudes)) if magnitudes else None
        return z_scores, z_mean
