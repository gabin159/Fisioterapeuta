import Link from "next/link";
import ClientStatusControl from "@/app/_components/client-status-control";
import NewRequestButton from "@/app/_components/new-request-button";
import { getClients, type Client } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatClientDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  let clients: Client[] = [];
  let error = "";

  try {
    clients = await getClients();
  } catch {
    error = "No fue posible cargar las solicitudes de la base de datos.";
  }

  const lastRequest = clients[0];
  const recent = clients.slice(0, 6);
  const pending = clients.filter((client) => {
    const estado = (client.estado ?? "").toLowerCase();
    return !estado.includes("al d") && !estado.includes("confirm");
  }).length;

  return (
    <>
      <header className="dash-page-header">
        <div>
          <p className="eyebrow">{formatLongDate(new Date()).toUpperCase()}</p>
          <h1>Buenos días Lina.</h1>
          <p className="dash-page-subtitle">Este es el resumen de tu operación de hoy.</p>
        </div>
        <NewRequestButton />
      </header>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Solicitudes recibidas</span>
          <strong>{clients.length}</strong>
          <p>{pending} pendientes de confirmar</p>
        </article>
        <article className="stat-card">
          <span>Último contacto</span>
          <strong className="stat-card-date">
            {lastRequest ? formatClientDate(lastRequest.creado_en) : "—"}
          </strong>
          <p>{lastRequest?.nombre ?? "Aún no hay solicitudes"}</p>
        </article>
        <article className="stat-card">
          <span>Estado</span>
          <strong>{error ? "!" : "OK"}</strong>
          <p>{error ? "Revisa la conexión" : "Base de datos conectada"}</p>
        </article>
      </div>

      <section className="panel" id="clientes">
        <div className="panel-head">
          <div>
            <p className="eyebrow">CLIENTES</p>
            <h2>Solicitudes recientes</h2>
          </div>
          <Link href="/dashboard/clientes">Ver todos →</Link>
        </div>

        <div className="appointments">
          {error && <p className="dashboard-error">{error}</p>}
          {!error && recent.length === 0 && (
            <p className="empty-state">
              Cuando alguien complete el formulario, aparecerá aquí con su nombre, celular y
              servicio.
            </p>
          )}
          {recent.map((client) => (
            <article className="appointment" key={client.id}>
              <time>{formatClientDate(client.creado_en)}</time>
              <div>
                <h3>{client.nombre}</h3>
                <p>
                  {client.celular}
                  {client.correo ? ` · ${client.correo}` : ""}
                </p>
              </div>
              <ClientStatusControl clientId={client.id} estado={client.estado} />
              <a
                className="client-whatsapp"
                href={`https://wa.me/${client.celular.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Escribir a ${client.nombre}`}
              >
                →
              </a>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
