"""Export to a LeRobot-v2-style dataset layout.

Layout produced:

    out/
      meta/info.json          dataset-level metadata
      meta/tasks.jsonl        task_index -> language task
      meta/episodes.jsonl     per-episode length, task, outcome
      data/chunk-000/episode_000000.parquet   per-frame table
      videos/chunk-000/observation.images.cam_main/episode_000000.mp4

For pure human video demonstrations there is no robot state; the frame
table carries timing/index columns and the paired video stream, which is
the standard scaffold video-first datasets extend with state later.
"""
from __future__ import annotations
import json
import shutil
from pathlib import Path

import pandas as pd

from ..manifest import Episode
from ..probe import VideoInfo

CAM_KEY = "observation.images.cam_main"


def export(episodes: list[tuple[Episode, VideoInfo]], out: Path, fps_out: float | None = None) -> dict:
    out = Path(out)
    (out / "meta").mkdir(parents=True, exist_ok=True)
    data_dir = out / "data" / "chunk-000"
    vid_dir = out / "videos" / "chunk-000" / CAM_KEY
    data_dir.mkdir(parents=True, exist_ok=True)
    vid_dir.mkdir(parents=True, exist_ok=True)

    tasks: dict[str, int] = {}
    ep_meta = []
    total_frames = 0

    for idx, (ep, info) in enumerate(episodes):
        task_index = tasks.setdefault(ep.instruction, len(tasks))
        fps = fps_out or info.fps
        n = max(1, int(round(info.duration_s * fps)))
        frame_index = list(range(n))
        df = pd.DataFrame({
            "timestamp": [round(i / fps, 6) for i in frame_index],
            "frame_index": frame_index,
            "episode_index": idx,
            "task_index": task_index,
            "index": [total_frames + i for i in frame_index],
        })
        df.to_parquet(data_dir / f"episode_{idx:06d}.parquet", index=False)
        shutil.copy2(ep.video, vid_dir / f"episode_{idx:06d}.mp4")
        ep_meta.append({
            "episode_index": idx,
            "episode_id": ep.episode_id,
            "tasks": [ep.instruction],
            "length": n,
            "outcome": ep.outcome,
            "task": ep.task,
            **{k: v for k, v in ep.extras.items() if v},
        })
        total_frames += n

    with (out / "meta" / "tasks.jsonl").open("w", encoding="utf-8") as f:
        for text, ti in sorted(tasks.items(), key=lambda kv: kv[1]):
            f.write(json.dumps({"task_index": ti, "task": text}) + "\n")
    with (out / "meta" / "episodes.jsonl").open("w", encoding="utf-8") as f:
        for m in ep_meta:
            f.write(json.dumps(m) + "\n")

    info_json = {
        "codebase_version": "v2.0",
        "robot_type": "human",
        "total_episodes": len(episodes),
        "total_frames": total_frames,
        "total_tasks": len(tasks),
        "chunks_size": 1000,
        "fps": fps_out or (episodes[0][1].fps if episodes else 30),
        "data_path": "data/chunk-{episode_chunk:03d}/episode_{episode_index:06d}.parquet",
        "video_path": "videos/chunk-{episode_chunk:03d}/{video_key}/episode_{episode_index:06d}.mp4",
        "features": {
            CAM_KEY: {"dtype": "video"},
            "timestamp": {"dtype": "float32"},
            "frame_index": {"dtype": "int64"},
            "episode_index": {"dtype": "int64"},
            "task_index": {"dtype": "int64"},
            "index": {"dtype": "int64"},
        },
        "provenance": {"vendor": "Nostromo Labs", "pipeline": "nostromo-packager"},
    }
    (out / "meta" / "info.json").write_text(json.dumps(info_json, indent=2))
    return {"episodes": len(episodes), "frames": total_frames, "tasks": len(tasks)}
