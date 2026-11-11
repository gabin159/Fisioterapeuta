import LandingClient from "@/app/_components/landing-client";
import TelegramWidget from "@/app/_components/telegram-widget";
import { fallbackServices, type ServiceCardData } from "@/lib/content";
import { getActiveServices } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  let services: ServiceCardData[] = fallbackServices;

  try {
    const active = await getActiveServices();
    if (active.length > 0) {
      services = active.map((service, index) => ({
        numero: service.numero ?? String(index + 1).padStart(2, "0"),
        titulo: service.titulo,
        descripcion: service.descripcion ?? "",
        precio: service.precio ?? "",
        imagen: service.imagen || "/images/rehabilitacion.jpg",
      }));
    }
  } catch {
    services = fallbackServices;
  }

  return (
    <>
      <LandingClient services={services} />
      <TelegramWidget />
    </>
  );
}
