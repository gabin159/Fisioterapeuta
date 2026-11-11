import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession, safeEquals, sessionCookie } from "@/lib/auth";
import { getAdministratorByEmail } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let email = "";
  let password = "";

  try {
    const body = await request.json();
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ message: "Completa correo y contraseña." }, { status: 400 });
  }

  let isValid = false;
  let sessionEmail = email;

  // 1) Intenta validar contra la tabla `administradores`.
  try {
    const administrator = await getAdministratorByEmail(email);
    if (administrator?.password_hash) {
      try {
        isValid = await bcrypt.compare(password, administrator.password_hash);
      } catch {
        isValid = false;
      }
      if (isValid) sessionEmail = administrator.email;
    }
  } catch {
    // Si la tabla no está disponible, se usa el respaldo por variables de entorno.
  }

  // 2) Respaldo con las credenciales de entorno (ADMIN_EMAIL / ADMIN_PASSWORD).
  if (!isValid) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword && safeEquals(email, adminEmail) && safeEquals(password, adminPassword)) {
      isValid = true;
      sessionEmail = adminEmail;
    }
  }

  if (!isValid) {
    return NextResponse.json({ message: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie.name, createSession(sessionEmail), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookie.maxAge,
  });
  return response;
}
