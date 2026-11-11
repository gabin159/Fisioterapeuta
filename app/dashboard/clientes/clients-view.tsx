"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ClientForm from "@/app/_components/client-form";
import Modal from "@/app/_components/modal";
import type { Client } from "@/lib/supabase";

function isUpToDate(estado: string | null) {
  const value = (estado ?? "").toLowerCase();
  return value.includes("al d") || value.includes("confirm");
}

function formatCita(client: Client) {
  if (!client.fecha_cita) return "Sin agendar";
  const label = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${client.fecha_cita}T12:00:00`));
  return client.hora_cita ? `${label} · ${client.hora_cita.slice(0, 5)}` : label;
}

export default function ClientsView({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesQuery =
        !term ||
        client.nombre.toLowerCase().includes(term) ||
        client.celular.toLowerCase().includes(term) ||
        (client.correo ?? "").toLowerCase().includes(term) ||
        client.servicio.toLowerCase().includes(term);

      const matchesFilter =
        filter === "todos" ||
        (filter === "al-dia" ? isUpToDate(client.estado) : !isUpToDate(client.estado));

      return matchesQuery && matchesFilter;
    });
  }, [clients, query, filter]);

  function handleSaved() {
    setOpen(false);
    router.refresh();
  }

  return (
    <section className="panel">
      <div className="panel-toolbar">
        <input
          className="panel-search"
          type="search"
          placeholder="Buscar por nombre, celular o correo…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filtrar por pago">
          <option value="todos">Todos los pagos</option>
          <option value="al-dia">Al día</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <button type="button" className="new-appointment" onClick={() => setOpen(true)}>
          + Nuevo cliente
        </button>
      </div>

      <div className="panel-count">
        {filtered.length} de {clients.length} clientes
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Servicio</th>
              <th>Cita</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="table-empty">
                  No hay clientes que coincidan con la búsqueda.
                </td>
              </tr>
            )}
            {filtered.map((client) => (
              <tr key={client.id}>
                <td>
                  <strong>{client.nombre}</strong>
                </td>
                <td>
                  {client.celular}
                  {client.correo && <small>{client.correo}</small>}
                </td>
                <td>{client.servicio}</td>
                <td>{formatCita(client)}</td>
                <td>
                  <span className={`badge ${isUpToDate(client.estado) ? "ok" : "pending"}`}>
                    {client.estado ?? "Pendiente"}
                  </span>
                </td>
                <td>
                  <a
                    className="table-action"
                    href={`https://wa.me/${client.celular.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Escribir a ${client.nombre}`}
                  >
                    WhatsApp ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo cliente"
        subtitle="Registra un cliente y, si quieres, agenda su cita."
      >
        <ClientForm submitLabel="Guardar cliente" onSaved={handleSaved} />
      </Modal>
    </section>
  );
}
