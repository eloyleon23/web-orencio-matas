-- Área de Clientes — Fase 7: correcciones de seguridad encontradas en
-- la auditoría de RLS (28/11/2026). Continuación de los SQL
-- anteriores (incluida la Fase 6d, que hay que haber ejecutado ya) —
-- pégalo también entero en el SQL Editor. Idempotente.
--
-- Resumen de lo que corrige, de más a menos grave:
-- 1. CRÍTICO: cualquier cuenta autenticada podía auto-ascenderse a
--    administrador (o reactivarse tras un bloqueo) actualizando su
--    propio profiles.rol/activo directamente contra la API —
--    "actualizar el propio perfil" solo comprobaba el id, nunca qué
--    columnas se tocaban.
-- 2. CRÍTICO: la cadena "comercial inserta una fila en clientes con el
--    id de OTRO perfil ya existente (p.ej. un administrador) + llama a
--    simular-acceso con ese cliente_id" permitía obtener un magic-link
--    de login para la cuenta de ese perfil, sin ser nunca de verdad un
--    cliente. Se corrige por los dos lados: la política de INSERT en
--    clientes exige ahora que el id sea de verdad un perfil "cliente",
--    y simular-acceso (Edge Function, aparte) vuelve a comprobarlo él
--    mismo por si acaso.
-- 3. IMPORTANTE: almacén podía actualizar CUALQUIER pedido (incluidos
--    borradores de cualquier cliente, que ni debería poder ver) y
--    además reasignarlo a otro cliente cambiando cliente_id.
-- 4. IMPORTANTE: oficina podía ver/actualizar pedidos en estado
--    "borrador" (un carrito todavía no enviado por el cliente) de
--    cualquier cliente.
-- 5. Se añade un guardia general (trigger) para que cliente_id de un
--    pedido ya enviado no se pueda reasignar salvo por administrador.

-- ── 1. Nadie (salvo administrador) puede cambiar su propio rol o
--    reactivarse/bloquearse a sí mismo, aunque pase por la API directa
--    en vez de por el panel ──────────────────────────────────────────
create or replace function public.proteger_campos_sensibles_perfil_()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.rol_actual_() is distinct from 'administrador' then
    new.rol := old.rol;
    new.activo := old.activo;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_campos_sensibles_perfil on public.profiles;
create trigger proteger_campos_sensibles_perfil
  before update on public.profiles
  for each row execute function public.proteger_campos_sensibles_perfil_();

-- ── 2a. Helper: ¿este id de perfil es de verdad un cliente? ──────────
-- security definer para poder consultar profiles sin depender de qué
-- vea el llamante por su propia RLS (evita falsos negativos/positivos
-- según el rol de quien llama).
create or replace function public.es_perfil_cliente_(id_perfil uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = id_perfil and rol = 'cliente'
  );
$$;

-- ── 2b. Insertar/actualizar una fila de clientes exige que su id sea
--    de verdad un perfil "cliente" — cierra la vía de insertar una
--    fila "clientes" fantasma apuntando al id de otro perfil (p. ej.
--    un administrador) para luego pedir un magic-link con
--    simular-acceso ───────────────────────────────────────────────────
drop policy if exists "comercial ve y gestiona sus clientes asignados" on public.clientes;
create policy "comercial ve y gestiona sus clientes asignados"
  on public.clientes
  for all
  to authenticated
  using (public.rol_actual_() = 'comercial' and comercial_id = auth.uid())
  with check (public.rol_actual_() = 'comercial' and comercial_id = auth.uid() and public.es_perfil_cliente_(id));

drop policy if exists "oficina ve y gestiona todos los clientes" on public.clientes;
create policy "oficina ve y gestiona todos los clientes"
  on public.clientes
  for all
  to authenticated
  using (public.rol_actual_() = 'oficina')
  with check (public.rol_actual_() = 'oficina' and public.es_perfil_cliente_(id));

drop policy if exists "administrador ve y gestiona todos los clientes" on public.clientes;
create policy "administrador ve y gestiona todos los clientes"
  on public.clientes
  for all
  to authenticated
  using (public.rol_actual_() = 'administrador')
  with check (public.rol_actual_() = 'administrador' and public.es_perfil_cliente_(id));

-- ── 3. Almacén: su política de SELECT ya excluía "borrador"
--    correctamente — el problema estaba solo en la de UPDATE, que no
--    filtraba nada y permitía tocar cualquier pedido de cualquier
--    cliente, incluidos borradores ────────────────────────────────────
drop policy if exists "almacen actualiza cualquier pedido" on public.propuestas_pedido;
create policy "almacen actualiza cualquier pedido"
  on public.propuestas_pedido
  for update
  to authenticated
  using (public.rol_actual_() = 'almacen' and estado <> 'borrador')
  with check (public.rol_actual_() = 'almacen' and estado <> 'borrador');

-- ── 4. Oficina: tampoco ve ni actualiza borradores ────────────────────
drop policy if exists "oficina ve todas las propuestas" on public.propuestas_pedido;
create policy "oficina ve todas las propuestas"
  on public.propuestas_pedido
  for select
  to authenticated
  using (public.rol_actual_() = 'oficina' and estado <> 'borrador');

drop policy if exists "oficina actualiza cualquier pedido" on public.propuestas_pedido;
create policy "oficina actualiza cualquier pedido"
  on public.propuestas_pedido
  for update
  to authenticated
  using (public.rol_actual_() = 'oficina' and estado <> 'borrador')
  with check (public.rol_actual_() = 'oficina' and estado <> 'borrador');

-- ── 5. Nadie salvo administrador puede reasignar un pedido ya enviado
--    a otro cliente (RLS no puede comparar "new" contra "old"
--    directamente en el with check, así que se hace con un trigger,
--    igual patrón que la propia máquina de estados) ───────────────────
create or replace function public.proteger_cliente_id_pedido_()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.cliente_id is distinct from old.cliente_id and public.rol_actual_() is distinct from 'administrador' then
    raise exception 'No se puede reasignar un pedido a otro cliente';
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_cliente_id_pedido on public.propuestas_pedido;
create trigger proteger_cliente_id_pedido
  before update on public.propuestas_pedido
  for each row execute function public.proteger_cliente_id_pedido_();
