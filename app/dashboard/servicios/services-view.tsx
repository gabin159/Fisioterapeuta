"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/app/_components/modal";
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
  imagen: "",
  orden: "",
  activo: true,
};

const FALLBACK_IMAGE = "/images/rehabilitacion.jpg";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function toDraft(service?: Service): Draft {
  if (!service) return { ...emptyDraft };
  return {
    id: service.id,
    numero: service.numero ?? "",
    titulo: service.titulo,
    descripcion: service.descripcion ?? "",
    precio: service.precio ?? "",
    imagen: service.imagen ?? "",
    orden: service.orden != null ? String(service.orden) : "",
    activo: service.activo !== false,
  };
}

function fallbackImage(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallback === "true") return;
  image.dataset.fallback = "true";
  image.src = FALLBACK_IMAGE;
}

export default function ServicesView({ services }: { services: Service[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [panelError, setPanelError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 4200);
    return () => clearTimeout(timeout);
  }, [notice]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function clearSelection() {
    setFile(null);
    setPreview("");
  }

  function openCreate() {
    setError("");
    setPanelError("");
    clearSelection();
    setDraft({ ...emptyDraft });
  }

  function openEdit(service: Service) {
    setError("");
    setPanelError("");
    clearSelection();
    setDraft(toDraft(service));
  }

  function closeModal() {
    if (saving || uploading) return;
    setDraft(null);
    setError("");
    clearSelection();
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    event.target.value = "";
    if (!next) return;

    if (!next.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen válido (JPG, PNG o WEBP).");
      return;
    }
    if (next.size > MAX_IMAGE_BYTES) {
      setError("La imagen no puede superar los 5 MB.");
      return;
    }

    setError("");
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    const editing = Boolean(draft.id);
    setSaving(true);
    setError("");
    setPanelError("");
    let imageUrl = draft.imagen.trim();

    try {
      if (file) {
        setUploading(true);
        const form = new FormData();
        form.append("file", file);
        const uploadResponse = await fetch("/api/servicios/upload", {
          method: "POST",
          body: form,
        });
        const uploadResult = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.message ?? "No fue posible subir la imagen.");
        }
        imageUrl = uploadResult.url;
        setUploading(false);
      }

      const response = await fetch("/api/servicios", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draft.id,
          numero: draft.numero,
          titulo: draft.titulo,
          descripcion: draft.descripcion,
          precio: draft.precio,
          imagen: imageUrl,
          orden: draft.orden,
          activo: draft.activo,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message ?? "No fue posible guardar el servicio.");

      setDraft(null);
      clearSelection();
      setNotice(editing ? "Servicio actualizado correctamente." : "Servicio creado correctamente.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "No fue posible guardar el servicio."
      );
    } finally {
      setUploading(false);
      setSaving(false);
    }
  }

  async function toggleActive(service: Service) {
    const nextActive = service.activo === false;
    setBusyId(service.id);
    setPanelError("");
    try {
      const response = await fetch("/api/servicios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id, activo: nextActive }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setPanelError(result.message ?? "No fue posible cambiar el estado.");
        return;
      }
      setNotice(nextActive ? "Servicio activado correctamente." : "Servicio desactivado correctamente.");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function removeService(service: Service) {
    if (!window.confirm(`¿Eliminar el servicio "${service.titulo}"?`)) return;
    setBusyId(service.id);
    setPanelError("");
    try {
      const response = await fetch(`/api/servicios?id=${encodeURIComponent(service.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setPanelError(result.message ?? "No fue posible eliminar el servicio.");
        return;
      }
      setNotice("Servicio eliminado correctamente.");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const previewSrc = preview || draft?.imagen || FALLBACK_IMAGE;

  return (
    <section className="panel">
      <div className="panel-toolbar">
        <div className="panel-count">
          {services.length} servicios ·{" "}
          {services.filter((service) => service.activo !== false).length} activos
        </div>
        <button type="button" className="new-appointment" onClick={openCreate}>
          + Nuevo servicio
        </button>
      </div>

      {notice && (
        <div className="dash-banner success" role="status">
          <span aria-hidden="true">✓</span>
          {notice}
        </div>
      )}

      {panelError && (
        <div className="dash-banner error" role="alert">
          <span aria-hidden="true">!</span>
          {panelError}
          <button type="button" onClick={() => setPanelError("")} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}

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
                <img
                  src={service.imagen || FALLBACK_IMAGE}
                  alt={service.titulo}
                  loading="lazy"
                  onError={fallbackImage}
                />
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
                  <button type="button" className="btn" onClick={() => openEdit(service)}>
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
        onClose={closeModal}
        title={draft?.id ? "Editar servicio" : "Nuevo servicio"}
        subtitle="Sube una imagen o mantén la actual. También acepta imágenes enviadas por el bot de Telegram."
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
                placeholder="$90.000"
              />
            </label>

            <div className="image-field">
              <span className="image-field-label">Imagen del servicio</span>
              <div className="image-uploader">
                <input
                  id="service-image-input"
                  className="image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  disabled={saving || uploading}
                />
                <label htmlFor="service-image-input" className="image-drop">
                  <span className="image-drop-icon" aria-hidden="true">
                    ↑
                  </span>
                  <span className="image-drop-copy">
                    <strong>
                      {file
                        ? "Imagen seleccionada"
                        : draft.imagen
                          ? "Cambiar imagen"
                          : "Seleccionar imagen"}
                    </strong>
                    <small>{file ? file.name : "JPG, PNG o WEBP · máximo 5 MB"}</small>
                  </span>
                </label>
              </div>

              {file && (
                <div className="image-selection">
                  <span className="image-selection-name">{file.name}</span>
                  <button
                    type="button"
                    className="btn"
                    onClick={clearSelection}
                    disabled={saving || uploading}
                  >
                    Quitar selección
                  </button>
                </div>
              )}

              <div className={`image-preview image-preview-lg ${uploading ? "is-uploading" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc} alt="Vista previa del servicio" onError={fallbackImage} />
                {uploading && (
                  <span className="image-uploading">
                    <span className="upload-spinner" aria-hidden="true" />
                    Subiendo imagen…
                  </span>
                )}
              </div>
            </div>

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
              <button type="button" className="btn" onClick={closeModal} disabled={saving || uploading}>
                Cancelar
              </button>
              <button type="submit" className="btn primary" disabled={saving || uploading}>
                {uploading ? "Subiendo imagen…" : saving ? "Guardando…" : "Guardar servicio"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
