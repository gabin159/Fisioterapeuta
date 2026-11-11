import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";

function clearSession(response: NextResponse) {
  response.cookies.set(sessionCookie.name, "", { path: "/", maxAge: 0 });
  return response;
}

export async function POST() {
  return clearSession(NextResponse.json({ ok: true }));
}

export async function GET(request: Request) {
  return clearSession(NextResponse.redirect(new URL("/", request.url)));
}
