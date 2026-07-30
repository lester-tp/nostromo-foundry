"""nostromo-prelabel: AI-assisted pre-labeling of demonstration episodes.

Extracts frames from each episode video, sends them to the Anthropic API
(Claude vision), and writes a prelabels.json the QA dashboard can import.
A human reviewer always owns the final label.

Usage:
    export ANTHROPIC_API_KEY=sk-ant-...
    nostromo-prelabel --manifest batch/manifest.csv --out prelabels.json
    nostromo-prelabel --manifest batch/manifest.csv --out p.json --dry-run
"""
from __future__ import annotations
import argparse
import base64
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from .manifest import ManifestError, load_manifest

PROMPT = (
    "You are a QA pre-labeler for robot-learning demonstration data. "
    "You are shown frames sampled evenly from ONE first-person video episode "
    "of a human performing the task: {task!r}. "
    "Respond ONLY with a JSON object, no prose, no markdown fences, with keys: "
    '"outcome" (one of "success","failure","recovery"), '
    '"confidence" (0..1), '
    '"language_instruction" (one imperative sentence describing the task as performed), '
    '"notes" (short QA observations: framing, lighting, occlusions).'
)


def extract_frames(video: Path, n: int, tmp: Path) -> list[Path]:
    from .probe import probe
    info = probe(video)
    rate = max(n / max(info.duration_s, 0.1), 0.05)  # n frames spread over the clip
    out_pattern = tmp / "f_%02d.jpg"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(video),
         "-vf", f"fps={rate:.4f},scale=512:-1",
         "-frames:v", str(n), str(out_pattern)],
        check=True,
    )
    return sorted(tmp.glob("f_*.jpg"))


def call_claude(frames: list[Path], task: str, model: str) -> dict:
    try:
        import anthropic  # optional dependency
    except ImportError:
        sys.exit("pip install anthropic  (required unless --dry-run)")
    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    content = [
        {"type": "image",
         "source": {"type": "base64", "media_type": "image/jpeg",
                    "data": base64.b64encode(f.read_bytes()).decode()}}
        for f in frames
    ]
    content.append({"type": "text", "text": PROMPT.format(task=task)})
    msg = client.messages.create(
        model=model, max_tokens=400,
        messages=[{"role": "user", "content": content}],
    )
    text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(text)
    if data.get("outcome") not in {"success", "failure", "recovery"}:
        raise ValueError(f"model returned invalid outcome: {data.get('outcome')!r}")
    return data


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="nostromo-prelabel", description=__doc__)
    ap.add_argument("--manifest", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--frames", type=int, default=6, help="frames sampled per episode")
    ap.add_argument("--model", default="claude-sonnet-4-6")
    ap.add_argument("--dry-run", action="store_true",
                    help="no API calls; emit neutral placeholders (pipeline test)")
    args = ap.parse_args(argv)

    try:
        episodes = load_manifest(args.manifest)
    except ManifestError as e:
        print(f"[manifest] {e}", file=sys.stderr)
        return 2

    results: dict[str, dict] = {}
    for ep in episodes:
        if args.dry_run:
            results[ep.episode_id] = {
                "outcome": ep.outcome, "confidence": 0.0,
                "language_instruction": ep.instruction,
                "notes": "dry-run placeholder — no model call", "model": "none",
            }
            print(f"[dry] {ep.episode_id}")
            continue
        with tempfile.TemporaryDirectory() as td:
            frames = extract_frames(ep.video, args.frames, Path(td))
            if not frames:
                print(f"[skip] {ep.episode_id}: no frames extracted", file=sys.stderr)
                continue
            try:
                data = call_claude(frames, ep.task, args.model)
            except Exception as e:  # keep batch going; flag episode
                print(f"[err] {ep.episode_id}: {e}", file=sys.stderr)
                data = {"outcome": ep.outcome, "confidence": 0.0,
                        "language_instruction": ep.instruction,
                        "notes": f"prelabel failed: {e}"}
            data["model"] = args.model
            results[ep.episode_id] = data
            print(f"[ok] {ep.episode_id}: {data['outcome']} ({data.get('confidence', 0):.2f})")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"[done] {len(results)} pre-labels -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
