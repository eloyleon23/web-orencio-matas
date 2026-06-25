from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from datetime import datetime

# Crear documento PDF
output_path = "docs/informe_desarrollo_web.pdf"
doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)

# Estilos
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=16,
    textColor=colors.black,
    alignment=1,  # center
    spaceAfter=20
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=12,
    textColor=colors.black,
    spaceAfter=10,
    spaceBefore=20
)

normal_style = ParagraphStyle(
    'CustomNormal',
    parent=styles['Normal'],
    fontSize=10,
    spaceAfter=6
)

content = []

# Título
content.append(Paragraph("INFORME DE DESARROLLO WEB", title_style))
content.append(Paragraph("ORENCIO MATAS Y HERMANOS, S.L.", title_style))
content.append(Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y')}", normal_style))
content.append(Spacer(1, 0.2*inch))

# Sección 1: Listado General
content.append(Paragraph("1. LISTADO GENERAL DE TRABAJOS REALIZADOS", heading_style))
general_tasks = [
    "Desarrollo de sitio web corporativo responsive",
    "Integración de Google Tag Manager (GTM)",
    "Implementación de banner de cookies con consentimiento",
    "Creación de páginas internas (Empresa, Servicios, Productos, Historia, Actualidad)",
    "Integración de Brevo para gestión de correos desde formulario de contacto",
    "Desarrollo de catálogos de productos por área (Droguería, Perfumería, Pinturas)",
    "Implementación de responsive design en todas las páginas",
    "Optimización SEO y accesibilidad"
]
for task in general_tasks:
    content.append(Paragraph(f"• {task}", normal_style))

content.append(Spacer(1, 0.1*inch))

# Sección 2: Trabajos por Página
content.append(Paragraph("2. TRABAJOS REALIZADOS POR PÁGINA", heading_style))
page_data = [
    ["Página", "Contenido"],
    ["INDEX", "Hero section, beneficios, categorías, profesionales B2B, marcas, contacto doble, footer"],
    ["EMPRESA", "Historia, trayectoria, valores, misión, equipo"],
    ["SERVICIOS", "Servicios principales, grid de partners, áreas de negocio"],
    ["PRODUCTOS", "Cuatro áreas, botones de catálogo, visualizador PDF, disclaimer disponibilidad"],
    ["HISTORIA", "Narrativa histórica, archivo documental, cronología, timeline"],
    ["ACTUALIDAD", "Canal Instagram, feed redes sociales, enlace perfil oficial"]
]
page_table = Table(page_data, colWidths=[2*inch, 4*inch])
page_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
]))
content.append(page_table)

content.append(Spacer(1, 0.1*inch))

# Sección 3: Integraciones
content.append(Paragraph("3. INTEGRACIONES Y CONFIGURACIONES", heading_style))
integrations = [
    "Google Tag Manager (GTM-TWX6NRXN)",
    "Brevo (Sendinblue) para gestión de correos",
    "Formulario de contacto con validación",
    "Banner de cookies con localStorage",
    "Analytics consent management",
    "Integración de redes sociales (Instagram)"
]
for integration in integrations:
    content.append(Paragraph(f"• {integration}", normal_style))

content.append(Spacer(1, 0.1*inch))

# Sección 4: Ajustes Técnicos
content.append(Paragraph("4. AJUSTES TÉCNICOS", heading_style))
technical = [
    "Responsive design mobile-first",
    "Optimización de imágenes",
    "CSS modular y maintainable",
    "JavaScript para interacciones",
    "Cross-browser compatibility",
    "Performance optimization",
    "Implementación de catálogos PDF por área",
    "Ajustes de scroll en visualizador PDF móvil",
    "Botón móvil alternativo para abrir PDF en nueva pestaña"
]
for tech in technical:
    content.append(Paragraph(f"• {tech}", normal_style))

content.append(Spacer(1, 0.1*inch))

# Sección 5: Ajustes de Contenido
content.append(Paragraph("5. AJUSTES DE CONTENIDO", heading_style))
content_adjustments = [
    "Redacción de textos corporativos",
    "Optimización de mensajes de marketing",
    "Adaptación de contenido SEO",
    "Creación de disclaimer de disponibilidad en catálogos",
    "División de catálogo PDF por áreas de negocio"
]
for adj in content_adjustments:
    content.append(Paragraph(f"• {adj}", normal_style))

content.append(Spacer(1, 0.1*inch))

# Sección 6: Desglose de Horas
content.append(Paragraph("6. DESGLOSE DE HORAS", heading_style))
hours_data = [
    ["Fase", "Horas", "Descripción"],
    ["Diseño y Planificación", "5 h", "Arquitectura, wireframes, estructura"],
    ["Desarrollo Frontend", "20 h", "HTML, CSS, JS, componentes, optimización"],
    ["Integraciones", "5 h", "GTM, Brevo, cookies, redes sociales"],
    ["Catálogos", "3 h", "División PDF, visualizador, responsive móvil"],
    ["Contenido y Ajustes", "2 h", "Redacción, SEO, disclaimers"],
    ["TOTAL", "35 h", ""]
]
hours_table = Table(hours_data, colWidths=[2*inch, 1*inch, 3*inch])
hours_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
    ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
]))
content.append(hours_table)

content.append(Spacer(1, 0.1*inch))

# Sección 7: Observaciones
content.append(Paragraph("7. OBSERVACIONES", heading_style))
content.append(Paragraph("El sitio web está completamente funcional y optimizado para dispositivos móviles. Se han implementado soluciones alternativas para visualización de PDF en móvil debido a limitaciones de navegadores móviles con iframes de PDF. La integración con Brevo permite gestión automatizada de correos desde el formulario de contacto. El banner de cookies cumple con normativa GDPR y almacena consentimiento en localStorage.", normal_style))

content.append(Spacer(1, 0.3*inch))

# Footer
content.append(Paragraph("ORENCIO MATAS Y HERMANOS, S.L.", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, alignment=1)))
content.append(Paragraph("Av. Alfred Nobel, 2 · 13005 Ciudad Real · 926 221 217 · correo@orenciomatas.es", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, alignment=1)))

# Generar PDF
doc.build(content)

print(f"Informe generado exitosamente: {output_path}")
