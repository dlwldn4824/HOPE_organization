"""Module A — Wav2Vec2 CTC 음소 인식."""

from __future__ import annotations

import os
from pathlib import Path

import torch
from transformers import Wav2Vec2CTCTokenizer, Wav2Vec2FeatureExtractor, Wav2Vec2ForCTC, Wav2Vec2Processor

_SKIP_TOKENS = frozenset({"<pad>", "<unk>", "<sil>", "<eos>", "<s>", "</s>", "|", ""})


def _default_base_model() -> str:
    return os.environ.get("HOPE_BASE_MODEL", "facebook/wav2vec2-xls-r-300m")


def _ctc_collapse(ids: list[int], blank_id: int) -> list[int]:
    out: list[int] = []
    prev: int | None = None
    for token_id in ids:
        if token_id == blank_id:
            prev = token_id
            continue
        if token_id != prev:
            out.append(token_id)
        prev = token_id
    return out


class PhonemeRecognizer:
    """Wav2Vec2-CTC 체크포인트 또는 스텁."""

    def __init__(self, ckpt_dir: str | None = None) -> None:
        self.ckpt_dir = ckpt_dir

    @classmethod
    def from_pretrained(cls, ckpt_dir: str | None, stub: bool = True) -> PhonemeRecognizer:
        if stub or not ckpt_dir:
            return PhonemeRecognizerStub(ckpt_dir)
        path = Path(ckpt_dir)
        if not (path / "model.safetensors").exists() and not (path / "pytorch_model.bin").exists():
            return PhonemeRecognizerStub(ckpt_dir)
        return Wav2Vec2CTCPhonemeRecognizer(ckpt_dir)

    def predict(
        self,
        waveform: torch.Tensor,
        target_phonemes: list[str] | None = None,
    ) -> tuple[list[str], torch.Tensor, float]:
        raise NotImplementedError


class PhonemeRecognizerStub(PhonemeRecognizer):
    """개발용: target_phonemes가 있으면 그대로 에코."""

    def predict(
        self,
        waveform: torch.Tensor,
        target_phonemes: list[str] | None = None,
    ) -> tuple[list[str], torch.Tensor, float]:
        if target_phonemes:
            seq = list(target_phonemes)
        else:
            seq = ["sil"]
        t_frames = max(waveform.shape[-1] // 320, 1)
        vocab = 40
        logits = torch.zeros(1, t_frames, vocab, dtype=torch.float32)
        return seq, logits, 1.0


class Wav2Vec2CTCPhonemeRecognizer(PhonemeRecognizer):
    """stage1b-mix/final 등 Hugging Face CTC 체크포인트."""

    def __init__(self, ckpt_dir: str | Path, base_model: str | None = None) -> None:
        super().__init__(str(ckpt_dir))
        self.ckpt_dir = Path(ckpt_dir)
        self.base_model = base_model or _default_base_model()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(self.base_model)
        tokenizer = Wav2Vec2CTCTokenizer.from_pretrained(self.ckpt_dir)
        self.processor = Wav2Vec2Processor(feature_extractor=feature_extractor, tokenizer=tokenizer)
        self.model = Wav2Vec2ForCTC.from_pretrained(self.ckpt_dir)
        self.model.to(self.device)
        self.model.eval()
        self.blank_id = int(self.processor.tokenizer.pad_token_id)

    def predict(
        self,
        waveform: torch.Tensor,
        target_phonemes: list[str] | None = None,
    ) -> tuple[list[str], torch.Tensor, float]:
        _ = target_phonemes
        if waveform.dim() == 1:
            waveform = waveform.unsqueeze(0)
        audio = waveform.squeeze(0).detach().cpu().numpy()

        inputs = self.processor(
            audio,
            sampling_rate=16000,
            return_tensors="pt",
            padding=True,
        )
        input_values = inputs.input_values.to(self.device)
        attention_mask = inputs.get("attention_mask")
        if attention_mask is not None:
            attention_mask = attention_mask.to(self.device)

        with torch.inference_mode():
            outputs = self.model(input_values=input_values, attention_mask=attention_mask)
            logits = outputs.logits.detach().cpu()
            probs = torch.softmax(logits, dim=-1)
            pred_ids = logits.argmax(dim=-1)[0].tolist()
            confidence = float(probs.max(dim=-1).values.mean())

        collapsed = _ctc_collapse(pred_ids, self.blank_id)
        tokens = self.processor.tokenizer.convert_ids_to_tokens(collapsed)
        phonemes = [t for t in tokens if t not in _SKIP_TOKENS]
        if not phonemes:
            phonemes = ["<sil>"]

        return phonemes, logits, confidence
