@echo off
setlocal enabledelayedexpansion
title Orencio Matas - Procesar productos desde Excel
cd /d "%~dp0"

echo Iniciando script...
echo.

REM ============================================================
REM  Lanzador para procesar productos nuevos desde Excel
REM  - buscar_imagenes_excel.py (buscar y descargar imagenes)
REM  - subir_imagenes_validadas.py (subir a Drive y actualizar Sheet)
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
%PYEXE% -c "import requests, bs4, pandas, openpyxl" >nul 2>&1
if errorlevel 1 goto instalar_dependencias
goto dependencias_listas

:instalar_dependencias
echo Instalando dependencias (requests, beautifulsoup4, pandas, openpyxl)...
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

REM -- Localizar Excel (se recuerda en config_excel.txt) --
set "RUTA_EXCEL="
if exist "config_excel.txt" (
    set /p RUTA_EXCEL=<config_excel.txt
    REM Verificar que la ruta guardada sea un archivo, no un directorio
    if exist "%RUTA_EXCEL%" (
        if exist "%RUTA_EXCEL%\" (
            REM Es un directorio, no un archivo - resetear
            set "RUTA_EXCEL="
        )
    )
)

if "%RUTA_EXCEL%"=="" (
    echo.
    echo No hay configuracion previa de Excel.
)

:preguntar_excel
if "%RUTA_EXCEL%"=="" (
    echo.
    echo Archivos Excel disponibles en este directorio:
    dir *.xlsx /b 2>nul
    dir *.xls /b 2>nul
    echo.
    set /p RUTA_EXCEL="Introduce el nombre del archivo Excel (ej. productos_nuevos.xlsx): "
    REM Si el usuario no puso ruta completa, asumir que esta en el directorio actual
    if "%RUTA_EXCEL%" neq "" (
        if not exist "%RUTA_EXCEL%" (
            echo [ERROR] No existe el fichero: %RUTA_EXCEL%
            set "RUTA_EXCEL="
            goto preguntar_excel
        )
    )
)
if not exist "%RUTA_EXCEL%" (
    echo [ERROR] No existe el fichero: %RUTA_EXCEL%
    set "RUTA_EXCEL="
    goto preguntar_excel
)
REM Verificar que sea un archivo, no un directorio
if exist "%RUTA_EXCEL%\" (
    echo [ERROR] La ruta es un directorio, no un archivo Excel: %RUTA_EXCEL%
    set "RUTA_EXCEL="
    goto preguntar_excel
)
> config_excel.txt echo %RUTA_EXCEL%

REM -- Directorio de salida (se recuerda en config_salida.txt) --
set "DIR_SALIDA="
if exist "config_salida.txt" (
    set /p DIR_SALIDA=<config_salida.txt
)

if "%DIR_SALIDA%"=="" (
    set "DIR_SALIDA=imagenes_temp"
)

:menu
cls
echo ============================================================
echo   Orencio Matas y Hnos - Procesar productos desde Excel
echo ============================================================
echo   Excel en uso: %RUTA_EXCEL%
echo   Directorio salida: %DIR_SALIDA%
echo ------------------------------------------------------------
echo   PASO 1: Buscar y descargar imagenes
echo   1. Buscar imagenes (simulacion - no descarga)
echo   2. Buscar SOLO por descripcion (sin filtros, impreciso)
echo   3. Buscar imagenes con Unsplash API (gratuito, por descripcion)
echo   4. Buscar imagenes con Pexels API (gratuito, por descripcion)
echo   5. Buscar imagenes con Pixabay API (gratuito, por descripcion)
echo   6. Buscar imagenes con APIs especificas (gratuito, requiere marca)
echo   7. Buscar imagenes con Google API (mas preciso, requiere credenciales)
echo   8. Buscar imagenes con limite personalizado
echo   9. Cambiar archivo Excel
echo   10. Cambiar directorio de salida
echo ------------------------------------------------------------
echo   PASO 2: Revisar manualmente y subir a Drive
echo   11. Abrir directorio de salida (para revision manual)
echo   12. Subir validadas a Drive (simulacion)
echo   13. Subir validadas a Drive (EJECUCION REAL)
echo   14. Subir validadas con limite personalizado
echo ------------------------------------------------------------
echo   15. Salir
echo ------------------------------------------------------------
set /p OPCION="Elige una opcion (1-15): "

if "%OPCION%"=="1" goto buscar_sim
if "%OPCION%"=="2" goto buscar_descripcion
if "%OPCION%"=="3" goto buscar_unsplash
if "%OPCION%"=="4" goto buscar_pexels
if "%OPCION%"=="5" goto buscar_pixabay
if "%OPCION%"=="6" goto buscar_real
if "%OPCION%"=="7" goto buscar_google
if "%OPCION%"=="8" goto buscar_limite
if "%OPCION%"=="9" goto cambiar_excel
if "%OPCION%"=="10" goto cambiar_salida
if "%OPCION%"=="11" goto abrir_salida
if "%OPCION%"=="12" goto subir_sim
if "%OPCION%"=="13" goto subir_real
if "%OPCION%"=="14" goto subir_limite
if "%OPCION%"=="15" goto fin
goto menu

:cambiar_excel
set "RUTA_EXCEL="
goto preguntar_excel

:cambiar_salida
echo.
set /p DIR_SALIDA="Introduce el nombre del directorio de salida (ej. imagenes_temp): "
> config_salida.txt echo %DIR_SALIDA%
goto menu

:buscar_sim
echo.
echo Simulacion: muestra que haria sin descargar imagenes.
echo.
%PYEXE% buscar_imagenes_excel.py --excel "%RUTA_EXCEL%" --salida "%DIR_SALIDA%" --dry-run
echo.
pause
goto menu

:buscar_descripcion
echo.
echo Buscando y descargando imagenes SOLO por descripcion...
echo ADVERTENCIA: Este metodo es impreciso y requiere revision manual.
echo Busca en Bing Images sin filtros de dominio.
echo.
set /p CONFIRMAR="Escribe SI para continuar: "
if /i not "%CONFIRMAR%"=="SI" goto menu
echo.
%PYEXE% buscar_imagenes_descripcion.py --excel "%RUTA_EXCEL%" --salida imagenes_descripcion
echo.
echo Proceso completado.
echo IMPORTANTE: Revisa las imagenes manualmente en imagenes_descripcion\
echo Elimina las que no sean adecuadas antes de subir a Drive.
echo.
pause
goto menu

:buscar_unsplash
echo.
echo Buscando y descargando imagenes con Unsplash API...
echo NOTA: Requiere Access Key de Unsplash (gratuita en unsplash.com/developers)
echo Busca por descripcion completa del producto sin depender de dominios.
echo.
if not exist "unsplash_credentials.txt" (
    set /p UNSPLASH_KEY="Introduce tu Access Key de Unsplash: "
    > unsplash_credentials.txt echo %UNSPLASH_KEY%
) else (
    set /p UNSPLASH_KEY=<unsplash_credentials.txt
)
echo Usando Access Key: %UNSPLASH_KEY%
echo.
%PYEXE% buscar_imagenes_unsplash.py --excel "%RUTA_EXCEL%" --unsplash-key "%UNSPLASH_KEY%" --salida imagenes_unsplash
echo.
echo Proceso completado.
echo Revisa las imagenes en: imagenes_unsplash\
echo Elimina las que no sean adecuadas antes de subir a Drive.
echo.
pause
goto menu

:buscar_pexels
echo.
echo Buscando y descargando imagenes con Pexels API...
echo NOTA: Requiere API Key de Pexels (gratuita en pexels.com/api)
echo Busca por descripcion completa del producto sin depender de dominios.
echo.
if not exist "pexels_credentials.txt" (
    set /p PEXELS_KEY="Introduce tu API Key de Pexels: "
    > pexels_credentials.txt echo %PEXELS_KEY%
) else (
    set /p PEXELS_KEY=<pexels_credentials.txt
)
echo Usando API Key: %PEXELS_KEY%
echo.
%PYEXE% buscar_imagenes_pexels.py --excel "%RUTA_EXCEL%" --pexels-key "%PEXELS_KEY%" --salida imagenes_pexels
echo.
echo Proceso completado.
echo Revisa las imagenes en: imagenes_pexels\
echo Elimina las que no sean adecuadas antes de subir a Drive.
echo.
pause
goto menu

:buscar_pixabay
echo.
echo Buscando y descargando imagenes con Pixabay API...
echo NOTA: Requiere API Key de Pixabay (gratuita en pixabay.com/api/docs)
echo Busca por descripcion completa del producto sin depender de dominios.
echo.
if not exist "pixabay_credentials.txt" (
    set /p PIXABAY_KEY="Introduce tu API Key de Pixabay: "
    > pixabay_credentials.txt echo %PIXABAY_KEY%
) else (
    set /p PIXABAY_KEY=<pixabay_credentials.txt
)
echo Usando API Key: %PIXABAY_KEY%
echo.
%PYEXE% buscar_imagenes_pixabay.py --excel "%RUTA_EXCEL%" --pixabay-key "%PIXABAY_KEY%" --salida imagenes_pixabay
echo.
echo Proceso completado.
echo Revisa las imagenes en: imagenes_pixabay\
echo Elimina las que no sean adecuadas antes de subir a Drive.
echo.
pause
goto menu

:buscar_real
echo.
echo Buscando y descargando imagenes (solo APIs especificas)...
echo NOTA: Solo encontrara imagenes para productos con marca configurada.
echo Las imagenes se guardaran en: %DIR_SALIDA%\
echo.
%PYEXE% buscar_imagenes_excel.py --excel "%RUTA_EXCEL%" --salida "%DIR_SALIDA%"
echo.
echo Proceso completado.
echo Revisa las imagenes en: %DIR_SALIDA%\
echo Elimina las que no sean adecuadas antes de subir a Drive.
echo.
pause
goto menu

:buscar_google
echo.
echo Buscando y descargando imagenes con Google Custom Search API...
echo NOTA: Requiere google_search_credentials.json configurado.
echo Esto es MAS PRECISO pero consume cuota de la API (100 gratis/dia).
echo Las imagenes se guardaran en: %DIR_SALIDA%\
echo.
set /p CONFIRMAR="Escribe SI para continuar: "
if /i not "%CONFIRMAR%"=="SI" goto menu
echo.
%PYEXE% buscar_imagenes_excel.py --excel "%RUTA_EXCEL%" --salida "%DIR_SALIDA%" --usar-google-api
echo.
echo Proceso completado.
echo Revisa las imagenes en: %DIR_SALIDA%\
echo Elimina las que no sean adecuadas antes de subir a Drive.
echo.
pause
goto menu

:buscar_limite
echo.
set /p LIMITE="Introduce el limite de productos a procesar (0 = todos): "
%PYEXE% buscar_imagenes_excel.py --excel "%RUTA_EXCEL%" --salida "%DIR_SALIDA%" --limite %LIMITE%
echo.
pause
goto menu

:abrir_salida
if not exist "%DIR_SALIDA%" (
    echo.
    echo El directorio %DIR_SALIDA% no existe aun.
    echo Primero ejecuta la opcion 2 para buscar imagenes.
    echo.
    pause
    goto menu
)
echo.
echo Abriendo directorio: %DIR_SALIDA%\
echo.
echo INSTRUCCIONES:
echo 1. Revisa las imagenes descargadas
echo 2. Elimina las que no sean adecuadas
echo 3. Cierra el directorio cuando termines
echo 4. Usa la opcion 7 u 8 para subir las validadas a Drive
echo.
start "" "%DIR_SALIDA%"
pause
goto menu

:subir_sim
echo.
echo Simulacion: no sube nada a Drive ni toca el Sheet, solo muestra que haria.
echo.
%PYEXE% subir_imagenes_validadas.py --directorio "%DIR_SALIDA%" --csv "%DIR_SALIDA%\imagenes_descargadas.csv" --dry-run
echo.
pause
goto menu

:subir_real
echo.
echo ATENCION: esto SUBE imagenes reales a Drive, papelera las antiguas
echo y actualiza el Google Sheet de Productos.
echo.
echo Asegurate de:
echo 1. Haber revisado manualmente las imagenes en %DIR_SALIDA%\
echo 2. Haber eliminado las que no sean adecuadas
echo 3. Haber probado antes con la opcion 7 (simulacion)
echo.
set /p CONFIRMAR="Escribe SI para continuar: "
if /i not "%CONFIRMAR%"=="SI" goto menu
echo.
%PYEXE% subir_imagenes_validadas.py --directorio "%DIR_SALIDA%" --csv "%DIR_SALIDA%\imagenes_descargadas.csv"
echo.
pause
goto menu

:subir_limite
echo.
set /p LIMITE="Introduce el limite de productos a subir (0 = todos): "
%PYEXE% subir_imagenes_validadas.py --directorio "%DIR_SALIDA%" --csv "%DIR_SALIDA%\imagenes_descargadas.csv" --limite %LIMITE%
echo.
pause
goto menu

:fin
endlocal
exit /b 0
