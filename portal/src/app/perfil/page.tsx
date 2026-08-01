"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

const METODOS = [
  ["wise", "Wise (correo de tu cuenta Wise)"],
  ["payoneer", "Payoneer (correo de tu cuenta)"],
  ["paypal", "PayPal (correo)"],
  ["banco", "Transferencia bancaria (país + banco + cuenta)"],
  ["sinpe", "SINPE Móvil (Costa Rica — número)"],
  ["pix", "PIX (Brasil — llave)"],
];

export default function Perfil() {
  const [form, setForm] = useState({
    full_name: "", country: "", phone_whatsapp: "",
    payout_method: "wise", payout_account: "",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return router.replace("/");
      const { data: p } = await supabase
        .from("contributors")
        .select("full_name,country,phone_whatsapp,payout_method,payout_account")
        .eq("id", data.session.user.id).single();
      if (p) setForm({
        full_name: p.full_name ?? "", country: p.country ?? "",
        phone_whatsapp: p.phone_whatsapp ?? "",
        payout_method: p.payout_method ?? "wise",
        payout_account: p.payout_account ?? "",
      });
      setLoading(false);
    });
  }, [router]);

  async function save() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    const { error } = await supabase.from("contributors")
      .update(form).eq("id", data.session.user.id);
    if (error) return alert("Error al guardar: " + error.message);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (loading) return <p className="text-fog">Cargando…</p>;

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mis datos de pago</h1>
        <Link href="/episodes" className="btn-ghost text-sm">← Mis episodios</Link>
      </div>
      <div className="card flex flex-col gap-4">
        <label className="text-sm">
          <span className="font-mono text-xs text-amber">NOMBRE COMPLETO (como en tu cuenta de pago)</span>
          <input value={form.full_name} onChange={set("full_name")}
            className="mt-1 w-full bg-ink border border-edge rounded px-3 py-2 focus:border-amber outline-none" />
        </label>
        <label className="text-sm">
          <span className="font-mono text-xs text-amber">PAÍS</span>
          <select value={form.country} onChange={set("country")}
            className="mt-1 w-full bg-ink border border-edge rounded px-3 py-2 focus:border-amber outline-none">
            <option value="">Selecciona…</option>
            {["México","Colombia","Brasil","Argentina","Costa Rica","Otro"].map(c =>
              <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-mono text-xs text-amber">WHATSAPP (con código de país, ej. +506 8888 8888)</span>
          <input value={form.phone_whatsapp} onChange={set("phone_whatsapp")}
            className="mt-1 w-full bg-ink border border-edge rounded px-3 py-2 focus:border-amber outline-none" />
        </label>
        <label className="text-sm">
          <span className="font-mono text-xs text-amber">MÉTODO DE PAGO PREFERIDO</span>
          <select value={form.payout_method} onChange={set("payout_method")}
            className="mt-1 w-full bg-ink border border-edge rounded px-3 py-2 focus:border-amber outline-none">
            {METODOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-mono text-xs text-amber">CUENTA / CORREO / NÚMERO DE ESE MÉTODO</span>
          <input value={form.payout_account} onChange={set("payout_account")}
            placeholder="ej. tu-correo@wise.com"
            className="mt-1 w-full bg-ink border border-edge rounded px-3 py-2 focus:border-amber outline-none" />
        </label>
        <div className="flex items-center gap-3 mt-2">
          <button onClick={save} className="btn">Guardar</button>
          {saved && <span className="text-green-400 text-sm">Guardado ✓</span>}
        </div>
        <p className="font-mono text-xs text-fog mt-2">
          Los pagos se procesan por lote tras la aceptación de tus episodios. Sin estos
          datos completos no podremos pagarte.
        </p>
      </div>
    </div>
  );
}
