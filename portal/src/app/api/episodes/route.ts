export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Registra el episodio en DB cuando el upload terminó
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const { data: userData } = await supabaseAdmin().auth.getUser(token);
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

  const { taskId, storageKey, fileName, fileSize, contentType } = await req.json();
  const { data, error } = await supabaseAdmin().from("episodes").insert({
    contributor_id: user.id,
    task_id: taskId,
    storage_key: storageKey,
    file_name: fileName,
    file_size_bytes: fileSize,
    content_type: contentType,
    status: "uploaded",
  }).select("ep_code").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ep_code: data.ep_code });
}
