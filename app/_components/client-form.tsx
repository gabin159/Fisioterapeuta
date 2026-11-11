"use client";

import { useState } from "react";
import { serviceOptions, statusOptions } from "@/lib/content";

export type ClientFormValues = {
  nombre: string;
  celular: string;
  correo: string;
  servicio: string;
  fecha_cita: string;
  hora_cita: string;
  estado: string;
};

const hours = Array.from({ length: 9 }, (_, index) => {
  const hour = 8 + index;
  return `${String(hour).padStart(2, "0")}:00`;
});

export default function ClientForm({
  initial,
  submitLabel = "Guardar",
  onSaved,
}: {
  initial?: Partial<ClientFormValues>;
  submitLabel?: string;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.get("nombre"),
          celular: form.get("celular"),
          correo: form.get("correo"),
          servicio: form.get("servicio"),
          fecha_cita: form.get("fecha_cita"),
          hora_cita: form.get("hora_cita"),
          estado: form.get("estado"),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "No fue posible guardar.");
      onSaved();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "No fue posible guardar."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <label>
        Nombre completo
        <input required name="nombre" maxLength={100} defaultValue={initial?.nombre ?? ""} placeholder="Nombre del paciente" />
      </label>
      <div className="modal-row">
        <label>
          Celular
          <input required name="celular" maxLength={30} defaultValue={initial?.celular ?? ""} placeholder="300 000 0000" />
        </label>
        <label>
          Correo electrónico
          <input type="email" name="correo" maxLength={160} defaultValue={initial?.correo ?? ""} placeholder="opcional" />
        </label>
      </div>
      <label>
        Servicio
        <select required name="servicio" defaultValue={initial?.servicio ?? ""}>
          <option value="" disabled>
            Selecciona una opción
          </option>
          {serviceOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className="modal-row">
        <label>
          Fecha de cita
          <input type="date" name="fecha_cita" defaultValue={initial?.fecha_cita ?? ""} />
        </label>
        <label>
          Hora de cita
          <select name="hora_cita" defaultValue={initial?.hora_cita ?? ""}>
            <option value="">Sin hora</option>
            {hours.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Estado
        <select name="estado" defaultValue={initial?.estado ?? "Pendiente"}>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="modal-error" role="alert">
          {error}
        </p>
      )}

      <div className="modal-actions">
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
