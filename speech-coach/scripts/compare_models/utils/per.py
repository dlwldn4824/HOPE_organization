"""Levenshtein 기반 PER 계산 (sub/ins/del 개별 카운트).

`eval_per_utterance.py`의 `compute_per_and_errors`와 동일 알고리즘. 이 트리는
독립 실행 스크립트 묶음이라 import 편의를 위해 자체 보유한다.
"""

from __future__ import annotations


def compute_per_and_errors(ref: list[str], hyp: list[str]) -> dict:
    """정답/예측 음소 리스트 -> {sub, ins, del, edit_distance, per, n_ref}.

    n_ref == 0인 경우는 호출부에서 처리 (여기서는 n=0이면 per=0.0 반환).
    """
    n, m = len(ref), len(hyp)
    if n == 0:
        return {"sub": 0, "ins": m, "del": 0, "edit_distance": m, "per": 0.0, "n_ref": 0}

    dp = [[0] * (m + 1) for _ in range(n + 1)]
    bt = [[""] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        dp[i][0] = i
        bt[i][0] = "D"
    for j in range(1, m + 1):
        dp[0][j] = j
        bt[0][j] = "I"
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if ref[i - 1] == hyp[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
                bt[i][j] = "M"
                continue
            sub_cost = dp[i - 1][j - 1] + 1
            del_cost = dp[i - 1][j] + 1
            ins_cost = dp[i][j - 1] + 1
            best = min(sub_cost, del_cost, ins_cost)
            dp[i][j] = best
            bt[i][j] = "S" if best == sub_cost else ("D" if best == del_cost else "I")

    sub = ins = del_ = 0
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

    edit_distance = dp[n][m]
    return {
        "sub": sub,
        "ins": ins,
        "del": del_,
        "edit_distance": edit_distance,
        "per": 100.0 * edit_distance / n,
        "n_ref": n,
    }
