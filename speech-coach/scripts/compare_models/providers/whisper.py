"""OpenAI Whisper (large-v3) 로컬 추론 wrapper. 한글 텍스트만 반환한다.

IPA 변환(g2p)은 이 provider의 책임이 아니라 `compare_models.py`(오케스트레이터)가
`utils/g2p.py`로 일괄 처리한다 — 모든 상용 provider가 같은 g2p 경로를 타도록
하기 위함.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

import numpy as np
import torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor


@dataclass
class PredictionResult:
    pred_text: str
    elapsed_sec: float


class WhisperProvider:
    def __init__(self, device: str, model_name: str = "openai/whisper-large-v3") -> None:
        self.device = device
        self.dtype = torch.bfloat16 if device.startswith("cuda") else torch.float32
        self.processor = WhisperProcessor.from_pretrained(model_name)
        self.model = WhisperForConditionalGeneration.from_pretrained(model_name, torch_dtype=self.dtype)
        self.model.to(device)
        self.model.eval()

    def predict_batch(self, audios: list[np.ndarray], batch_size: int = 8) -> list[PredictionResult]:
        results: list[PredictionResult] = []
        for start in range(0, len(audios), batch_size):
            chunk = audios[start : start + batch_size]
            t0 = time.time()
            inputs = self.processor(
                chunk, sampling_rate=16000, return_tensors="pt", padding=True, return_attention_mask=True
            )
            input_features = inputs.input_features.to(self.device, dtype=self.dtype)
            attention_mask = inputs.attention_mask.to(self.device)
            with torch.no_grad():
                # language/task 직접 지정(신형 API) — forced_decoder_ids는 attention_mask와
                # 조합 시 pad==eos 토큰 문제로 EOS를 못 만나 max_length까지 폭주할 수 있음.
                # max_new_tokens로도 이중 안전장치.
                generated_ids = self.model.generate(
                    input_features,
                    attention_mask=attention_mask,
                    language="korean",
                    task="transcribe",
                    max_new_tokens=64,
                )
            texts = self.processor.batch_decode(generated_ids, skip_special_tokens=True)
            batch_elapsed = time.time() - t0
            per_utt_elapsed = batch_elapsed / max(len(chunk), 1)
            for text in texts:
                results.append(PredictionResult(pred_text=text.strip(), elapsed_sec=per_utt_elapsed))
        return results
