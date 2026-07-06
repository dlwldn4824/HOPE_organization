"""CTC 학습용 Dataset — manifest.jsonl 또는 Kspon *.trn (IPA 음소 라벨)."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from torch.utils.data import Dataset

from speech_coach.data.augment import AugmentConfig, augment_waveform
from speech_coach.data.g2p_ko import g2p_sentence
from speech_coach.data.ipa_vocab import filter_to_vocab
from speech_coach.training.audio_io import load_audio_mono_float32


def _resolve_audio_path(audio_path: str, repo_root: Path | None) -> Path:
    p = Path(audio_path)
    if p.is_file():
        return p
    if repo_root is not None:
        cand = repo_root / audio_path
        if cand.is_file():
            return cand
    raise FileNotFoundError(f"audio not found: {audio_path}")


class ManifestJsonlDataset(Dataset):
    """manifest 줄당: audio_path, transcript 또는 target_phonemes(list)."""

    def __init__(
        self,
        manifest_path: str | Path,
        *,
        repo_root: Path | None = None,
        max_samples: int | None = None,
        text_key: str = "transcript",
        augment_config: AugmentConfig | None = None,
    ) -> None:
        self.rows: list[dict] = []
        mp = Path(manifest_path)
        for line in mp.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            transcript = (row.get(text_key) or row.get("transcript") or "").strip()
            tp = row.get("target_phonemes")
            if tp:
                phones = filter_to_vocab([str(x) for x in tp])
            else:
                phones = g2p_sentence(transcript)
            if not phones:
                continue
            row["phoneme_labels"] = phones
            self.rows.append(row)
            if max_samples is not None and len(self.rows) >= max_samples:
                break
        self.repo_root = repo_root
        self.augment_config = augment_config

    def __len__(self) -> int:
        return len(self.rows)

    def __getitem__(self, idx: int) -> dict[str, np.ndarray | list[str]]:
        row = self.rows[idx]
        ap = _resolve_audio_path(row["audio_path"], self.repo_root)
        wav = load_audio_mono_float32(ap)
        if self.augment_config is not None:
            wav = augment_waveform(wav, config=self.augment_config)
        return {"input_values": wav, "phoneme_labels": row["phoneme_labels"]}


class KsponTrnDataset(Dataset):
    """
    eval_clean.trn 형식:
      KsponSpeech_eval/eval_clean/E00001.pcm :: 한글 전사...
    audio_root 아래에 KsponSpeech_eval/... 상대경로가 존재해야 함.
    """

    def __init__(
        self,
        trn_path: str | Path,
        audio_root: str | Path,
        *,
        max_samples: int | None = None,
        augment_config: AugmentConfig | None = None,
    ) -> None:
        self.pairs: list[tuple[Path, list[str]]] = []
        root = Path(audio_root)
        for line in Path(trn_path).read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or "::" not in line:
                continue
            rel, trans = line.split("::", 1)
            rel = rel.strip()
            trans = trans.strip()
            ap = root / rel
            if not ap.is_file():
                continue
            phones = g2p_sentence(trans)
            if not phones:
                continue
            self.pairs.append((ap, phones))
            if max_samples is not None and len(self.pairs) >= max_samples:
                break
        self.augment_config = augment_config

    def __len__(self) -> int:
        return len(self.pairs)

    def __getitem__(self, idx: int) -> dict[str, np.ndarray | list[str]]:
        ap, phones = self.pairs[idx]
        wav = load_audio_mono_float32(ap)
        if self.augment_config is not None:
            wav = augment_waveform(wav, config=self.augment_config)
        return {"input_values": wav, "phoneme_labels": phones}
