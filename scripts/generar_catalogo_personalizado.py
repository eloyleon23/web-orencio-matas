#!/usr/bin/env python3
"""
Genera un catálogo PDF personalizado basado en los productos filtrados del buscador.
Lee los filtros y productos desde un archivo JSON y genera un PDF con ReportLab.
"""

import json
import os
import requests
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Configuración
OUTPUT_DIR = 'catalogos_output'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'catalogo_personalizado.pdf')

def cargar_productos():
    """Carga los productos desde data/productos.json"""
    with open('data/productos.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def filtrar_productos(productos, filtros):
    """Filtra productos según los criterios del usuario"""
    texto = filtros.get('texto', '').lower()
    area = filtros.get('area')
    familias = filtros.get('familias', [])
    p_min = filtros.get('precio_min')
    p_max = filtros.get('precio_max')
    solo_oferta = filtros.get('solo_oferta', False)
    
    # Si se proporcionan referencias específicas, usar solo esas
    refs = filtros.get('referencias', [])
    if refs:
        return [p for p in productos.get('productos', []) if p.get('ref') in refs]
    
    # Si no hay referencias, filtrar por criterios
    resultados = []
    for p in productos.get('productos', []):
        # Filtro por área
        if area and p.get('area') != area:
            continue
        
        # Filtro por familias
        if familias and p.get('familia') not in familias:
            continue
        
        # Filtro por oferta
        if solo_oferta and not p.get('oferta'):
            continue
        
        # Filtro por precio
        precio = float(p.get('precio_con', '0').replace(',', '.'))
        if p_min and precio < p_min:
            continue
        if p_max and precio > p_max:
            continue
        
        # Filtro por texto (nombre o referencia)
        if texto:
            nombre = p.get('nombre', '').lower()
            ref = p.get('ref', '').lower()
            if texto not in nombre and texto not in ref:
                continue
        
        resultados.append(p)
    
    return resultados

def crear_pdf(productos, filtros, output_file):
    """Crea el PDF con los productos filtrados"""
    doc = SimpleDocTemplate(
        output_file,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Estilo personalizado para el título
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#c0392b'),
        spaceAfter=20
    )
    
    # Portada
    story.append(Paragraph("Catálogo Personalizado", title_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Información de filtros aplicados
    filtros_texto = "<b>Filtros aplicados:</b><br/>"
    if filtros.get('texto'):
        filtros_texto += f"• Búsqueda: {filtros['texto']}<br/>"
    if filtros.get('area'):
        areas_nombre = {
            'drogueria': 'Droguería',
            'perfumeria': 'Perfumería',
            'pinturas': 'Pinturas',
            'talleres': 'Talleres'
        }
        filtros_texto += f"• Área: {areas_nombre.get(filtros['area'], filtros['area'])}<br/>"
    if filtros.get('familias'):
        filtros_texto += f"• Familias: {', '.join(filtros['familias'])}<br/>"
    if filtros.get('precio_min') or filtros.get('precio_max'):
        p_min = filtros.get('precio_min', '0')
        p_max = filtros.get('precio_max', 'sin límite')
        filtros_texto += f"• Rango de precio: {p_min}€ - {p_max}€<br/>"
    if filtros.get('solo_oferta'):
        filtros_texto += "• Solo productos en oferta<br/>"
    
    filtros_texto += f"<br/><b>Total de productos:</b> {len(productos)}"
    filtros_texto += f"<br/><b>Fecha de generación:</b> {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    
    story.append(Paragraph(filtros_texto, styles['Normal']))
    story.append(Spacer(1, 1*cm))
    
    # Disclaimer
    disclaimer = """
    <font color="#c0392b" size="10"><b>Nota importante:</b></font>
    <font size="9">
    Los precios pueden variar y los productos mostrados están sujetos a disponibilidad.
    Consulta con nuestro equipo para confirmar stock actual.
    </font>
    """
    story.append(Paragraph(disclaimer, styles['Normal']))
    story.append(Spacer(1, 1*cm))
    story.append(PageBreak())
    
    # Agrupar por familia
    productos_por_familia = {}
    for p in productos:
        familia = p.get('familia', 'Sin clasificar')
        if familia not in productos_por_familia:
            productos_por_familia[familia] = []
        productos_por_familia[familia].append(p)
    
    # Generar tabla por familia
    for familia, prods in productos_por_familia.items():
        # Título de familia
        story.append(Paragraph(f"<b>{familia}</b>", ParagraphStyle(
            'FamilyTitle',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=10
        )))
        
        # Tabla de productos
        data = [['Ref.', 'Nombre', 'Precio', 'Oferta']]
        for p in prods:
            ref = p.get('ref', '')
            nombre = p.get('nombre', '')
            precio = p.get('precio_con', '')
            oferta = '✓' if p.get('oferta') else ''
            data.append([ref, nombre, precio, oferta])
        
        table = Table(data, colWidths=[3*cm, 8*cm, 2*cm, 1.5*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#c0392b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.5*cm))
    
    # Footer final
    story.append(PageBreak())
    footer_text = """
    <center>
    <font size="10">
    <b>Orencio Matas y Hnos, S.L.</b><br/>
    Desde 1919 • Ciudad Real<br/><br/>
    Tel: 926 221 217<br/>
    Email: correo@orenciomatas.es<br/>
    Web: orenciomatas.es
    </font>
    </center>
    """
    story.append(Paragraph(footer_text, styles['Normal']))
    
    doc.build(story)
    print(f"PDF generado: {output_file}")
    return output_file

def main():
    """Función principal"""
    # Leer filtros desde argumento de línea de comandos o archivo JSON
    import sys
    
    if len(sys.argv) < 2:
        print("Uso: python generar_catalogo_personalizado.py <archivo_filtros.json>")
        sys.exit(1)
    
    filtros_file = sys.argv[1]
    
    # Cargar filtros
    with open(filtros_file, 'r', encoding='utf-8') as f:
        filtros = json.load(f)
    
    # Crear directorio de salida si no existe
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Cargar productos
    productos = cargar_productos()
    
    # Filtrar productos
    productos_filtrados = filtrar_productos(productos, filtros)
    
    print(f"Productos filtrados: {len(productos_filtrados)}")
    
    if len(productos_filtrados) == 0:
        print("No hay productos que coincidan con los filtros")
        sys.exit(1)
    
    # Crear PDF
    pdf_file = crear_pdf(productos_filtrados, filtros, OUTPUT_FILE)
    
    print(f"Catálogo personalizado generado exitosamente: {pdf_file}")

if __name__ == '__main__':
    main()
