"""FastAPI 서버 — §3.4 POST /v1/utterance/analyze."""

from __future__ import annotations

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import RedirectResponse

from speech_coach import __version__
from speech_coach.serving.form_parsers import parse_target_phonemes
from speech_coach.serving.pipeline import InferencePipeline

app = FastAPI(
    title="speech-coach",
    version=__version__,
    description="HOPE 조음 교정 API — Swagger에서 wav 업로드 후 Try it out",
)
_pipeline: InferencePipeline | None = None


def get_pipeline() -> InferencePipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = InferencePipeline.from_stub()
    return _pipeline


@app.get("/")
def root() -> RedirectResponse:
    """루트 접속 시 Swagger UI로 이동."""
    return RedirectResponse(url="/docs")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__}


@app.post("/v1/utterance/analyze")
async def analyze(
    audio: UploadFile = File(..., description="16kHz mono WAV, ≤5s"),
    target_word: str = Form(..., examples=["사과"]),
    target_phonemes: str = Form(
        "",
        description='IPA JSON 배열. 비우면 target_word 자동 변환. 예: ["s","a","g","w","a"]',
        examples=['["s","a","g","w","a"]'],
    ),
    user_id: str | None = Form(None, examples=["kid_001"]),
):
    _ = user_id
    try:
        phones = parse_target_phonemes(target_phonemes, target_word)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    raw = await audio.read()
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="audio too large")

    try:
        out = get_pipeline()(raw, target_word=target_word, target_phonemes=phones)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return out.model_dump()
