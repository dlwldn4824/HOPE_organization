"""Module A+ — torchaudio forced_align 기반 음소 경계 추정.

설계서 §5.5 — log-probs (T, V) + 예측 음소 인덱스 (P,) 를 받아
각 음소의 (start_frame, end_frame) 범위를 돌려준다.

torchaudio.functional.forced_align 이 가용한 환경(>= 2.1)에서는 그것을 쓰고,
그렇지 않으면 균등 분할 fallback 으로 안전 동작.
"""

from __future__ import annotations

from dataclasses import dataclass

import torch


@dataclass
class PhonemeBoundary:
    phoneme_index: int
    start_frame: int
    end_frame: int


def _torchaudio_available() -> bool:
    try:
        import torchaudio.functional as F  # noqa: F401

        return hasattr(F, "forced_align")
    except ImportError:
        return False


class ForcedAligner:
    """설계서 §5.5 — log-probs + 예측 음소 인덱스로 경계 추정."""

    def __init__(self, blank_idx: int = 0) -> None:
        self.blank_idx = blank_idx
        self._has_torchaudio = _torchaudio_available()

    def __call__(
        self,
        frame_logits: torch.Tensor,
        predicted_phoneme_indices: torch.Tensor,
    ) -> list[PhonemeBoundary]:
        if frame_logits.ndim != 2 or predicted_phoneme_indices.ndim != 1:
            raise ValueError(
                "frame_logits must be (T, V) and predicted_phoneme_indices must be (P,)"
            )
        if predicted_phoneme_indices.numel() == 0:
            return []

        if self._has_torchaudio:
            return self._align_with_torchaudio(frame_logits, predicted_phoneme_indices)
        return self._align_uniform(frame_logits, predicted_phoneme_indices)

    def _align_with_torchaudio(
        self,
        frame_logits: torch.Tensor,
        predicted_phoneme_indices: torch.Tensor,
    ) -> list[PhonemeBoundary]:
        import torchaudio.functional as F

        log_probs = torch.log_softmax(frame_logits, dim=-1).unsqueeze(0)  # (1, T, V)
        targets = predicted_phoneme_indices.to(torch.int32).unsqueeze(0)  # (1, P)

        # forced_align returns: aligned_tokens (1, T), aligned_scores (1, T)
        aligned_tokens, _ = F.forced_align(
            log_probs,
            targets,
            blank=self.blank_idx,
        )
        aligned = aligned_tokens[0].tolist()  # length T

        # Walk T and collapse consecutive identical non-blank labels into spans,
        # then map each span to the next predicted phoneme position.
        boundaries: list[PhonemeBoundary] = []
        predicted = predicted_phoneme_indices.tolist()
        cursor = 0  # index into `predicted`
        run_start: int | None = None
        run_label: int | None = None
        for t, label in enumerate(aligned):
            if label == self.blank_idx:
                if run_start is not None and run_label is not None:
                    if cursor < len(predicted) and run_label == predicted[cursor]:
                        boundaries.append(PhonemeBoundary(run_label, run_start, t - 1))
                        cursor += 1
                run_start = None
                run_label = None
                continue
            if run_label != label:
                if run_start is not None and run_label is not None:
                    if cursor < len(predicted) and run_label == predicted[cursor]:
                        boundaries.append(PhonemeBoundary(run_label, run_start, t - 1))
                        cursor += 1
                run_start = t
                run_label = label
        # tail
        if run_start is not None and run_label is not None:
            if cursor < len(predicted) and run_label == predicted[cursor]:
                boundaries.append(
                    PhonemeBoundary(run_label, run_start, len(aligned) - 1)
                )
        return boundaries

    def _align_uniform(
        self,
        frame_logits: torch.Tensor,
        predicted_phoneme_indices: torch.Tensor,
    ) -> list[PhonemeBoundary]:
        """torchaudio 미가용 환경용 fallback — T 프레임을 P 등분."""
        num_frames = frame_logits.shape[0]
        phonemes = predicted_phoneme_indices.tolist()
        if num_frames == 0:
            return []
        chunk = max(1, num_frames // max(1, len(phonemes)))
        boundaries: list[PhonemeBoundary] = []
        for i, phoneme_idx in enumerate(phonemes):
            start = i * chunk
            end = min(num_frames - 1, start + chunk - 1)
            if i == len(phonemes) - 1:
                end = num_frames - 1
            boundaries.append(PhonemeBoundary(int(phoneme_idx), start, end))
        return boundaries
