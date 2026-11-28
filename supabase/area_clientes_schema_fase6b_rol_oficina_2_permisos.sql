-- Área de Clientes — Fase 6b (paso 2 de 2): permisos del nuevo rol
-- "oficina" y recorte de administrador a solo gestión de usuarios.
--
-- Ejecuta esto DESPUÉS de area_clientes_schema_fase6b_rol_oficina_1_enum.sql
-- (en un paso aparte, una vez ese ya se haya ejecutado).
--
-- Reparto de responsabilidades a partir de ahora:
--   comercial      — sus clientes propios; confirma pedidos (recibida
--                    → en_preparacion). Sin cambios.
--   almacen        — prepara pedidos (en_preparacion → lista_para_enviar),
--                    rectifica por falta de stock. Sin cambios.
--   oficina (NUEVO) — ve todos los pedidos y todos los clientes, da de
--                    alta clientes, hace el albarán/factura y cierra
--                    el pedido (lista_para_enviar → en_reparto →
--                    entregada). Hereda aquí lo que antes hacía
--                    administrador en el día a día de pedidos/clientes.
--   administrador  — YA NO gestiona clientes ni pedidos. Su único
--                    trabajo pasa a ser la sección "Usuarios" (dar de
--                    alta/editar/bloquear cualquier usuario interno,
--                    de cualquier rol). Petición explícita de Eloy,
--                    28/11/2026: "no mezclarlo con administrador que
--                    quiero que tenga super poderes y gestione
--                    usuarios y demás" — separar identidad/acceso
--                    (administrador) de la operativa de pedidos
--                    (oficina).

-- ── Máquina de estados: quién puede hacer qué transición ─────────────
create or replace function public.transicion_pedido_permitida_(rol public.rol_area_clientes, estado_actual text, estado_nuevo text)
returns boolean
language sql
immutable
as $$
  select
    estado_actual = estado_nuevo -- no cambiar de estado siempre está permitido (p. ej. al guardar solo una rectificación)
    or (rol = 'comercial' and estado_actual = 'recibida' and estado_nuevo = 'en_preparacion')
    or (rol = 'almacen' and estado_actual = 'en_preparacion' and estado_nuevo = 'lista_para_enviar')
    or (rol = 'oficina' and estado_actual = 'lista_para_enviar' and estado_nuevo = 'en_reparto')
    or (rol = 'oficina' and estado_actual = 'en_reparto' and estado_nuevo = 'entregada')
$$;

-- ── Quién puede sustituir/quitar/añadir productos de un pedido ───────
-- (Fase 5e) — administrador sale de aquí, entra oficina.
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
        public.rol_actual_() = 'oficina'
        or public.rol_actual_() = 'almacen'
        or (public.rol_actual_() = 'comercial' and c.comercial_id = auth.uid())
      )
  );
$$;

-- ── Clientes: administrador pierde la gestión, la gana oficina ───────
drop policy if exists "administrador ve y gestiona todos los clientes" on public.clientes;
drop policy if exists "oficina ve y gestiona todos los clientes" on public.clientes;
create policy "oficina ve y gestiona todos los clientes"
  on public.clientes
  for all
  to authenticated
  using (public.rol_actual_() = 'oficina')
  with check (public.rol_actual_() = 'oficina');

-- ── Perfiles: oficina necesita ver los perfiles de los clientes (y de
-- los comerciales asignados) para las listas/joins — administrador
-- SIGUE viendo todos los perfiles (eso es justo su trabajo ahora:
-- Usuarios). No se toca la política de administrador.
drop policy if exists "oficina ve todos los perfiles" on public.profiles;
create policy "oficina ve todos los perfiles"
  on public.profiles
  for select
  to authenticated
  using (public.rol_actual_() = 'oficina');

-- ── Propuestas de pedido: igual, administrador sale, oficina entra ───
drop policy if exists "administrador ve todas las propuestas" on public.propuestas_pedido;
drop policy if exists "oficina ve todas las propuestas" on public.propuestas_pedido;
create policy "oficina ve todas las propuestas"
  on public.propuestas_pedido
  for select
  to authenticated
  using (public.rol_actual_() = 'oficina');

drop policy if exists "administrador actualiza cualquier pedido" on public.propuestas_pedido;
drop policy if exists "oficina actualiza cualquier pedido" on public.propuestas_pedido;
create policy "oficina actualiza cualquier pedido"
  on public.propuestas_pedido
  for update
  to authenticated
  using (public.rol_actual_() = 'oficina')
  with check (public.rol_actual_() = 'oficina');

-- ── Líneas de pedido ──────────────────────────────────────────────
drop policy if exists "administrador ve todas las lineas" on public.propuesta_pedido_lineas;
drop policy if exists "oficina ve todas las lineas" on public.propuesta_pedido_lineas;
create policy "oficina ve todas las lineas"
  on public.propuesta_pedido_lineas
  for select
  to authenticated
  using (public.rol_actual_() = 'oficina');

-- Rectificar por falta de stock sigue siendo EXCLUSIVO de almacén —
-- ya tenía su propia política separada ("almacen rectifica lineas en
-- preparacion", Fase 5), así que aquí solo hace falta quitarle esa
-- capacidad a administrador, sin dársela a oficina (su trabajo es
-- albarán/factura/cierre, no el recuento de stock).
drop policy if exists "administrador rectifica lineas en preparacion" on public.propuesta_pedido_lineas;

-- ── Simulaciones de acceso (auditoría de "Simular", Fase 2) ──────────
drop policy if exists "administrador ve todas las simulaciones" on public.simulaciones_acceso;
drop policy if exists "oficina ve todas las simulaciones" on public.simulaciones_acceso;
create policy "oficina ve todas las simulaciones"
  on public.simulaciones_acceso
  for select
  to authenticated
  using (public.rol_actual_() = 'oficina');

-- Nota: "administrador actualiza cualquier perfil" y "administrador ve
-- todos los perfiles" (Fase 2/5f) se dejan TAL CUAL — es justo lo que
-- administrador sigue haciendo (la sección Usuarios).
