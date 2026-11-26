-- Área de Clientes — Fase 3: personalización del catálogo por cliente.
-- Continuación de los SQL anteriores — pégalo también entero en el
-- SQL Editor. Idempotente.

-- ── Personalización en "clientes" ───────────────────────────────────
-- Tres listas, todas opcionales e independientes entre sí — un
-- producto es visible para el cliente si NINGUNA de las tres está
-- rellena (caso por defecto: ve el catálogo completo, igual que
-- cualquier visitante normal) o si cae dentro de CUALQUIERA de las
-- que sí estén rellenas (familia O área O referencia concreta — no
-- hace falta cumplir las tres a la vez). "descuento_pct" se aplica
-- sobre el precio con IVA que ya devuelve obtener_productos.
alter table public.clientes
  add column if not exists familias_visibles jsonb,
  add column if not exists areas_visibles jsonb,
  add column if not exists productos_visibles jsonb,
  add column if not exists descuento_pct numeric not null default 0
    check (descuento_pct >= 0 and descuento_pct <= 100);

comment on column public.clientes.familias_visibles is
  'Lista de familias (texto, igual que en el catálogo) visibles para este cliente. NULL o [] = sin restricción por familia.';
comment on column public.clientes.areas_visibles is
  'Lista de áreas visibles para este cliente. NULL o [] = sin restricción por área.';
comment on column public.clientes.productos_visibles is
  'Lista de referencias de producto visibles siempre para este cliente, además de lo que ya entre por familia/área.';
comment on column public.clientes.descuento_pct is
  'Descuento (0-100) aplicado al precio con IVA del catálogo público al mostrárselo a este cliente. 0 = precio de catálogo tal cual.';
