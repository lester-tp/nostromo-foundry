"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

// Enlaces de apertura de cuenta (persona natural)
const WISE_SIGNUP = "https://wise.com/invite/dic/lesterrobertop";
const PAYONEER_SIGNUP = "https://www.payoneer.com/";

const METODOS = [
  ["wise", "Wise (correo de tu cuenta Wise)"],
  ["payoneer", "Payoneer (correo de tu cuenta)"],
  ["paypal", "PayPal (correo)"],
  ["banco", "Transferencia bancaria (banco + cuenta)"],
  ["sinpe", "SINPE Móvil (Costa Rica — número)"],
  ["pix", "PIX (Brasil — llave)"],
];

// Qué escribir en el campo "cuenta" según el método
const HINT_CUENTA: Record<string, string> = {
  wise: "ej. tu-correo@gmail.com (el correo de tu cuenta Wise)",
  payoneer: "ej. tu-correo@gmail.com (el correo de tu cuenta Payoneer)",
  paypal: "ej. tu-correo@gmail.com (el correo de tu PayPal)",
  banco: "ej. BAC · cuenta 123456789 · a nombre de…",
  sinpe: "ej. +506 8888 8888",
  pix: "ej. tu llave PIX (CPF, correo o teléfono)",
};

// Recomendación por país (cómo te pagamos más fácil)
const RECO_PAIS: Record<string, { metodo: string; texto: string }> = {
  "México": { metodo: "banco",
    texto: "En México te depositamos directo a tu banco en pesos (SPEI) — no necesitás abrir ninguna cuenta nueva. Elegí “Transferencia bancaria”." },
  "Colombia": { metodo: "wise",
    texto: "En Colombia la vía más rápida es tu propia cuenta Wise: la abrís gratis en minutos y te enviamos USD directo (Wise no permite pagos de empresa en COP)." },
  "Brasil": { metodo: "pix",
    texto: "En Brasil lo más simple es PIX: dejanos tu llave y listo. También podés usar tu cuenta Wise si preferís recibir USD." },
  "Argentina": { metodo: "wise",
    texto: "En Argentina te conviene tu propia cuenta Wise: recibís USD directo (las transferencias a bancos en pesos no están disponibles)." },
  "Costa Rica": { metodo: "sinpe",
    texto: "En Costa Rica lo más fácil es SINPE Móvil: dejanos tu número. También servimos depósito a banco en colones." },
  "Otro": { metodo: "payoneer",
    texto: "Para otros países, la opción con mejor cobertura es Payoneer — abrila gratis y dejanos el correo de tu cuenta." },
};

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

  const reco = RECO_PAIS[form.country];
  const necesitaWise = form.payout_method === "wise";
  const necesitaPayoneer = form.payout_method === "payoneer";

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

        {reco && (
          <div className="border-l-2 border-amber bg-amber/5 rounded-r px-4 py-3">
            <p className="text-sm text-fog leading-relaxed">💡 {reco.texto}</p>
            {form.payout_method !== reco.metodo && (
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, payout_method: reco.metodo }))}
                className="font-mono text-xs text-amber hover:underline mt-2">
                Usar la opción recomendada →
              </button>
            )}
          </div>
        )}

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

        {necesitaWise && (
          <div className="card bg-ink border-amber/40 p-4">
            <p className="text-sm text-fog">
              ¿Aún no tenés cuenta Wise? Es <b className="text-paper">gratis</b> y se abre en
              ~5 minutos: solo necesitás tu documento de identidad, una selfie y un
              comprobante de domicilio.
            </p>
            <a href={WISE_SIGNUP} target="_blank" rel="noopener"
              className="btn text-sm mt-3 inline-block">Abrir mi cuenta Wise gratis ↗</a>
            <p className="font-mono text-xs text-fog mt-2">
              Al terminar, volvé acá y pegá el correo con el que la registraste.
            </p>
          </div>
        )}

        {necesitaPayoneer && (
          <div className="card bg-ink border-amber/40 p-4">
            <p className="text-sm text-fog">
              ¿Aún no tenés cuenta Payoneer? Es gratis y funciona en casi toda América Latina.
            </p>
            <a href={PAYONEER_SIGNUP} target="_blank" rel="noopener"
              className="btn text-sm mt-3 inline-block">Abrir mi cuenta Payoneer ↗</a>
          </div>
        )}

        <label className="text-sm">
          <span className="font-mono text-xs text-amber">CUENTA / CORREO / NÚMERO DE ESE MÉTODO</span>
          <input value={form.payout_account} onChange={set("payout_account")}
            placeholder={HINT_CUENTA[form.payout_method] ?? ""}
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
