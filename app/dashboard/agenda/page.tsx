import { getClients, type Client } from "@/lib/supabase";
import AgendaView from "./agenda-view";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  let clients: Client[] = [];
  let error = "";

  try {
    clients = await getClients();
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
            Tunja de lunes a viernes (azul) y Turmequé los sábados (verde).
          </p>
        </div>
      </header>

      {error ? <p className="dashboard-error">{error}</p> : <AgendaView clients={clients} />}
    </>
  );
}
