"""Wav2Vec2-CTC manifest PER 평가."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import numpy as np
import torch
from torch.utils.data import DataLoader
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

from speech_coach.eval.ctc_decode import label_ids_to_phoneme_sequences, pred_ids_to_phoneme_sequences
from speech_coach.eval.metrics import _edit_distance, phoneme_error_rate
from speech_coach.training.ctc_collator import DataCollatorCTCWithPadding
from speech_coach.training.ctc_dataset import ManifestJsonlDataset


@dataclass
class EvalReport:
    manifest: str
    checkpoint: str
    num_utterances: int
    per: float
    per_percent: float
    num_ref_phonemes: int
    num_errors: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def infer_val_manifest(train_manifest: Path) -> Path | None:
    name = train_manifest.name
    if name.endswith("_train.jsonl"):
        candidate = train_manifest.with_name(name.replace("_train.jsonl", "_val.jsonl"))
        if candidate.is_file():
            return candidate
    return None


def compute_per_from_predictions(
    pred_ids: np.ndarray,
    label_ids: np.ndarray,
    *,
    blank_id: int = 0,
) -> tuple[float, int, int]:
    refs = label_ids_to_phoneme_sequences(label_ids)
    hyps = pred_ids_to_phoneme_sequences(pred_ids, blank_id=blank_id)
    per_ratio = phoneme_error_rate(refs, hyps)
    num_errors = sum(_edit_distance(ref, hyp) for ref, hyp in zip(refs, hyps, strict=True))
    num_ref_phonemes = sum(len(ref) for ref in refs)
    return per_ratio, num_ref_phonemes, num_errors


def build_compute_metrics(blank_id: int = 0):
    def compute_metrics(eval_pred) -> dict[str, float]:
        pred_ids = eval_pred.predictions
        label_ids = eval_pred.label_ids
        if isinstance(pred_ids, tuple):
            pred_ids = pred_ids[0]
        if pred_ids.ndim == 3:
            pred_ids = np.argmax(pred_ids, axis=-1)
        per_ratio, _, _ = compute_per_from_predictions(pred_ids, label_ids, blank_id=blank_id)
        return {"per": per_ratio, "per_percent": per_ratio * 100.0}

    return compute_metrics


def preprocess_logits_for_metrics(logits: np.ndarray, _labels) -> np.ndarray:
    if isinstance(logits, tuple):
        logits = logits[0]
    return np.argmax(logits, axis=-1)


@torch.inference_mode()
def evaluate_manifest(
    checkpoint_dir: str | Path,
    manifest_path: str | Path,
    *,
    repo_root: Path | None = None,
    batch_size: int = 4,
    max_samples: int | None = None,
    device: str | None = None,
) -> EvalReport:
    ckpt = Path(checkpoint_dir)
    manifest = Path(manifest_path)
    if not ckpt.is_dir():
        raise FileNotFoundError(f"checkpoint not found: {ckpt}")
    if not manifest.is_file():
        raise FileNotFoundError(f"manifest not found: {manifest}")

    processor = Wav2Vec2Processor.from_pretrained(str(ckpt))
    model = Wav2Vec2ForCTC.from_pretrained(str(ckpt))
    dev = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
    model.to(dev)
    model.eval()

    dataset = ManifestJsonlDataset(manifest, repo_root=repo_root, max_samples=max_samples)
    if len(dataset) == 0:
        raise ValueError(f"manifest is empty after filtering: {manifest}")

    collator = DataCollatorCTCWithPadding(processor=processor, pad_to_multiple_of=None)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, collate_fn=collator)

    blank_id = int(processor.tokenizer.pad_token_id)
    all_refs: list[list[str]] = []
    all_hyps: list[list[str]] = []

    for batch in loader:
        labels = batch.pop("labels")
        batch = {k: v.to(dev) for k, v in batch.items()}
        logits = model(**batch).logits.detach().cpu().numpy()
        pred_ids = np.argmax(logits, axis=-1)
        refs = label_ids_to_phoneme_sequences(labels.numpy())
        hyps = pred_ids_to_phoneme_sequences(pred_ids, blank_id=blank_id)
        all_refs.extend(refs)
        all_hyps.extend(hyps)

    per_ratio = phoneme_error_rate(all_refs, all_hyps)
    num_errors = sum(_edit_distance(ref, hyp) for ref, hyp in zip(all_refs, all_hyps, strict=True))
    num_ref_phonemes = sum(len(ref) for ref in all_refs)

    return EvalReport(
        manifest=str(manifest),
        checkpoint=str(ckpt),
        num_utterances=len(all_refs),
        per=per_ratio,
        per_percent=round(per_ratio * 100.0, 4),
        num_ref_phonemes=num_ref_phonemes,
        num_errors=num_errors,
    )


def save_eval_report(report: EvalReport, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
