-- Fase 5 del plan de analítica — cierra el círculo "la IA detecta un
-- hueco -> se convierte en guía permanente" (sección 13 del documento):
-- expone, para cada consulta que ya aparece repetida en
-- mv_cs_ia_consultas_repetidas_30d (Fase 4), una muestra representativa
-- del JSON COMPLETO que generó la IA la última vez — para que
-- gestion-soluciones.js pueda usarlo como borrador inicial de una guía
-- nueva (ver el botón "Usar como borrador" en el editor de guías).
--
-- Mismo criterio de seguridad ya establecido (ver schema.sql y
-- 04_fase4...): es un agregado/muestra sin PII (texto generado sobre
-- productos/categorías, nunca datos de la persona que preguntó), así
-- que es seguro concederle SELECT a "anon" — la protección de que solo
-- el equipo lo vea de verdad la da el flag MOSTRAR_GESTION_SOLUCIONES
-- (preproducción) del propio Centro de Soluciones, no Supabase.
--
-- Cómo aplicarlo: pégalo entero en el SQL Editor de Supabase y
-- ejecútalo una vez. Es idempotente.

create materialized view if not exists public.mv_cs_ia_candidatas_json_30d as
select distinct on (query_normalized)
  query_normalized,
  ai_generated_json,
  occurred_at as ultima_vez
from public.search_events
where event_type = 'CS_AI_SOLUTION_GENERATED'
  and solution_slug is null          -- solo las generadas 100% dinámicamente (sin guía existente) — esas son las que de verdad falta crear
  and ai_generated_json is not null
  and occurred_at >= now() - interval '30 days'
order by query_normalized, occurred_at desc; -- la más reciente de cada consulta, como muestra representativa

create unique index if not exists mv_cs_ia_candidatas_json_30d_termino_idx
  on public.mv_cs_ia_candidatas_json_30d (query_normalized);

grant select on public.mv_cs_ia_candidatas_json_30d to anon;

-- Se añade su refresco al mismo cron ya creado en fases anteriores
-- (reemplaza el job entero, mismo patrón ya usado en cada fase).
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
    refresh materialized view concurrently public.mv_cs_ia_candidatas_json_30d;
  $$
);

-- Para ver resultados ya mismo, sin esperar al cron:
--   refresh materialized view public.mv_cs_ia_candidatas_json_30d;
