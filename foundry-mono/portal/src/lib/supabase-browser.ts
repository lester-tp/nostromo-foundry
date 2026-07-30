import { createClient } from "@supabase/supabase-js";

// Los valores reales se inyectan en build (Vercel) desde NEXT_PUBLIC_*.
// Los placeholders solo evitan que un build sin .env falle.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key"
);
