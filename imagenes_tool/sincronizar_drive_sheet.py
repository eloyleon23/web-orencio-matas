# -*- coding: utf-8 -*-
"""
sincronizar_drive_sheet.py
===========================
EJECUTAR EN TU ORDENADOR. Último paso del pipeline de imágenes: toma las
imágenes ya aprobadas (por ti, en la galería de revisión) y:

  1. Busca en la carpeta de Drive de imágenes públicas si ya existe un
     fichero con ese mismo nombre de referencia (cualquier extensión) y,
     si existe, lo envía a la papelera de Drive (NO lo borra de forma
     permanente — recuperable durante 30 días, por seguridad).
  2. Sube la imagen nueva a esa misma carpeta con nombre "<referencia>.ext".
  3. La marca como pública ("cualquiera con el enlace puede ver").
  4. Busca en la hoja "Productos" del Google Sheet la fila cuya columna
     `referencia` coincide EXACTAMENTE con el EAN — y solo esa fila — y
     actualiza:
        - imagen_drive_id          -> ID del fichero nuevo subido
        - fecha_actualizacion_imagen -> fecha/hora actual
        - imagen_validada           -> fecha/hora actual

Si algo falla para un producto concreto (fichero local no encontrado, error
de red, referencia no localizada en el Sheet, referencia duplicada en el
Sheet...), se anota en `fallos_sincronizacion.csv` y se continúa con el
resto — nunca se aborta todo el proceso por un fallo puntual, y nunca se
actualiza una fila que no sea la de la referencia exacta.

═══════════════════════════════════════════════════════════════
PRIMERA VEZ: necesitas credenciales de Google Cloud (ver README.md,
sección "Configurar acceso a Google Drive y Sheets"). Un resumen rápido:

  1. https://console.cloud.google.com/ → crea un proyecto.
  2. "APIs y servicios" → habilita "Google Drive API" y "Google Sheets API".
  3. "Pantalla de consentimiento OAuth" → tipo "Externo", añádete como
     usuario de prueba con tu email.
  4. "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth" →
     tipo "Aplicación de escritorio".
  5. Descarga el JSON y guárdalo como `credentials.json` en esta carpeta.

La primera vez que ejecutes el script se abrirá el navegador para que
autorices el acceso; después queda guardado en `token.json` y no hace
falta repetirlo (salvo que revoques el acceso).
═══════════════════════════════════════════════════════════════

Requisitos:
    pip install --user google-api-python-client google-auth-httplib2 google-auth-oauthlib

USO RECOMENDADO (primero simulación, sin tocar nada real):
    python sincronizar_drive_sheet.py --csv imagenes_pendientes_revision/pinturas/aprobadas.csv ^
        --carpeta-imagenes imagenes_pendientes_revision/pinturas --dry-run --limite 5

Cuando confíes en el resultado, quita --dry-run (y --limite si quieres
procesar todo):
    python sincronizar_drive_sheet.py --csv imagenes_pendientes_revision/pinturas/aprobadas.csv ^
        --carpeta-imagenes imagenes_pendientes_revision/pinturas
"""

import argparse
import csv
import mimetypes
import os
import sys
import time
from datetime import datetime

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from googleapiclient.errors import HttpError
except ImportError:
    print("[ERROR] Faltan dependencias. Instala con:")
    print("        pip install --user google-api-python-client google-auth-httplib2 google-auth-oauthlib")
    sys.exit(1)

SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
]

SHEET_ID = "1-XRfwi_Ddx9oCo_gJ4JfqHaMX1Uh-il5oPWIUNMA5k8"
HOJA = "Productos"
DRIVE_FOLDER_ID = "13O7N_q6IisAhsvSoXogKJ2PUDVQfUKRe"

COL_REFERENCIA = "referencia"
COL_IMAGEN_DRIVE_ID = "imagen_drive_id"
COL_FECHA_ACTUALIZACION = "fecha_actualizacion_imagen"
COL_IMAGEN_VALIDADA = "imagen_validada"


# ── Autenticación ──
def autenticar(carpeta_credenciales="."):
    ruta_token = os.path.join(carpeta_credenciales, "token.json")
    ruta_creds = os.path.join(carpeta_credenciales, "credentials.json")

    creds = None
    if os.path.exists(ruta_token):
        creds = Credentials.from_authorized_user_file(ruta_token, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(ruta_creds):
                print(f"[ERROR] No encuentro {ruta_creds}.")
                print("        Sigue las instrucciones del README para obtenerlo desde Google Cloud Console.")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(ruta_creds, SCOPES)
            print("Se abrirá el navegador para autorizar el acceso a Drive y Sheets...")
            creds = flow.run_local_server(port=0)
        with open(ruta_token, "w", encoding="utf-8") as f:
            f.write(creds.to_json())
    return creds


def con_reintentos(func, *args, intentos=4, **kwargs):
    """Ejecuta una llamada a la API de Google con reintentos y backoff
    exponencial ante errores transitorios (429 rate limit, 500, 503)."""
    for intento in range(intentos):
        try:
            return func(*args, **kwargs)
        except HttpError as e:
            transitorio = e.resp.status in (429, 500, 503)
            if transitorio and intento < intentos - 1:
                espera = 2 ** intento * 2
                print(f"    (aviso: error {e.resp.status} de Google, reintentando en {espera}s...)")
                time.sleep(espera)
                continue
            raise


# ── Google Sheets: localizar columnas y filas por referencia ──
def obtener_indices_columnas(sheets):
    resp = con_reintentos(
        sheets.values().get(spreadsheetId=SHEET_ID, range=f"{HOJA}!1:1").execute
    )
    cabeceras = resp.get("values", [[]])[0]
    indices = {nombre.strip(): i for i, nombre in enumerate(cabeceras)}
    faltan = [c for c in (COL_REFERENCIA, COL_IMAGEN_DRIVE_ID, COL_FECHA_ACTUALIZACION, COL_IMAGEN_VALIDADA)
              if c not in indices]
    if faltan:
        print(f"[ERROR] No encuentro estas columnas en la hoja '{HOJA}': {faltan}")
        print(f"        Cabeceras encontradas: {cabeceras}")
        sys.exit(1)
    return indices


def col_letra(idx0):
    """Índice de columna 0-based -> letra de columna A1 (0->A, 1->B, 26->AA...)."""
    idx = idx0 + 1
    letra = ""
    while idx > 0:
        idx, resto = divmod(idx - 1, 26)
        letra = chr(65 + resto) + letra
    return letra


def construir_mapa_referencias(sheets, col_ref_letra):
    """Lee TODA la columna de referencias de una sola vez (rápido, 1 llamada)
    y construye referencia -> número de fila real en el Sheet. Si una
    referencia aparece más de una vez, se descarta del mapa (ambigua: mejor
    no tocar ninguna fila que arriesgarnos a actualizar la que no es)."""
    resp = con_reintentos(
        sheets.values().get(
            spreadsheetId=SHEET_ID, range=f"{HOJA}!{col_ref_letra}2:{col_ref_letra}"
        ).execute
    )
    valores = resp.get("values", [])
    mapa = {}
    duplicadas = set()
    for i, fila in enumerate(valores):
        ref = (fila[0].strip() if fila and fila[0] else "")
        if not ref:
            continue
        fila_real = i + 2  # +2: fila 1 es cabecera, y los índices son 0-based
        if ref in mapa:
            duplicadas.add(ref)
        else:
            mapa[ref] = fila_real
    for d in duplicadas:
        mapa.pop(d, None)
    return mapa, duplicadas


# ── Google Drive ──
def buscar_ficheros_existentes(drive, referencia):
    """Busca en la carpeta de Drive ficheros cuyo nombre (sin extensión)
    coincida EXACTAMENTE con la referencia."""
    q = f"'{DRIVE_FOLDER_ID}' in parents and trashed = false and name contains '{referencia}'"
    resp = con_reintentos(
        drive.files().list(q=q, fields="files(id, name)", pageSize=50).execute
    )
    exactos = []
    for f in resp.get("files", []):
        nombre_sin_ext = os.path.splitext(f["name"])[0]
        if nombre_sin_ext == referencia:
            exactos.append(f)
    return exactos


def subir_imagen(drive, ruta_local, referencia):
    ext = os.path.splitext(ruta_local)[1]
    nombre_destino = f"{referencia}{ext}"
    mime, _ = mimetypes.guess_type(ruta_local)
    media = MediaFileUpload(ruta_local, mimetype=mime or "image/jpeg", resumable=True)
    metadata = {"name": nombre_destino, "parents": [DRIVE_FOLDER_ID]}
    nuevo = con_reintentos(
        drive.files().create(body=metadata, media_body=media, fields="id").execute
    )
    return nuevo["id"], nombre_destino


def hacer_publico(drive, file_id):
    con_reintentos(
        drive.permissions().create(
            fileId=file_id, body={"type": "anyone", "role": "reader"}
        ).execute
    )


# ── Programa principal ──
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True,
                     help="CSV con columnas referencia,nombre_archivo (el aprobadas.csv de la galería)")
    ap.add_argument("--carpeta-imagenes", required=True,
                     help="Carpeta donde están los ficheros de imagen descargados")
    ap.add_argument("--credenciales", default=".",
                     help="Carpeta donde están/se guardan credentials.json y token.json")
    ap.add_argument("--limite", type=int, default=0, help="Máximo de productos a procesar (0 = todos)")
    ap.add_argument("--dry-run", action="store_true",
                     help="Simula todo el proceso sin tocar Drive ni el Sheet (solo muestra qué haría)")
    ap.add_argument("--lote-sheet", type=int, default=25,
                     help="Cada cuántos productos se vuelca el lote de cambios pendientes al Sheet")
    args = ap.parse_args()

    with open(args.csv, encoding="utf-8") as f:
        filas_csv = list(csv.DictReader(f))
    if args.limite:
        filas_csv = filas_csv[: args.limite]
    print(f"→ {len(filas_csv)} imágenes aprobadas a sincronizar.")

    if args.dry_run:
        print("  *** MODO SIMULACIÓN (--dry-run): no se sube nada ni se toca el Sheet ***\n")

    drive = sheets = None
    indices = mapa_ref = duplicadas = None
    if not args.dry_run:
        creds = autenticar(args.credenciales)
        drive = build("drive", "v3", credentials=creds)
        sheets_srv = build("sheets", "v4", credentials=creds)
        sheets = sheets_srv.spreadsheets()

        print("→ Leyendo cabeceras y referencias del Sheet...")
        indices = obtener_indices_columnas(sheets)
        col_ref_letra = col_letra(indices[COL_REFERENCIA])
        mapa_ref, duplicadas = construir_mapa_referencias(sheets, col_ref_letra)
        print(f"  {len(mapa_ref)} referencias localizadas en el Sheet.")
        if duplicadas:
            print(f"  Aviso: {len(duplicadas)} referencias están DUPLICADAS en el Sheet "
                  f"y se omitirán por seguridad (no se puede saber cuál fila es).")

    fecha_hora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    fallos = []
    exitos = 0
    cambios_pendientes_sheet = []  # [(fila, imagen_drive_id), ...]

    def volcar_cambios_sheet():
        if not cambios_pendientes_sheet or args.dry_run:
            return
        data = []
        for fila, drive_id in cambios_pendientes_sheet:
            col_id = col_letra(indices[COL_IMAGEN_DRIVE_ID])
            col_fecha = col_letra(indices[COL_FECHA_ACTUALIZACION])
            col_valid = col_letra(indices[COL_IMAGEN_VALIDADA])
            data.append({"range": f"{HOJA}!{col_id}{fila}", "values": [[drive_id]]})
            data.append({"range": f"{HOJA}!{col_fecha}{fila}", "values": [[fecha_hora]]})
            data.append({"range": f"{HOJA}!{col_valid}{fila}", "values": [[fecha_hora]]})
        con_reintentos(
            sheets.values().batchUpdate(
                spreadsheetId=SHEET_ID,
                body={"valueInputOption": "USER_ENTERED", "data": data},
            ).execute
        )
        cambios_pendientes_sheet.clear()

    for i, fila in enumerate(filas_csv, 1):
        referencia = fila["referencia"].strip()
        nombre_archivo = fila["nombre_archivo"].strip()
        ruta_local = os.path.join(args.carpeta_imagenes, nombre_archivo)

        try:
            if not os.path.exists(ruta_local):
                raise FileNotFoundError(f"no existe el fichero local {ruta_local}")

            if not args.dry_run and referencia not in mapa_ref:
                motivo = "duplicada en el Sheet" if referencia in duplicadas else "no encontrada en el Sheet"
                raise ValueError(f"referencia {motivo}")

            if args.dry_run:
                print(f"[{i}/{len(filas_csv)}] {referencia}: subiría {nombre_archivo}, "
                      f"borraría antiguo si existe, actualizaría fila del Sheet.")
                exitos += 1
                continue

            # 1) papelear ficheros antiguos con ese nombre (cualquier extensión)
            antiguos = buscar_ficheros_existentes(drive, referencia)
            for f in antiguos:
                con_reintentos(
                    drive.files().update(fileId=f["id"], body={"trashed": True}).execute
                )

            # 2) subir el nuevo
            nuevo_id, nombre_destino = subir_imagen(drive, ruta_local, referencia)

            # 3) hacerlo público
            hacer_publico(drive, nuevo_id)

            # 4) encolar actualización del Sheet (se envía en lotes, ver volcar_cambios_sheet)
            fila_sheet = mapa_ref[referencia]
            cambios_pendientes_sheet.append((fila_sheet, nuevo_id))

            exitos += 1
            print(f"[{i}/{len(filas_csv)}] OK  {referencia} -> {nuevo_id} "
                  f"({len(antiguos)} antigua(s) papeleada(s))")

        except Exception as e:
            fallos.append({"referencia": referencia, "nombre_archivo": nombre_archivo, "error": str(e)})
            print(f"[{i}/{len(filas_csv)}] FALLO  {referencia}: {e}")

        if i % args.lote_sheet == 0:
            volcar_cambios_sheet()

    volcar_cambios_sheet()  # ultimo lote pendiente

    print(f"\n✓ Completado. {exitos} OK, {len(fallos)} fallos.")

    if fallos:
        ruta_fallos = "fallos_sincronizacion.csv"
        with open(ruta_fallos, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["referencia", "nombre_archivo", "error"])
            w.writeheader()
            w.writerows(fallos)
        print(f"  Detalle de fallos (para reintentar después): {ruta_fallos}")


if __name__ == "__main__":
    main()
