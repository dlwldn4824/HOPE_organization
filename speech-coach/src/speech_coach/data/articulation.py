"""조음 위치 lookup + 시각 피드백 cue (설계서 §5.10 Module D)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ArticulationRegion = Literal["bilabial", "alveolar", "palatal", "velar", "glottal"]

REGION_LABEL_KO: dict[ArticulationRegion, str] = {
    "bilabial": "순음",
    "alveolar": "치조음",
    "palatal": "경구개음",
    "velar": "연구개음",
    "glottal": "후음",
}

# IPA → 조음 위치 (자음 중심; 모음은 별도 처리)
IPA_TO_REGION: dict[str, ArticulationRegion] = {
    "p": "bilabial",
    "p͈": "bilabial",
    "pʰ": "bilabial",
    "m": "bilabial",
    "t": "alveolar",
    "t͈": "alveolar",
    "tʰ": "alveolar",
    "n": "alveolar",
    "l": "alveolar",
    "s": "alveolar",
    "s͈": "alveolar",
    "tɕ": "palatal",
    "tɕ͈": "palatal",
    "tɕʰ": "palatal",
    "k": "velar",
    "k͈": "velar",
    "kʰ": "velar",
    "ŋ": "velar",
    "h": "glottal",
}

# IPA → 대표 자모 (아이 UI 표시용)
IPA_TO_JAMO: dict[str, str] = {
    "p": "ㅂ",
    "p͈": "ㅃ",
    "pʰ": "ㅍ",
    "m": "ㅁ",
    "t": "ㄷ",
    "t͈": "ㄸ",
    "tʰ": "ㅌ",
    "n": "ㄴ",
    "l": "ㄹ",
    "s": "ㅅ",
    "s͈": "ㅆ",
    "tɕ": "ㅈ",
    "tɕ͈": "ㅉ",
    "tɕʰ": "ㅊ",
    "k": "ㄱ",
    "k͈": "ㄲ",
    "kʰ": "ㅋ",
    "ŋ": "ㅇ",
    "h": "ㅎ",
}

# (target_ipa, actual_ipa) → variation + 아이용 멘트
_ERROR_CUES: dict[tuple[str, str], tuple[str, str]] = {
    ("s", "t"): ("STOPPING", "‘ㅅ’는 바람이 새는 소리예요. 혀끝을 윗니 뒤에 두고 바람을 보내요."),
    ("s", "t͈"): ("STOPPING", "‘ㅅ’는 바람이 새는 소리예요. 혀끝을 윗니 뒤에 두고 바람을 보내요."),
    ("s͈", "t"): ("STOPPING", "‘ㅆ’도 바람 소리예요. 혀끝을 윗니 뒤에 살짝 대고 바람을 보내요."),
    ("s͈", "t͈"): ("STOPPING", "‘ㅆ’도 바람 소리예요. 혀끝을 윗니 뒤에 살짝 대고 바람을 보내요."),
    ("tɕ", "t"): ("STOPPING", "‘ㅈ’는 혀끝을 입천장 앞에 붙였다 떼며 내요."),
    ("tɕ͈", "t͈"): ("STOPPING", "‘ㅉ’는 ‘ㅈ’보다 세게, 혀끝을 입천장에 붙였다 떼요."),
    ("p", "t"): ("SUBSTITUTION", "입술을 맞닿게 해서 ‘ㅂ’ 소리를 내보세요."),
    ("p", "pʰ"): ("ASPIRATION", "입술을 맞닿았다가 부드럽게 떼며 ‘ㅂ’ 소리를 내요."),
    ("pʰ", "p"): ("ASPIRATION", "‘ㅍ’은 ‘ㅂ’보다 바람이 더 세요. 입술을 맞닿게 해보세요."),
    ("k", "t"): ("SUBSTITUTION", "목 뒤쪽(입천장 뒤)에서 ‘ㄱ’ 소리가 나요."),
    ("k", "t͈"): ("SUBSTITUTION", "목 뒤쪽(입천장 뒤)에서 ‘ㄱ’ 소리가 나요."),
    ("l", "w"): ("GLIDE", "혀끝을 윗니 뒤에 대고 ‘ㄹ’ 소리를 길게 이어요."),
}

_STATUS_DEFAULT_TIPS: dict[str, str] = {
    "SUB": "목표 소리 위치에서 다시 천천히 발음해 보세요.",
    "DEL": "이 소리를 빼먹지 않도록 끝까지 또렷하게 말해 보세요.",
    "DIS": "소리가 약하거나 흐려요. 같은 위치에서 더 또렷하게 내 보세요.",
}


@dataclass(frozen=True)
class ArticulationCue:
    target_phoneme: str
    actual_phoneme: str | None
    status: str
    highlight_regions: list[str]
    place_ko: list[str]
    jamo: str | None
    variation: str | None
    tip: str

    def to_dict(self) -> dict:
        return {
            "target_phoneme": self.target_phoneme,
            "actual_phoneme": self.actual_phoneme,
            "status": self.status,
            "highlight_regions": self.highlight_regions,
            "place_ko": self.place_ko,
            "jamo": self.jamo,
            "variation": self.variation,
            "tip": self.tip,
        }


def region_for_ipa(ipa: str | None) -> ArticulationRegion | None:
    if not ipa:
        return None
    return IPA_TO_REGION.get(ipa)


def jamo_for_ipa(ipa: str | None) -> str | None:
    if not ipa:
        return None
    return IPA_TO_JAMO.get(ipa)


def _regions_for_ipa(ipa: str | None) -> list[str]:
    region = region_for_ipa(ipa)
    return [region] if region else []


def _place_labels(regions: list[str]) -> list[str]:
    return [REGION_LABEL_KO[r] for r in regions if r in REGION_LABEL_KO]


def _lookup_error_tip(target: str, actual: str | None, status: str) -> tuple[str | None, str]:
    if actual:
        pair = _ERROR_CUES.get((target, actual))
        if pair:
            return pair[0], pair[1]
    if status in _STATUS_DEFAULT_TIPS:
        jamo = jamo_for_ipa(target) or target
        return status, f"‘{jamo}’ 소리를 다시 해볼까? {_STATUS_DEFAULT_TIPS[status]}"
    return None, "천천히 또렷하게 다시 말해볼까?"


def build_articulation_cue(
    target: str,
    actual: str | None,
    status: str,
    *,
    acoustic_z: float | None = None,
) -> ArticulationCue | None:
    if status == "OK":
        return None

    regions = _regions_for_ipa(target)
    if not regions and actual:
        regions = _regions_for_ipa(actual)

    variation, tip = _lookup_error_tip(target, actual, status)
    if status == "DIS" and acoustic_z is not None:
        tip = f"{tip} (정상 대비 {abs(acoustic_z):.1f}σ)"

    return ArticulationCue(
        target_phoneme=target,
        actual_phoneme=actual,
        status=status,
        highlight_regions=regions,
        place_ko=_place_labels(regions),
        jamo=jamo_for_ipa(target),
        variation=variation,
        tip=tip,
    )


def pick_primary_error(
    classifications: list[tuple[str, str | None, str, str | None, float | None]],
) -> tuple[str, str | None, str, str | None, float | None] | None:
    priority = {"SUB": 0, "DIS": 1, "DEL": 2}
    errors = [row for row in classifications if row[2] != "OK"]
    if not errors:
        return None
    return min(errors, key=lambda row: priority.get(row[2], 9))


def build_kid_text(
    target_word: str,
    cue: ArticulationCue | None,
    *,
    pcc_score: float,
) -> str:
    if cue is None:
        if pcc_score >= 90:
            return f"‘{target_word}’ 아주 잘했어! 계속 연습해보자."
        return f"‘{target_word}’ 잘했어! 조금만 더 또렷하게 해볼까?"

    jamo = cue.jamo or cue.target_phoneme
    actual = cue.actual_phoneme or "?"
    if cue.status == "DEL":
        return f"‘{target_word}’에서 ‘{jamo}’ 소리가 빠졌어. {cue.tip}"
    if cue.status == "DIS":
        return f"‘{target_word}’에서 ‘{jamo}’ 소리가 약했어. {cue.tip}"
    return f"‘{target_word}’에서 ‘{jamo}’ 대신 ‘{actual}’로 들렸어. {cue.tip}"


def load_diagram_spec() -> dict:
    """프론트 overlay용 diagram 메타 (resources/articulation/diagram_regions.json)."""
    from importlib import resources

    import json

    raw = resources.files("speech_coach.resources.articulation").joinpath("diagram_regions.json").read_text(
        encoding="utf-8"
    )
    return json.loads(raw)
