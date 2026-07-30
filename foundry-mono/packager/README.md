# Nostromo Packager

**Part of Nostromo Foundry** — the internal data platform of [Nostromo Labs](https://nostromolabs.lat), a nearshore human-demonstration-data vendor for embodied AI.

`nostromo-pack` turns a folder of raw human demonstration clips plus a labels
manifest into **training-ready robotics dataset layouts**:

| Format    | Output                                                        | Use case                          |
|-----------|---------------------------------------------------------------|-----------------------------------|
| `lerobot` | LeRobot-v2-style directory (parquet + mp4 + meta jsonl)       | direct ingestion by robot-learning pipelines |
| `hdf5`    | single `.h5` file, one group per episode                      | labs with HDF5-based tooling      |
| `jsonl`   | one JSON record per episode (RLDS-friendly interchange)       | previews, audits, downstream TFDS builders |

Built-in **QC gate**: every clip is probed (duration, fps, resolution) and
flagged episodes can hard-fail the batch with `--strict` — the same per-episode
QA discipline we sell.

## Install

```bash
pip install -e .
# requires ffmpeg/ffprobe on PATH:  apt install ffmpeg
```

## Quickstart

```bash
# generate a demo batch (3 synthetic clips + manifest) and pack it:
python examples/make_demo_batch.py demo_batch
nostromo-pack --manifest demo_batch/manifest.csv --format lerobot --out dist/demo_ds
nostromo-pack --manifest demo_batch/manifest.csv --format hdf5    --out dist/demo.h5
nostromo-pack --manifest demo_batch/manifest.csv --format jsonl   --out dist/demo.jsonl
```

## The manifest

One CSV row per episode — the contract between collection and packaging:

```csv
episode_id,video,task,instruction,outcome,contributor,environment
ep_0001,clips/ep_0001.mp4,fold_towel,"fold the towel in half",success,C014,kitchen_home_02
```

Required: `episode_id, video, task, instruction, outcome`
(`outcome` ∈ success | failure | recovery). Extra columns ride along as metadata.

## AI-assisted pre-labeling (optional)

`nostromo-prelabel` samples frames from each episode and asks Claude (vision)
to draft the labels a human then verifies in the QA dashboard:

```bash
pip install -e ".[ai]"            # adds the anthropic SDK
export ANTHROPIC_API_KEY=sk-ant-...
nostromo-prelabel --manifest demo_batch/manifest.csv --out prelabels.json
# no key / pipeline test:
nostromo-prelabel --manifest demo_batch/manifest.csv --out prelabels.json --dry-run
```

The output `prelabels.json` loads straight into `dashboard/index.html`.
Full loop: **record → prelabel → human review (dashboard) → export reviewed CSV → `nostromo-pack` → deliver.**

## Design notes

- **Video-first**: human demos carry no robot state; frame tables hold
  timing/index columns that downstream teams extend with state/actions.
- **No heavy CV deps**: probing via `ffprobe`; exports via pandas/pyarrow/h5py.
- **Provenance stamped** in every export (`vendor: Nostromo Labs`).

## Test

```bash
pip install pytest && pytest -q
```

## Roadmap (Foundry)

1. ✅ Packager CLI + `nostromo-prelabel` (Claude-vision drafts)
2. ✅ QA dashboard v2 — real manifests, video playback, pre-label import, reviewed-CSV export
3. Capture PWA — protocol-guided recording for the contributor network

---
MIT © Nostromo Labs
