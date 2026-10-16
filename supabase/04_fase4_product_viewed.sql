-- Fase 4 del plan de analítica de búsquedas — primer evento de
-- interacción con un producto concreto: PRODUCT_VIEWED (se dispara al
-- abrir la ficha de detalle de un producto en el buscador).
--
-- Decisión de diseño: en vez de usar search_event_products (pensada
-- para cuando un ÚNICO evento de búsqueda tiene VARIOS productos
-- asociados con distintos roles — shown/recommended_by_ai/viewed), un
-- PRODUCT_VIEWED es sobre UN solo producto y no necesita esa relación
-- N:M — más simple añadir una columna product_ref directamente a
-- search_events, reservando search_event_products para cuando de
-- verdad haga falta relacionar varios productos con un mismo evento
-- (p. ej. qué recomendó Gemini de una tacada).
--
-- Cómo aplicarlo: pégalo en el SQL Editor de Supabase y ejecútalo una
-- vez. Es idempotente.

alter table public.search_events add column if not exists product_ref text;

create index if not exists search_events_product_ref_idx
  on public.search_events (product_ref)
  where product_ref is not null;
