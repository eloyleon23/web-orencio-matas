-- Esquema de analítica de búsquedas del buscador de Orencio Matas.
--
-- Diseño completo (motivación, alternativas estudiadas, modelo de
-- métricas) en el documento técnico:
-- https://claude.ai/code/artifact/84c510a1-e455-4761-a34d-b79e78a0c54c
--
-- Cómo aplicarlo: pega este archivo entero en el SQL Editor del
-- proyecto de Supabase (https://supabase.com/dashboard → tu proyecto →
-- SQL Editor → New query) y ejecútalo una vez. Es idempotente
-- (IF NOT EXISTS / DROP POLICY IF EXISTS) — se puede volver a ejecutar
-- sin duplicar nada si se añade algo más adelante.
--
-- Principio de diseño (Fase 1 — ver sección 13 del documento): ingesta
-- mínima. Solo lo necesario para registrar SEARCH_SUBMITTED y
-- SEARCH_COMPLETED sin bloquear al buscador. Las vistas materializadas
-- para los módulos ("más buscados", "sin resultados"...) se añaden en
-- la Fase 2, cuando ya haya datos reales que agregar.

create extension if not exists pgcrypto;

-- ── Tabla principal: un evento = una fila ──────────────────────────────
create table if not exists public.search_events (
  id                      uuid primary key default gen_random_uuid(),
  occurred_at             timestamptz not null default now(),
  event_type              text not null,          -- 'SEARCH_SUBMITTED' | 'SEARCH_COMPLETED' | ... (texto libre, ver sección 7 del documento)
  session_id              uuid not null,           -- anónimo, generado en el cliente (localStorage), sin vínculo con identidad real
  query_raw               text,                    -- término tal cual lo escribió el usuario
  query_normalized        text,                    -- término normalizado (minúsculas, sin acentos — mismo criterio que normalizarTexto() en el frontend)
  search_mode             text,                    -- 'instant' | 'ai'
  area_filter             text,
  family_filter           text,
  price_min               numeric,
  price_max               numeric,
  sort_by                 text,
  result_count            int,
  duration_ms             int,
  gemini_used             boolean,
  gemini_intent           text,
  gemini_brand_detected   text,
  gemini_category_detected text,
  device_type             text,                    -- 'mobile' | 'desktop' | 'tablet' (derivado en el cliente; nunca el user-agent completo)
  source_page             text,                    -- 'buscador', 'centro-soluciones', etc.
  ended_in_action         text                      -- 'none' | 'contact_requested' | 'availability_requested' | ... (se actualiza más adelante si aplica; no usado en Fase 1)
);

comment on table public.search_events is
  'Un evento de búsqueda o interacción relacionada. event_type es texto libre a propósito: añadir un tipo nuevo no exige migración. No contiene PII — ver sección 11 del documento técnico.';

create index if not exists search_events_occurred_at_idx on public.search_events (occurred_at);
create index if not exists search_events_event_type_idx   on public.search_events (event_type);
create index if not exists search_events_session_id_idx   on public.search_events (session_id);
create index if not exists search_events_query_norm_idx   on public.search_events (query_normalized);
-- Índice parcial para "búsquedas sin resultado / con pocos resultados" (sección 9 del documento).
create index if not exists search_events_pocos_resultados_idx
  on public.search_events (query_normalized)
  where event_type = 'SEARCH_COMPLETED' and result_count <= 2;

-- ── Tabla de productos asociados a un evento (0..N filas por evento) ──
-- Aún no se escribe desde el frontend en la Fase 1 (eso llega en la
-- Fase 2/4, con PRODUCT_VIEWED y los productos recomendados por
-- Gemini) — se crea ya para no tener que migrar nada cuando se use.
create table if not exists public.search_event_products (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.search_events(id) on delete cascade,
  product_ref text not null,             -- referencia real del catálogo — nunca se duplica nombre/marca/precio aquí
  role        text not null,             -- 'shown' | 'recommended_by_ai' | 'viewed' | 'selected'
  position    int
);

create index if not exists search_event_products_event_id_idx    on public.search_event_products (event_id);
create index if not exists search_event_products_product_ref_idx on public.search_event_products (product_ref);

-- ── Seguridad: Row Level Security, solo inserción pública ─────────────
-- La clave "anon" que vive en el HTML público SOLO puede insertar.
-- Nunca puede leer, modificar ni borrar — así, aunque la clave sea
-- pública (como ya lo es hoy la URL de Apps Script), nadie puede leer
-- eventos ajenos ni alterar el histórico con ella. Las consultas de
-- agregación para los paneles/módulos se hacen con la clave
-- "service_role" (nunca expuesta en el HTML) o con vistas específicas
-- que se añadirán en la Fase 2.

alter table public.search_events enable row level security;
alter table public.search_event_products enable row level security;

drop policy if exists "insertar eventos (público)" on public.search_events;
create policy "insertar eventos (público)"
  on public.search_events
  for insert
  to anon
  with check (true);

drop policy if exists "insertar productos de evento (público)" on public.search_event_products;
create policy "insertar productos de evento (público)"
  on public.search_event_products
  for insert
  to anon
  with check (true);

-- Deliberadamente NO hay política de SELECT/UPDATE/DELETE para "anon" —
-- sin una política expresa para una operación, Postgres la deniega por
-- defecto en una tabla con RLS activado. Esto es lo que hace seguro
-- exponer la clave "anon" en el HTML público.
