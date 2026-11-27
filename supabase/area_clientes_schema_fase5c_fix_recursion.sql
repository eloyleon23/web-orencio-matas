-- Área de Clientes — Fase 5c: arregla una recursión de RLS introducida
-- por error en la Fase 5. URGENTE — pégalo en el SQL Editor cuanto
-- antes, rompe el login de TODO el área de clientes (no solo
-- almacén), con el error "infinite recursion detected in policy for
-- relation 'clientes'" (código 42P17).
--
-- Qué pasó: las políticas nuevas "almacen ve clientes/perfiles con
-- pedidos activos" comprueban "... in (select cliente_id from
-- propuestas_pedido where estado <> 'borrador')" directamente contra
-- la tabla. Pero leer "propuestas_pedido" dispara SUS políticas, y una
-- de ellas ("comercial ve las propuestas de sus clientes") vuelve a
-- leer "clientes" — que vuelve a disparar la política de almacén que
-- lee "propuestas_pedido" — ciclo infinito entre las dos tablas.
--
-- Arreglo: la misma receta que ya usa rol_actual_() desde la Fase 2
-- para este mismo problema (ver el comentario en
-- area_clientes_schema_fase2.sql) — una función "security definer" que
-- lee propuestas_pedido SIN pasar por sus políticas, así la política
-- de "clientes"/"profiles" nunca vuelve a disparar las de
-- "propuestas_pedido".

create or replace function public.cliente_tiene_pedido_activo_(id_cliente uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.propuestas_pedido
    where cliente_id = id_cliente and estado <> 'borrador'
  );
$$;

drop policy if exists "almacen ve clientes con pedidos activos" on public.clientes;
create policy "almacen ve clientes con pedidos activos"
  on public.clientes
  for select
  to authenticated
  using (public.rol_actual_() = 'almacen' and public.cliente_tiene_pedido_activo_(id));

drop policy if exists "almacen ve el perfil de clientes con pedidos activos" on public.profiles;
create policy "almacen ve el perfil de clientes con pedidos activos"
  on public.profiles
  for select
  to authenticated
  using (public.rol_actual_() = 'almacen' and public.cliente_tiene_pedido_activo_(id));
