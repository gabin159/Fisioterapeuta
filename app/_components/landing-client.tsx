"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ServiceCardData } from "@/lib/content";
import { dateKey, isWeekendKey, slotHour, slotsForDateKey } from "@/lib/agenda";
import { normalizeDateKey, parseAppointmentTime, formatPrice } from "@/lib/format";

const navLinks = [
  { href: "#nosotros", label: "Acerca de mí" },
  { href: "#servicios", label: "Servicios" },
  { href: "#horarios", label: "Horarios" },
  { href: "#reservas", label: "Reservas" },
];

const credentials = [
  "Fisioterapeuta — Universidad de Boyacá",
  "Maestría en Neurorrehabilitación (en formación) — Universidad Autónoma de Manizales",
  "Certificación en ATM y Bruxismo — CAAFYR",
  "Diplomado Internacional en Rehabilitación Deportiva — CRAPTICA",
];

export default function LandingClient({ services }: { services: ServiceCardData[] }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [bookedSlots, setBookedSlots] = useState<
    { fecha_cita: string | null; hora_cita: string | null }[]
  >([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [today, setToday] = useState<Date | null>(null);

  const bookingOptions = useMemo(() => {
    const list = ["Valoración inicial", ...services.map((service) => service.titulo)];
    return Array.from(new Set(list.filter(Boolean)));
  }, [services]);

  const loadAvailability = useCallback(async () => {
    try {
      const response = await fetch("/api/disponibilidad", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json();
      setBookedSlots(Array.isArray(result.slots) ? result.slots : []);
    } catch {
      setBookedSlots([]);
    }
  }, []);

  useEffect(() => {
    setToday(new Date());
    void loadAvailability();
  }, [loadAvailability]);

  const bookedHoursByDate = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const slot of bookedSlots) {
      const key = normalizeDateKey(slot.fecha_cita);
      const parsed = parseAppointmentTime(slot.hora_cita);
      if (!key || !parsed) continue;
      const hours = map.get(key) ?? new Set<number>();
      hours.add(parsed.hour);
      map.set(key, hours);
    }
    return map;
  }, [bookedSlots]);

  const availableDays = useMemo(() => {
    if (!today) return [];
    const days: { key: string; label: string }[] = [];

    for (let offset = 0; offset < 60; offset += 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
      const key = dateKey(date);
      const booked = bookedHoursByDate.get(key) ?? new Set<number>();
      const freeSlots = slotsForDateKey(key).filter((slot) => {
        if (booked.has(slotHour(slot))) return false;
        if (offset === 0 && slotHour(slot) <= today.getHours()) return false;
        return true;
      });
      if (freeSlots.length === 0) continue;

      const label = new Intl.DateTimeFormat("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(date);
      const sede = isWeekendKey(key) ? "Turmequé" : "Tunja";
      days.push({ key, label: `${label} · ${sede}` });
    }

    return days;
  }, [bookedHoursByDate, today]);

  const activeDate = availableDays.some((day) => day.key === selectedDate)
    ? selectedDate
    : availableDays[0]?.key ?? "";

  const activeHours = useMemo(() => {
    if (!activeDate || !today) return [];
    const booked = bookedHoursByDate.get(activeDate) ?? new Set<number>();
    const todayKey = dateKey(today);
    return slotsForDateKey(activeDate).filter((slot) => {
      if (booked.has(slotHour(slot))) return false;
      if (activeDate === todayKey && slotHour(slot) <= today.getHours()) return false;
      return true;
    });
  }, [activeDate, bookedHoursByDate, today]);

  const activeTime = activeHours.includes(selectedTime) ? selectedTime : "";

  function bookService(title: string) {
    setSent(false);
    setError("");
    setSelectedService(title);
    document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!activeDate || !activeTime) {
      setError("Selecciona un día y una hora disponibles.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.get("name"),
          celular: formData.get("phone"),
          correo: formData.get("email"),
          servicio: formData.get("service"),
          fecha_cita: activeDate,
          hora_cita: activeTime,
          estado: "Pendiente",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setSent(true);
      setSelectedTime("");
      await loadAvailability();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "No fue posible enviar la solicitud."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="lp">
      <header className="lp-nav">
        <div className="wrap lp-nav-inner">
          <a className="brand" href="#inicio" aria-label="Fisioterapeuta Lii, inicio">
            <span className="brand-icon">
              <Image src="/images/Logo.jpg" alt="Logo La Fisioterapeuta Li" width={34} height={34} />
            </span>
            La Fisioterapeuta Li
          </a>
          <nav aria-label="Navegación principal">
            <ul className="nav-list">
              {navLinks.map((link) => (
                <li key={link.href} className="nav-item">
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <a className="nav-cta" href="/acceso">
            <span className="nav-cta-icon" aria-hidden="true">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
              </svg>
            </span>
            Iniciar sesión
            <span className="nav-cta-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
      </header>

      <section id="inicio" className="lp-hero wrap">
        <div className="lp-hero-copy">
          <span className="lp-badge">Fisioterapia integral y humana</span>
          <h1 className="lp-title">
            Recupera tu movimiento, <em>recupera tu bienestar</em>
          </h1>
          <p className="lp-lead">
            Acompañamiento profesional y cercano para aliviar el dolor, recuperar movilidad y
            volver a disfrutar lo que más te gusta, con un plan hecho a tu medida.
          </p>
          <div className="lp-actions">
            <a className="lp-btn primary" href="#reservas">
              Reserva tu valoración <span aria-hidden="true">→</span>
            </a>
            <a className="lp-btn ghost" href="#servicios">
              Conoce los servicios
            </a>
          </div>
          <div className="lp-proof">
            <div className="lp-avatars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <p>
              <strong>+250 pacientes acompañados</strong>
              <span>Atención cercana, resultados reales.</span>
            </p>
          </div>
        </div>

        <div className="lp-hero-art">
          <span className="lp-ring" aria-hidden="true" />
          <div className="lp-hero-photo">
            <Image
              src="/images/Rodilla.jpg"
              alt="Sesión de fisioterapia con estimulación eléctrica en la rodilla"
              fill
              priority
              sizes="(max-width: 980px) 100vw, 540px"
              className="lp-hero-img"
            />
          </div>
          <span className="lp-floating">Atención personalizada</span>
        </div>
      </section>

      <section id="nosotros" className="lp-about">
        <div className="wrap lp-about-grid">
          <div className="lp-about-main">
            <p className="lp-eyebrow light">ACERCA DE MÍ</p>
            <h2 className="lp-about-title">
              Soy Lina Murillo, <em>tu fisioterapeuta.</em>
            </h2>
            <p className="lp-about-copy">
              Mi propósito es que encuentres una atención clara, humana y basada en tus
              necesidades reales. Trabajo con enfoque en neurorrehabilitación, rehabilitación
              deportiva y recuperación funcional, acompañándote en cada etapa del proceso.
            </p>
            <div className="lp-seal">
              <span className="lp-seal-icon" aria-hidden="true">
                ✦
              </span>
              <div>
                <strong>Fisioterapeuta certificada</strong>
                <span>Universidad de Boyacá</span>
              </div>
            </div>
          </div>

          <div className="lp-about-side">
            <div className="lp-metrics">
              <article>
                <strong>8+</strong>
                <span>Años de experiencia</span>
              </article>
              <article>
                <strong>250+</strong>
                <span>Pacientes atendidos</span>
              </article>
              <article>
                <strong>3</strong>
                <span>Certificaciones</span>
              </article>
            </div>
            <ul className="lp-credentials">
              {credentials.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="servicios" className="lp-services wrap">
        <div className="lp-section-head">
          <div>
            <p className="lp-eyebrow">SERVICIOS</p>
            <h2>Un plan para volver a lo que te mueve.</h2>
          </div>
          <p>
            Cada sesión se adapta a tu momento y objetivos, con seguimiento durante todo el
            proceso. Valoración inicial: $100.000 (gratis al adquirir un paquete).
          </p>
        </div>

        <div className="lp-service-grid">
          {services.map((service, index) => (
            <article className="lp-service" key={`${service.numero}-${service.titulo}-${index}`}>
              <div className="lp-service-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={service.imagen} alt={service.titulo} loading="lazy" />
                <span className="lp-service-number">
                  {service.numero || String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="lp-service-body">
                <h3>{service.titulo}</h3>
                <p>{service.descripcion}</p>
                <div className="lp-service-foot">
                  <span className="lp-price">{formatPrice(service.precio)}</span>
                  <button
                    type="button"
                    className="lp-service-link"
                    onClick={() => bookService(service.titulo)}
                  >
                    Agendar <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="horarios" className="lp-schedule wrap">
        <div className="lp-section-head">
          <div>
            <p className="lp-eyebrow">HORARIOS Y SEDES</p>
            <h2>Elige el espacio que más te acomode.</h2>
          </div>
          <p>Agenda tu valoración en la sede más cercana y empieza tu proceso.</p>
        </div>

        <div className="lp-sede-grid">
          <article className="lp-sede">
            <div className="lp-sede-top">
              <span className="lp-sede-pin" aria-hidden="true">
                ◉
              </span>
              <div>
                <h3>Sede Tunja</h3>
                <p>Lunes a viernes</p>
              </div>
            </div>
            <p className="lp-sede-hours">7:00 a.m. — 6:00 p.m.</p>
            <a className="lp-sede-link" href="#reservas">
              Reservar en Tunja <span aria-hidden="true">→</span>
            </a>
          </article>

          <article className="lp-sede green">
            <div className="lp-sede-top">
              <span className="lp-sede-pin" aria-hidden="true">
                ◉
              </span>
              <div>
                <h3>Sede Turmequé</h3>
                <p>Sábados y domingos</p>
              </div>
            </div>
            <p className="lp-sede-hours">8:00 a.m. — 4:00 p.m.</p>
            <a className="lp-sede-link" href="#reservas">
              Reservar en Turmequé <span aria-hidden="true">→</span>
            </a>
          </article>
        </div>

        <p className="lp-note">
          La reserva de cita requiere el pago anticipado del 100%. Reagendamientos o
          cancelaciones con mínimo 24 a 48 horas de anticipación; de lo contrario, la cita se da
          por realizada.
        </p>
      </section>

      <section id="reservas" className="lp-booking">
        <div className="wrap lp-booking-grid">
          <div className="lp-booking-copy">
            <p className="lp-eyebrow">RESERVA TU ESPACIO</p>
            <h2>Comienza tu proceso hoy.</h2>
            <p>
              Déjanos tus datos, elige el día y la hora que tengas disponibles y te
              confirmaremos tu primera valoración.
            </p>
            <div className="lp-contact">
              <span aria-hidden="true">✦</span>
              <p>
                ¿Tienes preguntas?
                <a href="https://wa.me/573113981422" target="_blank" rel="noopener noreferrer">
                  WhatsApp 311 398 1422
                </a>
              </p>
            </div>
          </div>

          <div className="lp-form-card">
            <div className="lp-form-head">
              <span className="lp-form-icon" aria-hidden="true">
                ✦
              </span>
              <div>
                <h3>Reserva directa</h3>
                <p>Elige el día y la hora disponibles.</p>
              </div>
            </div>

            {sent ? (
              <div className="lp-success">
                <strong>¡Gracias por escribirnos!</strong>
                <p>Recibimos tu solicitud. Pronto confirmaremos tu cita.</p>
                <button type="button" onClick={() => setSent(false)}>
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form className="lp-form" onSubmit={handleSubmit}>
                <label>
                  Nombre completo
                  <input
                    required
                    name="name"
                    maxLength={100}
                    placeholder="¿Cómo te llamas?"
                    autoComplete="name"
                  />
                </label>
                <div className="lp-form-row">
                  <label>
                    Celular
                    <input
                      required
                      type="tel"
                      name="phone"
                      maxLength={30}
                      placeholder="Tu número de celular"
                      autoComplete="tel"
                    />
                  </label>
                  <label>
                    Correo electrónico
                    <input
                      required
                      type="email"
                      name="email"
                      maxLength={160}
                      placeholder="tu@correo.com"
                      autoComplete="email"
                    />
                  </label>
                </div>
                <label>
                  Servicio
                  <select
                    required
                    name="service"
                    value={selectedService}
                    onChange={(event) => setSelectedService(event.target.value)}
                  >
                    <option value="" disabled>
                      Selecciona una opción
                    </option>
                    {bookingOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="lp-form-row">
                  <label>
                    Día disponible
                    <select
                      required
                      name="fecha"
                      value={activeDate}
                      onChange={(event) => {
                        setSelectedDate(event.target.value);
                        setSelectedTime("");
                      }}
                    >
                      {availableDays.length === 0 ? (
                        <option value="">Sin cupos disponibles</option>
                      ) : (
                        availableDays.map((day) => (
                          <option key={day.key} value={day.key}>
                            {day.label}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                  <label>
                    Hora disponible
                    <select
                      required
                      name="hora"
                      value={activeTime}
                      onChange={(event) => setSelectedTime(event.target.value)}
                      disabled={!activeDate}
                    >
                      <option value="" disabled>
                        Selecciona una hora
                      </option>
                      {activeHours.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {error && (
                  <p className="lp-error" role="alert">
                    {error}
                  </p>
                )}

                <button className="lp-btn primary submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Enviando…"
                  ) : (
                    <>
                      Solicitar reserva <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
                <small>Al enviar aceptas ser contactado para coordinar tu cita.</small>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="lp-footer wrap">
        <a className="brand" href="#inicio">
          <span className="brand-icon">
            <Image src="/images/Logo.jpg" alt="Logo La Fisioterapeuta Li" width={30} height={30} />
          </span>
          La Fisioterapeuta Li
        </a>
        <p className="lp-payments">
          Pagos por Nequi / Llave: 311 398 1422 (Lina Murillo) o efectivo.
        </p>
        <div className="lp-footer-links">
          <a
            href="https://www.instagram.com/lafisioterapeutali/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a href="https://wa.me/573113981422" target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </div>
        <p>© 2026 La Fisioterapeuta Li</p>
      </footer>
    </main>
  );
}
