-- Área de Clientes — Fase 5b: seguimiento del envío (transportista +
-- número de seguimiento). Continuación de los SQL anteriores — pégalo
-- también entero en el SQL Editor. Idempotente.
--
-- Por defecto es "Reparto propio" (sin número de seguimiento, no hace
-- falta uno para el reparto propio) — pero cuando el pedido se envía
-- con una empresa de transporte externa, almacén/administrador pueden
-- cambiar el transportista y añadir su número de seguimiento desde el
-- panel de gestión (área-clientes/gestion/pedidos.html). El cliente lo
-- ve en "Mis pedidos" en cuanto el pedido está "lista para enviar" o
-- más adelante.

alter table public.propuestas_pedido
  add column if not exists transportista text not null default 'Reparto propio',
  add column if not exists numero_seguimiento text;

comment on column public.propuestas_pedido.transportista is
  'Quién reparte el pedido — "Reparto propio" por defecto, o el nombre de la empresa de transporte externa cuando se use una.';
comment on column public.propuestas_pedido.numero_seguimiento is
  'Número/código de seguimiento del envío de la empresa de transporte (si la hay). Sin uso con reparto propio.';

-- Nada nuevo que añadir a las políticas RLS: las de UPDATE de
-- comercial/almacén/administrador sobre propuestas_pedido (Fase 5) ya
-- cubren cualquier columna de la fila, estas incluidas — el trigger de
-- la máquina de estados solo vigila la columna "estado", no estas dos.
