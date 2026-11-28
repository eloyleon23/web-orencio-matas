// Edge Function: alta de un usuario interno (comercial, almacén o
// administrador) en el Área de Clientes — solo administrador puede
// llamarla. Mismo patrón que alta-cliente (Admin API vía
// service_role), pero sin crear fila en "clientes": estos usuarios no
// son clientes.
//
// Cómo desplegarla (una vez, desde un equipo con Supabase CLI):
//   supabase link --project-ref ptuwaqfrphmsmaadedta
//   supabase functions deploy alta-usuario-interno
//
// La llama area-clientes/gestion/usuarios.html pasando el JWT del
// administrador autenticado.

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

const ROLES_INTERNOS = ['comercial', 'almacen', 'oficina', 'administrador'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECERAS_CORS });
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const cabeceraAuth = req.headers.get('Authorization') || '';
  const token = cabeceraAuth.replace(/^Bearer\s+/i, '');
  if (!token) return responder({ error: 'Falta autenticación' }, 401);

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
  if (perfilLlamante.rol !== 'administrador') {
    return responder({ error: 'Solo un administrador puede dar de alta usuarios internos' }, 403);
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
  const rol = String(cuerpo.rol || '').trim();

  if (!email || !nombre || !apellidos) {
    return responder({ error: 'Email, nombre y apellidos son obligatorios' }, 400);
  }
  if (!ROLES_INTERNOS.includes(rol)) {
    return responder({ error: 'Rol no válido — tiene que ser comercial, almacen o administrador' }, 400);
  }

  const { data: existente } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existente) {
    return responder({ error: 'Ya existe una cuenta con ese email' }, 409);
  }

  // Igual que en alta-cliente: el "redirect_to" lo manda ya resuelto el
  // navegador que llama, para que el enlace del correo apunte siempre
  // al entorno correcto (preview hoy, producción el día de mañana).
  const redirectTo = cuerpo.redirect_to ? String(cuerpo.redirect_to) : undefined;

  const { data: altaAuth, error: errorAlta } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { rol, nombre, apellidos },
    redirectTo,
  });

  if (errorAlta || !altaAuth?.user) {
    return responder({ error: 'No se ha podido crear el usuario: ' + (errorAlta?.message || 'error desconocido') }, 500);
  }

  return responder({ ok: true, id: altaAuth.user.id });
});
