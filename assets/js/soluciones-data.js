/**
 * CENTRO DE SOLUCIONES — datos mock
 * ─────────────────────────────────────────────────────────────────────────
 * Todo este archivo es DATOS DE PRUEBA (ficticios pero realistas), pensados
 * para demostrar el concepto y la arquitectura, no para usarse en producción
 * tal cual. Cuando se quiera conectar con el catálogo real:
 *
 *   - Cada "materialFase.familiaSugerida" y cada producto de
 *     recommendedProducts/alternativeProducts pasaría a resolverse contra
 *     productos.json real (por familia/subfamilia — ver
 *     contexto_proyecto_om_20082026.md) en vez de estar aquí escrito a mano.
 *   - Cada Solution es exactamente el modelo pedido:
 *     title, description, category, subcategory, problem, objective,
 *     surface, difficulty, estimatedTime, result, materials, steps,
 *     professionalTips, commonMistakes, recommendedProducts,
 *     alternativeProducts, relatedSolutions, seo.
 *   - Para SEO real, cada Solution generaría su propia página estática
 *     (mismo patrón que generar_catalogos.py: un script de pre-render
 *     recorrería este array y estamparía un .html por solución con su
 *     propio <title>/<meta description>/URL — hoy todas comparten
 *     soluciones/solucion.html?slug=... por simplicidad de prototipo).
 */
window.SOLUCIONES_DATA = (function () {

  // ── ¿Qué quieres hacer? ────────────────────────────────────────────────
  const acciones = [
    { id: 'pintar',    label: 'Pintar',                emoji: '🎨', color: 'red' },
    { id: 'reparar',   label: 'Reparar',                emoji: '🔧', color: 'blue' },
    { id: 'limpiar',   label: 'Limpiar',                emoji: '🧹', color: 'green' },
    { id: 'pulir',     label: 'Pulir',                  emoji: '✨', color: 'yellow' },
    { id: 'restaurar', label: 'Restaurar',              emoji: '🪵', color: 'blue' },
    { id: 'proteger',  label: 'Proteger',                emoji: '🛡️', color: 'green' },
    { id: 'preparar',  label: 'Preparar una superficie', emoji: '🔩', color: 'yellow' },
    { id: 'pegar',     label: 'Pegar y sellar',          emoji: '🧷', color: 'blue' },
    { id: 'acabado',   label: 'Conseguir un acabado',    emoji: '🎯', color: 'red' },
  ];

  // ── ¿Sobre qué quieres trabajar? ────────────────────────────────────────
  const superficies = [
    { id: 'coche',    label: 'Coche y carrocería', emoji: '🚗' },
    { id: 'madera',   label: 'Madera',              emoji: '🪵' },
    { id: 'metal',    label: 'Metal',                emoji: '🔩' },
    { id: 'pared',    label: 'Paredes',              emoji: '🧱' },
    { id: 'hogar',    label: 'Hogar',                emoji: '🏠' },
    { id: 'plastico', label: 'Plástico',              emoji: '🧩' },
    { id: 'suelo',    label: 'Suelo / garaje',         emoji: '🅿️' },
    { id: 'jardin',   label: 'Jardín',                 emoji: '🌱' },
    { id: 'piscina',  label: 'Piscina',                emoji: '🏊' },
    { id: 'otro',     label: 'Otro',                  emoji: '❔' },
  ];

  // Paso 3 del asistente: ¿cómo está la superficie ahora?
  const estados = [
    { id: 'sin_pintar', label: 'Sin pintar' },
    { id: 'pintada',    label: 'Ya está pintada' },
    { id: 'barnizada',  label: 'Barnizada' },
    { id: 'oxidada',    label: 'Oxidada' },
    { id: 'deteriorada',label: 'Deteriorada' },
  ];

  // Pasos 3-4 alternativos para acciones de mantenimiento simples
  const usos = [
    { id: 'interior', label: 'Interior' },
    { id: 'exterior', label: 'Exterior' },
  ];

  const tamanos = [
    { id: 'pequeno', label: 'Pequeño (hasta 2 m²)' },
    { id: 'mediano', label: 'Mediano (2-20 m²)' },
    { id: 'grande',  label: 'Grande (más de 20 m²)' },
  ];

  // Paso 4 del asistente: ¿qué resultado quieres?
  const resultados = [
    { id: 'cambiar_color',      label: 'Cambiar el color' },
    { id: 'reparar',            label: 'Reparar un desperfecto' },
    { id: 'proteger',           label: 'Proteger la superficie' },
    { id: 'recuperar_brillo',   label: 'Recuperar el brillo' },
    { id: 'restaurar',          label: 'Restaurar por completo' },
  ];

  // ── Problemas frecuentes (texto libre + chips rápidos) ─────────────────
  const problemasFrecuentes = [
    { id: 'no_adhiere',    label: 'La pintura no se adhiere',            solutionSlug: 'pintar-plastico-coche' },
    { id: 'oxido',         label: 'Tengo óxido',                          solutionSlug: 'eliminar-oxido-metal' },
    { id: 'aranazos',      label: 'Tengo arañazos',                       solutionSlug: 'recuperar-brillo-carroceria' },
    { id: 'pegamento',     label: 'Tengo restos de pegamento',            solutionSlug: 'quitar-restos-pegamento' },
    { id: 'marcas_lijado', label: 'Hay marcas de lijado',                 solutionSlug: 'corregir-marcas-lijado' },
    { id: 'mal_acabado',   label: 'El acabado no ha quedado bien',        solutionSlug: 'restaurar-mueble-madera' },
    { id: 'descuelgue',    label: 'La pintura se descuelga',              solutionSlug: 'corregir-descuelgues-pintura' },
    { id: 'burbujas',      label: 'Han aparecido burbujas',                solutionSlug: 'restaurar-mueble-madera' },
    { id: 'blanquecino',   label: 'El barniz ha quedado blanquecino',     solutionSlug: 'restaurar-mueble-madera' },
    { id: 'quitar_pintura',label: 'Necesito quitar pintura',              solutionSlug: 'decapar-pintura-mueble' },
    { id: 'preparar_dudas',label: 'No sé cómo preparar la superficie',    solutionSlug: 'pintar-plastico-coche' },
    { id: 'moho_junta',    label: 'Tengo moho en las juntas del baño',    solutionSlug: 'sellar-juntas-bano' },
    { id: 'agua_turbia',   label: 'El agua de la piscina está turbia',    solutionSlug: 'mantenimiento-piscina' },
    { id: 'cucarachas',    label: 'Tengo cucarachas u hormigas',          solutionSlug: 'control-plagas-cocina' },
    { id: 'suelo_deteriorado', label: 'El suelo del garaje está deteriorado', solutionSlug: 'suelo-epoxi-garaje' },
    { id: 'pared_deteriorada', label: 'Quiero cambiar el color de una pared',  solutionSlug: 'pintar-pared-interior' },
    { id: 'tuberia_atascada',  label: 'Tengo una tubería atascada',           solutionSlug: 'desatascar-tuberia' },
    { id: 'suelo_opaco',       label: 'El suelo de mármol está opaco',        solutionSlug: 'abrillantar-suelo-marmol' },
    { id: 'mancha_ropa',       label: 'Tengo una mancha en la ropa',          solutionSlug: 'eliminar-manchas-ropa' },
    { id: 'ratones',           label: 'Tengo ratones o roedores',             solutionSlug: 'control-roedores' },
    { id: 'plantas_debiles',   label: 'Mis plantas necesitan abono',          solutionSlug: 'cuidado-plantas-jardin' },
    { id: 'polillas_ropa',     label: 'Tengo polillas en el armario',         solutionSlug: 'proteger-ropa-polillas' },
    { id: 'bajos_coche',       label: 'Quiero proteger los bajos del coche',  solutionSlug: 'proteger-bajos-antigravilla' },
    { id: 'luna_rota',         label: 'Se me ha descolado el parabrisas',     solutionSlug: 'sellar-luna-parabrisas' },
    { id: 'goteras',           label: 'Tengo goteras o humedades',            solutionSlug: 'impermeabilizar-terraza-goteras' },
    { id: 'fachada_deteriorada', label: 'La fachada está deteriorada',        solutionSlug: 'pintar-fachada-exterior' },
    { id: 'pintar_calor',     label: 'Necesito pintar algo que da calor',      solutionSlug: 'pintar-metal-calor' },
    { id: 'faros_opacos',     label: 'Los faros del coche están amarillentos', solutionSlug: 'restaurar-faros-coche' },
    { id: 'madera_exterior',  label: 'Quiero proteger un mueble de jardín',    solutionSlug: 'proteger-madera-exterior' },
    { id: 'pintar_azulejos',  label: 'Quiero pintar los azulejos del baño',   solutionSlug: 'pintar-azulejos' },
    { id: 'mosquitos',        label: 'Tengo mosquitos en casa',                solutionSlug: 'eliminar-mosquitos' },
    { id: 'suelo_madera_desgastado', label: 'El parquet está desgastado',      solutionSlug: 'barnizar-suelo-madera' },
    { id: 'elegir_pegamento', label: 'No sé qué pegamento usar',              solutionSlug: 'elegir-pegamento-material' },
    { id: 'pintar_llantas',   label: 'Quiero pintar las llantas del coche',    solutionSlug: 'pintar-llantas-coche' },
  ];

  // ── Explora por áreas (secciones con ejemplos de trabajos) ─────────────
  const areas = [
    {
      id: 'coche', label: 'Coche y carrocería', emoji: '🚗',
      ejemplos: [
        { title: 'Reparar un arañazo',                 solutionSlug: 'recuperar-brillo-carroceria' },
        { title: 'Pintar un paragolpes',                solutionSlug: 'pintar-plastico-coche' },
        { title: 'Pintar una pieza de plástico',        solutionSlug: 'pintar-plastico-coche' },
        { title: 'Pintar una llanta',                     solutionSlug: 'pintar-llantas-coche' },
        { title: 'Preparar una pieza antes de pintar',  solutionSlug: 'pintar-plastico-coche' },
        { title: 'Pulir la carrocería',                 solutionSlug: 'recuperar-brillo-carroceria' },
        { title: 'Recuperar el brillo',                 solutionSlug: 'recuperar-brillo-carroceria' },
        { title: 'Eliminar hologramas',                   solutionSlug: 'recuperar-brillo-carroceria' },
        { title: 'Eliminar marcas de lijado',            solutionSlug: 'corregir-marcas-lijado' },
        { title: 'Corregir un chorreado de pintura',      solutionSlug: 'corregir-descuelgues-pintura' },
        { title: 'Restaurar faros',                       solutionSlug: 'restaurar-faros-coche' },
        { title: 'Eliminar adhesivos',                    solutionSlug: 'quitar-restos-pegamento' },
        { title: 'Quitar restos de cola',                 solutionSlug: 'quitar-restos-pegamento' },
        { title: 'Eliminar óxido',                      solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Desengrasar una pieza',                solutionSlug: 'pintar-plastico-coche' },
        { title: 'Proteger los bajos del coche',        solutionSlug: 'proteger-bajos-antigravilla' },
        { title: 'Sellar o pegar una luna',              solutionSlug: 'sellar-luna-parabrisas' },
      ],
    },
    {
      id: 'pintura', label: 'Pintura y decoración', emoji: '🎨',
      ejemplos: [
        { title: 'Pintar una pared',                    solutionSlug: 'pintar-pared-interior' },
        { title: 'Cambiar el color de una habitación',  solutionSlug: 'pintar-pared-interior' },
        { title: 'Pintar sobre una pared ya pintada',   solutionSlug: 'pintar-pared-interior' },
        { title: 'Pintar sobre un color oscuro',        solutionSlug: 'pintar-pared-interior' },
        { title: 'Reparar grietas',                     solutionSlug: 'pintar-pared-interior' },
        { title: 'Tapar agujeros',                      solutionSlug: 'pintar-pared-interior' },
        { title: 'Preparar una pared',                  solutionSlug: 'pintar-pared-interior' },
        { title: 'Pintar azulejos',                      solutionSlug: 'pintar-azulejos' },
        { title: 'Pintar superficies difíciles',         solutionSlug: 'pintar-plastico-coche' },
        { title: 'Limpiar brochas',                      solutionSlug: 'pintar-pared-interior' },
        { title: 'Conseguir acabado mate',              solutionSlug: 'pintar-pared-interior' },
        { title: 'Conseguir acabado satinado',           solutionSlug: 'pintar-pared-interior' },
        { title: 'Conseguir acabado brillante',          solutionSlug: 'pintar-pared-interior' },
        { title: 'Pintar una fachada exterior',         solutionSlug: 'pintar-fachada-exterior' },
        { title: 'Reparar goteras o humedades',          solutionSlug: 'impermeabilizar-terraza-goteras' },
        { title: 'Impermeabilizar una terraza',           solutionSlug: 'impermeabilizar-terraza-goteras' },
      ],
    },
    {
      id: 'madera', label: 'Madera y restauración', emoji: '🪵',
      ejemplos: [
        { title: 'Pintar un mueble',                    solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Restaurar un mueble antiguo',         solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Cambiar el color',                     solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Barnizar una mesa',                   solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Eliminar barniz',                     solutionSlug: 'decapar-pintura-mueble' },
        { title: 'Pintar madera barnizada',             solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Proteger madera exterior',            solutionSlug: 'proteger-madera-exterior' },
        { title: 'Recuperar una superficie deteriorada',solutionSlug: 'restaurar-mueble-madera' },
      ],
    },
    {
      id: 'metal', label: 'Metal', emoji: '🔩',
      ejemplos: [
        { title: 'Eliminar óxido',                      solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Evitar que vuelva el óxido',           solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Pintar hierro',                        solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Pintar aluminio',                      solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Pintar estructuras metálicas',         solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Renovar una verja',                    solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Pintar radiadores',                    solutionSlug: 'pintar-metal-calor' },
        { title: 'Pintar estufas',                       solutionSlug: 'pintar-metal-calor' },
        { title: 'Pintar tubos de salida de humos',      solutionSlug: 'pintar-metal-calor' },
        { title: 'Preparar metal antes de pintar',       solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Proteger metal',                       solutionSlug: 'eliminar-oxido-metal' },
      ],
    },
    {
      id: 'limpieza', label: 'Limpieza y droguería', emoji: '🧹',
      ejemplos: [
        { title: 'Eliminar grasa',                       solutionSlug: 'pintar-plastico-coche' },
        { title: 'Eliminar pintura',                     solutionSlug: 'decapar-pintura-mueble' },
        { title: 'Quitar adhesivos',                     solutionSlug: 'quitar-restos-pegamento' },
        { title: 'Quitar silicona',                      solutionSlug: 'sellar-juntas-bano' },
        { title: 'Limpiar herramientas',                 solutionSlug: 'pintar-pared-interior' },
        { title: 'Desengrasar piezas',                   solutionSlug: 'pintar-plastico-coche' },
        { title: 'Limpiar maquinaria',                   solutionSlug: 'pintar-plastico-coche' },
        { title: 'Preparar una superficie',              solutionSlug: 'pintar-plastico-coche' },
        { title: 'Desatascar una tubería',               solutionSlug: 'desatascar-tuberia' },
        { title: 'Abrillantar un suelo de mármol',        solutionSlug: 'abrillantar-suelo-marmol' },
        { title: 'Quitar una mancha de la ropa',          solutionSlug: 'eliminar-manchas-ropa' },
      ],
    },
    {
      id: 'pegado', label: 'Pegado y sellado', emoji: '🧷',
      ejemplos: [
        { title: 'Sellar una junta de baño o cocina',   solutionSlug: 'sellar-juntas-bano' },
        { title: 'Quitar moho de una junta de silicona', solutionSlug: 'sellar-juntas-bano' },
        { title: 'Pegar una tubería de PVC',             solutionSlug: 'elegir-pegamento-material' },
        { title: 'Elegir el pegamento según el material', solutionSlug: 'elegir-pegamento-material' },
        { title: 'Pegar césped artificial',              solutionSlug: 'elegir-pegamento-material' },
        { title: 'Sellar una ventana o marco',           solutionSlug: 'sellar-juntas-bano' },
      ],
    },
    {
      id: 'suelos', label: 'Suelos y garajes', emoji: '🅿️',
      ejemplos: [
        { title: 'Pintar el suelo del garaje',           solutionSlug: 'suelo-epoxi-garaje' },
        { title: 'Proteger un suelo industrial',         solutionSlug: 'suelo-epoxi-garaje' },
        { title: 'Barnizar un suelo de madera',          solutionSlug: 'barnizar-suelo-madera' },
        { title: 'Reparar grietas en el suelo',          solutionSlug: 'suelo-epoxi-garaje' },
      ],
    },
    {
      id: 'piscinas', label: 'Piscinas', emoji: '🏊',
      ejemplos: [
        { title: 'Ajustar el pH del agua',               solutionSlug: 'mantenimiento-piscina' },
        { title: 'Eliminar algas',                       solutionSlug: 'mantenimiento-piscina' },
        { title: 'Clorar correctamente la piscina',      solutionSlug: 'mantenimiento-piscina' },
        { title: 'Preparar la piscina para el verano',  solutionSlug: 'mantenimiento-piscina' },
        { title: 'Invernar la piscina',                  solutionSlug: 'mantenimiento-piscina' },
      ],
    },
    {
      id: 'plagas', label: 'Plagas y control de insectos', emoji: '🐜',
      ejemplos: [
        { title: 'Eliminar cucarachas de la cocina',     solutionSlug: 'control-plagas-cocina' },
        { title: 'Acabar con las hormigas',              solutionSlug: 'control-plagas-cocina' },
        { title: 'Evitar que vuelvan los insectos',      solutionSlug: 'control-plagas-cocina' },
        { title: 'Eliminar mosquitos',                   solutionSlug: 'eliminar-mosquitos' },
        { title: 'Eliminar ratones o roedores',           solutionSlug: 'control-roedores' },
        { title: 'Proteger la ropa de las polillas',      solutionSlug: 'proteger-ropa-polillas' },
      ],
    },
    {
      id: 'jardin', label: 'Jardín y plantas', emoji: '🌱',
      ejemplos: [
        { title: 'Abonar las plantas del jardín',        solutionSlug: 'cuidado-plantas-jardin' },
        { title: 'Cuidar plantas de interior',           solutionSlug: 'cuidado-plantas-jardin' },
        { title: 'Proteger las plantas de insectos',     solutionSlug: 'cuidado-plantas-jardin' },
        { title: 'Curar heridas de poda',                solutionSlug: 'cuidado-plantas-jardin' },
        { title: 'Tratar un hongo en las plantas',       solutionSlug: 'cuidado-plantas-jardin' },
      ],
    },
  ];

  // ── Soluciones destacadas (para la home) ────────────────────────────────
  const solucionesDestacadas = [
    { slug: 'pintar-plastico-coche',     title: 'Cómo pintar una pieza de plástico de un coche', difficulty: 'Media', estimatedTime: '3-4 h + secado', emoji: '🚗' },
    { slug: 'recuperar-brillo-carroceria', title: 'Cómo reparar un arañazo de la carrocería',     difficulty: 'Media', estimatedTime: '1-2 h',          emoji: '🚗' },
    { slug: 'eliminar-oxido-metal',      title: 'Cómo eliminar óxido del metal',                 difficulty: 'Fácil', estimatedTime: '1 h',             emoji: '🔩' },
    { slug: 'restaurar-mueble-madera',   title: 'Cómo restaurar un mueble de madera',             difficulty: 'Media', estimatedTime: '1-2 días (secados)', emoji: '🪵' },
    { slug: 'sellar-juntas-bano',        title: 'Cómo sellar una junta de baño o cocina',         difficulty: 'Fácil', estimatedTime: '30-45 min + secado', emoji: '🧷' },
    { slug: 'suelo-epoxi-garaje',        title: 'Cómo pintar el suelo del garaje con epoxi',      difficulty: 'Media', estimatedTime: '1 día + curado',  emoji: '🅿️' },
    { slug: 'mantenimiento-piscina',     title: 'Cómo equilibrar el agua de la piscina',          difficulty: 'Fácil', estimatedTime: '30 min semanales', emoji: '🏊' },
    { slug: 'control-plagas-cocina',     title: 'Cómo eliminar cucarachas y hormigas',            difficulty: 'Fácil', estimatedTime: 'Resultado en 1-2 semanas', emoji: '🐜' },
    { slug: 'pintar-pared-interior',     title: 'Cómo pintar una pared por dentro',               difficulty: 'Fácil', estimatedTime: '1 día (2 manos)', emoji: '🎨' },
    { slug: 'desatascar-tuberia',        title: 'Cómo desatascar una tubería',                    difficulty: 'Fácil', estimatedTime: '15-30 min', emoji: '🚽' },
    { slug: 'cuidado-plantas-jardin',    title: 'Cómo abonar y cuidar las plantas del jardín',    difficulty: 'Fácil', estimatedTime: '20 min (rutina periódica)', emoji: '🌱' },
    { slug: 'proteger-bajos-antigravilla', title: 'Cómo proteger los bajos del coche',            difficulty: 'Media', estimatedTime: '1-2 h + secado', emoji: '🚗' },
    { slug: 'pintar-fachada-exterior',   title: 'Cómo pintar una fachada exterior',               difficulty: 'Media', estimatedTime: '2-3 días (según superficie)', emoji: '🏠' },
    { slug: 'impermeabilizar-terraza-goteras', title: 'Cómo impermeabilizar una terraza con goteras', difficulty: 'Media', estimatedTime: '1 día + secado', emoji: '☔' },
  ];

  // ── Soluciones completas ────────────────────────────────────────────────
  // Cada fase de "materials" podrá mapearse en el futuro a una familia real
  // del catálogo (familiaSugerida) — hoy solo orienta.
  const soluciones = {

    'pintar-plastico-coche': {
      slug: 'pintar-plastico-coche',
      title: 'Cómo pintar una pieza de plástico de un coche',
      description: 'Aprende a preparar, imprimar y pintar correctamente una pieza de plástico para conseguir un acabado duradero y uniforme.',
      category: 'coche', subcategory: 'Pintar plástico',
      problem: 'no_adhiere',
      objective: 'pintar',
      surface: 'plastico',
      difficulty: 'Media',
      estimatedTime: '3-4 h + tiempos de secado',
      result: 'Pieza pintada y protegida, con buen anclaje y sin descuelgues',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Pintar plástico'],
      materials: [
        { fase: 'Preparación',  familiaSugerida: 'Limpieza / Desengrasantes', items: ['Desengrasante profesional'] },
        { fase: 'Preparación',  familiaSugerida: 'Abrasivos',                 items: ['Abrasivo P800'] },
        { fase: 'Adherencia',   familiaSugerida: 'Promotores de adherencia',  items: ['Promotor de adherencia para plástico'] },
        { fase: 'Imprimación',  familiaSugerida: 'Aparejos / Imprimaciones',  items: ['Aparejo acrílico'] },
        { fase: 'Color',        familiaSugerida: 'Pinturas de carrocería',    items: ['Pintura para carrocería'] },
        { fase: 'Acabado',      familiaSugerida: 'Barnices',                  items: ['Barniz 2K'] },
      ],
      receta: [
        { fase: 'Limpiar',              emoji: '🧴' },
        { fase: 'Preparar',             emoji: '🪵' },
        { fase: 'Mejorar adherencia',   emoji: '🎨' },
        { fase: 'Igualar',              emoji: '🎨' },
        { fase: 'Pintar',               emoji: '🎨' },
        { fase: 'Proteger',             emoji: '✨' },
      ],
      steps: [
        {
          n: 1, title: 'Limpieza y desengrasado',
          text: 'Los plásticos automotrices suelen tener restos de silicona, cera o grasa de fábrica. Si no se eliminan antes de nada, ningún producto posterior se agarrará bien, por muy bueno que sea.',
          productos: ['Desengrasante profesional'],
        },
        {
          n: 2, title: 'Preparación de la superficie',
          text: 'Una lijada suave con un abrasivo de grano medio-fino crea el "anclaje" mecánico que necesita la pintura para adherirse. No hace falta llegar al plástico vivo, solo matear el brillo.',
          productos: ['Abrasivo P800'],
        },
        {
          n: 3, title: 'Promotor de adherencia',
          text: 'Los plásticos (sobre todo el PP, muy habitual en paragolpes) son químicamente difíciles de pintar sin ayuda. El promotor de adherencia es lo que realmente hace posible que el sistema de pintura se quede pegado con el tiempo.',
          productos: ['Promotor de adherencia para plástico'],
        },
        {
          n: 4, title: 'Imprimación / aparejo',
          text: 'Iguala el color de base, sella la superficie y da una base uniforme sobre la que trabajar el color — evita que se transparenten diferencias del plástico de debajo.',
          productos: ['Aparejo acrílico'],
        },
        {
          n: 5, title: 'Pintura',
          text: 'Aplica el color en manos finas y uniformes, respetando el tiempo de aireado entre manos que indique la ficha técnica del producto.',
          productos: ['Pintura para carrocería'],
        },
        {
          n: 6, title: 'Acabado y protección',
          text: 'El barniz no es solo brillo: protege el color de UV, lluvia ácida y microrrayado, y es lo que da la sensación de "acabado de fábrica".',
          productos: ['Barniz 2K'],
        },
      ],
      professionalTips: [
        'Antes de pintar, asegúrate de que la superficie está completamente limpia, seca y libre de contaminantes. Una buena preparación es tan importante como la propia pintura.',
      ],
      commonMistakes: [
        'No limpiar correctamente la superficie.',
        'Utilizar un abrasivo incorrecto.',
        'No respetar los tiempos de secado.',
        'Aplicar productos incompatibles entre sí.',
        'No preparar adecuadamente el plástico (saltarse el promotor de adherencia).',
        'Aplicar demasiada cantidad de producto en una sola mano.',
        'Pintar sobre una superficie contaminada (grasa, silicona, polvo).',
      ],
      recommendedProducts: [
        { nombre: 'Desengrasante profesional',            categoria: 'Limpieza',   formato: '1 L',  precio: '12,95 €' },
        { nombre: 'Abrasivo P800',                         categoria: 'Abrasivos',                  precio: '0,80 €' },
        { nombre: 'Promotor de adherencia para plástico',  categoria: 'Talleres',                    precio: '18,95 €' },
        { nombre: 'Aparejo acrílico',                      categoria: 'Talleres',                    precio: '24,95 €' },
        { nombre: 'Pintura para carrocería',                categoria: 'Talleres',                    precio: '29,95 €' },
        { nombre: 'Barniz 2K',                              categoria: 'Talleres',                    precio: '32,95 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción económica',      nombre: 'Aerosol plástico color + barniz 2 en 1', precio: '14,95 €' },
        { etiqueta: 'Opción profesional',    nombre: 'Sistema completo con catalizador de larga duración', precio: '89,95 €' },
        { etiqueta: 'Opción rápida',         nombre: 'Kit de retoque en spray (pieza pequeña)', precio: '19,95 €' },
        { etiqueta: 'Trabajos pequeños',     nombre: 'Bote de retoque + pincel', precio: '9,95 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal', 'recuperar-brillo-carroceria', 'corregir-marcas-lijado', 'corregir-descuelgues-pintura'],
      seo: {
        title: 'Cómo pintar plástico de coche | Guía paso a paso — Orencio Matas',
        description: 'Guía completa para pintar correctamente una pieza de plástico de un coche: preparación, promotor de adherencia, imprimación, pintura y barniz.',
      },
    },

    'eliminar-oxido-metal': {
      slug: 'eliminar-oxido-metal',
      title: 'Cómo eliminar óxido del metal',
      description: 'Elimina el óxido de una superficie metálica y protégela para que no vuelva a aparecer, con el sistema adecuado según el grado de oxidación.',
      category: 'metal', subcategory: 'Tratamiento de óxido',
      problem: 'oxido',
      objective: 'reparar',
      surface: 'metal',
      difficulty: 'Fácil',
      estimatedTime: '1 h + secado',
      result: 'Superficie metálica limpia de óxido, tratada y protegida',
      calculadoraCantidad: { rendimiento: 12, etiqueta: 'esmalte de metal' },
      breadcrumb: ['Centro de Soluciones', 'Metal', 'Eliminar óxido'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Abrasivos',            items: ['Cepillo de púas metálicas', 'Abrasivo grano grueso'] },
        { fase: 'Tratamiento', familiaSugerida: 'Convertidores de óxido', items: ['Convertidor de óxido'] },
        { fase: 'Imprimación', familiaSugerida: 'Imprimaciones antioxidantes', items: ['Imprimación antioxidante'] },
        { fase: 'Color',       familiaSugerida: 'Esmaltes para metal',   items: ['Esmalte para metal — acrílico (al agua) o sintético'] },
      ],
      receta: [
        { fase: 'Cepillar',   emoji: '🧽' },
        { fase: 'Convertir',  emoji: '🧪' },
        { fase: 'Imprimar',   emoji: '🎨' },
        { fase: 'Pintar',     emoji: '🎨' },
      ],
      steps: [
        { n: 1, title: 'Eliminación mecánica del óxido', text: 'Con cepillo de púas o abrasivo de grano grueso, retira todo el óxido suelto y descamado hasta llegar a metal sano o al menos muy adherido.', productos: ['Cepillo de púas metálicas', 'Abrasivo grano grueso'] },
        { n: 2, title: 'Convertidor de óxido', text: 'En zonas donde no se puede llegar a metal 100% limpio, un convertidor transforma químicamente el óxido restante en una capa estable sobre la que sí se puede pintar.', productos: ['Convertidor de óxido'] },
        { n: 3, title: 'Imprimación antioxidante', text: 'Sella la superficie y evita que la humedad vuelva a iniciar el proceso de oxidación por debajo de la pintura.', productos: ['Imprimación antioxidante'] },
        { n: 4, title: 'Elegir el tipo de esmalte', text: 'Antes de aplicar el color, decide entre esmalte acrílico (al agua) o sintético: el acrílico seca más rápido, huele mucho menos y se limpia con agua — buena opción para interiores o si vas a repetir manos el mismo día. El sintético (al disolvente) suele ofrecer un acabado algo más duro y resistente a la intemperie, a cambio de más olor y un secado más lento — mejor para exteriores muy expuestos o superficies de mucho uso.', productos: ['Esmalte acrílico al agua para metal (Oxiron Agua)', 'Esmalte sintético para metal (Oxiron / Hammerite)'] },
        { n: 5, title: 'Aplicar el esmalte', text: 'Aplica el esmalte elegido en manos finas y uniformes, respetando el tiempo de repintado indicado en el envase — aporta color y la segunda barrera de protección frente a la intemperie.', productos: [] },
      ],
      professionalTips: [
        'El óxido nunca "desaparece" solo con pintar encima — si no se trata primero, seguirá extendiéndose por debajo de la pintura nueva.',
        'Acrílico (al agua) o sintético no es solo cuestión de gusto: en exteriores muy expuestos (vallas, barandillas a la intemperie) el sintético suele aguantar mejor con el tiempo; en interiores o si el olor es un problema, el acrílico es la opción más práctica.',
      ],
      commonMistakes: [
        'Pintar directamente sobre óxido sin tratarlo.',
        'No dejar secar el convertidor de óxido el tiempo indicado.',
        'Mezclar manos de esmalte acrílico y sintético en la misma pieza sin dejar secar del todo entre una y otra.',
        'Olvidar los bordes y zonas ocultas, donde el óxido suele reaparecer antes.',
      ],
      recommendedProducts: [
        { nombre: 'Cepillo de púas metálicas', categoria: 'Herramientas', precio: '6,50 €' },
        { nombre: 'Abrasivo grano grueso',      categoria: 'Abrasivos',   precio: '1,10 €' },
        { nombre: 'Convertidor de óxido',       categoria: 'Talleres',    precio: '16,95 €' },
        { nombre: 'Imprimación antioxidante',   categoria: 'Talleres',    precio: '21,95 €' },
        { nombre: 'Oxiron Agua Liso Brillo Negro (esmalte acrílico, al agua)', categoria: 'Pinturas', formato: '750 ml', precio: '20,63 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Esmalte sintético (más resistente en exterior)', nombre: 'Oxiron Forja Negro (esmalte sintético al disolvente)', precio: '15,85 €' },
        { etiqueta: 'Opción profesional sintética', nombre: 'Hammerite Esmalte Liso Hierro y Óxido Negro 750 ml', precio: '17,67 €' },
        { etiqueta: 'Opción rápida',      nombre: 'Esmalte antioxidante 3 en 1 (imprimación + color en un paso)', precio: '19,95 €' },
        { etiqueta: 'Trabajos pequeños',  nombre: 'Aerosol antioxidante', precio: '8,95 €' },
      ],
      relatedSolutions: ['pintar-plastico-coche', 'restaurar-mueble-madera', 'quitar-restos-pegamento'],
      seo: {
        title: 'Cómo eliminar el óxido del metal | Guía — Orencio Matas',
        description: 'Cómo tratar y eliminar el óxido de una superficie metálica paso a paso, con convertidor, imprimación antioxidante y esmalte acrílico o sintético de acabado.',
      },
    },

    'restaurar-mueble-madera': {
      slug: 'restaurar-mueble-madera',
      title: 'Cómo restaurar un mueble de madera',
      description: 'Recupera un mueble antiguo o deteriorado: elimina el barniz viejo, repara la superficie y aplica un acabado nuevo duradero.',
      category: 'madera', subcategory: 'Restauración',
      problem: 'mal_acabado',
      objective: 'restaurar',
      surface: 'madera',
      difficulty: 'Media',
      estimatedTime: '1-2 días (por los secados)',
      result: 'Mueble restaurado, con superficie lisa y barniz o pintura nuevos',
      calculadoraCantidad: { rendimiento: 12, etiqueta: 'barniz' },
      colorChart: { label: 'Encuentra tu color en Titanlux (línea madera)', url: 'https://www.titanlux.es/', logo: 'https://static.titanlux.es/web/logo.png' },
      breadcrumb: ['Centro de Soluciones', 'Madera y restauración', 'Restaurar mueble'],
      materials: [
        { fase: 'Decapado',     familiaSugerida: 'Decapantes',  items: ['Decapante de barniz'] },
        { fase: 'Preparación',  familiaSugerida: 'Abrasivos',   items: ['Lija de grano medio', 'Lija de grano fino'] },
        { fase: 'Reparación',   familiaSugerida: 'Masillas para madera', items: ['Masilla para madera'] },
        { fase: 'Acabado',      familiaSugerida: 'Barnices',    items: ['Barniz para madera'] },
      ],
      receta: [
        { fase: 'Decapar',    emoji: '🧴' },
        { fase: 'Lijar',      emoji: '🪵' },
        { fase: 'Reparar',    emoji: '🔧' },
        { fase: 'Barnizar',   emoji: '✨' },
      ],
      steps: [
        { n: 1, title: 'Decapado del barniz antiguo', text: 'Elimina el barniz o pintura anterior con un decapante adecuado, dejando la madera desnuda y lista para trabajar.', productos: ['Decapante de barniz'] },
        { n: 2, title: 'Lijado', text: 'Empieza con grano medio para nivelar la superficie y termina con grano fino para dejarla lista para el acabado.', productos: ['Lija de grano medio', 'Lija de grano fino'] },
        { n: 3, title: 'Reparación de desperfectos', text: 'Rellena grietas, agujeros de clavo o golpes con masilla para madera antes del acabado final.', productos: ['Masilla para madera'] },
        { n: 4, title: 'Barnizado', text: 'Aplica el barniz en manos finas, lijando muy suavemente entre manos para un acabado profesional.', productos: ['Barniz para madera'] },
      ],
      professionalTips: [
        'El barniz blanquecino suele deberse a humedad atrapada durante el secado — trabaja siempre en un ambiente seco y con buena ventilación.',
      ],
      commonMistakes: [
        'No dejar secar bien el decapante antes de lijar.',
        'Saltarse el lijado fino final.',
        'No limpiar el polvo de lijado antes de barnizar.',
        'Aplicar el barniz en manos demasiado gruesas.',
        'Barnizar en un ambiente húmedo (causa del aspecto blanquecino).',
      ],
      recommendedProducts: [
        { nombre: 'Decapante de barniz',   categoria: 'Droguería',  precio: '15,95 €' },
        { nombre: 'Lija de grano medio',    categoria: 'Abrasivos',  precio: '0,90 €' },
        { nombre: 'Lija de grano fino',     categoria: 'Abrasivos',  precio: '0,90 €' },
        { nombre: 'Masilla para madera',    categoria: 'Pinturas',  precio: '9,95 €' },
        { nombre: 'Barniz para madera',     categoria: 'Pinturas',  precio: '22,95 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción rápida',      nombre: 'Barniz al agua secado rápido', precio: '19,95 €' },
        { etiqueta: 'Opción profesional', nombre: 'Sistema de tinte + barniz de poliuretano', precio: '38,95 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal', 'decapar-pintura-mueble'],
      seo: {
        title: 'Cómo restaurar un mueble de madera | Guía — Orencio Matas',
        description: 'Aprende a restaurar un mueble de madera antiguo o deteriorado: decapado, lijado, reparación de desperfectos y barnizado.',
      },
    },
    'recuperar-brillo-carroceria': {
      slug: 'recuperar-brillo-carroceria',
      title: 'Cómo reparar un arañazo y recuperar el brillo de la carrocería',
      description: 'Elimina pequeños arañazos superficiales y recupera el brillo original de la pintura sin necesidad de repintar toda la pieza.',
      category: 'coche', subcategory: 'Pulido y brillo',
      problem: 'aranazos',
      objective: 'pulir',
      surface: 'coche',
      difficulty: 'Media',
      estimatedTime: '1-2 h',
      result: 'Carrocería sin arañazos superficiales, con el brillo recuperado',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Pulido y brillo'],
      materials: [
        { fase: 'Limpieza',       familiaSugerida: 'Limpieza / Desengrasantes', items: ['Champú de lavado', 'Arcilla descontaminante'] },
        { fase: 'Evaluación',     familiaSugerida: 'Herramientas de medición',  items: ['Medidor de espesor de pintura (opcional)'] },
        { fase: 'Pulido',         familiaSugerida: 'Pulimentos',                items: ['Pasta de pulir de corte medio', 'Pulimento de acabado'] },
        { fase: 'Protección',     familiaSugerida: 'Ceras y selladores',        items: ['Cera o sellador de protección'] },
      ],
      receta: [
        { fase: 'Limpiar',        emoji: '🧴' },
        { fase: 'Descontaminar',  emoji: '🧽' },
        { fase: 'Pulir',          emoji: '✨' },
        { fase: 'Proteger',       emoji: '🛡️' },
      ],
      steps: [
        { n: 1, title: 'Limpieza', text: 'Lava la zona a fondo para que no quede ninguna partícula abrasiva (arena, polvo) que pueda generar más marcas durante el pulido.', productos: ['Champú de lavado'] },
        { n: 2, title: 'Descontaminación', text: 'Pasa una arcilla descontaminante para retirar partículas incrustadas en la pintura (alquitrán, restos industriales) que el lavado normal no quita.', productos: ['Arcilla descontaminante'] },
        { n: 3, title: 'Evaluación de la profundidad', text: 'Si el arañazo se nota al pasar la uña, probablemente ha llegado a la base de color y el pulido no bastará por sí solo — en ese caso hará falta un pequeño retoque de pintura antes de pulir.', productos: [] },
        { n: 4, title: 'Pulido', text: 'Trabaja primero con una pasta de corte medio para nivelar el arañazo, y termina con un pulimento de acabado para devolver el brillo final.', productos: ['Pasta de pulir de corte medio', 'Pulimento de acabado'] },
        { n: 5, title: 'Protección', text: 'Sella el trabajo con cera o un sellador sintético — además de proteger, hace que el brillo dure mucho más tiempo.', productos: ['Cera o sellador de protección'] },
      ],
      professionalTips: [
        'Si al pasar la uña notas el arañazo (no solo lo ves), es señal de que ha traspasado el barniz — en ese caso, pulir sin más no lo eliminará del todo.',
      ],
      commonMistakes: [
        'Pulir sin limpiar y descontaminar antes (genera microrrayado nuevo).',
        'Usar una pasta demasiado agresiva para el tipo de arañazo.',
        'Pulir en exceso sobre la misma zona, adelgazando demasiado el barniz.',
        'No proteger después de pulir — el brillo se pierde antes de lo esperado.',
      ],
      recommendedProducts: [
        { nombre: 'Champú de lavado',               categoria: 'Talleres',   precio: '9,95 €' },
        { nombre: 'Arcilla descontaminante',         categoria: 'Talleres',   precio: '14,95 €' },
        { nombre: 'Pasta de pulir de corte medio',   categoria: 'Talleres',   precio: '16,50 €' },
        { nombre: 'Pulimento de acabado',            categoria: 'Talleres',   precio: '15,95 €' },
        { nombre: 'Cera o sellador de protección',   categoria: 'Talleres',   precio: '19,95 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción rápida',      nombre: 'Pulimento todo en uno (corte + brillo + protección)', precio: '21,95 €' },
        { etiqueta: 'Trabajos pequeños',  nombre: 'Lápiz quitarrayas', precio: '7,95 €' },
      ],
      relatedSolutions: ['pintar-plastico-coche', 'eliminar-oxido-metal'],
      seo: {
        title: 'Cómo quitar arañazos y recuperar el brillo del coche | Orencio Matas',
        description: 'Guía para eliminar arañazos superficiales de la carrocería y recuperar el brillo original con pulimento, sin repintar la pieza.',
      },
    },

    'sellar-juntas-bano': {
      slug: 'sellar-juntas-bano',
      title: 'Cómo sellar una junta de baño o cocina',
      description: 'Elimina la silicona vieja o con moho y aplica un sellado nuevo, limpio y duradero, en juntas de bañera, plato de ducha o encimera.',
      category: 'pegado', subcategory: 'Sellado de juntas',
      problem: 'moho_junta',
      objective: 'pegar',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: '30-45 min + 24 h de curado',
      result: 'Junta sellada, sin moho y estanca al agua',
      breadcrumb: ['Centro de Soluciones', 'Pegado y sellado', 'Sellado de juntas'],
      materials: [
        { fase: 'Retirada',    familiaSugerida: 'Herramientas',              items: ['Rascador o cutter'] },
        { fase: 'Limpieza',    familiaSugerida: 'Limpieza / Desengrasantes', items: ['Alcohol o desengrasante'] },
        { fase: 'Sellado',     familiaSugerida: 'Siliconas y selladores',    items: ['Silicona sanitaria antimoho'] },
        { fase: 'Acabado',     familiaSugerida: 'Herramientas',              items: ['Espátula alisadora o cinta de carrocero'] },
      ],
      receta: [
        { fase: 'Retirar',  emoji: '🔪' },
        { fase: 'Limpiar',  emoji: '🧴' },
        { fase: 'Aplicar',  emoji: '🧷' },
        { fase: 'Alisar',   emoji: '✋' },
      ],
      steps: [
        { n: 1, title: 'Retirar la silicona vieja', text: 'Con un cutter o rascador, retira todo resto de silicona antigua y el moho acumulado. Cuanto más limpio quede el hueco, mejor se agarrará la silicona nueva.', productos: [] },
        { n: 2, title: 'Limpiar y secar la junta', text: 'Desengrasa con alcohol y deja secar completamente — la silicona no se adhiere bien sobre superficies húmedas, y por eso el sellado nuevo "falla" antes de tiempo si se salta este paso.', productos: ['Alcohol o desengrasante'] },
        { n: 3, title: 'Proteger los bordes (opcional)', text: 'Pega cinta de carrocero a ambos lados de la junta para conseguir un cordón recto y limpio, sin manchar los azulejos.', productos: [] },
        { n: 4, title: 'Aplicar la silicona', text: 'Aplica el cordón con la pistola en un movimiento continuo y a presión constante, sin parar a mitad de junta.', productos: ['Silicona sanitaria antimoho'] },
        { n: 5, title: 'Alisar el cordón', text: 'Alisa con una espátula o el dedo humedecido en agua con un poco de jabón, antes de que empiece a formar piel.', productos: [] },
        { n: 6, title: 'Retirar la cinta y dejar curar', text: 'Quita la cinta de carrocero inmediatamente después de alisar, y evita mojar la zona durante las primeras 24 horas.', productos: [] },
      ],
      professionalTips: [
        'La silicona "antimoho" lleva un fungicida que retrasa la reaparición del moho negro — pero solo funciona bien si la superficie estaba realmente limpia y seca antes de aplicarla, no encima de moho ya existente.',
      ],
      commonMistakes: [
        'Aplicar silicona nueva directamente sobre restos de silicona vieja o moho.',
        'No dejar secar la superficie después de limpiarla.',
        'No retirar la cinta de carrocero antes de que la silicona empiece a curar.',
        'Usar una silicona no apta para uso sanitario/húmedo en zonas de ducha o bañera.',
      ],
      recommendedProducts: [
        { nombre: 'CEYS Silicona Stop Moho Cartucho 280 ml Blanco', categoria: 'Droguería', formato: '280 ml', precio: '5,98 €' },
        { nombre: 'CEYS Silicona Stop Moho Tubo 125 ml Blanco',     categoria: 'Droguería', formato: '125 ml', precio: '5,02 €' },
        { nombre: 'Sellador Acrílico Blanco Baixens SA-37',         categoria: 'Droguería', formato: '310 ml', precio: '1,80 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción económica',   nombre: 'Sellaceys Silicona Cartucho 280 ml Translúcida', precio: '4,34 €' },
        { etiqueta: 'Opción rápida',      nombre: 'CEYS Sellaceys Cinta Selladora Hogar Blanco (sin pistola)', precio: '9,91 €' },
        { etiqueta: 'Trabajos pequeños',  nombre: 'Sellaceys Silicona Tubo 50 ml Blíster', precio: '2,48 €' },
      ],
      relatedSolutions: ['control-plagas-cocina'],
      seo: {
        title: 'Cómo sellar una junta de baño o cocina | Orencio Matas',
        description: 'Guía para retirar la silicona vieja o con moho y sellar correctamente una junta de baño o cocina, paso a paso.',
      },
    },

    'suelo-epoxi-garaje': {
      slug: 'suelo-epoxi-garaje',
      title: 'Cómo pintar el suelo del garaje con sistema epoxi',
      description: 'Protege un suelo de garaje, nave o taller con un sistema epoxi bicomponente resistente a aceites, químicos y al paso continuo de vehículos.',
      category: 'suelos', subcategory: 'Suelos técnicos',
      problem: 'suelo_deteriorado',
      objective: 'proteger',
      surface: 'suelo',
      difficulty: 'Media',
      estimatedTime: '1 día de aplicación + 3-7 días de curado antes del tráfico',
      result: 'Suelo protegido, con acabado uniforme resistente a aceites y desgaste',
      calculadoraCantidad: { rendimiento: 5, etiqueta: 'sistema epoxi de suelos' },
      colorChart: { label: 'Ver carta de colores TitanTech (sistema TitanColor: TT1 / RAL / NCS)', url: 'https://www.titantech.es/colores', logo: '../assets/proveedores/logo-titantech.jpg' },
      breadcrumb: ['Centro de Soluciones', 'Suelos y garajes', 'Suelos técnicos'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza / Desengrasantes',      items: ['Desengrasante industrial'] },
        { fase: 'Preparación', familiaSugerida: 'Abrasivos',                      items: ['Lijado mecánico del suelo (si hay pintura previa)'] },
        { fase: 'Aplicación',  familiaSugerida: 'Sistemas epoxi bicomponente',    items: ['Base epoxi + endurecedor (2 componentes)'] },
        { fase: 'Herramientas',familiaSugerida: 'Útiles de aplicación',           items: ['Rodillo de pelo corto'] },
      ],
      receta: [
        { fase: 'Limpiar',  emoji: '🧴' },
        { fase: 'Reparar',  emoji: '🔧' },
        { fase: 'Mezclar',  emoji: '🧪' },
        { fase: 'Aplicar',  emoji: '🎨' },
        { fase: 'Curar',    emoji: '⏳' },
      ],
      steps: [
        { n: 1, title: 'Limpieza y desengrasado a fondo', text: 'Los restos de aceite o grasa son la causa número uno de que un suelo epoxi se levante — hay que partir de una superficie realmente limpia.', productos: ['Desengrasante industrial'] },
        { n: 2, title: 'Reparación de grietas y desconchones', text: 'Repara cualquier grieta o zona suelta antes de aplicar el sistema — el epoxi no rellena ni corrige defectos importantes del soporte.', productos: [] },
        { n: 3, title: 'Mezcla del sistema bicomponente', text: 'Mezcla la base con su endurecedor en la proporción exacta indicada en la ficha técnica — no es un producto de un solo bote, la proporción es lo que activa el fraguado químico.', productos: ['Base epoxi + endurecedor (2 componentes)'] },
        { n: 4, title: 'Aplicación de la primera mano', text: 'Aplica con rodillo de pelo corto, trabajando por zonas dentro del "pot life" (tiempo útil de la mezcla ya activada) antes de que empiece a espesar.', productos: ['Rodillo de pelo corto'] },
        { n: 5, title: 'Segunda mano cruzada', text: 'Aplica la segunda mano en dirección cruzada respecto a la primera, respetando el tiempo de repintado indicado.', productos: [] },
        { n: 6, title: 'Curado antes de poner en servicio', text: 'Evita tráfico ligero durante 24h y tráfico pesado (coches) varios días — poner el suelo en servicio demasiado pronto es la causa más habitual de marcas y despegues tempranos.', productos: [] },
      ],
      professionalTips: [
        'Los sistemas epoxi bicomponente tienen un "pot life" limitado una vez mezclados — prepara solo la cantidad que puedas aplicar en ese tiempo, no toda la mezcla de golpe si la superficie es grande.',
      ],
      commonMistakes: [
        'No respetar la proporción exacta de base y endurecedor.',
        'Aplicar sobre un suelo con humedad o grasa residual.',
        'Mezclar más producto del que se puede aplicar dentro del pot life.',
        'Poner el suelo en servicio antes del tiempo de curado total indicado.',
      ],
      recommendedProducts: [
        { nombre: 'TITANTECH PXB-700 Base Epoxi Suelos 4 L Base Neutra', categoria: 'Talleres', formato: '4 L', precio: '72,93 €' },
        { nombre: 'TITANTECH PXB-700 Endurecedor Epoxi Suelos',          categoria: 'Talleres', formato: '1 L', precio: '15,55 €' },
        { nombre: 'TITANTECH PXB-700 Epoxi Suelos 15 L Base Neutra',     categoria: 'Talleres', formato: '15 L (superficies grandes)', precio: '253,56 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Uso sanitario/alimentario', nombre: 'Epoxi Suelos Sanitaria AQ.PXB-720 Blanco Base 4 L', precio: '97,27 €' },
        { etiqueta: 'Opción económica (superficie pequeña)', nombre: 'TITANTECH PXB-700 Epoxi Suelos 4 L Blanco', precio: '74,96 €' },
        { etiqueta: 'Sin epoxi (más sencillo)', nombre: 'Barniz Titán Suelos con Poliuretano Satinado 4 L Incoloro', precio: '75,98 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal'],
      seo: {
        title: 'Cómo pintar el suelo del garaje con epoxi | Orencio Matas',
        description: 'Guía para proteger un suelo de garaje o nave con sistema epoxi bicomponente: preparación, mezcla, aplicación y curado.',
      },
    },

    'mantenimiento-piscina': {
      slug: 'mantenimiento-piscina',
      title: 'Cómo equilibrar y mantener el agua de la piscina',
      description: 'Aprende a medir y ajustar el pH, clorar correctamente y prevenir las algas para mantener el agua de la piscina siempre clara.',
      category: 'piscinas', subcategory: 'Mantenimiento de agua',
      problem: 'agua_turbia',
      objective: 'limpiar',
      surface: 'piscina',
      difficulty: 'Fácil',
      estimatedTime: '30 min de mantenimiento semanal',
      result: 'Agua clara, equilibrada y protegida frente a algas',
      breadcrumb: ['Centro de Soluciones', 'Piscinas', 'Mantenimiento de agua'],
      materials: [
        { fase: 'Medición',    familiaSugerida: 'Análisis de agua',        items: ['Tiras analíticas o analizador de pH y cloro'] },
        { fase: 'Ajuste pH',   familiaSugerida: 'Reguladores de pH',       items: ['Reductor de pH', 'Incrementador de pH'] },
        { fase: 'Desinfección',familiaSugerida: 'Cloro para piscinas',     items: ['Cloro rápido (choque)', 'Cloro lento (mantenimiento)'] },
        { fase: 'Prevención',  familiaSugerida: 'Antialgas',               items: ['Antialgas líquido'] },
      ],
      receta: [
        { fase: 'Medir',      emoji: '🧪' },
        { fase: 'Ajustar pH', emoji: '⚖️' },
        { fase: 'Clorar',     emoji: '💧' },
        { fase: 'Prevenir',   emoji: '🛡️' },
      ],
      steps: [
        { n: 1, title: 'Medir pH y cloro', text: 'Antes de añadir cualquier producto, mide el agua con tiras analíticas o un analizador — todo lo que hagas después depende de este dato.', productos: ['Tiras analíticas o analizador de pH y cloro'] },
        { n: 2, title: 'Ajustar el pH', text: 'Lleva el pH al rango correcto (en torno a 7,2-7,6) con reductor o incrementador según el resultado de la medición — se ajusta SIEMPRE antes de clorar.', productos: ['Reductor de pH', 'Incrementador de pH'] },
        { n: 3, title: 'Clorar', text: 'Usa cloro rápido para choques puntuales (agua turbia, después de mucha afluencia de bañistas) y cloro lento para el mantenimiento continuo del día a día.', productos: ['Cloro rápido (choque)', 'Cloro lento (mantenimiento)'] },
        { n: 4, title: 'Prevenir algas', text: 'Aplica un antialgas de forma periódica, especialmente en la época de más calor, cuando las algas aparecen con más facilidad.', productos: ['Antialgas líquido'] },
        { n: 5, title: 'Confirmar al día siguiente', text: 'Repite la medición 24 horas después para confirmar que los valores se han estabilizado en el rango correcto.', productos: [] },
      ],
      professionalTips: [
        'Un pH incorrecto no solo irrita los ojos y la piel — también hace que el cloro deje de actuar correctamente, por eso el pH se ajusta siempre ANTES de clorar, nunca al revés.',
      ],
      commonMistakes: [
        'Clorar sin comprobar antes el pH.',
        'Mezclar productos químicos de piscina directamente entre sí.',
        'Bañarse inmediatamente después de un choque de cloro.',
        'No repetir la medición al día siguiente para confirmar el resultado.',
      ],
      recommendedProducts: [
        { nombre: 'Astralpool Tiras Analíticas 3 en 1, 50 uds',   categoria: 'Piscinas', formato: '50 uds', precio: '13,84 €' },
        { nombre: 'Astralpool Minus Reductor de pH Líquido',       categoria: 'Piscinas', formato: '10 L',  precio: '23,12 €' },
        { nombre: 'Astralpool Incrementador de pH',                categoria: 'Piscinas', formato: '5 kg',  precio: '12,64 €' },
        { nombre: 'Astralpool Cloro Rápido Granulado',              categoria: 'Piscinas', formato: '5 kg',  precio: '28,85 €' },
        { nombre: 'Astralpool Cloro Lento en Tableta',              categoria: 'Piscinas', formato: '5 kg',  precio: '33,93 €' },
        { nombre: 'Antialgas Líquido Astralpool',                   categoria: 'Piscinas', formato: '5 L',   precio: '10,04 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Todo en uno',       nombre: 'Astralpool Inverlong Dosificador Flotante Todo en 1', precio: '15,44 €' },
        { etiqueta: 'Opción profesional/comunidad', nombre: 'CTX 15 Reductor de pH Profesional 20 L', precio: '35,07 €' },
      ],
      relatedSolutions: [],
      seo: {
        title: 'Cómo mantener el agua de la piscina en buen estado | Orencio Matas',
        description: 'Guía de mantenimiento de piscinas: cómo medir y ajustar el pH, clorar correctamente y prevenir la aparición de algas.',
      },
    },

    'control-plagas-cocina': {
      slug: 'control-plagas-cocina',
      title: 'Cómo eliminar cucarachas y hormigas de la cocina',
      description: 'Combina cebo, barrera y sellado de entradas para eliminar cucarachas y hormigas de forma duradera, no solo puntual.',
      category: 'plagas', subcategory: 'Control de insectos',
      problem: 'cucarachas',
      objective: 'proteger',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: 'Resultado visible en 1-2 semanas',
      result: 'Cocina u hogar libre de cucarachas y hormigas, con las entradas selladas',
      breadcrumb: ['Centro de Soluciones', 'Plagas y control de insectos', 'Control de insectos'],
      materials: [
        { fase: 'Diagnóstico', familiaSugerida: '—',                    items: ['Identificar la zona de entrada o nido'] },
        { fase: 'Cebo',        familiaSugerida: 'Insecticidas en gel',  items: ['Cebo en gel para cucarachas', 'Cebo en gel para hormigas'] },
        { fase: 'Barrera',     familiaSugerida: 'Insecticidas',         items: ['Insecticida en polvo o spray de barrera'] },
        { fase: 'Prevención',  familiaSugerida: 'Siliconas y selladores', items: ['Sellado de rendijas (ver solución de sellado de juntas)'] },
      ],
      receta: [
        { fase: 'Localizar', emoji: '🔍' },
        { fase: 'Cebo',      emoji: '🎯' },
        { fase: 'Barrera',   emoji: '🛡️' },
        { fase: 'Sellar',    emoji: '🧷' },
      ],
      steps: [
        { n: 1, title: 'Localizar el punto de entrada', text: 'Busca grietas, tuberías o zonas húmedas cerca de agua y comida — ahí suele estar el origen real del problema, no solo donde ves los insectos.', productos: [] },
        { n: 2, title: 'Aplicar cebo en gel', text: 'Coloca el cebo en el recorrido habitual del insecto, nunca donde puedan tocarlo niños o mascotas, ni directamente sobre alimentos.', productos: ['Cebo en gel para cucarachas', 'Cebo en gel para hormigas'] },
        { n: 3, title: 'Reforzar con barrera', text: 'Aplica insecticida en polvo o spray en las zonas de paso — pero nunca directamente sobre el cebo, porque puede hacer que el insecto deje de tocarlo.', productos: ['Insecticida en polvo o spray de barrera'] },
        { n: 4, title: 'Esperar el resultado', text: 'El cebo en gel es de acción lenta a propósito: el insecto se lo lleva al nido y afecta a toda la colonia, no solo al que lo toca — por eso el resultado tarda 1-2 semanas en notarse del todo.', productos: [] },
        { n: 5, title: 'Sellar las entradas', text: 'Una vez controlada la plaga, sella las rendijas o grietas por donde entraban, para que no vuelvan a aparecer.', productos: [] },
      ],
      professionalTips: [
        'El cebo en gel funciona precisamente PORQUE es lento: un insecticida de contacto solo mata al que lo toca, mientras que el cebo se lleva al nido y afecta a toda la colonia — no lo combines con spray justo encima o dejará de resultar atractivo.',
      ],
      commonMistakes: [
        'Rociar spray directamente sobre el cebo en gel.',
        'Colocar cebo donde toca la comida o donde llegan niños o mascotas.',
        'Esperar resultados inmediatos con el cebo (tarda 1-2 semanas).',
        'No sellar las entradas una vez resuelto el problema, dejando la puerta abierta a que vuelvan.',
      ],
      recommendedProducts: [
        { nombre: 'Orion Cebo Matacucarachas Gel, B/3 uds',   categoria: 'Droguería', formato: '3 uds', precio: '2,29 €' },
        { nombre: 'Zum Gel Trampa contra las Hormigas',        categoria: 'Droguería',                  precio: '1,14 €' },
        { nombre: 'Cucal Insecticida en Polvo Cuca/Hormigas',  categoria: 'Droguería', formato: '200 g', precio: '3,56 €' },
        { nombre: 'Baygon Cucas y Hormigas',                    categoria: 'Droguería', formato: '600 ml', precio: '7,56 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción rápida (choque puntual)', nombre: 'Arrixaca Insecticida Cucarachas Spray 400 ml', precio: '2,49 €' },
        { etiqueta: 'Varias zonas de la casa',        nombre: 'Cucal Trampa Cucarachas Est. 6 uds + Trampa Hormigas Est. 2 uds', precio: '3,68 € + 2,23 €' },
      ],
      relatedSolutions: ['sellar-juntas-bano', 'control-roedores'],
      seo: {
        title: 'Cómo eliminar cucarachas y hormigas de la cocina | Orencio Matas',
        description: 'Guía para eliminar cucarachas y hormigas de forma duradera combinando cebo en gel, barrera de insecticida y sellado de entradas.',
      },
    },

    'pintar-pared-interior': {
      slug: 'pintar-pared-interior',
      title: 'Cómo pintar una pared por dentro',
      description: 'Prepara, imprima si hace falta y pinta una pared de interior para conseguir un color uniforme y un acabado duradero.',
      category: 'pintura', subcategory: 'Pintura de interior',
      problem: 'pared_deteriorada',
      objective: 'pintar',
      surface: 'pared',
      difficulty: 'Fácil',
      estimatedTime: '1 día (2 manos) + secado entre manos',
      result: 'Pared repintada, con color uniforme y buen acabado',
      calculadoraCantidad: { rendimiento: 10, etiqueta: 'pintura plástica' },
      colorChart: { label: 'Encuentra tu color en Titanpro (interior)', url: 'https://www.titanpro.es/es/colores', logo: '../assets/proveedores/LOGO-TITANPRO.png' },
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Pintura de interior'],
      materials: [
        { fase: 'Preparación',  familiaSugerida: 'Masillas',                  items: ['Masilla plástica', 'Lija fina'] },
        { fase: 'Imprimación',  familiaSugerida: 'Imprimaciones y aparejos',  items: ['Imprimación multiadherente (si hace falta)'] },
        { fase: 'Color',        familiaSugerida: 'Pinturas al agua',         items: ['Pintura plástica mate o satinada'] },
        { fase: 'Herramientas', familiaSugerida: 'Útiles de aplicación',     items: ['Rodillo', 'Brocha', 'Cinta de carrocero'] },
      ],
      receta: [
        { fase: 'Preparar', emoji: '🧱' },
        { fase: 'Proteger', emoji: '🧷' },
        { fase: 'Imprimar', emoji: '🎨' },
        { fase: 'Pintar',   emoji: '🖌️' },
      ],
      steps: [
        { n: 1, title: 'Preparar la superficie', text: 'Tapa agujeros y grietas con masilla plástica y, una vez seca, lija en seco para dejar la superficie lisa.', productos: ['Masilla plástica', 'Lija fina'] },
        { n: 2, title: 'Proteger la zona', text: 'Pega cinta de carrocero en marcos, rodapiés y enchufes antes de empezar, para un corte limpio sin manchar.', productos: ['Cinta de carrocero'] },
        { n: 3, title: 'Imprimar si hace falta', text: 'Sobre colores muy oscuros, superficies muy porosas o pintadas antes con esmalte brillante, una imprimación multiadherente evita que el color viejo transparente y mejora el agarre de la pintura nueva.', productos: ['Imprimación multiadherente (si hace falta)'] },
        { n: 4, title: 'Primera mano', text: 'Aplica con rodillo, rematando esquinas y bordes con brocha.', productos: ['Pintura plástica mate o satinada', 'Rodillo', 'Brocha'] },
        { n: 5, title: 'Segunda mano', text: 'Deja secar el tiempo indicado (normalmente 2-4 horas) y aplica la segunda mano en dirección cruzada respecto a la primera.', productos: [] },
        { n: 6, title: 'Retirar la cinta', text: 'Quita la cinta de carrocero antes de que la pintura termine de secar del todo, para conseguir un corte limpio sin arrancar pintura ya seca.', productos: [] },
      ],
      professionalTips: [
        'Sobre paredes con un color muy oscuro o pintadas antes con esmalte brillante, saltarse la imprimación es la causa más habitual de que "se transparente" el color viejo por muchas manos de pintura nueva que se apliquen.',
      ],
      commonMistakes: [
        'Pintar sin tapar antes agujeros o grietas.',
        'Aplicar la segunda mano sin esperar el secado completo de la primera.',
        'Saltarse la imprimación sobre colores oscuros o superficies brillantes.',
        'Retirar la cinta de carrocero demasiado tarde, arrancando pintura ya seca.',
      ],
      recommendedProducts: [
        { nombre: 'Masilla Plástica Kolman',                          categoria: 'Pinturas', formato: '250 ml', precio: '2,48 €' },
        { nombre: 'Imprimación Multiadherente al Agua Koman',         categoria: 'Pinturas', formato: '4 L',   precio: '46,63 €' },
        { nombre: 'TITANPRO P-40 P.Acrílica Premium Mate 15 L. Blanco', categoria: 'Pinturas', formato: '15 L',  precio: '66,03 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción económica (retoques)', nombre: 'Jamicolor Pintura Plástica Mate Int/Ext 750 ml Blanco', precio: '2,54 €' },
        { etiqueta: 'Mayor cobertura',              nombre: 'Gilmaplas Pintura Plástica Satinada Extra 15 L', precio: '65,88 €' },
      ],
      relatedSolutions: ['restaurar-mueble-madera'],
      seo: {
        title: 'Cómo pintar una pared por dentro | Orencio Matas',
        description: 'Guía para preparar, imprimar si hace falta, y pintar correctamente una pared de interior, con dos manos de pintura plástica.',
      },
    },

    'desatascar-tuberia': {
      slug: 'desatascar-tuberia',
      title: 'Cómo desatascar una tubería',
      description: 'Elige el desatascador adecuado según el tipo de atasco y recupera el flujo normal del agua sin dañar la tubería.',
      category: 'limpieza', subcategory: 'Desatascos',
      problem: 'tuberia_atascada',
      objective: 'reparar',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: '15-30 min (según producto, algunos requieren reposo)',
      result: 'Tubería desatascada y flujo de agua recuperado',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Desatascos'],
      materials: [
        { fase: 'Desatasco químico', familiaSugerida: 'Desatascadores', items: ['Gel o líquido desatascador'] },
        { fase: 'Mantenimiento',     familiaSugerida: 'Desatascadores', items: ['Activador biológico para fosas sépticas (si aplica)'] },
      ],
      receta: [
        { fase: 'Identificar', emoji: '🔍' },
        { fase: 'Verter',      emoji: '🧴' },
        { fase: 'Esperar',     emoji: '⏳' },
        { fase: 'Aclarar',     emoji: '💧' },
      ],
      steps: [
        { n: 1, title: 'Identificar el tipo de atasco', text: 'Un atasco de grasa o jabón (cocina, baño) no se trata igual que uno de sólidos (WC) — el producto adecuado cambia según el caso.', productos: [] },
        { n: 2, title: 'Verter el desatascador', text: 'Aplica el producto directamente en el desagüe, evitando salpicaduras sobre superficies o piel.', productos: ['Gel o líquido desatascador'] },
        { n: 3, title: 'Respetar el tiempo de actuación', text: 'Deja actuar el tiempo indicado en el envase — actuar antes de tiempo es la causa más habitual de que "no funcione".', productos: [] },
        { n: 4, title: 'Aclarar con agua abundante', text: 'Aclara con agua abundante, preferiblemente caliente, para arrastrar los restos ya disueltos.', productos: [] },
        { n: 5, title: 'Método mecánico si persiste', text: 'Si el atasco continúa, recurre a un método mecánico (sonda) antes de repetir el químico, para no acumular producto sin efecto.', productos: [] },
      ],
      professionalTips: [
        'Nunca mezcles dos desatascadores químicos diferentes en el mismo intento — la mezcla de este tipo de productos puede generar reacciones peligrosas, además de que casi nunca mejora el resultado.',
      ],
      commonMistakes: [
        'Mezclar distintos productos desatascadores entre sí.',
        'No respetar el tiempo de actuación indicado en el envase.',
        'Usar agua fría para aclarar en atascos de grasa (el agua caliente ayuda mucho más).',
        'Verter agua hirviendo directamente sobre tuberías de PVC (puede deformarlas).',
      ],
      recommendedProducts: [
        { nombre: 'Destop Turbo Desatascador Gel',   categoria: 'Droguería', formato: '1 L',    precio: '4,94 €' },
        { nombre: 'Dirna Desatascador Turbo',         categoria: 'Droguería', formato: '500 ml', precio: '2,09 €' },
        { nombre: 'Paso Desatascador Gel Profesional', categoria: 'Droguería', formato: '1 L',   precio: '5,84 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Concentrado',              nombre: 'Dirna Desatascador Concentrado Microperlas 375 g', precio: '1,88 €' },
        { etiqueta: 'Monodosis',                 nombre: 'Desatascador Arrixaca Monodosis 60 g', precio: '0,61 €' },
        { etiqueta: 'Mantenimiento fosas sépticas', nombre: 'M.P.L. Activador Fosas Sépticas 400 g', precio: '4,96 €' },
      ],
      relatedSolutions: [],
      seo: {
        title: 'Cómo desatascar una tubería | Orencio Matas',
        description: 'Guía para elegir el desatascador adecuado y desatascar correctamente una tubería de cocina, baño o WC.',
      },
    },

    'abrillantar-suelo-marmol': {
      slug: 'abrillantar-suelo-marmol',
      title: 'Cómo abrillantar un suelo de mármol o terrazo',
      description: 'Recupera el brillo de un suelo de mármol o terrazo opaco con una limpieza adecuada y un abrillantador específico.',
      category: 'limpieza', subcategory: 'Cuidado de suelos',
      problem: 'suelo_opaco',
      objective: 'pulir',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: '30-45 min + secado',
      result: 'Suelo de mármol o terrazo limpio y con el brillo recuperado',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Cuidado de suelos'],
      materials: [
        { fase: 'Limpieza previa', familiaSugerida: 'Limpieza de suelos', items: ['Limpiador neutro para suelos'] },
        { fase: 'Abrillantado',    familiaSugerida: 'Abrillantadores y ceras', items: ['Abrillantador líquido terrazo/mármol'] },
        { fase: 'Protección',      familiaSugerida: 'Abrillantadores y ceras', items: ['Cera incolora (opcional)'] },
      ],
      receta: [
        { fase: 'Limpiar',    emoji: '🧴' },
        { fase: 'Secar',      emoji: '☀️' },
        { fase: 'Abrillantar',emoji: '✨' },
        { fase: 'Repetir',    emoji: '🔁' },
      ],
      steps: [
        { n: 1, title: 'Limpieza previa', text: 'Barre y friega con un limpiador neutro — un limpiador ácido o muy agresivo puede dañar el mármol o el terrazo con el tiempo.', productos: ['Limpiador neutro para suelos'] },
        { n: 2, title: 'Secado completo', text: 'Deja secar completamente el suelo antes de aplicar el abrillantador — la humedad residual empeora el resultado.', productos: [] },
        { n: 3, title: 'Prueba en una zona pequeña', text: 'Aplica primero en una zona pequeña y poco visible para comprobar el resultado antes de hacer todo el suelo.', productos: [] },
        { n: 4, title: 'Aplicar el abrillantador', text: 'Extiende con mopa o paño, dejando actuar y secar sin pisar el tiempo indicado en el envase.', productos: ['Abrillantador líquido terrazo/mármol'] },
        { n: 5, title: 'Repetir periódicamente', text: 'El brillo es una capa que se va desgastando con el uso — repetir la aplicación de vez en cuando da mejor resultado que aplicar una capa muy gruesa de una sola vez.', productos: [] },
      ],
      professionalTips: [
        'El brillo de un abrillantador de suelos se desgasta con el uso diario — aplicar una capa fina cada cierto tiempo mantiene mejor el resultado que una capa muy gruesa una sola vez.',
      ],
      commonMistakes: [
        'Usar limpiadores ácidos o muy agresivos sobre mármol (lo puede opacar o dañar de forma permanente).',
        'Aplicar el abrillantador sobre suelo húmedo o mal aclarado.',
        'Pisar el suelo antes de que el abrillantador haya secado del todo.',
        'Aplicar una capa demasiado gruesa esperando que dure más (queda pegajosa).',
      ],
      recommendedProducts: [
        { nombre: 'Alex Abrillantador Terrazo/Mármol',   categoria: 'Droguería', formato: '1.500 ml', precio: '3,68 €' },
        { nombre: 'Alex Express Abrillantador Terrazo',   categoria: 'Droguería', formato: '750 ml',   precio: '2,69 €' },
        { nombre: 'Asevi Abrillantador de Suelos',        categoria: 'Droguería', formato: '1.100 ml', precio: '2,66 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción profesional', nombre: 'C-100 Thomil Renovador Limpiador Neutro Suelos Abrillantador 4 L', precio: '18,42 €' },
        { etiqueta: 'Protección extra',   nombre: 'Alex Cera Incolora 750 ml', precio: '3,68 €' },
      ],
      relatedSolutions: [],
      seo: {
        title: 'Cómo abrillantar un suelo de mármol o terrazo | Orencio Matas',
        description: 'Guía para limpiar y abrillantar correctamente un suelo de mármol o terrazo opaco, paso a paso.',
      },
    },

    'eliminar-manchas-ropa': {
      slug: 'eliminar-manchas-ropa',
      title: 'Cómo eliminar una mancha de la ropa',
      description: 'Identifica el tipo de mancha y trátala con el quitamanchas adecuado antes de lavar, para eliminarla sin dañar el tejido.',
      category: 'limpieza', subcategory: 'Cuidado de la ropa',
      problem: 'mancha_ropa',
      objective: 'limpiar',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: '10-15 min + lavado normal',
      result: 'Mancha eliminada sin dañar el tejido',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Cuidado de la ropa'],
      materials: [
        { fase: 'Diagnóstico', familiaSugerida: '—',              items: ['Identificar el tipo de mancha'] },
        { fase: 'Tratamiento', familiaSugerida: 'Quitamanchas',   items: ['Quitamanchas específico según el tipo'] },
        { fase: 'Lavado',      familiaSugerida: 'Detergentes ropa', items: ['Detergente habitual'] },
      ],
      receta: [
        { fase: 'Identificar', emoji: '🔍' },
        { fase: 'Aplicar',     emoji: '🧴' },
        { fase: 'Esperar',     emoji: '⏳' },
        { fase: 'Lavar',       emoji: '🧺' },
      ],
      steps: [
        { n: 1, title: 'Actuar cuanto antes', text: 'Cuanto más reciente esté la mancha, más fácil sale — no dejes que se seque del todo si puedes evitarlo.', productos: [] },
        { n: 2, title: 'Identificar el tipo de mancha', text: 'Hay quitamanchas específicos para grasa, sangre/leche, tinta u óxido — usar el genérico en una mancha muy concreta (como óxido) suele dar peor resultado que el específico.', productos: [] },
        { n: 3, title: 'Aplicar el quitamanchas', text: 'Aplica directamente sobre la zona, sin frotar en exceso — frotar puede extender la mancha o dañar la fibra.', productos: ['Quitamanchas específico según el tipo'] },
        { n: 4, title: 'Dejar actuar', text: 'Respeta el tiempo indicado en el envase antes de lavar la prenda.', productos: [] },
        { n: 5, title: 'Lavar y comprobar', text: 'Lava la prenda con normalidad y comprueba el resultado antes de secarla — el calor de la secadora puede fijar la mancha si no ha salido del todo.', productos: ['Detergente habitual'] },
      ],
      professionalTips: [
        'Nunca metas en la secadora una prenda con una mancha que no ha desaparecido del todo — el calor la fija de forma casi permanente, mientras que a temperatura ambiente casi siempre se le puede dar un segundo intento.',
      ],
      commonMistakes: [
        'Frotar con fuerza en vez de dejar actuar el producto.',
        'Usar un quitamanchas genérico para óxido o tinta, que necesitan productos específicos.',
        'Secar la prenda en secadora antes de comprobar que la mancha ha desaparecido.',
        'Mezclar quitamanchas con lejía en tejidos de color.',
      ],
      recommendedProducts: [
        { nombre: 'Beckman Quitamanchas Sangre&Leche',        categoria: 'Droguería', formato: '50 ml', precio: '2,09 €' },
        { nombre: 'Beckman Quitamanchas Tinta',                categoria: 'Droguería', formato: '50 ml', precio: '2,09 €' },
        { nombre: 'Blancotex S.O.S Quitamanchas Óxido',        categoria: 'Droguería', formato: '75 ml', precio: '2,60 €' },
        { nombre: 'Cebralin Quitamanchas Aceites y Grasas',    categoria: 'Droguería', formato: '200 ml', precio: '3,68 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Manchas resistentes', nombre: 'Cebralin Quitamanchas Resistentes Roll-on 150 ml', precio: '3,50 €' },
        { etiqueta: 'Tapicerías/sofás',    nombre: 'Espuma Limpiatapicerías Prof. Vinfer Spray 600 ml', precio: '3,30 €' },
      ],
      relatedSolutions: [],
      seo: {
        title: 'Cómo eliminar una mancha de la ropa | Orencio Matas',
        description: 'Guía para identificar el tipo de mancha y tratarla con el quitamanchas adecuado antes de lavar la prenda.',
      },
    },

    'control-roedores': {
      slug: 'control-roedores',
      title: 'Cómo eliminar ratones y roedores',
      description: 'Combina cebo raticida, trampas y sellado de entradas para eliminar ratones o roedores de forma duradera.',
      category: 'plagas', subcategory: 'Control de roedores',
      problem: 'ratones',
      objective: 'proteger',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: 'Resultado en 1-2 semanas',
      result: 'Hogar o nave libre de roedores, con las entradas selladas',
      breadcrumb: ['Centro de Soluciones', 'Plagas y control de insectos', 'Control de roedores'],
      materials: [
        { fase: 'Cebo',       familiaSugerida: 'Raticidas', items: ['Raticida en cebo o pasta'] },
        { fase: 'Trampas',    familiaSugerida: 'Raticidas', items: ['Trampa mecánica', 'Portacebos'] },
        { fase: 'Prevención', familiaSugerida: 'Siliconas y selladores', items: ['Sellado de rendijas y agujeros'] },
      ],
      receta: [
        { fase: 'Localizar', emoji: '🔍' },
        { fase: 'Cebar',     emoji: '🎯' },
        { fase: 'Revisar',   emoji: '🔁' },
        { fase: 'Sellar',    emoji: '🧷' },
      ],
      steps: [
        { n: 1, title: 'Localizar el recorrido', text: 'Busca excrementos, roeduras o el camino habitual junto a paredes — los roedores rara vez cruzan espacios abiertos, así que su recorrido suele ser muy predecible.', productos: [] },
        { n: 2, title: 'Colocar el cebo', text: 'Coloca el cebo raticida siempre dentro de un portacebos cerrado, fuera del alcance de niños y mascotas, en el recorrido detectado.', productos: ['Raticida en cebo o pasta', 'Portacebos'] },
        { n: 3, title: 'Reforzar con trampas', text: 'Añade trampas mecánicas en los puntos de paso más estrechos, como complemento al cebo.', productos: ['Trampa mecánica'] },
        { n: 4, title: 'Revisar y reponer', text: 'Revisa el cebo periódicamente — si no se toca en varios días, probablemente no está en el sitio correcto y conviene reubicarlo.', productos: [] },
        { n: 5, title: 'Sellar las entradas', text: 'Una vez controlada la plaga, sella los puntos de entrada para evitar que vuelvan a aparecer.', productos: [] },
      ],
      professionalTips: [
        'Los roedores son extremadamente desconfiados con objetos nuevos — no es raro que tarden varios días en acercarse al cebo o a la trampa la primera vez, no significa que no esté funcionando.',
      ],
      commonMistakes: [
        'Colocar el cebo sin portacebos, accesible a niños o mascotas.',
        'Colocarlo lejos del recorrido real del roedor, en medio de una habitación en vez de junto a las paredes.',
        'Retirar el cebo demasiado pronto por parecer que "no funciona".',
        'No sellar las entradas una vez resuelto el problema.',
      ],
      recommendedProducts: [
        { nombre: 'Nogat Raticida Estuche 6 sobres',   categoria: 'Droguería', formato: '10 g c/u', precio: '5,02 €' },
        { nombre: 'Portacebos P.K 078',                  categoria: 'Droguería',                     precio: '6,22 €' },
        { nombre: 'Racumin Raticida en Pasta',           categoria: 'Droguería', formato: '20x10 g', precio: '3,41 €' },
        { nombre: 'Ratibrom ¡Zas! Trampa Ratas',         categoria: 'Droguería',                     precio: '5,53 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Formato grande/nave', nombre: 'Nogat Raticida Grano Ratas Resist. 5x50 g', precio: '4,57 €' },
        { etiqueta: 'Cebo fresco',          nombre: 'Brody Cebo Fresco B/100 g', precio: '1,33 €' },
      ],
      relatedSolutions: ['sellar-juntas-bano', 'control-plagas-cocina', 'proteger-ropa-polillas'],
      seo: {
        title: 'Cómo eliminar ratones y roedores | Orencio Matas',
        description: 'Guía para eliminar ratones o roedores combinando cebo raticida, trampas mecánicas y sellado de puntos de entrada.',
      },
    },

    'cuidado-plantas-jardin': {
      slug: 'cuidado-plantas-jardin',
      title: 'Cómo abonar y cuidar las plantas del jardín',
      description: 'Aprende a abonar, tratar plagas y hongos, y curar heridas de poda para mantener las plantas del jardín o de interior sanas.',
      category: 'jardin', subcategory: 'Cuidado de plantas',
      problem: 'plantas_debiles',
      objective: 'proteger',
      surface: 'jardin',
      difficulty: 'Fácil',
      estimatedTime: '20 min, rutina periódica cada 15-30 días',
      result: 'Plantas más fuertes, protegidas de plagas y hongos',
      colorChart: { label: 'Catálogo de cuidado de plantas Compo', url: 'https://www.compo.es/' },
      breadcrumb: ['Centro de Soluciones', 'Jardín y plantas', 'Cuidado de plantas'],
      materials: [
        { fase: 'Nutrición',  familiaSugerida: 'Abonos y fertilizantes', items: ['Fertilizante líquido universal'] },
        { fase: 'Plagas',     familiaSugerida: 'Insecticidas de jardín', items: ['Insecticida polivalente de jardín'] },
        { fase: 'Hongos',     familiaSugerida: 'Fungicidas',             items: ['Fungicida'] },
        { fase: 'Poda',       familiaSugerida: 'Cuidado de plantas',     items: ['Pasta cicatrizante para cortes de poda'] },
      ],
      receta: [
        { fase: 'Abonar',   emoji: '🌿' },
        { fase: 'Vigilar',  emoji: '🔍' },
        { fase: 'Tratar',   emoji: '💧' },
        { fase: 'Podar',    emoji: '✂️' },
      ],
      steps: [
        { n: 1, title: 'Abonar de forma regular', text: 'Aplica un fertilizante líquido universal cada 15-30 días en época de crecimiento — una planta bien nutrida resiste mucho mejor plagas y enfermedades.', productos: ['Fertilizante líquido universal'] },
        { n: 2, title: 'Vigilar signos de plaga', text: 'Revisa el envés de las hojas periódicamente — pulgón, araña roja o cochinilla se detectan antes si se revisa con regularidad, no solo cuando ya se ve mucho daño.', productos: [] },
        { n: 3, title: 'Tratar insectos si aparecen', text: 'Aplica un insecticida polivalente de jardín en cuanto detectes plaga, tratando también el envés de las hojas, no solo la parte visible.', productos: ['Insecticida polivalente de jardín'] },
        { n: 4, title: 'Tratar hongos', text: 'Ante manchas, moho o podredumbre, aplica un fungicida — actúa mejor de forma preventiva o al primer síntoma que cuando el hongo ya está muy extendido.', productos: ['Fungicida'] },
        { n: 5, title: 'Curar heridas de poda', text: 'Tras podar ramas gruesas, sella el corte con pasta cicatrizante para evitar que entren hongos o insectos por la herida abierta.', productos: ['Pasta cicatrizante para cortes de poda'] },
      ],
      professionalTips: [
        'La mayoría de plagas de jardín se controlan mucho mejor detectadas a tiempo — revisar el envés de las hojas cada pocos días es más eficaz que tratar cuando la plaga ya está muy extendida.',
      ],
      commonMistakes: [
        'Abonar en exceso pensando que "más es mejor" (puede quemar la raíz).',
        'No revisar el envés de las hojas, donde suelen empezar las plagas.',
        'Aplicar fungicida cuando el hongo ya está muy avanzado, en vez de al primer síntoma.',
        'Podar ramas gruesas sin sellar después el corte.',
      ],
      recommendedProducts: [
        { nombre: 'Compo Fertilizante Líquido Universal', categoria: 'Droguería', formato: '1,3 L', precio: '7,04 €' },
        { nombre: 'Gesal Insecticida Polivalente',          categoria: 'Droguería', formato: '500 ml (pistola)', precio: '4,32 €' },
        { nombre: 'Humus HLH Equisetem Fungicida',          categoria: 'Droguería', formato: '1 L', precio: '7,62 €' },
        { nombre: 'Compo Pasta Cicatrizante',               categoria: 'Droguería', formato: '250 g', precio: '8,74 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Plantas verdes/interior', nombre: 'Compo Fertilizante Líquido Plantas Verdes 1,3 L', precio: '7,15 €' },
        { etiqueta: 'Formato pequeño',          nombre: 'Impex Abono Universal 1 L', precio: '4,73 €' },
        { etiqueta: 'Contra hormigas específico', nombre: 'Compo Insecticida Antihormigas 300 g', precio: '4,96 €' },
      ],
      relatedSolutions: [],
      seo: {
        title: 'Cómo abonar y cuidar las plantas del jardín | Orencio Matas',
        description: 'Guía para abonar, tratar plagas y hongos, y curar heridas de poda, y mantener las plantas del jardín sanas todo el año.',
      },
    },

    'proteger-ropa-polillas': {
      slug: 'proteger-ropa-polillas',
      title: 'Cómo proteger la ropa de las polillas',
      description: 'Protege armarios y guardarropas de las polillas de la ropa, deteniendo el problema antes de que aparezcan agujeros en los tejidos.',
      category: 'plagas', subcategory: 'Protección de la ropa',
      problem: 'polillas_ropa',
      objective: 'proteger',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: '15 min por armario',
      result: 'Ropa protegida frente a las polillas, sin agujeros nuevos',
      breadcrumb: ['Centro de Soluciones', 'Plagas y control de insectos', 'Protección de la ropa'],
      materials: [
        { fase: 'Limpieza previa', familiaSugerida: '—',                          items: ['Lavar/limpiar la ropa antes de guardarla'] },
        { fase: 'Protección',      familiaSugerida: 'Antipolillas',               items: ['Antipolilla colgador o bloques'] },
        { fase: 'Guardado',        familiaSugerida: 'Fundas guardarropa',         items: ['Funda o bolsa guardarropa'] },
      ],
      receta: [
        { fase: 'Limpiar',   emoji: '🧺' },
        { fase: 'Colgar',    emoji: '👔' },
        { fase: 'Guardar',   emoji: '📦' },
        { fase: 'Revisar',   emoji: '🔁' },
      ],
      steps: [
        { n: 1, title: 'Lavar antes de guardar', text: 'Las polillas se sienten atraídas por restos de sudor o suciedad en la ropa — guardar prendas ya limpias reduce mucho el riesgo, sobre todo en el cambio de temporada.', productos: [] },
        { n: 2, title: 'Colocar protección antipolilla', text: 'Cuelga o coloca los antipolillas (lavanda u otros aromas repelentes) entre la ropa, repartidos por todo el armario, no solo en un punto.', productos: ['Antipolilla colgador o bloques'] },
        { n: 3, title: 'Guardar en fundas cerradas', text: 'Para prendas delicadas o de temporada (lana, abrigos), usar una funda o bolsa guardarropa cerrada añade una barrera física extra.', productos: ['Funda o bolsa guardarropa'] },
        { n: 4, title: 'Revisar periódicamente', text: 'Comprueba cada cierto tiempo que las prendas guardadas no tengan agujeros nuevos ni presencia de larvas, sobre todo en prendas de lana poco usadas.', productos: [] },
        { n: 5, title: 'Reponer el antipolilla', text: 'Los repelentes pierden eficacia con el tiempo — repón o renueva cada temporada, no dejes el mismo colgador años seguidos.', productos: [] },
      ],
      professionalTips: [
        'Las polillas de la ropa se alimentan de fibras naturales con restos orgánicos (sudor, comida) — la mejor prevención no es solo el repelente, es guardar siempre la ropa limpia.',
      ],
      commonMistakes: [
        'Guardar ropa sin lavar de una temporada a otra.',
        'Colocar un único antipolilla en todo el armario en vez de repartirlos.',
        'No renovar el repelente cuando pierde el olor.',
        'No revisar las prendas guardadas hasta la siguiente temporada.',
      ],
      recommendedProducts: [
        { nombre: 'Bloom Antipolilla Colgador Lavanda',      categoria: 'Droguería', formato: 'Dúo', precio: '1,48 €' },
        { nombre: 'Antipolilla Paraflor Estuches',            categoria: 'Droguería', formato: '3 bloques', precio: '3,46 €' },
        { nombre: 'Guardarropa Bonodor Nº2',                   categoria: 'Droguería', formato: '65x125 cm, 5 uds', precio: '2,66 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Sin olor',           nombre: 'Esens-Sensitive Antipolilla S/Olor Colgador Dúo', precio: '2,24 €' },
        { etiqueta: 'Formato económico',  nombre: 'Bloom Antipolilla Bolitas B/24 uds Lavanda', precio: '0,63 €' },
        { etiqueta: 'Prenda individual',  nombre: 'Guardarropa Zidar Trajes 5 Bolsas 65x125 cm', precio: '0,82 €' },
      ],
      relatedSolutions: ['control-plagas-cocina', 'control-roedores'],
      seo: {
        title: 'Cómo proteger la ropa de las polillas | Orencio Matas',
        description: 'Guía para proteger armarios y guardarropas de las polillas de la ropa, antes de que aparezcan agujeros en los tejidos.',
      },
    },

    'proteger-bajos-antigravilla': {
      slug: 'proteger-bajos-antigravilla',
      title: 'Cómo proteger los bajos del coche con antigravilla',
      description: 'Aplica un tratamiento antigravilla en los bajos y pasos de rueda para proteger la chapa de golpes de piedras, sal y corrosión.',
      category: 'coche', subcategory: 'Protección de bajos',
      problem: 'bajos_coche',
      objective: 'proteger',
      surface: 'coche',
      difficulty: 'Media',
      estimatedTime: '1-2 h + secado',
      result: 'Bajos y pasos de rueda protegidos frente a golpes de gravilla y corrosión',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Protección de bajos'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza / Desengrasantes', items: ['Desengrasante'] },
        { fase: 'Enmascarado', familiaSugerida: 'Productos de enmascarado', items: ['Cinta y papel de enmascarar'] },
        { fase: 'Imprimación', familiaSugerida: 'Imprimaciones',            items: ['Imprimación chapa/cristal (si hay zonas con corrosión)'] },
        { fase: 'Aplicación',  familiaSugerida: 'Antigravillas y selladores', items: ['Antigravilla'] },
      ],
      receta: [
        { fase: 'Limpiar',    emoji: '🧴' },
        { fase: 'Enmascarar', emoji: '🧷' },
        { fase: 'Imprimar',   emoji: '🎨' },
        { fase: 'Aplicar',    emoji: '🛡️' },
      ],
      steps: [
        { n: 1, title: 'Limpiar y desengrasar', text: 'Los bajos acumulan grasa, barro y restos de sal — hay que partir de una superficie limpia para que la antigravilla se agarre bien.', productos: ['Desengrasante'] },
        { n: 2, title: 'Enmascarar zonas sensibles', text: 'Protege con cinta y papel las zonas que no se deben tratar (juntas de goma, tubos de escape, sensores).', productos: ['Cinta y papel de enmascarar'] },
        { n: 3, title: 'Imprimar si hay corrosión', text: 'En zonas con principio de óxido, aplica antes una imprimación para chapa — la antigravilla protege hacia adelante, pero no sustituye tratar un óxido ya existente.', productos: ['Imprimación chapa/cristal (si hay zonas con corrosión)'] },
        { n: 4, title: 'Aplicar la antigravilla', text: 'Aplica en capa uniforme sobre bajos y pasos de rueda, respetando la distancia de pulverización indicada en el envase.', productos: ['Antigravilla'] },
        { n: 5, title: 'Dejar secar antes de rodar', text: 'Respeta el tiempo de secado antes de mover el vehículo con normalidad, para que la capa no se manche ni se agriete nada más aplicada.', productos: [] },
      ],
      professionalTips: [
        'La antigravilla protege frente a nuevos impactos y humedad, pero no "repara" el óxido que ya existe — si hay corrosión avanzada, hay que tratarla antes con una imprimación adecuada.',
      ],
      commonMistakes: [
        'Aplicar antigravilla directamente sobre suciedad o grasa.',
        'No enmascarar juntas de goma, tubos de escape o sensores.',
        'Aplicar sobre óxido ya existente sin tratarlo antes.',
        'Mover el vehículo antes de que la antigravilla haya secado del todo.',
      ],
      recommendedProducts: [
        { nombre: 'Antigravilla Zaphiro Negro',           categoria: 'Talleres', formato: '1 L', precio: '8,08 €' },
        { nombre: 'Imprimación Chapa/Cristal Zaphiro',    categoria: 'Talleres', formato: '30 ml', precio: '6,67 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Color gris/bajos claros', nombre: 'Antigravilla Zaphiro Gris 1 L', precio: '7,48 €' },
        { etiqueta: 'Opción profesional',       nombre: 'Body Autoflex Special Antigravilla 1 L Negro', precio: '11,99 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal', 'sellar-luna-parabrisas'],
      seo: {
        title: 'Cómo proteger los bajos del coche con antigravilla | Orencio Matas',
        description: 'Guía para aplicar un tratamiento antigravilla en los bajos y pasos de rueda del coche, protegiendo la chapa de golpes y corrosión.',
      },
    },

    'sellar-luna-parabrisas': {
      slug: 'sellar-luna-parabrisas',
      title: 'Cómo sellar o pegar una luna de coche',
      description: 'Aplica correctamente el sistema adhesivo y sellador para pegar o sustituir un parabrisas o una luna lateral fija.',
      category: 'coche', subcategory: 'Sustitución de lunas',
      problem: 'luna_rota',
      objective: 'reparar',
      surface: 'coche',
      difficulty: 'Difícil',
      estimatedTime: '2-3 h + tiempo de curado del adhesivo antes de rodar',
      result: 'Luna correctamente pegada y sellada, sin fugas de aire ni agua',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Sustitución de lunas'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza / Desengrasantes', items: ['Desengrasante para cristal y marco'] },
        { fase: 'Imprimación', familiaSugerida: 'Imprimaciones',            items: ['Imprimación chapa/cristal'] },
        { fase: 'Adhesivo',    familiaSugerida: 'Adhesivos de lunas',        items: ['Adhesivo/sellador de lunas (PUR o MS polímero)'] },
        { fase: 'Aplicación',  familiaSugerida: 'Herramientas',              items: ['Pistola aplicadora', 'Aplicador de imprimación'] },
      ],
      receta: [
        { fase: 'Limpiar',   emoji: '🧴' },
        { fase: 'Imprimar',  emoji: '🎨' },
        { fase: 'Aplicar',   emoji: '🧷' },
        { fase: 'Curar',     emoji: '⏳' },
      ],
      steps: [
        { n: 1, title: 'Limpieza del marco y el cristal', text: 'Desengrasa a fondo tanto el marco de chapa como el borde del cristal — cualquier resto de grasa o silicona antigua compromete el pegado.', productos: ['Desengrasante para cristal y marco'] },
        { n: 2, title: 'Imprimación', text: 'Aplica la imprimación específica para chapa/cristal con su aplicador — mejora la adherencia del adhesivo y protege el borde de chapa expuesto.', productos: ['Imprimación chapa/cristal', 'Aplicador de imprimación'] },
        { n: 3, title: 'Aplicar el cordón de adhesivo', text: 'Aplica el adhesivo/sellador de lunas con la pistola en un cordón continuo y uniforme, sin huecos ni interrupciones — un hueco en el cordón es la causa más habitual de fugas posteriores.', productos: ['Adhesivo/sellador de lunas (PUR o MS polímero)', 'Pistola aplicadora'] },
        { n: 4, title: 'Colocar la luna', text: 'Posiciona la luna con precisión antes de que el adhesivo empiece a formar piel — una vez colocada, no se debe reajustar la posición.', productos: [] },
        { n: 5, title: 'Respetar el tiempo de curado', text: 'No muevas el vehículo hasta que el adhesivo haya alcanzado su resistencia mínima de seguridad — este tiempo varía según el producto y la temperatura ambiente, consulta siempre la ficha técnica.', productos: [] },
      ],
      professionalTips: [
        'El tiempo de curado hasta poder circular con seguridad no es negociable — depende del adhesivo y de la temperatura, y es lo que garantiza que la luna aguante en caso de un frenazo brusco o un accidente.',
      ],
      commonMistakes: [
        'Aplicar el adhesivo sobre restos de grasa o silicona antigua.',
        'Saltarse la imprimación de chapa/cristal.',
        'Dejar huecos en el cordón de adhesivo.',
        'Mover el vehículo antes del tiempo de curado mínimo indicado en la ficha técnica.',
      ],
      recommendedProducts: [
        { nombre: 'Kit Adhesivo Lunas Zaphiro',         categoria: 'Talleres', precio: '14,99 €' },
        { nombre: 'Adhesivo Lunas MS Polímero Zaphiro', categoria: 'Talleres', formato: '290 ml', precio: '13,02 €' },
        { nombre: 'Aplicador de Imprimación',            categoria: 'Talleres', precio: '2,31 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción económica',    nombre: 'Adhesivo PUR de Lunas ZXS150 310 ml', precio: '7,91 €' },
        { etiqueta: 'Reparación puntual',  nombre: 'Cartucho Masilla Parabrisas 310 cc', precio: '17,53 €' },
      ],
      relatedSolutions: ['proteger-bajos-antigravilla'],
      seo: {
        title: 'Cómo sellar o pegar una luna de coche | Orencio Matas',
        description: 'Guía para pegar o sustituir correctamente un parabrisas o luna lateral, con el sistema adhesivo y sellador adecuado.',
      },
    },

    'pintar-fachada-exterior': {
      slug: 'pintar-fachada-exterior',
      title: 'Cómo pintar una fachada exterior',
      description: 'Prepara y pinta una fachada exterior con un sistema resistente a la intemperie, incluyendo nuestra propia pintura hidrófuga de fachadas.',
      category: 'pintura', subcategory: 'Fachadas',
      problem: 'fachada_deteriorada',
      objective: 'pintar',
      surface: 'pared',
      difficulty: 'Media',
      estimatedTime: '2-3 días según superficie y climatología',
      result: 'Fachada repintada, protegida frente a lluvia y humedad',
      calculadoraCantidad: { rendimiento: 6, etiqueta: 'pintura hidrófuga de fachadas' },
      colorChart: { label: 'Carta de colores Titanpro para fachadas (TF2)', url: 'https://www.titanpro.es/es/colores', logo: '../assets/proveedores/LOGO-TITANPRO.png' },
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Fachadas'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza exterior',      items: ['Limpieza a presión o cepillado de la fachada'] },
        { fase: 'Reparación',  familiaSugerida: 'Masillas de exterior',   items: ['Aguaplast exterior (grietas y desconchones)'] },
        { fase: 'Color',       familiaSugerida: 'Pinturas para fachada',  items: ['Pintura hidrófuga para fachadas'] },
        { fase: 'Herramientas',familiaSugerida: 'Útiles de aplicación',  items: ['Rodillo especial fachadas'] },
      ],
      receta: [
        { fase: 'Limpiar',  emoji: '🧴' },
        { fase: 'Reparar',  emoji: '🔧' },
        { fase: 'Proteger', emoji: '🛡️' },
        { fase: 'Pintar',   emoji: '🏠' },
      ],
      steps: [
        { n: 1, title: 'Limpieza de la fachada', text: 'Elimina suciedad, musgo o pintura suelta con cepillado o limpieza a presión — pintar sobre suciedad es la causa más habitual de que la pintura nueva se desprenda pronto.', productos: ['Limpieza a presión o cepillado de la fachada'] },
        { n: 2, title: 'Reparar grietas y desconchones', text: 'Repara con una masilla de exterior antes de pintar — una grieta sin tratar sigue permitiendo la entrada de agua por debajo de la pintura nueva.', productos: ['Aguaplast exterior (grietas y desconchones)'] },
        { n: 3, title: 'Dejar secar completamente', text: 'Espera a que la fachada esté completamente seca tras la limpieza y las reparaciones — pintar sobre humedad residual es otra causa habitual de fallos tempranos.', productos: [] },
        { n: 4, title: 'Aplicar la pintura hidrófuga', text: 'Aplica con rodillo especial de fachadas en manos finas, evitando pintar con lluvia inminente o sol directo muy fuerte.', productos: ['Pintura hidrófuga para fachadas', 'Rodillo especial fachadas'] },
        { n: 5, title: 'Segunda mano', text: 'Aplica una segunda mano tras el tiempo de secado indicado, para una cobertura uniforme y máxima protección frente a la lluvia.', productos: [] },
      ],
      professionalTips: [
        'Evita pintar la fachada con temperaturas muy bajas, sol directo muy fuerte, o si se espera lluvia en las horas siguientes — las tres condiciones son la causa más habitual de que una pintura de fachada de buena calidad dé mal resultado.',
      ],
      commonMistakes: [
        'Pintar sobre suciedad, musgo o pintura vieja suelta.',
        'No reparar grietas antes de pintar.',
        'Pintar con lluvia inminente o humedad residual en la pared.',
        'Aplicar una sola mano esperando la misma protección que con dos.',
      ],
      recommendedProducts: [
        { nombre: 'TITAN-PRO R40 NF 100% ACRILICO MATE WHITE=WB 15 L.', categoria: 'Pinturas', formato: '15 L', precio: '95,41 €' },
        { nombre: 'Aguaplast Exterior',                                  categoria: 'Pinturas', formato: '1,5 kg', precio: '5,43 €' },
        { nombre: 'Recambio Rodillo Fachadas Tripol',                     categoria: 'Pinturas', formato: '22 cm', precio: '4,69 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Color a elegir (Titán)', nombre: 'Orion A4 Plástico Fachadas Mate 15 L', precio: '73,93 €' },
        { etiqueta: 'Formato pequeño/retoque', nombre: 'Morakron Fachadas Ladrillo 1 L', precio: '5,52 €' },
        { etiqueta: 'Revestimiento con textura', nombre: 'Revotex Revestimiento Fachadas 4 L', precio: '21,73 €' },
      ],
      relatedSolutions: ['impermeabilizar-terraza-goteras', 'pintar-pared-interior'],
      seo: {
        title: 'Cómo pintar una fachada exterior | Orencio Matas',
        description: 'Guía para preparar y pintar una fachada exterior con un sistema hidrófugo resistente a la intemperie.',
      },
    },

    'impermeabilizar-terraza-goteras': {
      slug: 'impermeabilizar-terraza-goteras',
      title: 'Cómo impermeabilizar una terraza con goteras',
      description: 'Sella y protege una terraza o cubierta con goteras usando un revestimiento antigoteras elástico, deteniendo la filtración de agua.',
      category: 'pintura', subcategory: 'Impermeabilización',
      problem: 'goteras',
      objective: 'proteger',
      surface: 'pared',
      difficulty: 'Media',
      estimatedTime: '1 día de aplicación + secado entre manos',
      result: 'Terraza o cubierta sellada, sin filtraciones de agua',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Impermeabilización'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza exterior',        items: ['Limpieza y eliminación de musgo/suciedad'] },
        { fase: 'Reparación',  familiaSugerida: 'Masillas de estanqueidad', items: ['Aguaplast Masilla Estanqueidad (grietas)'] },
        { fase: 'Impermeabilización', familiaSugerida: 'Antigoteras',       items: ['Revestimiento antigoteras caucho-fibra'] },
      ],
      receta: [
        { fase: 'Limpiar', emoji: '🧴' },
        { fase: 'Sellar grietas', emoji: '🔧' },
        { fase: 'Aplicar', emoji: '☔' },
        { fase: 'Curar',   emoji: '⏳' },
      ],
      steps: [
        { n: 1, title: 'Limpieza a fondo', text: 'Elimina musgo, suciedad y restos de pintura suelta — el antigoteras necesita una superficie limpia y bien adherida para sellar de verdad.', productos: ['Limpieza y eliminación de musgo/suciedad'] },
        { n: 2, title: 'Sellar grietas puntuales', text: 'Repara grietas o juntas abiertas con una masilla de estanqueidad antes de aplicar el revestimiento general — son los puntos por donde suele empezar la filtración.', productos: ['Aguaplast Masilla Estanqueidad (grietas)'] },
        { n: 3, title: 'Aplicar el revestimiento antigoteras', text: 'Aplica el producto con rodillo o brocha en manos cruzadas, prestando especial atención a juntas, encuentros con paredes y desagües.', productos: ['Revestimiento antigoteras caucho-fibra'] },
        { n: 4, title: 'Reforzar puntos críticos', text: 'En esquinas, juntas de dilatación y encuentros con bajantes, aplica una capa extra — son los puntos que más fallan con el tiempo.', productos: [] },
        { n: 5, title: 'Dejar curar antes de exponer a agua', text: 'Respeta el tiempo de curado indicado antes de que la superficie quede expuesta a lluvia o agua acumulada.', productos: [] },
      ],
      professionalTips: [
        'La mayoría de goteras no vienen de la superficie plana, sino de juntas, esquinas y encuentros con bajantes — reforzar esos puntos concretos suele ser más determinante que la cantidad de producto aplicado en la zona plana.',
      ],
      commonMistakes: [
        'Aplicar el antigoteras sobre suciedad, musgo o pintura suelta.',
        'No sellar antes las grietas puntuales.',
        'Aplicar una sola mano en zonas de mucho encharcamiento.',
        'No reforzar juntas, esquinas y encuentros con bajantes.',
      ],
      recommendedProducts: [
        { nombre: 'Aguastop Antigoteras Caucho Fibra',       categoria: 'Pinturas', formato: '20 kg', precio: '93,12 €' },
        { nombre: 'Aguaplast Masilla Estanqueidad',           categoria: 'Pinturas', formato: '1 kg', precio: '21,22 €' },
        { nombre: 'REVEST.ANTIGOTERAS I-5 4 L.BLANCO',        categoria: 'Pinturas', formato: '4 L', precio: '21,05 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción económica (goteras puntuales)', nombre: 'Antigoteras LP-70 Caucho 750 ml', precio: '6,35 €' },
        { etiqueta: 'Terrazas transitables',                 nombre: 'Impermeabilización Terrazas Gilmaelas Caucho Acrílico 15 L', precio: '35,26 €' },
        { etiqueta: 'Cubiertas grandes/profesional',         nombre: 'Impermeabilización Membrana c/Poliuretano I-12 20 kg', precio: '90,63 €' },
      ],
      relatedSolutions: ['pintar-fachada-exterior'],
      seo: {
        title: 'Cómo impermeabilizar una terraza con goteras | Orencio Matas',
        description: 'Guía para sellar grietas y aplicar un revestimiento antigoteras en una terraza o cubierta, deteniendo las filtraciones de agua.',
      },
    },

    'quitar-restos-pegamento': {
      slug: 'quitar-restos-pegamento',
      title: 'Cómo quitar restos de pegamento o pegatinas',
      description: 'Elimina restos de pegamento, cinta adhesiva o pegatinas de cualquier superficie sin dañarla, combinando un método mecánico y uno químico.',
      category: 'limpieza', subcategory: 'Quitar pegamento y pegatinas',
      problem: 'pegamento',
      objective: 'limpiar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '15-20 min',
      result: 'Superficie limpia, sin restos de pegamento ni residuo pegajoso',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Quitar pegamento y pegatinas'],
      materials: [
        { fase: 'Mecánico',  familiaSugerida: 'Útiles de acabado', items: ['Disco o rasqueta quitaadhesivos'] },
        { fase: 'Químico',   familiaSugerida: 'Disolventes',       items: ['Disolvente universal o acetona'] },
        { fase: 'Acabado',   familiaSugerida: '—',                 items: ['Paño limpio y seco'] },
      ],
      receta: [
        { fase: 'Levantar',  emoji: '🔧' },
        { fase: 'Disolver',  emoji: '🧴' },
        { fase: 'Frotar',    emoji: '✋' },
        { fase: 'Limpiar',   emoji: '🧻' },
      ],
      steps: [
        { n: 1, title: 'Levantar el grueso del residuo', text: 'Empieza siempre por el método mecánico — una rasqueta de plástico o un disco quitaadhesivos levanta la mayor parte del pegamento sin necesidad de químicos ni riesgo de dañar la superficie.', productos: ['Disco o rasqueta quitaadhesivos'] },
        { n: 2, title: 'Probar en una zona oculta', text: 'Antes de aplicar cualquier disolvente a la vista, pruébalo en una esquina o zona poco visible — algunos disolventes pueden atacar pinturas o plásticos delicados.', productos: [] },
        { n: 3, title: 'Aplicar el disolvente', text: 'Empapa un paño (no la superficie directamente) con disolvente universal o acetona y frota suavemente sobre el residuo hasta que se disuelva.', productos: ['Disolvente universal o acetona'] },
        { n: 4, title: 'Limpiar el resto de disolvente', text: 'Pasa un paño limpio y seco para retirar cualquier resto de disolvente y del propio pegamento ya disuelto.', productos: ['Paño limpio y seco'] },
      ],
      professionalTips: [
        'La acetona es muy eficaz disolviendo pegamento, pero puede dañar plásticos y pinturas delicadas — probar siempre en una zona oculta antes de aplicarla a la vista.',
      ],
      commonMistakes: [
        'Rascar con objetos metálicos afilados, que rayan la superficie.',
        'Aplicar acetona sobre plástico o pintura sin probar antes en una zona oculta.',
        'Aplicar el disolvente directamente sobre la superficie en vez de sobre un paño.',
        'No limpiar el resto de disolvente al terminar.',
      ],
      recommendedProducts: [
        { nombre: 'Disco Quita Adhesivos Zaphiro 88 mm', categoria: 'Talleres', precio: '9,50 €' },
        { nombre: 'Disolvente Universal M.P.L. Puro',     categoria: 'Pinturas', formato: '1 L', precio: '3,75 €' },
        { nombre: 'Acetona Kelsia',                        categoria: 'Droguería', formato: '1 L', precio: '3,15 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Formato pequeño', nombre: 'Acetona Kelsia 200 ml', precio: '1,08 €' },
        { etiqueta: 'Herramienta mecánica alternativa', nombre: 'Rueda de Goma Quita Adhesivos c/Eje 100 mm', precio: '63,34 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal'],
      seo: {
        title: 'Cómo quitar restos de pegamento o pegatinas | Orencio Matas',
        description: 'Guía para eliminar restos de pegamento, cinta adhesiva o pegatinas de cualquier superficie sin dañarla.',
      },
    },

    'corregir-marcas-lijado': {
      slug: 'corregir-marcas-lijado',
      title: 'Cómo eliminar marcas de lijado antes de pintar',
      description: 'Repasa el lijado con grano progresivo y aparejo para que las marcas no se noten bajo la pintura ni el brillo final.',
      category: 'coche', subcategory: 'Preparación de superficie',
      problem: 'marcas_lijado',
      objective: 'preparar',
      surface: 'coche',
      difficulty: 'Media',
      estimatedTime: '30-45 min',
      result: 'Superficie sin marcas de lijado visibles, lista para imprimar y pintar sin defectos',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Preparación de superficie'],
      materials: [
        { fase: 'Lijado progresivo', familiaSugerida: 'Lijas',     items: ['Lija al agua P-800', 'Lija al agua P-1200', 'Lija al agua P-1500'] },
        { fase: 'Sellado',           familiaSugerida: 'Aparejos',  items: ['Aparejo'] },
        { fase: 'Verificación',      familiaSugerida: '—',         items: ['Paño para limpiar el polvo'] },
      ],
      receta: [
        { fase: 'Lijar',     emoji: '📄' },
        { fase: 'Aparejar',  emoji: '🎨' },
        { fase: 'Repasar',   emoji: '✨' },
        { fase: 'Limpiar',   emoji: '🧻' },
      ],
      steps: [
        { n: 1, title: 'Lijado con grano progresivo', text: 'Repasa con lija de grano cada vez más fino (P-800 → P-1200 → P-1500), en pasadas cruzadas — nunca en una sola dirección, o las marcas quedan todas alineadas y se notan más.', productos: ['Lija al agua P-800', 'Lija al agua P-1200', 'Lija al agua P-1500'] },
        { n: 2, title: 'Aplicar aparejo', text: 'El aparejo rellena y sella las últimas micro-marcas que la lija por sí sola no elimina del todo, antes de aplicar el color.', productos: ['Aparejo'] },
        { n: 3, title: 'Repaso final muy suave', text: 'Una vez seco el aparejo, repasa con lija P-1500 muy suavemente para dejar la superficie totalmente lisa al tacto.', productos: ['Lija al agua P-1500'] },
        { n: 4, title: 'Limpiar el polvo', text: 'Retira todo el polvo de lijado antes de pintar — cualquier resto quedará atrapado bajo la pintura y se notará en el acabado.', productos: ['Paño para limpiar el polvo'] },
      ],
      professionalTips: [
        'Las marcas de lijado se ven MÁS, no menos, una vez aplicado el color y el brillo final — por eso el último repaso con lija fina antes de imprimar es el que de verdad determina el acabado.',
      ],
      commonMistakes: [
        'Pasar directamente de un grano grueso a pintar, sin pasos intermedios de grano fino.',
        'Lijar siempre en la misma dirección.',
        'No aplicar aparejo antes del color en superficies muy lijadas.',
        'Pintar sin limpiar bien el polvo de lijado.',
      ],
      recommendedProducts: [
        { nombre: 'Lija al Agua P-1000', categoria: 'Talleres', precio: '1,36 €' },
        { nombre: 'Lija al Agua P-1200', categoria: 'Talleres', precio: '1,91 €' },
        { nombre: 'Aparejo Titan Gris',  categoria: 'Pinturas', formato: '375 ml', precio: '8,93 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Acabado extra fino', nombre: 'Lija al Agua Zaphiro P-1500', precio: '0,57 €' },
        { etiqueta: 'Piezas pequeñas',     nombre: 'Spray Aparejo Gris Medio Zaphiro 400 ml', precio: '16,02 €' },
      ],
      relatedSolutions: ['pintar-plastico-coche', 'corregir-descuelgues-pintura'],
      seo: {
        title: 'Cómo eliminar marcas de lijado antes de pintar | Orencio Matas',
        description: 'Guía para repasar el lijado con grano progresivo y aparejo, de forma que las marcas no se noten bajo la pintura.',
      },
    },

    'corregir-descuelgues-pintura': {
      slug: 'corregir-descuelgues-pintura',
      title: 'Cómo corregir un descuelgue o chorreado de pintura',
      description: 'Repara una zona donde la pintura se ha descolgado o chorreado, y ajusta la técnica para que no vuelva a pasar en la siguiente mano.',
      category: 'coche', subcategory: 'Corrección de defectos',
      problem: 'descuelgue',
      objective: 'reparar',
      surface: 'coche',
      difficulty: 'Media',
      estimatedTime: '20-30 min + secado',
      result: 'Superficie lisa, sin marcas de chorreado, lista para repasar',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Corrección de defectos'],
      materials: [
        { fase: 'Secado',   familiaSugerida: '—',            items: ['Esperar el secado completo del descuelgue'] },
        { fase: 'Lijado',   familiaSugerida: 'Lijas',        items: ['Lija al agua P-1200', 'Lija al agua P-1500'] },
        { fase: 'Repaso',   familiaSugerida: 'Diluyentes',   items: ['Diluyente para ajustar la siguiente mano'] },
      ],
      receta: [
        { fase: 'Esperar', emoji: '⏳' },
        { fase: 'Lijar',   emoji: '📄' },
        { fase: 'Limpiar', emoji: '🧴' },
        { fase: 'Repasar', emoji: '🎨' },
      ],
      steps: [
        { n: 1, title: 'Dejar secar completamente', text: 'Nunca intentes corregir un descuelgue con la pintura todavía fresca — solo lo extiendes y empeoras. Espera a que seque del todo.', productos: [] },
        { n: 2, title: 'Lijar la zona afectada', text: 'Lija suavemente el relieve del chorreado con lija fina hasta igualar el nivel con el resto de la superficie.', productos: ['Lija al agua P-1200', 'Lija al agua P-1500'] },
        { n: 3, title: 'Limpiar el polvo', text: 'Retira todo el polvo de lijado antes de volver a aplicar pintura en la zona.', productos: [] },
        { n: 4, title: 'Repasar con técnica ajustada', text: 'Aplica de nuevo una mano fina en la zona, y ajusta la próxima aplicación completa: menos producto por pasada, varias manos finas en vez de una sola cargada.', productos: ['Diluyente para ajustar la siguiente mano'] },
      ],
      professionalTips: [
        'Los descuelgues casi siempre vienen de aplicar demasiado producto de una vez, o de mantener la pistola/rodillo parado demasiado tiempo en el mismo punto — varias manos finas dan mejor resultado que una sola mano cargada.',
      ],
      commonMistakes: [
        'Intentar corregir el descuelgue con la pintura todavía fresca.',
        'Lijar sin dejar secar del todo antes.',
        'Repetir la misma cantidad de producto en la siguiente mano sin ajustar la técnica.',
        'No limpiar el polvo de lijado antes de repasar.',
      ],
      recommendedProducts: [
        { nombre: 'Lija al Agua P-1200',                    categoria: 'Talleres', precio: '1,91 €' },
        { nombre: 'Titan Ebanistería Diluyente Pistola',     categoria: 'Pinturas', formato: '1 L', precio: '9,45 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Retoques puntuales en spray', nombre: 'Spraymax Diluyente Parches 400 ml', precio: '12,54 €' },
      ],
      relatedSolutions: ['pintar-plastico-coche', 'corregir-marcas-lijado'],
      seo: {
        title: 'Cómo corregir un descuelgue o chorreado de pintura | Orencio Matas',
        description: 'Guía para reparar una zona donde la pintura se ha descolgado, y ajustar la técnica para evitarlo en la siguiente mano.',
      },
    },

    'decapar-pintura-mueble': {
      slug: 'decapar-pintura-mueble',
      title: 'Cómo decapar pintura vieja de un mueble',
      description: 'Retira la pintura o el barniz antiguo de un mueble de madera con decapante en gel, dejándolo listo para un acabado nuevo.',
      category: 'madera', subcategory: 'Decapado',
      problem: 'quitar_pintura',
      objective: 'preparar',
      surface: 'madera',
      difficulty: 'Media',
      estimatedTime: '1-2 h + tiempo de actuación del decapante',
      result: 'Madera desnuda, lista para lijar y aplicar un nuevo acabado',
      breadcrumb: ['Centro de Soluciones', 'Madera y restauración', 'Decapado'],
      materials: [
        { fase: 'Decapado', familiaSugerida: 'Decapantes', items: ['Decapante en gel profesional'] },
        { fase: 'Retirada',  familiaSugerida: 'Herramientas', items: ['Espátula o rasqueta'] },
        { fase: 'Acabado',  familiaSugerida: 'Lijas',        items: ['Lija de grano medio'] },
      ],
      receta: [
        { fase: 'Aplicar', emoji: '🧴' },
        { fase: 'Esperar', emoji: '⏳' },
        { fase: 'Retirar', emoji: '🔧' },
        { fase: 'Lijar',   emoji: '📄' },
      ],
      steps: [
        { n: 1, title: 'Aplicar el decapante', text: 'Aplica el decapante en gel con brocha, en capa gruesa y uniforme — no lo extiendas demasiado fino, necesita cuerpo para actuar bien.', productos: ['Decapante en gel profesional'] },
        { n: 2, title: 'Dejar actuar', text: 'Respeta el tiempo indicado en el envase — se nota que está actuando porque la pintura empieza a levantarse y arrugarse.', productos: [] },
        { n: 3, title: 'Retirar con espátula', text: 'Retira la pintura ya levantada con una espátula, trabajando en la misma dirección de la veta de la madera para no marcarla.', productos: ['Espátula o rasqueta'] },
        { n: 4, title: 'Repetir si hace falta', text: 'En muebles con varias capas de pintura antigua, puede hacer falta una segunda aplicación en las zonas que no hayan salido del todo.', productos: [] },
        { n: 5, title: 'Lijar y dejar lista la madera', text: 'Lija suavemente para retirar restos de decapante y dejar la superficie lista para el nuevo acabado (barniz, pintura, aceite...).', productos: ['Lija de grano medio'] },
      ],
      professionalTips: [
        'El decapante en gel se adhiere mejor que el líquido a superficies verticales, y su tiempo de actuación más largo da mejor resultado en pinturas antiguas muy adheridas — no tengas prisa por rascar antes de tiempo.',
      ],
      commonMistakes: [
        'Aplicar el decapante en capa demasiado fina.',
        'Rascar antes de que el decapante haya actuado el tiempo suficiente.',
        'No ventilar bien la zona de trabajo (vapores fuertes).',
        'Usar herramientas metálicas muy afiladas que marcan la madera.',
      ],
      recommendedProducts: [
        { nombre: 'Titan Decapante Gel Profesional', categoria: 'Pinturas', formato: '1 L', precio: '17,13 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Muebles grandes / varias piezas', nombre: 'Titan Decapante Gel Profesional 4 L', precio: '60,14 €' },
      ],
      relatedSolutions: ['restaurar-mueble-madera'],
      seo: {
        title: 'Cómo decapar pintura vieja de un mueble | Orencio Matas',
        description: 'Guía para retirar pintura o barniz antiguo de un mueble de madera con decapante en gel, paso a paso.',
      },
    },

    'pintar-metal-calor': {
      slug: 'pintar-metal-calor',
      title: 'Cómo pintar con pintura resistente al calor',
      description: 'Pinta radiadores, estufas o tubos de escape con pintura anticalórica, la única que aguanta sin quemarse ni desprenderse con el calor.',
      category: 'metal', subcategory: 'Pintura resistente al calor',
      problem: 'pintar_calor',
      objective: 'pintar',
      surface: 'metal',
      difficulty: 'Media',
      estimatedTime: '1-2 h + secado entre manos',
      result: 'Superficie pintada con un acabado que resiste el calor sin quemarse ni desprenderse',
      breadcrumb: ['Centro de Soluciones', 'Metal', 'Pintura resistente al calor'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza / Desengrasantes', items: ['Desengrasante', 'Lija fina'] },
        { fase: 'Color',       familiaSugerida: 'Pinturas anticalóricas',    items: ['Pintura o esmalte anticalórico'] },
      ],
      receta: [
        { fase: 'Apagar y enfriar', emoji: '❄️' },
        { fase: 'Limpiar',          emoji: '🧴' },
        { fase: 'Pintar',           emoji: '🎨' },
        { fase: 'Curar',            emoji: '🔥' },
      ],
      steps: [
        { n: 1, title: 'Apagar y dejar enfriar por completo', text: 'Nunca pintes con el radiador, la estufa o el tubo todavía calientes — además del riesgo, la pintura no se aplica ni seca bien sobre una superficie caliente.', productos: [] },
        { n: 2, title: 'Limpiar y lijar ligeramente', text: 'Desengrasa a fondo (hollín, grasa) y lija suavemente para que la pintura nueva agarre bien sobre el metal o la pintura vieja bien adherida.', productos: ['Desengrasante', 'Lija fina'] },
        { n: 3, title: 'Aplicar la pintura anticalórica', text: 'Usa siempre una pintura específica anticalórica — un esmalte normal se quema, amarillea o se desprende en cuanto la pieza vuelve a calentarse. Aplica en manos finas.', productos: ['Pintura o esmalte anticalórico'] },
        { n: 4, title: 'Curado con calor', text: 'Muchas pinturas anticalóricas necesitan un primer ciclo de calor suave (encender el radiador/estufa a baja potencia) para terminar de curar y fijar el acabado — consulta el envase para el proceso exacto.', productos: [] },
      ],
      professionalTips: [
        'Cada pintura anticalórica tiene una temperatura máxima soportada (habitual: 300°C para radiadores/estufas domésticas, hasta 800°C para tubos de escape) — comprueba que el producto aguanta la temperatura real de la pieza antes de comprarlo.',
      ],
      commonMistakes: [
        'Usar un esmalte normal en vez de uno anticalórico específico.',
        'Pintar con la pieza todavía caliente.',
        'No dejar el primer ciclo de calor suave para terminar de curar la pintura.',
        'Elegir una pintura anticalórica con menos temperatura soportada de la que la pieza alcanza en uso real.',
      ],
      recommendedProducts: [
        { nombre: 'Oxiron Anticalórico Negro',        categoria: 'Pinturas', formato: '750 ml', precio: '18,71 €' },
        { nombre: 'Bruguer Esmalte Radiadores Blanco', categoria: 'Pinturas', formato: '750 ml', precio: '16,25 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Tubos de escape (muy alta temperatura)', nombre: 'AK Spray Anticalórico 800º Negro', precio: '15,19 €' },
        { etiqueta: 'Formato spray',                            nombre: 'Spray Titán Anticalórico 400 ml', precio: '10,62 €' },
        { etiqueta: 'Acabado aluminio',                         nombre: 'Titán Aluminio Anticalórico 750 ml', precio: '17,40 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal'],
      seo: {
        title: 'Cómo pintar con pintura resistente al calor | Orencio Matas',
        description: 'Guía para pintar radiadores, estufas o tubos de escape con pintura anticalórica, paso a paso.',
      },
    },

    'restaurar-faros-coche': {
      slug: 'restaurar-faros-coche',
      title: 'Cómo restaurar los faros del coche',
      description: 'Recupera la transparencia de unos faros amarillentos u opacos con un kit de pulido y protección UV, sin necesidad de sustituirlos.',
      category: 'coche', subcategory: 'Restauración de faros',
      problem: 'faros_opacos',
      objective: 'restaurar',
      surface: 'coche',
      difficulty: 'Media',
      estimatedTime: '45-60 min',
      result: 'Faros transparentes de nuevo, con una capa protectora frente a los rayos UV',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Restauración de faros'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Enmascarado',    items: ['Cinta de carrocero para proteger la carrocería'] },
        { fase: 'Pulido',      familiaSugerida: 'Kits de faros',  items: ['Kit de reparación/pulido de faros'] },
        { fase: 'Protección',  familiaSugerida: 'Barnices UV',    items: ['Barniz 2K para óptica de faros'] },
      ],
      receta: [
        { fase: 'Enmascarar', emoji: '🧷' },
        { fase: 'Pulir',      emoji: '✨' },
        { fase: 'Limpiar',    emoji: '🧴' },
        { fase: 'Proteger',   emoji: '🛡️' },
      ],
      steps: [
        { n: 1, title: 'Enmascarar alrededor del faro', text: 'Protege la carrocería y las juntas de goma con cinta de carrocero — el pulido puede dañar la pintura circundante si se pasa de la zona del faro.', productos: ['Cinta de carrocero para proteger la carrocería'] },
        { n: 2, title: 'Pulir con el kit', text: 'Sigue el proceso del kit (normalmente varios grados de lija muy fina seguidos de pulimento) hasta que el plástico recupere la transparencia.', productos: ['Kit de reparación/pulido de faros'] },
        { n: 3, title: 'Limpiar y secar', text: 'Retira todo resto de polvo de pulido antes de aplicar cualquier producto de acabado.', productos: [] },
        { n: 4, title: 'Aplicar barniz protector UV', text: 'El plástico de los faros se opaca por los rayos UV — sin una capa de barniz protector, volverá a amarillear en pocos meses. Aplica el barniz 2K específico para faros en manos finas.', productos: ['Barniz 2K para óptica de faros'] },
      ],
      professionalTips: [
        'El pulido por sí solo es un arreglo temporal — el barniz con protección UV es lo que de verdad evita que el faro vuelva a opacarse en unos meses, porque sella el plástico frente a los rayos que lo degradan.',
      ],
      commonMistakes: [
        'Pulir sin enmascarar antes la carrocería alrededor.',
        'Saltarse el barniz protector pensando que el pulido ya es suficiente.',
        'No limpiar bien el polvo de pulido antes de barnizar.',
        'Usar un barniz normal en vez de uno específico con protección UV para faros.',
      ],
      recommendedProducts: [
        { nombre: 'Kit Reparación de Faros 3M',              categoria: 'Talleres', precio: '42,87 €' },
        { nombre: 'Spraymax Barniz 2K Óptica Faros 2en1',    categoria: 'Talleres', formato: '250 ml', precio: '25,35 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción completa/profesional', nombre: 'Set Renovador de Faros Bossauto', precio: '99,83 €' },
        { etiqueta: 'Kit con polímero',              nombre: 'Kit Restauración Faros c/Polímero Zaphiro', precio: '96,50 €' },
      ],
      relatedSolutions: ['recuperar-brillo-carroceria'],
      seo: {
        title: 'Cómo restaurar los faros del coche | Orencio Matas',
        description: 'Guía para pulir y proteger unos faros de coche amarillentos u opacos, recuperando su transparencia original.',
      },
    },

    'proteger-madera-exterior': {
      slug: 'proteger-madera-exterior',
      title: 'Cómo proteger madera de exterior',
      description: 'Protege muebles de jardín, vallas o estructuras de madera expuestas a la intemperie con un lasur, que protege sin perder el aspecto natural de la madera.',
      category: 'madera', subcategory: 'Protección de exterior',
      problem: 'madera_exterior',
      objective: 'proteger',
      surface: 'madera',
      difficulty: 'Fácil',
      estimatedTime: '1-2 h + secado entre manos',
      result: 'Madera de exterior protegida frente a la lluvia, el sol y los hongos, con su aspecto natural',
      breadcrumb: ['Centro de Soluciones', 'Madera y restauración', 'Protección de exterior'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Lijas',   items: ['Lija de grano medio'] },
        { fase: 'Protección',  familiaSugerida: 'Lasures', items: ['Lasur protector para madera de exterior'] },
      ],
      receta: [
        { fase: 'Lijar',    emoji: '📄' },
        { fase: 'Limpiar',  emoji: '🧴' },
        { fase: 'Aplicar',  emoji: '🖌️' },
        { fase: 'Repetir',  emoji: '🔁' },
      ],
      steps: [
        { n: 1, title: 'Lijar suavemente', text: 'Lija ligeramente la superficie para abrir el poro de la madera y que el lasur penetre bien, sobre todo si la madera ya tenía un tratamiento anterior muy desgastado.', productos: ['Lija de grano medio'] },
        { n: 2, title: 'Limpiar el polvo', text: 'Retira todo el polvo de lijado con un paño antes de aplicar el lasur.', productos: [] },
        { n: 3, title: 'Aplicar el lasur', text: 'A diferencia de un barniz, el lasur es semitransparente y penetra en la madera en vez de formar una capa de plástico superficial — por eso no se agrieta ni se descascarilla con el tiempo como un barniz normal expuesto al sol.', productos: ['Lasur protector para madera de exterior'] },
        { n: 4, title: 'Repetir cada temporada', text: 'La protección del lasur se va agotando con la exposición al sol y la lluvia — conviene repasar una mano cada primavera/otoño en piezas muy expuestas.', productos: [] },
      ],
      professionalTips: [
        'El lasur no forma una película superficial como el barniz — penetra en la madera, por eso no se agrieta ni se descascarilla con el sol y la lluvia, aunque necesita repasarse con más frecuencia que un barniz de interior.',
      ],
      commonMistakes: [
        'Usar un barniz de interior en madera expuesta al exterior (se agrieta con el sol en poco tiempo).',
        'No repasar el lasur cada temporada en piezas muy expuestas.',
        'Aplicar sobre madera sucia o con moho, sin limpiar antes.',
        'Aplicar una capa demasiado gruesa (el lasur se aplica en manos finas, no como una pintura).',
      ],
      recommendedProducts: [
        { nombre: 'Xylazel S Lasur Satinado Incoloro',   categoria: 'Pinturas', formato: '750 ml', precio: '19,60 €' },
        { nombre: 'Titán Protec. Lasur Satinado Roble',   categoria: 'Pinturas', formato: '750 ml', precio: '18,02 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Acabado mate',        nombre: 'Barniz Titán Protec. Lasur Eco Mate Incoloro', precio: '18,49 €' },
        { etiqueta: 'Formato grande',      nombre: 'Xylazel Lasur Protect Plus 2,5 L Incoloro', precio: '55,42 €' },
        { etiqueta: 'Con aceite natural',  nombre: 'Lasur Aceite Mora Madera Satinado 1 L', precio: '12,32 €' },
      ],
      relatedSolutions: ['restaurar-mueble-madera'],
      seo: {
        title: 'Cómo proteger madera de exterior | Orencio Matas',
        description: 'Guía para proteger muebles de jardín, vallas o madera de exterior con un lasur protector, sin perder su aspecto natural.',
      },
    },

    'pintar-azulejos': {
      slug: 'pintar-azulejos',
      title: 'Cómo pintar azulejos de baño o cocina',
      description: 'Renueva el aspecto de unos azulejos antiguos sin necesidad de picarlos, con un esmalte específico para azulejos de baño y cocina.',
      category: 'pintura', subcategory: 'Azulejos',
      problem: 'pintar_azulejos',
      objective: 'pintar',
      surface: 'pared',
      difficulty: 'Media',
      estimatedTime: '1 día (2 manos) + secado',
      result: 'Azulejos con un aspecto renovado, sin necesidad de picarlos',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Azulejos'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza',   items: ['Desengrasante para azulejos'] },
        { fase: 'Juntas',      familiaSugerida: 'Juntas',     items: ['Tapajuntas o junta de azulejo (si hace falta reparar)'] },
        { fase: 'Color',       familiaSugerida: 'Esmaltes',   items: ['Esmalte específico para azulejos'] },
      ],
      receta: [
        { fase: 'Limpiar',  emoji: '🧴' },
        { fase: 'Reparar',  emoji: '🔧' },
        { fase: 'Pintar',   emoji: '🎨' },
        { fase: 'Curar',    emoji: '⏳' },
      ],
      steps: [
        { n: 1, title: 'Desengrasar a fondo', text: 'Los azulejos de baño y cocina acumulan grasa y cal invisibles a simple vista — un desengrasante específico es imprescindible, o el esmalte no se agarrará bien.', productos: ['Desengrasante para azulejos'] },
        { n: 2, title: 'Reparar juntas dañadas', text: 'Si alguna junta está agrietada o suelta, repárala antes de pintar — el esmalte no sirve para tapar ese tipo de defecto.', productos: ['Tapajuntas o junta de azulejo (si hace falta reparar)'] },
        { n: 3, title: 'Aplicar el esmalte de azulejos', text: 'Usa un esmalte específico para azulejos de baño/cocina, formulado para agarrarse a una superficie cerámica muy lisa — una pintura normal se despega en poco tiempo.', productos: ['Esmalte específico para azulejos'] },
        { n: 4, title: 'Respetar el curado completo', text: 'Deja el tiempo de curado total indicado (no solo el de secado al tacto) antes de que la zona reciba agua o roce — sobre todo en platos de ducha y encimeras.', productos: [] },
      ],
      professionalTips: [
        'Un esmalte normal de pared no aguanta sobre azulejo — necesitas uno formulado específicamente para cerámica de baño/cocina, pensado para resistir la humedad constante y el roce diario.',
      ],
      commonMistakes: [
        'Pintar sin desengrasar a fondo antes.',
        'Usar una pintura de pared normal en vez de un esmalte específico para azulejos.',
        'Poner la zona en uso (ducha, encimera) antes de que el esmalte haya curado del todo.',
        'No reparar juntas dañadas antes de pintar.',
      ],
      recommendedProducts: [
        { nombre: 'Titán Esmalte Azulejos Baños y Cocinas',   categoria: 'Pinturas', formato: '750 ml', precio: '20,93 €' },
        { nombre: 'Titanlux Azulejos Agua Brillo Blanco',      categoria: 'Pinturas', formato: '750 ml', precio: '16,82 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Acabado satinado', nombre: 'Titán Esmalte Sat. Azulejos Baños y Cocinas', precio: '18,09 €' },
        { etiqueta: 'Reparar juntas',    nombre: 'Baixens B-24 Juntas de Azulejo Tubo 200 g Blanco', precio: '2,11 €' },
      ],
      relatedSolutions: ['pintar-pared-interior'],
      seo: {
        title: 'Cómo pintar azulejos de baño o cocina | Orencio Matas',
        description: 'Guía para renovar el aspecto de unos azulejos antiguos con esmalte específico, sin necesidad de picarlos.',
      },
    },

    'eliminar-mosquitos': {
      slug: 'eliminar-mosquitos',
      title: 'Cómo eliminar mosquitos de casa o del jardín',
      description: 'Combina repelente, dispositivos eléctricos y productos de exterior para mantener los mosquitos alejados de casa y del jardín.',
      category: 'plagas', subcategory: 'Control de mosquitos',
      problem: 'mosquitos',
      objective: 'proteger',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: '15 min de instalación + uso continuado',
      result: 'Hogar y jardín con muchos menos mosquitos, de forma continuada',
      breadcrumb: ['Centro de Soluciones', 'Plagas y control de insectos', 'Control de mosquitos'],
      materials: [
        { fase: 'Interior',  familiaSugerida: 'Antimosquitos eléctricos', items: ['Dispositivo eléctrico antimosquitos + recambio'] },
        { fase: 'Exterior',  familiaSugerida: 'Antimosquitos exteriores', items: ['Spray antimosquitos de exteriores'] },
        { fase: 'Personal',  familiaSugerida: 'Repelentes',               items: ['Repelente corporal'] },
      ],
      receta: [
        { fase: 'Detectar',  emoji: '🔍' },
        { fase: 'Interior',  emoji: '🔌' },
        { fase: 'Exterior',  emoji: '🌿' },
        { fase: 'Proteger',  emoji: '🧴' },
      ],
      steps: [
        { n: 1, title: 'Eliminar puntos de agua estancada', text: 'Los mosquitos necesitan agua quieta para reproducirse — revisa platos de macetas, canalones o cualquier recipiente que acumule agua de lluvia, y vacíalos regularmente.', productos: [] },
        { n: 2, title: 'Dispositivo eléctrico en interior', text: 'Un aparato eléctrico con recambio de larga duración da protección continua durante la noche sin necesidad de aplicar nada sobre la piel.', productos: ['Dispositivo eléctrico antimosquitos + recambio'] },
        { n: 3, title: 'Tratar el jardín o la terraza', text: 'Un spray antimosquitos de exteriores reduce la población en la zona donde se pasa más tiempo, sobre todo al atardecer.', productos: ['Spray antimosquitos de exteriores'] },
        { n: 4, title: 'Protección personal puntual', text: 'Para salidas o zonas muy expuestas, un repelente corporal da protección directa cuando los otros métodos no son suficientes.', productos: ['Repelente corporal'] },
      ],
      professionalTips: [
        'Eliminar el agua estancada suele tener más impacto que cualquier producto — sin puntos de cría cerca, la población de mosquitos baja mucho antes de necesitar tratamientos constantes.',
      ],
      commonMistakes: [
        'No revisar ni vaciar los puntos de agua estancada del jardín.',
        'Usar solo repelente personal sin atacar el problema en el origen (agua estancada, dispositivos).',
        'Dejar caducar el recambio del dispositivo eléctrico sin darse cuenta.',
        'Aplicar spray de exteriores justo antes de usar la zona, sin dejar el tiempo de actuación indicado.',
      ],
      recommendedProducts: [
        { nombre: 'Bloom Electrónico Antimosquitos Pro + Recambio', categoria: 'Droguería', precio: '5,78 €' },
        { nombre: 'Bayer Garden Antimosquitos Exteriores Spray',     categoria: 'Droguería', formato: '500 ml', precio: '7,68 €' },
        { nombre: 'Autan Mosquitos Spray Ultra Repelente',            categoria: 'Droguería', formato: '100 ml', precio: '5,65 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Sin electricidad', nombre: 'Orion Espirales Antimosquitos 10 uds', precio: '2,09 €' },
        { etiqueta: 'Repelente citronela', nombre: 'Preben Citronela Repelente Mosquitos', precio: '3,17 €' },
      ],
      relatedSolutions: ['control-plagas-cocina'],
      seo: {
        title: 'Cómo eliminar mosquitos de casa o del jardín | Orencio Matas',
        description: 'Guía para reducir los mosquitos en casa y en el jardín combinando dispositivos eléctricos, spray de exteriores y repelente personal.',
      },
    },

    'barnizar-suelo-madera': {
      slug: 'barnizar-suelo-madera',
      title: 'Cómo barnizar un suelo de madera o parquet',
      description: 'Renueva el barniz de un suelo de madera o parquet desgastado, devolviéndole la protección y el brillo original.',
      category: 'suelos', subcategory: 'Suelos de madera',
      problem: 'suelo_madera_desgastado',
      objective: 'pintar',
      surface: 'suelo',
      difficulty: 'Media',
      estimatedTime: '1 día + secado entre manos',
      result: 'Suelo de madera o parquet protegido, con el brillo y la resistencia renovados',
      breadcrumb: ['Centro de Soluciones', 'Suelos y garajes', 'Suelos de madera'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Lijas',    items: ['Lijadora de suelo o lija de grano medio'] },
        { fase: 'Barnizado',   familiaSugerida: 'Barnices', items: ['Barniz para parquet y tarima'] },
      ],
      receta: [
        { fase: 'Lijar',    emoji: '📄' },
        { fase: 'Limpiar',  emoji: '🧴' },
        { fase: 'Barnizar', emoji: '🎨' },
        { fase: 'Curar',    emoji: '⏳' },
      ],
      steps: [
        { n: 1, title: 'Lijar el barniz viejo', text: 'Lija toda la superficie para retirar el barniz desgastado y dejar la madera lista para agarrar el nuevo — un barniz nuevo sobre uno viejo muy deteriorado no queda uniforme.', productos: ['Lijadora de suelo o lija de grano medio'] },
        { n: 2, title: 'Limpiar el polvo a fondo', text: 'Aspira y pasa un paño húmedo (bien escurrido) para retirar todo el polvo de lijado — cualquier resto quedará atrapado bajo el barniz.', productos: [] },
        { n: 3, title: 'Aplicar el barniz', text: 'Aplica el barniz para parquet y tarima en manos finas y uniformes, siguiendo el sentido de la veta de la madera.', productos: ['Barniz para parquet y tarima'] },
        { n: 4, title: 'Respetar el curado antes de pisar', text: 'Espera el tiempo de secado indicado antes de caminar con normalidad, y varios días más antes de recolocar muebles pesados — el barniz sigue endureciendo por dentro aunque ya no esté pegajoso al tacto.', productos: [] },
      ],
      professionalTips: [
        'El barniz de parquet sigue curando por dentro varios días después de que se note seco al tacto — poner muebles pesados demasiado pronto puede dejar marcas permanentes aunque parezca ya seco.',
      ],
      commonMistakes: [
        'Barnizar sin lijar antes el barniz viejo muy desgastado.',
        'No limpiar bien el polvo de lijado antes de barnizar.',
        'Caminar con normalidad o recolocar muebles antes del tiempo de curado completo.',
        'Aplicar una mano demasiado gruesa esperando mayor protección.',
      ],
      recommendedProducts: [
        { nombre: 'Xylazel Barniz Parquet y Tarima Satinado', categoria: 'Pinturas', formato: '750 ml', precio: '11,00 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Acabado mate',    nombre: 'Xylazel Barniz Parquet y Tarima Mate', precio: '8,85 €' },
        { etiqueta: 'Acabado brillante', nombre: 'Xylazel Barniz Parquet y Tarima Brillante', precio: '11,00 €' },
        { etiqueta: 'Sistema al agua/cristal', nombre: 'Barniz Titán c/Poliuretano Muebles y Parquet al Cristal', precio: '29,65 €' },
      ],
      relatedSolutions: ['restaurar-mueble-madera', 'abrillantar-suelo-marmol'],
      seo: {
        title: 'Cómo barnizar un suelo de madera o parquet | Orencio Matas',
        description: 'Guía para lijar y barnizar un suelo de madera o parquet desgastado, devolviéndole protección y brillo.',
      },
    },

    'elegir-pegamento-material': {
      slug: 'elegir-pegamento-material',
      title: 'Qué pegamento elegir según el material',
      description: 'Cada material necesita un tipo de pegamento distinto — elige el adecuado según lo que quieras pegar para que el resultado aguante de verdad.',
      category: 'pegado', subcategory: 'Elegir el pegamento adecuado',
      problem: 'elegir_pegamento',
      objective: 'pegar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '5 min de decisión + el propio pegado',
      result: 'El pegamento adecuado para tu material, con un pegado duradero',
      breadcrumb: ['Centro de Soluciones', 'Pegado y sellado', 'Elegir el pegamento adecuado'],
      materials: [
        { fase: 'Uso general',   familiaSugerida: 'Colas de contacto',      items: ['Cola de contacto universal'] },
        { fase: 'Tuberías PVC',  familiaSugerida: 'Adhesivos específicos',  items: ['Pegamento específico para tuberías de PVC'] },
        { fase: 'Césped artificial', familiaSugerida: 'Adhesivos específicos', items: ['Adhesivo para césped artificial'] },
        { fase: 'Reparación rápida', familiaSugerida: 'Pegamentos instantáneos', items: ['Pegamento instantáneo'] },
      ],
      receta: [
        { fase: 'Identificar', emoji: '🔍' },
        { fase: 'Elegir',      emoji: '🧴' },
        { fase: 'Limpiar',     emoji: '🧽' },
        { fase: 'Pegar',       emoji: '🧷' },
      ],
      steps: [
        { n: 1, title: 'Identificar el material', text: 'El pegamento adecuado depende sobre todo del material a pegar, no solo de "que pegue fuerte" — un mismo pegamento puede ir perfecto en madera y fallar completamente en PVC o goma.', productos: [] },
        { n: 2, title: 'Uso general (madera, cerámica, metal, corcho)', text: 'Para la mayoría de materiales porosos o semi-porosos, una cola de contacto universal de calidad da un resultado fiable y duradero.', productos: ['Cola de contacto universal'] },
        { n: 3, title: 'Tuberías de PVC', text: 'El PVC necesita un pegamento específico que fusiona químicamente el propio plástico — una cola de contacto normal no sella ni aguanta la presión del agua.', productos: ['Pegamento específico para tuberías de PVC'] },
        { n: 4, title: 'Césped artificial', text: 'Las juntas de césped artificial necesitan un adhesivo específico, flexible y resistente a la intemperie — un pegamento normal se seca y agrieta con el sol.', productos: ['Adhesivo para césped artificial'] },
        { n: 5, title: 'Reparación rápida o pequeña', text: 'Para roturas pequeñas o reparaciones puntuales que necesitan fraguado en segundos, un pegamento instantáneo es la opción más práctica — aunque suele ser más rígido y menos adecuado para superficies grandes.', productos: ['Pegamento instantáneo'] },
        { n: 6, title: 'Limpiar antes de pegar', text: 'Sea cual sea el pegamento elegido, limpia y desengrasa ambas superficies antes de aplicarlo — es la causa más habitual de que un pegado "bueno" no aguante.', productos: [] },
      ],
      professionalTips: [
        'Cuando dudes entre dos pegamentos, piensa primero en qué va a exigirle al pegado con el tiempo (agua, sol, flexión, peso) — eso importa más que la marca o cuánto "aprieta" al aplicarlo.',
      ],
      commonMistakes: [
        'Usar el mismo pegamento para todo sin mirar si es adecuado al material.',
        'Pegar PVC o goma con una cola de contacto genérica.',
        'No limpiar ni desengrasar las superficies antes de pegar.',
        'Usar pegamento instantáneo en piezas grandes o que necesitan cierta flexibilidad.',
      ],
      recommendedProducts: [
        { nombre: 'Ceys Pegamento Tuberías PVC',               categoria: 'Droguería', precio: '4,10 €' },
        { nombre: 'Cartucho Adhesivo para Césped Artificial',   categoria: 'Droguería', precio: '8,95 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Uso general',        nombre: 'Cola de contacto universal', precio: '5,50 €' },
        { etiqueta: 'Reparación rápida',  nombre: 'Pegamento instantáneo', precio: '2,20 €' },
      ],
      relatedSolutions: ['sellar-juntas-bano', 'desatascar-tuberia'],
      seo: {
        title: 'Qué pegamento elegir según el material | Orencio Matas',
        description: 'Guía para elegir el pegamento adecuado según el material a pegar: madera, PVC, césped artificial o reparaciones rápidas.',
      },
    },

    'pintar-llantas-coche': {
      slug: 'pintar-llantas-coche',
      title: 'Cómo pintar las llantas del coche',
      description: 'Renueva el color de las llantas del coche con pintura específica, resistente al calor de los frenos y a los productos de limpieza.',
      category: 'coche', subcategory: 'Pintura de llantas',
      problem: 'pintar_llantas',
      objective: 'pintar',
      surface: 'coche',
      difficulty: 'Media',
      estimatedTime: '2-3 h (por rueda, incluyendo desmontaje) + secado',
      result: 'Llantas con un color renovado, resistente al calor de los frenos y al lavado',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Pintura de llantas'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza',   items: ['Limpiador de llantas'] },
        { fase: 'Color',       familiaSugerida: 'Aerosoles',  items: ['Spray específico para llantas'] },
      ],
      receta: [
        { fase: 'Desmontar', emoji: '🔧' },
        { fase: 'Limpiar',   emoji: '🧴' },
        { fase: 'Enmascarar',emoji: '🧷' },
        { fase: 'Pintar',    emoji: '🎨' },
      ],
      steps: [
        { n: 1, title: 'Desmontar la rueda', text: 'Un buen resultado necesita pintar la llanta desmontada — pintar sin desmontar deja siempre zonas sin cubrir y peor acabado.', productos: [] },
        { n: 2, title: 'Limpiar a fondo', text: 'Usa un limpiador específico de llantas para eliminar los restos de freno (muy difíciles de quitar con un limpiador normal) y toda la suciedad acumulada.', productos: ['Limpiador de llantas'] },
        { n: 3, title: 'Enmascarar la zona de la goma', text: 'Protege el neumático y la válvula con cinta de carrocero para no mancharlos.', productos: [] },
        { n: 4, title: 'Aplicar el spray de llantas', text: 'Usa siempre un spray específico para llantas — soporta el calor generado por los frenos y los productos de limpieza habituales sin perder color ni desprenderse, algo que una pintura normal no aguanta.', productos: ['Spray específico para llantas'] },
      ],
      professionalTips: [
        'Las llantas alcanzan temperaturas altas por el calor de los frenos de forma habitual — por eso una pintura de spray normal (no formulada para esto) se agrieta o pierde color en poco tiempo, aunque en un primer momento parezca que ha quedado bien.',
      ],
      commonMistakes: [
        'Pintar la llanta montada, sin desmontarla.',
        'Usar un limpiador general en vez de uno específico de llantas (no quita bien los restos de freno).',
        'No enmascarar el neumático y la válvula.',
        'Usar un spray de pintura normal en vez de uno específico para llantas.',
      ],
      recommendedProducts: [
        { nombre: 'Limpiador de Llantas Zaphiro',       categoria: 'Talleres', formato: '500 ml', precio: '14,29 €' },
        { nombre: 'Spray Aluminio Llantas Bossauto',     categoria: 'Talleres', formato: '400 ml', precio: '8,89 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción profesional', nombre: 'Urki-Lac Aluminio Llantas Esmalte Nitro 1 L', precio: '34,65 €' },
        { etiqueta: 'Formato spray alternativo', nombre: 'Spraymax Aluminio Llantas 400 ml', precio: '15,19 €' },
      ],
      relatedSolutions: ['pintar-plastico-coche', 'eliminar-oxido-metal'],
      seo: {
        title: 'Cómo pintar las llantas del coche | Orencio Matas',
        description: 'Guía para pintar las llantas del coche con pintura específica resistente al calor de los frenos y al lavado.',
      },
    },
  };

  // ── Motor de diagnóstico del asistente (simulado) ───────────────────────
  // Combina las 4 respuestas del wizard y devuelve el slug de solución más
  // adecuado. En el futuro esta función se sustituiría por una consulta
  // real (reglas más finas, o incluso un modelo), pero la FORMA de la
  // respuesta (un slug de Solution) no cambiaría.
  function encontrarSolucionPorDiagnostico(accionId, superficieId, estadoId, resultadoId, usoId, tamanoId) {
    // Acciones de mantenimiento simple (sin superficie concreta)
    if (accionId === 'pegar') return 'sellar-juntas-bano';
    if (superficieId === 'piscina') return 'mantenimiento-piscina';
    if (superficieId === 'jardin') return 'cuidado-plantas-jardin';

    const porSuperficie = {
      coche: {
        pintar: 'pintar-plastico-coche',
        reparar: 'recuperar-brillo-carroceria',
        limpiar: 'recuperar-brillo-carroceria',
        pulir: 'recuperar-brillo-carroceria',
        proteger: 'proteger-bajos-antigravilla',
        preparar: 'pintar-plastico-coche',
        pegar: 'sellar-luna-parabrisas',
        // Sin guía específica todavía: restaurar/acabado de carrocería
        // se resuelve con búsqueda de productos.
      },
      plastico: {
        pintar: 'pintar-plastico-coche',
        reparar: 'pintar-plastico-coche',
        limpiar: 'pintar-plastico-coche',
        restaurar: 'pintar-plastico-coche',
        preparar: 'pintar-plastico-coche',
        acabado: 'pintar-plastico-coche',
      },
      madera: {
        pintar: 'restaurar-mueble-madera',
        reparar: 'restaurar-mueble-madera',
        limpiar: 'restaurar-mueble-madera',
        pulir: 'restaurar-mueble-madera',
        restaurar: 'restaurar-mueble-madera',
        proteger: 'restaurar-mueble-madera',
        preparar: 'restaurar-mueble-madera',
        acabado: 'restaurar-mueble-madera',
      },
      metal: {
        pintar: 'eliminar-oxido-metal',
        reparar: 'eliminar-oxido-metal',
        limpiar: 'eliminar-oxido-metal',
        proteger: 'eliminar-oxido-metal',
        preparar: 'eliminar-oxido-metal',
        restaurar: 'eliminar-oxido-metal',
        acabado: 'eliminar-oxido-metal',
      },
      pared: {
        pintar: 'pintar-pared-interior',
        reparar: 'pintar-pared-interior',
        limpiar: 'pintar-pared-interior',
        proteger: 'impermeabilizar-terraza-goteras',
        restaurar: 'pintar-pared-interior',
        preparar: 'pintar-pared-interior',
        acabado: 'pintar-pared-interior',
      },
      suelo: {
        pintar: 'suelo-epoxi-garaje',
        reparar: 'suelo-epoxi-garaje',
        limpiar: 'abrillantar-suelo-marmol',
        proteger: 'suelo-epoxi-garaje',
        restaurar: 'suelo-epoxi-garaje',
        preparar: 'suelo-epoxi-garaje',
        acabado: 'suelo-epoxi-garaje',
      },
      hogar: {
        pintar: 'pintar-pared-interior',
        limpiar: 'eliminar-manchas-ropa',
        proteger: 'proteger-ropa-polillas',
        reparar: 'sellar-juntas-bano',
        pegar: 'sellar-juntas-bano',
        restaurar: 'restaurar-mueble-madera',
        preparar: 'pintar-pared-interior',
        acabado: 'pintar-pared-interior',
      },
    };

    const solucion = (porSuperficie[superficieId] || {})[accionId];
    if (solucion) return solucion;

    // Fallback coherente por superficie si la acción no está mapeada
    if (superficieId === 'madera') return 'restaurar-mueble-madera';
    if (superficieId === 'metal') return 'eliminar-oxido-metal';
    if (superficieId === 'pared' || superficieId === 'hogar') return 'pintar-pared-interior';
    if (superficieId === 'suelo') return 'suelo-epoxi-garaje';
    if (superficieId === 'plastico') return 'pintar-plastico-coche';

    // Sin una combinación que encaje con confianza (p. ej. superficie
    // "Otro") — mejor admitirlo con honestidad que forzar una
    // recomendación que podría no tener nada que ver. El panel de
    // resultado del asistente maneja este `null` mostrando alternativas
    // (explorar por área, o el buscador de "tengo un problema").
    return null;
  }

  // ── Motor de diagnóstico por texto libre (simulado) ─────────────────────
  // Búsqueda simple por palabras clave contra problemasFrecuentes — un
  // "asesor" real usaría NLP/IA, pero de cara al prototipo demuestra
  // exactamente la misma experiencia de principio a fin.
  function diagnosticarPorTexto(texto) {
    const t = (texto || '').toLowerCase();
    const coincidencias = {
      // Términos de coche muy específicos primero, para que no los eclipse
      // ningún término genérico de más abajo en la lista (mismo tipo de
      // problema ya conocido en el proyecto: "sata" dentro de
      // "desatascador" en Apps Script — aquí "cola" dentro de "descolado").
      'luna_rota':         ['parabrisas', 'luna del coche', 'luna lateral', 'cristal del coche', 'descolad'],
      'bajos_coche':       ['bajos del coche', 'antigravilla', 'gravilla'],
      'oxido':      ['oxido', 'óxido', 'oxidad'],
      // "brillo" (a secas) quitado a propósito: coincidía también con
      // "el suelo de mármol está sin brillo" — se queda con términos
      // específicos de arañazo/rayado.
      'aranazos':   ['arañazo', 'aranazo', 'rayad'],
      'no_adhiere': ['no se adhiere', 'no adhiere', 'se despega', 'plastico', 'plástico'],
      // "cola" quitada a propósito: coincidía como subcadena dentro de
      // "descolado" (luna del coche), disparando este problema por error.
      'elegir_pegamento': ['que pegamento', 'qué pegamento', 'que pegamento usar'],
      'pegamento':  ['pegamento', 'adhesivo'],
      'preparar_dudas': ['preparar la superficie', 'como preparar', 'cómo preparar'],
      'marcas_lijado': ['marca de lijado', 'marcas de lijado', 'se ven las rayas del lijado'],
      'descuelgue': ['descuelga', 'chorrea', 'chorreado', 'se corre la pintura'],
      'quitar_pintura': ['decapar', 'decapante', 'quitar pintura vieja', 'quitar pintura'],
      'mal_acabado':['barniz', 'blanquecino', 'burbuja', 'madera', 'no ha quedado bien'],
      'moho_junta': ['moho', 'junta', 'silicona', 'bañera', 'banera', 'ducha'],
      'agua_turbia':['piscina', 'turbia', 'algas', 'cloro', 'ph del agua'],
      'cucarachas': ['cucaracha', 'hormiga', 'insecto', 'plaga', 'bicho'],
      // "suelo" (a secas) quitado a propósito: coincidía también en
      // "el suelo de mármol está opaco", disparando este problema en vez
      // de "suelo_opaco" — se queda solo con términos específicos de
      // garaje/nave/taller.
      'suelo_deteriorado': ['garaje', 'epoxi', 'nave', 'taller'],
      // "habitacion"/"salon" (a secas) quitados a propósito: son solo
      // nombres de estancia, no indican intención de pintar — colisionaban
      // con frases que mencionan un salón por cualquier otro motivo (p. ej.
      // "el suelo de mármol del salón").
      'pared_deteriorada': ['pared', 'pintar la pared', 'pintar el salon', 'pintar el salón', 'pintar la habitacion', 'pintar la habitación'],
      'tuberia_atascada':  ['atascad', 'tuberia', 'tubería', 'desague', 'desagüe', 'atasco'],
      'suelo_opaco':       ['marmol', 'mármol', 'terrazo', 'opaco', 'suelo'],
      // "ropa" (a secas) quitada a propósito: coincidía también con
      // "proteger la ropa de las polillas" — se queda con términos
      // específicos de mancha.
      'mancha_ropa':       ['mancha', 'camisa', 'tejido'],
      'ratones':           ['raton', 'ratón', 'ratones', 'roedor'],
      'plantas_debiles':   ['planta', 'abono', 'maceta'],
      'polillas_ropa':     ['polilla', 'armario', 'guardarropa'],
      'goteras':           ['gotera', 'goteras', 'humedad', 'filtracion', 'filtración', 'terraza'],
      'fachada_deteriorada': ['fachada', 'exterior de la casa', 'exterior de casa'],
      'pintar_calor':     ['radiador', 'estufa', 'tubo de escape', 'anticalorico', 'anticalórico', 'que da calor', 'pintura resistente al calor'],
      'faros_opacos':     ['faro', 'faros', 'optica amarillenta', 'óptica amarillenta'],
      'madera_exterior':  ['mueble de jardin', 'mueble de jardín', 'valla', 'lasur'],
      'pintar_azulejos':  ['azulejo', 'azulejos'],
      'mosquitos':        ['mosquito', 'mosquitos'],
      'suelo_madera_desgastado': ['parquet', 'tarima'],
      'pintar_llantas':   ['llanta', 'llantas'],
    };
    let problemaId = null;
    for (const [id, palabras] of Object.entries(coincidencias)) {
      if (palabras.some((p) => t.includes(p))) { problemaId = id; break; }
    }

    if (!problemaId) {
      // Honestidad ante todo: si el texto no coincide con ningún problema
      // conocido, no forzamos una recomendación al azar (mismo criterio ya
      // aplicado en encontrarSolucionPorDiagnostico del wizard). El llamador
      // debe entonces intentar una búsqueda real en el catálogo en su lugar.
      return { problemaDetectado: null, solutionSlug: null };
    }

    const problema = problemasFrecuentes.find((p) => p.id === problemaId) || problemasFrecuentes[0];
    return {
      problemaDetectado: problema.label,
      solutionSlug: problema.solutionSlug,
    };
  }

  // ── Búsqueda y resolución real contra el catálogo (compartido) ─────────
  // Antes vivía duplicado dentro de centro-soluciones.js; se centraliza
  // aquí para que TANTO la home (búsqueda de respaldo en "tengo un
  // problema") COMO las páginas de detalle de solución (para resolver
  // imagen/referencia real de los productos recomendados) usen el mismo
  // código, sin mantener dos copias.
  //
  // Ruta relativa: centro-soluciones.html vive en la raíz, pero
  // soluciones/solucion.html vive un nivel más abajo — se resuelve según
  // la URL actual para que funcione desde cualquiera de las dos.
  function rutaCatalogoReal() {
    return window.location.pathname.includes('/soluciones/') ? '../data/productos.json' : './data/productos.json';
  }

  let catalogoRealCache = null;
  function cargarCatalogoReal() {
    if (catalogoRealCache) return Promise.resolve(catalogoRealCache);
    return fetch(rutaCatalogoReal())
      .then((r) => r.json())
      .then((d) => {
        catalogoRealCache = (d.productos || []).filter((p) => !p.fecha_baja);
        return catalogoRealCache;
      })
      .catch(() => {
        catalogoRealCache = [];
        return catalogoRealCache;
      });
  }

  function normalizarTexto(t) {
    return (t || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  const STOPWORDS_BUSQUEDA = new Set([
    'que', 'para', 'como', 'pero', 'desde', 'esta', 'este', 'estos', 'estas',
    'tengo', 'necesito', 'quiero', 'puedo', 'hacer', 'tiene', 'sobre', 'entre',
    'donde', 'cuando', 'unos', 'unas', 'poco', 'muy', 'con', 'del', 'las', 'los',
    'una', 'uno', 'esto', 'eso', 'aquello', 'mucho', 'mucha', 'algo', 'nada',
  ]);

  function palabrasSignificativas(texto) {
    return normalizarTexto(texto)
      .split(/[^a-z0-9áéíóúñ]+/i)
      .filter((w) => w.length >= 4 && !STOPWORDS_BUSQUEDA.has(w));
  }

  function contienePalabra(textoNorm, palabra) {
    // Coincidencia por palabra completa, no subcadena (mismo tipo de bug ya
    // corregido antes: "olor" coincidía dentro de "incolora").
    return new RegExp('(^|[^a-z0-9áéíóúñ])' + palabra + '($|[^a-z0-9áéíóúñ])').test(textoNorm);
  }

  function buscarProductosEnCatalogo(texto) {
    const palabras = palabrasSignificativas(texto);
    if (!palabras.length) return Promise.resolve([]);
    return cargarCatalogoReal().then((productos) => {
      const resultados = [];
      productos.forEach((p) => {
        const nombreNorm = normalizarTexto(p.nombre || '');
        const coincidencias = palabras.filter((w) => contienePalabra(nombreNorm, w)).length;
        if (coincidencias > 0) resultados.push({ producto: p, coincidencias });
      });
      resultados.sort((a, b) => b.coincidencias - a.coincidencias);
      return resultados.slice(0, 8).map((r) => r.producto);
    });
  }

  // Resuelve UN producto mock (de recommendedProducts) contra su
  // equivalente real más probable en el catálogo — para poder mostrar
  // imagen y referencia reales en vez del antiguo botón "Ver producto".
  // Devuelve null si no encuentra una coincidencia razonablemente segura
  // (mejor no mostrar nada real que mostrar un producto equivocado).
  function resolverProductoReal(nombreMock) {
    const nombreNorm = normalizarTexto(nombreMock);
    return cargarCatalogoReal().then((productos) => {
      // 1) Coincidencia exacta (varias soluciones ya usan el nombre real
      //    tal cual, copiado directamente del catálogo al redactarlas).
      const exacto = productos.find((p) => normalizarTexto(p.nombre) === nombreNorm);
      if (exacto) return exacto;

      // 2) El nombre real contiene el nombre mock completo, o viceversa
      //    (p. ej. mock "Alex Abrillantador Terrazo/Mármol" vs real
      //    "ALEX ABRILLANTADOR 1.500 ML.TERRAZO/MARMOL").
      const porInclusion = productos.find((p) => {
        const pn = normalizarTexto(p.nombre);
        return pn.includes(nombreNorm) || nombreNorm.includes(pn);
      });
      if (porInclusion) return porInclusion;

      // 3) Ranking por palabras significativas compartidas — solo se
      //    acepta con un mínimo de 2 palabras coincidentes, para no
      //    mostrar como "real" un producto que en verdad no tiene
      //    relación clara con lo que pedía la guía.
      const palabras = palabrasSignificativas(nombreMock);
      if (palabras.length < 2) return null;
      let mejor = null;
      let mejorPuntuacion = 0;
      productos.forEach((p) => {
        const pn = normalizarTexto(p.nombre || '');
        const puntuacion = palabras.filter((w) => contienePalabra(pn, w)).length;
        if (puntuacion > mejorPuntuacion) { mejorPuntuacion = puntuacion; mejor = p; }
      });
      return mejorPuntuacion >= 2 ? mejor : null;
    });
  }

  return {
    acciones, superficies, estados, usos, tamanos, resultados,
    problemasFrecuentes, areas, solucionesDestacadas, soluciones,
    encontrarSolucionPorDiagnostico, diagnosticarPorTexto,
    normalizarTexto, cargarCatalogoReal, buscarProductosEnCatalogo, resolverProductoReal,
  };
})();
