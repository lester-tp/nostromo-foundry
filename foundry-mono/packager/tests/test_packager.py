"""End-to-end test: synth clips -> manifest -> all three exports -> validate."""
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from nostromo_packager.cli import main            # noqa: E402
from nostromo_packager.validate import validate_lerobot  # noqa: E402


def make_clip(path: Path, seconds: int):
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "lavfi",
         "-i", f"testsrc=duration={seconds}:size=640x480:rate=30",
         "-pix_fmt", "yuv420p", str(path)],
        check=True,
    )


def test_end_to_end(tmp_path: Path):
    clips = tmp_path / "clips"
    for i, sec in enumerate([6, 8, 7], start=1):
        make_clip(clips / f"ep_{i:04d}.mp4", sec)
    manifest = tmp_path / "manifest.csv"
    manifest.write_text(
        "episode_id,video,task,instruction,outcome,contributor\n"
        'ep_0001,clips/ep_0001.mp4,fold_towel,"fold the towel in half",success,C001\n'
        'ep_0002,clips/ep_0002.mp4,fold_towel,"fold the towel in half",failure,C001\n'
        'ep_0003,clips/ep_0003.mp4,pour_cup,"pour water into the cup",success,C002\n'
    )
    out = tmp_path / "dist"
    assert main(["--manifest", str(manifest), "--format", "lerobot",
                 "--out", str(out / "lerobot_ds")]) == 0
    assert validate_lerobot(out / "lerobot_ds") == []
    assert main(["--manifest", str(manifest), "--format", "hdf5",
                 "--out", str(out / "batch.h5")]) == 0
    assert main(["--manifest", str(manifest), "--format", "jsonl",
                 "--out", str(out / "batch.jsonl")]) == 0
    assert (out / "batch.jsonl").read_text().count("\n") == 3
