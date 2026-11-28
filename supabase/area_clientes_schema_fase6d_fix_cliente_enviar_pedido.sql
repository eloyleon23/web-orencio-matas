-- Área de Clientes — Fase 6d: corrige un bug crítico encontrado al
-- validar la Fase 6 (28/11/2026): el cliente NUNCA ha podido enviar un
-- pedido desde que existe la máquina de estados (Fase 5) — la función
-- transicion_pedido_permitida_ nunca tuvo un caso para "cliente" en la
-- transición borrador → recibida, así que el trigger
-- validar_transicion_pedido_ la rechazaba siempre con "No tienes
-- permiso para pasar un pedido de 'borrador' a 'recibida'". Las
-- versiones posteriores de la función (Fase 6b, Fase 6c) arrastraron
-- el mismo olvido sin darse cuenta porque cada una se centraba solo en
-- los roles de gestión.
--
-- Continuación de los SQL anteriores (incluidas las Fases 6b y 6c, que
-- hay que haber ejecutado ya) — pégalo también entero en el SQL
-- Editor. Idempotente.

create or replace function public.transicion_pedido_permitida_(rol public.rol_area_clientes, estado_actual text, estado_nuevo text)
returns boolean
language sql
immutable
as $$
  select
    estado_actual = estado_nuevo
    or (rol = 'administrador') -- administrador: sin limitaciones, cualquier transición
    or (rol = 'cliente' and estado_actual = 'borrador' and estado_nuevo = 'recibida')
    or (rol = 'comercial' and estado_actual = 'recibida' and estado_nuevo = 'en_preparacion')
    or (rol = 'almacen' and estado_actual = 'en_preparacion' and estado_nuevo = 'lista_para_enviar')
    or (rol = 'oficina' and estado_actual = 'lista_para_enviar' and estado_nuevo = 'en_reparto')
    or (rol = 'oficina' and estado_actual = 'en_reparto' and estado_nuevo = 'entregada')
$$;
