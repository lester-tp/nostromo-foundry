export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN)
    return NextResponse.json({ error: "no" }, { status: 401 });

  const scope = req.nextUrl.searchParams.get("scope"); // "all" | null (pendientes)

  let query = supabaseAdmin()
    .from("episodes")
    .select(
      "id,ep_code,status,modality,auto_qa,file_name,file_size_bytes,created_at,tasks(title,slug)"
    );

  if (scope === "all") {
    query = query.order("created_at", { ascending: false }).limit(200);
  } else {
    query = query
      .in("status", ["auto_checked", "in_qa", "uploaded"])
      .order("created_at", { ascending: true })
      .limit(100);
  }

  const { data } = await query;
  return NextResponse.json({ episodes: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN)
    return NextResponse.json({ error: "no" }, { status: 401 });
  const { episodeId, action, reason, outcome, reviewer } = await req.json();
  const status = action === "accept" ? "accepted" : "rejected";
  await supabaseAdmin().from("episodes")
    .update({
      status,
      outcome: action === "accept" ? (outcome ?? "success") : null,
      reject_reason: reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", episodeId);
  await supabaseAdmin().from("qa_events").insert({
    episode_id: episodeId, actor: reviewer ?? "admin", action,
    detail: { reason, outcome },
  });
  return NextResponse.json({ ok: true });
}
