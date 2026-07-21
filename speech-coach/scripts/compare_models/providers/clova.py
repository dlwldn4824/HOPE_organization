"""Naver Clova Speech Recognition (장문 인식 REST API) wrapper.

API를 실제로 호출해 계약을 검증할 수 없는 환경에서 작성되었다. 아래 요청
형식(`/recognizer/upload`, `X-CLOVASPEECH-API-KEY` 헤더, `media`+`params`
멀티파트)은 Naver Clova Speech 공개 문서 기준 추정이며, **처음 실행 전에
실제 API 문서와 대조 확인이 필요하다.** 실패 시 예외를 그대로 삼키지 않고
`PredictionResult.error`에 남기므로, 계약이 다르면 전량 실패로 즉시 드러난다.

환경변수: `CLOVA_INVOKE_URL`, `CLOVA_SECRET`
"""

from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass
from pathlib import Path

import requests

logger = logging.getLogger("providers.clova")


@dataclass
class PredictionResult:
    pred_text: str
    elapsed_sec: float
    error: str | None = None


def is_configured() -> bool:
    return bool(os.environ.get("CLOVA_INVOKE_URL") and os.environ.get("CLOVA_SECRET"))


class ClovaProvider:
    def __init__(self, retries: int = 3, timeout_sec: float = 30.0) -> None:
        invoke_url = os.environ.get("CLOVA_INVOKE_URL")
        secret = os.environ.get("CLOVA_SECRET")
        if not invoke_url or not secret:
            raise RuntimeError("CLOVA_INVOKE_URL / CLOVA_SECRET 환경변수가 필요합니다.")
        self.invoke_url = invoke_url.rstrip("/")
        self.secret = secret
        self.retries = retries
        self.timeout_sec = timeout_sec

    def predict_one(self, audio_path: Path) -> PredictionResult:
        url = f"{self.invoke_url}/recognizer/upload"
        headers = {"X-CLOVASPEECH-API-KEY": self.secret}
        params = {"language": "ko-KR", "completion": "sync"}

        last_err: Exception | None = None
        for attempt in range(1, self.retries + 1):
            t0 = time.time()
            try:
                with audio_path.open("rb") as f:
                    files = {
                        "media": (audio_path.name, f, "audio/wav"),
                        "params": (None, json.dumps(params), "application/json"),
                    }
                    resp = requests.post(url, headers=headers, files=files, timeout=self.timeout_sec)
                resp.raise_for_status()
                data = resp.json()
                text = str(data.get("text", ""))
                return PredictionResult(pred_text=text, elapsed_sec=time.time() - t0, error=None)
            except (requests.RequestException, ValueError, KeyError) as e:
                last_err = e
                logger.warning("Clova 호출 실패 (%d/%d) %s: %s", attempt, self.retries, audio_path.name, e)

        return PredictionResult(pred_text="", elapsed_sec=0.0, error=str(last_err))
