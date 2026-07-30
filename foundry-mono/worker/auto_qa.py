"""
Nostromo Foundry - worker de auto-QA (integrado con nostromo_packager)
----------------------------------------------------------------------
Poll de episodios status='uploaded' en Supabase -> descarga de R2 ->
QC con nostromo_packager.probe (la MISMA lógica del packager) ->
Silero VAD para modalidad (video / voice / audio_event) -> update.

Requisitos: ffmpeg instalado.  pip install -r requirements.txt
"""
import json, os, subprocess, tempfile, time

import boto3, requests, torch
from nostromo_packager.probe import probe, qc_flags, ProbeError

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
R2 = boto3.client(
    "s3",
    endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
)
BUCKET = os.environ["R2_BUCKET"]
HEADERS = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
           "Content-Type": "application/json"}

print("cargando Silero VAD…")
vad_model, utils = torch.hub.load("snakers4/silero-vad", "silero_vad")
get_speech_ts, _, read_audio, *_ = utils


def rest(path, method="GET", **kw):
    r = requests.request(method, f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS, **kw)
    r.raise_for_status()
    return r.json() if r.text else None


def has_audio_stream(path):
    out = subprocess.run(
        ["ffprobe", "-v", "quiet", "-select_streams", "a", "-show_entries",
         "stream=codec_type", "-of", "json", path], capture_output=True, text=True)
    return bool(json.loads(out.stdout or "{}").get("streams"))


def classify(path, task):
    # --- QC de video: misma lógica que el packager (probe + qc_flags) ---
    modality, problems = [], []
    report = {}
    try:
        info = probe(path)
        min_h = int(task["min_resolution"].split("x")[1])
        problems += qc_flags(info,
                             min_s=task["min_duration_s"],
                             max_s=task["max_duration_s"],
                             min_h=min_h)
        report.update(duration_s=info.duration_s, fps=info.fps,
                      width=info.width, height=info.height)
        modality.append("video")
    except ProbeError:
        report["video"] = "sin stream de video"

    # --- modalidad de audio: voz vs evento sonoro ---
    audio = has_audio_stream(path)
    report["has_audio"] = audio
    if task["requires_audio"] and not audio:
        problems.append("la tarea requiere audio y el archivo no tiene pista")
    if audio:
        wav = tempfile.mktemp(suffix=".wav")
        subprocess.run(["ffmpeg", "-y", "-v", "quiet", "-i", path,
                        "-vn", "-ac", "1", "-ar", "16000", wav])
        speech = get_speech_ts(read_audio(wav, sampling_rate=16000),
                               vad_model, sampling_rate=16000)
        os.remove(wav)
        report["speech_segments"] = len(speech)
        modality.append("voice" if speech else "audio_event")
        if task["requires_audio"] and not speech:
            problems.append("la tarea requiere voz y no se detectó habla")

    return modality, report, problems


def process(ep):
    task = rest(f"tasks?id=eq.{ep['task_id']}&select=*")[0]
    suffix = os.path.splitext(ep["storage_key"])[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        R2.download_fileobj(BUCKET, ep["storage_key"], f)
        local = f.name
    try:
        modality, report, problems = classify(local, task)
        ok = not problems
        rest(f"episodes?id=eq.{ep['id']}", "PATCH", json={
            "status": "auto_checked" if ok else "rejected_auto",
            "modality": modality, "auto_qa": report,
            "reject_reason": None if ok else "; ".join(map(str, problems)),
        })
        rest("qa_events", "POST", json={
            "episode_id": ep["id"], "actor": "auto", "action": "auto_check",
            "detail": {"report": report, "problems": problems},
        })
        print(f"{ep['ep_code']}: {'OK' if ok else 'RECHAZADO'} {modality} {problems}")
    finally:
        os.remove(local)


if __name__ == "__main__":
    print("worker corriendo — poll cada 20s")
    while True:
        for ep in rest("episodes?status=eq.uploaded&select=*&limit=5&order=created_at"):
            try:
                process(ep)
            except Exception as e:
                print("error", ep.get("ep_code"), e)
        time.sleep(20)
