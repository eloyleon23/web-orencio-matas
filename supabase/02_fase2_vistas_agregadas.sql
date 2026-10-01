-- Fase 2 del plan de analítica de búsquedas — primeras vistas agregadas
-- y los dos primeros módulos ("más buscados" y "búsquedas sin
-- resultado"). Ver el documento técnico (secciones 8 y 9) y
-- supabase/schema.sql (Fase 1) para el diseño completo:
-- https://claude.ai/code/artifact/84c510a1-e455-4761-a34d-b79e78a0c54c
--
-- Cómo aplicarlo: pégalo entero en el SQL Editor de Supabase y
-- ejecútalo una vez. Es idempotente (se puede volver a ejecutar sin
-- duplicar nada si se ajusta algo más adelante).
--
-- DECISIÓN DE DISEÑO IMPORTANTE: la Fase 1 todavía no registra qué
-- PRODUCTO concreto resultó de cada búsqueda (search_event_products
-- sigue vacía — eso llega con PRODUCT_VIEWED en una fase posterior).
-- Por eso "más buscados" se construye aquí a partir del TÉRMINO
-- (query_normalized), no del producto — es lo honesto con los datos
-- que de verdad existen hoy (principio del documento: "las métricas
-- deben basarse en datos reales, no en suposiciones"). El buscador
-- resuelve cada término a productos reales en el propio cliente,
-- reutilizando su motor de búsqueda de siempre — no hace falta
-- replicar el catálogo en Supabase para esto.

-- ── Términos más buscados (7 días) — módulo público del buscador ─────
-- Volumen mínimo deliberadamente bajo (3 sesiones únicas) mientras el
-- tráfico real todavía es pequeño (sección 8 del documento). Sube este
-- número más adelante, cuando haya más tráfico real, para que el
-- módulo no se llene de ruido de unas pocas visitas.
create materialized view if not exists public.mv_terminos_mas_buscados_7d as
select
  query_normalized,
  count(*)                     as total_busquedas,
  count(distinct session_id)   as sesiones_unicas,
  min(occurred_at)             as primera_vez,
  max(occurred_at)             as ultima_vez
from public.search_events
where event_type = 'SEARCH_COMPLETED'
  and occurred_at >= now() - interval '7 days'
  and query_normalized is not null
  and query_normalized <> ''
group by query_normalized
having count(distinct session_id) >= 3
order by sesiones_unicas desc, total_busquedas desc;

create unique index if not exists mv_terminos_mas_buscados_7d_termino_idx
  on public.mv_terminos_mas_buscados_7d (query_normalized);

-- ── Búsquedas sin resultado / con pocos resultados (7 días) ───────────
-- "Oportunidades de catálogo" (sección 9 del documento) — pensada para
-- el panel interno (panel_admin.html): sirve para decidir qué
-- incorporar al catálogo, no es algo que deba ver el público.
create materialized view if not exists public.mv_busquedas_sin_resultado_7d as
select
  query_normalized,
  count(*)                                                                as total_busquedas,
  count(distinct session_id)                                              as sesiones_unicas,
  round(100.0 * count(*) filter (where result_count = 0) / count(*), 0)    as porcentaje_cero_resultados,
  min(occurred_at) as primera_vez,
  max(occurred_at) as ultima_vez
from public.search_events
where event_type = 'SEARCH_COMPLETED'
  and result_count <= 2
  and occurred_at >= now() - interval '7 days'
  and query_normalized is not null
  and query_normalized <> ''
group by query_normalized
having count(distinct session_id) >= 2
order by sesiones_unicas desc, total_busquedas desc;

create unique index if not exists mv_busquedas_sin_resultado_7d_termino_idx
  on public.mv_busquedas_sin_resultado_7d (query_normalized);

-- ── Permisos: exponer SOLO estas vistas agregadas a la clave "anon" ───
-- Nunca se concede SELECT sobre search_events en sí (eso seguiría
-- dejando ver término a término, sesión a sesión) — solo sobre el
-- agregado ya redondeado, que no identifica a nadie y es seguro de
-- leer con la misma clave pública que ya usa el buscador para insertar.
grant select on public.mv_terminos_mas_buscados_7d to anon;
grant select on public.mv_busquedas_sin_resultado_7d to anon;

-- ── Refresco periódico automático (cada 30 min, vía pg_cron) ──────────
-- Si este bloque falla con un error de permisos, activa la extensión
-- "pg_cron" desde el panel de Supabase (Database → Extensions) y
-- vuelve a ejecutar SOLO este bloque final.
create extension if not exists pg_cron;

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
  $$
);

-- Para ver resultados ahora mismo sin esperar 30 minutos (útil para
-- comprobar que todo funciona tras pegar este script), ejecuta:
--   refresh materialized view public.mv_terminos_mas_buscados_7d;
--   refresh materialized view public.mv_busquedas_sin_resultado_7d;
