"use client";
import { useState } from "react";

export default function Admin() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<any[] | null>(null);

  async function load() {
    const res = await fetch("/api/admin/review", { headers: { "x-admin-token": token } });
    if (!res.ok) return alert("Token inválido");
    setRows((await res.json()).episodes);
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
      <h1 className="text-2xl font-bold mb-6">QA — cola de revisión</h1>
      {!rows ? (
        <div className="card max-w-md flex gap-3">
          <input type="password" placeholder="ADMIN_TOKEN" value={token}
            onChange={(e) => setToken(e.target.value)}
            className="flex-1 bg-ink border border-edge rounded px-3 py-2 focus:border-amber outline-none" />
          <button onClick={load} className="btn">Entrar</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between">
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
                  <button onClick={() => review(r.id, "accept")} className="btn text-sm">Aceptar</button>
                  <button onClick={() => review(r.id, "reject")} className="btn-ghost text-sm">Rechazar</button>
                </div>
              </div>
              {r.auto_qa && (
                <pre className="font-mono text-xs text-fog mt-3 overflow-x-auto">
{JSON.stringify(r.auto_qa, null, 1)}
                </pre>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="text-fog">Cola vacía ✓</p>}
        </div>
      )}
    </div>
  );
}
