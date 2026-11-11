import { getServices, type Service } from "@/lib/supabase";
import ServicesView from "./services-view";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  let services: Service[] = [];
  let error = "";

  try {
    services = await getServices();
  } catch {
    error = "No fue posible cargar los servicios desde la base de datos.";
  }

  return (
    <>
      <header className="dash-page-header">
        <div>
          <p className="eyebrow">SERVICIOS</p>
          <h1>Tu catálogo.</h1>
          <p className="dash-page-subtitle">
            Crea, edita y activa los servicios que se muestran en la web.
          </p>
        </div>
      </header>

      {error ? <p className="dashboard-error">{error}</p> : <ServicesView services={services} />}
    </>
  );
}
