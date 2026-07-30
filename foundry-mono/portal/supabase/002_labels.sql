-- Migración 002: campos para conectar el portal con el packager
-- (ejecutar después de schema.sql)

-- La instrucción en lenguaje natural que consume el manifest del packager
alter table public.tasks
  add column if not exists language_instruction text;

update public.tasks
  set language_instruction = 'fold the towel in half'
  where slug = 'fold_towel' and language_instruction is null;

-- Resultado del intento, requerido por el manifest: success | failure | recovery
alter table public.episodes
  add column if not exists outcome text
  check (outcome in ('success','failure','recovery'));
