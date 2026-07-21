"""한글 문장/단어 → 설계서 §5.2 IPA 토큰열 (jamo 분해 + 규칙 매핑)."""

from __future__ import annotations

import re

from speech_coach.data.ipa_vocab import PHONEME_TO_ID, filter_to_vocab

# Unicode Hangul decomposition (가 = U+AC00)
_CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"
_JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"
_JONG = " ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"  # index 0 = no coda (space placeholder, unused)

_CHO_IPA: dict[str, str | None] = {
    "ㄱ": "k",
    "ㄲ": "k͈",
    "ㄴ": "n",
    "ㄷ": "t",
    "ㄸ": "t͈",
    "ㄹ": "l",
    "ㅁ": "m",
    "ㅂ": "p",
    "ㅃ": "p͈",
    "ㅅ": "s",
    "ㅆ": "s͈",
    "ㅇ": None,
    "ㅈ": "tɕ",
    "ㅉ": "tɕ͈",
    "ㅊ": "tɕʰ",
    "ㅋ": "kʰ",
    "ㅌ": "tʰ",
    "ㅍ": "pʰ",
    "ㅎ": "h",
}

# 중성 → IPA 토큰 시퀀스 (설계 vocab 안에서만)
_JUNG_IPA: dict[str, list[str]] = {
    "ㅏ": ["a"],
    "ㅐ": ["ɛ"],
    "ㅑ": ["j", "a"],
    "ㅒ": ["j", "ɛ"],
    "ㅓ": ["ʌ"],
    "ㅔ": ["e"],
    "ㅕ": ["j", "ʌ"],
    "ㅖ": ["j", "e"],
    "ㅗ": ["o"],
    "ㅘ": ["w", "a"],
    "ㅙ": ["w", "ɛ"],
    "ㅚ": ["ø"],
    "ㅛ": ["j", "o"],
    "ㅜ": ["u"],
    "ㅝ": ["w", "u"],  # TODO: 음성학적으로는 ["w", "ʌ"]가 맞음(ㅕ:[j,ʌ]와 대칭).
    # stage1b-mix/stage2-final이 이 매핑으로 학습되어 지금 고치면 기존 체크포인트
    # 평가와 어긋나므로, 다음 재학습 때 함께 수정할 것 (2026-07-21 발견).
    "ㅞ": ["w", "e"],
    "ㅟ": ["y"],
    "ㅠ": ["j", "u"],
    "ㅡ": ["ɯ"],
    "ㅢ": ["ɯ", "i"],
    "ㅣ": ["i"],
}

# 받침 → IPA (단순화: 복합받침은 첫 자음 위주)
_JONG_IPA: dict[str, list[str]] = {
    "ㄱ": ["k"],
    "ㄲ": ["k͈"],
    "ㄳ": ["k"],  # 근사
    "ㄴ": ["n"],
    "ㄵ": ["n"],  # 근사
    "ㄶ": ["n"],
    "ㄷ": ["t"],
    "ㄹ": ["l"],
    "ㄺ": ["l"],
    "ㄻ": ["l"],
    "ㄼ": ["l"],
    "ㄽ": ["l"],
    "ㄾ": ["l"],
    "ㄿ": ["l"],
    "ㅀ": ["l"],
    "ㅁ": ["m"],
    "ㅂ": ["p"],
    "ㅄ": ["p"],
    "ㅅ": ["t"],  # 사실 ㄷ 받침 유사 — 근사
    "ㅆ": ["t"],
    "ㅇ": ["ŋ"],
    "ㅈ": ["t"],
    "ㅊ": ["t"],
    "ㅋ": ["k"],
    "ㅌ": ["t"],
    "ㅍ": ["p"],
    "ㅎ": ["t"],
}


def _decompose_syllable(ch: str) -> tuple[str, str, str] | None:
    o = ord(ch)
    if o < 0xAC00 or o > 0xD7A3:
        return None
    s = o - 0xAC00
    jong = s % 28
    jung = (s // 28) % 21
    cho = s // 28 // 21
    jc = _JONG[jong] if jong > 0 else ""
    jc = jc.strip() if jc else ""
    return _CHO[cho], _JUNG[jung], jc


def _syllable_to_ipa(ch: str) -> list[str]:
    d = _decompose_syllable(ch)
    if d is None:
        return []
    cho, jung, jong = d
    out: list[str] = []
    cipa = _CHO_IPA.get(cho)
    if cipa:
        out.append(cipa)
    out.extend(_JUNG_IPA.get(jung, []))
    if jong and jong in _JONG_IPA:
        out.extend(_JONG_IPA[jong])
    return out


def normalize_kspon_transcript(text: str) -> str:
    """Kspon trn 특수 표기 제거·공백 정리."""
    t = re.sub(r"\s*[a-z]/\s*", " ", text, flags=re.I)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def g2p_sentence(text: str) -> list[str]:
    """
    한글 포함 문장 → IPA 토큰 리스트 (설계 vocab에 없는 기호는 이후 filter에서 <unk>).
    """
    text = normalize_kspon_transcript(text)
    tokens: list[str] = []
    for ch in text:
        if ch.isspace():
            continue
        if "가" <= ch <= "힣":
            tokens.extend(_syllable_to_ipa(ch))
        elif ch in ".,?!…:;\"'()-":
            continue
        elif "0" <= ch <= "9" or ("A" <= ch <= "Z") or ("a" <= ch <= "z"):
            continue
        else:
            # 한글 자모 단독 등
            if ch in _CHO_IPA:
                ipa = _CHO_IPA[ch]
                if ipa:
                    tokens.append(ipa)
            elif ch in _JUNG_IPA:
                tokens.extend(_JUNG_IPA[ch])
    return filter_to_vocab(tokens)


def g2p_word(word: str) -> list[str]:
    """단어 단위 (공백·문장부호 없이 한 글자씩 처리)."""
    return g2p_sentence(word.strip())


def phoneme_ids(labels: list[str]) -> list[int]:
    """CTC 라벨 id (pad 제외, blank는 loss에서 처리)."""
    return [PHONEME_TO_ID.get(p, PHONEME_TO_ID["<unk>"]) for p in labels]
