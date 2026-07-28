"""Export to a single HDF5 file: one group per episode with attrs + frame table."""
from __future__ import annotations
from pathlib import Path

import h5py
import numpy as np

from ..manifest import Episode
from ..probe import VideoInfo


def export(episodes: list[tuple[Episode, VideoInfo]], out: Path, fps_out: float | None = None) -> dict:
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with h5py.File(out, "w") as h:
        h.attrs["vendor"] = "Nostromo Labs"
        h.attrs["pipeline"] = "nostromo-packager"
        h.attrs["total_episodes"] = len(episodes)
        for idx, (ep, info) in enumerate(episodes):
            g = h.create_group(f"episode_{idx:06d}")
            g.attrs.update({
                "episode_id": ep.episode_id,
                "task": ep.task,
                "instruction": ep.instruction,
                "outcome": ep.outcome,
                "video_relpath": f"videos/episode_{idx:06d}.mp4",
                "duration_s": info.duration_s,
                "fps": info.fps,
                "width": info.width,
                "height": info.height,
            })
            fps = fps_out or info.fps
            n = max(1, int(round(info.duration_s * fps)))
            g.create_dataset("timestamp", data=np.arange(n) / fps, dtype="f4")
            g.create_dataset("frame_index", data=np.arange(n), dtype="i8")
    return {"episodes": len(episodes), "file": str(out)}
