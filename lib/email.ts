import { formatTimeLabel } from "@/lib/format";

type BookingEmailInput = {
  nombre: string;
  correo: string;
  celular: string;
  servicio: string;
  fechaCita: string;
  horaCita: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(fecha: string) {
  const date = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function sendBookingConfirmation(input: BookingEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from || !input.correo) return;

  const nombre = escapeHtml(input.nombre);
  const servicio = escapeHtml(input.servicio);
  const fecha = escapeHtml(formatDate(input.fechaCita));
  const hora = escapeHtml(formatTimeLabel(input.horaCita));

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0a2540;line-height:1.6">
      <h2 style="margin:0 0 12px">Tu cita está reservada</h2>
      <p>Hola ${nombre}, recibimos tu solicitud de reserva. Estos son los datos:</p>
      <ul style="padding-left:18px">
        <li><strong>Servicio:</strong> ${servicio}</li>
        <li><strong>Fecha:</strong> ${fecha}</li>
        <li><strong>Hora:</strong> ${hora}</li>
        <li><strong>Celular:</strong> ${escapeHtml(input.celular)}</li>
      </ul>
      <p>Muy pronto nos pondremos en contacto contigo para confirmar la cita.</p>
      <p>La Fisioterapeuta Li · WhatsApp 311 398 1422</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.correo],
      subject: `Reserva recibida · ${formatDate(input.fechaCita)} ${formatTimeLabel(
        input.horaCita
      )}`,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`No fue posible enviar el correo de confirmación (${response.status}).`);
  }
}
