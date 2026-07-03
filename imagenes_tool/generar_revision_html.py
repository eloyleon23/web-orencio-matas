# -*- coding: utf-8 -*-
"""
generar_revision_html.py
=========================
Genera una página HTML (revision.html) para revisar visualmente en bloque
las imágenes candidatas descargadas por titan_buscar_imagenes.py, en vez de
tener que abrir cada fichero uno a uno en el Explorador de Windows.

Uso:
    python generar_revision_html.py --carpeta imagenes_pendientes_revision/pinturas

Qué hace:
 1. Lee imagenes_descargadas.csv de esa carpeta.
 2. Genera revision.html en la misma carpeta, con una rejilla de tarjetas
    (imagen + nombre + referencia + score). Todas empiezan "aprobadas".
 3. Ábrelo con doble clic (funciona sin conexión, sin instalar nada; usa
    las imágenes ya descargadas junto al HTML mediante rutas relativas).
 4. Haz clic en las tarjetas incorrectas para marcarlas como rechazadas
    (se ponen en rojo con un aspa). Puedes filtrar por score con el
    control de arriba para revisar primero las más dudosas.
 5. Botón "Descargar aprobadas.csv" -> genera un CSV solo con las que NO
    hayas rechazado (referencia, nombre_archivo) — ese es el listado final
    para subir a Drive.

No sube nada a ningún sitio ni borra ficheros: es solo un visor de revisión.
"""

import argparse
import csv
import json
import os


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--carpeta", default="imagenes_pendientes_revision/pinturas",
                     help="Carpeta donde están las imágenes y imagenes_descargadas.csv")
    args = ap.parse_args()

    csv_path = os.path.join(args.carpeta, "imagenes_descargadas.csv")
    if not os.path.exists(csv_path):
        print(f"[ERROR] No encuentro {csv_path}.")
        print("        Ejecuta antes titan_buscar_imagenes.py para generarlo.")
        return

    with open(csv_path, encoding="utf-8") as f:
        registros = list(csv.DictReader(f))

    if not registros:
        print("No hay ninguna imagen descargada en ese CSV. Nada que revisar.")
        return

    datos_js = json.dumps(registros, ensure_ascii=False)

    html = HTML_TEMPLATE.replace("__DATOS__", datos_js).replace("__TOTAL__", str(len(registros)))

    salida = os.path.join(args.carpeta, "revision.html")
    with open(salida, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"✓ Generado: {salida}")
    print(f"  Ábrelo con doble clic ({len(registros)} imágenes para revisar).")


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Revisión de imágenes candidatas</title>
<style>
  :root { --ok:#16a34a; --bad:#dc2626; --bg:#f1f5f9; --card:#ffffff; --dark:#0f172a; --muted:#64748b; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, Arial, sans-serif; background:var(--bg); color:var(--dark); }
  header { position: sticky; top:0; z-index:10; background:var(--dark); color:#fff; padding:14px 20px;
           display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
  header h1 { font-size: 1.05rem; margin:0; }
  header .stats { font-size:0.85rem; color:#cbd5e1; }
  header .stats b { color:#fff; }
  .controles { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .controles select, .controles button, .controles input {
      padding:7px 10px; border-radius:6px; border:none; font-size:0.85rem; cursor:pointer;
  }
  .controles button.primario { background:#2563eb; color:#fff; font-weight:600; }
  .controles button.secundario { background:#334155; color:#fff; }
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap:14px; padding:18px; }
  .card { background:var(--card); border-radius:10px; overflow:hidden; cursor:pointer; position:relative;
          box-shadow:0 1px 3px rgba(0,0,0,.08); border:3px solid transparent; transition: border-color .15s; }
  .card.rechazada { border-color: var(--bad); opacity:0.55; }
  .card .img-wrap { aspect-ratio:1/1; background:#e2e8f0; display:flex; align-items:center; justify-content:center; overflow:hidden;}
  .card img { width:100%; height:100%; object-fit:contain; }
  .card .sinimg { color:#94a3b8; font-size:0.75rem; }
  .card .info { padding:8px 10px; }
  .card .nombre { font-size:0.72rem; font-weight:600; line-height:1.25; height:2.6em; overflow:hidden; }
  .card .ref { font-size:0.68rem; color:var(--muted); margin-top:3px; }
  .card .score { display:inline-block; margin-top:5px; font-size:0.68rem; font-weight:700; padding:2px 7px; border-radius:20px; }
  .score.alto { background:#dcfce7; color:#166534; }
  .score.medio { background:#fef9c3; color:#854d0e; }
  .score.bajo { background:#fee2e2; color:#991b1b; }
  .marca { position:absolute; top:6px; right:6px; width:26px; height:26px; border-radius:50%;
           display:flex; align-items:center; justify-content:center; font-weight:900; color:#fff; font-size:0.9rem; }
  .card:not(.rechazada) .marca { background:var(--ok); }
  .card.rechazada .marca { background:var(--bad); }
  footer { text-align:center; padding:24px; color:var(--muted); font-size:0.8rem; }
</style>
</head>
<body>

<header>
  <h1>Revisión de imágenes candidatas — pinturas</h1>
  <div class="controles">
    <span class="stats"><b id="n-total">__TOTAL__</b> total &nbsp;|&nbsp; <b id="n-aprobadas" style="color:#4ade80;">__TOTAL__</b> aprobadas &nbsp;|&nbsp; <b id="n-rechazadas" style="color:#f87171;">0</b> rechazadas</span>
    <select id="filtro-score">
      <option value="0">Todas</option>
      <option value="55">Score < 65 primero (dudosas)</option>
      <option value="80">Score < 80 primero</option>
    </select>
    <input id="filtro-texto" placeholder="Filtrar por nombre o referencia...">
    <button class="secundario" id="btn-marcar-todo-bien">Marcar todo OK</button>
    <button class="primario" id="btn-exportar">Descargar aprobadas.csv</button>
  </div>
</header>

<div class="grid" id="grid"></div>

<footer>Haz clic en una tarjeta para aprobar / rechazar. Los rechazados se excluyen del CSV final.</footer>

<script>
const DATOS = __DATOS__;
const rechazadas = new Set();

function claseScore(s) {
    s = parseFloat(s);
    if (s >= 80) return 'alto';
    if (s >= 60) return 'medio';
    return 'bajo';
}

function actualizarContadores() {
    document.getElementById('n-total').textContent = DATOS.length;
    document.getElementById('n-rechazadas').textContent = rechazadas.size;
    document.getElementById('n-aprobadas').textContent = DATOS.length - rechazadas.size;
}

function render() {
    const grid = document.getElementById('grid');
    const texto = document.getElementById('filtro-texto').value.trim().toLowerCase();
    const ordenPorDuda = document.getElementById('filtro-score').value !== '0';

    let lista = DATOS.filter(d =>
        !texto || d.nombre_producto.toLowerCase().includes(texto) || d.referencia.includes(texto)
    );
    if (ordenPorDuda) {
        lista = [...lista].sort((a,b) => parseFloat(a.score) - parseFloat(b.score));
    }

    grid.innerHTML = '';
    lista.forEach(d => {
        const card = document.createElement('div');
        card.className = 'card' + (rechazadas.has(d.referencia) ? ' rechazada' : '');
        card.innerHTML = `
            <div class="marca">${rechazadas.has(d.referencia) ? '✕' : '✓'}</div>
            <div class="img-wrap"><img src="${d.nombre_archivo}" loading="lazy"
                 onerror="this.parentElement.innerHTML='<span class=sinimg>Sin imagen</span>'"></div>
            <div class="info">
                <div class="nombre">${d.nombre_producto}</div>
                <div class="ref">Ref: ${d.referencia}</div>
                <span class="score ${claseScore(d.score)}">${d.score}</span>
            </div>`;
        card.addEventListener('click', () => {
            if (rechazadas.has(d.referencia)) rechazadas.delete(d.referencia);
            else rechazadas.add(d.referencia);
            actualizarContadores();
            render();
        });
        grid.appendChild(card);
    });
}

document.getElementById('filtro-texto').addEventListener('input', render);
document.getElementById('filtro-score').addEventListener('change', render);
document.getElementById('btn-marcar-todo-bien').addEventListener('click', () => {
    rechazadas.clear();
    actualizarContadores();
    render();
});
document.getElementById('btn-exportar').addEventListener('click', () => {
    const aprobadas = DATOS.filter(d => !rechazadas.has(d.referencia));
    let csv = 'referencia,nombre_archivo\\n';
    aprobadas.forEach(d => { csv += `${d.referencia},${d.nombre_archivo}\\n`; });
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'aprobadas.csv';
    a.click();
});

actualizarContadores();
render();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
