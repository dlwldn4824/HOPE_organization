"""조음 위치 lookup + 시각 피드백."""

from __future__ import annotations

from speech_coach.data.articulation import (
    build_articulation_cue,
    build_kid_text,
    jamo_for_ipa,
    pick_primary_error,
    region_for_ipa,
)
from speech_coach.models.feedback import FeedbackGenerator


def test_region_for_ipa_consonants() -> None:
    assert region_for_ipa("s") == "alveolar"
    assert region_for_ipa("p") == "bilabial"
    assert region_for_ipa("tɕ") == "palatal"
    assert region_for_ipa("k") == "velar"
    assert region_for_ipa("h") == "glottal"


def test_jamo_for_ipa() -> None:
    assert jamo_for_ipa("s") == "ㅅ"
    assert jamo_for_ipa("tɕ") == "ㅈ"


def test_build_articulation_cue_stopping() -> None:
    cue = build_articulation_cue("s", "t", "SUB")
    assert cue is not None
    assert cue.highlight_regions == ["alveolar"]
    assert cue.place_ko == ["치조음"]
    assert cue.jamo == "ㅅ"
    assert "바람" in cue.tip


def test_build_articulation_cue_ok_returns_none() -> None:
    assert build_articulation_cue("a", "a", "OK") is None


def test_pick_primary_error_prefers_substitution() -> None:
    rows = [
        ("a", "a", "OK", None, None),
        ("s", "t", "SUB", "SUBSTITUTION", None),
        ("k", None, "DEL", None, None),
    ]
    primary = pick_primary_error(rows)
    assert primary is not None
    assert primary[0] == "s"


def test_feedback_generator_includes_diagram() -> None:
    gen = FeedbackGenerator()
    out = gen.generate(
        "사과",
        [("s", "t", "SUB", "SUBSTITUTION", None), ("a", "a", "OK", None, None)],
        75.0,
    )
    assert out["articulation"] is not None
    assert out["articulation"]["highlight_regions"] == ["alveolar"]
    assert out["diagram"]["highlight_regions"] == ["alveolar"]
    assert "regions" in out["diagram"]
    assert "ㅅ" in out["kid_text"]


def test_build_kid_text_success() -> None:
    text = build_kid_text("사과", None, pcc_score=95.0)
    assert "잘했어" in text
