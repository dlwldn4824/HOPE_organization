"""Naver CLOVA Speech Recognition (단문 인식, 구 AI·NAVER API) wrapper.

2026-07-22 실제 API 호출로 계약 검증 완료 (이전 버전은 추정치였음 — 장문 인식
API를 잘못 가정했었다). 실제 계약:

    POST https://naveropenapi.apigw.ntruss.com/recog/v1/stt?lang=Kor
    Headers:
      X-NCP-APIGW-API-KEY-ID: {client_id}
      X-NCP-APIGW-API-KEY: {client_secret}
      Content-Type: application/octet-stream
    Body: 오디오 바이트 그대로 (멀티파트 아님)
    응답: {"text": "..."}

환경변수: `NCP_CLOVA_CLIENT_ID`, `NCP_CLOVA_CLIENT_SECRET`
"""

from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass
from pathlib import Path

import requests

logger = logging.getLogger("providers.clova")

_ENDPOINT = "https://naveropenapi.apigw.ntruss.com/recog/v1/stt"


@dataclass
class PredictionResult:
    pred_text: str
    elapsed_sec: float
    error: str | None = None


def is_configured() -> bool:
    return bool(os.environ.get("NCP_CLOVA_CLIENT_ID") and os.environ.get("NCP_CLOVA_CLIENT_SECRET"))


class ClovaProvider:
    def __init__(self, retries: int = 3, timeout_sec: float = 30.0, lang: str = "Kor") -> None:
        client_id = os.environ.get("NCP_CLOVA_CLIENT_ID")
        client_secret = os.environ.get("NCP_CLOVA_CLIENT_SECRET")
        if not client_id or not client_secret:
            raise RuntimeError("NCP_CLOVA_CLIENT_ID / NCP_CLOVA_CLIENT_SECRET 환경변수가 필요합니다.")
        self.headers = {
            "X-NCP-APIGW-API-KEY-ID": client_id,
            "X-NCP-APIGW-API-KEY": client_secret,
            "Content-Type": "application/octet-stream",
        }
        self.lang = lang
        self.retries = retries
        self.timeout_sec = timeout_sec

    def predict_one(self, audio_path: Path) -> PredictionResult:
        last_err: Exception | None = None
        for attempt in range(1, self.retries + 1):
            t0 = time.time()
            try:
                audio_bytes = audio_path.read_bytes()
                resp = requests.post(
                    _ENDPOINT,
                    params={"lang": self.lang},
                    headers=self.headers,
                    data=audio_bytes,
                    timeout=self.timeout_sec,
                )
                resp.raise_for_status()
                data = resp.json()
                text = str(data.get("text", ""))
                return PredictionResult(pred_text=text, elapsed_sec=time.time() - t0, error=None)
            except (requests.RequestException, ValueError, KeyError) as e:
                last_err = e
                logger.warning("Clova 호출 실패 (%d/%d) %s: %s", attempt, self.retries, audio_path.name, e)
                if attempt < self.retries:
                    time.sleep(1.0 * attempt)

        return PredictionResult(pred_text="", elapsed_sec=0.0, error=str(last_err))
