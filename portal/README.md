# Nostromo Foundry — portal de subida para contribuidores

Aplicación web (PWA-ready) donde los contribuidores de Nostromo Labs inician
sesión, ven tareas con su task script, suben episodios de video con subida
reanudable, y siguen el estado (auto-QA → QA humano → pago).

## Arquitectura

    Contribuidor (móvil/web)
        │  magic link (Supabase Auth)
        ▼
    Next.js en Vercel ── API multipart ──► Cloudflare R2 (episodios)
        │                                        ▲
        ▼                                        │ descarga
    Supabase Postgres (tasks, episodes, qa)  Worker Python (ffprobe + VAD)

## Puesta en producción (≈1 hora)

### 1. Supabase (base de datos + auth)
1. Crea un proyecto en supabase.com (región us-east recomendada).
2. SQL Editor → pega y ejecuta `supabase/schema.sql`.
3. Authentication → Providers → Email: activa "Email OTP / Magic Link".
4. Authentication → URL Configuration → agrega tu dominio final
   (`https://app.nostromolabs.lat`) a Redirect URLs.
5. Settings → API: copia URL, `anon key` y `service_role key` al `.env`.

### 2. Cloudflare R2 (storage)
1. Cloudflare Dashboard → R2 → Create bucket → `nostromo-episodes`.
2. R2 → Manage API Tokens → crea token con Object Read & Write sobre el bucket.
3. Configura CORS del bucket (Settings → CORS policy):

    [{
      "AllowedOrigins": ["http://localhost:3000", "https://app.nostromolabs.lat"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"]
    }]

   (ETag en ExposeHeaders es OBLIGATORIO para multipart.)
4. Copia Account ID, Access Key y Secret al `.env`.

### 3. Probar en local
    cp .env.example .env    # y completa los valores
    npm install
    npm run dev             # http://localhost:3000

Flujo de prueba: inicia sesión con tu correo → tarea "Doblar una toalla" →
sube un video → aparece EP-0148 en "Mis episodios".

### 4. Desplegar en Vercel
1. Sube el repo a GitHub (`git init && git add -A && git commit -m init`, luego push).
2. vercel.com → Import Project → selecciona el repo.
3. Environment Variables → pega TODAS las del `.env`.
4. Deploy. Vercel te da `nostromo-foundry.vercel.app`.

### 5. Dominio: app.nostromolabs.lat
1. Vercel → Project → Settings → Domains → add `app.nostromolabs.lat`.
2. En tu DNS (donde administras nostromolabs.lat): CNAME `app` →
   `cname.vercel-dns.com`.
3. Actualiza la Redirect URL de Supabase (paso 1.4) y el CORS de R2 (paso 2.3)
   con el dominio final.
4. En tu landing, enlaza "For contributors →" a `https://app.nostromolabs.lat`.

### 6. Worker de auto-QA (clasifica video/voz/sonido)
En cualquier VPS chico, Fly.io o Railway (necesita ffmpeg):

    sudo apt install ffmpeg
    cd worker && pip install -r requirements.txt
    export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
           R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... \
           R2_SECRET_ACCESS_KEY=... R2_BUCKET=nostromo-episodes
    python auto_qa.py

### 7. Panel QA
`https://app.nostromolabs.lat/admin` → ingresa tu `ADMIN_TOKEN`.
Aceptar/rechazar dispara el estado que ve el contribuidor.

## Costos estimados (pre-seed)
Supabase Free/Pro $0–25 · Vercel Hobby $0 · R2 ~$0.015/GB-mes sin egress ·
VPS worker ~$5. Total: **menos de $35/mes** hasta miles de episodios.
