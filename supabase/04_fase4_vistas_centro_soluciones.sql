-- Fase 4 del plan de analítica — primeras vistas de ANÁLISIS sobre los
-- eventos del Centro de Soluciones instrumentados en la Fase 3 (ver
-- assets/js/centro-soluciones-analytics.js y
-- supabase/03_fase3_centro_soluciones.sql).
--
-- Principio de diseño (sección 15 del documento de analítica):
-- "recopilar → analizar → proponer", NUNCA "recopilar → cambiar
-- automáticamente la web". Estas vistas son solo de LECTURA/análisis —
-- nada en el Centro de Soluciones cambia su comportamiento de producción
-- a partir de ellas todavía; sirven para que un humano (panel interno)
-- decida qué hacer con lo que muestran. Todas llevan un mínimo de
-- muestras (having ...) antes de considerar una tendencia significativa,
-- igual que ya hacen las vistas de la Fase 2 de buscador.html.
--
-- Mismo criterio de seguridad ya establecido en el proyecto (ver
-- schema.sql y panel_admin.html, que ya consulta
-- mv_busquedas_sin_resultado_7d y mv_resumen_busquedas_7d con la MISMA
-- clave "anon"): estas vistas son agregados que no identifican a nadie,
-- así que es seguro concederles SELECT a "anon" — la clave sigue sin
-- poder leer ni una fila de las tablas base (search_events,
-- search_event_products), solo estos agregados. La protección de que
-- solo el equipo las vea de verdad la da el PIN del propio panel
-- interno, no Supabase.
--
-- Cómo aplicarlo: pégalo entero en el SQL Editor de Supabase y
-- ejecútalo una vez. Es idempotente.

-- ── 1. Resumen de una sola fila (vistazo rápido en el panel) ───────────
create materialized view if not exists public.mv_cs_resumen_7d as
select
  count(*) filter (where event_type = 'CS_SOLUTION_SEARCH')                                        as total_busquedas,
  count(distinct session_id) filter (where event_type = 'CS_SOLUTION_SEARCH')                      as sesiones_unicas,
  count(*) filter (where event_type = 'CS_SOLUTION_SEARCH' and result_count = 0)                    as busquedas_sin_resultado_local,
  count(*) filter (where event_type = 'CS_SOLUTION_SELECTED')                                       as soluciones_seleccionadas,
  count(*) filter (where event_type = 'CS_AI_SOLUTION_GENERATED')                                   as consultas_a_la_ia,
  count(*) filter (where event_type = 'CS_AI_SOLUTION_GENERATED' and solution_slug is not null)      as ia_resuelta_con_guia_existente,
  count(*) filter (where event_type = 'CS_SOLUTION_FEEDBACK' and feedback = 'positive')              as feedback_positivo,
  count(*) filter (where event_type = 'CS_SOLUTION_FEEDBACK' and feedback = 'negative')              as feedback_negativo,
  count(*) filter (where event_type = 'CS_MORE_PRODUCTS_REQUESTED')                                  as veces_se_pidio_mas_productos
from public.search_events
where source_page = 'centro-soluciones'
  and occurred_at >= now() - interval '7 days';

grant select on public.mv_cs_resumen_7d to anon;

-- ── 2. Búsquedas del Centro de Soluciones sin ningún resultado local ──
-- "Oportunidades de catálogo de GUÍAS" — mismo papel que
-- mv_busquedas_sin_resultado_7d ya tiene para productos, pero aquí para
-- detectar qué problemas busca la gente que ninguna guía escrita a mano
-- resuelve todavía (sección 4A/13 del documento: detectar necesidades
-- que no cubrimos).
create materialized view if not exists public.mv_cs_busquedas_sin_resultado_7d as
select
  query_normalized,
  count(*)                     as total_busquedas,
  count(distinct session_id)   as sesiones_unicas,
  min(occurred_at)              as primera_vez,
  max(occurred_at)              as ultima_vez
from public.search_events
where event_type = 'CS_SOLUTION_SEARCH'
  and source_page = 'centro-soluciones'
  and result_count = 0
  and occurred_at >= now() - interval '7 days'
  and query_normalized is not null
  and query_normalized <> ''
group by query_normalized
having count(distinct session_id) >= 2 -- volumen mínimo bajo a propósito, mientras el tráfico real todavía es pequeño (igual que en la Fase 2)
order by sesiones_unicas desc, total_busquedas desc;

create unique index if not exists mv_cs_busquedas_sin_resultado_7d_termino_idx
  on public.mv_cs_busquedas_sin_resultado_7d (query_normalized);

grant select on public.mv_cs_busquedas_sin_resultado_7d to anon;

-- ── 3. Consultas a la IA que se repiten (candidatas a guía nueva) ─────
-- Sección 13 del documento: "los usuarios están preguntando
-- repetidamente por algo que todavía no tenemos" — agrupa las consultas
-- que han llegado a generar una solución por IA (con o sin guía
-- existente encontrada) y cuántas sesiones distintas repiten la MISMA
-- consulta normalizada. No hace clustering semántico (esa parte,
-- "quitar pintura aluminio" ~ "decapar aluminio", queda para una fase
-- posterior, a propósito — sección 13: "no es necesario implementar
-- ahora un sistema automático de clustering"), pero ya permite ver de
-- un vistazo qué texto EXACTO se repite más.
create materialized view if not exists public.mv_cs_ia_consultas_repetidas_30d as
select
  query_normalized,
  count(*)                                                                   as total_consultas,
  count(distinct session_id)                                                 as sesiones_unicas,
  count(*) filter (where solution_slug is not null)                          as veces_resuelta_con_guia_existente,
  count(*) filter (where solution_slug is null)                              as veces_generada_dinamicamente,
  min(occurred_at)                                                            as primera_vez,
  max(occurred_at)                                                            as ultima_vez
from public.search_events
where event_type = 'CS_AI_SOLUTION_GENERATED'
  and occurred_at >= now() - interval '30 days'
  and query_normalized is not null
  and query_normalized <> ''
group by query_normalized
having count(distinct session_id) >= 2
order by sesiones_unicas desc, total_consultas desc;

create unique index if not exists mv_cs_ia_consultas_repetidas_30d_termino_idx
  on public.mv_cs_ia_consultas_repetidas_30d (query_normalized);

grant select on public.mv_cs_ia_consultas_repetidas_30d to anon;

-- ── 4. Productos recomendados vs. productos elegidos ───────────────────
-- EL análisis central del documento (secciones 14-16): por cada
-- solución, qué producto se MUESTRA más (veces_mostrado), cuál se ABRE
-- más (veces_visto, modal de detalle) y cuál se ELIGE de verdad
-- (veces_elegido = clic en "ver en el buscador", normal o como
-- alternativa tras pedir "más productos"). pct_eleccion es la tasa de
-- selección sobre lo mostrado — el dato que permite decir "recomendamos
-- A, pero los usuarios eligen C" sin necesidad de cambiar nada todavía
-- en producción (sección 15: proponer, no actuar solo).
create materialized view if not exists public.mv_cs_productos_presentados_vs_elegidos_30d as
with eventos_cs as (
  select id, solution_slug, interaction_source
  from public.search_events
  where source_page = 'centro-soluciones'
    and solution_slug is not null
    and occurred_at >= now() - interval '30 days'
)
select
  e.solution_slug,
  sep.product_ref,
  max(sep.product_name)                                                        as product_name,
  count(*) filter (where sep.role = 'presented')                                as veces_mostrado,
  count(*) filter (where sep.role = 'viewed')                                   as veces_visto,
  count(*) filter (where sep.role in ('selected', 'alternative_selected'))      as veces_elegido,
  count(*) filter (where sep.role = 'alternative_selected')                     as veces_elegido_como_alternativa,
  round(
    100.0 * count(*) filter (where sep.role in ('selected', 'alternative_selected'))
    / greatest(count(*) filter (where sep.role = 'presented'), 1)
  , 1)                                                                          as pct_eleccion
from public.search_event_products sep
join eventos_cs e on e.id = sep.event_id
group by e.solution_slug, sep.product_ref
having count(*) filter (where sep.role = 'presented') >= 5 -- mínimo de impresiones antes de que la tasa signifique algo
order by e.solution_slug, veces_elegido desc;

create unique index if not exists mv_cs_productos_presentados_vs_elegidos_30d_idx
  on public.mv_cs_productos_presentados_vs_elegidos_30d (solution_slug, product_ref);

grant select on public.mv_cs_productos_presentados_vs_elegidos_30d to anon;

-- ── 5. Feedback agregado por solución ───────────────────────────────────
-- Sección 6/14: ¿qué soluciones (guías escritas a mano o generadas por
-- IA, slug puede ser null en ese segundo caso) reciben más feedback
-- negativo? — candidatas a revisar.
create materialized view if not exists public.mv_cs_feedback_por_solucion_30d as
select
  coalesce(solution_slug, '(generada por IA, sin guía)') as solucion,
  count(*)                                                              as total_feedback,
  count(*) filter (where feedback = 'positive')                         as feedback_positivo,
  count(*) filter (where feedback = 'negative')                         as feedback_negativo,
  round(100.0 * count(*) filter (where feedback = 'positive') / count(*), 1) as pct_positivo
from public.search_events
where event_type = 'CS_SOLUTION_FEEDBACK'
  and occurred_at >= now() - interval '30 days'
group by coalesce(solution_slug, '(generada por IA, sin guía)')
having count(*) >= 3
order by feedback_negativo desc, total_feedback desc;

create unique index if not exists mv_cs_feedback_por_solucion_30d_idx
  on public.mv_cs_feedback_por_solucion_30d (solucion);

grant select on public.mv_cs_feedback_por_solucion_30d to anon;

-- ── Refresco periódico — se añade al MISMO cron ya creado en fases
-- anteriores (reemplaza el job entero, igual que ya hizo la Fase 3 de
-- buscador.html, para que quede un único job con todas las vistas) ────
do $$
begin
  if exists (select 1 from cron.job where jobname = 'refrescar_metricas_busqueda_30min') then
    perform cron.unschedule('refrescar_metricas_busqueda_30min');
  end if;
end $$;

select cron.schedule(
  'refrescar_metricas_busqueda_30min',
  '*/30 * * * *',
  $$
    refresh materialized view concurrently public.mv_terminos_mas_buscados_7d;
    refresh materialized view concurrently public.mv_busquedas_sin_resultado_7d;
    refresh materialized view public.mv_resumen_busquedas_7d;
    refresh materialized view public.mv_cs_resumen_7d;
    refresh materialized view concurrently public.mv_cs_busquedas_sin_resultado_7d;
    refresh materialized view concurrently public.mv_cs_ia_consultas_repetidas_30d;
    refresh materialized view concurrently public.mv_cs_productos_presentados_vs_elegidos_30d;
    refresh materialized view concurrently public.mv_cs_feedback_por_solucion_30d;
  $$
);

-- Para ver resultados ya mismo, sin esperar al cron:
--   refresh materialized view public.mv_cs_resumen_7d;
--   refresh materialized view public.mv_cs_busquedas_sin_resultado_7d;
--   refresh materialized view public.mv_cs_ia_consultas_repetidas_30d;
--   refresh materialized view public.mv_cs_productos_presentados_vs_elegidos_30d;
--   refresh materialized view public.mv_cs_feedback_por_solucion_30d;
