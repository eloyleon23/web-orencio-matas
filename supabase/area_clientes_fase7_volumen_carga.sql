-- Área de Clientes — Fase 7: carga de datos sintéticos para probar el
-- panel de gestión con un volumen realista (~100 clientes, a petición
-- de Eloy el 28/11/2026). Pégalo entero en el SQL Editor de Supabase.
--
-- Nada de esto envía un solo correo: los usuarios se insertan
-- directamente en auth.users (nunca con inviteUserByEmail), con un
-- dominio reservado para pruebas (ejemplo.test, RFC 2606 — nunca
-- resuelve ni entrega correo real) y un prefijo inconfundible
-- ("carga-volumen-NNN@ejemplo.test") para poder identificarlos y
-- borrarlos sin tocar ningún dato real. El trigger
-- on_auth_user_created_area_clientes ya existente crea solo el
-- "profiles" de cada uno (rol "cliente"), igual que con cualquier alta
-- normal.
--
-- Todo el bloque es una única transacción (DO $$ ... $$) — si algo
-- falla a mitad, Postgres deshace TODO automáticamente, no queda
-- ningún resto a medias que limpiar a mano.
--
-- Para deshacer esta carga por completo, ver
-- area_clientes_fase7_volumen_limpieza.sql (mismo prefijo de email,
-- así que no puede borrar nada que no sea suyo).

do $$
declare
  v_instance_id uuid;
  v_aud text;
  v_role text;
  v_app_meta jsonb;
  v_admin_id uuid;
  v_nuevo_id uuid;
  v_pedido_id uuid;
  i int;
  idx int;
  refs text[] := array['8436559719261', '8436559719230', '8423162700144', '8006530217491'];
  nombres text[] := array[
    'DON ALGODON STAR GIRL EST.EDT.30 ML+GLOSS+EYELINER',
    'DON ALGODON LA VIE EN ROSE EST.EDT.30+C/M+LAB',
    'PAPEL HIGIENICO ALSARA ALOE VERA 3 CAPAS X12',
    'ARIEL DET.LIQUIDO ML.20+20 DOSIS'
  ];
  precios numeric[] := array[8.83, 8.83, 1.92, 7.14];
  estados text[] := array['recibida', 'en_preparacion', 'lista_para_enviar', 'en_reparto', 'entregada'];
begin
  -- Plantilla de columnas "de sistema" de auth.users copiada de una
  -- cuenta real ya existente — evita adivinar valores que varíen según
  -- la versión del esquema de Auth de este proyecto en concreto.
  select instance_id, aud, role, raw_app_meta_data
    into v_instance_id, v_aud, v_role, v_app_meta
    from auth.users
    where email = 'eloyleon23@gmail.com';

  if v_instance_id is null then
    raise exception 'No se ha encontrado la cuenta eloyleon23@gmail.com — no se puede copiar la plantilla de auth.users';
  end if;

  select id into v_admin_id from public.profiles where email = 'eloyleon23@gmail.com';

  for i in 1..100 loop
    v_nuevo_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      v_instance_id, v_nuevo_id, v_aud, v_role,
      'carga-volumen-' || lpad(i::text, 3, '0') || '@ejemplo.test',
      null,
      now(),
      v_app_meta,
      jsonb_build_object('rol', 'cliente', 'nombre', 'Carga Volumen', 'apellidos', lpad(i::text, 3, '0')),
      now(), now()
    );

    insert into public.clientes (id, comercial_id, crm_id, empresa, telefono)
    values (
      v_nuevo_id, v_admin_id,
      'CRM-VOL-' || lpad(i::text, 3, '0'),
      'Empresa de prueba ' || lpad(i::text, 3, '0'),
      '600' || lpad(i::text, 6, '0')
    );

    -- 1 de cada 3 clientes sintéticos tiene además un pedido, repartido
    -- de forma determinista por los 5 estados en curso — unos ~33
    -- pedidos en total, suficiente para notar cómo rinde la tabla de
    -- gestión/pedidos.html y las Estadísticas con volumen real.
    if i % 3 = 0 then
      idx := 1 + (i % 4);
      v_pedido_id := gen_random_uuid();
      insert into public.propuestas_pedido (id, cliente_id, estado, creado_en, enviado_en)
      values (
        v_pedido_id, v_nuevo_id, estados[1 + (i % 5)],
        now() - (i || ' hours')::interval, now() - (i || ' hours')::interval
      );
      insert into public.propuesta_pedido_lineas (propuesta_id, ref, nombre, cantidad, precio_unitario)
      values (v_pedido_id, refs[idx], nombres[idx], 1 + (i % 3), precios[idx]);
    end if;
  end loop;

  raise notice '100 clientes sintéticos creados (carga-volumen-001..100@ejemplo.test), con pedidos en 1 de cada 3.';
end $$;
