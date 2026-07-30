"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/tasks");
    });
  }, [router]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/tasks` },
    });
    if (!error) setSent(true);
    else alert(error.message);
  }

  return (
    <div className="card max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold mb-1">Entrar al portal</h1>
      <p className="text-fog text-sm mb-6">
        Te enviamos un enlace de acceso a tu correo. Sin contraseñas.
      </p>
      {sent ? (
        <p className="font-mono text-amber">✓ Revisa tu correo y abre el enlace.</p>
      ) : (
        <form onSubmit={sendLink} className="flex flex-col gap-3">
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="bg-ink border border-edge rounded px-3 py-2 focus:border-amber outline-none"
          />
          <button className="btn justify-center">Enviar enlace de acceso</button>
        </form>
      )}
    </div>
  );
}
