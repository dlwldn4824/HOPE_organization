"""multipart 폼 필드 파싱."""

from __future__ import annotations

import json

from speech_coach.data.g2p_ko import g2p_word


def parse_target_phonemes(raw: str | None, target_word: str) -> list[str]:
    """target_phonemes 문자열 → IPA 토큰 리스트.

    - 비어 있으면 target_word 를 g2p 로 변환
    - JSON 배열: ``["s","a","g","w","a"]``
    - 쉼표 구분: ``s,a,g,w,a``
    """
    text = (raw or "").strip()
    if not text:
        word = target_word.strip()
        if not word:
            raise ValueError("target_word 또는 target_phonemes 중 하나는 필요합니다.")
        return g2p_word(word)

    try:
        phones = json.loads(text)
        if isinstance(phones, list) and phones and all(isinstance(p, str) for p in phones):
            return phones
        if isinstance(phones, list) and not phones:
            return g2p_word(target_word.strip()) if target_word.strip() else []
    except json.JSONDecodeError:
        pass

    if "," in text or not text.startswith("["):
        parts = [p.strip() for p in text.split(",") if p.strip()]
        if parts:
            return parts

    raise ValueError(
        'target_phonemes 형식 오류. 예: ["s","a","g","w","a"] 또는 s,a,g,w,a '
        "(비워두면 target_word에서 자동 변환)"
    )
