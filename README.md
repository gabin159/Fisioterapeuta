# Fisioterapeuta LII

> **Prototipo de hackathon — proyecto estudiantil.**

Sitio web para una clínica de fisioterapia. Incluye una landing pública, reserva de citas, un panel administrativo (resumen, agenda semanal, clientes y servicios) y un acceso directo a un bot de Telegram.

## Características

- Landing responsive con presentación de servicios, sedes (Tunja y Turmequé) y formulario de reserva.
- Agenda semanal de lunes a domingo, de 8:00 a.m. a 4:00 p.m., con citas agrupadas por día y sede.
- Panel de clientes con cambio de estado (Pendiente, Pendiente de pago, Confirmada, Al día).
- Gestión de servicios con subida de imágenes a Supabase Storage.
- Login de administrador con contraseñas cifradas (bcrypt) y sesión firmada con HMAC.
- Botón flotante de Telegram para agendar por chat.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router + Turbopack)
- React 19
- TypeScript 5
- [Supabase](https://supabase.com/) (PostgreSQL + Storage)
- CSS propio (sin Tailwind)
- bcryptjs

## Clonar el repositorio

```bash
git clone https://github.com/gabin159/Fisioterapeuta.git
cd Fisioterapeuta
```

## Requisitos

- Node.js 20 o superior (recomendado 22)
- npm
- Una cuenta y un proyecto propios en Supabase


## Instalación y ejecución

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

El panel administrativo está en [http://localhost:3000/acceso](http://localhost:3000/acceso), usando las credenciales que configures.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run build` | Genera la compilación de producción. |
| `npm start` | Sirve la compilación de producción. |
| `npm run lint` | Ejecuta el linter. |

## Estructura del proyecto

```text
app/
  _components/    Componentes de cliente (landing, dashboard, widgets, etc.)
  api/            Rutas API (auth, clientes, servicios, subida de imágenes)
  dashboard/      Panel administrativo
  acceso/         Página de inicio de sesión
lib/              Acceso a Supabase, autenticación, formato y contenido
public/images/    Imágenes de los servicios
supabase-schema.sql
supabase-migration.sql
```

## Estado y limitaciones

- Prototipo de hackathon con fines académicos y de demostración.
- No cuenta con pruebas automatizadas ni auditoría de seguridad.
- Pensado para datos de prueba: evita registrar información real de pacientes.
- La base de datos y el almacenamiento pertenecen a cada entorno; no se comparten.

## json del FisioBot 
- Este json esta el croquis debes agregar las foreign keys de su respectiva base de datos, ia y telegram.

## Seguridad

- No subas `.env.local` al repositorio (ya está incluido en `.gitignore`).
- Rota las claves de Supabase si alguna se llega a exponer.
- Cambia las credenciales del administrador de ejemplo antes de publicar.

## Créditos

Proyecto estudiantil desarrollado para un hackathon. Se comparte con fines educativos y de aprendizaje.
