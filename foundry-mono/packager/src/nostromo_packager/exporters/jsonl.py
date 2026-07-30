"""Episodic JSONL export: one JSON record per episode.

A lightweight, RLDS-compatible episodic interchange format: each line is
a full episode record (metadata + labels + media path). Ideal for quick
client previews and for downstream conversion into TFDS/RLDS builders.
"""
from __future__ import annotations
import json
from pathlib import Path

from ..manifest import Episode
from ..probe import VideoInfo


def export(episodes: list[tuple[Episode, VideoInfo]], out: Path, **_) -> dict:
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8") as f:
        for idx, (ep, info) in enumerate(episodes):
            f.write(json.dumps({
                "episode_index": idx,
                "episode_id": ep.episode_id,
                "language_instruction": ep.instruction,
                "task": ep.task,
                "outcome": ep.outcome,
                "video": str(ep.video.name),
                "duration_s": info.duration_s,
                "fps": info.fps,
                "resolution": [info.width, info.height],
                "extras": ep.extras,
            }) + "\n")
    return {"episodes": len(episodes), "file": str(out)}
