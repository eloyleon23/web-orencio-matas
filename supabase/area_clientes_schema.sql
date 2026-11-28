-- Esquema del Área de Clientes (cuentas individuales, roles de gestión,
-- solicitudes de acceso) — Fase 1 del desarrollo (ver
-- docs/area-clientes/PLAN.md y el documento de especificación).
--
-- Mismo proyecto Supabase que supabase/schema.sql (analítica del
-- buscador) — decisión explícita de Eloy para no multiplicar cuentas a
-- gestionar. Completamente aislado de esas tablas (nombres y RLS
-- propios) y, sobre todo, completamente aislado del CRM: nada de aquí
-- se sincroniza automáticamente con él, igual que se decidió para el
-- resto del área de clientes.
--
-- Cómo aplicarlo: pega este archivo entero en el SQL Editor del mismo
-- proyecto de Supabase ya usado para la analítica (Dashboard → SQL
-- Editor → New query) y ejecútalo una vez. Es idempotente, se puede
-- volver a ejecutar sin duplicar nada a medida que se añadan fases.

create extension if not exists pgcrypto;

-- ── Roles ───────────────────────────────────────────────────────────
-- 'cliente'       — cuenta de un cliente final, creada por un comercial
--                    (alta individual o masiva) o por una invitación.
-- 'comercial'     — ve y gestiona solo sus clientes asignados.
-- 'almacen'       — gestiona la preparación de propuestas de pedido.
-- 'oficina'       — (añadido Fase 6b) ve todos los clientes y pedidos,
--                    da de alta clientes, hace el albarán/factura y
--                    cierra el pedido (lista_para_enviar → en_reparto
--                    → entregada). Ver
--                    area_clientes_schema_fase6b_rol_oficina_1_enum.sql.
-- 'administrador' — (recortado Fase 6b) YA NO gestiona clientes ni
--                    pedidos — solo la sección Usuarios (alta/edición/
--                    bloqueo de cualquier usuario interno).
do $$ begin
  create type public.rol_area_clientes as enum ('cliente', 'comercial', 'almacen', 'administrador');
exception
  when duplicate_object then null;
end $$;

-- ── profiles ────────────────────────────────────────────────────────
-- Una fila por usuario de Supabase Auth (auth.users), cliente o personal
-- de gestión. Se crea automáticamente al dar de alta el usuario (ver
-- trigger más abajo) — nunca hay que insertarla a mano.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  rol         public.rol_area_clientes not null default 'cliente',
  nombre      text,
  apellidos   text,
  email       text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Un perfil por usuario de auth.users: su rol dentro del área de clientes (cliente/comercial/almacén/administrador) y datos básicos.';

-- Crea el perfil automáticamente en cuanto se crea el usuario en Auth.
-- El rol y el nombre se pasan en user_metadata al crear el usuario
-- (ver Fase 2 — alta individual/masiva vía Admin API); si no se indica
-- rol, por defecto es 'cliente'.
create or replace function public.gestionar_nuevo_usuario_area_clientes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, rol, nombre, apellidos, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'rol')::public.rol_area_clientes, 'cliente'),
    new.raw_user_meta_data->>'nombre',
    new.raw_user_meta_data->>'apellidos',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_area_clientes on auth.users;
create trigger on_auth_user_created_area_clientes
  after insert on auth.users
  for each row execute function public.gestionar_nuevo_usuario_area_clientes();

-- ── Seguridad: cada usuario solo puede ver y tocar su propia fila ─────
-- La gestión ampliada (comercial viendo sus clientes, administrador
-- viendo todo) se añade en la Fase 2/5 junto con la tabla "clientes" y
-- "propuestas_pedido" — de momento (Fase 1, solo login) basta con que
-- cada cual vea su propio perfil, nada más.
alter table public.profiles enable row level security;

drop policy if exists "ver el propio perfil" on public.profiles;
create policy "ver el propio perfil"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "actualizar el propio perfil (solo nombre/apellidos)" on public.profiles;
create policy "actualizar el propio perfil (solo nombre/apellidos)"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── solicitudes_acceso ──────────────────────────────────────────────
-- Formulario público "Solicitar acceso" (sin login) — ver
-- area-clientes/solicitar-acceso.html. Mismo patrón que
-- search_events en supabase/schema.sql: la clave "anon" solo puede
-- insertar, nunca leer ni modificar. La lectura/gestión de estas
-- solicitudes (marcarlas como atendidas, etc.) se hace desde el panel
-- de gestión en fases posteriores, con el usuario ya autenticado como
-- comercial/administrador.
create table if not exists public.solicitudes_acceso (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  nombre             text not null,
  apellidos          text not null,
  empresa            text,
  email              text not null,
  telefono           text,
  direccion_calle    text,
  direccion_cp       text,
  direccion_poblacion text,
  comentario         text,
  atendida           boolean not null default false
);

comment on table public.solicitudes_acceso is
  'Solicitudes de alta en el área de clientes enviadas desde el formulario público "Solicitar acceso" — gestión manual, nunca alta automática.';

alter table public.solicitudes_acceso enable row level security;

drop policy if exists "enviar solicitud de acceso (público)" on public.solicitudes_acceso;
create policy "enviar solicitud de acceso (público)"
  on public.solicitudes_acceso
  for insert
  to anon
  with check (true);

drop policy if exists "gestión ve y actualiza las solicitudes de acceso" on public.solicitudes_acceso;
create policy "gestión ve y actualiza las solicitudes de acceso"
  on public.solicitudes_acceso
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.rol in ('comercial', 'administrador')
    )
  );

-- Deliberadamente NO hay política de SELECT para "anon" en ninguna de
-- las dos tablas — sin una política expresa, Postgres deniega la
-- operación por defecto en una tabla con RLS activado.
