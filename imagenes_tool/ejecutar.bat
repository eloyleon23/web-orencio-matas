@echo off
setlocal enabledelayedexpansion
title Orencio Matas - Herramientas de imagenes de producto
cd /d "%~dp0"

echo Iniciando script...
echo.

REM ============================================================
REM  Lanzador de herramientas de busqueda de imagenes
REM  - normalizar.py            (prueba de normalizacion de nombres)
REM  - titan_buscar_imagenes.py (matching + descarga area PINTURAS)
REM ============================================================

REM -- Localizar interprete de Python (sin bloques anidados, mas robusto) --
set "PYEXE="

where py >nul 2>&1
if errorlevel 1 goto probar_python
py -3 -c "print(1)" >nul 2>&1
if errorlevel 1 goto probar_python
set "PYEXE=py -3"
goto python_encontrado

:probar_python
where python >nul 2>&1
if errorlevel 1 goto python_no_encontrado
python -c "print(1)" >nul 2>&1
if errorlevel 1 goto python_no_encontrado
set "PYEXE=python"
goto python_encontrado

:python_no_encontrado
echo.
echo [ERROR] No se ha podido ejecutar Python en este equipo.
echo         Puede que este instalado pero roto (reinstalacion a medias,
echo         antivirus que puso en cuarentena python.exe, etc.)
echo.
echo         Prueba a reparar/reinstalar Python desde:
echo         https://www.python.org/downloads/
echo         (elige "Modify" o desinstala y vuelve a instalar).
echo         Marca "Add python.exe to PATH" durante la instalacion.
echo.
pause
exit /b 1

:python_encontrado
echo Python encontrado y funcional: %PYEXE%
echo.

REM -- Instalar dependencias directamente (sin entorno virtual) --
%PYEXE% -c "import requests, bs4" >nul 2>&1
if errorlevel 1 goto instalar_dependencias
goto dependencias_listas

:instalar_dependencias
echo Instalando dependencias (requests, beautifulsoup4)...
%PYEXE% -m pip install --user --upgrade pip >nul 2>&1
%PYEXE% -m pip install --user -r requirements.txt
if errorlevel 1 goto error_dependencias
echo Dependencias instaladas correctamente.
echo.
goto dependencias_listas

:error_dependencias
echo.
echo [ERROR] Fallo instalando dependencias con --user.
echo         Prueba a ejecutar manualmente en esta misma carpeta:
echo         %PYEXE% -m pip install --user -r requirements.txt
echo         y revisa el mensaje de error completo.
echo.
pause
exit /b 1

:dependencias_listas

REM -- Localizar productos.json (se recuerda en config_ruta.txt) --
set "RUTA_PRODUCTOS="
if exist "config_ruta.txt" (
    set /p RUTA_PRODUCTOS=<config_ruta.txt
)

if "%RUTA_PRODUCTOS%"=="" (
    if exist "..\data\productos.json" (
        set "RUTA_PRODUCTOS=..\data\productos.json"
    )
)

:preguntar_ruta
if "%RUTA_PRODUCTOS%"=="" (
    echo.
    echo No encuentro productos.json automaticamente.
    set /p RUTA_PRODUCTOS="Introduce la ruta completa a productos.json: "
)
if not exist "%RUTA_PRODUCTOS%" (
    echo [ERROR] No existe el fichero: %RUTA_PRODUCTOS%
    set "RUTA_PRODUCTOS="
    goto preguntar_ruta
)
> config_ruta.txt echo %RUTA_PRODUCTOS%

:menu
cls
echo ============================================================
echo   Orencio Matas y Hnos - Herramientas de imagenes de producto
echo ============================================================
echo   productos.json en uso: %RUTA_PRODUCTOS%
echo ------------------------------------------------------------
echo   1. Probar normalizacion de nombres (ejemplos rapidos)
echo   2. PINTURAS - prueba con 30 productos (recomendado primero)
echo   3. PINTURAS - ejecucion completa (todos los pendientes)
echo   4. Cambiar ruta de productos.json
echo   5. Generar galeria de revision visual (recomendado tras el 2 o el 3)
echo   6. Abrir carpeta de resultados
echo   7. Subir aprobadas a Drive y actualizar Sheet (simulacion)
echo   8. Subir aprobadas a Drive y actualizar Sheet (EJECUCION REAL)
echo ------------------------------------------------------------
echo   DROGUERIA / PERFUMERIA (via API, dominios de marca)
echo   9.  Prueba con la API (simulacion, no gasta cuota)
echo   10. Ejecutar busqueda real (usa cuota de la API, ver README)
echo   11. Generar galeria de revision (drogueria/perfumeria)
echo ------------------------------------------------------------
echo   12. Salir
echo ------------------------------------------------------------
set /p OPCION="Elige una opcion (1-12): "

if "%OPCION%"=="1" goto normalizar
if "%OPCION%"=="2" goto titan_prueba
if "%OPCION%"=="3" goto titan_completo
if "%OPCION%"=="4" goto cambiar_ruta
if "%OPCION%"=="5" goto generar_galeria
if "%OPCION%"=="6" goto abrir_resultados
if "%OPCION%"=="7" goto sync_simulacion
if "%OPCION%"=="8" goto sync_real
if "%OPCION%"=="9" goto api_dry_run
if "%OPCION%"=="10" goto api_real
if "%OPCION%"=="11" goto api_galeria
if "%OPCION%"=="12" goto fin
goto menu

:cambiar_ruta
set "RUTA_PRODUCTOS="
goto preguntar_ruta

:normalizar
echo.
%PYEXE% normalizar.py
echo.
pause
goto menu

:titan_prueba
echo.
echo Ejecutando prueba con 30 productos de pinturas...
echo (esto tarda unos minutos porque rastrea el servidor de Titan)
echo.
%PYEXE% titan_buscar_imagenes.py --productos "%RUTA_PRODUCTOS%" --min-score 55 --limite 30
echo.
echo Revisa el resultado en: imagenes_pendientes_revision\pinturas\revision_pinturas.csv
pause
goto menu

:titan_completo
echo.
echo ATENCION: esto procesara TODOS los productos de pinturas pendientes
echo de validar (puede ser un numero elevado) y puede tardar bastante.
set /p CONFIRMAR="Escribe SI para continuar: "
if /i not "%CONFIRMAR%"=="SI" goto menu
echo.
%PYEXE% titan_buscar_imagenes.py --productos "%RUTA_PRODUCTOS%" --min-score 55
echo.
echo Revisa el resultado en: imagenes_pendientes_revision\pinturas\revision_pinturas.csv
pause
goto menu

:generar_galeria
echo.
%PYEXE% generar_revision_html.py --carpeta imagenes_pendientes_revision\pinturas
if exist "imagenes_pendientes_revision\pinturas\revision.html" (
    echo.
    echo Abriendo la galeria de revision en el navegador...
    start "" "imagenes_pendientes_revision\pinturas\revision.html"
)
echo.
pause
goto menu

:abrir_resultados
if not exist "imagenes_pendientes_revision" mkdir "imagenes_pendientes_revision"
start "" "imagenes_pendientes_revision"
goto menu

:sync_simulacion
echo.
echo Simulacion: no se sube ni borra ni toca el Sheet, solo muestra que haria.
%PYEXE% sincronizar_drive_sheet.py --csv imagenes_pendientes_revision\pinturas\aprobadas.csv --carpeta-imagenes imagenes_pendientes_revision\pinturas --dry-run
echo.
pause
goto menu

:sync_real
echo.
echo ATENCION: esto SUBE imagenes reales a Drive, papelera las antiguas
echo y actualiza el Google Sheet de Productos. Asegurate de haber revisado
echo antes con la opcion 7 (simulacion).
set /p CONFIRMAR="Escribe SI para continuar: "
if /i not "%CONFIRMAR%"=="SI" goto menu
echo.
%PYEXE% sincronizar_drive_sheet.py --csv imagenes_pendientes_revision\pinturas\aprobadas.csv --carpeta-imagenes imagenes_pendientes_revision\pinturas
echo.
pause
goto menu

:api_dry_run
echo.
%PYEXE% buscar_imagenes_api.py --productos "%RUTA_PRODUCTOS%" --limite 20 --dry-run
echo.
pause
goto menu

:api_real
echo.
echo ATENCION: esto consume cuota de la API de Google (100 gratis/dia).
set /p LIMITE_API="Cuantas consultas quieres hacer en esta ejecucion (ej. 90): "
%PYEXE% buscar_imagenes_api.py --productos "%RUTA_PRODUCTOS%" --limite %LIMITE_API%
echo.
echo Revisa el resultado en: imagenes_pendientes_revision\drogueria_perfumeria\imagenes_descargadas.csv
pause
goto menu

:api_galeria
echo.
%PYEXE% generar_revision_html.py --carpeta imagenes_pendientes_revision\drogueria_perfumeria
if exist "imagenes_pendientes_revision\drogueria_perfumeria\revision.html" (
    start "" "imagenes_pendientes_revision\drogueria_perfumeria\revision.html"
)
echo.
pause
goto menu

:fin
endlocal
exit /b 0
