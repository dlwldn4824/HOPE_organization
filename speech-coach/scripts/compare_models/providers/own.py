"""자체 모델 (Wav2Vec2-CTC, Stage 2) 추론 wrapper. IPA를 직접 출력한다."""

from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch
from transformers import Wav2Vec2CTCTokenizer, Wav2Vec2FeatureExtractor, Wav2Vec2ForCTC

_SKIP_TOKENS = frozenset({"<pad>", "<unk>", "<sil>", "<eos>", "<s>", "</s>", "|", ""})


@dataclass
class PredictionResult:
    pred_text: str
    pred_ipa: list[str]
    elapsed_sec: float


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


class OwnModelProvider:
    """`eval_per_utterance.py`와 동일한 greedy CTC 추론 방식."""

    def __init__(self, ckpt_dir: str | Path, device: str, base_model: str = "facebook/wav2vec2-xls-r-300m") -> None:
        self.device = device
        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(base_model)
        self.tokenizer = Wav2Vec2CTCTokenizer.from_pretrained(str(ckpt_dir))
        self.model = Wav2Vec2ForCTC.from_pretrained(str(ckpt_dir))
        self.model.to(device)
        self.model.eval()
        self.blank_id = int(self.tokenizer.pad_token_id)

    def predict_batch(self, audios: list[np.ndarray], batch_size: int = 8) -> list[PredictionResult]:
        results: list[PredictionResult] = []
        for start in range(0, len(audios), batch_size):
            chunk = audios[start : start + batch_size]
            t0 = time.time()
            inputs = self.feature_extractor(
                chunk, sampling_rate=16000, return_tensors="pt", padding=True, return_attention_mask=True
            )
            input_values = inputs.input_values.to(self.device)
            attention_mask = inputs.attention_mask.to(self.device)

            autocast_kwargs = (
                {"device_type": "cuda", "dtype": torch.bfloat16}
                if self.device.startswith("cuda")
                else {"device_type": "cpu", "enabled": False}
            )
            with torch.no_grad(), torch.autocast(**autocast_kwargs):
                logits = self.model(input_values=input_values, attention_mask=attention_mask).logits
            pred_ids_batch = logits.float().argmax(dim=-1).cpu().tolist()
            batch_elapsed = time.time() - t0
            per_utt_elapsed = batch_elapsed / max(len(chunk), 1)

            for pred_ids in pred_ids_batch:
                collapsed = _ctc_collapse(pred_ids, self.blank_id)
                tokens = self.tokenizer.convert_ids_to_tokens(collapsed)
                phonemes = [t for t in tokens if t not in _SKIP_TOKENS]
                results.append(
                    PredictionResult(pred_text=" ".join(phonemes), pred_ipa=phonemes, elapsed_sec=per_utt_elapsed)
                )
        return results
