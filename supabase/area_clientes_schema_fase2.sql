-- Área de Clientes — Fase 2: tabla "clientes" y permisos de gestión.
-- Continuación de supabase/area_clientes_schema.sql (profiles,
-- solicitudes_acceso) — pégalo también entero en el SQL Editor,
-- después de haber aplicado el de la Fase 1. Idempotente.

-- ── clientes ────────────────────────────────────────────────────────
-- Una fila por cuenta de cliente (perfil con rol='cliente'), con los
-- datos propios de cliente: comercial asignado, id en el CRM (puede
-- quedar sin informar en el alta), empresa, contacto. La
-- personalización de catálogo (familias/áreas/productos visibles,
-- descuento) se añade en la Fase 3, cuando haga falta de verdad.
create table if not exists public.clientes (
  id           uuid primary key references public.profiles(id) on delete cascade,
  comercial_id uuid references public.profiles(id),
  crm_id       text,
  empresa      text,
  telefono     text,
  direccion_calle     text,
  direccion_cp        text,
  direccion_poblacion text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on table public.clientes is
  'Datos propios de cada cuenta de cliente: comercial asignado, id en el CRM (opcional al alta), empresa y contacto.';

create index if not exists clientes_comercial_id_idx on public.clientes (comercial_id);

alter table public.clientes enable row level security;

-- Función auxiliar: rol del usuario autenticado actual. "security
-- definer" para poder leer profiles sin pasar otra vez por sus propias
-- políticas (evita la recursión típica de RLS al comprobar roles).
create or replace function public.rol_actual_()
returns public.rol_area_clientes
language sql
security definer
set search_path = public
stable
as $$
  select rol from public.profiles where id = auth.uid();
$$;

drop policy if exists "cliente ve su propia fila" on public.clientes;
create policy "cliente ve su propia fila"
  on public.clientes
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "comercial ve y gestiona sus clientes asignados" on public.clientes;
create policy "comercial ve y gestiona sus clientes asignados"
  on public.clientes
  for all
  to authenticated
  using (public.rol_actual_() = 'comercial' and comercial_id = auth.uid())
  with check (public.rol_actual_() = 'comercial' and comercial_id = auth.uid());

drop policy if exists "administrador ve y gestiona todos los clientes" on public.clientes;
create policy "administrador ve y gestiona todos los clientes"
  on public.clientes
  for all
  to authenticated
  using (public.rol_actual_() = 'administrador')
  with check (public.rol_actual_() = 'administrador');

-- profiles: ahora que hay comerciales gestionando clientes, un
-- comercial necesita poder leer el NOMBRE/APELLIDOS/EMAIL del perfil de
-- sus propios clientes (no solo la fila de "clientes"), y el
-- administrador el de todos.
drop policy if exists "comercial ve el perfil de sus clientes" on public.profiles;
create policy "comercial ve el perfil de sus clientes"
  on public.profiles
  for select
  to authenticated
  using (
    public.rol_actual_() = 'comercial'
    and id in (select id from public.clientes where comercial_id = auth.uid())
  );

drop policy if exists "administrador ve todos los perfiles" on public.profiles;
create policy "administrador ve todos los perfiles"
  on public.profiles
  for select
  to authenticated
  using (public.rol_actual_() = 'administrador');
