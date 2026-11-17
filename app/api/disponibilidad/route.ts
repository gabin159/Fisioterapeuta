import { NextResponse } from "next/server";
import { getBookedSlots } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slots = await getBookedSlots();
    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json(
      { message: "No fue posible consultar los horarios disponibles." },
      { status: 500 }
    );
  }
}
