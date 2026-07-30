-- Migración 003: tareas reales según el Protocolo de Captura v1.0
-- (ejecutar después de 002_labels.sql)

-- Actualiza la tarea de video con el protocolo real (Guía Express, sección 9)
update public.tasks set
  title = 'Doblar una toalla (video)',
  instructions = 'UN intento completo en UN archivo. Posición inicial: manos quietas y visibles, toalla extendida, 1 segundo quieto. Dobla por la mitad y por la mitad otra vez a velocidad natural. Al terminar (bien o mal), 1 segundo quieto con el resultado visible. Los fallos reales también se pagan: NO los borres ni los actúes. Varía toalla y posición inicial cada pocos episodios.',
  camera_protocol = 'Teléfono al pecho, cámara trasera, horizontal, altura del esternón, ~30° hacia abajo: deben verse TUS DOS MANOS y toda la superficie. Luz de frente o arriba, nunca a tu espalda. 1080p, 30/60 fps, enfoque bloqueado. Sin música ni voces de fondo. Sin rostros, documentos, pantallas ni placas visibles.',
  min_duration_s = 10,
  max_duration_s = 180,
  language_instruction = 'fold the towel in half',
  requires_audio = false
where slug = 'fold_towel';

-- Protocolo B — VOZ
insert into public.tasks
  (slug, title, instructions, camera_protocol, min_duration_s, max_duration_s,
   min_resolution, requires_audio, language_instruction, pay_per_accepted_usd)
values
  ('voice_commands_es', 'Comandos de voz (español)',
   'Lee cada enunciado del guion como se lo dirías a un asistente en tu casa: natural y con TU acento — el acento es exactamente lo que buscamos. Un archivo por enunciado. Si te equivocas, repite el enunciado completo tras una pausa; no borres nada.',
   'Espacio en silencio total (sin ventiladores, tráfico ni electrodomésticos). Habla a 20 cm del teléfono, volumen natural de conversación.',
   2, 60, '0x0', true, 'voice command reading', 0.80)
on conflict (slug) do nothing;

-- Protocolo C — AUDIO AMBIENTAL
insert into public.tasks
  (slug, title, instructions, camera_protocol, min_duration_s, max_duration_s,
   min_resolution, requires_audio, language_instruction, pay_per_accepted_usd)
values
  ('audio_events_home', 'Eventos de audio del hogar',
   'Graba el evento sonoro que pida tu lote (puerta que se cierra, timbre, vaso que se apoya, licuadora): 10 a 30 segundos por evento, con 3 segundos de ambiente antes y después. Seguridad primero: nunca provoques sonidos rompiendo cosas ni en situaciones de riesgo.',
   'Ambiente sin música ni conversaciones. Anota qué suena y en qué segundo al subir.',
   10, 40, '0x0', true, 'household audio event', 0.60)
on conflict (slug) do nothing;
