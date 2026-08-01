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

type PayRow = {
  id: string;
  ep_code: string;
  created_at: string;
  tasks: { title: string; pay_per_accepted_usd: number } | null;
  contributors: {
    id: string; full_name: string | null; country: string | null;
    phone_whatsapp: string | null; payout_method: string | null; payout_account: string | null;
  } | null;
};

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function Admin() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [scope, setScope] = useState<"pending" | "all" | "pagos">("pending");
  const [videos, setVideos] = useState<Record<string, string>>({});
  const [pays, setPays] = useState<PayRow[]>([]);

  async function load(nextScope?: "pending" | "all" | "pagos") {
    const s = nextScope ?? scope;
    if (s === "pagos") {
      const res = await fetch(`/api/admin/payouts`, { headers: { "x-admin-token": token } });
      if (!res.ok) return alert("Token inválido");
      if (nextScope) setScope(nextScope);
      setPays((await res.json()).episodes);
      setRows([]); // desbloquea la vista
      return;
    }
    const qs = s === "all" ? "?scope=all" : "";
    const res = await fetch(`/api/admin/review${qs}`, { headers: { "x-admin-token": token } });
    if (!res.ok) return alert("Token inválido");
    if (nextScope) setScope(nextScope);
    setRows((await res.json()).episodes);
  }

  async function toggleVideo(episodeId: string) {
    if (videos[episodeId]) {
      setVideos((v) => { const c = { ...v }; delete c[episodeId]; return c; });
      return;
    }
    const res = await fetch(`/api/admin/media?id=${episodeId}`, { headers: { "x-admin-token": token } });
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

  // ---- PAGOS ----
  const grupos = Object.values(
    pays.reduce((acc: Record<string, { c: PayRow["contributors"]; eps: PayRow[]; total: number }>, p) => {
      const key = p.contributors?.id ?? "sin";
      acc[key] ??= { c: p.contributors, eps: [], total: 0 };
      acc[key].eps.push(p);
      acc[key].total += Number(p.tasks?.pay_per_accepted_usd ?? 0);
      return acc;
    }, {})
  );

  function descargarCSV() {
    const batch = `LOTE-${new Date().toISOString().slice(0, 10)}`;
    const filas = grupos.map((g) => [
      `"${g.c?.full_name ?? "SIN NOMBRE"}"`,
      g.c?.payout_method ?? "",
      `"${g.c?.payout_account ?? "SIN CUENTA"}"`,
      g.c?.country ?? "",
      g.total.toFixed(2),
      "USD",
      `"Nostromo ${batch} · ${g.eps.length} episodios (${g.eps.map((e) => e.ep_code).join(" ")})"`,
    ].join(","));
    const csv = ["nombre,metodo,cuenta,pais,monto,moneda,referencia", ...filas].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `nostromo-pagos-${batch}.csv`;
    a.click();
  }

  async function marcarPagados(episodeIds: string[]) {
    if (!confirm(`¿Marcar ${episodeIds.length} episodio(s) como PAGADOS? Hacelo solo después de ejecutar el pago en Wise.`)) return;
    const batch = `LOTE-${new Date().toISOString().slice(0, 10)}`;
    const res = await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ episodeIds, batch }),
    });
    if (!res.ok) return alert("Error al marcar pagados");
    load("pagos");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Back office — episodios</h1>
      {rows === null ? (
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
            <button onClick={() => load("pending")} className={scope === "pending" ? "btn text-sm" : "btn-ghost text-sm"}>Cola de revisión</button>
            <button onClick={() => load("all")} className={scope === "all" ? "btn text-sm" : "btn-ghost text-sm"}>Todos los episodios</button>
            <button onClick={() => load("pagos")} className={scope === "pagos" ? "btn text-sm" : "btn-ghost text-sm"}>💵 Pagos</button>
          </div>

          {scope === "pagos" ? (
            <>
              <div className="card flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="font-mono text-amber">PENDIENTE DE PAGO: </span>
                  <span className="font-bold">${grupos.reduce((s, g) => s + g.total, 0).toFixed(2)} USD</span>
                  <span className="text-fog text-sm ml-2">· {pays.length} episodios · {grupos.length} contribuidores</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={descargarCSV} className="btn text-sm" disabled={!grupos.length}>Descargar CSV (lote Wise)</button>
                  <button onClick={() => marcarPagados(pays.map((p) => p.id))} className="btn-ghost text-sm" disabled={!pays.length}>Marcar TODO como pagado</button>
                </div>
              </div>
              {grupos.map((g) => (
                <div key={g.c?.id ?? "sin"} className="card">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-bold">{g.c?.full_name ?? <span className="text-red-400">SIN NOMBRE — pedirle completar “Mis datos de pago”</span>}</span>
                      <span className="text-fog text-sm ml-3">{g.c?.country}</span>
                      <div className="font-mono text-xs text-fog mt-1">
                        {g.c?.payout_method ?? "—"} · {g.c?.payout_account ?? <span className="text-red-400">SIN CUENTA DE PAGO</span>} · {g.c?.phone_whatsapp ?? ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-amberhi text-lg">${g.total.toFixed(2)}</span>
                      <button onClick={() => marcarPagados(g.eps.map((e) => e.id))} className="btn text-sm">Marcar pagado</button>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-fog mt-2">
                    {g.eps.map((e) => `${e.ep_code} ($${Number(e.tasks?.pay_per_accepted_usd ?? 0).toFixed(2)})`).join(" · ")}
                  </div>
                </div>
              ))}
              {grupos.length === 0 && <p className="text-fog">Sin pagos pendientes ✓</p>}
            </>
          ) : (
            <>
              {rows.map((r) => (
                <div key={r.id} className="card">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-mono text-amberhi">{r.ep_code}</span>
                      <span className="text-fog text-sm ml-3">{r.tasks?.title}</span>
                      <span className="tag border-edge text-fog ml-3">{r.status}</span>
                      {r.modality && (
                        <span className="font-mono text-xs text-amber ml-3">{r.modality.join(" + ")}</span>
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
                      <video src={videos[r.id]} controls preload="metadata"
                        className="w-full max-h-[420px] rounded border border-edge bg-black" />
                      <a href={videos[r.id]} download={r.file_name ?? "episodio.mp4"}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
