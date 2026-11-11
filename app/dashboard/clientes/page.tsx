import { getClients, type Client } from "@/lib/supabase";
import ClientsView from "./clients-view";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  let clients: Client[] = [];
  let error = "";

  try {
    clients = await getClients();
  } catch {
    error = "No fue posible cargar los clientes desde la base de datos.";
  }

  return (
    <>
      <header className="dash-page-header">
        <div>
          <p className="eyebrow">CLIENTES</p>
          <h1>Tu comunidad.</h1>
          <p className="dash-page-subtitle">Busca, filtra y registra clientes de forma manual.</p>
        </div>
      </header>

      {error ? <p className="dashboard-error">{error}</p> : <ClientsView clients={clients} />}
    </>
  );
}
