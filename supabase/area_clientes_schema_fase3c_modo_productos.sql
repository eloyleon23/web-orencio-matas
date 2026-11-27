-- Área de Clientes — Fase 3 (parte extra): modo de las "referencias
-- concretas" en la personalización de catálogo. Continuación de los
-- SQL anteriores — pégalo también entero en el SQL Editor. Idempotente.
--
-- A petición de Eloy: el bloque de "referencias concretas" solo sabía
-- hacer una cosa (incluirlas siempre, por encima de área/familia).
-- Pasa a tener tres modos distintos, elegibles desde el panel:
--   'incluir' (por defecto, igual que antes) — además de lo que ya
--             entra por área/familia, estas referencias se ven sí o sí.
--   'excluir' — lo contrario: estas referencias se OCULTAN aunque
--             cumplan el área/familia de arriba.
--   'solo'    — ignora área/familia por completo: el cliente ve
--             ÚNICAMENTE estas referencias.

alter table public.clientes
  add column if not exists modo_productos_visibles text not null default 'incluir';

alter table public.clientes
  drop constraint if exists clientes_modo_productos_visibles_check;
alter table public.clientes
  add constraint clientes_modo_productos_visibles_check
  check (modo_productos_visibles in ('incluir', 'excluir', 'solo'));

comment on column public.clientes.modo_productos_visibles is
  'Cómo se aplican las referencias de productos_visibles frente a área/familia: incluir (añadido, por defecto), excluir (se ocultan aunque cumplan área/familia) o solo (ignora área/familia, ve únicamente estas referencias).';
