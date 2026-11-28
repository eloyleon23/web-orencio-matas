-- Área de Clientes — Fase 7: deshace por completo la carga de
-- area_clientes_fase7_volumen_carga.sql. Solo toca cuentas cuyo email
-- empieza por "carga-volumen-" y termina en "@ejemplo.test" — no puede
-- afectar a ningún cliente real.
--
-- Borrar de auth.users basta: profiles (on delete cascade) → clientes
-- (on delete cascade) → propuestas_pedido (on delete cascade) →
-- propuesta_pedido_lineas (on delete cascade) se van detrás en cadena,
-- sin tocarlos uno a uno.

delete from auth.users
where email like 'carga-volumen-%@ejemplo.test';
