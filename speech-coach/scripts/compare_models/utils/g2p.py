"""상용 STT의 한글 출력 -> IPA 변환. 프로젝트의 `g2p_ko`를 그대로 사용한다.

문장부호·조사까지 통째로 g2p에 넣는다 (예: "사부기입니다" -> 어미 "입니다"까지
IPA로 변환됨). 이는 의도된 동작이다 — LM이 무의미어를 문장으로 "늘려서" 답하는
것 자체가 상용 STT의 오류 은폐 경향을 보여주는 증거이므로, 어미를 잘라내지 않고
그대로 PER에 반영한다.
"""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_SRC = Path(__file__).resolve().parents[3] / "src"
if str(_REPO_SRC) not in sys.path:
    sys.path.insert(0, str(_REPO_SRC))

from speech_coach.data.g2p_ko import g2p_sentence  # noqa: E402


def text_to_ipa(text: str) -> list[str]:
    """한글(또는 혼합) 텍스트 -> vocab 호환 IPA 토큰 리스트."""
    return g2p_sentence(text or "")


def ipa_to_str(tokens: list[str]) -> str:
    return " ".join(tokens)
