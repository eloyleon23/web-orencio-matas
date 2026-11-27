-- Área de Clientes — Fase 5d: metadatos de seguimiento del pedido en
-- el panel de gestión (quién lo tocó por última vez, cuándo se
-- entregó). Continuación de los SQL anteriores — pégalo también
-- entero en el SQL Editor. Idempotente.

alter table public.propuestas_pedido
  add column if not exists actualizado_por uuid references public.profiles(id),
  add column if not exists entregado_en timestamptz;

comment on column public.propuestas_pedido.actualizado_por is
  'Quién hizo el último cambio en el pedido (cabecera o alguna de sus líneas) — para mostrar "última edición por" en el panel de gestión.';
comment on column public.propuestas_pedido.entregado_en is
  'Cuándo pasó a "entregada" — se rellena solo, no hay que tocarlo a mano. Con enviado_en permite calcular cuántos días tardó el pedido de principio a fin.';

-- El trigger de la máquina de estados (Fase 5) ya corre "before
-- update" en propuestas_pedido — se aprovecha para rellenar estos dos
-- campos también, sin añadir otro trigger aparte.
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
    if new.estado = 'entregada' and old.estado is distinct from 'entregada' then
      new.entregado_en := now();
    end if;
  end if;
  new.actualizado_por := auth.uid();
  return new;
end;
$$;

-- Igual que ya hacía con "actualizado_en": cualquier cambio en las
-- líneas (rectificación de almacén incluida) también cuenta como
-- "tocar" el pedido a efectos de "actualizado_por".
create or replace function public.tocar_actualizado_propuesta_()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.propuestas_pedido
  set actualizado_en = now(), actualizado_por = auth.uid()
  where id = coalesce(new.propuesta_id, old.propuesta_id);
  return null;
end;
$$;
