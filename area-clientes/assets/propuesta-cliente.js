// Acceso a datos de "propuestas de pedido" (Fase 4 del Área de
// Clientes) — compartido entre catalogo.html (añadir al pedido),
// propuesta.html (ver/editar el borrador actual) y mis-pedidos.html
// (historial + "reutilizar este pedido"). Toda la lógica de negocio
// vive aquí UNA sola vez para que las tres páginas se comporten igual.
//
// Solo dos estados por ahora: 'borrador' (editable, descartable) y
// 'recibida' (ya enviado, de solo lectura para el cliente) — ver
// supabase/area_clientes_schema_fase4.sql. La máquina de estados
// completa de gestión interna es Fase 5.

// Devuelve el borrador actual del cliente autenticado, creándolo si
// todavía no tiene ninguno (nunca hay más de un borrador a la vez por
// cliente — es "el carrito", no una lista de borradores sueltos).
window.obtenerOCrearBorradorPropuesta_ = async function () {
    const cliente = window.obtenerClienteSupabase_();
    const { data: sesion } = await cliente.auth.getSession();
    if (!sesion.session) return { error: 'Sesión no válida.' };
    const clienteId = sesion.session.user.id;

    const { data: existente, error: errorBusqueda } = await cliente
        .from('propuestas_pedido')
        .select('id, estado, notas, creado_en, actualizado_en')
        .eq('cliente_id', clienteId)
        .eq('estado', 'borrador')
        .limit(1)
        .maybeSingle();

    if (errorBusqueda) return { error: errorBusqueda.message };
    if (existente) return { data: existente };

    const { data: creado, error: errorCrear } = await cliente
        .from('propuestas_pedido')
        .insert({ cliente_id: clienteId, estado: 'borrador' })
        .select('id, estado, notas, creado_en, actualizado_en')
        .single();

    if (errorCrear) return { error: errorCrear.message };
    return { data: creado };
};

window.obtenerLineasPropuesta_ = async function (propuestaId) {
    const cliente = window.obtenerClienteSupabase_();
    const { data, error } = await cliente
        .from('propuesta_pedido_lineas')
        .select('id, ref, nombre, cantidad, precio_unitario, modo_compra, cantidad_envases, envase_cantidad, envase_unidad, envase_tipo, creado_en')
        .eq('propuesta_id', propuestaId)
        .order('creado_en', { ascending: true });
    if (error) return { error: error.message };
    return { data: data || [] };
};

// Número de líneas del borrador actual — para el contador del botón
// flotante "Mi pedido" en catalogo.html. Solo pide la columna "id" (no
// hace falta más para contar), así que el coste de red es mínimo
// aunque no se use "head: true" + cabecera Content-Range.
window.contarLineasBorrador_ = async function (propuestaId) {
    if (!propuestaId) return 0;
    const cliente = window.obtenerClienteSupabase_();
    const { data, error } = await cliente
        .from('propuesta_pedido_lineas')
        .select('id')
        .eq('propuesta_id', propuestaId);
    if (error) return 0;
    return (data || []).length;
};

// Cuántas unidades sueltas hay realmente en "cantidadEnvases" cajas de
// este producto — igual que envaseCantidadValida_ en la web pública:
// si el producto no tiene formato de envase informado, el número de
// cajas que escriba el cliente se usa TAL CUAL como cantidad real, sin
// inventar una equivalencia que no se conoce.
function unidadesDesdeEnvases_(producto, cantidadEnvases) {
    const porEnvase = (producto.envase_cantidad && Number(producto.envase_cantidad) > 0) ? Number(producto.envase_cantidad) : 1;
    return cantidadEnvases * porEnvase;
}

// Fija la cantidad EXACTA de una referencia en la propuesta (no un
// incremento) — cantidadTotalUnidades <= 0 borra la línea. "producto"
// trae la foto de nombre/precio/formato de envase que verá el pedido
// para siempre, aunque el catálogo cambie después. "cantidadTotalUnidades"
// es SIEMPRE el total en unidades sueltas (lo único que hace falta
// para el precio) — modoCompra/cantidadEnvases son solo para poder
// MOSTRAR y volver a editar cómo se pidió (igual que la "lista de la
// compra" de la web pública: unidades sueltas o por caja/envase).
window.establecerCantidadLinea_ = async function (propuestaId, producto, cantidadTotalUnidades, modoCompra, cantidadEnvases) {
    const cliente = window.obtenerClienteSupabase_();
    if (cantidadTotalUnidades <= 0) {
        const { error } = await cliente
            .from('propuesta_pedido_lineas')
            .delete()
            .eq('propuesta_id', propuestaId)
            .eq('ref', producto.ref);
        return { error: error ? error.message : null };
    }
    const { error } = await cliente
        .from('propuesta_pedido_lineas')
        .upsert({
            propuesta_id: propuestaId,
            ref: producto.ref,
            nombre: producto.nombre,
            precio_unitario: producto.precio_unitario,
            cantidad: cantidadTotalUnidades,
            modo_compra: modoCompra || 'unidad',
            cantidad_envases: (modoCompra === 'envase') ? cantidadEnvases : null,
            envase_cantidad: producto.envase_cantidad || null,
            envase_unidad: producto.envase_unidad || null,
            envase_tipo: producto.envase_tipo || null,
        }, { onConflict: 'propuesta_id,ref' });
    return { error: error ? error.message : null };
};

// Suma "cantidadAñadir" (unidades sueltas o cajas, según "modoCompra")
// a lo que ya hubiera de esa referencia — usado por el botón "Añadir
// al pedido" del catálogo, que es acumulativo (pulsar varias veces
// suma, no reemplaza). Si la línea ya existía en OTRO modo de compra,
// no se mezcla (sueltas + cajas no da un número exacto, igual que en
// la web pública): se sustituye por la cantidad nueva, en el modo
// nuevo, sin intentar traducir la anterior.
window.incrementarCantidadLinea_ = async function (propuestaId, producto, cantidadAñadir, modoCompra) {
    modoCompra = modoCompra || 'unidad';
    const cliente = window.obtenerClienteSupabase_();
    const { data: actual } = await cliente
        .from('propuesta_pedido_lineas')
        .select('cantidad, modo_compra, cantidad_envases')
        .eq('propuesta_id', propuestaId)
        .eq('ref', producto.ref)
        .maybeSingle();

    const mismoModo = actual && actual.modo_compra === modoCompra;
    if (modoCompra === 'envase') {
        const envasesPrevios = mismoModo ? Number(actual.cantidad_envases || 0) : 0;
        const envasesFinal = envasesPrevios + cantidadAñadir;
        return window.establecerCantidadLinea_(propuestaId, producto, unidadesDesdeEnvases_(producto, envasesFinal), 'envase', envasesFinal);
    }
    const unidadesPrevias = mismoModo ? Number(actual.cantidad || 0) : 0;
    return window.establecerCantidadLinea_(propuestaId, producto, unidadesPrevias + cantidadAñadir, 'unidad', null);
};

window.eliminarLineaPorId_ = async function (lineaId) {
    const cliente = window.obtenerClienteSupabase_();
    const { error } = await cliente.from('propuesta_pedido_lineas').delete().eq('id', lineaId);
    return { error: error ? error.message : null };
};

window.vaciarPropuesta_ = async function (propuestaId) {
    const cliente = window.obtenerClienteSupabase_();
    const { error } = await cliente.from('propuesta_pedido_lineas').delete().eq('propuesta_id', propuestaId);
    return { error: error ? error.message : null };
};

// Envía el pedido: pasa de 'borrador' a 'recibida'. A partir de aquí es
// de solo lectura para el cliente (RLS ya no deja más UPDATE/DELETE).
window.enviarPropuesta_ = async function (propuestaId) {
    const cliente = window.obtenerClienteSupabase_();
    const { error } = await cliente
        .from('propuestas_pedido')
        .update({ estado: 'recibida', enviado_en: new Date().toISOString() })
        .eq('id', propuestaId);
    return { error: error ? error.message : null };
};

// Aviso por correo de que se ha recibido el pedido — Edge Function
// aparte (notificar-pedido), con su propia configuración de
// remitente/destino en Supabase, deliberadamente independiente de
// cualquier otro envío de correo del proyecto (ver comentario al
// principio de supabase/functions/notificar-pedido/index.ts). Un
// fallo aquí NUNCA deshace el pedido — ya quedó guardado en BBDD antes
// de llamar a esto — así que solo se informa, nunca se bloquea nada.
window.notificarPedidoPorCorreo_ = async function (propuestaId) {
    try {
        const cliente = window.obtenerClienteSupabase_();
        const { data: sesion } = await cliente.auth.getSession();
        if (!sesion.session) return { error: 'Sin sesión' };
        const resp = await fetch(window.SUPABASE_URL + '/functions/v1/notificar-pedido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sesion.session.access_token },
            body: JSON.stringify({ propuesta_id: propuestaId }),
        });
        const json = await resp.json().catch(function () { return {}; });
        if (!resp.ok) return { error: json.error || ('HTTP ' + resp.status) };
        return { data: json };
    } catch (e) {
        return { error: e && e.message };
    }
};

// Historial completo del cliente (para "Mis pedidos"), con el total de
// líneas y el importe ya calculado — todo en una sola consulta anidada
// en vez de una petición por pedido.
window.listarPropuestasCliente_ = async function () {
    const cliente = window.obtenerClienteSupabase_();
    const { data, error } = await cliente
        .from('propuestas_pedido')
        .select('id, estado, notas, creado_en, actualizado_en, enviado_en, propuesta_pedido_lineas(ref, nombre, cantidad, precio_unitario, modo_compra, cantidad_envases, envase_cantidad, envase_unidad, envase_tipo)')
        .order('creado_en', { ascending: false });
    if (error) return { error: error.message };
    return {
        data: (data || []).map(function (p) {
            const lineas = p.propuesta_pedido_lineas || [];
            const totalUnidades = lineas.reduce(function (acc, l) { return acc + Number(l.cantidad); }, 0);
            const totalImporte = lineas.reduce(function (acc, l) {
                return acc + (l.precio_unitario !== null ? Number(l.cantidad) * Number(l.precio_unitario) : 0);
            }, 0);
            return Object.assign({}, p, { lineas: lineas, totalUnidades: totalUnidades, totalImporte: totalImporte });
        }),
    };
};

// Texto de cantidad a mostrar para una línea — igual criterio que la
// "lista de la compra" de la web pública (listaCompraTextoCantidad_):
// "3 cajas (36 unidades)" en modo envase CON formato de envase
// conocido, "3 cajas" a secas sin formato conocido (no hay
// equivalencia real que mostrar), o simplemente "5 unidades" en modo
// suelto.
window.textoCantidadLinea_ = function (l) {
    if (l.modo_compra === 'envase') {
        const numEnvases = l.cantidad_envases || 1;
        const tipo = (l.envase_tipo || 'caja').trim();
        const tipoMostrado = numEnvases === 1 ? tipo : (tipo.endsWith('s') ? tipo : tipo + 's');
        const base = numEnvases + ' ' + tipoMostrado;
        if (!l.envase_cantidad) return base;
        return base + ' (' + l.cantidad + ' ' + (l.envase_unidad || 'unidades').trim() + ')';
    }
    return l.cantidad + ' unidad' + (Number(l.cantidad) === 1 ? '' : 'es');
};

// "Reutilizar pedido anterior como base": vacía el borrador actual (si
// tenía algo) y copia en él las líneas del pedido de origen — el
// cliente sigue luego editando ese borrador con normalidad (quitar/
// añadir/cambiar cantidades) antes de volver a enviarlo.
window.duplicarPropuestaComoBorrador_ = async function (propuestaIdOrigen) {
    const { data: origenLineas, error: errorOrigen } = await window.obtenerLineasPropuesta_(propuestaIdOrigen);
    if (errorOrigen) return { error: errorOrigen };

    const { data: borrador, error: errorBorrador } = await window.obtenerOCrearBorradorPropuesta_();
    if (errorBorrador) return { error: errorBorrador };

    const vaciado = await window.vaciarPropuesta_(borrador.id);
    if (vaciado.error) return { error: vaciado.error };

    const cliente = window.obtenerClienteSupabase_();
    if (origenLineas.length) {
        const { error: errorInsert } = await cliente
            .from('propuesta_pedido_lineas')
            .insert(origenLineas.map(function (l) {
                return {
                    propuesta_id: borrador.id, ref: l.ref, nombre: l.nombre, cantidad: l.cantidad, precio_unitario: l.precio_unitario,
                    modo_compra: l.modo_compra, cantidad_envases: l.cantidad_envases,
                    envase_cantidad: l.envase_cantidad, envase_unidad: l.envase_unidad, envase_tipo: l.envase_tipo,
                };
            }));
        if (errorInsert) return { error: errorInsert.message };
    }
    return { data: borrador };
};
