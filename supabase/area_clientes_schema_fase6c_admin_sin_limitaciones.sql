-- Área de Clientes — Fase 6c: corrige la Fase 6b — administrador NO
-- debe perder nada. Malentendido en la Fase 6b: se había recortado a
-- administrador a solo la sección Usuarios; la petición real de Eloy
-- era justo lo contrario — "el rol administrador sera el unico que
-- gestione usuarios pero todo lo demás también, es el rol que no debe
-- tener limitaciones" (28/11/2026). Oficina se AÑADE como rol nuevo,
-- no sustituye a administrador en nada.
--
-- Continuación de los SQL anteriores (incluida la Fase 6b, que hay
-- que haber ejecutado ya) — pégalo también entero en el SQL Editor.
-- Idempotente.

-- ── Máquina de estados: administrador puede cualquier transición,
-- además de las propias de cada rol (comercial/almacén/oficina) ──────
create or replace function public.transicion_pedido_permitida_(rol public.rol_area_clientes, estado_actual text, estado_nuevo text)
returns boolean
language sql
immutable
as $$
  select
    estado_actual = estado_nuevo
    or (rol = 'administrador') -- administrador: sin limitaciones, cualquier transición
    or (rol = 'comercial' and estado_actual = 'recibida' and estado_nuevo = 'en_preparacion')
    or (rol = 'almacen' and estado_actual = 'en_preparacion' and estado_nuevo = 'lista_para_enviar')
    or (rol = 'oficina' and estado_actual = 'lista_para_enviar' and estado_nuevo = 'en_reparto')
    or (rol = 'oficina' and estado_actual = 'en_reparto' and estado_nuevo = 'entregada')
$$;

-- ── Sustituir/quitar/añadir productos del pedido — administrador
-- vuelve a poder, además de oficina/almacén/comercial (sus clientes) ──
create or replace function public.puede_gestionar_lineas_(id_propuesta uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.propuestas_pedido pp
    left join public.clientes c on c.id = pp.cliente_id
    where pp.id = id_propuesta
      and pp.estado in ('recibida', 'en_preparacion')
      and (
        public.rol_actual_() = 'administrador'
        or public.rol_actual_() = 'oficina'
        or public.rol_actual_() = 'almacen'
        or (public.rol_actual_() = 'comercial' and c.comercial_id = auth.uid())
      )
  );
$$;

-- ── Clientes: administrador vuelve a ver y gestionar todos ───────────
drop policy if exists "administrador ve y gestiona todos los clientes" on public.clientes;
create policy "administrador ve y gestiona todos los clientes"
  on public.clientes
  for all
  to authenticated
  using (public.rol_actual_() = 'administrador')
  with check (public.rol_actual_() = 'administrador');

-- ── Propuestas de pedido ──────────────────────────────────────────
drop policy if exists "administrador ve todas las propuestas" on public.propuestas_pedido;
create policy "administrador ve todas las propuestas"
  on public.propuestas_pedido
  for select
  to authenticated
  using (public.rol_actual_() = 'administrador');

drop policy if exists "administrador actualiza cualquier pedido" on public.propuestas_pedido;
create policy "administrador actualiza cualquier pedido"
  on public.propuestas_pedido
  for update
  to authenticated
  using (public.rol_actual_() = 'administrador')
  with check (public.rol_actual_() = 'administrador');

-- ── Líneas de pedido ──────────────────────────────────────────────
drop policy if exists "administrador ve todas las lineas" on public.propuesta_pedido_lineas;
create policy "administrador ve todas las lineas"
  on public.propuesta_pedido_lineas
  for select
  to authenticated
  using (public.rol_actual_() = 'administrador');

drop policy if exists "administrador rectifica lineas en preparacion" on public.propuesta_pedido_lineas;
create policy "administrador rectifica lineas en preparacion"
  on public.propuesta_pedido_lineas
  for update
  to authenticated
  using (
    public.rol_actual_() = 'administrador'
    and propuesta_id in (select id from public.propuestas_pedido where estado = 'en_preparacion')
  )
  with check (
    public.rol_actual_() = 'administrador'
    and propuesta_id in (select id from public.propuestas_pedido where estado = 'en_preparacion')
  );

-- ── Simulaciones de acceso ──────────────────────────────────────────
drop policy if exists "administrador ve todas las simulaciones" on public.simulaciones_acceso;
create policy "administrador ve todas las simulaciones"
  on public.simulaciones_acceso
  for select
  to authenticated
  using (public.rol_actual_() = 'administrador');
