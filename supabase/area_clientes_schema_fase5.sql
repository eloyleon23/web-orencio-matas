-- Área de Clientes — Fase 5: panel de gestión de pedidos (comercial /
-- almacén / administrador). Continuación de los SQL anteriores —
-- pégalo también entero en el SQL Editor. Idempotente.
--
-- Máquina de estados completa (PLAN.md, Fase 5), con UN paso de role
-- distinto cada uno — así el "entregable revisable: un pedido
-- gestionado de principio a fin por los tres roles" tiene sentido:
--
--   borrador           (cliente, ya existía — Fase 4)
--   recibida           (cliente envía, ya existía — Fase 4)
--   en_preparacion     comercial confirma el pedido y lo pasa a almacén
--   lista_para_enviar  almacén termina de prepararlo (aquí puede
--                      rectificar líneas por falta de stock)
--   en_reparto         administrador cierra la logística (el gate real
--                      con número de albarán/factura es Fase 6 — aquí
--                      de momento es un paso manual)
--   entregada          administrador confirma la entrega
--
-- "administrador" puede hacer cualquier transición (superset de los
-- otros dos roles), igual que ya puede ver/gestionar cualquier cliente.

alter table public.propuestas_pedido
  drop constraint if exists propuestas_pedido_estado_check;
alter table public.propuestas_pedido
  add constraint propuestas_pedido_estado_check
  check (estado in ('borrador', 'recibida', 'en_preparacion', 'lista_para_enviar', 'en_reparto', 'entregada'));

-- ── Rectificación de líneas por falta de stock ──────────────────────
-- "cantidad" (ya existía) sigue siendo SIEMPRE lo que pidió el
-- cliente — nunca se toca. "cantidad_confirmada" es lo que de verdad
-- se va a servir (null = sin rectificar, se sirve tal cual se pidió);
-- cuando difiere de "cantidad", el cliente ve el diff en su pedido.
alter table public.propuesta_pedido_lineas
  add column if not exists cantidad_confirmada numeric,
  add column if not exists motivo_rectificacion text;

comment on column public.propuesta_pedido_lineas.cantidad_confirmada is
  'Cantidad que de verdad se va a servir (unidades sueltas, igual criterio que "cantidad"). Null = sin rectificar, se sirve tal cual se pidió. Si difiere de "cantidad", el cliente ve la diferencia en su pedido.';
comment on column public.propuesta_pedido_lineas.motivo_rectificacion is
  'Por qué se rectificó esta línea (p. ej. "sin stock, se sirven 2 cajas de las 3 pedidas"). Solo tiene sentido cuando cantidad_confirmada no es null.';

-- ── Función: ¿puede el usuario actual hacer ESTA transición de estado? ──
-- Centraliza las reglas de la máquina de estados en la propia base de
-- datos (no solo en el panel) — así ninguna pantalla, por mucho que
-- tenga un bug, puede saltarse el orden de los estados ni hacer una
-- transición que no le toca a su rol.
create or replace function public.transicion_pedido_permitida_(rol public.rol_area_clientes, estado_actual text, estado_nuevo text)
returns boolean
language sql
immutable
as $$
  select
    estado_actual = estado_nuevo -- no cambiar de estado siempre está permitido (p. ej. al guardar solo una rectificación)
    or (rol = 'administrador') -- administrador: cualquier transición
    or (rol = 'comercial' and estado_actual = 'recibida' and estado_nuevo = 'en_preparacion')
    or (rol = 'almacen' and estado_actual = 'en_preparacion' and estado_nuevo = 'lista_para_enviar')
$$;

create or replace function public.validar_transicion_pedido_()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado is distinct from old.estado then
    if not public.transicion_pedido_permitida_(public.rol_actual_(), old.estado, new.estado) then
      raise exception 'No tienes permiso para pasar un pedido de "%" a "%"', old.estado, new.estado;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists propuestas_pedido_validar_transicion on public.propuestas_pedido;
create trigger propuestas_pedido_validar_transicion
  before update on public.propuestas_pedido
  for each row execute function public.validar_transicion_pedido_();

-- ── Permisos de gestión sobre propuestas_pedido ──────────────────────
-- Las políticas de SELECT de comercial/administrador ya existían
-- (Fase 4) — aquí se añade la de "almacen" (ve TODOS los pedidos
-- recibidos o posteriores, de cualquier cliente — el almacén no
-- trabaja por cartera de comercial) y las de UPDATE para los tres
-- roles de gestión (qué filas puede tocar cada uno; QUÉ transición en
-- concreto permite el trigger de arriba).
drop policy if exists "almacen ve los pedidos recibidos o posteriores" on public.propuestas_pedido;
create policy "almacen ve los pedidos recibidos o posteriores"
  on public.propuestas_pedido
  for select
  to authenticated
  using (public.rol_actual_() = 'almacen' and estado <> 'borrador');

drop policy if exists "comercial actualiza pedidos de sus clientes" on public.propuestas_pedido;
create policy "comercial actualiza pedidos de sus clientes"
  on public.propuestas_pedido
  for update
  to authenticated
  using (
    public.rol_actual_() = 'comercial'
    and cliente_id in (select id from public.clientes where comercial_id = auth.uid())
  )
  with check (
    public.rol_actual_() = 'comercial'
    and cliente_id in (select id from public.clientes where comercial_id = auth.uid())
  );

drop policy if exists "almacen actualiza cualquier pedido" on public.propuestas_pedido;
create policy "almacen actualiza cualquier pedido"
  on public.propuestas_pedido
  for update
  to authenticated
  using (public.rol_actual_() = 'almacen')
  with check (public.rol_actual_() = 'almacen');

drop policy if exists "administrador actualiza cualquier pedido" on public.propuestas_pedido;
create policy "administrador actualiza cualquier pedido"
  on public.propuestas_pedido
  for update
  to authenticated
  using (public.rol_actual_() = 'administrador')
  with check (public.rol_actual_() = 'administrador');

-- ── Permisos de gestión sobre propuesta_pedido_lineas ────────────────
-- Solo para RECTIFICAR (cantidad_confirmada/motivo_rectificacion) —
-- nunca para cambiar ref/nombre/precio/cantidad pedida, que son la
-- foto de lo que el cliente pidió de verdad. almacen y administrador
-- pueden rectificar mientras el pedido esté "en_preparacion"; una vez
-- pasa a "lista_para_enviar" se congela (ya no se puede rectificar
-- sin retroceder el estado a mano).
drop policy if exists "almacen ve lineas de cualquier pedido" on public.propuesta_pedido_lineas;
create policy "almacen ve lineas de cualquier pedido"
  on public.propuesta_pedido_lineas
  for select
  to authenticated
  using (
    propuesta_id in (select id from public.propuestas_pedido where estado <> 'borrador')
    and public.rol_actual_() = 'almacen'
  );

drop policy if exists "almacen rectifica lineas en preparacion" on public.propuesta_pedido_lineas;
create policy "almacen rectifica lineas en preparacion"
  on public.propuesta_pedido_lineas
  for update
  to authenticated
  using (
    public.rol_actual_() = 'almacen'
    and propuesta_id in (select id from public.propuestas_pedido where estado = 'en_preparacion')
  )
  with check (
    public.rol_actual_() = 'almacen'
    and propuesta_id in (select id from public.propuestas_pedido where estado = 'en_preparacion')
  );

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

-- ── Lectura de clientes/perfiles para almacén ────────────────────────
-- El listado de pedidos de gestión necesita el nombre/empresa del
-- cliente de cada pedido (join con "clientes" y, dentro, con
-- "profiles") — comercial y administrador ya podían leer esto (Fase 2);
-- a almacén le faltaba, igual que le faltaba ver las propias
-- propuestas. Se limita a los clientes que tengan al menos un pedido
-- no-borrador (igual criterio que su política de propuestas_pedido),
-- no a todos los clientes sin más.
-- OJO: la primera versión de estas dos políticas comprobaba "id in
-- (select cliente_id from propuestas_pedido where ...)" directamente
-- — eso causaba una recursión infinita de RLS con la política de
-- comercial sobre propuestas_pedido (que a su vez lee "clientes").
-- Arreglado aquí mismo con una función security definer (misma receta
-- que ya usa rol_actual_() desde la Fase 2 para este mismo problema) —
-- si ya habías ejecutado la versión anterior de este archivo, basta
-- con ejecutar de nuevo este bloque (o el archivo
-- area_clientes_schema_fase5c_fix_recursion.sql, que es justo esto).
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

-- Nota sobre cómo dar de alta el primer usuario "almacen" (no hay
-- formulario propio todavía, igual que ya pasaba con comercial/
-- administrador): crear el usuario en Supabase Auth (o con la Edge
-- Function alta-cliente, aunque esté pensada para clientes, y luego
-- corregir el rol) y después, en el SQL Editor:
--   update public.profiles set rol = 'almacen' where email = 'correo@del-almacen.es';
