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
        .select('id, ref, nombre, cantidad, precio_unitario, creado_en')
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

// Fija la cantidad EXACTA de una referencia en la propuesta (no un
// incremento) — cantidad <= 0 borra la línea. "producto" trae la foto
// de nombre/precio que verá el pedido para siempre, aunque el catálogo
// cambie después.
window.establecerCantidadLinea_ = async function (propuestaId, producto, cantidad) {
    const cliente = window.obtenerClienteSupabase_();
    if (cantidad <= 0) {
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
            cantidad: cantidad,
        }, { onConflict: 'propuesta_id,ref' });
    return { error: error ? error.message : null };
};

// Suma "cantidadAñadir" a lo que ya hubiera de esa referencia (0 si no
// había línea todavía) — usado por el botón "Añadir al pedido" del
// catálogo, que es acumulativo (pulsar varias veces suma, no reemplaza).
window.incrementarCantidadLinea_ = async function (propuestaId, producto, cantidadAñadir) {
    const cliente = window.obtenerClienteSupabase_();
    const { data: actual } = await cliente
        .from('propuesta_pedido_lineas')
        .select('cantidad')
        .eq('propuesta_id', propuestaId)
        .eq('ref', producto.ref)
        .maybeSingle();
    const nuevaCantidad = (actual ? Number(actual.cantidad) : 0) + cantidadAñadir;
    return window.establecerCantidadLinea_(propuestaId, producto, nuevaCantidad);
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

// Historial completo del cliente (para "Mis pedidos"), con el total de
// líneas y el importe ya calculado — todo en una sola consulta anidada
// en vez de una petición por pedido.
window.listarPropuestasCliente_ = async function () {
    const cliente = window.obtenerClienteSupabase_();
    const { data, error } = await cliente
        .from('propuestas_pedido')
        .select('id, estado, notas, creado_en, actualizado_en, enviado_en, propuesta_pedido_lineas(ref, nombre, cantidad, precio_unitario)')
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
                return { propuesta_id: borrador.id, ref: l.ref, nombre: l.nombre, cantidad: l.cantidad, precio_unitario: l.precio_unitario };
            }));
        if (errorInsert) return { error: errorInsert.message };
    }
    return { data: borrador };
};
