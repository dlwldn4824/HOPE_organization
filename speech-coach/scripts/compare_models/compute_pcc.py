#!/usr/bin/env python3
"""PCC(Percentage of Consonants Correct) 산출.

## 정답/예측 소스

`--input`은 두 형태를 모두 받는다:

1. `compare_models.py`의 출력 JSONL — 모델별로 중첩된 구조
   (`own`/`whisper`/`<commercial>` 각각 `pred_ipa`). 한 발화(row)당
   **모델 수만큼 별도 PCC row로 풀어서** 출력한다 (예: own/whisper/clova
   3줄).
2. 평평한 `{target_phonemes 또는 target_ipa, pred_ipa, model?}` 페어 JSONL.

정답 시퀀스는 `target_phonemes`(vocab 호환, g2p로 생성된 리스트)를 우선
사용한다. CSV 원본 `target_ipa`(유성음 이음 포함, 음절 단위 묶음)는 공백
분리가 음소 경계와 안 맞아 자음 필터링이 부정확해지므로 쓰지 않는다 —
`compare_models.py`와 동일한 원칙이다.

## 자음 판정

반모음 `w`, `j`는 **자음에서 제외**한다. 프로젝트 `g2p_ko.py`에서 `w`/`j`는
자음표(`_CHO_IPA`)가 아니라 모음 핵을 만드는 `_JUNG_IPA`에서 나오는 글라이드
이므로, 기존 관례를 따른 것이다.

## PCC 계산

자음만 필터링한 target/pred 시퀀스를 Levenshtein 정렬 후:

    PCC(%) = (n_ref_consonants - sub - del) / n_ref_consonants * 100

표준 PCC 정의를 따라 **삽입(insertion)은 분자에서 빼지 않는다** — 정답에
없는 자음이 더 나온 것은 "target 자음을 틀리게 발음했다"는 사건이 아니므로.

## 출력

- `--out`: 발화×모델 단위 CSV — utt_id, model, speaker, category, condition,
  target_consonants, pred_consonants, pcc, severity_band
- `--agg_out`: 화자별·카테고리별·모델별·condition별 평균 PCC 집계 (JSON)
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
from collections import defaultdict
from pathlib import Path

logger = logging.getLogger("compute_pcc")

# 반모음(w, j) 제외 — g2p_ko.py의 _JUNG_IPA(모음 핵) 분류를 따름.
CONSONANTS: frozenset[str] = frozenset(
    {
        "k", "k͈", "kʰ", "t", "t͈", "tʰ", "p", "p͈", "pʰ",
        "s", "s͈", "tɕ", "tɕ͈", "tɕʰ", "n", "m", "ŋ", "ɾ", "l", "h",
    }
)

# 판정 범위 하한 포함 (>=85 mild, >=65 moderate, >=50 severe, else profound).
SEVERITY_BANDS: list[tuple[float, str]] = [
    (85.0, "mild"),
    (65.0, "moderate"),
    (50.0, "severe"),
]


def filter_consonants(tokens: list[str]) -> list[str]:
    return [t for t in tokens if t in CONSONANTS]


def severity_band(pcc: float) -> str:
    for threshold, band in SEVERITY_BANDS:
        if pcc >= threshold:
            return band
    return "profound"


def align_consonants(ref: list[str], hyp: list[str]) -> dict:
    """자음 시퀀스 정렬 -> {n_ref, sub, del, ins, pcc}."""
    n, m = len(ref), len(hyp)
    if n == 0:
        return {"n_ref": 0, "sub": 0, "del": 0, "ins": m, "pcc": 100.0}

    dp = [[0] * (m + 1) for _ in range(n + 1)]
    bt = [[""] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        dp[i][0], bt[i][0] = i, "D"
    for j in range(1, m + 1):
        dp[0][j], bt[0][j] = j, "I"
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if ref[i - 1] == hyp[j - 1]:
                dp[i][j], bt[i][j] = dp[i - 1][j - 1], "M"
                continue
            sub_cost, del_cost, ins_cost = dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1
            best = min(sub_cost, del_cost, ins_cost)
            dp[i][j] = best
            bt[i][j] = "S" if best == sub_cost else ("D" if best == del_cost else "I")

    sub = del_ = ins = 0
    i, j = n, m
    while i > 0 or j > 0:
        op = bt[i][j]
        if op == "M":
            i, j = i - 1, j - 1
        elif op == "S":
            sub += 1
            i, j = i - 1, j - 1
        elif op == "D":
            del_ += 1
            i -= 1
        elif op == "I":
            ins += 1
            j -= 1
        else:
            break

    correct = n - sub - del_
    return {"n_ref": n, "sub": sub, "del": del_, "ins": ins, "pcc": 100.0 * correct / n}


def _to_tokens(value) -> list[str]:
    if isinstance(value, list):
        return [str(v) for v in value]
    return str(value or "").split()


def load_pcc_rows(path: Path) -> list[dict]:
    """compare_models.py 중첩 출력 또는 평평한 pair 출력 모두 지원.

    반환: [{utt_id, model, speaker, category, condition, target_tokens, pred_tokens}, ...]
    """
    out: list[dict] = []
    known_models = ("own", "whisper", "clova", "google")
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        row = json.loads(line)
        base = {
            "utt_id": row.get("utt_id"),
            "speaker": row.get("speaker", row.get("utt_id", "").split("_")[0] if row.get("utt_id") else None),
            "category": row.get("category"),
            "condition": row.get("condition"),
        }
        target_tokens = _to_tokens(row.get("target_phonemes") or row.get("target_ipa"))

        nested_models = [k for k in known_models if isinstance(row.get(k), dict)]
        if nested_models:
            for model in nested_models:
                block = row[model]
                if block.get("error"):
                    logger.warning("utt_id=%s model=%s: 예측 오류로 스킵 (%s)", base["utt_id"], model, block["error"])
                    continue
                pred_tokens = _to_tokens(block.get("pred_ipa"))
                out.append({**base, "model": model, "target_tokens": target_tokens, "pred_tokens": pred_tokens})
        else:
            pred_tokens = _to_tokens(row.get("pred_ipa"))
            out.append(
                {**base, "model": row.get("model", "unknown"), "target_tokens": target_tokens, "pred_tokens": pred_tokens}
            )
    return out


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--input", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--agg_out", type=Path, required=True)
    p.add_argument("--verbose", action="store_true")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    rows = load_pcc_rows(args.input)
    logger.info("입력 로드: %d개 (발화×모델) row", len(rows))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.agg_out.parent.mkdir(parents=True, exist_ok=True)

    by_model: dict[str, list[float]] = defaultdict(list)
    by_model_category: dict[tuple[str, str], list[float]] = defaultdict(list)
    by_model_speaker: dict[tuple[str, str], list[float]] = defaultdict(list)
    by_model_condition: dict[tuple[str, str], list[float]] = defaultdict(list)
    band_counts: dict[tuple[str, str], int] = defaultdict(int)

    out_rows: list[dict] = []
    for r in rows:
        target_cons = filter_consonants(r["target_tokens"])
        pred_cons = filter_consonants(r["pred_tokens"])
        if not target_cons:
            logger.warning("utt_id=%s model=%s: target 자음 시퀀스가 비어 있음, 스킵", r["utt_id"], r["model"])
            continue
        aligned = align_consonants(target_cons, pred_cons)
        pcc = round(aligned["pcc"], 4)
        band = severity_band(pcc)

        out_rows.append(
            {
                "utt_id": r["utt_id"],
                "model": r["model"],
                "speaker": r["speaker"],
                "category": r["category"],
                "condition": r["condition"],
                "target_consonants": " ".join(target_cons),
                "pred_consonants": " ".join(pred_cons),
                "pcc": pcc,
                "severity_band": band,
            }
        )
        by_model[r["model"]].append(pcc)
        by_model_category[(r["model"], r["category"] or "unknown")].append(pcc)
        by_model_speaker[(r["model"], r["speaker"] or "unknown")].append(pcc)
        by_model_condition[(r["model"], r["condition"] or "unknown")].append(pcc)
        band_counts[(r["model"], band)] += 1

    with args.out.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "utt_id", "model", "speaker", "category", "condition",
                "target_consonants", "pred_consonants", "pcc", "severity_band",
            ],
        )
        writer.writeheader()
        writer.writerows(out_rows)
    logger.info("완료: %s (%d행)", args.out, len(out_rows))

    def _mean(xs: list[float]) -> float | None:
        return round(sum(xs) / len(xs), 4) if xs else None

    agg = {
        "n_rows": len(out_rows),
        "mean_pcc_by_model": {m: _mean(v) for m, v in by_model.items()},
        "mean_pcc_by_model_and_category": {f"{m}|{c}": _mean(v) for (m, c), v in by_model_category.items()},
        "mean_pcc_by_model_and_speaker": {f"{m}|{s}": _mean(v) for (m, s), v in by_model_speaker.items()},
        "mean_pcc_by_model_and_condition": {f"{m}|{c}": _mean(v) for (m, c), v in by_model_condition.items()},
        "severity_band_counts": {f"{m}|{b}": n for (m, b), n in band_counts.items()},
    }
    args.agg_out.write_text(json.dumps(agg, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info("집계 저장: %s", args.agg_out)


if __name__ == "__main__":
    main()
