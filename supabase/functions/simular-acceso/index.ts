// Edge Function: inicia una simulación de acceso de solo visualización
// a un cliente, para que comercial/administrador puedan ver exactamente
// lo que ve ese cliente (demostraciones, validar una incidencia...).
//
// Importante — esto NUNCA conoce ni reinicia la contraseña del cliente:
// genera un enlace mágico de un solo uso vía la Admin API (requiere
// service_role, por eso vive aquí y no en el navegador) y devuelve el
// token para que el frontend abra una sesión de solo ese cliente en
// una pestaña aparte, con su propio almacenamiento — la sesión del
// comercial en su pestaña original no se toca en ningún momento.
//
// Despliegue: npx supabase functions deploy simular-acceso

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

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
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
  if (!['comercial', 'oficina'].includes(perfilLlamante.rol)) {
    return responder({ error: 'Solo comerciales u oficina pueden simular el acceso de un cliente' }, 403);
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: 'JSON inválido' }, 400);
  }

  const clienteId = String(cuerpo.cliente_id || '');
  if (!clienteId) return responder({ error: 'Falta cliente_id' }, 400);

  const { data: cliente, error: errorCliente } = await admin
    .from('clientes')
    // Igual que en gestion/clientes.html: "clientes" tiene dos
    // referencias a "profiles" (id y comercial_id), hay que indicar
    // cuál seguir.
    .select('id, comercial_id, profiles!clientes_id_fkey(email, nombre, apellidos)')
    .eq('id', clienteId)
    .single();

  if (errorCliente || !cliente) return responder({ error: 'Cliente no encontrado' }, 404);

  // Un comercial solo puede simular a SUS clientes asignados; oficina
  // puede simular cualquiera.
  if (perfilLlamante.rol === 'comercial' && cliente.comercial_id !== llamanteId) {
    return responder({ error: 'Ese cliente no está asignado a tu cartera' }, 403);
  }

  const clienteEmail = (cliente as any).profiles.email as string;

  const { data: enlace, error: errorEnlace } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: clienteEmail,
  });

  if (errorEnlace || !enlace?.properties?.hashed_token) {
    return responder({ error: 'No se ha podido generar el acceso de simulación: ' + (errorEnlace?.message || 'error desconocido') }, 500);
  }

  // Registro de auditoría — siempre, pase lo que pase después en el
  // navegador. Si esto fallara no se entrega el token: sin registro,
  // no hay simulación.
  const { error: errorAuditoria } = await admin.from('simulaciones_acceso').insert({
    comercial_id: llamanteId,
    cliente_id: clienteId,
    cliente_email: clienteEmail,
  });

  if (errorAuditoria) {
    return responder({ error: 'No se ha podido registrar la simulación: ' + errorAuditoria.message }, 500);
  }

  return responder({
    ok: true,
    token_hash: enlace.properties.hashed_token,
    cliente_email: clienteEmail,
    cliente_nombre: [(cliente as any).profiles.nombre, (cliente as any).profiles.apellidos].filter(Boolean).join(' '),
  });
});
