"""One folder per reel project, absolute paths everywhere.

    <project>/
      project.json            manifest (source fingerprint, stages)
      source/input.mp4        normalised copy of the user's clip (never edited)
      work/transcript.json    words on the SOURCE timeline
      work/understanding.json auto-detected instructions/relations (+ frames/)
      work/requirements.json  what was asked, where and when (reviewed by Claude)
      work/edit.json          keep ranges + exact base duration in frames
      work/base.mp4           the edited video both tiers render on
      work/transcript.base.json  words on the BASE timeline
      work/captions.json      caption groups (shared by both tiers)
      work/props.json         the full plan (hook, scenes, zooms, music, rules)
      caps/                   fast-tier caption PNGs
      output/reel.mp4
      qa/                     frames, contact sheets, report.json, review.json
"""
from __future__ import annotations

import json
import re
import time
from pathlib import Path


class ProjectError(RuntimeError):
    pass


class Project:
    def __init__(self, root: str | Path):
        self.root = Path(root).expanduser().resolve()

    # ── paths ────────────────────────────────────────────────────────────
    @property
    def manifest(self) -> Path: return self.root / "project.json"
    @property
    def source(self) -> Path: return self.root / "source" / "input.mp4"
    @property
    def work(self) -> Path: return self.root / "work"
    @property
    def transcript(self) -> Path: return self.work / "transcript.json"
    @property
    def understanding(self) -> Path: return self.work / "understanding.json"
    @property
    def requirements(self) -> Path: return self.work / "requirements.json"
    @property
    def edit(self) -> Path: return self.work / "edit.json"
    @property
    def base(self) -> Path: return self.work / "base.mp4"
    @property
    def base_transcript(self) -> Path: return self.work / "transcript.base.json"
    @property
    def captions(self) -> Path: return self.work / "captions.json"
    @property
    def props(self) -> Path: return self.work / "props.json"
    @property
    def caps(self) -> Path: return self.root / "caps"
    @property
    def output_dir(self) -> Path: return self.root / "output"
    @property
    def qa(self) -> Path: return self.root / "qa"

    def exists(self) -> bool:
        return self.manifest.is_file()

    def load(self) -> dict:
        if not self.exists():
            raise ProjectError(
                f"אין פרויקט ב-{self.root} (חסר project.json). התחל עם: reel init <video>")
        return json.loads(self.manifest.read_text(encoding="utf-8"))

    def save(self, data: dict) -> None:
        data["updated"] = time.strftime("%Y-%m-%dT%H:%M:%S")
        write_json(self.manifest, data)

    def mark(self, stage: str, **info) -> None:
        data = self.load()
        data.setdefault("stages", {})[stage] = {"at": time.strftime("%Y-%m-%dT%H:%M:%S"), **info}
        self.save(data)

    def mkdirs(self) -> None:
        for d in (self.root / "source", self.work, self.caps, self.output_dir, self.qa):
            d.mkdir(parents=True, exist_ok=True)


def slugify(name: str) -> str:
    stem = Path(name).stem
    s = re.sub(r"[^\w֐-׿-]+", "-", stem, flags=re.UNICODE).strip("-_")
    return (s or "reel")[:48]


def read_json(path: str | Path, default=None):
    p = Path(path)
    if not p.is_file():
        return default
    return json.loads(p.read_text(encoding="utf-8"))


def write_json(path: str | Path, data) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(p)
