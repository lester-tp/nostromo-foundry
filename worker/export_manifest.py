"""
Exporta episodios ACEPTADOS del portal al formato de manifest del packager.

    python export_manifest.py --out dist/batch_2026_07/

Genera:
    dist/batch_2026_07/clips/EP-0147.mp4  (descargados de R2)
    dist/batch_2026_07/manifest.csv       (episode_id,video,task,instruction,outcome,...)

Luego:  nostromo-pack --manifest dist/batch_2026_07/manifest.csv --format lerobot --out dist/lerobot_v2
"""
import argparse, csv, os
from pathlib import Path

import boto3, requests

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
R2 = boto3.client(
    "s3",
    endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
)
BUCKET = os.environ["R2_BUCKET"]
HEADERS = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--status", default="accepted", choices=["accepted", "paid"])
    args = ap.parse_args()

    clips = args.out / "clips"
    clips.mkdir(parents=True, exist_ok=True)

    eps = requests.get(
        f"{SUPABASE_URL}/rest/v1/episodes"
        f"?status=eq.{args.status}"
        "&select=ep_code,storage_key,outcome,contributor_id,auto_qa,"
        "tasks(slug,language_instruction,title)",
        headers=HEADERS).json()

    rows = []
    for ep in eps:
        ext = os.path.splitext(ep["storage_key"])[1] or ".mp4"
        fname = f"{ep['ep_code']}{ext}"
        dest = clips / fname
        if not dest.exists():
            print("descargando", fname)
            R2.download_file(BUCKET, ep["storage_key"], str(dest))
        task = ep["tasks"]
        rows.append({
            "episode_id": ep["ep_code"],
            "video": f"clips/{fname}",
            "task": task["slug"],
            "instruction": task.get("language_instruction") or task["title"],
            "outcome": ep.get("outcome") or "success",
            "duration_hint_s": round((ep.get("auto_qa") or {}).get("duration_s", 0)),
            "contributor": ep["contributor_id"][:8],
        })

    manifest = args.out / "manifest.csv"
    with manifest.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()) if rows else
                           ["episode_id", "video", "task", "instruction", "outcome"])
        w.writeheader()
        w.writerows(rows)
    print(f"✓ {len(rows)} episodios → {manifest}")


if __name__ == "__main__":
    main()
