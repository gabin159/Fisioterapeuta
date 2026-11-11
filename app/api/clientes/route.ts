import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import {
  createClientRecord,
  getClients,
  updateClientStatus,
} from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max: number): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : "";
}

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const clients = await getClients();
    return NextResponse.json({ clients });
  } catch {
    return NextResponse.json({ message: "No fue posible cargar los clientes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nombre = clean(body.nombre, 100);
    const celular = clean(body.celular, 30);
    const servicio = clean(body.servicio, 120);
    const correo = clean(body.correo, 160);
    const fechaCita = clean(body.fecha_cita, 20);
    const horaCita = clean(body.hora_cita, 10);
    const estado = clean(body.estado, 30) || "Pendiente";

    if (!nombre || !celular || !servicio) {
      return NextResponse.json(
        { message: "Completa nombre, celular y servicio." },
        { status: 400 }
      );
    }

    await createClientRecord({
      nombre,
      celular,
      servicio,
      correo: correo || null,
      fecha_cita: fechaCita || null,
      hora_cita: horaCita || null,
      estado,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "No fue posible registrar la solicitud. Intenta nuevamente." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    const estado = clean(body.estado, 30);

    if (!Number.isFinite(id) || !estado) {
      return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
    }

    await updateClientStatus(id, estado);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "No fue posible actualizar el cliente." }, { status: 500 });
  }
}
