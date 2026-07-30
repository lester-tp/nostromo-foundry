# Nostromo Foundry

Internal data platform of **Nostromo Labs** — nearshore human demonstration
data for embodied AI (nostromolabs.lat).

| Module       | Status   | What it does                                            |
|--------------|----------|---------------------------------------------------------|
| `packager/`  | ✅ v0.2  | CLI: clips + manifest → LeRobot v2 / HDF5 / JSONL · `nostromo-prelabel` (Claude vision) |
| `dashboard/` | ✅ v2    | QA review UI: real manifests, video playback, Claude pre-label import, reviewed-CSV export |
| `portal/`    | ✅ v0.1  | Contributor PWA: magic-link auth, tasks, resumable multipart uploads to R2, episode status |

| `worker/`    | ✅ v0.1  | Auto-QA: packager's `probe`/`qc_flags` + Silero VAD (video/voice/audio_event) · `export_manifest.py` bridges accepted episodes → packager manifest |

Pipeline: **portal** (contributor upload → R2/Supabase) → **worker** (auto-QA) →
**dashboard** (human QA) → **worker/export_manifest.py** → **packager** (LeRobot/HDF5/JSONL).

See each module's README/source for details.
