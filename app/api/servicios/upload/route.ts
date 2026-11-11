import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { uploadServiceImage } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || typeof file === "string" || file.size === 0) {
      return NextResponse.json({ message: "Selecciona una imagen para subir." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "El archivo debe ser una imagen (JPG, PNG, WEBP…)." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { message: "La imagen no puede superar los 5 MB." },
        { status: 400 }
      );
    }

    const url = await uploadServiceImage(file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No fue posible subir la imagen. Intenta nuevamente.",
      },
      { status: 500 }
    );
  }
}
