export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import {
  CreateMultipartUploadCommand, UploadPartCommand,
  CompleteMultipartUploadCommand, AbortMultipartUploadCommand, ListPartsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, BUCKET } from "@/lib/r2";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Verifica el JWT de Supabase que manda el cliente
async function requireUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data } = await supabaseAdmin().auth.getUser(token);
  return data.user ?? null;
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

  const { action, key, uploadId, partNumber, parts, taskSlug, filename, type } =
    await req.json();

  if (action === "create") {
    const safe = (filename || "video").replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `episodes/${taskSlug}/${user.id}/${Date.now()}-${safe}`;
    const out = await r2.send(new CreateMultipartUploadCommand({
      Bucket: BUCKET, Key: storageKey, ContentType: type,
    }));
    return NextResponse.json({ uploadId: out.UploadId, key: storageKey });
  }
  if (action === "sign-part") {
    const url = await getSignedUrl(r2, new UploadPartCommand({
      Bucket: BUCKET, Key: key, UploadId: uploadId, PartNumber: partNumber,
    }), { expiresIn: 3600 });
    return NextResponse.json({ url });
  }
  if (action === "list-parts") {
    const out = await r2.send(new ListPartsCommand({
      Bucket: BUCKET, Key: key, UploadId: uploadId,
    }));
    return NextResponse.json({ parts: out.Parts ?? [] });
  }
  if (action === "complete") {
    await r2.send(new CompleteMultipartUploadCommand({
      Bucket: BUCKET, Key: key, UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }));
    return NextResponse.json({ ok: true, key });
  }
  if (action === "abort") {
    await r2.send(new AbortMultipartUploadCommand({
      Bucket: BUCKET, Key: key, UploadId: uploadId,
    }));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "bad action" }, { status: 400 });
}
