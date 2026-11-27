-- Área de Clientes — Fase 4 (parte extra): notas por línea y notas
-- generales del pedido. Continuación de los SQL anteriores — pégalo
-- también entero en el SQL Editor. Idempotente.
--
-- A petición de Eloy: el cliente necesita poder darle al comercial
-- información adicional sobre un producto concreto del pedido (p. ej.
-- "el anterior venía mal etiquetado", "si no hay este tamaño, el de
-- 5L"), además de instrucciones generales para todo el pedido (ya
-- existía la columna propuestas_pedido.notas desde la Fase 4 — aquí
-- solo se añade la versión "por línea").

alter table public.propuesta_pedido_lineas
  add column if not exists notas text;

comment on column public.propuesta_pedido_lineas.notas is
  'Información adicional del cliente para el comercial sobre ESTE producto del pedido (opcional). Editable mientras la propuesta siga en estado "borrador" (misma RLS que el resto de la línea).';
