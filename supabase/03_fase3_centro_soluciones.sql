-- Fase 3 del plan de analítica — Centro de Soluciones.
--
-- Principio de diseño (petición expresa de Eloy): "no crear una segunda
-- arquitectura de analítica completamente diferente". Por eso esta fase
-- NO crea tablas nuevas — AMPLÍA con columnas nuevas (todas opcionales,
-- todas con ALTER ... ADD COLUMN IF NOT EXISTS, así que es idempotente y
-- no rompe nada de lo que ya usa buscador.html) las DOS tablas que ya
-- existían desde la Fase 1 (ver schema.sql):
--   - public.search_events         (un evento = una fila)
--   - public.search_event_products (0..N productos asociados a un evento)
--
-- El Centro de Soluciones usa las MISMAS tablas con source_page =
-- 'centro-soluciones' y nuevos valores de event_type (prefijo CS_, ver
-- assets/js/centro-soluciones-analytics.js para el listado completo y el
-- porqué de cada campo). Las columnas que ya existían (session_id,
-- query_raw, query_normalized, device_type, source_page, result_count,
-- duration_ms...) se REUTILIZAN tal cual, igual que ya hace buscador.html.
--
-- Cómo aplicarlo: igual que las fases anteriores — pégalo entero en el
-- SQL Editor de Supabase y ejecútalo una vez.

-- ── Columnas nuevas en search_events (todas NULLABLE — ningún evento ya
-- existente de buscador.html se ve afectado) ──────────────────────────
alter table public.search_events add column if not exists solution_slug  text;
alter table public.search_events add column if not exists solution_title text;
-- Agrupa en una misma "visualización de una solución" los eventos que le
-- siguen (productos mostrados/vistos/elegidos, feedback, "ver más
-- productos", producto alternativo elegido) — generado en el cliente,
-- uno nuevo por cada vez que se abre o genera una solución. Ver el
-- porqué completo (sección 11 del documento de analítica) en
-- centro-soluciones-analytics.js.
alter table public.search_events add column if not exists interaction_id uuid;
-- Origen de la interacción — de dónde viene la búsqueda, la solución
-- seleccionada, o la recomendación de producto. Mismo campo reutilizado
-- para los tres casos (igual que device_type/source_page ya se reutilizan
-- entre tipos de evento distintos): 'hero' | 'problema' | 'wizard' |
-- 'area' | 'popular' | 'related_solution' | 'search' | 'ai' |
-- 'structured' | 'alternative' | 'ai_otra_vez', etc. — texto libre a
-- propósito, igual que event_type.
alter table public.search_events add column if not exists interaction_source text;
alter table public.search_events add column if not exists feedback        text; -- 'positive' | 'negative'
alter table public.search_events add column if not exists feedback_reason text;
-- JSON completo generado por la IA para una solución dinámica (CS_AI_SOLUTION_GENERATED)
-- — se conserva tal cual se usó para presentar la solución al usuario,
-- nunca solo el texto final (petición expresa: "no guardar únicamente
-- el texto final"). Sirve para poder analizar después qué soluciones
-- dinámicas se repiten y merecería la pena convertir en guías fijas.
alter table public.search_events add column if not exists ai_generated_json jsonb;
-- Referencias de los productos que se venían mostrando cuando el usuario
-- pidió "más productos" o acabó eligiendo una alternativa — permite medir
-- la tasa de sustitución (producto recomendado vs. producto elegido)
-- sin depender de un JOIN adicional contra search_event_products.
alter table public.search_events add column if not exists original_recommended_refs text[];

create index if not exists search_events_solution_slug_idx  on public.search_events (solution_slug);
create index if not exists search_events_interaction_id_idx on public.search_events (interaction_id);

-- ── Columna nueva en search_event_products ─────────────────────────────
-- El nombre del producto en el momento del evento — product_ref sigue
-- siendo el identificador principal (más estable, nunca cambia), pero
-- guardar también el nombre evita tener que cruzar contra una foto del
-- catálogo en un momento concreto del pasado solo para leer un informe.
alter table public.search_event_products add column if not exists product_name text;

comment on column public.search_events.interaction_id is
  'Agrupa los eventos de una misma "visualización de una solución" (Centro de Soluciones): productos mostrados/vistos/elegidos, feedback, más productos, alternativa elegida. Generado en el cliente.';
comment on column public.search_events.ai_generated_json is
  'JSON completo de una solución dinámica generada por IA (Centro de Soluciones), tal cual se mostró al usuario. Null en el resto de eventos.';

-- No se toca ninguna política de RLS: las que ya existían (solo INSERT
-- para "anon", sin SELECT/UPDATE/DELETE) cubren también estas columnas
-- nuevas sin cambios — siguen aplicándose a la fila entera, columnas
-- incluidas.
