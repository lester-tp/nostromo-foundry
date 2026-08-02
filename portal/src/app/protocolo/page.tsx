import Link from "next/link";

// Canal de anuncios y WhatsApp de soporte
const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbDep2S6xCSV5vLqS22u";
const WHATSAPP_SOPORTE = "https://wa.me/13055421180?text=Hola%20Nostromo%2C%20tengo%20una%20duda%20sobre%20una%20tarea";

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
          <li><b className="text-paper">Un intento = un archivo:</b> no cortes ni
            edites; si te equivocas, empieza un archivo nuevo.</li>
          <li><b className="text-paper">Manos visibles:</b> la cámara debe ver lo
            que hacen tus manos durante toda la tarea.</li>
          <li><b className="text-paper">Luz y estabilidad:</b> luz natural o
            abundante; apoya el teléfono o usa trípode.</li>
          <li><b className="text-paper">Sigue la instrucción exacta</b> de la
            tarea, incluida la frase en voz alta si la pide.</li>
        </ul>
      </section>

      <section className="card mb-4">
        <h2 className="font-bold text-amber mb-2">Especificaciones técnicas</h2>
        <ul className="text-sm text-fog leading-relaxed list-disc pl-5 space-y-2">
          <li>Video: 1080p o superior, horizontal u orientación indicada por la tarea.</li>
          <li>Duración: la que indique la tarea (típicamente 5–300 s).</li>
          <li>Audio: activado si la tarea lo requiere (di la frase indicada).</li>
          <li>Formato: MP4 / MOV directo del teléfono, sin compresión de apps de mensajería.</li>
        </ul>
      </section>

      <section className="card mb-4">
        <h2 className="font-bold text-amber mb-2">Entrega y pagos</h2>
        <p className="text-sm text-fog leading-relaxed">
          Sube cada episodio desde la tarea correspondiente en este portal — el
          código (EP-0148…), la revisión automática y el resultado quedan
          registrados solos; ya no necesitas planilla ni carpeta de Drive. Cada
          episodio pasa por revisión automática + humana. Los aceptados se pagan
          a la tarifa de tu lote al método que registres en{" "}
          <Link href="/perfil" className="text-amber underline">Mis datos de pago</Link>{" "}
          (Wise, Payoneer, PIX, SINPE o banco según tu país); los rechazados por
          protocolo pueden regrabarse. ¿Dudas? Escríbenos por WhatsApp antes de
          grabar — una pregunta a tiempo salva un lote entero.
        </p>
        <div className="flex flex-wrap gap-3 mt-3">
          <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener"
            className="btn text-sm inline-block">📲 Canal — tareas y avisos</a>
          <a href={WHATSAPP_SOPORTE} target="_blank" rel="noopener"
            className="btn-ghost text-sm inline-block">❓ Dudas — chat directo</a>
        </div>
      </section>

      <div className="text-center mt-8">
        <Link href="/tasks" className="btn">Ver tareas disponibles</Link>
      </div>
    </article>
  );
}
