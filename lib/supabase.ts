type NewClient = {
  nombre: string;
  celular: string;
  servicio: string;
};

export type Client = NewClient & {
  id: string;
  creado_en: string;
};

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("La conexión con la base de datos no está configurada correctamente en variables de entorno.");
  }
  if (!url.startsWith("https://")) {
    throw new Error("SUPABASE_URL debe ser una URL HTTPS válida.");
  }

  return { url, secretKey };
}

async function request(path: string, options: RequestInit) {
  const { url, secretKey } = getConfig();

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorDetail = await response.text().catch(() => "Sin detalle de error");
    console.error(`[Supabase Error] ${response.status} - ${errorDetail}`);
    throw new Error("Ocurrió un error al procesar la solicitud en la base de datos.");
  }

  return response;
}

export async function createClient(client: NewClient): Promise<Client[]> {
  const response = await request("clientes", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(client),
  });

  return (await response.json()) as Client[];
}

export async function getClients(): Promise<Client[]> {
  const response = await request(
    "clientes?select=id,nombre,celular,servicio,creado_en&order=creado_en.desc",
    { method: "GET" }
  );

  return (await response.json()) as Client[];
}