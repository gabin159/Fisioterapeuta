import { getScheduledClients, type Client } from "@/lib/supabase";
import AgendaView from "./agenda-view";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  let clients: Client[] = [];
  let error = "";

  try {
    clients = (await getScheduledClients()).filter(
      (client) => Boolean(client.fecha_cita) && Boolean(client.hora_cita)
    );
  } catch {
    error = "No fue posible cargar la agenda desde la base de datos.";
  }

  return (
    <>
      <header className="dash-page-header">
        <div>
          <p className="eyebrow">AGENDA</p>
          <h1>Tu semana.</h1>
          <p className="dash-page-subtitle">
            Lunes a domingo, 8:00 a.m. a 4:00 p.m. Tunja en azul y Turmequé en verde.
          </p>
        </div>
      </header>

      {error ? <p className="dashboard-error">{error}</p> : <AgendaView clients={clients} />}
    </>
  );
}
