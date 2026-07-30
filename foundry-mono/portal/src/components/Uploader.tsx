"use client";
import { useEffect, useRef } from "react";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import Dashboard from "@uppy/dashboard";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { supabase } from "@/lib/supabase-browser";

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token}` };
}
async function api(body: object) {
  const res = await fetch("/api/multipart", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("upload api error");
  return res.json();
}

export default function Uploader({
  taskId, taskSlug, onDone,
}: { taskId: string; taskSlug: string; onDone: (epCode: string) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const uppy = new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: ["video/*", "audio/*"],
        maxFileSize: 4 * 1024 * 1024 * 1024, // 4 GB
      },
      autoProceed: false,
    });

    uppy.use(AwsS3, {
      shouldUseMultipart: true, // todo va por multipart: reanudable por partes
      async createMultipartUpload(file: any) {
        return api({ action: "create", taskSlug, filename: file.name, type: file.type });
      },
      async signPart(_file: any, { key, uploadId, partNumber }: any) {
        return api({ action: "sign-part", key, uploadId, partNumber });
      },
      async listParts(_file: any, { key, uploadId }: any) {
        const { parts } = await api({ action: "list-parts", key, uploadId });
        return parts;
      },
      async completeMultipartUpload(_file: any, { key, uploadId, parts }: any) {
        await api({ action: "complete", key, uploadId, parts });
        return { location: key };
      },
      async abortMultipartUpload(_file: any, { key, uploadId }: any) {
        await api({ action: "abort", key, uploadId });
      },
    } as any);

    uppy.use(Dashboard, {
      inline: true,
      target: mountRef.current,
      theme: "dark",
      proudlyDisplayPoweredByUppy: false,
      height: 380,
      note: "1 video por episodio · máx 4 GB · la subida se reanuda sola si se corta la conexión",
    });

    uppy.on("complete", async (result) => {
      const file: any = result.successful?.[0];
      if (!file) return;
      const key = file.s3Multipart?.key ?? file.uploadURL ?? file.meta?.key;
      const headers = await authHeader();
      const res = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          taskId,
          storageKey: key,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        }),
      });
      const { ep_code } = await res.json();
      onDone(ep_code);
    });

    return () => uppy.destroy();
  }, [taskId, taskSlug, onDone]);

  return <div ref={mountRef} />;
}
