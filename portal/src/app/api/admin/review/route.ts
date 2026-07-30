export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, BUCKET } from "@/lib/r2";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Devuelve un enlace firmado (1 hora) para reproducir/descargar el video
// de un episodio. Solo admin (header x-admin-token).
export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN)
    return NextResponse.json({ error: "no" }, { status: 401 });

  const episodeId = req.nextUrl.searchParams.get("id");
  if (!episodeId)
    return NextResponse.json({ error: "falta id" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("episodes")
    .select("storage_key,file_name,content_type")
    .eq("id", episodeId)
    .single();

  if (error || !data?.storage_key)
    return NextResponse.json({ error: "episodio sin archivo" }, { status: 404 });

  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: data.storage_key,
      ResponseContentType: data.content_type ?? "video/mp4",
    }),
    { expiresIn: 3600 }
  );

  return NextResponse.json({ url, file_name: data.file_name });
}
