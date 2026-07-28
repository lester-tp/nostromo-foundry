"""Video probing and QC checks via ffprobe (no heavy CV dependencies)."""
from __future__ import annotations
import json
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class VideoInfo:
    duration_s: float
    fps: float
    width: int
    height: int


class ProbeError(RuntimeError):
    pass


def probe(video: Path) -> VideoInfo:
    if not Path(video).exists():
        raise ProbeError(f"video not found: {video}")
    cmd = [
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate:format=duration",
        "-of", "json", str(video),
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, check=True).stdout
    except FileNotFoundError as e:
        raise ProbeError("ffprobe not installed (apt install ffmpeg)") from e
    except subprocess.CalledProcessError as e:
        raise ProbeError(f"ffprobe failed on {video}: {e.stderr.strip()}") from e
    data = json.loads(out)
    try:
        stream = data["streams"][0]
        num, den = stream["r_frame_rate"].split("/")
        fps = float(num) / float(den or 1)
        return VideoInfo(
            duration_s=float(data["format"]["duration"]),
            fps=round(fps, 3),
            width=int(stream["width"]),
            height=int(stream["height"]),
        )
    except (KeyError, IndexError, ValueError) as e:
        raise ProbeError(f"could not parse ffprobe output for {video}") from e


def qc_flags(info: VideoInfo, min_s=5.0, max_s=180.0, min_fps=15.0, min_h=480) -> list[str]:
    flags = []
    if info.duration_s < min_s:
        flags.append(f"too_short:{info.duration_s:.1f}s<{min_s}s")
    if info.duration_s > max_s:
        flags.append(f"too_long:{info.duration_s:.1f}s>{max_s}s")
    if info.fps < min_fps:
        flags.append(f"low_fps:{info.fps}<{min_fps}")
    if min(info.width, info.height) < min_h:
        flags.append(f"low_res:{info.width}x{info.height}")
    return flags
