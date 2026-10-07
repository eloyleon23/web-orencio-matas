// ── Disponibilidad de la IA (cuota de Gemini) ───────────────────────────
//
// A petición expresa de Eloy, tras un caso real de "ha habido un
// problema técnico" frecuente al probar la IA: "prefiero no dar la
// opción [de buscar con IA] cuando no hay cuota que darla y que falle".
//
// Comparte el MISMO circuito que ya vive en Apps Script
// (marcarCuotaIAAgotada_/cuotaIADisponible_, ver scripts/
// apps_script_trigger.js junto a GEMINI_API_KEY): este módulo solo hace
// una comprobación RÁPIDA (accion=estado_ia, nunca llama a Gemini) antes
// de que cada página decida si ofrece o no un botón de IA.
//
// Compartido entre buscador.html, centro-soluciones.html y
// soluciones/solucion.html|solucion-ia.html — todas ya cargan
// window.GOOGLE_APPS_SCRIPT_URL, así que basta con añadir este script
// pequeño, sin más dependencias.
(function () {
  const INTERVALO_RECOMPROBAR_MS = 3 * 60 * 1000; // 3 minutos

  // Optimista hasta la primera comprobación real — nunca se bloquea el
  // botón de IA mientras se espera esa primera respuesta (sería peor
  // ocultarlo de más que, en el peor caso, ofrecerlo una vez de más
  // mientras llega la primera comprobación).
  let disponible = true;
  let comprobando = null;

  function comprobar() {
    const url = window.GOOGLE_APPS_SCRIPT_URL;
    if (!url) return Promise.resolve(disponible);
    if (comprobando) return comprobando;
    comprobando = fetch(url + '?accion=estado_ia&_ts=' + Date.now(), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.disponible === 'boolean') disponible = d.disponible;
        return disponible;
      })
      .catch(() => disponible) // fallar ABIERTO — un problema de red al comprobar esto nunca debe ocultar la IA
      .finally(() => { comprobando = null; });
    return comprobando;
  }

  // Primera comprobación nada más cargar (asíncrona, no retrasa nada) +
  // recomprobación periódica mientras la pestaña esté abierta, para que
  // la opción de IA vuelva a aparecer sola si la cuota se restablece
  // antes de que el usuario recargue la página.
  //
  // Diferida con setTimeout(…, 0): en páginas como buscador.html,
  // window.GOOGLE_APPS_SCRIPT_URL se define dentro de un <script> en línea
  // grande, y no conviene depender del orden exacto en que se coloque la
  // etiqueta <script src> de este archivo respecto a ese bloque. Al
  // diferir, esta primera comprobación se ejecuta después de que termine
  // todo el script síncrono de la página, sea cual sea su posición.
  setTimeout(function () {
    comprobar();
    setInterval(comprobar, INTERVALO_RECOMPROBAR_MS);
  }, 0);

  window.IADisponibilidad = {
    // Lectura síncrona del último estado conocido — úsalo justo antes de
    // pintar/habilitar cualquier botón de IA.
    estaDisponible: function () { return disponible; },
    // Para el caso (poco frecuente) en que convenga esperar a la
    // primera comprobación real antes de decidir algo.
    comprobarAhora: comprobar,
    // Llamar en cuanto una respuesta del backend traiga
    // cuotaAgotada:true — reacciona al instante en toda la página
    // (y en las demás pestañas/vistas que compartan este módulo), sin
    // esperar al siguiente sondeo periódico.
    marcarNoDisponible: function () { disponible = false; },
  };
})();
