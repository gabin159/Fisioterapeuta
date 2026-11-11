"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/app/_components/modal";
import { serviceImagePresets } from "@/lib/content";
import type { Service } from "@/lib/supabase";

type Draft = {
  id?: string;
  numero: string;
  titulo: string;
  descripcion: string;
  precio: string;
  imagen: string;
  orden: string;
  activo: boolean;
};

const emptyDraft: Draft = {
  numero: "",
  titulo: "",
  descripcion: "",
  precio: "",
  imagen: "/images/rehabilitacion.jpg",
  orden: "",
  activo: true,
};

function toDraft(service?: Service): Draft {
  if (!service) return { ...emptyDraft };
  return {
    id: service.id,
    numero: service.numero ?? "",
    titulo: service.titulo,
    descripcion: service.descripcion ?? "",
    precio: service.precio ?? "",
    imagen: service.imagen ?? "/images/rehabilitacion.jpg",
    orden: service.orden != null ? String(service.orden) : "",
    activo: service.activo !== false,
  };
}

export default function ServicesView({ services }: { services: Service[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/servicios", {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draft.id,
          numero: draft.numero,
          titulo: draft.titulo,
          descripcion: draft.descripcion,
          precio: draft.precio,
          imagen: draft.imagen,
          orden: draft.orden,
          activo: draft.activo,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "No fue posible guardar.");
      setDraft(null);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(service: Service) {
    setBusyId(service.id);
    try {
      const response = await fetch("/api/servicios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id, activo: service.activo === false }),
      });
      if (!response.ok) {
        const result = await response.json();
        window.alert(result.message ?? "No fue posible cambiar el estado.");
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function removeService(service: Service) {
    if (!window.confirm(`¿Eliminar el servicio "${service.titulo}"?`)) return;
    setBusyId(service.id);
    try {
      const response = await fetch(`/api/servicios?id=${encodeURIComponent(service.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = await response.json();
        window.alert(result.message ?? "No fue posible eliminar.");
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-toolbar">
        <div className="panel-count">
          {services.length} servicios · {services.filter((service) => service.activo !== false).length} activos
        </div>
        <button
          type="button"
          className="new-appointment"
          onClick={() => {
            setError("");
            setDraft(toDraft());
          }}
        >
          + Nuevo servicio
        </button>
      </div>

      {services.length === 0 && (
        <p className="empty-state">
          Aún no hay servicios. Crea el primero o ejecuta el seed SQL para cargar el catálogo
          inicial.
        </p>
      )}

      <div className="service-admin-grid">
        {services.map((service) => {
          const active = service.activo !== false;
          return (
            <article className="service-admin-card" key={service.id}>
              <div className="service-admin-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={service.imagen || "/images/rehabilitacion.jpg"} alt={service.titulo} loading="lazy" />
                <span className={`badge ${active ? "ok" : "pending"}`}>
                  {active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="sa-body">
                <p className="sa-number">{service.numero || "—"}</p>
                <h3 className="sa-title">{service.titulo}</h3>
                <p className="sa-desc">{service.descripcion || "Sin descripción."}</p>
                <div className="sa-meta">
                  <span>{service.precio || "Sin precio"}</span>
                  <span>Orden {service.orden ?? "—"}</span>
                </div>
                <div className="sa-actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setError("");
                      setDraft(toDraft(service));
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={busyId === service.id}
                    onClick={() => toggleActive(service)}
                  >
                    {busyId === service.id ? "…" : active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    disabled={busyId === service.id}
                    onClick={() => removeService(service)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Editar servicio" : "Nuevo servicio"}
        subtitle="Estos datos alimentan el catálogo de la página pública."
      >
        {draft && (
          <form className="modal-form" onSubmit={handleSave}>
            <div className="modal-row">
              <label>
                Número
                <input
                  name="numero"
                  maxLength={10}
                  value={draft.numero}
                  onChange={(event) => update("numero", event.target.value)}
                  placeholder="01"
                />
              </label>
              <label>
                Orden
                <input
                  name="orden"
                  type="number"
                  value={draft.orden}
                  onChange={(event) => update("orden", event.target.value)}
                  placeholder="1"
                />
              </label>
            </div>
            <label>
              Título
              <input
                required
                name="titulo"
                maxLength={140}
                value={draft.titulo}
                onChange={(event) => update("titulo", event.target.value)}
                placeholder="Rehabilitación física"
              />
            </label>
            <label>
              Descripción
              <textarea
                name="descripcion"
                maxLength={600}
                value={draft.descripcion}
                onChange={(event) => update("descripcion", event.target.value)}
                placeholder="Describe el servicio…"
              />
            </label>
            <label>
              Precio
              <input
                name="precio"
                maxLength={120}
                value={draft.precio}
                onChange={(event) => update("precio", event.target.value)}
                placeholder="Desde $85.000 la sesión"
              />
            </label>
            <label>
              Imagen (URL o ruta)
              <input
                name="imagen"
                maxLength={500}
                value={draft.imagen}
                onChange={(event) => update("imagen", event.target.value)}
                placeholder="/images/rehabilitacion.jpg"
              />
            </label>
            <div className="image-presets">
              {serviceImagePresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`image-preset ${draft.imagen === preset.value ? "selected" : ""}`}
                  onClick={() => update("imagen", preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {draft.imagen && (
              <div className="image-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.imagen} alt="Vista previa" />
              </div>
            )}
            <label className="switch-row">
              <input
                type="checkbox"
                checked={draft.activo}
                onChange={(event) => update("activo", event.target.checked)}
              />
              Mostrar este servicio en la página pública
            </label>

            {error && (
              <p className="modal-error" role="alert">
                {error}
              </p>
            )}

            <div className="modal-actions">
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? "Guardando…" : "Guardar servicio"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
