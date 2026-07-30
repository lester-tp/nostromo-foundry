# Nostromo Foundry — contexto para Claude Code (monorepo)

Plataforma interna de datos de Nostromo Labs (nostromolabs.lat):
demostraciones humanas para embodied AI, de la captura al dataset entrenable.

## Módulos y pipeline
portal/ (Next.js: contribuidores suben episodios a R2 + Supabase)
  → worker/auto_qa.py (QC con packager.probe + Silero VAD)
  → dashboard/ (QA humano, pre-label con Claude)
  → worker/export_manifest.py (aceptados → manifest.csv)
  → packager/ (nostromo-pack: LeRobot v2 / HDF5 / JSONL)

## Comandos
- portal:   cd portal && npm install && npm run dev   (build: npm run build)
- packager: cd packager && pip install -e . && pytest
- worker:   cd worker && pip install -r requirements.txt && python auto_qa.py

## Base de datos (Supabase)
- portal/supabase/schema.sql  → esquema inicial + RLS
- portal/supabase/002_labels.sql → language_instruction (tasks), outcome (episodes)
- Flujo de estado: uploaded → auto_checked|rejected_auto → in_qa → accepted|rejected → paid

## Convenciones
- QC de video vive SOLO en packager/src/nostromo_packager/probe.py (el worker lo importa)
- Manifest: episode_id,video,task,instruction,outcome (success|failure|recovery)
- UI del portal en español; colores de marca en portal/tailwind.config.ts
- Claves R2/service-role solo en API routes y worker, nunca en el cliente

## Próximas tareas sugeridas
1. Notificaciones WhatsApp al aceptar/rechazar (Twilio/Meta API)
2. dashboard/: leer directo de Supabase en vez de CSV manual
3. Presigned GET para reproducir video en portal /admin
4. Tabla payouts + marcado 'paid' en lote
5. CI: GitHub Action que corra pytest del packager y build del portal
