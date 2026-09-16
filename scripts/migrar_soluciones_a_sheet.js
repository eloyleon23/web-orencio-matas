#!/usr/bin/env node
/**
 * Migración ÚNICA (se ejecuta una sola vez, a mano) de las guías del
 * Centro de Soluciones desde assets/js/soluciones-data.js (código JS
 * escrito a mano) a un TSV listo para pegar en la hoja nueva
 * "Soluciones" del Google Sheet — misma idea que ya usa
 * relacionados_tool: generar algo y pegarlo en una pestaña del Sheet,
 * en vez de escribir directamente por API.
 *
 * Uso:
 *   node scripts/migrar_soluciones_a_sheet.js > /tmp/soluciones.tsv
 *
 * Luego, en el Sheet: crear una fila 1 con las cabeceras
 * "slug  datos_json  activa  fecha_creacion  fecha_actualizacion" (si
 * Apps Script no la ha creado ya sola al desplegar) y pegar el
 * contenido de ese archivo a partir de la fila 2 — Google Sheets separa
 * las columnas de un TSV pegado automáticamente. El JSON de cada guía
 * va compacto (sin saltos de línea reales dentro, todo escapado), así
 * que cada guía cae limpiamente en una sola celda de una sola fila.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RUTA_ORIGEN = path.join(__dirname, '..', 'assets', 'js', 'soluciones-data.js');

function cargarSolucionesDesdeArchivo(ruta) {
  const codigo = fs.readFileSync(ruta, 'utf8');
  // window falso mínimo: el archivo solo necesita poder hacer
  // "window.SOLUCIONES_DATA = ...", nada más se ejecuta al cargar (las
  // funciones que sí usan fetch/document/etc. no se LLAMAN aquí, solo
  // se definen).
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(codigo, sandbox, { filename: ruta });
  const datos = sandbox.window.SOLUCIONES_DATA;
  if (!datos || !datos.soluciones) {
    throw new Error('No se ha podido extraer window.SOLUCIONES_DATA.soluciones del archivo.');
  }
  return datos.soluciones;
}

function escaparCeldaTSV(valor) {
  // Un TSV pegado en Sheets no admite tabs ni saltos de línea reales
  // dentro de una celda — JSON.stringify() compacto ya no produce
  // ninguno de los dos (todo lo escapa como \t / \n dentro de las
  // cadenas), así que en la práctica esto es solo una red de seguridad.
  return valor.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

function main() {
  const soluciones = cargarSolucionesDesdeArchivo(RUTA_ORIGEN);
  const slugs = Object.keys(soluciones);
  const ahoraISO = new Date().toISOString();

  const filas = [['slug', 'datos_json', 'activa', 'fecha_creacion', 'fecha_actualizacion']];
  slugs.forEach((slug) => {
    const solucion = soluciones[slug];
    // El slug ya viene dentro del objeto (solucion.slug) — se guarda tal
    // cual en la columna "slug" y también dentro del JSON, igual que
    // hace leerSoluciones_() en Apps Script al leerlo de vuelta.
    const datosJson = JSON.stringify(solucion);
    filas.push([slug, escaparCeldaTSV(datosJson), 'si', ahoraISO, ahoraISO]);
  });

  const tsv = filas.map((fila) => fila.join('\t')).join('\n');
  process.stdout.write(tsv + '\n');
  console.error(`\n✓ ${slugs.length} guías migradas a TSV (por stderr, no se mezcla con la salida) — pégalas en la hoja "Soluciones" a partir de la fila 2.`);
}

main();
