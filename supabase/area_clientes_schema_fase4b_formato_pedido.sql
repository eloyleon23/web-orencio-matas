-- Área de Clientes — Fase 4 (parte extra): pedir por unidades sueltas
-- o por caja/envase. Continuación de area_clientes_schema_fase4.sql —
-- pégalo también entero en el SQL Editor. Idempotente.
--
-- Mismo modelo que ya usa la "lista de la compra" de la web pública
-- (ver listaCompraActualizarCantidadEnvases_ en buscador.html):
-- "cantidad" SIGUE siendo siempre el total en unidades sueltas (lo que
-- de verdad hace falta para precio/stock — nunca cambia de
-- significado), y se añaden columnas aparte solo para poder MOSTRAR y
-- volver a editar cómo se pidió:
--   modo_compra      'unidad' (por defecto) o 'envase'.
--   cantidad_envases cuántas cajas/bolsas/paquetes pidió, en modo
--                    'envase' (null en modo 'unidad').
--   envase_cantidad/envase_unidad/envase_tipo: FOTO del formato de
--                    envase del producto en el momento de añadirlo
--                    (ref. columnas iguales en el catálogo — ver
--                    procesarActualizarEnvaseProducto en
--                    apps_script_trigger.js). Si el producto no tenía
--                    formato de envase informado, cantidad_envases se
--                    usa tal cual como cantidad real (sin
--                    equivalencia en unidades), igual que en la web
--                    pública.

alter table public.propuesta_pedido_lineas
  add column if not exists modo_compra text not null default 'unidad',
  add column if not exists cantidad_envases numeric,
  add column if not exists envase_cantidad numeric,
  add column if not exists envase_unidad text,
  add column if not exists envase_tipo text;

alter table public.propuesta_pedido_lineas
  drop constraint if exists propuesta_pedido_lineas_modo_compra_check;
alter table public.propuesta_pedido_lineas
  add constraint propuesta_pedido_lineas_modo_compra_check
  check (modo_compra in ('unidad', 'envase'));

comment on column public.propuesta_pedido_lineas.modo_compra is
  'Cómo pidió el cliente esta línea: "unidad" (sueltas) o "envase" (por caja/bolsa/paquete — ver cantidad_envases y envase_*). "cantidad" sigue siendo siempre el total en unidades sueltas.';
comment on column public.propuesta_pedido_lineas.cantidad_envases is
  'Número de cajas/envases pedidos cuando modo_compra = ''envase''. Null en modo ''unidad''.';
comment on column public.propuesta_pedido_lineas.envase_cantidad is
  'Foto de productos.envase_cantidad (unidades por envase) en el momento de añadir la línea.';
