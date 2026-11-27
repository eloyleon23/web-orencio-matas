// Edge Function: envía el aviso por correo cuando un cliente envía un
// pedido (propuesta de pedido pasada a estado "recibida") desde
// propuesta.html.
//
// Separada A PROPÓSITO del envío de correo que ya usa Apps Script
// (BREVO_API_KEY/sender allí) — petición explícita de Eloy: "quiero
// que configuremos fácilmente lo del correo de envío de los
// pedidos, separado de lo que ya haya en otros flujos por si más
// adelante se cambia o se crea un correo dedicado aparte". Todo lo
// que hace falta tocar para cambiar cómo se notifica un pedido son
// los secretos de ESTA función (Supabase → Edge Functions → Secrets),
// nunca el código ni los secretos de GitHub Actions/Apps Script:
//
//   BREVO_API_KEY           Clave de Brevo — puede ser la misma cuenta
//                           que ya usa Apps Script, pero guardada aquí
//                           como secreto PROPIO de Supabase (no se
//                           comparten secretos entre plataformas).
//   PEDIDOS_EMAIL_REMITENTE Remitente del correo — tiene que ser una
//                           dirección verificada en Brevo (p. ej. la
//                           misma 'correo@orenciomatas.es' que ya usa
//                           Apps Script).
//   PEDIDOS_EMAIL_DESTINO   A quién llega el aviso interno del pedido
//                           (gestión/comercial). Admite varias
//                           direcciones separadas por comas. Mientras
//                           se están haciendo pruebas, aquí va el
//                           correo de quien está evaluando — el día
//                           que haya un correo dedicado a pedidos,
//                           basta con cambiar este secreto.
//   PEDIDOS_NOTIFICAR_CLIENTE  'true' para enviar TAMBIÉN una copia de
//                           confirmación al cliente real (su email de
//                           perfil). 'false' (o sin definir) = no se
//                           le envía nada al cliente todavía — útil
//                           mientras se prueba, para no mandar avisos
//                           a direcciones reales por error.
//   PEDIDOS_EMAIL_PRUEBA    Si está definido, la copia "para el
//                           cliente" (solo se envía si
//                           PEDIDOS_NOTIFICAR_CLIENTE=true) se manda
//                           aquí en vez de al email real del cliente —
//                           para poder probar ese flujo de principio a
//                           fin sin arriesgarse a avisar a un cliente
//                           real todavía.
//
// Un fallo al enviar el correo NUNCA deshace ni bloquea el envío del
// pedido (que ya ha quedado guardado en BBDD antes de llamar aquí) —
// como mucho responde con error para que el frontend lo registre, pero
// el pedido ya está recibido de todas formas.
//
// Despliegue: npx supabase functions deploy notificar-pedido

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

// Direcciones separadas por comas -> [{ email }, ...], para el campo
// "to" de Brevo. Se descartan vacíos (p. ej. si el secreto queda con
// una coma de más).
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

function formatearEuros_(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €';
}

// Texto de cantidad igual que window.textoCantidadLinea_ en
// propuesta-cliente.js — se mantiene la misma lógica aquí porque esta
// función corre en Deno, no en el navegador, y no puede compartir ese
// archivo directamente.
function textoCantidadLinea_(l: Record<string, unknown>): string {
  if (l.modo_compra === 'envase') {
    const numEnvases = Number(l.cantidad_envases) || 1;
    const tipo = String(l.envase_tipo || 'caja').trim();
    const tipoMostrado = numEnvases === 1 ? tipo : tipo.endsWith('s') ? tipo : tipo + 's';
    const base = numEnvases + ' ' + tipoMostrado;
    if (!l.envase_cantidad) return base;
    return base + ' (' + l.cantidad + ' ' + String(l.envase_unidad || 'unidades').trim() + ')';
  }
  return l.cantidad + ' unidad' + (Number(l.cantidad) === 1 ? '' : 'es');
}

function construirHtmlPedido_(
  nombreCliente: string,
  emailCliente: string,
  empresa: string | null,
  lineas: Record<string, unknown>[],
  total: number,
  paraCliente: boolean
): string {
  const filas = lineas
    .map((l) => {
      const precioConocido = l.precio_unitario !== null && l.precio_unitario !== undefined;
      const subtotal = precioConocido ? Number(l.precio_unitario) * Number(l.cantidad) : null;
      return (
        '<tr>' +
        '<td style="padding:6px 10px; border-bottom:1px solid #e2e8f0;">' + escapeHtml_(l.nombre) + '<br>' +
        '<span style="color:#64748b; font-size:0.85em;">Ref. ' + escapeHtml_(l.ref) + '</span></td>' +
        '<td style="padding:6px 10px; border-bottom:1px solid #e2e8f0;">' + escapeHtml_(textoCantidadLinea_(l)) + '</td>' +
        '<td style="padding:6px 10px; border-bottom:1px solid #e2e8f0; text-align:right;">' +
        (subtotal !== null ? formatearEuros_(subtotal) : '—') +
        '</td></tr>'
      );
    })
    .join('');

  const cabecera = paraCliente
    ? '<p>Hemos recibido tu pedido. Tu comercial se pondrá en contacto para confirmarlo.</p>'
    : '<p>Nuevo pedido recibido en el Área de Clientes.</p>' +
      '<p><strong>Cliente:</strong> ' + escapeHtml_(nombreCliente) + ' (' + escapeHtml_(emailCliente) + ')' +
      (empresa ? ' — ' + escapeHtml_(empresa) : '') + '</p>';

  return (
    '<div style="font-family:Arial,sans-serif; color:#1e293b;">' +
    cabecera +
    '<table style="border-collapse:collapse; width:100%; margin-top:10px;">' +
    '<thead><tr style="background:#f8fafc;">' +
    '<th style="padding:6px 10px; text-align:left;">Producto</th>' +
    '<th style="padding:6px 10px; text-align:left;">Cantidad</th>' +
    '<th style="padding:6px 10px; text-align:right;">Importe</th>' +
    '</tr></thead><tbody>' + filas + '</tbody>' +
    '<tfoot><tr><td colspan="2" style="padding:8px 10px; font-weight:bold;">Total (con IVA)</td>' +
    '<td style="padding:8px 10px; text-align:right; font-weight:bold;">' + formatearEuros_(total) + '</td></tr></tfoot>' +
    '</table>' +
    '<p style="color:#64748b; font-size:0.85em; margin-top:14px;">Los precios son orientativos — el pedido definitivo lo confirma tu comercial.</p>' +
    '</div>'
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECERAS_CORS });
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  const EMAIL_REMITENTE = Deno.env.get('PEDIDOS_EMAIL_REMITENTE');
  const EMAIL_DESTINO = Deno.env.get('PEDIDOS_EMAIL_DESTINO');
  const NOTIFICAR_CLIENTE = (Deno.env.get('PEDIDOS_NOTIFICAR_CLIENTE') || '').toLowerCase() === 'true';
  const EMAIL_PRUEBA = Deno.env.get('PEDIDOS_EMAIL_PRUEBA');

  if (!BREVO_API_KEY || !EMAIL_REMITENTE) {
    return responder({ error: 'Notificaciones de pedido no configuradas (faltan secretos BREVO_API_KEY/PEDIDOS_EMAIL_REMITENTE en esta función)' }, 500);
  }

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return responder({ error: 'Falta autenticación' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: datosUsuario, error: errorToken } = await admin.auth.getUser(token);
  if (errorToken || !datosUsuario?.user) return responder({ error: 'Sesión no válida' }, 401);
  const clienteId = datosUsuario.user.id;

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: 'JSON inválido' }, 400);
  }
  const propuestaId = String(cuerpo.propuesta_id || '').trim();
  if (!propuestaId) return responder({ error: 'Falta propuesta_id' }, 400);

  // Ownership + que de verdad esté "recibida" — nunca se notifica un
  // borrador ajeno ni uno que todavía no se ha enviado de verdad.
  const { data: propuesta, error: errorPropuesta } = await admin
    .from('propuestas_pedido')
    .select('id, cliente_id, estado, clientes(empresa, profiles!clientes_id_fkey(nombre, apellidos, email))')
    .eq('id', propuestaId)
    .eq('cliente_id', clienteId)
    .eq('estado', 'recibida')
    .maybeSingle();

  if (errorPropuesta || !propuesta) {
    return responder({ error: 'Pedido no encontrado, no es tuyo, o todavía no está enviado' }, 404);
  }

  const { data: lineas, error: errorLineas } = await admin
    .from('propuesta_pedido_lineas')
    .select('ref, nombre, cantidad, precio_unitario, modo_compra, cantidad_envases, envase_cantidad, envase_unidad, envase_tipo')
    .eq('propuesta_id', propuestaId);
  if (errorLineas) return responder({ error: errorLineas.message }, 500);

  const total = (lineas || []).reduce((acc, l) => {
    return acc + (l.precio_unitario !== null ? Number(l.precio_unitario) * Number(l.cantidad) : 0);
  }, 0);

  // Estructura anidada de PostgREST: "clientes" (y dentro, "profiles")
  // puede llegar como objeto o como array de 1 elemento según la
  // relación — se desempaqueta aquí para no repetirlo abajo.
  const clienteAnidado = Array.isArray((propuesta as any).clientes) ? (propuesta as any).clientes[0] : (propuesta as any).clientes;
  const profileAnidado = clienteAnidado && Array.isArray(clienteAnidado.profiles) ? clienteAnidado.profiles[0] : clienteAnidado?.profiles;
  const empresaAnidada = clienteAnidado?.empresa;

  const nombreCliente = [profileAnidado?.nombre, profileAnidado?.apellidos].filter(Boolean).join(' ') || '(sin nombre)';
  const emailCliente = profileAnidado?.email || '';

  const remitente = { name: 'Orencio Matas y Hnos — Área de Clientes', email: EMAIL_REMITENTE };
  const resultados: Record<string, unknown> = {};

  if (EMAIL_DESTINO) {
    const asuntoInterno = 'Nuevo pedido — ' + nombreCliente + (empresaAnidada ? ' (' + empresaAnidada + ')' : '');
    const htmlInterno = construirHtmlPedido_(nombreCliente, emailCliente, empresaAnidada || null, lineas || [], total, false);
    resultados.interno = await enviarCorreoBrevo_(BREVO_API_KEY, remitente, listaDestinatarios_(EMAIL_DESTINO), asuntoInterno, htmlInterno);
  } else {
    resultados.interno = { ok: false, detalle: 'PEDIDOS_EMAIL_DESTINO no configurado' };
  }

  if (NOTIFICAR_CLIENTE) {
    const destinoCliente = (EMAIL_PRUEBA || emailCliente || '').trim();
    if (destinoCliente) {
      const htmlCliente = construirHtmlPedido_(nombreCliente, emailCliente, empresaAnidada || null, lineas || [], total, true);
      resultados.cliente = await enviarCorreoBrevo_(
        BREVO_API_KEY, remitente, [{ email: destinoCliente, name: EMAIL_PRUEBA ? undefined : nombreCliente }],
        'Hemos recibido tu pedido — Orencio Matas y Hnos', htmlCliente
      );
    } else {
      resultados.cliente = { ok: false, detalle: 'Sin email de cliente ni PEDIDOS_EMAIL_PRUEBA' };
    }
  }

  return responder({ success: true, resultados });
});
