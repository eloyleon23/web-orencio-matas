// Se activa solo cuando se llega desde la página Profesionales
// (enlaces con ?origen=profesionales) — en cualquier otro caso no hace
// nada, así que es seguro incluirlo en cualquier página sin afectar al
// comportamiento normal. Todo dentro de DOMContentLoaded para que
// funcione igual si el <script> se carga en <head> o al final del
// <body>, según la página.
(function () {
  const params = new URLSearchParams(window.location.search);
  const vieneDeProfesionales = params.get('origen') === 'profesionales';

  // ── Propagar el origen a lo largo de toda la cadena de navegación ──
  // catalogo_X.html → "ver completo" → visor_catalogo.html → "Volver" →
  // catalogo_X.html: los tres enlaces se construyen por JS de forma
  // dinámica (tras cargar datos del catálogo de forma asíncrona), así
  // que no basta con fijar el href una sola vez al cargar la página —
  // para cuando se pulsa, el propio script de la página puede haber
  // vuelto a pisarlo. Se intercepta el clic en su lugar y se añade
  // ?origen=profesionales en ese momento, siempre que la página actual
  // ya lo tuviera.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const actual = new URLSearchParams(window.location.search);
    if (actual.get('origen') !== 'profesionales') return;
    if (!/visor_catalogo\.html|catalogo_\w+\.html/.test(link.getAttribute('href') || '')) return;
    if (link.href.includes('origen=profesionales')) return;

    e.preventDefault();
    const url = new URL(link.href, window.location.href);
    url.searchParams.set('origen', 'profesionales');
    window.location.href = url.toString();
  });

  if (!vieneDeProfesionales) return;

  function iniciar() {
    // 1) Si la página tiene el botón "Volver a Productos" de los
    // catálogos (catalogo_*.html), lo redirige a Profesionales en vez
    // de a Productos, ya que fue el punto de partida real del usuario.
    // (El "Volver" del visor_catalogo.html, #btn-volver, no se toca
    // aquí: ya vuelve correctamente al catálogo de área gracias al
    // listener de clic de arriba, que además le añade el origen).
    const btnVolver = document.querySelector('.btn-back-home');
    if (btnVolver) {
      btnVolver.setAttribute('href', 'profesionales.html?origen=profesionales');
      btnVolver.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Volver';
    }

    // 2) Aviso de precios al público, cerrable — solo aparece viniendo
    // de Profesionales. Mismo estilo visual que el aviso ya existente
    // en el buscador ("Los precios pueden variar y este producto está
    // sujeto a disponibilidad...", clase .catalog-disclaimer: tarjeta
    // normal dentro del flujo, con borde de color a la izquierda, NO
    // position:fixed) pero en azul en vez de ámbar, para no
    // confundirlo visualmente con ese otro aviso.
    //
    // No debe aparecer en el visor de catálogo (la vista a pantalla
    // completa del PDF): ahí no hay ni filtros ni resultados a los que
    // referirse, así que el aviso no aporta nada y solo restaría
    // espacio a la vista del documento.
    if (document.querySelector('.visor-header, #visor-iframe')) return;

    if (document.getElementById('aviso-precios-publico')) return;

    const aviso = document.createElement('div');
    aviso.id = 'aviso-precios-publico';
    aviso.setAttribute('role', 'status');
    aviso.style.cssText = 'background:#eff6ff;border-left:4px solid #006dae;color:#1e3a5f;'
      + 'padding:8px 14px;margin-bottom:12px;border-radius:8px;font-size:0.8rem;line-height:1.4;'
      + 'display:flex;align-items:flex-start;gap:8px;';
    aviso.innerHTML =
      '<span style="flex:1;min-width:0;"><i class="fa-solid fa-circle-info" style="color:#006dae;margin-right:6px;"></i>'
      + 'Los precios indicados son de venta al público. Consulta los precios al por mayor con nuestro equipo.</span>'
      + '<button type="button" id="cerrar-aviso-precios" aria-label="Ocultar este aviso" title="Ocultar este aviso" '
      + 'style="flex-shrink:0;background:none;border:none;color:#006dae;opacity:0.6;'
      + 'cursor:pointer;padding:2px 4px;font-size:0.85rem;line-height:1;">'
      + '<i class="fa-solid fa-xmark"></i></button>';

    // Dónde insertarlo, en orden de preferencia:
    // a) Junto al aviso ámbar ya existente (#catalog-disclaimer, solo
    //    en buscador.html) — mismo sitio, mismo tipo de mensaje, sin
    //    tener que inventar una ubicación nueva.
    // b) Dentro del contenedor real con el padding horizontal del
    //    contenido (los 4 catalogo_*.html): en 3 de los 4, ese
    //    contenedor ES <main> (clase .catalog-container, con su propio
    //    padding); en catalogo_talleres.html, en cambio, <main> solo
    //    tiene padding-top y el padding horizontal real vive en un
    //    <div> interior — insertar directamente en <main> ahí dejaba
    //    el aviso sin margen izquierdo/derecho, a ancho completo. Se
    //    comprueba el padding-left YA COMPUTADO de <main> para elegir
    //    el destino correcto sin necesitar conocer de antemano la
    //    estructura exacta de cada página.
    // c) Si no hay ninguna de las anteriores, al principio del <body>
    //    como último recurso.
    const disclaimerExistente = document.getElementById('catalog-disclaimer');
    const main = document.querySelector('main');
    if (disclaimerExistente && disclaimerExistente.parentElement) {
      disclaimerExistente.insertAdjacentElement('beforebegin', aviso);
    } else if (main) {
      const padIzq = parseFloat(getComputedStyle(main).paddingLeft) || 0;
      const destino = padIzq >= 10 ? main : (main.querySelector(':scope > div') || main);
      destino.insertAdjacentElement('afterbegin', aviso);
    } else {
      document.body.insertAdjacentElement('afterbegin', aviso);
    }

    document.getElementById('cerrar-aviso-precios').addEventListener('click', () => aviso.remove());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
