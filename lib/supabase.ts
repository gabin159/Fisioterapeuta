import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Client = {
  id: number;
  created_at: string | null;
  creado_en: string | null;
  nombre: string;
  celular: string;
  correo: string | null;
  servicio: string;
  fecha_cita: string | null;
  hora_cita: string | null;
  estado: string | null;
};

export type Service = {
  id: string;
  numero: string | null;
  titulo: string;
  descripcion: string | null;
  precio: string | null;
  imagen: string | null;
  orden: number | null;
  activo: boolean | null;
  creado_en: string | null;
  actualizado_en: string | null;
};

export type Administrator = {
  id: string;
  email: string;
  password_hash: string;
  creado_en: string | null;
};

export type NewClientInput = {
  nombre: string;
  celular: string;
  correo?: string | null;
  servicio: string;
  fecha_cita?: string | null;
  hora_cita?: string | null;
  estado?: string | null;
};

export type ServiceInput = {
  numero?: string | null;
  titulo: string;
  descripcion?: string | null;
  precio?: string | null;
  imagen?: string | null;
  orden?: number | null;
  activo?: boolean | null;
};

let cachedAdmin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("La conexión con la base de datos no está configurada en variables de entorno.");
  }
  if (!url.startsWith("https://")) {
    throw new Error("SUPABASE_URL debe ser una URL HTTPS válida.");
  }

  if (!cachedAdmin) {
    cachedAdmin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return cachedAdmin;
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabaseAdmin()
    .from("clientes")
    .select("*")
    .order("creado_en", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function getScheduledClients(): Promise<Client[]> {
  const { data, error } = await supabaseAdmin()
    .from("clientes")
    .select("*")
    .not("fecha_cita", "is", null)
    .not("hora_cita", "is", null)
    .order("fecha_cita", { ascending: true })
    .order("hora_cita", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function createClientRecord(input: NewClientInput): Promise<Client> {
  const { data, error } = await supabaseAdmin()
    .from("clientes")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Client;
}

export async function updateClientStatus(id: number, estado: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("clientes")
    .update({ estado })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabaseAdmin()
    .from("servicios")
    .select("*")
    .order("orden", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Service[];
}

export async function getActiveServices(): Promise<Service[]> {
  const services = await getServices();
  return services.filter((service) => service.activo !== false);
}

export async function createService(input: ServiceInput): Promise<Service> {
  const { data, error } = await supabaseAdmin()
    .from("servicios")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Service;
}

export async function updateService(id: string, input: ServiceInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("servicios")
    .update({ ...input, actualizado_en: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function setServiceActive(id: string, activo: boolean): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("servicios")
    .update({ activo, actualizado_en: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("servicios").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

const SERVICE_IMAGE_BUCKET = "servicios";

async function ensureServiceImageBucket(client: SupabaseClient) {
  const { data: bucket } = await client.storage.getBucket(SERVICE_IMAGE_BUCKET);

  if (!bucket) {
    const { error } = await client.storage.createBucket(SERVICE_IMAGE_BUCKET, { public: true });
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`No fue posible preparar el almacenamiento de imágenes: ${error.message}`);
    }
    return;
  }

  if (!bucket.public) {
    const { error } = await client.storage.updateBucket(SERVICE_IMAGE_BUCKET, { public: true });
    if (error) {
      throw new Error(`No fue posible hacer público el bucket de imágenes: ${error.message}`);
    }
  }
}

function imageExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(fromName)) return fromName;
  const fromType = (file.type.split("/")[1] ?? "jpg").toLowerCase();
  return fromType === "jpeg" ? "jpg" : fromType || "jpg";
}

export async function uploadServiceImage(file: File): Promise<string> {
  const client = supabaseAdmin();
  await ensureServiceImageBucket(client);

  const path = `servicios/servicio-${Date.now()}-${randomUUID().slice(0, 8)}.${imageExtension(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await client.storage
    .from(SERVICE_IMAGE_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = client.storage.from(SERVICE_IMAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("No fue posible obtener la URL pública de la imagen.");
  }
  return data.publicUrl;
}

export async function getAdministratorByEmail(email: string): Promise<Administrator | null> {
  const { data, error } = await supabaseAdmin()
    .from("administradores")
    .select("*")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Administrator) ?? null;
}
