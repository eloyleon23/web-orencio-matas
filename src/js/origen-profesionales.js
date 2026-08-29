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
    // A propósito ya NO es position:fixed (como en la versión
    // anterior): un aviso fijo, aunque se calculara para no tapar la
    // cabecera, sí podía tapar la barra de filtros del buscador en
    // móvil (que también se reposiciona de forma fija bajo la
    // cabecera). Al insertarlo como una tarjeta normal justo debajo de
    // la cabecera, empuja el contenido hacia abajo en vez de
    // superponerse — el usuario ve los filtros aunque no cierre el
    // aviso.
    if (document.getElementById('aviso-precios-publico')) return;

    const aviso = document.createElement('div');
    aviso.id = 'aviso-precios-publico';
    aviso.setAttribute('role', 'status');
    aviso.style.cssText = 'background:#eff6ff;border-left:4px solid #006dae;color:#1e3a5f;'
      + 'padding:10px 16px;margin:0;font-size:0.85rem;line-height:1.4;'
      + 'display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;justify-content:center;';
    aviso.innerHTML =
      '<span style="flex:1;min-width:200px;"><i class="fa-solid fa-circle-info" style="color:#006dae;margin-right:8px;"></i>'
      + 'Los precios indicados son de venta al público. Consulta los precios al por mayor con nuestro equipo.</span>'
      + '<button type="button" id="cerrar-aviso-precios" aria-label="Cerrar aviso" '
      + 'style="flex-shrink:0;background:none;border:none;color:#006dae;opacity:0.7;'
      + 'cursor:pointer;padding:2px 6px;font-size:0.95rem;line-height:1;">✕</button>';

    // Insertarlo justo después de la cabecera fija de la página (si la
    // hay), como elemento normal del flujo — nunca como overlay. En
    // buscador.html, en móvil, la barra de búsqueda superior
    // (#grupo-buscador-principal) también es position:fixed a esa
    // misma altura — el aviso puede quedar visualmente justo debajo de
    // ella un instante mientras la página está en la posición de
    // scroll inicial, pero al no ser tampoco position:fixed, basta con
    // desplazarse un poco para que quede plenamente visible y, sobre
    // todo, el panel de filtros de más abajo (que sí es contenido
    // normal, no fijo) nunca queda bloqueado.
    // Insertarlo como elemento normal del flujo (nunca como overlay) al
    // principio del body, y calcular un margen superior igual a la
    // altura combinada de TODOS los elementos position:fixed anclados
    // arriba (cabecera + barra de búsqueda superior de buscador.html en
    // móvil, si la hay) — un elemento position:fixed no empuja a sus
    // hermanos en el flujo normal aunque se inserte justo "después" de
    // él en el DOM, así que insertarlo sin más dejaba el aviso debajo
    // de la cabecera (y en buscador.html, además debajo de la barra de
    // búsqueda) en vez de a continuación visualmente.
    document.body.insertAdjacentElement('afterbegin', aviso);

    let margenSuperior = 0;
    document.querySelectorAll('.main-header, .site-header, .navbar-wrapper, #grupo-buscador-principal').forEach((el) => {
      if (el === aviso) return;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'sticky') {
        margenSuperior += el.getBoundingClientRect().height;
      }
    });
    if (margenSuperior > 0) aviso.style.marginTop = margenSuperior + 'px';

    document.getElementById('cerrar-aviso-precios').addEventListener('click', () => aviso.remove());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
