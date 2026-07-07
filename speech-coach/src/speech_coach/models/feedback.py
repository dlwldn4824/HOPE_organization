"""Module D — 템플릿 피드백 + 조음 위치 시각 cue (설계서 §5.10)."""

from __future__ import annotations

from speech_coach.data.articulation import (
    build_articulation_cue,
    build_kid_text,
    load_diagram_spec,
    pick_primary_error,
)


class FeedbackGenerator:
    def generate(
        self,
        target_word: str,
        classifications: list[tuple[str, str | None, str, str | None, float | None]],
        pcc_score: float,
    ) -> dict:
        primary = pick_primary_error(classifications)
        cue = None
        if primary:
            tgt, act, status, _variation, z = primary
            cue = build_articulation_cue(tgt, act, status, acoustic_z=z)

        kid_text = build_kid_text(target_word, cue, pcc_score=pcc_score)
        diagram = load_diagram_spec()
        highlight = cue.highlight_regions if cue else []

        return {
            "kid_text": kid_text,
            "practice_word_next": None,
            "articulation": cue.to_dict() if cue else None,
            "diagram": {
                "image": diagram.get("image"),
                "highlight_regions": highlight,
                "regions": diagram.get("regions"),
            },
        }
