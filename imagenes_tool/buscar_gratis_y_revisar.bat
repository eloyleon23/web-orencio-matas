@echo off
setlocal enabledelayedexpansion
title Orencio Matas - Busqueda gratuita drogueria/perfumeria
cd /d "%~dp0"

echo Iniciando script...
echo.

REM ============================================================
REM  Lanzador rapido: git pull + busqueda gratuita (Babaria/Sora/
REM  Vijusa, 301 productos) + galeria de revision visual.
REM  Equivale a ejecutar a mano:
REM    git pull
REM    python buscar_imagenes_gratis.py --limite 301
REM    python generar_revision_html.py --carpeta imagenes_pendientes_revision\drogueria_perfumeria
REM ============================================================

REM -- Localizar interprete de Python --
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
echo [ERROR] No se ha encontrado Python instalado en este equipo.
echo         Descargalo desde https://www.python.org/downloads/
echo.
pause
exit /b 1

:python_encontrado
echo Python encontrado: %PYEXE%
echo.

REM -- Actualizar el repo (git pull), si esta carpeta forma parte de un repo git --
echo [1/3] Actualizando el repositorio local (git pull)...
where git >nul 2>&1
if errorlevel 1 (
    echo   Aviso: no se encuentra git en este equipo. Se omite la actualizacion
    echo   automatica - asegurate de tener la ultima version de los scripts
    echo   descargando el repo manualmente si hace falta.
    goto pull_hecho
)
if not exist "..\.git" (
    echo   Aviso: esta carpeta no parece ser un repositorio git ^(no hay ..\.git^).
    echo   Se omite el git pull - asegurate de tener los scripts actualizados
    echo   manualmente si hace falta.
    goto pull_hecho
)
pushd ..
git pull
popd
:pull_hecho
echo.

REM -- Comprobar dependencias minimas --
%PYEXE% -c "import requests" >nul 2>&1
if errorlevel 1 (
    echo [2/3] Instalando dependencias necesarias...
    %PYEXE% -m pip install --user -r requirements.txt
    echo.
)

REM -- Lanzar la busqueda gratuita (Babaria + Sora + Vijusa, 301 productos) --
echo [2/3] Buscando imagenes gratis ^(Babaria, Sora, Vijusa - 301 productos^)...
echo       Esto puede tardar varios minutos, hace una peticion por producto.
echo.
%PYEXE% buscar_imagenes_gratis.py --limite 301
echo.

REM -- Generar y abrir la galeria de revision --
echo [3/3] Generando galeria de revision visual...
%PYEXE% generar_revision_html.py --carpeta imagenes_pendientes_revision\drogueria_perfumeria
if exist "imagenes_pendientes_revision\drogueria_perfumeria\revision.html" (
    echo.
    echo Abriendo la galeria en el navegador...
    start "" "imagenes_pendientes_revision\drogueria_perfumeria\revision.html"
) else (
    echo.
    echo Aviso: no se genero revision.html - revisa si se descargo alguna imagen.
)

echo.
echo ============================================================
echo Proceso completado. Revisa la galeria, marca las que no valgan
echo y descarga "aprobadas.csv" cuando termines la revision.
echo ============================================================
echo.
pause
endlocal
exit /b 0
