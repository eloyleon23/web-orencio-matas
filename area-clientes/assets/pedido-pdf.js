// Genera el PDF de un pedido (para descargar o compartir) — usado
// desde area-clientes/gestion/pedidos.html. Necesita jsPDF cargado
// antes que este script (ver el <script> de jspdf en la página).
//
// "pedido" es uno de los objetos ya preparados en pedidos.html (con
// clienteNombre/clienteEmpresa/clienteCrm/lineas/etc. ya calculados),
// no la fila cruda de Supabase.

window.generarPedidoPdf_ = async function (pedido, estadoLabel) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margen = 40;
    let y = margen;
    const anchoUtil = doc.internal.pageSize.getWidth() - margen * 2;

    function formatearEuros_(n) { return Number(n).toFixed(2).replace('.', ',') + ' €'; }
    function formatearFecha_(valor) {
        if (!valor) return '—';
        const f = new Date(valor);
        return f.toLocaleDateString('es-ES') + ' ' + f.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    function saltoDePaginaSiHaceFalta_(alturaNecesaria) {
        if (y + alturaNecesaria > doc.internal.pageSize.getHeight() - margen) {
            doc.addPage();
            y = margen;
        }
    }

    // Logo del propio sitio (misma ruta que usa la barra de navegación
    // del área de clientes) — del mismo origen que la página, así que
    // nunca choca con CORS como pasaría con el dominio público. Si aun
    // así falla por lo que sea, el PDF se genera igual, solo sin logo
    // — nunca debe bloquear la descarga.
    const alturaLogo = 32;
    let anchoLogo = 0; // 0 si no hay logo — el texto de cabecera se pega al margen
    try {
        const { dataUrl, anchoNatural, altoNatural } = await new Promise(function (resolve, reject) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.getContext('2d').drawImage(img, 0, 0);
                resolve({ dataUrl: canvas.toDataURL('image/png'), anchoNatural: img.naturalWidth, altoNatural: img.naturalHeight });
            };
            img.onerror = reject;
            // Se reutiliza la URL ya resuelta por el navegador del logo
            // que hay en la propia barra de navegación de la página —
            // así este archivo no tiene que adivinar cuántos "../" hacen
            // falta según desde qué página se llame.
            const logoEnNavbar = document.querySelector('.navbar-om__logo');
            img.src = logoEnNavbar ? logoEnNavbar.currentSrc || logoEnNavbar.src : 'assets/logo-orencio.png';
        });
        // Mantener SIEMPRE la proporción real del logo (202×86 — no es
        // cuadrado) para no deformarlo.
        anchoLogo = alturaLogo * (anchoNatural / altoNatural);
        doc.addImage(dataUrl, 'PNG', margen, y, anchoLogo, alturaLogo);
    } catch (e) { /* sin logo, no pasa nada */ }

    const inicioTextoCabecera = margen + (anchoLogo ? anchoLogo + 14 : 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Orencio Matas y Hnos, S.L.', inicioTextoCabecera, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Pedido del área de clientes', inicioTextoCabecera, y + 30);
    y += Math.max(alturaLogo, 40) + 16;

    doc.setDrawColor(220, 220, 220);
    doc.line(margen, y, margen + anchoUtil, y);
    y += 20;

    doc.setFontSize(10);
    const filasCabecera = [
        ['Nº de pedido', pedido.id],
        ['Fecha', formatearFecha_(pedido.enviado_en || pedido.creado_en)],
        ['Estado', estadoLabel || pedido.estado],
        ['Cliente', pedido.clienteNombre + (pedido.clienteEmpresa ? ' — ' + pedido.clienteEmpresa : '')],
        ['Email', pedido.clienteEmail || '—'],
        ['ID CRM/Sage', pedido.clienteCrm || '—'],
        ['Comercial', pedido.comercialNombre || '—'],
    ];
    filasCabecera.forEach(function (fila) {
        doc.setFont('helvetica', 'bold');
        doc.text(fila[0] + ':', margen, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(fila[1]), margen + 110, y);
        y += 16;
    });
    y += 4;

    if (pedido.notas) {
        saltoDePaginaSiHaceFalta_(40);
        doc.setFont('helvetica', 'bold');
        doc.text('Instrucciones generales:', margen, y);
        y += 14;
        doc.setFont('helvetica', 'normal');
        const lineasNotas = doc.splitTextToSize(pedido.notas, anchoUtil);
        doc.text(lineasNotas, margen, y);
        y += lineasNotas.length * 13 + 10;
    }

    saltoDePaginaSiHaceFalta_(30);
    doc.setDrawColor(220, 220, 220);
    doc.line(margen, y, margen + anchoUtil, y);
    y += 18;

    doc.setFont('helvetica', 'bold');
    doc.text('Producto', margen, y);
    doc.text('Cant.', margen + 320, y);
    doc.text('Precio', margen + 380, y);
    doc.text('Subtotal', margen + 450, y);
    y += 6;
    doc.line(margen, y, margen + anchoUtil, y);
    y += 14;
    doc.setFont('helvetica', 'normal');

    (pedido.lineas || []).forEach(function (l) {
        saltoDePaginaSiHaceFalta_(40);
        const haySubtotal = l.precio_unitario !== null && l.precio_unitario !== undefined;
        const subtotal = haySubtotal ? Number(l.precio_unitario) * Number(l.cantidad) : null;
        const textoCantidad = window.textoCantidadLinea_ ? window.textoCantidadLinea_(l) : (l.cantidad + ' ud.');
        const nombreLineas = doc.splitTextToSize(l.nombre + ' (Ref. ' + l.ref + ')', 300);
        doc.text(nombreLineas, margen, y);
        doc.text(textoCantidad, margen + 320, y);
        doc.text(haySubtotal ? formatearEuros_(l.precio_unitario) : '—', margen + 380, y);
        doc.text(subtotal !== null ? formatearEuros_(subtotal) : '—', margen + 450, y);
        y += nombreLineas.length * 13;
        const rectificada = l.cantidad_confirmada !== null && l.cantidad_confirmada !== undefined && Number(l.cantidad_confirmada) !== Number(l.cantidad);
        if (l.notas) {
            doc.setFontSize(9);
            const notaLineas = doc.splitTextToSize('↳ Nota: ' + l.notas, anchoUtil - 10);
            doc.text(notaLineas, margen + 10, y);
            y += notaLineas.length * 11;
            doc.setFontSize(10);
        }
        if (rectificada) {
            doc.setFontSize(9);
            doc.setTextColor(180, 40, 40);
            const motivoTexto = '⚠ Rectificado a ' + l.cantidad_confirmada + ' (pedido: ' + l.cantidad + ')' + (l.motivo_rectificacion ? ' — ' + l.motivo_rectificacion : '');
            const motivoLineas = doc.splitTextToSize(motivoTexto, anchoUtil - 10);
            doc.text(motivoLineas, margen + 10, y);
            y += motivoLineas.length * 11;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
        }
        y += 6;
    });

    saltoDePaginaSiHaceFalta_(30);
    doc.line(margen, y, margen + anchoUtil, y);
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total', margen + 380, y);
    doc.text(formatearEuros_(pedido.totalImporte), margen + 450, y);
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (pedido.transportista) {
        saltoDePaginaSiHaceFalta_(20);
        doc.text('Envío: ' + pedido.transportista + (pedido.numero_seguimiento ? ' — nº de seguimiento: ' + pedido.numero_seguimiento : ''), margen, y);
    }

    return doc;
};
