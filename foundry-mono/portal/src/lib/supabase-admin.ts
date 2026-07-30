import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Solo para uso en servidor (API routes / worker). Bypassa RLS.
// Inicialización perezosa: no falla en build cuando aún no hay env vars.
let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return _client;
}
