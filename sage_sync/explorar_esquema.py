# -*- coding: utf-8 -*-
"""
explorar_esquema.py
=====================
EJECUTAR EN TU ORDENADOR (o en el servidor de la oficina, donde SÍ hay red
hacia el SQL Server de Sage 200). Yo no puedo conectarme a vuestra red desde
aquí, así que este script es el primer paso: te dice qué tablas de Sage 200
contienen productos y precios, sin adivinar nada a ciegas.

QUÉ HACE (todo de SOLO LECTURA, no modifica nada):
 1. Se conecta al SQL Server de Sage 200 con el usuario que le indiques.
 2. Lista las bases de datos visibles con ese usuario.
 3. Dentro de la base de datos de la empresa, busca tablas y vistas cuyo
    nombre contenga palabras típicas de artículos/productos/precios/tarifas
    (en español e inglés, porque Sage 200 mezcla ambos según la versión).
 4. Para cada candidata, muestra sus columnas y una muestra de 3 filas, para
    que puedas identificar a simple vista cuál es la tabla real de productos
    y cuál la de precios de venta.

Esto NO escribe nada en Sage, NO cambia ningún dato, y solo necesita permisos
de lectura (SELECT). Aun así, usa un usuario dedicado de solo lectura, nunca
el usuario de administración de Sage — ver el README para cómo pedirlo.

═══════════════════════════════════════════════════════════════
CONFIGURACIÓN (una sola vez):

  1. Pide a quien administre Sage 200 en tu empresa (o al partner que os
     implantó Sage) un USUARIO DE SQL SERVER DE SOLO LECTURA sobre la base
     de datos de la empresa. No hace falta que sea usuario de Windows ni de
     Sage — es un login de SQL Server, distinto y más limitado.

  2. Instala el driver ODBC de SQL Server (gratuito, de Microsoft), si no lo
     tienes ya: "ODBC Driver 17 for SQL Server" o superior.
     https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server

  3. Instala pyodbc:
        pip install pyodbc --break-system-packages

  4. Crea `credenciales_sage.json` en esta carpeta:
        {
          "servidor": "NOMBRE-DEL-SERVIDOR\\INSTANCIA",
          "usuario": "usuario_solo_lectura",
          "password": "la_contraseña",
          "base_datos": "NOMBRE_BASE_DATOS_EMPRESA"
        }
     (el nombre del servidor/instancia y de la base de datos te los da la
     misma persona que te cree el usuario)

Uso:
    python explorar_esquema.py
    python explorar_esquema.py --buscar "articulo,producto,precio,tarifa"
"""

import argparse
import json
import sys

try:
    import pyodbc
except ImportError:
    print("[ERROR] Falta pyodbc. Instálalo con: pip install pyodbc --break-system-packages")
    sys.exit(1)

PALABRAS_POR_DEFECTO = [
    "articul", "product", "precio", "tarifa", "stock", "almacen", "existenc",
]


def conectar(credenciales):
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={credenciales['servidor']};"
        f"DATABASE={credenciales['base_datos']};"
        f"UID={credenciales['usuario']};"
        f"PWD={credenciales['password']};"
        f"TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str, timeout=10)


def listar_bases_datos(cursor):
    print("→ Bases de datos visibles con este usuario:")
    cursor.execute("SELECT name FROM sys.databases ORDER BY name")
    for row in cursor.fetchall():
        print(f"   - {row.name}")
    print()


def buscar_tablas_candidatas(cursor, palabras):
    print(f"→ Buscando tablas/vistas cuyo nombre contenga: {', '.join(palabras)}\n")
    condiciones = " OR ".join([f"LOWER(TABLE_NAME) LIKE '%{p.lower()}%'" for p in palabras])
    query = f"""
        SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
        FROM INFORMATION_SCHEMA.TABLES
        WHERE {condiciones}
        ORDER BY TABLE_SCHEMA, TABLE_NAME
    """
    cursor.execute(query)
    candidatas = cursor.fetchall()
    if not candidatas:
        print("   (ninguna tabla coincide — prueba con --buscar y otras palabras)")
        return []
    for row in candidatas:
        print(f"   [{row.TABLE_TYPE:5}] {row.TABLE_SCHEMA}.{row.TABLE_NAME}")
    print()
    return [(r.TABLE_SCHEMA, r.TABLE_NAME) for r in candidatas]


def describir_tabla(cursor, esquema, tabla):
    print(f"─── {esquema}.{tabla} ───")
    cursor.execute(f"""
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
    """, esquema, tabla)
    columnas = cursor.fetchall()
    print("Columnas:", ", ".join(c.COLUMN_NAME for c in columnas))

    try:
        cursor.execute(f"SELECT TOP 3 * FROM [{esquema}].[{tabla}]")
        filas = cursor.fetchall()
        if filas:
            print(f"Muestra ({len(filas)} filas):")
            nombres_col = [c[0] for c in cursor.description]
            for fila in filas:
                print("  ", dict(zip(nombres_col, fila)))
        else:
            print("  (tabla vacía)")
    except Exception as e:
        print(f"  [no se pudo leer una muestra: {e}]")
    print()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--credenciales", default="credenciales_sage.json")
    ap.add_argument("--buscar", default=",".join(PALABRAS_POR_DEFECTO),
                     help="Palabras separadas por coma a buscar en nombres de tabla")
    ap.add_argument("--solo-listar-bd", action="store_true",
                     help="Solo listar bases de datos visibles, sin buscar tablas")
    args = ap.parse_args()

    try:
        with open(args.credenciales, encoding="utf-8") as f:
            credenciales = json.load(f)
    except FileNotFoundError:
        print(f"[ERROR] No encuentro {args.credenciales}. Revisa la sección de configuración "
              f"en la cabecera de este script.")
        sys.exit(1)

    print(f"→ Conectando a {credenciales['servidor']} / {credenciales['base_datos']} "
          f"como {credenciales['usuario']}...\n")

    try:
        conn = conectar(credenciales)
    except Exception as e:
        print(f"[ERROR] No se pudo conectar: {e}")
        print("        Revisa servidor, usuario, contraseña y que el driver ODBC esté instalado.")
        sys.exit(1)

    cursor = conn.cursor()
    print("✓ Conexión establecida.\n")

    if args.solo_listar_bd:
        listar_bases_datos(cursor)
        return

    palabras = [p.strip() for p in args.buscar.split(",") if p.strip()]
    candidatas = buscar_tablas_candidatas(cursor, palabras)

    if candidatas:
        print("Mostrando columnas y una muestra de cada tabla candidata:\n")
        for esquema, tabla in candidatas:
            describir_tabla(cursor, esquema, tabla)

    conn.close()
    print("Hecho. Copia esta salida (o la que te interese) para que identifiquemos "
          "juntos cuál es la tabla real de productos y la de precios.")


if __name__ == "__main__":
    main()
