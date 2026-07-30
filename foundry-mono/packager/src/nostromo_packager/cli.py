"""nostromo-pack: package demonstration episodes into training-ready formats.

Usage:
    nostromo-pack --manifest examples/manifest.csv --format lerobot --out dist/my_dataset
    nostromo-pack --manifest m.csv --format hdf5 --out dist/batch.h5
    nostromo-pack --manifest m.csv --format jsonl --out dist/batch.jsonl --strict
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

from . import __version__
from .manifest import ManifestError, load_manifest
from .probe import ProbeError, probe, qc_flags
from .exporters import hdf5, jsonl, lerobot

FORMATS = {"lerobot": lerobot.export, "hdf5": hdf5.export, "jsonl": jsonl.export}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="nostromo-pack", description=__doc__)
    ap.add_argument("--manifest", required=True, type=Path)
    ap.add_argument("--format", required=True, choices=sorted(FORMATS))
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--fps", type=float, default=None, help="override output fps metadata")
    ap.add_argument("--strict", action="store_true",
                    help="fail the batch if any episode has QC flags")
    ap.add_argument("--version", action="version", version=__version__)
    args = ap.parse_args(argv)

    try:
        episodes = load_manifest(args.manifest)
    except ManifestError as e:
        print(f"[manifest] {e}", file=sys.stderr)
        return 2

    packed, flagged = [], []
    for ep in episodes:
        try:
            info = probe(ep.video)
        except ProbeError as e:
            print(f"[probe] {ep.episode_id}: {e}", file=sys.stderr)
            return 2
        flags = qc_flags(info)
        if flags:
            flagged.append((ep.episode_id, flags))
            print(f"[qc] {ep.episode_id}: {', '.join(flags)}", file=sys.stderr)
        packed.append((ep, info))

    if flagged and args.strict:
        print(f"[qc] strict mode: {len(flagged)} episode(s) flagged — aborting.",
              file=sys.stderr)
        return 3

    stats = FORMATS[args.format](packed, args.out, fps_out=args.fps)
    print(f"[ok] {args.format} export complete: {stats}")
    if flagged:
        print(f"[warn] {len(flagged)} episode(s) carried QC flags (see stderr).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
