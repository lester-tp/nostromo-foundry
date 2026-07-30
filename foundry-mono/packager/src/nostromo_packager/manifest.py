"""Episode manifest: the single source of truth for a batch.

A manifest is a CSV with one row per episode:

    episode_id,video,task,instruction,outcome,duration_hint_s,contributor,environment
    ep_0001,clips/ep_0001.mp4,fold_towel,"fold the towel in half",success,42,C014,kitchen_home_02

Required columns: episode_id, video, task, instruction, outcome.
`outcome` must be one of: success | failure | recovery.
"""
from __future__ import annotations
import csv
from dataclasses import dataclass, field
from pathlib import Path

REQUIRED = ["episode_id", "video", "task", "instruction", "outcome"]
OUTCOMES = {"success", "failure", "recovery"}


@dataclass
class Episode:
    episode_id: str
    video: Path
    task: str
    instruction: str
    outcome: str
    extras: dict = field(default_factory=dict)


class ManifestError(ValueError):
    pass


def load_manifest(path: Path) -> list[Episode]:
    path = Path(path)
    if not path.exists():
        raise ManifestError(f"manifest not found: {path}")
    episodes: list[Episode] = []
    seen: set[str] = set()
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        missing = [c for c in REQUIRED if c not in (reader.fieldnames or [])]
        if missing:
            raise ManifestError(f"manifest missing columns: {missing}")
        for i, row in enumerate(reader, start=2):
            eid = (row["episode_id"] or "").strip()
            if not eid:
                raise ManifestError(f"row {i}: empty episode_id")
            if eid in seen:
                raise ManifestError(f"row {i}: duplicate episode_id {eid!r}")
            seen.add(eid)
            outcome = (row["outcome"] or "").strip().lower()
            if outcome not in OUTCOMES:
                raise ManifestError(
                    f"row {i}: outcome {outcome!r} not in {sorted(OUTCOMES)}"
                )
            video = (path.parent / row["video"]).resolve()
            extras = {k: v for k, v in row.items() if k not in REQUIRED}
            episodes.append(
                Episode(eid, video, row["task"].strip(),
                        row["instruction"].strip(), outcome, extras)
            )
    if not episodes:
        raise ManifestError("manifest has no episodes")
    return episodes
