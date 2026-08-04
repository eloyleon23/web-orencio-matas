# -*- coding: utf-8 -*-
"""
subir_imagenes_validadas.py
===========================
Sube las imágenes evaluadas y validadas manualmente a Google Drive y actualiza
la hoja de Google Sheet con el ID de Drive correspondiente.

Qué hace:
  1. Lee el CSV de imágenes descargadas (generado por buscar_imagenes_excel.py)
  2. Toma las imágenes del directorio temporal que el usuario ha revisado manualmente
  3. Sube cada imagen validada al directorio Drive de imágenes de productos
  4. Actualiza la hoja "Productos" del Google Sheet con:
     - imagen_drive_id: ID del fichero subido a Drive
     - fecha_actualizacion_imagen: fecha/hora actual
     - imagen_validada: fecha/hora actual

Requisitos:
  - Tener credenciales.json configurado (ver sincronizar_drive_sheet.py)
  - El directorio temporal debe contener solo las imágenes validadas
  - El CSV imagenes_descargadas.csv debe estar presente

Uso:
    python subir_imagenes_validadas.py --directorio imagenes_temp --csv imagenes_temp/imagenes_descargadas.csv
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
        necesita_login_completo = True
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                necesita_login_completo = False
            except Exception as e:
                # El refresh token también puede caducar o ser revocado
                # (no solo el access token de corta duración) — sin este
                # try/except, el script se caía aquí en vez de volver a
                # pedir el login por navegador.
                print(f"[AVISO] El token guardado ya no es válido ({e}). Pidiendo login de nuevo...")
        if necesita_login_completo:
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
    """Ejecuta una llamada a la API de Google con reintentos y backoff exponencial."""
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
    """Lee TODA la columna de referencias y construye referencia -> número de fila."""
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
        fila_real = i + 2  # +2: fila 1 es cabecera
        if ref in mapa:
            duplicadas.add(ref)
        else:
            mapa[ref] = fila_real
    for d in duplicadas:
        mapa.pop(d, None)
    return mapa, duplicadas


# ── Google Drive ──
def buscar_ficheros_existentes(drive, referencia):
    """Busca en la carpeta de Drive ficheros cuyo nombre coincida con la referencia."""
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
    ap.add_argument("--directorio", required=True,
                     help="Directorio temporal con las imágenes validadas manualmente")
    ap.add_argument("--csv", required=True,
                     help="CSV con las imágenes descargadas (imagenes_descargadas.csv)")
    ap.add_argument("--credenciales", default=".",
                     help="Carpeta donde están/se guardan credentials.json y token.json")
    ap.add_argument("--limite", type=int, default=0, help="Máximo de productos a procesar (0 = todos)")
    ap.add_argument("--dry-run", action="store_true",
                     help="Simula todo el proceso sin tocar Drive ni el Sheet")
    ap.add_argument("--lote-sheet", type=int, default=25,
                     help="Cada cuántos productos se vuelca el lote de cambios pendientes al Sheet")
    ap.add_argument("--forzar", action="store_true",
                     help="Salta el aviso de confirmación al usar imagenes_descargadas.csv (el CSV en bruto, sin revisar)")
    args = ap.parse_args()

    # Verificar que el directorio existe
    if not os.path.exists(args.directorio):
        print(f"[ERROR] No encuentro el directorio: {args.directorio}")
        sys.exit(1)
    
    # Verificar que el CSV existe
    if not os.path.exists(args.csv):
        print(f"[ERROR] No encuentro el CSV: {args.csv}")
        sys.exit(1)

    # Aviso de seguridad: "imagenes_descargadas.csv" es el CSV EN BRUTO con
    # TODO lo que encontró el script de búsqueda, sin ningún filtro de
    # revisión — lo correcto es revisar con generar_revision_html.py,
    # pulsar "Descargar aprobadas.csv" ahí, y usar ESE archivo aquí. Sin
    # este aviso, pasar el CSV en bruto por error sube también las
    # candidatas rechazadas/de baja confianza (ya ha pasado).
    nombre_csv = os.path.basename(args.csv).strip().lower()
    if nombre_csv == "imagenes_descargadas.csv" and not args.forzar:
        print("=" * 70)
        print("[AVISO] Este es el CSV EN BRUTO (todo lo que encontró la búsqueda,")
        print("        sin revisar) — NO es el resultado de la revisión visual.")
        print()
        print("        Si ya revisaste las imágenes en generar_revision_html.py y")
        print('        pulsaste "Descargar aprobadas.csv", usa ESE archivo en su')
        print("        lugar (normalmente en tu carpeta de Descargas).")
        print()
        print("        Si continúas con este CSV, se subirán TODAS las imágenes")
        print("        encontradas, incluidas las que no hayas revisado o hayas")
        print("        rechazado visualmente.")
        print("=" * 70)
        respuesta = input("¿Seguro que quieres continuar con este CSV sin revisar? (escribe SI para continuar): ")
        if respuesta.strip().upper() != "SI":
            print("Cancelado. Vuelve a lanzar esto con --csv apuntando a aprobadas.csv")
            print("(o añade --forzar si de verdad quieres subir el CSV en bruto).")
            sys.exit(0)

    # Leer CSV de imágenes descargadas
    with open(args.csv, encoding="utf-8") as f:
        filas_csv = list(csv.DictReader(f))
    
    # Filtrar solo las que tienen archivo en el directorio (validadas manualmente)
    validadas = []
    for fila in filas_csv:
        nombre_archivo = fila.get("nombre_archivo", "").strip()
        ruta_local = os.path.join(args.directorio, nombre_archivo)
        if os.path.exists(ruta_local):
            validadas.append(fila)
    
    if args.limite:
        validadas = validadas[: args.limite]
    
    print(f"→ {len(validadas)} imágenes validadas a subir (de {len(filas_csv)} en el CSV)")
    
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
                  f"y se omitirán por seguridad.")

    fecha_hora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    fallos = []
    exitos = 0
    cambios_pendientes_sheet = []

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

    for i, fila in enumerate(validadas, 1):
        referencia = fila["referencia"].strip()
        nombre_archivo = fila["nombre_archivo"].strip()
        ruta_local = os.path.join(args.directorio, nombre_archivo)

        try:
            if not args.dry_run and referencia not in mapa_ref:
                motivo = "duplicada en el Sheet" if referencia in duplicadas else "no encontrada en el Sheet"
                raise ValueError(f"referencia {motivo}")

            if args.dry_run:
                print(f"[{i}/{len(validadas)}] {referencia}: subiría {nombre_archivo}, "
                      f"borraría antiguo si existe, actualizaría fila del Sheet.")
                exitos += 1
                continue

            # 1) Papelera de ficheros antiguos con ese nombre
            antiguos = buscar_ficheros_existentes(drive, referencia)
            for f in antiguos:
                con_reintentos(
                    drive.files().update(fileId=f["id"], body={"trashed": True}).execute
                )

            # 2) Subir el nuevo
            nuevo_id, nombre_destino = subir_imagen(drive, ruta_local, referencia)

            # 3) Hacerlo público
            hacer_publico(drive, nuevo_id)

            # 4) Encolar actualización del Sheet
            fila_sheet = mapa_ref[referencia]
            cambios_pendientes_sheet.append((fila_sheet, nuevo_id))

            exitos += 1
            print(f"[{i}/{len(validadas)}] OK  {referencia} -> {nuevo_id} "
                  f"({len(antiguos)} antigua(s) papeleada(s))")

        except Exception as e:
            fallos.append({"referencia": referencia, "nombre_archivo": nombre_archivo, "error": str(e)})
            print(f"[{i}/{len(validadas)}] FALLO  {referencia}: {e}")

        if i % args.lote_sheet == 0:
            volcar_cambios_sheet()

    volcar_cambios_sheet()

    print(f"\n✓ Completado. {exitos} OK, {len(fallos)} fallos.")

    if fallos:
        ruta_fallos = os.path.join(args.directorio, "fallos_sincronizacion.csv")
        with open(ruta_fallos, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["referencia", "nombre_archivo", "error"])
            w.writeheader()
            w.writerows(fallos)
        print(f"  Detalle de fallos (para reintentar después): {ruta_fallos}")


if __name__ == "__main__":
    main()
