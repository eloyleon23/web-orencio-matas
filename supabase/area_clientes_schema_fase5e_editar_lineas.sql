-- Área de Clientes — Fase 5e: comercial/almacén/administrador pueden
-- añadir, sustituir o quitar productos de un pedido (no solo
-- rectificar la cantidad a servir) — por si el cliente pidió algo que
-- ya no hay, o hay que añadir algo a mano. Continuación de los SQL
-- anteriores — pégalo también entero en el SQL Editor. Idempotente.
--
-- Solo mientras el pedido sigue en "recibida" o "en_preparacion" — una
-- vez "lista para enviar" se congela igual que ya pasaba con la
-- rectificación de cantidades.

create or replace function public.puede_gestionar_lineas_(id_propuesta uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.propuestas_pedido pp
    left join public.clientes c on c.id = pp.cliente_id
    where pp.id = id_propuesta
      and pp.estado in ('recibida', 'en_preparacion')
      and (
        public.rol_actual_() = 'administrador'
        or public.rol_actual_() = 'almacen'
        or (public.rol_actual_() = 'comercial' and c.comercial_id = auth.uid())
      )
  );
$$;

drop policy if exists "gestion anade lineas" on public.propuesta_pedido_lineas;
create policy "gestion anade lineas"
  on public.propuesta_pedido_lineas
  for insert
  to authenticated
  with check (public.puede_gestionar_lineas_(propuesta_id));

drop policy if exists "gestion edita lineas" on public.propuesta_pedido_lineas;
create policy "gestion edita lineas"
  on public.propuesta_pedido_lineas
  for update
  to authenticated
  using (public.puede_gestionar_lineas_(propuesta_id))
  with check (public.puede_gestionar_lineas_(propuesta_id));

drop policy if exists "gestion elimina lineas" on public.propuesta_pedido_lineas;
create policy "gestion elimina lineas"
  on public.propuesta_pedido_lineas
  for delete
  to authenticated
  using (public.puede_gestionar_lineas_(propuesta_id));

-- Comercial todavía no podía ni SIQUIERA ver las líneas de pedidos que
-- no fueran de sus propios clientes asignados por "clientes.comercial_id"
-- — esa política (Fase 4) sigue intacta y es la que limita el alcance
-- de "gestion edita/anade/elimina lineas" para el rol comercial: la
-- función de arriba comprueba ese mismo comercial_id.
