// Edge Function: alta individual de un cliente en el Área de Clientes.
//
// Necesita el service_role key (nunca expuesto en el frontend) para
// poder crear usuarios en Supabase Auth vía la Admin API — por eso
// esto vive en una función de servidor y no en el HTML. Supabase
// inyecta SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY automáticamente en
// el entorno de la función; no hace falta configurarlos a mano.
//
// Cómo desplegarla (una vez, desde un equipo con Supabase CLI):
//   supabase link --project-ref ptuwaqfrphmsmaadedta
//   supabase functions deploy alta-cliente
//
// La llama el panel de gestión (area-clientes/gestion/alta-cliente.html)
// pasando el JWT del comercial/administrador autenticado.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CABECERAS_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CABECERAS_CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECERAS_CORS });
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const cabeceraAuth = req.headers.get('Authorization') || '';
  const token = cabeceraAuth.replace(/^Bearer\s+/i, '');
  if (!token) return responder({ error: 'Falta autenticación' }, 401);

  // Cliente con la clave de servicio: puede todo, así que primero
  // identificamos y validamos al llamante antes de hacer nada.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: datosUsuario, error: errorToken } = await admin.auth.getUser(token);
  if (errorToken || !datosUsuario?.user) return responder({ error: 'Sesión no válida' }, 401);
  const llamanteId = datosUsuario.user.id;

  const { data: perfilLlamante, error: errorPerfil } = await admin
    .from('profiles')
    .select('rol')
    .eq('id', llamanteId)
    .single();

  if (errorPerfil || !perfilLlamante) return responder({ error: 'No se ha encontrado el perfil del usuario' }, 403);
  if (!['comercial', 'administrador'].includes(perfilLlamante.rol)) {
    return responder({ error: 'Solo comerciales o administradores pueden dar de alta clientes' }, 403);
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: 'JSON inválido' }, 400);
  }

  const email = String(cuerpo.email || '').trim().toLowerCase();
  const nombre = String(cuerpo.nombre || '').trim();
  const apellidos = String(cuerpo.apellidos || '').trim();
  const empresa = cuerpo.empresa ? String(cuerpo.empresa).trim() : null;
  const telefono = cuerpo.telefono ? String(cuerpo.telefono).trim() : null;
  const crmId = cuerpo.crm_id ? String(cuerpo.crm_id).trim() : null;
  const direccionCalle = cuerpo.direccion_calle ? String(cuerpo.direccion_calle).trim() : null;
  const direccionCp = cuerpo.direccion_cp ? String(cuerpo.direccion_cp).trim() : null;
  const direccionPoblacion = cuerpo.direccion_poblacion ? String(cuerpo.direccion_poblacion).trim() : null;

  if (!email || !nombre || !apellidos) {
    return responder({ error: 'Email, nombre y apellidos son obligatorios' }, 400);
  }

  // Un comercial solo puede darse de alta clientes a sí mismo asignados;
  // un administrador puede asignar el cliente a cualquier comercial.
  let comercialId = llamanteId;
  if (perfilLlamante.rol === 'administrador' && cuerpo.comercial_id) {
    comercialId = String(cuerpo.comercial_id);
  }

  // Verificación explícita de duplicado — a petición de Eloy, antes de
  // intentar crear nada.
  const { data: existente } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existente) {
    return responder({ error: 'Ya existe una cuenta con ese email' }, 409);
  }

  // Crea el usuario en Auth e, inmediatamente, envía el correo de
  // acceso de Supabase (enlace para fijar contraseña). El trigger
  // on_auth_user_created_area_clientes crea su fila en profiles solo.
  const { data: altaAuth, error: errorAlta } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { rol: 'cliente', nombre, apellidos },
  });

  if (errorAlta || !altaAuth?.user) {
    return responder({ error: 'No se ha podido crear el usuario: ' + (errorAlta?.message || 'error desconocido') }, 500);
  }

  const nuevoId = altaAuth.user.id;

  const { error: errorClientes } = await admin.from('clientes').insert({
    id: nuevoId,
    comercial_id: comercialId,
    crm_id: crmId,
    empresa,
    telefono,
    direccion_calle: direccionCalle,
    direccion_cp: direccionCp,
    direccion_poblacion: direccionPoblacion,
  });

  if (errorClientes) {
    // El usuario de Auth ya se creó — no lo deshacemos automáticamente
    // (podría haber recibido ya el correo); se informa del fallo para
    // completar la ficha a mano desde el panel.
    return responder({
      error: 'Usuario creado pero no se ha podido guardar su ficha de cliente: ' + errorClientes.message,
      id: nuevoId,
    }, 500);
  }

  return responder({ ok: true, id: nuevoId });
});
