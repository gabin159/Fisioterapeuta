export type ServiceCardData = {
  numero: string;
  titulo: string;
  descripcion: string;
  precio: string;
  imagen: string;
};

export const fallbackServices: ServiceCardData[] = [
  {
    numero: "01",
    titulo: "Rehabilitación física",
    descripcion:
      "Sesiones de fisioterapia para recuperar movilidad, fuerza y funcionalidad después de una lesión o cirugía.",
    precio: "Desde $85.000 la sesión",
    imagen: "/images/rehabilitacion.jpg",
  },
  {
    numero: "02",
    titulo: "Prescripción de ejercicio",
    descripcion:
      "Planes de entrenamiento individuales o grupales con seguimiento profesional para tu recuperación y rendimiento.",
    precio: "Desde $40.000 por sesión",
    imagen: "/images/prescripcion.jpg",
  },
  {
    numero: "03",
    titulo: "Modulación postejercicio",
    descripcion:
      "Descargas musculares con terapia manual, ventosas, presoterapia y pistola percutora para acelerar tu recuperación.",
    precio: "Desde $70.000",
    imagen: "/images/modulacion.jpg",
  },
  {
    numero: "04",
    titulo: "Procedimientos especializados",
    descripcion:
      "Punción seca, terapia neural, PRP y sueroterapia para casos que requieren un abordaje más profundo.",
    precio: "Desde $120.000",
    imagen: "/images/TerapiaNeuronal.jpg",
  },
];

export const serviceImagePresets = [
  { label: "Rehabilitación", value: "/images/rehabilitacion.jpg" },
  { label: "Prescripción", value: "/images/prescripcion.jpg" },
  { label: "Modulación", value: "/images/modulacion.jpg" },
  { label: "Terapia neural", value: "/images/TerapiaNeuronal.jpg" },
  { label: "Rodilla", value: "/images/Rodilla.jpg" },
];

export const serviceOptions = [
  "Valoración inicial",
  "Rehabilitación física",
  "Prescripción de ejercicio",
  "Modulación postejercicio",
  "Procedimientos especializados",
];

export const statusOptions = ["Pendiente", "Pendiente de pago", "Confirmada", "Al día"];
