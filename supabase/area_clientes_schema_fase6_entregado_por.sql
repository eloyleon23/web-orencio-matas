-- Área de Clientes — Fase 6: fecha y persona de cada fase del pedido
-- (para la nueva sección de Estadísticas — trabajo por persona y por
-- mes/año). confirmado_por/preparado_por/cerrado_por ya existían
-- (Fase 5f) sin fecha propia; entregado_por es nuevo. Continuación de
-- los SQL anteriores — pégalo también entero en el SQL Editor.
-- Idempotente.

alter table public.propuestas_pedido
  add column if not exists entregado_por uuid references public.profiles(id),
  add column if not exists confirmado_en timestamptz,
  add column if not exists preparado_en timestamptz,
  add column if not exists cerrado_en timestamptz;

comment on column public.propuestas_pedido.entregado_por is
  'Quién pasó el pedido de "en_reparto" a "entregada" — se rellena solo, igual que confirmado_por/preparado_por/cerrado_por.';
comment on column public.propuestas_pedido.confirmado_en is 'Cuándo se confirmó (recibida → en_preparacion) — para agrupar las estadísticas por mes/año.';
comment on column public.propuestas_pedido.preparado_en is 'Cuándo se preparó (en_preparacion → lista_para_enviar).';
comment on column public.propuestas_pedido.cerrado_en is 'Cuándo se cerró (lista_para_enviar → en_reparto).';

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
      new.confirmado_en := now();
    elsif old.estado = 'en_preparacion' and new.estado = 'lista_para_enviar' then
      new.preparado_por := auth.uid();
      new.preparado_en := now();
    elsif old.estado = 'lista_para_enviar' and new.estado = 'en_reparto' then
      new.cerrado_por := auth.uid();
      new.cerrado_en := now();
    elsif old.estado = 'en_reparto' and new.estado = 'entregada' then
      new.entregado_por := auth.uid();
    end if;
    if new.estado = 'entregada' and old.estado is distinct from 'entregada' then
      new.entregado_en := now();
    end if;
  end if;
  new.actualizado_por := auth.uid();
  return new;
end;
$$;
