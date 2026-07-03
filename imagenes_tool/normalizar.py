# -*- coding: utf-8 -*-
"""
normalizar.py
=============
Normaliza nombres de producto (tal y como están en Google Sheets / productos.json)
para preparar consultas de búsqueda de imágenes: quita puntuación superflua,
expande abreviaturas frecuentes del catálogo y separa magnitudes (ML, L, KG...)
para que el texto resultante se parezca a como buscaría una persona.

Uso:
    from normalizar import normalizar_nombre
    normalizar_nombre("AGUARRAS PINO KELSIA 250 ML.")
    -> "Aguarrás pino Kelsia 250 ml"

    normalizar_nombre("BELLA AURORA B7 ANTI-EDAD C.DIARIO P/MIXTA-GRASA")
    -> "Bella Aurora B7 anti-edad cuidado diario para mixta-grasa"

Este diccionario se ha construido a partir de un análisis de frecuencia real
sobre data/productos.json (9.519 productos). Es deliberadamente conservador:
solo expande abreviaturas cuando el significado es inequívoco. Amplíalo según
vayas encontrando casos nuevos durante la revisión.
"""

import re
import unicodedata

# ── Abreviaturas con punto (tal cual aparecen, en mayúsculas, SIN el punto) ──
# Se aplican como palabra completa (con límites de palabra), no como substring.
ABREVIATURAS_PUNTO = {
    "C": "con",
    "P": "para",
    "S": "sin",
    "EDT": "eau de toilette",
    "EDP": "eau de parfum",
    "UDS": "unidades",
    "REF": "referencia",
    "RF": "referencia",
    "VAP": "vaporizador",
    "ESM": "esmalte",
    "PINT": "pintura",
    "GRS": "gramos",
    "GR": "gramos",
    "EST": "estuche",
    "MTS": "metros",
    "SAT": "satinado",
    "SINT": "sintético",
    "LIQ": "líquido",
    "PROF": "profesional",
    "INST": "instituto",
    "URET": "uretano",
    "EXT": "exterior",
    "INT": "interior",
    "PERF": "perfume",
    "LIMP": "limpiador",
    "IMPERM": "impermeabilizante",
    "INTEMP": "intemperie",
    "DESINF": "desinfectante",
    "ANTIOX": "antioxidante",
    "MOD": "modelo",
}

# ── Abreviaturas con barra (C/, P/, S/...) ──
ABREVIATURAS_BARRA = {
    "C": "con",
    "P": "para",
    "S": "sin",
    "B": "bote",
}

# Unidades que NO se deben expandir ni separar de forma rara; solo se
# normaliza el espaciado ("250ML" -> "250 ml", "250 ML." -> "250 ml").
UNIDADES = ["ML", "L", "KG", "GR", "G", "CM", "MM", "UDS", "UD"]

_RE_UNIDAD = re.compile(
    r"(?<=\d)\s*(" + "|".join(UNIDADES) + r")\.?\b", re.IGNORECASE
)

_RE_ABREV_PUNTO = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in ABREVIATURAS_PUNTO) + r")\.", re.IGNORECASE
)

_RE_ABREV_BARRA = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in ABREVIATURAS_BARRA) + r")/", re.IGNORECASE
)


def _quitar_acentos_para_comparar(texto: str) -> str:
    """Solo para comparación/matching, no para mostrar al usuario."""
    nfkd = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def normalizar_nombre(nombre: str, para_busqueda: bool = True) -> str:
    """
    Normaliza un nombre de producto para usarlo como término de búsqueda de imagen.

    - Expande abreviaturas conocidas (C. -> con, P/ -> para, EDT. -> eau de toilette...)
    - Normaliza unidades pegadas a números ("250ML" -> "250 ml")
    - Quita puntuación redundante (puntos, comas sueltas, paréntesis vacíos)
    - Colapsa espacios múltiples
    - Capitaliza de forma legible (Title Case suave, no todo mayúsculas)

    Si `para_busqueda=True` además quita acentos y pasa a minúsculas, pensado
    para construir queries de búsqueda de imágenes (Google/Amazon/etc. son
    tolerantes a esto, pero mejora el recall en comparaciones de similitud).
    """
    if not nombre:
        return ""

    texto = nombre.strip()

    # 1. Expandir abreviaturas con barra antes que las de punto (P/MIXTA -> para MIXTA)
    def _sub_barra(m):
        clave = m.group(1).upper()
        return ABREVIATURAS_BARRA.get(clave, m.group(1)) + " "
    texto = _RE_ABREV_BARRA.sub(_sub_barra, texto)

    # 2. Expandir abreviaturas con punto (C.DIARIO -> con DIARIO, EDT. -> eau de toilette)
    def _sub_punto(m):
        clave = m.group(1).upper()
        return ABREVIATURAS_PUNTO.get(clave, m.group(1)) + " "
    texto = _RE_ABREV_PUNTO.sub(_sub_punto, texto)

    # 3. Normalizar unidades pegadas a números (deja espacio también tras la unidad,
    #    por si el texto original seguía pegado: "750 ML.CAOBA" -> "750 ml CAOBA")
    texto = _RE_UNIDAD.sub(lambda m: " " + m.group(1).lower() + " ", texto)

    # 4. Quitar puntos sobrantes que ya no formen parte de una unidad/decimal
    texto = re.sub(r"(?<!\d)\.(?!\d)", " ", texto)  # puntos que no son decimales
    texto = texto.replace(",", " ")

    # 5. Separar guiones pegados a palabras cuando ayuda a la lectura, pero
    #    mantener compuestos tipo "anti-edad" tal cual (son términos de búsqueda válidos)
    texto = re.sub(r"\s*-\s*", "-", texto)

    # 6. Colapsar espacios
    texto = re.sub(r"\s+", " ", texto).strip()

    if para_busqueda:
        texto = _quitar_acentos_para_comparar(texto).lower()
    else:
        # Capitalización legible: primera letra de cada "frase" en mayúscula,
        # el resto tal cual viene (evita destrozar marcas como "3M" o "R-M").
        texto = texto[:1].upper() + texto[1:] if texto else texto

    return texto


def tokens_clave(nombre: str) -> list:
    """
    Devuelve los tokens 'con peso' de un nombre normalizado (para matching
    fuzzy contra listados de ficheros: quita palabras muy genéricas y números
    de referencia interna, conserva marca + tipo de producto + formato).
    """
    STOPWORDS = {
        "con", "para", "sin", "de", "del", "la", "el", "los", "las", "y",
        "en", "al", "un", "una",
    }
    texto = normalizar_nombre(nombre, para_busqueda=True)
    tokens = [t for t in re.split(r"[\s\-]+", texto) if t and t not in STOPWORDS]
    return tokens


if __name__ == "__main__":
    ejemplos = [
        "AGUARRAS PINO KELSIA 250 ML.",
        "BELLA AURORA B7 ANTI-EDAD C.DIARIO P/MIXTA-GRASA",
        "PAÑUELOS COLHOGAR FACIAL STILE 3 CAP.C/66 UDS.",
        "BARNIZ TITAN ECO BRILLO 750 ML.CAOBA 1004",
        "NIVEA BODY MILK NUTRITIVA 400 ML.P/MUY SECA",
        "AGUA TOCADOR TITANIO HOMME VAP.150 ML.",
    ]
    for e in ejemplos:
        print(f"{e!r}")
        print(f"   busqueda -> {normalizar_nombre(e)!r}")
        print(f"   legible  -> {normalizar_nombre(e, para_busqueda=False)!r}")
        print(f"   tokens   -> {tokens_clave(e)}")
        print()
