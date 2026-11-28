-- Área de Clientes — Fase 5f: panel de usuarios (solo administrador) +
-- albarán/factura y quién hizo cada fase del pedido. Continuación de
-- los SQL anteriores — pégalo también entero en el SQL Editor.
-- Idempotente.

-- ── Administrador puede editar cualquier perfil ──────────────────────
-- Hasta ahora solo podía editar el suyo propio (nombre/apellidos) —
-- hace falta para el panel de usuarios: cambiar el rol, bloquear/
-- reactivar (profiles.activo, que ya existía desde la Fase 1) y
-- corregir nombre/apellidos de cualquiera.
drop policy if exists "administrador actualiza cualquier perfil" on public.profiles;
create policy "administrador actualiza cualquier perfil"
  on public.profiles
  for update
  to authenticated
  using (public.rol_actual_() = 'administrador')
  with check (public.rol_actual_() = 'administrador');

-- ── Albarán / factura + quién hizo cada fase ─────────────────────────
alter table public.propuestas_pedido
  add column if not exists albaran text,
  add column if not exists factura text,
  add column if not exists confirmado_por uuid references public.profiles(id),
  add column if not exists preparado_por uuid references public.profiles(id),
  add column if not exists cerrado_por uuid references public.profiles(id);

comment on column public.propuestas_pedido.albaran is
  'Número de albarán — se rellena a mano desde el detalle del pedido una vez está "lista para enviar".';
comment on column public.propuestas_pedido.factura is
  'Número de factura — igual que el albarán, a mano desde el detalle una vez "lista para enviar".';
comment on column public.propuestas_pedido.confirmado_por is
  'Quién pasó el pedido de "recibida" a "en_preparacion" (normalmente el comercial) — se rellena solo.';
comment on column public.propuestas_pedido.preparado_por is
  'Quién pasó el pedido de "en_preparacion" a "lista_para_enviar" (almacén) — se rellena solo.';
comment on column public.propuestas_pedido.cerrado_por is
  'Quién pasó el pedido de "lista_para_enviar" a "en_reparto" (administrador, tras el albarán/factura) — se rellena solo.';

-- Se amplía el mismo trigger de la máquina de estados (Fase 5/5d) para
-- dejar constancia de QUIÉN hizo cada transición concreta, no solo
-- quién tocó el pedido por última vez en general (eso ya lo hacía
-- "actualizado_por").
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
    if old.estado = 'recibida' and new.estado = 'en_preparacion' then
      new.confirmado_por := auth.uid();
    elsif old.estado = 'en_preparacion' and new.estado = 'lista_para_enviar' then
      new.preparado_por := auth.uid();
    elsif old.estado = 'lista_para_enviar' and new.estado = 'en_reparto' then
      new.cerrado_por := auth.uid();
    end if;
    if new.estado = 'entregada' and old.estado is distinct from 'entregada' then
      new.entregado_en := now();
    end if;
  end if;
  new.actualizado_por := auth.uid();
  return new;
end;
$$;
