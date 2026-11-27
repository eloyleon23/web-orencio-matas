-- Área de Clientes — Fase 4: propuestas de pedido (lado cliente).
-- Continuación de los SQL anteriores — pégalo también entero en el
-- SQL Editor. Idempotente.
--
-- Dos tablas: "propuestas_pedido" (la cabecera — una por pedido) y
-- "propuesta_pedido_lineas" (los productos de cada una, con cantidad y
-- el precio que vio el cliente en el momento de añadirlo — un cambio
-- de precio en el catálogo después NO debe alterar un pedido ya hecho).
--
-- Solo dos estados por ahora ('borrador' y 'recibida'): la máquina de
-- estados completa (Recibida → En preparación → … → Entregada) es
-- cosa de la Fase 5 (panel de gestión) — aquí al cliente solo le hace
-- falta saber si su pedido todavía se puede tocar (borrador) o si ya
-- lo ha enviado (recibida, de ahí en adelante solo lectura para él).

create table if not exists public.propuestas_pedido (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references public.clientes(id) on delete cascade,
  estado       text not null default 'borrador',
  notas        text,
  creado_en    timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  enviado_en   timestamptz
);

alter table public.propuestas_pedido
  drop constraint if exists propuestas_pedido_estado_check;
alter table public.propuestas_pedido
  add constraint propuestas_pedido_estado_check
  check (estado in ('borrador', 'recibida'));

comment on table public.propuestas_pedido is
  'Cabecera de un pedido del Área de Clientes. "borrador" = todavía editable y descartable; "recibida" = ya enviado por el cliente, de solo lectura para él (la gestión interna del pedido a partir de aquí es Fase 5).';

create index if not exists propuestas_pedido_cliente_idx on public.propuestas_pedido (cliente_id);

create table if not exists public.propuesta_pedido_lineas (
  id              uuid primary key default gen_random_uuid(),
  propuesta_id    uuid not null references public.propuestas_pedido(id) on delete cascade,
  ref             text not null,
  nombre          text not null,
  cantidad        numeric not null,
  precio_unitario numeric,
  creado_en       timestamptz not null default now(),
  unique (propuesta_id, ref)
);

alter table public.propuesta_pedido_lineas
  drop constraint if exists propuesta_pedido_lineas_cantidad_check;
alter table public.propuesta_pedido_lineas
  add constraint propuesta_pedido_lineas_cantidad_check
  check (cantidad > 0);

comment on table public.propuesta_pedido_lineas is
  'Líneas de una propuesta de pedido. "nombre" y "precio_unitario" son una FOTO del catálogo en el momento de añadir la línea (si el precio cambia después en el catálogo, un pedido ya hecho no debe cambiar solo).';

create index if not exists propuesta_pedido_lineas_propuesta_idx on public.propuesta_pedido_lineas (propuesta_id);

alter table public.propuestas_pedido enable row level security;
alter table public.propuesta_pedido_lineas enable row level security;

-- ── propuestas_pedido ────────────────────────────────────────────────
drop policy if exists "cliente ve sus propias propuestas" on public.propuestas_pedido;
create policy "cliente ve sus propias propuestas"
  on public.propuestas_pedido
  for select
  to authenticated
  using (cliente_id = auth.uid());

drop policy if exists "cliente crea sus propias propuestas en borrador" on public.propuestas_pedido;
create policy "cliente crea sus propias propuestas en borrador"
  on public.propuestas_pedido
  for insert
  to authenticated
  with check (cliente_id = auth.uid() and estado = 'borrador');

-- Solo se puede UPDATE una propuesta mientras sigue en "borrador" (el
-- "with check" permite pasarla a "recibida" al enviarla — un pedido ya
-- recibido no admite más cambios desde el lado del cliente).
drop policy if exists "cliente edita sus propuestas en borrador" on public.propuestas_pedido;
create policy "cliente edita sus propuestas en borrador"
  on public.propuestas_pedido
  for update
  to authenticated
  using (cliente_id = auth.uid() and estado = 'borrador')
  with check (cliente_id = auth.uid());

-- Borrar, solo si sigue en borrador ("borrar propuestas no emitidas").
drop policy if exists "cliente borra sus propuestas en borrador" on public.propuestas_pedido;
create policy "cliente borra sus propuestas en borrador"
  on public.propuestas_pedido
  for delete
  to authenticated
  using (cliente_id = auth.uid() and estado = 'borrador');

drop policy if exists "comercial ve las propuestas de sus clientes" on public.propuestas_pedido;
create policy "comercial ve las propuestas de sus clientes"
  on public.propuestas_pedido
  for select
  to authenticated
  using (
    public.rol_actual_() = 'comercial'
    and cliente_id in (select id from public.clientes where comercial_id = auth.uid())
  );

drop policy if exists "administrador ve todas las propuestas" on public.propuestas_pedido;
create policy "administrador ve todas las propuestas"
  on public.propuestas_pedido
  for select
  to authenticated
  using (public.rol_actual_() = 'administrador');

-- ── propuesta_pedido_lineas ──────────────────────────────────────────
-- Todo se comprueba contra el estado de la propuesta "padre" — nunca
-- directamente contra la línea, que no sabe por sí sola de quién es.
drop policy if exists "cliente ve las lineas de sus propuestas" on public.propuesta_pedido_lineas;
create policy "cliente ve las lineas de sus propuestas"
  on public.propuesta_pedido_lineas
  for select
  to authenticated
  using (
    propuesta_id in (select id from public.propuestas_pedido where cliente_id = auth.uid())
  );

drop policy if exists "cliente edita lineas de sus propuestas en borrador" on public.propuesta_pedido_lineas;
create policy "cliente edita lineas de sus propuestas en borrador"
  on public.propuesta_pedido_lineas
  for all
  to authenticated
  using (
    propuesta_id in (
      select id from public.propuestas_pedido where cliente_id = auth.uid() and estado = 'borrador'
    )
  )
  with check (
    propuesta_id in (
      select id from public.propuestas_pedido where cliente_id = auth.uid() and estado = 'borrador'
    )
  );

drop policy if exists "comercial ve lineas de propuestas de sus clientes" on public.propuesta_pedido_lineas;
create policy "comercial ve lineas de propuestas de sus clientes"
  on public.propuesta_pedido_lineas
  for select
  to authenticated
  using (
    propuesta_id in (
      select pp.id from public.propuestas_pedido pp
      join public.clientes c on c.id = pp.cliente_id
      where public.rol_actual_() = 'comercial' and c.comercial_id = auth.uid()
    )
  );

drop policy if exists "administrador ve todas las lineas" on public.propuesta_pedido_lineas;
create policy "administrador ve todas las lineas"
  on public.propuesta_pedido_lineas
  for select
  to authenticated
  using (public.rol_actual_() = 'administrador');

-- "actualizado_en" se refresca solo en cada cambio de cabecera o de
-- líneas (útil para "Mis pedidos": poder ordenar por última actividad,
-- no solo por fecha de creación).
create or replace function public.tocar_actualizado_propuesta_()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.propuestas_pedido set actualizado_en = now() where id = coalesce(new.propuesta_id, old.propuesta_id);
  return null;
end;
$$;

drop trigger if exists propuesta_lineas_tocar_actualizado on public.propuesta_pedido_lineas;
create trigger propuesta_lineas_tocar_actualizado
  after insert or update or delete on public.propuesta_pedido_lineas
  for each row execute function public.tocar_actualizado_propuesta_();
