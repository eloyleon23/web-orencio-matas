-- Área de Clientes — Fase 2 (parte 2/3): simulación de acceso.
-- Continuación de area_clientes_schema.sql y _fase2.sql — pégalo
-- también entero en el SQL Editor. Idempotente.

-- ── simulaciones_acceso ─────────────────────────────────────────────
-- Registro de auditoría, nunca modificable ni borrable desde el
-- propio área de clientes: quién (comercial/administrador) ha
-- simulado el acceso de qué cliente y cuándo. A petición de Eloy: la
-- simulación es SOLO visualización/demostración — esta tabla no
-- guarda nada de lo que el comercial "ve" en la simulación, solo que
-- ocurrió.
create table if not exists public.simulaciones_acceso (
  id           uuid primary key default gen_random_uuid(),
  comercial_id uuid not null references public.profiles(id),
  cliente_id   uuid not null references public.profiles(id),
  cliente_email text not null,
  iniciada_en  timestamptz not null default now()
);

comment on table public.simulaciones_acceso is
  'Auditoría de simulaciones de acceso: quién (comercial/administrador) ha visto el área de clientes como qué cliente y cuándo. Nunca concede edición — ver Edge Function simular-acceso.';

create index if not exists simulaciones_acceso_comercial_idx on public.simulaciones_acceso (comercial_id);
create index if not exists simulaciones_acceso_cliente_idx on public.simulaciones_acceso (cliente_id);

alter table public.simulaciones_acceso enable row level security;

-- Solo la Edge Function (con service_role, que salta RLS) inserta
-- filas aquí — no hay política de INSERT para "authenticated" a
-- propósito, así nadie puede registrar una simulación falsa o, peor,
-- saltarse el registro llamando directamente a la tabla.
drop policy if exists "comercial ve sus propias simulaciones" on public.simulaciones_acceso;
create policy "comercial ve sus propias simulaciones"
  on public.simulaciones_acceso
  for select
  to authenticated
  using (comercial_id = auth.uid());

drop policy if exists "administrador ve todas las simulaciones" on public.simulaciones_acceso;
create policy "administrador ve todas las simulaciones"
  on public.simulaciones_acceso
  for select
  to authenticated
  using (public.rol_actual_() = 'administrador');
