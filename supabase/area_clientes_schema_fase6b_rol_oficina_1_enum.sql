-- Área de Clientes — Fase 6b (paso 1 de 2): nuevo rol "oficina".
--
-- ⚠️ EJECUTA ESTE ARCHIVO SOLO, ÉL SOLITO, Y ESPERA A QUE TERMINE
-- ANTES DE PEGAR EL SIGUIENTE (area_clientes_schema_fase6b_rol_oficina_2_permisos.sql).
-- Postgres no deja usar un valor nuevo de un tipo enum en la MISMA
-- transacción en la que se crea — si lo pegas todo junto con el
-- segundo archivo, falla con un error de "unsafe use of new value of
-- enum type". Separados en dos pasos, sin problema.

alter type public.rol_area_clientes add value if not exists 'oficina';
