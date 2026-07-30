import Link from "next/link";

export const metadata = { title: "Protocolo de captura — Nostromo Foundry" };

export default function Protocolo() {
  return (
    <article className="max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Protocolo de captura</h1>
        <Link href="/tasks" className="btn-ghost text-sm">← Tareas</Link>
      </div>
      <p className="font-mono text-xs text-amber mb-8">
        Guía del contribuidor · Video · Voz · Audio · v1.1
      </p>

      <section className="card mb-4">
        <h2 className="font-bold text-amber mb-2">Qué hacemos</h2>
        <p className="text-sm text-fog leading-relaxed">
          Los robots aprenden observando a las personas. Cada grabación tuya se
          convierte en material de entrenamiento. La unidad de trabajo es el{" "}
          <b className="text-paper">episodio</b>: UN intento completo de UNA
          tarea, de inicio a fin, en UN archivo. Se paga por episodio aceptado.
        </p>
      </section>

      <section className="card mb-4">
        <h2 className="font-bold text-amber mb-2">Reglas de oro</h2>
        <ul className="text-sm text-fog leading-relaxed list-disc pl-5 space-y-2">
          <li><b className="text-paper">Privacidad:</b> sin rostros de terceros,
            documentos, pantallas ni placas legibles. Revisa el fondo antes de grabar.</li>
          <li><b className="text-paper">Honestidad:</b> los fallos reales también se
            pagan. Nunca actúes un fallo ni edites el video: se sube tal cual salió
            de la cámara.</li>
          <li><b className="text-paper">Un intento = un archivo.</b> Si salió mal,
            el episodio termina igual; el siguiente intento es un archivo nuevo.</li>
          <li><b className="text-paper">Sin música ni conversaciones de fondo</b> —
            el audio también es dato.</li>
        </ul>
      </section>

      <section className="card mb-4">
        <h2 className="font-bold text-amber mb-2">A — Video (moverse y ver)</h2>
        <p className="text-sm text-fog leading-relaxed">
          Teléfono al pecho, horizontal, ~30° hacia abajo: en pantalla se ven tus
          dos manos y toda la superficie. Luz de frente o desde arriba. 1080p,
          30/60 fps. Estructura: 1 s quieto al inicio → tarea a velocidad
          natural → 1 s quieto con el resultado visible. Duración típica 20–90 s;
          más de 3 minutos, la tarea se divide. La variación vale oro: cambia
          objetos y posiciones — diez episodios variados valen más que veinte
          idénticos.
        </p>
      </section>

      <section className="card mb-4">
        <h2 className="font-bold text-amber mb-2">B — Voz (entender)</h2>
        <p className="text-sm text-fog leading-relaxed">
          Silencio total de fondo. Habla a 20 cm del teléfono, volumen natural.
          Lee cada enunciado como a un asistente en tu casa, con TU acento — el
          acento es exactamente lo que buscamos. Si te equivocas, repite el
          enunciado completo tras una pausa.
        </p>
      </section>

      <section className="card mb-4">
        <h2 className="font-bold text-amber mb-2">C — Audio ambiental (escuchar)</h2>
        <p className="text-sm text-fog leading-relaxed">
          10–30 s por evento sonoro, con 3 s de ambiente antes y después.
          Seguridad primero: nunca provoques sonidos rompiendo cosas.
        </p>
      </section>

      <section className="card mb-4">
        <h2 className="font-bold text-amber mb-2">Entrega y pagos</h2>
        <p className="text-sm text-fog leading-relaxed">
          Sube cada episodio desde la tarea correspondiente en este portal — el
          código (EP-0148…), la revisión automática y el resultado quedan
          registrados solos; ya no necesitas planilla ni carpeta de Drive. Cada
          episodio pasa por revisión automática + humana. Los aceptados se pagan
          a la tarifa de tu lote (SINPE / transferencia / PayPal según tu país);
          los rechazados por protocolo pueden regrabarse. ¿Dudas? Escríbenos por
          WhatsApp antes de grabar — una pregunta a tiempo salva un lote entero.
        </p>
      </section>

      <div className="text-center mt-8">
        <Link href="/tasks" className="btn">Ver tareas disponibles</Link>
      </div>
    </article>
  );
}
