-- Área de Clientes — Fase 3 (parte extra): último acceso del cliente.
-- Continuación de area_clientes_schema.sql, _fase2.sql, _fase2b.sql y
-- _fase3.sql — pégalo también entero en el SQL Editor. Idempotente.
--
-- A petición de Eloy: desde el panel de gestión se quiere ver cuándo
-- entró un cliente por última vez a su área. Se guarda en una sola
-- columna, actualizada por una función "security definer" (en vez de
-- una política de UPDATE abierta sobre "clientes") para que el cliente
-- solo pueda tocar su propia fecha de acceso y nada más de su ficha
-- (descuento, familias visibles, etc. siguen protegidos por RLS).

alter table public.clientes
  add column if not exists ultimo_acceso timestamptz;

comment on column public.clientes.ultimo_acceso is
  'Momento del último acceso del cliente a su área (se actualiza con public.registrar_ultimo_acceso_()), para que comercial/administrador lo vean en el panel de gestión.';

create or replace function public.registrar_ultimo_acceso_()
returns void
language sql
security definer
set search_path = public
as $$
  update public.clientes set ultimo_acceso = now() where id = auth.uid();
$$;

comment on function public.registrar_ultimo_acceso_ is
  'Llamada desde el área de clientes al entrar (nunca desde una simulación): marca ultimo_acceso = now() solo para el propio usuario autenticado.';

grant execute on function public.registrar_ultimo_acceso_() to authenticated;
