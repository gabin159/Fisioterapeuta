import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import {
  createService,
  deleteService,
  getServices,
  setServiceActive,
  updateService,
  type ServiceInput,
} from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max: number): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : "";
}

function toOrder(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseService(body: Record<string, unknown>): ServiceInput | null {
  const titulo = clean(body.titulo, 140);
  if (!titulo) return null;

  return {
    titulo,
    numero: clean(body.numero, 10) || null,
    descripcion: clean(body.descripcion, 600) || null,
    precio: clean(body.precio, 120) || null,
    imagen: clean(body.imagen, 500) || null,
    orden: toOrder(body.orden),
    activo: body.activo === undefined ? true : Boolean(body.activo),
  };
}

async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession();
  return Boolean(session);
}

function isMissingActiveColumn(error: unknown) {
  return error instanceof Error && /activo/i.test(error.message);
}

export async function GET() {
  try {
    const services = await getServices();
    return NextResponse.json({ services });
  } catch {
    return NextResponse.json({ message: "No fue posible cargar los servicios." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const input = parseService((await request.json()) as Record<string, unknown>);
    if (!input) {
      return NextResponse.json({ message: "El título del servicio es obligatorio." }, { status: 400 });
    }

    try {
      const service = await createService(input);
      return NextResponse.json({ service }, { status: 201 });
    } catch (error) {
      if (!isMissingActiveColumn(error)) throw error;
      const service = await createService({ ...input, activo: undefined });
      return NextResponse.json({ service }, { status: 201 });
    }
  } catch {
    return NextResponse.json({ message: "No fue posible crear el servicio." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = clean(body.id, 60);
    const input = parseService(body);

    if (!id || !input) {
      return NextResponse.json({ message: "Datos del servicio inválidos." }, { status: 400 });
    }

    try {
      await updateService(id, input);
    } catch (error) {
      if (!isMissingActiveColumn(error)) throw error;
      await updateService(id, { ...input, activo: undefined });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "No fue posible actualizar el servicio." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = clean(body.id, 60);
    const activo = Boolean(body.activo);

    if (!id) {
      return NextResponse.json({ message: "Servicio inválido." }, { status: 400 });
    }

    await setServiceActive(id, activo);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: "No fue posible cambiar el estado. ¿Agregaste la columna 'activo' con la migración SQL?" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const fromQuery = url.searchParams.get("id");
    let id = fromQuery ? fromQuery.trim() : "";

    if (!id) {
      try {
        const body = (await request.json()) as Record<string, unknown>;
        id = clean(body.id, 60);
      } catch {
        id = "";
      }
    }

    if (!id) {
      return NextResponse.json({ message: "Servicio inválido." }, { status: 400 });
    }

    await deleteService(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "No fue posible eliminar el servicio." }, { status: 500 });
  }
}
