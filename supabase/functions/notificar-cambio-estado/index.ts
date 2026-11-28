// Edge Function: avisos por correo de la Fase 6 — cierre del pedido
// (en_reparto/entregada) y solicitud de copia de factura por el
// cliente. Separada de notificar-pedido (que solo cubre el aviso de
// "pedido recibido") para no mezclar responsabilidades, pero
// comparte los MISMOS secretos de esa función — es la misma familia
// de avisos "sobre un pedido", solo que de fases distintas:
//
//   BREVO_API_KEY, PEDIDOS_EMAIL_REMITENTE, PEDIDOS_EMAIL_DESTINO,
//   PEDIDOS_ACTIVAR_CLIENTES_REALES, PEDIDOS_EMAIL_PRUEBA_CLIENTE,
//   AREA_CLIENTES_URL — ver supabase/functions/notificar-pedido/
//   CONFIGURACION.md, el mismo documento aplica aquí.
//
// Tres "tipo" de aviso, body: { propuesta_id, tipo }:
//   'en_reparto'        — lo llama almacén/administrador al cerrar el
//                         pedido (nº de albarán/factura ya puestos) —
//                         avisa al cliente de que está en camino.
//   'entregada'         — lo llama administrador al marcar la entrega
//                         — avisa al cliente de que ya lo tiene.
//   'solicitud_factura' — lo llama EL CLIENTE desde "Mis pedidos" en
//                         un pedido ya entregado — avisa a gestión
//                         (PEDIDOS_EMAIL_DESTINO) de que pide copia.
//
// Un fallo aquí nunca deshace ni bloquea nada — el cambio de estado ya
// ha quedado guardado en BBDD antes de llamar a esta función.
//
// Despliegue: se despliega solo con el workflow de GitHub Actions
// "Desplegar Edge Functions de Supabase" en cuanto cambie este
// archivo (o a mano: npx supabase functions deploy notificar-cambio-estado).

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

function listaDestinatarios_(valor: string | undefined | null): { email: string }[] {
  return (valor || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}

async function enviarCorreoBrevo_(
  apiKey: string,
  remitente: { name: string; email: string },
  destinatarios: { email: string; name?: string }[],
  asunto: string,
  htmlContent: string
): Promise<{ ok: boolean; detalle?: string }> {
  if (!destinatarios.length) return { ok: false, detalle: 'Sin destinatarios' };
  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({ sender: remitente, to: destinatarios, subject: asunto, htmlContent }),
  });
  if (resp.ok) return { ok: true };
  const texto = await resp.text().catch(() => '');
  return { ok: false, detalle: 'Brevo respondió ' + resp.status + ': ' + texto };
}

function escapeHtml_(valor: unknown): string {
  return String(valor ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const LOGO_URL_ = 'https://orenciomatas.es/assets/logos/logo-orencio.png';

// Misma plantilla que notificar-pedido (ver ese archivo para más
// detalle) — duplicada a propósito: Deno no puede importar el JS del
// navegador, y este proyecto ya acepta esa pequeña duplicación entre
// funciones a cambio de que cada una siga siendo independiente.
function construirEmailProfesional_(contenidoHtml: string, boton: { texto: string; url: string } | null): string {
  const botonHtml = boton
    ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 4px;"><tr><td style="border-radius:8px; background:#1976D2;">' +
      '<a href="' + escapeHtml_(boton.url) + '" target="_blank" rel="noopener" ' +
      'style="display:inline-block; padding:12px 26px; font-family:Arial,sans-serif; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:8px;">' +
      escapeHtml_(boton.texto) + ' →</a></td></tr></table>'
    : '';
  return (
    '<div style="background:#f1f5f9; padding:28px 12px; font-family:Arial,sans-serif;">' +
    '<div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(15,23,42,0.08);">' +
    '<div style="background:#0f172a; padding:22px 28px; text-align:center;">' +
    '<img src="' + LOGO_URL_ + '" alt="Orencio Matas y Hnos" height="42" style="height:42px; width:auto;">' +
    '</div>' +
    '<div style="padding:28px 28px 8px; color:#1e293b; font-size:15px; line-height:1.5;">' + contenidoHtml + botonHtml + '</div>' +
    '<div style="padding:18px 28px; border-top:1px solid #e2e8f0; color:#94a3b8; font-size:12px; text-align:center;">' +
    'Orencio Matas y Hnos, S.L. — Área de Clientes' +
    '</div></div></div>'
  );
}

const TIPOS_VALIDOS = ['en_reparto', 'entregada', 'solicitud_factura'];
// A qué estado tiene que estar la propuesta para que tenga sentido
// cada aviso — evita notificar un cambio que no ha pasado de verdad.
const ESTADO_ESPERADO: Record<string, string> = {
  en_reparto: 'en_reparto',
  entregada: 'entregada',
  solicitud_factura: 'entregada',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECERAS_CORS });
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  const EMAIL_REMITENTE = Deno.env.get('PEDIDOS_EMAIL_REMITENTE');
  const EMAIL_DESTINO = Deno.env.get('PEDIDOS_EMAIL_DESTINO');
  const ACTIVAR_CLIENTES_REALES = (Deno.env.get('PEDIDOS_ACTIVAR_CLIENTES_REALES') || '').toLowerCase() === 'true';
  const EMAIL_PRUEBA_CLIENTE = Deno.env.get('PEDIDOS_EMAIL_PRUEBA_CLIENTE');
  const AREA_CLIENTES_URL = (Deno.env.get('AREA_CLIENTES_URL') || '').replace(/\/+$/, '');

  if (!BREVO_API_KEY || !EMAIL_REMITENTE) {
    return responder({ error: 'Notificaciones de pedido no configuradas (faltan secretos BREVO_API_KEY/PEDIDOS_EMAIL_REMITENTE)' }, 500);
  }

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return responder({ error: 'Falta autenticación' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: datosUsuario, error: errorToken } = await admin.auth.getUser(token);
  if (errorToken || !datosUsuario?.user) return responder({ error: 'Sesión no válida' }, 401);
  const llamanteId = datosUsuario.user.id;

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: 'JSON inválido' }, 400);
  }
  const propuestaId = String(cuerpo.propuesta_id || '').trim();
  const tipo = String(cuerpo.tipo || '').trim();
  if (!propuestaId || !TIPOS_VALIDOS.includes(tipo)) {
    return responder({ error: 'Falta propuesta_id o "tipo" no es válido' }, 400);
  }

  const { data: perfilLlamante } = await admin.from('profiles').select('rol').eq('id', llamanteId).single();
  const esCliente = tipo === 'solicitud_factura';
  if (esCliente) {
    // Solo el propio cliente puede pedir la copia de SU factura.
    if (!perfilLlamante || perfilLlamante.rol !== 'cliente') {
      return responder({ error: 'Solo un cliente puede solicitar la copia de su factura' }, 403);
    }
  } else if (!perfilLlamante || !['almacen', 'administrador'].includes(perfilLlamante.rol)) {
    return responder({ error: 'Solo almacén o administrador pueden avisar de este cambio' }, 403);
  }

  // Para el cliente, además de la propuesta, se exige que sea SUYA
  // (cliente_id = quien llama) — para el staff basta con el id, el
  // chequeo de rol de arriba ya decide si puede avisar o no.
  let consultaPropuesta = admin
    .from('propuestas_pedido')
    .select('id, cliente_id, estado, transportista, numero_seguimiento, albaran, factura, clientes(empresa, profiles!clientes_id_fkey(nombre, apellidos, email))')
    .eq('id', propuestaId);
  if (esCliente) consultaPropuesta = consultaPropuesta.eq('cliente_id', llamanteId);
  const { data: propuesta, error: errorPropuesta } = await consultaPropuesta.maybeSingle();

  if (errorPropuesta || !propuesta) {
    return responder({ error: 'Pedido no encontrado' + (esCliente ? ' o no es tuyo' : '') }, 404);
  }
  if ((propuesta as any).estado !== ESTADO_ESPERADO[tipo]) {
    return responder({ error: 'El pedido no está en el estado esperado para este aviso (está en "' + (propuesta as any).estado + '")' }, 409);
  }

  const clienteAnidado = Array.isArray((propuesta as any).clientes) ? (propuesta as any).clientes[0] : (propuesta as any).clientes;
  const profileAnidado = clienteAnidado && Array.isArray(clienteAnidado.profiles) ? clienteAnidado.profiles[0] : clienteAnidado?.profiles;
  const nombreCliente = [profileAnidado?.nombre, profileAnidado?.apellidos].filter(Boolean).join(' ') || '(sin nombre)';
  const emailCliente = profileAnidado?.email || '';
  const empresaAnidada = clienteAnidado?.empresa || null;

  const remitente = { name: 'Orencio Matas y Hnos — Área de Clientes', email: EMAIL_REMITENTE };
  const botonCliente = AREA_CLIENTES_URL ? { texto: 'Ir a mi pedido', url: AREA_CLIENTES_URL + '/mis-pedidos.html' } : null;
  const botonInterno = AREA_CLIENTES_URL ? { texto: 'Ver pedidos', url: AREA_CLIENTES_URL + '/gestion/pedidos.html' } : null;

  if (tipo === 'solicitud_factura') {
    if (!EMAIL_DESTINO) return responder({ error: 'PEDIDOS_EMAIL_DESTINO no configurado — no hay a quién avisar' }, 500);
    const html = construirEmailProfesional_(
      '<h2 style="margin:0 0 8px; font-size:19px;">Solicitud de copia de factura</h2>' +
      '<p style="margin:0 0 4px; color:#475569;"><strong>Cliente:</strong> ' + escapeHtml_(nombreCliente) + ' (' + escapeHtml_(emailCliente) + ')' +
      (empresaAnidada ? ' — ' + escapeHtml_(empresaAnidada) : '') + '</p>' +
      '<p style="margin:10px 0 0;">Pide la copia de la factura de su pedido' +
      ((propuesta as any).factura ? ' (nº de factura: <strong>' + escapeHtml_((propuesta as any).factura) + '</strong>)' : ' (todavía sin nº de factura registrado)') +
      '.</p>',
      botonInterno
    );
    const resultado = await enviarCorreoBrevo_(BREVO_API_KEY, remitente, listaDestinatarios_(EMAIL_DESTINO), 'Solicitud de copia de factura — ' + nombreCliente, html);
    return responder({ success: true, resultado });
  }

  // 'en_reparto' / 'entregada' — aviso al cliente (siempre se envía,
  // igual criterio que notificar-pedido: al email real o al de
  // pruebas según PEDIDOS_ACTIVAR_CLIENTES_REALES).
  const esEnReparto = tipo === 'en_reparto';
  const contenido = esEnReparto
    ? '<h2 style="margin:0 0 8px; font-size:19px;">Tu pedido está en camino</h2>' +
      '<p style="margin:0 0 4px; color:#475569;">Ya hemos preparado tu pedido y está en reparto.</p>' +
      '<p style="margin:10px 0 0;"><strong>Transportista:</strong> ' + escapeHtml_((propuesta as any).transportista || 'Reparto propio') +
      ((propuesta as any).numero_seguimiento ? '<br><strong>Nº de seguimiento:</strong> ' + escapeHtml_((propuesta as any).numero_seguimiento) : '') +
      '</p>'
    : '<h2 style="margin:0 0 8px; font-size:19px;">Tu pedido ha sido entregado</h2>' +
      '<p style="margin:0 0 4px; color:#475569;">Ya consta como entregado. Si falta algo o hay cualquier incidencia, contacta con tu comercial.</p>' +
      '<p style="margin:10px 0 0; color:#94a3b8; font-size:0.9em;">Puedes pedir la copia de la factura desde "Mis pedidos".</p>';

  const html = construirEmailProfesional_(contenido, botonCliente);
  const destinoCliente = (ACTIVAR_CLIENTES_REALES ? emailCliente : (EMAIL_PRUEBA_CLIENTE || '')).trim();
  if (!destinoCliente) {
    return responder({
      success: true,
      resultado: { ok: false, detalle: ACTIVAR_CLIENTES_REALES ? 'El cliente no tiene email en su perfil' : 'PEDIDOS_EMAIL_PRUEBA_CLIENTE no configurado' },
    });
  }
  const resultado = await enviarCorreoBrevo_(
    BREVO_API_KEY, remitente, [{ email: destinoCliente, name: ACTIVAR_CLIENTES_REALES ? nombreCliente : undefined }],
    esEnReparto ? 'Tu pedido está en camino — Orencio Matas y Hnos' : 'Tu pedido ha sido entregado — Orencio Matas y Hnos',
    html
  );
  return responder({ success: true, resultado });
});
