-- Fase 3 del plan de analítica de búsquedas — resumen numérico para el
-- panel interno (panel_admin.html), "para ver las métricas sin
-- depurar SQL a mano" (plan de la Fase 3 del documento técnico).
--
-- Cómo aplicarlo: pégalo en el SQL Editor de Supabase y ejecútalo una
-- vez. Es idempotente.

-- Vista de una sola fila con los totales de los últimos 7 días — no
-- necesita agrupar por nada, así que no lleva índice único propio (el
-- cron la refresca con REFRESH normal, no CONCURRENTLY, que si lo
-- exigiría).
create materialized view if not exists public.mv_resumen_busquedas_7d as
select
  count(*) filter (where event_type = 'SEARCH_COMPLETED')                                    as total_busquedas,
  count(distinct session_id) filter (where event_type = 'SEARCH_COMPLETED')                   as sesiones_unicas,
  count(*) filter (where event_type = 'SEARCH_COMPLETED' and result_count = 0)                as busquedas_sin_resultado,
  count(*) filter (where event_type = 'SEARCH_COMPLETED' and search_mode = 'ai')              as busquedas_con_ia
from public.search_events
where occurred_at >= now() - interval '7 days';

grant select on public.mv_resumen_busquedas_7d to anon;

-- Se añade su refresco al mismo cron ya creado en la Fase 2 —
-- reemplaza el job entero (unschedule + schedule) para que quede un
-- único job con las tres vistas, en vez de dos jobs distintos.
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
  $$
);

-- Para ver el resumen ya mismo, sin esperar al cron:
--   refresh materialized view public.mv_resumen_busquedas_7d;
