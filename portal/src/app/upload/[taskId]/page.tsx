"use client";
import { useSearchParams, useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Uploader from "@/components/Uploader";

export default function UploadPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const slug = useSearchParams().get("slug") ?? "task";
  const [epCode, setEpCode] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Subir episodio</h1>
        <Link href="/tasks" className="btn-ghost text-sm">&larr; Tareas</Link>
      </div>
      <p className="font-mono text-xs text-amber mb-6">{slug}</p>
      {epCode ? (
        <div className="card text-center py-10">
          <div className="text-3xl mb-2">✓</div>
          <p className="font-mono text-amberhi text-lg mb-2">{epCode}</p>
          <p className="text-fog text-sm mb-6">
            Recibido. Pasará por revisión automática y luego por QA humano.
            Verás el estado en “Mis episodios”.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/episodes" className="btn">Ver mis episodios</Link>
            <Link href="/tasks" className="btn-ghost">Subir otro</Link>
          </div>
        </div>
      ) : (
        <Uploader taskId={taskId} taskSlug={slug} onDone={setEpCode} />
      )}
    </div>
  );
}
