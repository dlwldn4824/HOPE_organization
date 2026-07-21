"""Google Cloud Speech-to-Text wrapper — Clova 미설정 시 대체 provider.

`google-cloud-speech` 필요 (`pip install google-cloud-speech`), 인증은
`GOOGLE_APPLICATION_CREDENTIALS` 환경변수의 서비스 계정 키를 사용한다
(표준 GCP 클라이언트 인증 방식).
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger("providers.google")


@dataclass
class PredictionResult:
    pred_text: str
    elapsed_sec: float
    error: str | None = None


class GoogleProvider:
    def __init__(self, retries: int = 3, sample_rate_hz: int = 16000) -> None:
        try:
            from google.cloud import speech
        except ImportError as e:
            raise RuntimeError("google-cloud-speech 가 설치되어 있지 않습니다: pip install google-cloud-speech") from e

        self._speech = speech
        self.client = speech.SpeechClient()
        self.retries = retries
        self.config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=sample_rate_hz,
            language_code="ko-KR",
        )

    def predict_one(self, audio_path: Path) -> PredictionResult:
        content = audio_path.read_bytes()
        audio = self._speech.RecognitionAudio(content=content)

        last_err: Exception | None = None
        for attempt in range(1, self.retries + 1):
            t0 = time.time()
            try:
                resp = self.client.recognize(config=self.config, audio=audio)
                text = " ".join(r.alternatives[0].transcript for r in resp.results if r.alternatives)
                return PredictionResult(pred_text=text, elapsed_sec=time.time() - t0, error=None)
            except Exception as e:  # noqa: BLE001 - 외부 API 예외는 재시도 후 스킵 대상으로 통일 처리
                last_err = e
                logger.warning("Google STT 호출 실패 (%d/%d) %s: %s", attempt, self.retries, audio_path.name, e)

        return PredictionResult(pred_text="", elapsed_sec=0.0, error=str(last_err))
