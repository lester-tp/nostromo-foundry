"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

// ⚠️ REEMPLAZAR con el enlace real de tu Canal de WhatsApp
// (WhatsApp → Novedades → + → Nuevo canal → Compartir → Copiar enlace)
const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbDep2S6xCSV5vLqS22u";

type Task = {
  id: string; slug: string; title: string; instructions: string;
  camera_protocol: string | null; requires_audio: boolean;
  pay_per_accepted_usd: number;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return router.replace("/");
      const { data: rows } = await supabase.from("tasks").select("*");
      setTasks((rows as Task[]) ?? []);
    });
  }, [router]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Tareas disponibles</h1>
        <div className="flex gap-2">
          <Link href="/protocolo" className="btn-ghost text-sm">Protocolo</Link>
          <Link href="/perfil" className="btn-ghost text-sm">Mis datos de pago</Link>
          <Link href="/episodes" className="btn-ghost text-sm">Mis episodios</Link>
        </div>
      </div>

      <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener"
        className="card mb-6 flex items-center gap-3 border-amber/50 hover:border-amber transition-colors">
        <span className="text-2xl">📲</span>
        <div>
          <div className="font-bold">Únete al canal de WhatsApp</div>
          <p className="text-fog text-sm">
            Ahí anunciamos las tareas nuevas con su pago — sé el primero en enterarte.
          </p>
        </div>
        <span className="ml-auto font-mono text-xs text-amber">UNIRME →</span>
      </a>

      <div className="flex flex-col gap-4">
        {tasks.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-xs text-amber mb-1">{t.slug}</div>
                <h2 className="font-bold text-lg">{t.title}</h2>
              </div>
              <div className="font-mono text-amberhi whitespace-nowrap">
                ${Number(t.pay_per_accepted_usd).toFixed(2)} / aceptado
              </div>
            </div>
            <p className="text-fog text-sm mt-3">{t.instructions}</p>
            {t.camera_protocol && (
              <p className="font-mono text-xs text-fog mt-2">📷 {t.camera_protocol}</p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <Link href={`/upload/${t.id}?slug=${t.slug}`} className="btn">
                Subir episodio
              </Link>
              {t.requires_audio && (
                <span className="tag border-amber text-amber">requiere voz</span>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-fog">No hay tareas abiertas ahora. Vuelve pronto.</p>
        )}
      </div>
    </div>
  );
}
