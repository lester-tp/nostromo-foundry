export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET: episodios aceptados pendientes de pago, con datos del contribuidor y tarifa
export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN)
    return NextResponse.json({ error: "no" }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from("episodes")
    .select(
      "id,ep_code,created_at,tasks(title,pay_per_accepted_usd),contributors(id,full_name,country,phone_whatsapp,payout_method,payout_account)"
    )
    .eq("status", "accepted")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ episodes: data ?? [] });
}

// POST: marca un lote de episodios como pagados
export async function POST(req: NextRequest) {
  if (req.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN)
    return NextResponse.json({ error: "no" }, { status: 401 });

  const { episodeIds, batch } = await req.json();
  if (!Array.isArray(episodeIds) || episodeIds.length === 0)
    return NextResponse.json({ error: "sin episodios" }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from("episodes")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_batch: batch ?? null,
      updated_at: new Date().toISOString(),
    })
    .in("id", episodeIds)
    .eq("status", "accepted"); // solo lo aceptado puede pasar a pagado

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin().from("qa_events").insert(
    episodeIds.map((id: string) => ({
      episode_id: id, actor: "admin", action: "paid", detail: { batch },
    }))
  );

  return NextResponse.json({ ok: true, count: episodeIds.length });
}
