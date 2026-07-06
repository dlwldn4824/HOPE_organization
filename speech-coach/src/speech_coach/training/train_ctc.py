"""Wav2Vec2-CTC 파인튜닝 엔트리 (설계서 §5–6 요약 반영)."""

from __future__ import annotations

import os

# Mac MPS에서 CTC loss 미구현 — torch import 전에 설정해야 fallback 적용
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

import inspect
import random
from argparse import ArgumentParser
from pathlib import Path

import numpy as np
import torch
from transformers import (
    Trainer,
    TrainingArguments,
    Wav2Vec2CTCTokenizer,
    Wav2Vec2ForCTC,
    Wav2Vec2Processor,
)

from speech_coach.data.hope_paths import (
    DEFAULT_KSPON_AUDIO_ROOT,
    DEFAULT_KSPON_TRN,
    DEFAULT_MANIFEST,
    HOPE_ROOT,
)
from speech_coach.data.ipa_vocab import build_vocab_json
from speech_coach.eval.ctc_eval import (
    build_compute_metrics,
    infer_val_manifest,
    preprocess_logits_for_metrics,
)
from speech_coach.training.ctc_collator import DataCollatorCTCWithPadding
from speech_coach.training.ctc_dataset import KsponTrnDataset, ManifestJsonlDataset

_HOPE_ROOT = HOPE_ROOT


def _set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def _load_ipa_tokenizer(out_dir: Path) -> Wav2Vec2CTCTokenizer:
    out_dir.mkdir(parents=True, exist_ok=True)
    build_vocab_json(out_dir / "vocab.json")
    return Wav2Vec2CTCTokenizer.from_pretrained(
        str(out_dir),
        unk_token="<unk>",
        pad_token="<pad>",
        word_delimiter_token="|",
    )


def _resolve_eval_manifest(args) -> Path | None:
    if args.eval_manifest is not None:
        return args.eval_manifest
    if args.manifest is not None:
        return infer_val_manifest(args.manifest)
    return None


def run_ctc_training() -> None:
    p = ArgumentParser(description="Wav2Vec2 CTC fine-tuning (manifest 또는 Kspon trn)")
    p.add_argument("--output_dir", type=Path, default=Path("checkpoints/ctc-stage1"))
    p.add_argument("--repo_root", type=Path, default=None, help="hope 루트 (manifest 상대경로 해석)")
    p.add_argument("--manifest", type=Path, default=None)
    p.add_argument("--kspon_trn", type=Path, default=None)
    p.add_argument("--kspon_audio_root", type=Path, default=None)
    p.add_argument("--model_name", type=str, default="facebook/wav2vec2-xls-r-300m")
    p.add_argument("--resume_from", type=Path, default=None, help="기존 CTC 체크포인트에서 가중치·processor 로드")
    p.add_argument("--eval_manifest", type=Path, default=None, help="val manifest (미지정 시 *_train → *_val 자동)")
    p.add_argument("--max_samples", type=int, default=None)
    p.add_argument("--max_steps", type=int, default=1000)
    p.add_argument("--learning_rate", type=float, default=3e-5)
    p.add_argument("--train_batch_size", type=int, default=2)
    p.add_argument("--eval_batch_size", type=int, default=2)
    p.add_argument("--gradient_accumulation_steps", type=int, default=2)
    p.add_argument("--eval_steps", type=int, default=500)
    p.add_argument("--save_steps", type=int, default=500)
    p.add_argument("--adam_beta1", type=float, default=0.9)
    p.add_argument("--adam_beta2", type=float, default=0.98)
    p.add_argument("--weight_decay", type=float, default=0.005)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--bf16", action="store_true")
    p.add_argument("--fp16", action="store_true")
    p.add_argument(
        "--smoke",
        action="store_true",
        help="짧은 스텝·작은 샘플·가벼운 base 모델로 연결만 검증",
    )
    args = p.parse_args()
    _set_seed(args.seed)

    if args.repo_root is None:
        args.repo_root = _HOPE_ROOT

    if args.smoke:
        args.model_name = "facebook/wav2vec2-base-960h"
        args.max_steps = min(args.max_steps, 20)
        args.max_samples = min(args.max_samples or 64, 64)
        args.train_batch_size = min(args.train_batch_size, 1)
        args.eval_batch_size = min(args.eval_batch_size, 1)
        args.gradient_accumulation_steps = 1
        args.eval_steps = min(args.eval_steps, 10)
        args.save_steps = min(args.save_steps, 10)

    if args.manifest is None and (args.kspon_trn is None or args.kspon_audio_root is None):
        if DEFAULT_MANIFEST.is_file():
            args.manifest = DEFAULT_MANIFEST
        elif DEFAULT_KSPON_TRN.is_file():
            args.kspon_trn = args.kspon_trn or DEFAULT_KSPON_TRN
            args.kspon_audio_root = args.kspon_audio_root or DEFAULT_KSPON_AUDIO_ROOT

    if args.manifest:
        ds = ManifestJsonlDataset(
            args.manifest,
            repo_root=args.repo_root,
            max_samples=args.max_samples,
        )
    elif args.kspon_trn and args.kspon_audio_root:
        ds = KsponTrnDataset(
            args.kspon_trn,
            args.kspon_audio_root,
            max_samples=args.max_samples,
        )
    else:
        raise SystemExit(
            "No training data found. Run from hope/speech-coach:\n"
            "  python scripts/extract_hope_data.py\n"
            "  python scripts/prepare_all_manifests.py [--include-d3] [--include-d4]\n"
            "Or pass --manifest / --kspon_trn + --kspon_audio_root"
        )

    if len(ds) == 0:
        raise SystemExit("Dataset is empty — check paths and filters.")

    eval_manifest = _resolve_eval_manifest(args)
    eval_ds = None
    if eval_manifest is not None:
        if not eval_manifest.is_file():
            print(f"warning: eval manifest not found, skipping validation: {eval_manifest}")
        else:
            eval_ds = ManifestJsonlDataset(
                eval_manifest,
                repo_root=args.repo_root,
                max_samples=args.max_samples,
            )
            if len(eval_ds) == 0:
                print(f"warning: eval manifest empty after filtering: {eval_manifest}")
                eval_ds = None
            else:
                print(f"eval manifest: {eval_manifest} ({len(eval_ds)} utterances)")

    if args.resume_from is not None:
        resume_path = args.resume_from
        if not resume_path.is_dir():
            raise SystemExit(f"--resume_from not found: {resume_path}")
        processor = Wav2Vec2Processor.from_pretrained(str(resume_path))
        model = Wav2Vec2ForCTC.from_pretrained(str(resume_path))
        print(f"resumed from {resume_path}")
    else:
        vocab_dir = args.output_dir / "ipa_vocab"
        tokenizer = _load_ipa_tokenizer(vocab_dir)
        from transformers import Wav2Vec2FeatureExtractor

        feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(args.model_name)
        processor = Wav2Vec2Processor(feature_extractor=feature_extractor, tokenizer=tokenizer)

        model = Wav2Vec2ForCTC.from_pretrained(
            args.model_name,
            ctc_loss_reduction="mean",
            pad_token_id=processor.tokenizer.pad_token_id,
            vocab_size=len(processor.tokenizer),
            ignore_mismatched_sizes=True,
        )
        model.freeze_feature_encoder()

    collator = DataCollatorCTCWithPadding(processor=processor, pad_to_multiple_of=None)

    use_bf16 = args.bf16 and torch.cuda.is_available()
    use_fp16 = args.fp16 and torch.cuda.is_available() and not use_bf16

    run_eval = eval_ds is not None and len(eval_ds) > 0
    ta_kwargs = dict(
        output_dir=str(args.output_dir),
        per_device_train_batch_size=args.train_batch_size,
        per_device_eval_batch_size=args.eval_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        learning_rate=args.learning_rate,
        warmup_ratio=0.1,
        max_steps=args.max_steps,
        save_steps=args.save_steps,
        logging_steps=25,
        fp16=use_fp16,
        bf16=use_bf16,
        gradient_checkpointing=torch.cuda.is_available(),
        save_total_limit=2,
        report_to=[],
        remove_unused_columns=False,
        dataloader_pin_memory=False,
        adam_beta1=args.adam_beta1,
        adam_beta2=args.adam_beta2,
        weight_decay=args.weight_decay,
        lr_scheduler_type="linear",
    )
    if run_eval:
        ta_kwargs.update(
            evaluation_strategy="steps",
            eval_steps=args.eval_steps,
            load_best_model_at_end=True,
            metric_for_best_model="per",
            greater_is_better=False,
            save_strategy="steps",
        )
    ta = TrainingArguments(**ta_kwargs)

    train_kw = dict(
        model=model,
        args=ta,
        train_dataset=ds,
        data_collator=collator,
    )
    if run_eval:
        train_kw["eval_dataset"] = eval_ds
        blank_id = int(processor.tokenizer.pad_token_id)
        train_kw["compute_metrics"] = build_compute_metrics(blank_id=blank_id)
        train_kw["preprocess_logits_for_metrics"] = preprocess_logits_for_metrics

    # transformers 5.x: processing_class; 4.x: tokenizer (Wav2Vec2Processor는 둘 다 가능)
    if "processing_class" in inspect.signature(Trainer.__init__).parameters:
        train_kw["processing_class"] = processor
    else:
        train_kw["tokenizer"] = processor
    trainer = Trainer(**train_kw)
    trainer.train()
    trainer.save_model(str(args.output_dir / "final"))
    processor.save_pretrained(str(args.output_dir / "final"))
    print(f"Saved to {args.output_dir / 'final'}")


if __name__ == "__main__":
    run_ctc_training()
