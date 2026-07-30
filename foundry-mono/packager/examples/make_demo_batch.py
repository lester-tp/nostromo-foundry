"""Generate a synthetic demo batch (3 clips + manifest) for trying the CLI."""
import subprocess
import sys
from pathlib import Path

out = Path(sys.argv[1] if len(sys.argv) > 1 else "demo_batch")
clips = out / "clips"
clips.mkdir(parents=True, exist_ok=True)
rows = [
    ("ep_0001", 6, "fold_towel", "fold the towel in half", "success"),
    ("ep_0002", 8, "fold_towel", "fold the towel in half", "failure"),
    ("ep_0003", 7, "pour_cup", "pour water into the cup", "success"),
]
for eid, sec, *_ in rows:
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "lavfi",
         "-i", f"testsrc=duration={sec}:size=640x480:rate=30",
         "-pix_fmt", "yuv420p", str(clips / f"{eid}.mp4")],
        check=True,
    )
with (out / "manifest.csv").open("w") as f:
    f.write("episode_id,video,task,instruction,outcome,contributor\n")
    for eid, _, task, instr, outc in rows:
        f.write(f'{eid},clips/{eid}.mp4,{task},"{instr}",{outc},C001\n')
print(f"demo batch ready at {out}/")
