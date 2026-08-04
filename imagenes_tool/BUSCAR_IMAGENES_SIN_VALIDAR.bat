@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo   BUSCAR IMAGENES - Productos sin foto validada (por area)
echo ============================================================
echo.
echo Este script busca automaticamente los 4 excels:
echo   ProductosSinFotoValidada_DROGUERIA.xlsx
echo   ProductosSinFotoValidada_PERFUMERIA.xlsx
echo   ProductosSinFotoValidada_PINTURAS.xlsx
echo   ProductosSinFotoValidada_TALLERES.xlsx
echo.
echo Droguer.a/Perfumer.a/Pinturas se procesan con buscar_imagenes_excel.py
echo (busca en webs de fabricante/tienda). Talleres se procesa con
echo casar_imagenes_talleres.py (casa contra las fotos YA extraidas de
echo vuestros catalogos de Zaphiro/Besa - es la via que de verdad funciona
echo para esta area, no la busqueda generica).
echo.
echo Los resultados de cada una quedan en "resultados_[AREA]" junto a
echo este .bat.
echo.
echo ============================================================
echo.

set ENCONTRADO=0

for %%A in (DROGUERIA PERFUMERIA PINTURAS TALLERES) do (
    set ARCHIVO=ProductosSinFotoValidada_%%A.xlsx
    if exist "!ARCHIVO!" (
        set ENCONTRADO=1
        echo.
        echo ------------------------------------------------------------
        echo   Procesando %%A  ^(!ARCHIVO!^)
        echo ------------------------------------------------------------
        if "%%A"=="TALLERES" (
            python casar_imagenes_talleres.py --excel "!ARCHIVO!" --salida "resultados_%%A"
        ) else (
            python buscar_imagenes_excel.py --excel "!ARCHIVO!" --salida "resultados_%%A" --debug
        )
        echo.
        echo   Terminado %%A. Resultados en: resultados_%%A\
        echo.
    ) else (
        echo   [Aviso] No encontrado: !ARCHIVO! ^(se omite^)
    )
)

echo.
echo ============================================================
if !ENCONTRADO! == 0 (
    echo   No se ha encontrado ninguno de los 4 excels esperados.
    echo   Comprueba que estan en esta misma carpeta ^(imagenes_tool^)
    echo   y que se llaman exactamente como se indica arriba.
) else (
    echo   Todo listo. Proximos pasos para cada area procesada:
    echo.
    echo   1^) Revisar visualmente lo encontrado:
    echo      python generar_revision_html.py --carpeta resultados_DROGUERIA
    echo      ^(y lo mismo cambiando DROGUERIA por cada area procesada^)
    echo.
    echo   2^) Subir a Drive lo ya revisado y aprobado:
    echo      python subir_imagenes_validadas.py --directorio resultados_DROGUERIA --csv resultados_DROGUERIA\imagenes_descargadas.csv
    echo      ^(y lo mismo para cada area^)
    echo.
    echo   IMPORTANTE para Talleres: aunque el nombre se parezca mucho, es
    echo   una foto de OTRO producto real ^(referencia distinta^) - revisa
    echo   que el envase/formato/color realmente coincida, sobre todo en
    echo   las de confianza media o baja.
)
echo ============================================================
echo.
pause
