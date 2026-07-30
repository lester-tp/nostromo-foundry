"""Post-export validation for LeRobot-style outputs."""
from __future__ import annotations
import json
from pathlib import Path

import pandas as pd


def validate_lerobot(root: Path) -> list[str]:
    root = Path(root)
    errors = []
    info_p = root / "meta" / "info.json"
    if not info_p.exists():
        return [f"missing {info_p}"]
    info = json.loads(info_p.read_text())
    n = info.get("total_episodes", 0)
    for idx in range(n):
        pq = root / "data" / "chunk-000" / f"episode_{idx:06d}.parquet"
        mp4 = root / "videos" / "chunk-000" / "observation.images.cam_main" / f"episode_{idx:06d}.mp4"
        if not pq.exists():
            errors.append(f"missing parquet for episode {idx}")
            continue
        if not mp4.exists():
            errors.append(f"missing video for episode {idx}")
        df = pd.read_parquet(pq)
        for col in ["timestamp", "frame_index", "episode_index", "task_index", "index"]:
            if col not in df.columns:
                errors.append(f"episode {idx}: missing column {col}")
        if len(df) == 0:
            errors.append(f"episode {idx}: empty frame table")
    return errors
