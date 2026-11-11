import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 horas

type SessionPayload = {
  email: string;
  expiresAt: number;
};

function getSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) throw new Error("Falta la variable de entorno AUTH_SESSION_SECRET");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function safeEquals(first: string, second: string): boolean {
  const a = Buffer.from(first);
  const b = Buffer.from(second);

  // Evita comparar longitudes directamente para prevenir timing attacks por longitud
  const aHash = createHmac("sha256", "timing-safe-key").update(a).digest();
  const bHash = createHmac("sha256", "timing-safe-key").update(b).digest();

  return timingSafeEqual(aHash, bHash);
}

export function createSession(email: string): string {
  const payload: SessionPayload = {
    email,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  if (!safeEquals(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as SessionPayload;

    if (!payload.expiresAt || payload.expiresAt <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export const sessionCookie = {
  name: "fisioterapeuta_li_session",
  maxAge: SESSION_DURATION_SECONDS,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function getServerSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(sessionCookie.name)?.value);
}