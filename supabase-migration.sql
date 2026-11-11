-- Migración para la base de datos que YA creaste.
-- Ejecútalo UNA vez en Supabase > SQL Editor.

-- 1) Agregar la columna `activo` que usa el módulo de Servicios.
alter table public.servicios
  add column if not exists activo boolean not null default true;

-- 2) Crear el administrador para el login desde la tabla.
--    Correo: fisioterapeutalii@gmail.com / Contraseña: Fisioterapeuta
insert into public.administradores (email, password_hash)
values ('fisioterapeutalii@gmail.com', '$2b$10$3Wy.ATAasSFBNSCVMjFduOlfR/0/.9LbFysr9IrveOqHnDbur1OpG')
on conflict (email) do nothing;

-- 3) Cargar el catálogo inicial (solo si la tabla está vacía).
insert into public.servicios (numero, titulo, descripcion, precio, imagen, orden, activo)
select * from (values
  ('01', 'Rehabilitación física', 'Sesiones de fisioterapia para recuperar movilidad, fuerza y funcionalidad después de una lesión o cirugía.', 'Desde $85.000 la sesión', '/images/rehabilitacion.jpg', 1, true),
  ('02', 'Prescripción de ejercicio', 'Planes de entrenamiento individuales o grupales con seguimiento profesional para tu recuperación y rendimiento.', 'Desde $40.000 por sesión', '/images/prescripcion.jpg', 2, true),
  ('03', 'Modulación postejercicio', 'Descargas musculares con terapia manual, ventosas, presoterapia y pistola percutora para acelerar tu recuperación.', 'Desde $70.000', '/images/modulacion.jpg', 3, true),
  ('04', 'Procedimientos especializados', 'Punción seca, terapia neural, PRP y sueroterapia para casos que requieren un abordaje más profundo.', 'Desde $120.000', '/images/TerapiaNeuronal.jpg', 4, true)
) as v(numero, titulo, descripcion, precio, imagen, orden, activo)
where not exists (select 1 from public.servicios);

notify pgrst, 'reload schema';
