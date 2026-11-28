// Edge Function: alta masiva de clientes (CSV/Excel) — igual que la
// individual (ver alta-cliente), pero para un lote de filas a la vez.
//
// Para cada fila:
//   - Si el email NO existe todavía → crea el usuario en Auth
//     (invitación por correo, igual que el alta individual) y su
//     ficha en "clientes".
//   - Si el email YA existe → NUNCA reenvía correo (a petición de
//     Eloy: "excluir el envío de correo de acceso si ya está
//     confirmado su registro" — aquí se simplifica a no reenviar
//     nunca desde el volcado masivo, confirmado o no; para reenviar a
//     un cliente concreto se usa el alta individual o "Reset
//     password" desde Supabase). Solo completa en "clientes" los
//     campos que estuvieran vacíos — nunca pisa un dato ya informado.
//
// Despliegue: npx supabase functions deploy importar-clientes

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

type FilaEntrada = {
  nombre?: string;
  apellidos?: string;
  email?: string;
  empresa?: string;
  telefono?: string;
  crm_id?: string;
  direccion_calle?: string;
  direccion_cp?: string;
  direccion_poblacion?: string;
};

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
  if (!['comercial', 'oficina', 'administrador'].includes(perfilLlamante.rol)) {
    return responder({ error: 'Solo comerciales, oficina o administradores pueden importar clientes' }, 403);
  }

  let cuerpo: { filas?: FilaEntrada[]; redirect_to?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: 'JSON inválido' }, 400);
  }

  const filas = Array.isArray(cuerpo.filas) ? cuerpo.filas : [];
  if (filas.length === 0) return responder({ error: 'No hay filas que importar' }, 400);
  if (filas.length > 500) return responder({ error: 'Máximo 500 filas por importación' }, 400);

  const redirectTo = cuerpo.redirect_to ? String(cuerpo.redirect_to) : undefined;
  const resultados: Array<{ fila: number; email: string; estado: string; detalle?: string }> = [];

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const numeroFila = i + 2; // +1 cabecera, +1 para que "fila 1" sea la primera de datos
    const email = String(fila.email || '').trim().toLowerCase();
    const nombre = String(fila.nombre || '').trim();
    const apellidos = String(fila.apellidos || '').trim();

    if (!email || !nombre || !apellidos) {
      resultados.push({ fila: numeroFila, email: email || '(vacío)', estado: 'error', detalle: 'Faltan email, nombre o apellidos' });
      continue;
    }

    const empresa = fila.empresa ? String(fila.empresa).trim() : null;
    const telefono = fila.telefono ? String(fila.telefono).trim() : null;
    const crmId = fila.crm_id ? String(fila.crm_id).trim() : null;
    const direccionCalle = fila.direccion_calle ? String(fila.direccion_calle).trim() : null;
    const direccionCp = fila.direccion_cp ? String(fila.direccion_cp).trim() : null;
    const direccionPoblacion = fila.direccion_poblacion ? String(fila.direccion_poblacion).trim() : null;

    const { data: existente } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();

    if (existente) {
      // Ya tiene cuenta — solo completar lo que falte en "clientes",
      // nunca pisar lo que ya hubiera, y nunca reenviar correo.
      const { data: clienteActual } = await admin
        .from('clientes')
        .select('comercial_id, crm_id, empresa, telefono, direccion_calle, direccion_cp, direccion_poblacion')
        .eq('id', existente.id)
        .maybeSingle();

      if (!clienteActual) {
        resultados.push({ fila: numeroFila, email, estado: 'error', detalle: 'Ya existe como usuario pero sin ficha de cliente — revisar a mano' });
        continue;
      }

      const { error: errorUpdate } = await admin
        .from('clientes')
        .update({
          crm_id: clienteActual.crm_id ?? crmId,
          empresa: clienteActual.empresa ?? empresa,
          telefono: clienteActual.telefono ?? telefono,
          direccion_calle: clienteActual.direccion_calle ?? direccionCalle,
          direccion_cp: clienteActual.direccion_cp ?? direccionCp,
          direccion_poblacion: clienteActual.direccion_poblacion ?? direccionPoblacion,
        })
        .eq('id', existente.id);

      resultados.push(
        errorUpdate
          ? { fila: numeroFila, email, estado: 'error', detalle: errorUpdate.message }
          : { fila: numeroFila, email, estado: 'actualizado' }
      );
      continue;
    }

    // No existe todavía — alta completa, igual que el alta individual.
    const comercialId = ['oficina', 'administrador'].includes(perfilLlamante.rol) && (fila as any).comercial_id
      ? String((fila as any).comercial_id)
      : llamanteId;

    const { data: altaAuth, error: errorAlta } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { rol: 'cliente', nombre, apellidos },
      redirectTo,
    });

    if (errorAlta || !altaAuth?.user) {
      resultados.push({ fila: numeroFila, email, estado: 'error', detalle: 'No se ha podido crear el usuario: ' + (errorAlta?.message || 'error desconocido') });
      continue;
    }

    const { error: errorClientes } = await admin.from('clientes').insert({
      id: altaAuth.user.id,
      comercial_id: comercialId,
      crm_id: crmId,
      empresa,
      telefono,
      direccion_calle: direccionCalle,
      direccion_cp: direccionCp,
      direccion_poblacion: direccionPoblacion,
    });

    resultados.push(
      errorClientes
        ? { fila: numeroFila, email, estado: 'error', detalle: 'Usuario creado pero sin ficha de cliente: ' + errorClientes.message }
        : { fila: numeroFila, email, estado: 'creado' }
    );
  }

  return responder({ ok: true, resultados });
});
