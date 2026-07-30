"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

const STATUS_ES: Record<string, [string, string]> = {
  uploaded: ["Recibido", "text-fog border-edge"],
  auto_checked: ["Chequeo automático OK", "text-amber border-amber"],
  rejected_auto: ["Rechazado (automático)", "text-red-400 border-red-400"],
  in_qa: ["En revisión QA", "text-amber border-amber"],
  accepted: ["Aceptado ✓ — pago en camino", "text-green-400 border-green-400"],
  rejected: ["Rechazado", "text-red-400 border-red-400"],
  paid: ["Pagado ✓", "text-green-400 border-green-400"],
};

export default function Episodes() {
  const [rows, setRows] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return router.replace("/");
      const { data: eps } = await supabase
        .from("episodes")
        .select("ep_code,status,file_name,reject_reason,created_at,tasks(title)")
        .order("created_at", { ascending: false });
      setRows(eps ?? []);
    });
  }, [router]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mis episodios</h1>
        <Link href="/tasks" className="btn-ghost text-sm">← Tareas</Link>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((r) => {
          const [label, cls] = STATUS_ES[r.status] ?? [r.status, "text-fog border-edge"];
          return (
            <div key={r.ep_code} className="card flex items-center justify-between gap-4">
              <div>
                <span className="font-mono text-amberhi">{r.ep_code}</span>
                <span className="text-fog text-sm ml-3">{r.tasks?.title}</span>
                {r.reject_reason && (
                  <p className="text-xs text-red-400 mt-1">Motivo: {r.reject_reason}</p>
                )}
              </div>
              <span className={`tag ${cls}`}>{label}</span>
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-fog">Aún no has subido episodios.</p>}
      </div>
    </div>
  );
}
