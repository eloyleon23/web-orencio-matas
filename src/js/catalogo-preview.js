/**
 * Muestra visual de productos reales del catálogo, embebida en las
 * páginas catalogo_*.html — pensada para dar una idea de lo que contiene
 * el PDF sin tener que cargarlo entero (que es justo el problema de
 * tamaño que esto sustituye).
 *
 * Reutiliza data/productos.json (ya cargado por el buscador) y la misma
 * lógica de URL de imagen que buscador.html — ver urlImagenProductoCatalogo().
 *
 * Se cargan los productos UNA sola vez, y cada 5 segundos se elige un
 * nuevo grupo aleatorio de familias + productos y se vuelve a pintar —
 * así el usuario ve variedad sin tener que recargar la página.
 *
 * Uso: en cada catalogo_*.html, tras el contenedor con id
 * "catalogo-preview-grid", llamar a:
 *   cargarMuestraCatalogo({ area: 'drogueria', contenedorId: 'catalogo-preview-grid' })
 */
(function () {
    'use strict';

    const ROTACION_MS = 5000;

    function urlImagenProductoCatalogo(p, tamano) {
        if (!p.img) return null;
        // Los 4 catálogos estáticos de proveedor (Zaphiro/Besa/Glasurit/
        // Baslac) traen 'fabricante' y su 'img' es un nombre de archivo
        // real en assets/imagenes_talleres/, no un ID de Drive.
        if (p.fabricante) return `./assets/imagenes_talleres/${p.img}`;
        return `https://drive.google.com/thumbnail?id=${p.img}&sz=w${tamano}`;
    }

    function tieneImagenReal(p) {
        const valor = (p.img || '').toString().trim().toUpperCase();
        return valor !== '' && valor !== 'NO_TIENE_FOTO' && valor !== 'NO TIENE FOTO';
    }

    function escaparHtml(t) {
        const d = document.createElement('div');
        d.textContent = t || '';
        return d.innerHTML;
    }

    function formatearPrecio(p) {
        if (!p.mostrar_precio || !p.precio_con) return '';
        return `${p.precio_con} € <span style="font-weight:400;font-size:0.75em;color:#94a3b8;">IVA incl.</span>`;
    }

    function mezclar(array) {
        // Fisher-Yates — para que cada rotación sea una combinación
        // distinta de la anterior.
        const copia = array.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    function puntuarRelevancia(p) {
        // Más alto = más relevante para aparecer en la muestra.
        let puntos = 0;
        if (p.oferta) puntos += 3;
        if (p.imagen_validada || p.fecha_actualizacion_imagen) puntos += 2;
        if (p.mostrar_precio && p.precio_con) puntos += 1;
        return puntos;
    }

    // Elige un grupo aleatorio de "numFamilias" familias (de entre TODAS
    // las que tiene el área) y reparte "limite" productos entre ellas —
    // tanto las familias elegidas como los productos dentro de cada una
    // cambian en cada llamada, para que la rotación automática dé
    // variedad real y no muestre siempre la misma combinación.
    function muestraDiversaPorFamilia(candidatos, limite, numFamilias) {
        const porFamilia = new Map();
        for (const p of candidatos) {
            const familia = p.familia || '(sin familia)';
            if (!porFamilia.has(familia)) porFamilia.set(familia, []);
            porFamilia.get(familia).push(p);
        }

        const familiasElegidas = mezclar([...porFamilia.keys()]).slice(0, numFamilias);

        // Dentro de cada familia elegida: mezclar y priorizar por
        // relevancia (ofertas, imagen validada primero).
        for (const familia of familiasElegidas) {
            const lista = porFamilia.get(familia);
            porFamilia.set(familia, mezclar(lista).sort((a, b) => puntuarRelevancia(b) - puntuarRelevancia(a)));
        }

        const muestra = [];
        let ronda = 0;
        // Ronda a ronda: una unidad de cada familia elegida por vuelta,
        // hasta llenar el límite o agotar esas familias.
        while (muestra.length < limite) {
            let añadidoEnRonda = false;
            for (const familia of familiasElegidas) {
                if (muestra.length >= limite) break;
                const lista = porFamilia.get(familia);
                if (lista.length > ronda) {
                    muestra.push(lista[ronda]);
                    añadidoEnRonda = true;
                }
            }
            if (!añadidoEnRonda) break; // esas familias ya no tienen más productos
            ronda++;
        }
        return muestra;
    }

    function tarjetaHtml(p) {
        const img = urlImagenProductoCatalogo(p, 400);
        const precio = formatearPrecio(p);
        return `
            <div style="height:100%;background:white;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;flex-direction:column;">
                <div style="aspect-ratio:1;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
                    <img src="${img}" alt="${escaparHtml(p.nombre)}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fa-solid fa-image\\' style=\\'font-size:1.5rem;color:#cbd5e1;\\'></i>'" style="width:100%;height:100%;object-fit:contain;padding:8px;box-sizing:border-box;">
                </div>
                <div style="padding:10px 12px 12px;display:flex;flex-direction:column;flex:1;">
                    <p style="margin:0;font-size:0.8rem;color:#334155;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.15em;">${escaparHtml(p.nombre)}</p>
                    <p style="margin:6px 0 0;font-size:0.9rem;font-weight:700;color:#1e293b;min-height:1.2em;">${precio}</p>
                </div>
            </div>`;
    }

    async function cargarMuestraCatalogo(opts) {
        const { area, contenedorId, limite = 20, numFamilias = 5 } = opts;
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;

        // Por si se llamara dos veces para el mismo contenedor, no dejar
        // rotaciones duplicadas corriendo en paralelo.
        if (contenedor._rotacionCatalogoId) {
            clearInterval(contenedor._rotacionCatalogoId);
        }

        try {
            // Cache-busting igual que en buscador.html: consultar primero
            // la versión para no servir un productos.json cacheado antiguo.
            let productosUrl = './data/productos.json';
            try {
                const versionResp = await fetch(`./data/productos_version.json?_t=${Date.now()}`, { cache: 'no-store' });
                if (versionResp.ok) {
                    const version = await versionResp.json();
                    productosUrl += `?v=${encodeURIComponent(version.timestamp || Date.now())}`;
                }
            } catch (e) { /* si falla, se sigue con la URL sin versión */ }

            const resp = await fetch(productosUrl);
            const datos = await resp.json();
            const todos = datos.productos || datos;

            const candidatos = todos.filter(p =>
                p.area === area &&
                !p.fecha_baja &&
                tieneImagenReal(p)
            );

            if (candidatos.length === 0) {
                contenedor.style.display = 'none';
                return;
            }

            contenedor.style.transition = 'opacity 0.25s ease';

            function pintarRonda() {
                const muestra = muestraDiversaPorFamilia(candidatos, limite, numFamilias);
                contenedor.style.opacity = '0';
                setTimeout(() => {
                    contenedor.innerHTML = muestra.map(tarjetaHtml).join('');
                    contenedor.style.opacity = '1';
                }, 250);
            }

            pintarRonda();
            // Solo merece la pena rotar si hay más familias/productos de
            // los que ya se están mostrando de una vez.
            if (candidatos.length > limite) {
                contenedor._rotacionCatalogoId = setInterval(pintarRonda, ROTACION_MS);
            }
        } catch (e) {
            console.error('No se pudo cargar la muestra del catálogo:', e);
            contenedor.style.display = 'none';
        }
    }

    window.cargarMuestraCatalogo = cargarMuestraCatalogo;
})();
