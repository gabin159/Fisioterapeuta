"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ClientForm from "@/app/_components/client-form";
import Modal from "@/app/_components/modal";
import type { Client } from "@/lib/supabase";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15];
const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function ymd(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(base: Date) {
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function normalizeHour(value: string | null) {
  if (!value) return "";
  const match = value.match(/(\d{1,2})/);
  if (!match) return "";
  return `${pad(Number(match[1]))}:00`;
}

function formatRange(start: Date) {
  const end = addDays(start, 5);
  const startLabel = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(start);
  const endLabel = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end);
  return `${startLabel} – ${endLabel}`;
}

export default function AgendaView({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slot, setSlot] = useState<{ fecha: string; hora: string; etiqueta: string } | null>(null);

  const days = useMemo(
    () => Array.from({ length: 6 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Client[]>();
    for (const client of clients) {
      if (!client.fecha_cita) continue;
      const key = `${client.fecha_cita}|${normalizeHour(client.hora_cita)}`;
      const bucket = map.get(key);
      if (bucket) bucket.push(client);
      else map.set(key, [client]);
    }
    return map;
  }, [clients]);

  const weekKeys = days.map((day) => ymd(day));
  const weekAppointments = clients.filter((client) =>
    client.fecha_cita ? weekKeys.includes(client.fecha_cita) : false
  ).length;

  function openSlot(day: Date, hour: number) {
    setSlot({
      fecha: ymd(day),
      hora: `${pad(hour)}:00`,
      etiqueta: `${new Intl.DateTimeFormat("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(day)} · ${pad(hour)}:00`,
    });
  }

  function handleSaved() {
    setSlot(null);
    router.refresh();
  }

  return (
    <section className="panel">
      <div className="agenda-toolbar">
        <div>
          <p className="eyebrow">SEMANA</p>
          <strong className="agenda-week">{formatRange(weekStart)}</strong>
          <p className="agenda-count">{weekAppointments} citas agendadas</p>
        </div>
        <div className="agenda-nav">
          <button type="button" onClick={() => setWeekStart((current) => addDays(current, -7))}>
            ← Anterior
          </button>
          <button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Hoy
          </button>
          <button type="button" onClick={() => setWeekStart((current) => addDays(current, 7))}>
            Siguiente →
          </button>
        </div>
      </div>

      <div className="agenda-scroll">
        <div className="agenda">
          <div className="agenda-corner" />
          {days.map((day, index) => (
            <div key={ymd(day)} className={`agenda-head ${index === 5 ? "sat" : ""}`}>
              <strong>{DAY_LABELS[index]}</strong>
              <span>
                {new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(day)}
              </span>
              <em>{index === 5 ? "Turmequé" : "Tunja"}</em>
            </div>
          ))}

          {HOURS.map((hour) => (
            <div className="agenda-row-contents" key={hour} style={{ display: "contents" }}>
              <div className="agenda-time">{`${pad(hour)}:00`}</div>
              {days.map((day, index) => {
                const key = `${ymd(day)}|${pad(hour)}:00`;
                const items = grouped.get(key) ?? [];
                const sedeClass = index === 5 ? "turmeque" : "tunja";
                return (
                  <div
                    key={key}
                    className="agenda-cell"
                    role="button"
                    tabIndex={0}
                    onClick={() => openSlot(day, hour)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openSlot(day, hour);
                      }
                    }}
                    aria-label={`Agendar ${DAY_LABELS[index]} ${pad(hour)}:00`}
                  >
                    {items.map((client) => (
                      <span
                        key={client.id}
                        className={`chip ${sedeClass}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <strong>{client.nombre}</strong>
                        {client.servicio}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="agenda-legend">
        <span>
          <i style={{ background: "#1e78d1" }} /> Sede Tunja · lunes a viernes
        </span>
        <span>
          <i style={{ background: "#22a06b" }} /> Sede Turmequé · sábado
        </span>
      </div>

      <Modal
        open={Boolean(slot)}
        onClose={() => setSlot(null)}
        title="Nueva cita"
        subtitle={slot?.etiqueta}
      >
        {slot && (
          <ClientForm
            initial={{ fecha_cita: slot.fecha, hora_cita: slot.hora }}
            submitLabel="Agendar cita"
            onSaved={handleSaved}
          />
        )}
      </Modal>
    </section>
  );
}
