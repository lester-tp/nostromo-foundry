"use client";
import { useState } from "react";

type Row = {
  id: string;
  ep_code: string;
  status: string;
  modality: string[] | null;
  auto_qa: unknown;
  file_name: string | null;
  file_size_bytes: number | null;
  created_at: string;
  tasks: { title: string; slug: string } | null;
};

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function Admin() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [scope, setScope] = useState<"pending" | "all">("pending");
  const [videos, setVideos] = useState<Record<string, string>>({}); // episodeId -> signed url

  async function load(nextScope?: "pending" | "all") {
    const s = nextScope ?? scope;
    const qs = s === "all" ? "?scope=all" : "";
    const res = await fetch(`/api/admin/review${qs}`, {
      headers: { "x-admin-token": token },
    });
    if (!res.ok) return alert("Token inválido");
    if (nextScope) setScope(nextScope);
    setRows((await res.json()).episodes);
  }

  async function toggleVideo(episodeId: string) {
    if (videos[episodeId]) {
      // ya está abierto → cerrarlo
      setVideos((v) => {
        const copy = { ...v };
        delete copy[episodeId];
        return copy;
      });
      return;
    }
    const res = await fetch(`/api/admin/media?id=${episodeId}`, {
      headers: { "x-admin-token": token },
    });
    if (!res.ok) return alert("No se pudo obtener el video");
    const { url } = await res.json();
    setVideos((v) => ({ ...v, [episodeId]: url }));
  }

  async function review(episodeId: string, action: "accept" | "reject") {
    const reason = action === "reject" ? prompt("Motivo del rechazo:") ?? "" : undefined;
    let outcome: string | undefined;
    if (action === "accept") {
      outcome = prompt("Outcome (success / failure / recovery):", "success") ?? "success";
      if (!["success", "failure", "recovery"].includes(outcome)) outcome = "success";
    }
    await fetch("/api/admin/review", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ episodeId, action, reason, outcome, reviewer: "qa" }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Back office — episodios</h1>
      {!rows ? (
        <div className="card max-w-md flex gap-3">
          <input type="password" placeholder="ADMIN_TOKEN" value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="flex-1 bg-ink border border-edge rounded px-3 py-2 focus:border-amber outline-none" />
          <button onClick={() => load()} className="btn">Entrar</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => load("pending")}
              className={scope === "pending" ? "btn text-sm" : "btn-ghost text-sm"}>
              Cola de revisión
            </button>
            <button
              onClick={() => load("all")}
              className={scope === "all" ? "btn text-sm" : "btn-ghost text-sm"}>
              Todos los episodios
            </button>
          </div>
          {rows.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-mono text-amberhi">{r.ep_code}</span>
                  <span className="text-fog text-sm ml-3">{r.tasks?.title}</span>
                  <span className="tag border-edge text-fog ml-3">{r.status}</span>
                  {r.modality && (
                    <span className="font-mono text-xs text-amber ml-3">
                      {r.modality.join(" + ")}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleVideo(r.id)} className="btn-ghost text-sm">
                    {videos[r.id] ? "Ocultar video" : "Ver video"}
                  </button>
                  {["auto_checked", "in_qa", "uploaded"].includes(r.status) && (
                    <>
                      <button onClick={() => review(r.id, "accept")} className="btn text-sm">Aceptar</button>
                      <button onClick={() => review(r.id, "reject")} className="btn-ghost text-sm">Rechazar</button>
                    </>
                  )}
                </div>
              </div>
              <div className="font-mono text-xs text-fog mt-2">
                {r.file_name} {r.file_size_bytes ? `· ${fmtSize(r.file_size_bytes)}` : ""} ·{" "}
                {new Date(r.created_at).toLocaleString("es-CR")}
              </div>
              {videos[r.id] && (
                <div className="mt-3">
                  <video
                    src={videos[r.id]}
                    controls
                    preload="metadata"
                    className="w-full max-h-[420px] rounded border border-edge bg-black"
                  />
                  <a                    href={videos[r.id]}
                    download={r.file_name ?? "episodio.mp4"}
                    className="font-mono text-xs text-amber hover:underline mt-1 inline-block">
                    Descargar archivo ↓
                  </a>
                </div>
              )}
              {r.auto_qa != null && (
                <pre className="font-mono text-xs text-fog mt-3 overflow-x-auto">
{JSON.stringify(r.auto_qa, null, 1)}
                </pre>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="text-fog">Sin episodios ✓</p>}
        </div>
      )}
    </div>
  );
}
