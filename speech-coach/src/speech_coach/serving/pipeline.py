"""§8.2 InferencePipeline."""

from __future__ import annotations

import os
import time
from pathlib import Path

import torch

from speech_coach.models import (
    FeedbackGenerator,
    ForcedAligner,
    NeedlemanWunschAligner,
    OpenSmileAnalyzer,
    PhonemeRecognizer,
    VariationClassifier,
    calc_pcc,
)
from speech_coach.serving.schemas import AnalyzeResponse, FeedbackBlock, PhonemeResult
from speech_coach.utils.audio import preprocess


class InferencePipeline:
    def __init__(
        self,
        ckpt_dir: str | Path | None,
        model_version: str,
        normal_dist_path: str | Path | None,
        *,
        stub_recognizer: bool = True,
    ) -> None:
        self.recognizer = PhonemeRecognizer.from_pretrained(
            str(ckpt_dir) if ckpt_dir else None,
            stub=stub_recognizer,
        )
        self.forced_aligner = ForcedAligner()
        self.opensmile = OpenSmileAnalyzer(normal_dist_path)
        self.nw_aligner = NeedlemanWunschAligner()
        self.var_clf = VariationClassifier()
        self.feedback = FeedbackGenerator()
        self.model_version = model_version

    @classmethod
    def from_stub(cls, model_version: str = "kspc-v0.8-stub") -> InferencePipeline:
        return cls(
            ckpt_dir=None,
            model_version=model_version,
            normal_dist_path=None,
            stub_recognizer=True,
        )

    @classmethod
    def from_checkpoint(
        cls,
        ckpt_dir: str | Path,
        *,
        model_version: str | None = None,
        normal_dist_path: str | Path | None = None,
    ) -> InferencePipeline:
        ckpt = Path(ckpt_dir)
        version = model_version or os.environ.get("HOPE_MODEL_VERSION", ckpt.parent.name)
        return cls(
            ckpt_dir=ckpt,
            model_version=version,
            normal_dist_path=normal_dist_path,
            stub_recognizer=False,
        )

    def __call__(self, audio_bytes: bytes, target_word: str, target_phonemes: list[str]) -> AnalyzeResponse:
        t0 = time.time()
        audio = preprocess(audio_bytes, target_sr=16000)

        actual_phonemes, frame_logits, _conf = self.recognizer.predict(
            audio,
            target_phonemes=target_phonemes,
        )
        phoneme_boundaries = self.forced_aligner(frame_logits, torch_int_seq(actual_phonemes))
        acoustic_deviations = self.opensmile.analyze(audio, phoneme_boundaries)

        alignment = self.nw_aligner.align(target=target_phonemes, predicted=actual_phonemes)
        classifications = self.var_clf.classify(alignment, acoustic_deviations)
        pcc_score = calc_pcc(classifications)
        fb = self.feedback.generate(target_word, classifications, pcc_score)

        results = [
            PhonemeResult(
                target=tgt,
                actual=act,
                status=status,
                variation=variation,
                acoustic_deviation_z=z,
            )
            for tgt, act, status, variation, z in classifications
        ]

        return AnalyzeResponse(
            pcc=pcc_score,
            phoneme_results=results,
            feedback=FeedbackBlock(kid_text=fb["kid_text"], practice_word_next=fb.get("practice_word_next")),
            latency_ms=int((time.time() - t0) * 1000),
            model_version=self.model_version,
        )


def torch_int_seq(_phonemes: list[str]) -> torch.Tensor:
    """forced_aligner 스텁용 더미 인덱스 시퀀스."""
    return torch.zeros(1, max(len(_phonemes), 1), dtype=torch.long)
