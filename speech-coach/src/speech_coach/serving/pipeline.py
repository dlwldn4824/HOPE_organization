"""§8.2 InferencePipeline."""

from __future__ import annotations

import os
import time
from pathlib import Path

import torch

from speech_coach.data.g2p_ko import phoneme_ids
from speech_coach.data.ipa_vocab import PHONEME_TO_ID
from speech_coach.models import (
    FeedbackGenerator,
    ForcedAligner,
    NeedlemanWunschAligner,
    OpenSmileAnalyzer,
    PhonemeBoundary,
    PhonemeRecognizer,
    VariationClassifier,
    calc_pcc,
)
from speech_coach.serving.schemas import (
    AnalyzeResponse,
    ArticulationCue,
    ArticulationDiagram,
    FeedbackBlock,
    PhonemeResult,
)
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

        actual_phonemes, frame_logits, confidence = self.recognizer.predict(
            audio,
            target_phonemes=target_phonemes,
        )
        phoneme_boundaries = self.forced_aligner(frame_logits, torch_int_seq(actual_phonemes))
        acoustic_deviations = self.opensmile.analyze(audio, phoneme_boundaries)

        alignment = self.nw_aligner.align(target=target_phonemes, predicted=actual_phonemes)
        classifications = self.var_clf.classify(alignment, acoustic_deviations)
        pcc_score = calc_pcc(classifications)
        fb = self.feedback.generate(target_word, classifications, pcc_score)

        articulation = None
        if fb.get("articulation"):
            articulation = ArticulationCue(**fb["articulation"])

        diagram = None
        if fb.get("diagram"):
            diagram = ArticulationDiagram(**fb["diagram"])

        per_phoneme_confidence = boundary_confidences(phoneme_boundaries, frame_logits)
        phoneme_confidences = align_confidences(alignment, per_phoneme_confidence)

        results = [
            PhonemeResult(
                target=tgt,
                actual=act,
                status=status,
                variation=variation,
                acoustic_deviation_z=z,
                phoneme_confidence=conf,
            )
            for (tgt, act, status, variation, z), conf in zip(classifications, phoneme_confidences, strict=True)
        ]

        return AnalyzeResponse(
            pcc=pcc_score,
            confidence=confidence,
            phoneme_results=results,
            feedback=FeedbackBlock(
                kid_text=fb["kid_text"],
                practice_word_next=fb.get("practice_word_next"),
                articulation=articulation,
                diagram=diagram,
            ),
            latency_ms=int((time.time() - t0) * 1000),
            model_version=self.model_version,
        )


def torch_int_seq(phonemes: list[str]) -> torch.Tensor:
    """실제 IPA 음소 심볼 -> vocab ID 텐서 (forced_aligner의 torchaudio 정밀 정렬용)."""
    ids = phoneme_ids(phonemes) if phonemes else [PHONEME_TO_ID["<pad>"]]
    return torch.tensor([ids], dtype=torch.long)


def boundary_confidences(boundaries: list[PhonemeBoundary], frame_logits: torch.Tensor) -> list[float]:
    """음소 경계별 평균 최대 softmax 확률. boundaries는 actual_phonemes와 순서가 1:1 대응."""
    probs = torch.softmax(frame_logits, dim=-1)
    if probs.ndim == 3 and probs.shape[0] == 1:
        probs = probs.squeeze(0)
    frame_max = probs.max(dim=-1).values
    out: list[float] = []
    for b in boundaries:
        segment = frame_max[b.start_frame : b.end_frame + 1]
        out.append(float(segment.mean()) if segment.numel() > 0 else 0.0)
    return out


def align_confidences(
    alignment: list[tuple[str | None, str | None]],
    per_actual_confidence: list[float],
) -> list[float | None]:
    """alignment(NW 결과)를 걸어가며 VariationClassifier.classify()와 같은 필터(tgt is None 스킵)로
    per_actual_confidence(actual_phonemes 순서)를 매칭한다. DEL(act is None)은 None."""
    out: list[float | None] = []
    cursor = 0
    for tgt, act in alignment:
        conf: float | None = None
        if act is not None:
            conf = per_actual_confidence[cursor] if cursor < len(per_actual_confidence) else None
            cursor += 1
        if tgt is None:
            continue
        out.append(conf)
    return out
