"""§3.4 API Contract — 요청/응답 스키마."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class PhonemeResult(BaseModel):
    target: str
    actual: str | None = None
    status: str  # OK | SUB | DEL | DIS
    variation: str | None = None
    acoustic_deviation_z: float | None = None
    phoneme_confidence: float | None = Field(
        default=None,
        description="이 음소 구간의 평균 최대 softmax 확률 (0~1). DEL(예측 없음)이면 null.",
    )


class ArticulationCue(BaseModel):
    """틀린 음소에 대한 조음 위치·아이용 팁."""

    target_phoneme: str
    actual_phoneme: str | None = None
    status: str
    highlight_regions: list[str] = Field(
        description="bilabial | alveolar | palatal | velar | glottal — diagram overlay 키",
    )
    place_ko: list[str] = Field(description="순음, 치조음, … 한글 라벨")
    jamo: str | None = Field(default=None, description="표시용 자모 예: ㅅ")
    variation: str | None = None
    tip: str


class ArticulationDiagram(BaseModel):
    """프론트 조음 단면도 overlay 메타."""

    image: str | None = Field(default=None, description="diagram 파일명 (public 또는 CDN)")
    highlight_regions: list[str] = Field(default_factory=list)
    regions: dict[str, Any] | None = Field(
        default=None,
        description="overlay_pct 등 — diagram_regions.json 내용",
    )


class FeedbackBlock(BaseModel):
    kid_text: str
    practice_word_next: str | None = None
    articulation: ArticulationCue | None = None
    diagram: ArticulationDiagram | None = None


class AnalyzeResponse(BaseModel):
    pcc: float
    confidence: float = Field(
        description="발화 전체 프레임의 평균 최대 softmax 확률 (0~1). 음소별이 아닌 발화 단위 지표.",
    )
    phoneme_results: list[PhonemeResult]
    feedback: FeedbackBlock
    latency_ms: int
    model_version: str


# multipart 필드는 FastAPI에서 개별 인자로 받음; 이 모델은 문서화용
class AnalyzeFormFields(BaseModel):
    """폼 필드 이름 참고용."""

    audio: Any = Field(description="wav ≤5s, 16kHz mono 권장")
    target_word: str
    target_phonemes: str  # JSON 배열 문자열로 전달 권장 — API에서 파싱
    user_id: str | None = None
