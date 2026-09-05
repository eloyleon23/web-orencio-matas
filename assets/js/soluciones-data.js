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
    { id: 'ceramica', label: 'Baño y cerámica',      emoji: '🚿' },
    { id: 'hogar',    label: 'Hogar',                emoji: '🏠' },
    { id: 'plastico', label: 'Plástico',              emoji: '🧩' },
    { id: 'suelo',    label: 'Suelo / garaje',         emoji: '🅿️' },
    { id: 'jardin',   label: 'Jardín',                 emoji: '🌱' },
    { id: 'piscina',  label: 'Piscina',                emoji: '🏊' },
    { id: 'cristal',  label: 'Cristal',                 emoji: '🪟' },
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
    { id: 'igualar_color_madera', label: 'Necesito igualar el color de un mueble nuevo con el resto', solutionSlug: 'igualar-color-madera-barniz' },
    { id: 'descuelgue',    label: 'La pintura se descuelga',              solutionSlug: 'corregir-descuelgues-pintura' },
    { id: 'burbujas',      label: 'Han aparecido burbujas',                solutionSlug: 'restaurar-mueble-madera' },
    { id: 'blanquecino',   label: 'El barniz ha quedado blanquecino',     solutionSlug: 'restaurar-mueble-madera' },
    { id: 'quitar_pintura',label: 'Necesito quitar pintura',              solutionSlug: 'decapar-pintura-mueble' },
    { id: 'preparar_dudas',label: 'No sé cómo preparar la superficie',    solutionSlug: 'pintar-plastico-coche' },
    { id: 'moho_junta',    label: 'Tengo moho en las juntas del baño',    solutionSlug: 'sellar-juntas-bano' },
    { id: 'moho_antes_pintar', label: 'Tengo moho y quiero pintar encima', solutionSlug: 'eliminar-moho-pared-antes-pintar' },
    { id: 'moho_general',  label: 'Tengo moho en la pared o azulejos y solo quiero limpiarlo', solutionSlug: 'limpiar-moho-pared-azulejo' },
    { id: 'agua_turbia',   label: 'El agua de la piscina está turbia',    solutionSlug: 'mantenimiento-piscina' },
    { id: 'choque_piscina', label: 'Tengo que hacer un tratamiento de choque en la piscina', solutionSlug: 'tratamiento-choque-piscina' },
    { id: 'cucarachas',    label: 'Tengo cucarachas u hormigas',          solutionSlug: 'control-plagas-cocina' },
    { id: 'pintura_problemas_aplicacion', label: 'La pintura no cubre, no se adhiere o hace burbujas', solutionSlug: 'solucionar-problemas-pintura-aplicacion' },
    { id: 'eliminar_grasa', label: 'Tengo que eliminar grasa de una superficie', solutionSlug: 'eliminar-grasa-desengrasar' },
    { id: 'cal_bano',       label: 'Tengo cal o sarro en el baño',        solutionSlug: 'eliminar-cal-sarro-bano' },
    { id: 'restos_cemento', label: 'Tengo restos de cemento tras una obra', solutionSlug: 'eliminar-restos-cemento-mortero' },
    { id: 'limpiar_cristales', label: 'Quiero limpiar los cristales sin que queden marcas', solutionSlug: 'limpiar-cristales-sin-marcas' },
    { id: 'elegir_lija',    label: 'No sé qué lija o grano elegir',       solutionSlug: 'elegir-lija-grano-abrasivo' },
    { id: 'elegir_perfume', label: 'Quiero un perfume para regalar',      solutionSlug: 'perfumeria-elegir-fragancia-regalo' },
    { id: 'elegir_brocha_rodillo', label: 'No sé qué brocha o rodillo elegir', solutionSlug: 'elegir-brocha-rodillo-pintar' },
    { id: 'elegir_cinta_enmascarar', label: 'Necesito enmascarar antes de pintar', solutionSlug: 'elegir-cinta-papel-enmascarar' },
    { id: 'hologramas_pulido', label: 'Me han quedado hologramas al pulir', solutionSlug: 'eliminar-hologramas-pulido' },
    { id: 'elegir_disolvente', label: 'No sé qué disolvente usar o cómo diluir la pintura', solutionSlug: 'elegir-disolvente-diluir-pintura' },
    { id: 'higiene_personal', label: 'Busco productos de higiene personal', solutionSlug: 'higiene-personal-cuidado-corporal' },
    { id: 'preparar_pieza_taller', label: 'Cómo preparar una pieza antes de pintarla', solutionSlug: 'preparar-pieza-taller-antes-pintar' },
    { id: 'problemas_pulverizacion', label: 'La pistola no pulveriza bien o no cubre', solutionSlug: 'problemas-pulverizacion-pistola' },
    { id: 'proteger_acabado', label: 'Cómo proteger el acabado tras pintar', solutionSlug: 'proteger-acabado-pintura-nueva' },
    { id: 'elegir_acabado_pintura', label: 'No sé si elegir pintura mate, satinada o brillante', solutionSlug: 'elegir-acabado-pintura-mate-satinado-brillante' },
    { id: 'limpieza_profesional', label: 'Busco consumibles de limpieza para mi negocio', solutionSlug: 'limpieza-profesional-hosteleria-empresas' },
    { id: 'manchas_grietas_antes_pintar', label: 'Tengo manchas, grietas o agujeros antes de pintar', solutionSlug: 'manchas-grietas-antes-pintar' },
    { id: 'humedad_interior', label: 'Tengo humedad en una pared interior', solutionSlug: 'tratar-humedad-interior-pared' },
    { id: 'limpiar_herramientas', label: 'Cómo limpio las brochas y rodillos', solutionSlug: 'limpiar-herramientas-maquinaria-pintura' },
    { id: 'elegir_pintura_superficie', label: 'No sé qué pintura elegir según la superficie', solutionSlug: 'elegir-pintura-segun-superficie-metal-madera-exterior' },
    { id: 'material_desechable_taller', label: 'Necesito protección desechable para el taller', solutionSlug: 'material-desechable-proteccion-taller' },
    { id: 'pintar_renovar_piscina', label: 'Quiero pintar o renovar mi piscina', solutionSlug: 'piscinas-pintar-renovar' },
    { id: 'elegir_imprimacion', label: 'No sé si necesito imprimación ni cuál', solutionSlug: 'elegir-imprimacion-superficie' },
    { id: 'cuanto_producto_necesito', label: '¿Cuánta pintura necesito?', solutionSlug: 'cuanto-producto-necesito' },
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
    { id: 'plata_oscurecida', label: 'Tengo la plata oscurecida',             solutionSlug: 'limpiar-plata-metales' },
    { id: 'usar_lejia',       label: 'No sé usar la lejía correctamente',     solutionSlug: 'usar-lejia-segura' },
    { id: 'desinfectar_hogar',label: 'Quiero desinfectar la casa',            solutionSlug: 'desinfectar-casa' },
    { id: 'elegir_pistola',   label: 'No sé qué pistola de pintar comprar',   solutionSlug: 'elegir-pistola-pintar' },
    { id: 'elegir_lijadora',  label: 'No sé qué lijadora necesito',           solutionSlug: 'elegir-lijadora-superficie' },
    { id: 'proteger_estructura_metalica', label: 'Necesito proteger una estructura metálica de la corrosión', solutionSlug: 'proteger-estructura-metalica-corrosion' },
    { id: 'proteger_fuego_estructura', label: 'Necesito proteger una estructura de acero contra el fuego', solutionSlug: 'proteger-estructura-acero-fuego' },
    { id: 'lacar_mueble_profesional', label: 'Quiero lacar un mueble a nivel profesional', solutionSlug: 'lacado-profesional-muebles' },
    { id: 'fachada_piedra_absorbe_agua', label: 'La fachada de piedra o ladrillo absorbe mucha agua', solutionSlug: 'hidrofugar-fachada-piedra-ladrillo' },
    { id: 'grietas_fachada',       label: 'Tengo grietas o fisuras en la fachada',        solutionSlug: 'reparar-fisuras-fachada-hormigon' },
    { id: 'salitre_fachada',       label: 'Tengo manchas blancas de salitre en la fachada', solutionSlug: 'tratar-fachada-humedad-capilaridad' },
    { id: 'proteger_fachada_monocapa', label: 'Necesito proteger o hidrofugar un mortero monocapa', solutionSlug: 'proteger-fachada-mortero-monocapa' },
    { id: 'pintar_metal_general',  label: 'Quiero pintar una superficie de metal',         solutionSlug: 'pintar-metal-antioxidante-interior-exterior' },
    { id: 'pintar_techo_temple',   label: 'Quiero pintar un techo con pasta al temple',    solutionSlug: 'pintar-techo-pasta-temple' },
    { id: 'pintar_verja_hierro',   label: 'Quiero pintar una verja o barandilla de hierro', solutionSlug: 'pintar-reja-verja-hierro' },
    { id: 'pintar_pladur',         label: 'Quiero pintar placas de pladur nuevas',          solutionSlug: 'pintar-placas-pladur-yeso-laminado' },
    { id: 'pintar_directo_oxido',  label: 'Quiero pintar el óxido sin quitarlo ni imprimar', solutionSlug: 'pintar-metal-oxidado-directo-oxiron' },
    { id: 'acabado_forjado_metal', label: 'Quiero dar un acabado de forja o martelé a una verja', solutionSlug: 'dar-acabado-forjado-metal-jardin' },
    { id: 'renovar_banera_sanitario', label: 'Quiero renovar la bañera o el lavabo sin cambiarlo', solutionSlug: 'renovar-banera-lavabo-sanitario' },
    { id: 'pintar_radiador',       label: 'Quiero pintar un radiador de calefacción',       solutionSlug: 'pintar-radiador-calefaccion' },
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
        { title: 'Preparar una pieza antes de pintar',  solutionSlug: 'preparar-pieza-taller-antes-pintar' },
        { title: 'Pulir la carrocería',                 solutionSlug: 'recuperar-brillo-carroceria' },
        { title: 'Recuperar el brillo',                 solutionSlug: 'recuperar-brillo-carroceria' },
        { title: 'Eliminar hologramas',                   solutionSlug: 'eliminar-hologramas-pulido' },
        { title: 'Eliminar marcas de lijado',            solutionSlug: 'corregir-marcas-lijado' },
        { title: 'Corregir un chorreado de pintura',      solutionSlug: 'corregir-descuelgues-pintura' },
        { title: 'Restaurar faros',                       solutionSlug: 'restaurar-faros-coche' },
        { title: 'Eliminar adhesivos',                    solutionSlug: 'quitar-restos-pegamento' },
        { title: 'Quitar restos de cola',                 solutionSlug: 'quitar-restos-pegamento' },
        { title: 'Eliminar óxido',                      solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Desengrasar una pieza',                solutionSlug: 'preparar-pieza-taller-antes-pintar' },
        { title: 'Proteger los bajos del coche',        solutionSlug: 'proteger-bajos-antigravilla' },
        { title: 'Sellar o pegar una luna',              solutionSlug: 'sellar-luna-parabrisas' },
        { title: 'Enmascarar un vehículo antes de pintar', solutionSlug: 'elegir-cinta-papel-enmascarar' },
        { title: 'La pistola no pulveriza bien',          solutionSlug: 'problemas-pulverizacion-pistola' },
        { title: 'Problemas de cobertura al pintar con pistola', solutionSlug: 'problemas-pulverizacion-pistola' },
        { title: 'Proteger el acabado tras pintar',       solutionSlug: 'proteger-acabado-pintura-nueva' },
        { title: 'Material desechable de protección para el taller', solutionSlug: 'material-desechable-proteccion-taller' },
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
        { title: 'Renovar una bañera, lavabo o sanitario', solutionSlug: 'renovar-banera-lavabo-sanitario' },
        { title: 'Eliminar moho antes de pintar',          solutionSlug: 'eliminar-moho-pared-antes-pintar' },
        { title: 'Pintar superficies difíciles',         solutionSlug: 'pintar-plastico-coche' },
        { title: 'Limpiar brochas',                      solutionSlug: 'pintar-pared-interior' },
        { title: 'Conseguir acabado mate',              solutionSlug: 'pintar-pared-interior' },
        { title: 'Conseguir acabado satinado',           solutionSlug: 'pintar-pared-interior' },
        { title: 'Conseguir acabado brillante',          solutionSlug: 'pintar-pared-interior' },
        { title: 'Pintar una fachada exterior',         solutionSlug: 'pintar-fachada-exterior' },
        { title: 'Reparar goteras o humedades',          solutionSlug: 'impermeabilizar-terraza-goteras' },
        { title: 'Impermeabilizar una terraza',           solutionSlug: 'impermeabilizar-terraza-goteras' },
        { title: 'Elegir la pistola de pintar',           solutionSlug: 'elegir-pistola-pintar' },
        { title: 'Elegir la lijadora adecuada',           solutionSlug: 'elegir-lijadora-superficie' },
        { title: 'Elegir la lija y el grano',             solutionSlug: 'elegir-lija-grano-abrasivo' },
        { title: 'La pintura no cubre o no se adhiere',   solutionSlug: 'solucionar-problemas-pintura-aplicacion' },
        { title: 'Tengo manchas o grietas antes de pintar', solutionSlug: 'manchas-grietas-antes-pintar' },
        { title: 'Tengo humedad en una pared interior',    solutionSlug: 'tratar-humedad-interior-pared' },
        { title: 'Han salido burbujas al pintar',          solutionSlug: 'solucionar-problemas-pintura-aplicacion' },
        { title: 'Marcas de rodillo o brocha',             solutionSlug: 'solucionar-problemas-pintura-aplicacion' },
        { title: 'Elegir brocha o rodillo',                solutionSlug: 'elegir-brocha-rodillo-pintar' },
        { title: 'Elegir disolvente o diluir la pintura',   solutionSlug: 'elegir-disolvente-diluir-pintura' },
        { title: 'Elegir entre mate, satinado o brillante', solutionSlug: 'elegir-acabado-pintura-mate-satinado-brillante' },
        { title: 'Qué pintura elegir según la superficie', solutionSlug: 'elegir-pintura-segun-superficie-metal-madera-exterior' },
        { title: '¿Necesito imprimación?',                solutionSlug: 'elegir-imprimacion-superficie' },
        { title: '¿Cuánta pintura necesito?',              solutionSlug: 'cuanto-producto-necesito' },
        { title: 'Hidrofugar una fachada de piedra',       solutionSlug: 'hidrofugar-fachada-piedra-ladrillo' },
        { title: 'Reparar grietas en una fachada',         solutionSlug: 'reparar-fisuras-fachada-hormigon' },
        { title: 'Tratar salitre o humedad por capilaridad', solutionSlug: 'tratar-fachada-humedad-capilaridad' },
        { title: 'Pintar placas de pladur nuevas',          solutionSlug: 'pintar-placas-pladur-yeso-laminado' },
      ],
    },
    {
      id: 'madera', label: 'Madera y restauración', emoji: '🪵',
      ejemplos: [
        { title: 'Pintar un mueble',                    solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Restaurar un mueble antiguo',         solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Cambiar el color',                     solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Igualar el color de una silla nueva', solutionSlug: 'igualar-color-madera-barniz' },
        { title: 'Barnizar una mesa',                   solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Eliminar barniz',                     solutionSlug: 'decapar-pintura-mueble' },
        { title: 'Pintar madera barnizada',             solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Proteger madera exterior',            solutionSlug: 'proteger-madera-exterior' },
        { title: 'Recuperar una superficie deteriorada',solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Lacar un mueble con pistola (profesional)', solutionSlug: 'lacado-profesional-muebles' },
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
        { title: 'Pintar radiadores',                    solutionSlug: 'pintar-radiador-calefaccion' },
        { title: 'Pintar estufas',                       solutionSlug: 'pintar-metal-calor' },
        { title: 'Pintar tubos de salida de humos',      solutionSlug: 'pintar-metal-calor' },
        { title: 'Preparar metal antes de pintar',       solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Proteger metal',                       solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Proteger una nave industrial frente a la corrosión', solutionSlug: 'proteger-estructura-metalica-corrosion' },
        { title: 'Proteger una estructura contra el fuego', solutionSlug: 'proteger-estructura-acero-fuego' },
        { title: 'Pintar una verja o barandilla',           solutionSlug: 'pintar-reja-verja-hierro' },
        { title: 'Pintar metal oxidado sin quitar el óxido', solutionSlug: 'pintar-metal-oxidado-directo-oxiron' },
        { title: 'Dar un acabado de forja o martelé',        solutionSlug: 'dar-acabado-forjado-metal-jardin' },
      ],
    },
    {
      id: 'limpieza', label: 'Limpieza y droguería', emoji: '🧹',
      ejemplos: [
        { title: 'Eliminar grasa',                       solutionSlug: 'eliminar-grasa-desengrasar' },
        { title: 'Eliminar pintura',                     solutionSlug: 'decapar-pintura-mueble' },
        { title: 'Quitar adhesivos',                     solutionSlug: 'quitar-restos-pegamento' },
        { title: 'Quitar silicona',                      solutionSlug: 'sellar-juntas-bano' },
        { title: 'Limpiar herramientas',                 solutionSlug: 'limpiar-herramientas-maquinaria-pintura' },
        { title: 'Desengrasar piezas',                   solutionSlug: 'eliminar-grasa-desengrasar' },
        { title: 'Limpiar maquinaria',                   solutionSlug: 'limpiar-herramientas-maquinaria-pintura' },
        { title: 'Preparar una superficie',              solutionSlug: 'preparar-pieza-taller-antes-pintar' },
        { title: 'Desatascar una tubería',               solutionSlug: 'desatascar-tuberia' },
        { title: 'Abrillantar un suelo de mármol',        solutionSlug: 'abrillantar-suelo-marmol' },
        { title: 'Quitar una mancha de la ropa',          solutionSlug: 'eliminar-manchas-ropa' },
        { title: 'Limpiar y abrillantar la plata',        solutionSlug: 'limpiar-plata-metales' },
        { title: 'Limpiar acero inoxidable',              solutionSlug: 'limpiar-plata-metales' },
        { title: 'Usar la lejía correctamente',           solutionSlug: 'usar-lejia-segura' },
        { title: 'Desinfectar la casa',                   solutionSlug: 'desinfectar-casa' },
        { title: 'Limpiar el moho de una pared o azulejo', solutionSlug: 'limpiar-moho-pared-azulejo' },
        { title: 'Eliminar la cal del baño',              solutionSlug: 'eliminar-cal-sarro-bano' },
        { title: 'Eliminar restos de cemento tras una obra', solutionSlug: 'eliminar-restos-cemento-mortero' },
        { title: 'Limpiar cristales sin marcas',          solutionSlug: 'limpiar-cristales-sin-marcas' },
        { title: 'Consumibles de limpieza para hostelería o empresas', solutionSlug: 'limpieza-profesional-hosteleria-empresas' },
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
        { title: 'Pintar o renovar la piscina',           solutionSlug: 'piscinas-pintar-renovar' },
        { title: 'Invernar la piscina',                  solutionSlug: 'mantenimiento-piscina' },
        { title: 'Hacer un tratamiento de choque con hipoclorito', solutionSlug: 'tratamiento-choque-piscina' },
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
    {
      id: 'perfumeria', label: 'Perfumería y cuidado personal', emoji: '🌸',
      ejemplos: [
        { title: 'Elegir un perfume de regalo',          solutionSlug: 'perfumeria-elegir-fragancia-regalo' },
        { title: 'Buscar una fragancia para hombre',     solutionSlug: 'perfumeria-elegir-fragancia-regalo' },
        { title: 'Buscar una fragancia para mujer',      solutionSlug: 'perfumeria-elegir-fragancia-regalo' },
        { title: 'Diferencia entre EDP y EDT',           solutionSlug: 'perfumeria-elegir-fragancia-regalo' },
        { title: 'Productos de higiene personal',         solutionSlug: 'higiene-personal-cuidado-corporal' },
        { title: 'Cuidado facial y corporal',              solutionSlug: 'higiene-personal-cuidado-corporal' },
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
    { slug: 'tratamiento-choque-piscina', title: 'Cómo hacer un tratamiento de choque con hipoclorito', difficulty: 'Fácil', estimatedTime: '15-20 min + reposo', emoji: '🏊' },
    { slug: 'control-plagas-cocina',     title: 'Cómo eliminar cucarachas y hormigas',            difficulty: 'Fácil', estimatedTime: 'Resultado en 1-2 semanas', emoji: '🐜' },
    { slug: 'pintar-pared-interior',     title: 'Cómo pintar una pared por dentro',               difficulty: 'Fácil', estimatedTime: '1 día (2 manos)', emoji: '🎨' },
    { slug: 'desatascar-tuberia',        title: 'Cómo desatascar una tubería',                    difficulty: 'Fácil', estimatedTime: '15-30 min', emoji: '🚽' },
    { slug: 'cuidado-plantas-jardin',    title: 'Cómo abonar y cuidar las plantas del jardín',    difficulty: 'Fácil', estimatedTime: '20 min (rutina periódica)', emoji: '🌱' },
    { slug: 'proteger-bajos-antigravilla', title: 'Cómo proteger los bajos del coche',            difficulty: 'Media', estimatedTime: '1-2 h + secado', emoji: '🚗' },
    { slug: 'pintar-fachada-exterior',   title: 'Cómo pintar una fachada exterior',               difficulty: 'Media', estimatedTime: '2-3 días (según superficie)', emoji: '🏠' },
    { slug: 'impermeabilizar-terraza-goteras', title: 'Cómo impermeabilizar una terraza con goteras', difficulty: 'Media', estimatedTime: '1 día + secado', emoji: '☔' },
    { slug: 'pintar-azulejos',           title: 'Cómo pintar azulejos de baño o cocina',           difficulty: 'Media', estimatedTime: '1 día (2 manos) + secado', emoji: '🚿' },
    { slug: 'renovar-banera-lavabo-sanitario', title: 'Cómo renovar una bañera, lavabo o sanitario sin cambiarlo', difficulty: 'Media', estimatedTime: '2 días + 72 h antes de usar', emoji: '🛁' },
    { slug: 'pintar-radiador-calefaccion', title: 'Cómo pintar un radiador de calefacción',          difficulty: 'Fácil', estimatedTime: '1-2 días (con secado entre capas)', emoji: '🌡️' },
    { slug: 'pintar-reja-verja-hierro',   title: 'Cómo pintar y proteger una verja o barandilla de hierro', difficulty: 'Media', estimatedTime: '1-2 días (con secado entre capas)', emoji: '⚙️' },
    { slug: 'restaurar-faros-coche',     title: 'Cómo restaurar los faros del coche',              difficulty: 'Media', estimatedTime: '45-60 min', emoji: '💡' },
    { slug: 'decapar-pintura-mueble',    title: 'Cómo decapar la pintura o el barniz de un mueble', difficulty: 'Media', estimatedTime: '1-2 h + tiempo de actuación', emoji: '🪑' },
    { slug: 'control-roedores',          title: 'Cómo eliminar ratones o roedores',                difficulty: 'Fácil', estimatedTime: 'Resultado en 1-2 semanas', emoji: '🐭' },
    { slug: 'usar-lejia-segura',         title: 'Cómo usar la lejía de forma segura y eficaz',      difficulty: 'Fácil', estimatedTime: '10 min', emoji: '🧴' },
    { slug: 'limpiar-plata-metales',     title: 'Cómo limpiar y abrillantar plata y otros metales', difficulty: 'Fácil', estimatedTime: '15-20 min', emoji: '🍽️' },
    { slug: 'quitar-restos-pegamento',   title: 'Cómo quitar restos de pegamento o cinta adhesiva', difficulty: 'Fácil', estimatedTime: '15-20 min', emoji: '🩹' },
    { slug: 'limpiar-moho-pared-azulejo', title: 'Cómo limpiar el moho de una pared o azulejo',    difficulty: 'Fácil', estimatedTime: '1-2 h (incluye el tiempo de actuación del producto) + varias horas de secado', emoji: '🦠' },
    { slug: 'eliminar-moho-pared-antes-pintar', title: 'Cómo eliminar el moho de una pared antes de pintar', difficulty: 'Media', estimatedTime: '1 día para limpiar y secar + 1 día para pintar (2 manos)', emoji: '🧫' },
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
        { fase: 'Preparación',  familiaSugerida: 'Limpieza / Desengrasantes', items: ['ASEVI DESENGRASANTE 750 ML.PISTOLA'] },
        { fase: 'Preparación',  familiaSugerida: 'Abrasivos',                 items: ['LIJA AL AGUA 314 HOJA 230x280 MM. P-800 01972'] },
        { fase: 'Adherencia',   familiaSugerida: 'Promotores de adherencia',  items: ['Promotor de adherencia para plástico'] },
        { fase: 'Imprimación',  familiaSugerida: 'Aparejos / Imprimaciones',  items: ['R-M IMPRIMACION PLASTICOS PM2A20 SPRAY 0,4 L.'] },
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
          productos: ['ASEVI DESENGRASANTE 750 ML.PISTOLA'],
        },
        {
          n: 2, title: 'Preparación de la superficie',
          text: 'Una lijada suave con un abrasivo de grano medio-fino crea el "anclaje" mecánico que necesita la pintura para adherirse. No hace falta llegar al plástico vivo, solo matear el brillo.',
          productos: ['LIJA AL AGUA 314 HOJA 230x280 MM. P-800 01972'],
        },
        {
          n: 3, title: 'Promotor de adherencia',
          text: 'Los plásticos (sobre todo el PP, muy habitual en paragolpes) son químicamente difíciles de pintar sin ayuda. El promotor de adherencia es lo que realmente hace posible que el sistema de pintura se quede pegado con el tiempo.',
          productos: ['Promotor de adherencia para plástico'],
        },
        {
          n: 4, title: 'Imprimación / aparejo',
          text: 'Iguala el color de base, sella la superficie y da una base uniforme sobre la que trabajar el color — evita que se transparenten diferencias del plástico de debajo.',
          productos: ['R-M IMPRIMACION PLASTICOS PM2A20 SPRAY 0,4 L.'],
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
        { nombre: 'ASEVI DESENGRASANTE 750 ML.PISTOLA',            categoria: 'Limpieza',   formato: '1 L',  precio: '12,95 €' },
        { nombre: 'LIJA AL AGUA 314 HOJA 230x280 MM. P-800 01972',                         categoria: 'Abrasivos',                  precio: '0,80 €' },
        { nombre: 'Promotor de adherencia para plástico',  categoria: 'Talleres',                    precio: '18,95 €' },
        { nombre: 'R-M IMPRIMACION PLASTICOS PM2A20 SPRAY 0,4 L.',                      categoria: 'Talleres',                    precio: '24,95 €' },
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
        { fase: 'Preparación', familiaSugerida: 'Abrasivos',            items: ['CEPILLO METALICO BRICOLAJE TENAJERO RF.11910', 'Abrasivo grano grueso'] },
        { fase: 'Tratamiento', familiaSugerida: 'Convertidores de óxido', items: ['Convertidor de óxido'] },
        { fase: 'Imprimación', familiaSugerida: 'Imprimaciones antioxidantes', items: ['AK SPRAY IMPRIMACION ZINC-ALU 400 ML. 233057'] },
        { fase: 'Color',       familiaSugerida: 'Esmaltes para metal',   items: ['Esmalte para metal — acrílico (al agua) o sintético'] },
      ],
      receta: [
        { fase: 'Cepillar',   emoji: '🧽' },
        { fase: 'Convertir',  emoji: '🧪' },
        { fase: 'Imprimar',   emoji: '🎨' },
        { fase: 'Pintar',     emoji: '🎨' },
      ],
      steps: [
        { n: 1, title: 'Eliminación mecánica del óxido', text: 'Con cepillo de púas o abrasivo de grano grueso, retira todo el óxido suelto y descamado hasta llegar a metal sano o al menos muy adherido.', productos: ['CEPILLO METALICO BRICOLAJE TENAJERO RF.11910', 'Abrasivo grano grueso'] },
        { n: 2, title: 'Convertidor de óxido', text: 'En zonas donde no se puede llegar a metal 100% limpio, un convertidor transforma químicamente el óxido restante en una capa estable sobre la que sí se puede pintar.', productos: ['Convertidor de óxido'] },
        { n: 3, title: 'AK SPRAY IMPRIMACION ZINC-ALU 400 ML. 233057', text: 'Sella la superficie y evita que la humedad vuelva a iniciar el proceso de oxidación por debajo de la pintura.', productos: ['AK SPRAY IMPRIMACION ZINC-ALU 400 ML. 233057'] },
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
        { nombre: 'CEPILLO METALICO BRICOLAJE TENAJERO RF.11910', categoria: 'Herramientas', precio: '6,50 €' },
        { nombre: 'Abrasivo grano grueso',      categoria: 'Abrasivos',   precio: '1,10 €' },
        { nombre: 'Convertidor de óxido',       categoria: 'Talleres',    precio: '16,95 €' },
        { nombre: 'AK SPRAY IMPRIMACION ZINC-ALU 400 ML. 233057',   categoria: 'Talleres',    precio: '21,95 €' },
        { nombre: 'Oxiron Agua Liso Brillo Negro (esmalte acrílico, al agua)', categoria: 'Pinturas', formato: '750 ml', precio: '20,63 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Esmalte sintético (más resistente en exterior)', nombre: 'Oxiron Forja Negro (esmalte sintético al disolvente)', precio: '15,85 €' },
        { etiqueta: 'Opción profesional sintética', nombre: 'Hammerite Esmalte Liso Hierro y Óxido Negro 750 ml', precio: '17,67 €' },
        { etiqueta: 'Opción rápida',      nombre: 'HAMMERITE ESM.LISO HIERRO Y OXIDO 750 ML.NEGRO', precio: '19,95 €' },
        { etiqueta: 'Trabajos pequeños',  nombre: 'Aerosol antioxidante', precio: '8,95 €' },
      ],
      relatedSolutions: ['pintar-plastico-coche', 'restaurar-mueble-madera', 'quitar-restos-pegamento', 'proteger-estructura-metalica-corrosion', 'pintar-metal-antioxidante-interior-exterior'],
      seo: {
        title: 'Cómo eliminar el óxido del metal | Guía — Orencio Matas',
        description: 'Cómo tratar y eliminar el óxido de una superficie metálica paso a paso, con convertidor, imprimación antioxidante y esmalte acrílico o sintético de acabado.',
      },
    },

    'pintar-metal-antioxidante-interior-exterior': {
      slug: 'pintar-metal-antioxidante-interior-exterior',
      title: 'Cómo pintar una superficie de metal en interior y exterior',
      description: 'Guía completa para pintar cualquier superficie metálica con una pintura antioxidante al agua o sintética, tanto en interior como en exterior, con todo el material necesario: pintura, herramienta de aplicación y protección de la zona de trabajo.',
      category: 'metal', subcategory: 'Pintar metal (interior y exterior)',
      problem: 'pintar_metal_general',
      objective: 'pintar',
      surface: 'metal',
      difficulty: 'Fácil',
      estimatedTime: '1 día, incluyendo el secado entre manos',
      result: 'Superficie metálica pintada de forma uniforme y protegida frente al óxido, tanto en interior como en exterior',
      colorChart: { label: 'Encuentra tu color en Titanlux', url: 'https://www.titanlux.es/', logo: 'https://static.titanlux.es/web/logo.png' },
      breadcrumb: ['Centro de Soluciones', 'Metal', 'Pintar metal (interior y exterior)'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Lijas y desengrasantes', items: ['Lija de grano medio', 'Desengrasante'] },
        { fase: 'Protección de la zona', familiaSugerida: 'Productos de enmascarado', items: ['Cinta de carrocero', 'Papel o film de enmascarar'] },
        { fase: 'Pintura',     familiaSugerida: 'Esmaltes antioxidantes', items: ['Esmalte antioxidante al agua (interior) o sintético (exterior)'] },
        { fase: 'Aplicación',  familiaSugerida: 'Útiles de aplicación',   items: ['Brocha, rodillo o pincel según la pieza', 'Cubeta para rodillo'] },
      ],
      receta: [
        { fase: 'Preparar',  emoji: '🧽' },
        { fase: 'Proteger',  emoji: '🎗️' },
        { fase: 'Pintar',    emoji: '🎨' },
        { fase: 'Secar',     emoji: '⏳' },
      ],
      steps: [
        { n: 1, title: 'Preparar la superficie', text: 'Lija ligeramente para dar agarre (sobre todo si la superficie está brillante o ya pintada) y desengrasa a fondo — cualquier resto de grasa impide que la pintura se adhiera bien, sea cual sea la calidad del producto.', productos: ['Lija de grano medio', 'Desengrasante'] },
        { n: 2, title: 'Proteger lo que no vas a pintar', text: 'Enmascara con cinta de carrocero las zonas de corte y cubre con papel o film el entorno — mucho más rápido de hacer bien ahora que de limpiar salpicaduras después.', productos: ['Cinta de carrocero', 'Papel o film de enmascarar'] },
        { n: 3, title: 'Elegir entre pintura al agua o sintética', text: 'En interior, una pintura antioxidante al agua seca más rápido y apenas tiene olor — ideal para radiadores, muebles metálicos o rejas de ventana interiores. En exterior (verjas, barandillas, mobiliario de jardín), una pintura sintética resiste mejor la intemperie a largo plazo.', productos: ['Esmalte antioxidante al agua (interior) o sintético (exterior)'] },
        { n: 4, title: 'Aplicar con la herramienta adecuada', text: 'Usa brocha en perfiles y zonas estrechas, rodillo en superficies planas grandes, y pincel fino en detalles — vertiendo la pintura en una cubeta para cargar la herramienta de forma uniforme en vez de mojarla directamente en el bote.', productos: ['Brocha, rodillo o pincel según la pieza', 'Cubeta para rodillo'] },
        { n: 5, title: 'Aplicar una segunda mano', text: 'Respeta el tiempo de secado entre manos indicado en el envase antes de aplicar la segunda — da mucha más protección y un acabado más uniforme que una sola mano gruesa.', productos: [] },
      ],
      professionalTips: [
        'Si la pieza ya tiene algo de óxido superficial, muchos esmaltes antioxidantes "3 en 1" (imprimación + color + protección) se pueden aplicar directamente sin necesidad de imprimación aparte — revisa la ficha técnica del producto elegido para confirmarlo.',
        'La pintura al agua limpia las herramientas con agua y jabón; la sintética necesita disolvente — tenlo en cuenta antes de elegir si te importa la limpieza posterior de brochas y rodillos.',
      ],
      commonMistakes: [
        'No desengrasar antes de pintar, aunque la superficie parezca limpia a simple vista.',
        'Usar una pintura de interior en una pieza de exterior expuesta a la lluvia, que se degrada mucho antes.',
        'Saltarse el enmascarado pensando que se puede limpiar después la salpicadura con facilidad.',
        'Aplicar una sola mano gruesa en vez de dos manos finas, lo que suele dar peor acabado y menos protección real.',
      ],
      recommendedProducts: [
        { nombre: 'Oxiron Agua Liso Brillo Negro (esmalte acrílico, al agua)', categoria: 'Pinturas', formato: '750 ml', precio: '20,63 €' },
        { nombre: 'BROCHA PRENSADA ESSENTIAL COMPETIDOR S-10 Nº 10', categoria: 'Herramientas', formato: 'Nº 10', precio: '3,74 €' },
        { nombre: '.CINTA FINA NARANJA ZAPHIRO 18MM X 50M', categoria: 'Talleres', formato: '18mm x 50m', precio: '3,44 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Para exterior (más resistente a la intemperie)', nombre: 'Oxiron Forja Negro (esmalte sintético al disolvente)', precio: '15,85 €' },
        { etiqueta: 'Superficies planas grandes', nombre: 'RODILLO ESP/FACHADAS SUPER FELPON 22 CMS.', precio: '7,88 €' },
        { etiqueta: 'Cubrir zonas amplias o irregulares', nombre: '.FILM CON CINTA ZAPHIRO GOLD 25 YR.x120 CM.', precio: '3,07 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal', 'elegir-pintura-segun-superficie-metal-madera-exterior', 'elegir-brocha-rodillo-pintar', 'elegir-cinta-papel-enmascarar'],
      seo: {
        title: 'Cómo pintar una superficie de metal en interior y exterior | Orencio Matas',
        description: 'Guía completa para pintar metal con pintura antioxidante al agua o sintética, con toda la herramienta y protección necesarias.',
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
        { fase: 'Decapado',     familiaSugerida: 'Decapantes',  items: ['TITAN DECAPANTE GEL PROFESIONAL 1 LL.'] },
        { fase: 'Preparación',  familiaSugerida: 'Abrasivos',   items: ['Lija de grano medio', 'Lija de grano fino'] },
        { fase: 'Reparación',   familiaSugerida: 'Masillas para madera', items: ['Masilla para madera'] },
        { fase: 'Acabado',      familiaSugerida: 'Barnices',    items: ['BARNIZ TITAN ECO SATIN.750 ML.TECA'] },
      ],
      receta: [
        { fase: 'Decapar',    emoji: '🧴' },
        { fase: 'Lijar',      emoji: '🪵' },
        { fase: 'Reparar',    emoji: '🔧' },
        { fase: 'Barnizar',   emoji: '✨' },
      ],
      steps: [
        { n: 1, title: 'Decapado del barniz antiguo', text: 'Elimina el barniz o pintura anterior con un decapante adecuado, dejando la madera desnuda y lista para trabajar.', productos: ['TITAN DECAPANTE GEL PROFESIONAL 1 LL.'] },
        { n: 2, title: 'Lijado', text: 'Empieza con grano medio para nivelar la superficie y termina con grano fino para dejarla lista para el acabado.', productos: ['Lija de grano medio', 'Lija de grano fino'] },
        { n: 3, title: 'Reparación de desperfectos', text: 'Rellena grietas, agujeros de clavo o golpes con masilla para madera antes del acabado final.', productos: ['Masilla para madera'] },
        { n: 4, title: 'Barnizado', text: 'Aplica el barniz en manos finas, lijando muy suavemente entre manos para un acabado profesional.', productos: ['BARNIZ TITAN ECO SATIN.750 ML.TECA'] },
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
        { nombre: 'TITAN DECAPANTE GEL PROFESIONAL 1 LL.',   categoria: 'Droguería',  precio: '15,95 €' },
        { nombre: 'Lija de grano medio',    categoria: 'Abrasivos',  precio: '0,90 €' },
        { nombre: 'Lija de grano fino',     categoria: 'Abrasivos',  precio: '0,90 €' },
        { nombre: 'Masilla para madera',    categoria: 'Pinturas',  precio: '9,95 €' },
        { nombre: 'BARNIZ TITAN ECO SATIN.750 ML.TECA',     categoria: 'Pinturas',  precio: '22,95 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción rápida',      nombre: 'Barniz al agua secado rápido', precio: '19,95 €' },
        { etiqueta: 'Opción profesional', nombre: 'Sistema de tinte + barniz de poliuretano', precio: '38,95 €' },
      ],
      relatedSolutions: ['igualar-color-madera-barniz', 'eliminar-oxido-metal', 'decapar-pintura-mueble', 'lacado-profesional-muebles'],
      seo: {
        title: 'Cómo restaurar un mueble de madera | Guía — Orencio Matas',
        description: 'Aprende a restaurar un mueble de madera antiguo o deteriorado: decapado, lijado, reparación de desperfectos y barnizado.',
      },
    },
    'igualar-color-madera-barniz': {
      slug: 'igualar-color-madera-barniz',
      title: 'Cómo igualar el color de una silla o mueble de madera nueva al resto',
      description: 'Consigue que una silla, mesa o mueble de madera nuevo quede exactamente del mismo tono que el resto de tu mobiliario: primero se sella el poro y después se aplica el barniz del color adecuado.',
      category: 'madera', subcategory: 'Igualar color',
      problem: 'igualar_color_madera',
      objective: 'acabado',
      surface: 'madera',
      difficulty: 'Media',
      estimatedTime: '1 día (por los secados entre manos)',
      result: 'Silla o mueble nuevo con el mismo tono que el resto del mobiliario de madera',
      // Dos líneas de barniz Titan verificadas en el catálogo real, ambas
      // disponibles en los mismos tonos de madera (roble, nogal, teca,
      // caoba...): BARNIZ TITANLUX (sintético, la línea clásica) y BARNIZ
      // TITAN ECO (al agua). Se muestran las dos cartas de colores a
      // propósito — el cliente de ayer necesitaba la opción al agua, pero
      // otro cliente con la misma necesidad podría preferir la sintética
      // (secado más lento pero acabado más resistente) — así se elige con
      // el bote real delante en vez de forzar una sola opción.
      colorCharts: [
        { label: 'Carta de colores Barniz Titanlux (sintético)', url: 'https://www.titanlux.es/', logo: 'https://static.titanlux.es/web/logo.png' },
        { label: 'Carta de colores Barniz Titan Eco (al agua)', url: 'https://www.titanlux.es/', logo: 'https://static.titanlux.es/web/logo.png' },
      ],
      breadcrumb: ['Centro de Soluciones', 'Madera y restauración', 'Igualar color'],
      materials: [
        { fase: 'Preparación',    familiaSugerida: 'Abrasivos',            items: ['Lija de grano fino (220-240)'] },
        { fase: 'Sellado del poro', familiaSugerida: 'Protectores para madera', items: ['XYLAZEL TAPAPOROS AL AGUA 750 ML.'] },
        { fase: 'Color y acabado', familiaSugerida: 'Barnices',            items: ['BARNIZ TITANLUX SATINADO 750 ML.ROBLE (sintético)', 'BARNIZ TITAN ECO SATIN.750 ML.NOGAL (al agua)'] },
      ],
      receta: [
        { fase: 'Lijar',    emoji: '🪵' },
        { fase: 'Sellar',   emoji: '🧴' },
        { fase: 'Barnizar', emoji: '🎨' },
        { fase: 'Igualar',  emoji: '✅' },
      ],
      steps: [
        { n: 1, title: 'Lijado suave de la pieza nueva', text: 'Aunque la madera venga ya lijada de fábrica, pasa una lija de grano fino para abrir ligeramente el poro y que el sellador y el barniz agarren de forma uniforme en toda la pieza.', productos: ['Lija de grano fino (220-240)'] },
        { n: 2, title: 'Sellado del poro', text: 'Aplica un tapaporos antes de barnizar — sin este paso, la madera nueva absorbe el barniz de forma irregular según la zona (más en los poros abiertos, menos en los cerrados), y el color final nunca queda uniforme ni igual al resto de tus muebles.', productos: ['XYLAZEL TAPAPOROS AL AGUA 750 ML.'] },
        { n: 3, title: 'Elegir la línea de barniz', text: 'Titan ofrece el mismo abanico de tonos de madera en dos versiones: la sintética clásica (Barniz Titanlux, secado más lento pero acabado muy resistente) y la línea al agua (Barniz Titan Eco, seca más rápido y con menos olor). Compara el tono real de tu mueble actual con la carta de colores de la línea que prefieras antes de comprar el bote — la carta de colores en pantalla u orientativa nunca sustituye a ver el color real.', productos: [] },
        { n: 4, title: 'Prueba en una zona oculta', text: 'Antes de barnizar toda la pieza, aplica una mano en la parte de abajo del asiento o en una zona que no se vea, deja secar del todo, y compara el resultado real bajo la misma luz con el resto de tu mobiliario. Es mucho más fiable que fiarte solo del tono del bote o de la carta de colores.', productos: [] },
        { n: 5, title: 'Barnizado en manos finas', text: 'Aplica el barniz elegido en 2-3 manos finas, siguiendo la veta de la madera, lijando muy suavemente entre manos con una lija muy fina para que el acabado quede uniforme.', productos: ['BARNIZ TITANLUX SATINADO 750 ML.ROBLE (sintético)', 'BARNIZ TITAN ECO SATIN.750 ML.NOGAL (al agua)'] },
      ],
      professionalTips: [
        'El color de un barniz cambia según el número de manos aplicadas y el tono original de la madera de debajo — dos maderas distintas con el mismo barniz pueden no quedar exactamente iguales. La prueba en zona oculta del paso 4 es el paso que marca la diferencia entre un color aproximado y uno realmente igualado.',
        'Si la madera nueva es más clara o más oscura que el resto de tu mobiliario, a veces hace falta una mano extra (o una menos) del mismo barniz para compensar el tono de base — no siempre el mismo número de manos da el mismo resultado en maderas distintas.',
      ],
      commonMistakes: [
        'Barnizar directamente sin sellar antes el poro (la causa más habitual de que el color quede irregular o más oscuro en unas zonas que en otras).',
        'Comprar el bote solo mirando el color en la carta o en la pantalla, sin comparar con la madera real.',
        'No hacer la prueba en una zona oculta antes de barnizar la pieza completa.',
        'Mezclar barniz sintético y al agua sobre la misma pieza sin dejar secar y lijar bien entre ambos.',
        'Aplicar el barniz en manos demasiado gruesas, lo que oscurece el tono más de lo esperado.',
      ],
      recommendedProducts: [
        { nombre: 'Lija de grano fino (220-240)', categoria: 'Abrasivos', precio: '0,90 €' },
        { nombre: 'XYLAZEL TAPAPOROS AL AGUA 750 ML.', categoria: 'Pinturas', precio: '13,38 €' },
        { nombre: 'BARNIZ TITAN ECO SATIN.750 ML.NOGAL', categoria: 'Pinturas', precio: '17,42 €' },
        { nombre: 'BARNIZ TITANLUX SATINADO 750 ML.ROBLE', categoria: 'Pinturas', precio: '16,46 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Sintético (más resistente)', nombre: 'BARNIZ TITANLUX SATINADO 750 ML.CAOBA', precio: '16,46 €' },
        { etiqueta: 'Al agua (secado rápido, menos olor)', nombre: 'BARNIZ TITAN ECO SATIN.750 ML.TECA', precio: '17,42 €' },
      ],
      relatedSolutions: ['restaurar-mueble-madera', 'decapar-pintura-mueble', 'lacado-profesional-muebles'],
      seo: {
        title: 'Cómo igualar el color de una silla o mueble de madera | Orencio Matas',
        description: 'Cómo conseguir que una silla o mueble de madera nuevo quede del mismo color que el resto: sellado del poro y barnizado con carta de colores Titan sintética y al agua.',
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
        { fase: 'Limpieza',       familiaSugerida: 'Limpieza / Desengrasantes', items: ['Champú de lavado', 'PLASTILINA LIMPIEZA ZAPHIRO 200 ML.'] },
        { fase: 'Evaluación',     familiaSugerida: 'Herramientas de medición',  items: ['Medidor de espesor de pintura (opcional)'] },
        { fase: 'Pulido',         familiaSugerida: 'Pulimentos',                items: ['Pasta de pulir de corte medio', 'PULIMENTO FINO ZAPHIRO (PASO 2) SATURNO 1 L.'] },
        { fase: 'Protección',     familiaSugerida: 'Ceras y selladores',        items: ['PROTECTOR ALTO BRILLO ZAPHIRO WAX 0,5 L.'] },
      ],
      receta: [
        { fase: 'Limpiar',        emoji: '🧴' },
        { fase: 'Descontaminar',  emoji: '🧽' },
        { fase: 'Pulir',          emoji: '✨' },
        { fase: 'Proteger',       emoji: '🛡️' },
      ],
      steps: [
        { n: 1, title: 'Limpieza', text: 'Lava la zona a fondo para que no quede ninguna partícula abrasiva (arena, polvo) que pueda generar más marcas durante el pulido.', productos: ['Champú de lavado'] },
        { n: 2, title: 'Descontaminación', text: 'Pasa una arcilla descontaminante para retirar partículas incrustadas en la pintura (alquitrán, restos industriales) que el lavado normal no quita.', productos: ['PLASTILINA LIMPIEZA ZAPHIRO 200 ML.'] },
        { n: 3, title: 'Evaluación de la profundidad', text: 'Si el arañazo se nota al pasar la uña, probablemente ha llegado a la base de color y el pulido no bastará por sí solo — en ese caso hará falta un pequeño retoque de pintura antes de pulir.', productos: [] },
        { n: 4, title: 'Pulido', text: 'Trabaja primero con una pasta de corte medio para nivelar el arañazo, y termina con un pulimento de acabado para devolver el brillo final.', productos: ['Pasta de pulir de corte medio', 'PULIMENTO FINO ZAPHIRO (PASO 2) SATURNO 1 L.'] },
        { n: 5, title: 'Protección', text: 'Sella el trabajo con cera o un sellador sintético — además de proteger, hace que el brillo dure mucho más tiempo.', productos: ['PROTECTOR ALTO BRILLO ZAPHIRO WAX 0,5 L.'] },
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
        { nombre: 'PLASTILINA LIMPIEZA ZAPHIRO 200 ML.',         categoria: 'Talleres',   precio: '14,95 €' },
        { nombre: 'Pasta de pulir de corte medio',   categoria: 'Talleres',   precio: '16,50 €' },
        { nombre: 'PULIMENTO FINO ZAPHIRO (PASO 2) SATURNO 1 L.',            categoria: 'Talleres',   precio: '15,95 €' },
        { nombre: 'PROTECTOR ALTO BRILLO ZAPHIRO WAX 0,5 L.',   categoria: 'Talleres',   precio: '19,95 €' },
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
      relatedSolutions: ['control-plagas-cocina', 'renovar-banera-lavabo-sanitario', 'pintar-azulejos', 'limpiar-moho-pared-azulejo'],
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
        { nombre: 'TITANTECH PXB-700 Base Epoxi Suelos 4 L Base Neutra', categoria: 'Talleres', formato: '4 L', precio: '72,93 €', fichaTecnica: 'http://ficheros.industriastitan.es/titan/FICHAS%20TECNICAS/X70_0000_PXB700_EPOXI_SUELOS_ES.pdf?v=2023-06-27-165500' },
        { nombre: 'TITANTECH PXB-700 Endurecedor Epoxi Suelos',          categoria: 'Talleres', formato: '1 L', precio: '15,55 €', fichaTecnica: 'http://ficheros.industriastitan.es/titan/FICHAS%20TECNICAS/X70_0000_PXB700_EPOXI_SUELOS_ES.pdf?v=2023-06-27-165500' },
        { nombre: 'TITANTECH PXB-700 Epoxi Suelos 15 L Base Neutra',     categoria: 'Talleres', formato: '15 L (superficies grandes)', precio: '253,56 €', fichaTecnica: 'http://ficheros.industriastitan.es/titan/FICHAS%20TECNICAS/X70_0000_PXB700_EPOXI_SUELOS_ES.pdf?v=2023-06-27-165500' },
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
        { nombre: 'ASTRALPOOL INCREMENT.DE PH 5 KG.',                categoria: 'Piscinas', formato: '5 kg',  precio: '12,64 €' },
        { nombre: 'Astralpool Cloro Rápido Granulado',              categoria: 'Piscinas', formato: '5 kg',  precio: '28,85 €' },
        { nombre: 'Astralpool Cloro Lento en Tableta',              categoria: 'Piscinas', formato: '5 kg',  precio: '33,93 €' },
        { nombre: 'Antialgas Líquido Astralpool',                   categoria: 'Piscinas', formato: '5 L',   precio: '10,04 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Todo en uno',       nombre: 'Astralpool Inverlong Dosificador Flotante Todo en 1', precio: '15,44 €' },
        { etiqueta: 'Opción profesional/comunidad', nombre: 'CTX 15 REDUCTOR PH PROF.20 L.73670', precio: '35,07 €' },
      ],
      relatedSolutions: ['tratamiento-choque-piscina'],
      seo: {
        title: 'Cómo mantener el agua de la piscina en buen estado | Orencio Matas',
        description: 'Guía de mantenimiento de piscinas: cómo medir y ajustar el pH, clorar correctamente y prevenir la aparición de algas.',
      },
    },

    'tratamiento-choque-piscina': {
      slug: 'tratamiento-choque-piscina',
      title: 'Cómo hacer un tratamiento de choque en la piscina con hipoclorito de sodio',
      description: 'Calcula la dosis exacta de hipoclorito de sodio líquido según los metros cúbicos de tu piscina y la concentración de tu garrafa (10 o 20 L), tanto para el mantenimiento diario como para una cloración de choque.',
      category: 'piscinas', subcategory: 'Cloración de choque',
      problem: 'choque_piscina',
      objective: 'limpiar',
      surface: 'piscina',
      difficulty: 'Fácil',
      estimatedTime: '15-20 min de aplicación + varias horas de reposo',
      result: 'Cloro libre en el nivel correcto, con la dosis exacta calculada para tu piscina',
      breadcrumb: ['Centro de Soluciones', 'Piscinas', 'Cloración de choque'],
      materials: [
        { fase: 'Medición',    familiaSugerida: 'Análisis de agua',    items: ['Tiras analíticas o analizador de pH y cloro'] },
        { fase: 'Ajuste pH',   familiaSugerida: 'Reguladores de pH',   items: ['Incrementador de pH', 'Reductor de pH'] },
        { fase: 'Choque',      familiaSugerida: 'Hipoclorito de sodio', items: ['Hipoclorito de sodio líquido (10 L o 20 L)'] },
        { fase: 'Protección',  familiaSugerida: 'Protección personal', items: ['Guantes resistentes a productos químicos'] },
      ],
      receta: [
        { fase: 'Medir',         emoji: '🧪' },
        { fase: 'Ajustar pH',    emoji: '⚖️' },
        { fase: 'Calcular dosis', emoji: '🧮' },
        { fase: 'Aplicar',       emoji: '💧' },
      ],
      steps: [
        { n: 1, title: 'Medir el pH y el cloro actual', text: 'Antes de nada, mide el agua con tiras analíticas o un analizador — la dosis de hipoclorito se calcula sobre la SUBIDA de cloro que necesitas, así que hay que saber de dónde partes.', productos: ['Tiras analíticas o analizador de pH y cloro'] },
        { n: 2, title: 'Ajustar el pH antes de clorar', text: 'Lleva el pH al rango correcto (en torno a 7,2-7,6) con incrementador o reductor según el resultado — el hipoclorito pierde eficacia si el pH no está en su rango, así que se ajusta SIEMPRE antes, nunca después.', productos: ['Incrementador de pH', 'Reductor de pH'] },
        { n: 3, title: 'Calcular la dosis exacta', text: 'Usa la calculadora de esta guía: indica los m³ de tu piscina (o sus medidas), la concentración de tu garrafa de hipoclorito y si quieres hacer un mantenimiento normal o una cloración de choque — te da la cantidad exacta en litros o ml.', productos: [] },
        { n: 4, title: 'Diluir y aplicar con la bomba en marcha', text: 'Nunca viertas el hipoclorito directamente y de golpe en un mismo punto — puede decolorar el revestimiento. Dilúyelo en un cubo con agua y repártelo caminando por todo el perímetro, con el sistema de filtración en funcionamiento para que se mezcle bien.', productos: ['Hipoclorito de sodio líquido (10 L o 20 L)'] },
        { n: 5, title: 'Dejar actuar y no bañarse todavía', text: 'Deja la bomba en marcha varias horas (idealmente toda la noche) y no te bañes hasta que el cloro libre vuelva a bajar de 3 ppm al medirlo de nuevo — normalmente entre 8 y 12 horas después, según la dosis aplicada.', productos: [] },
        { n: 6, title: 'Volver a medir antes de bañarte', text: 'Repite la medición de pH y cloro antes de que nadie se bañe — confirma que el cloro libre está ya en un nivel seguro (por debajo de 3 ppm) y el pH sigue en rango.', productos: ['Tiras analíticas o analizador de pH y cloro'] },
      ],
      professionalTips: [
        'Aplica el choque al atardecer o de noche — el sol degrada el cloro con rapidez, así que de día una parte importante de la dosis se pierde antes de hacer efecto.',
        'Ponte guantes resistentes a productos químicos al manipular el hipoclorito — es corrosivo y puede irritar la piel y decolorar la ropa en caso de salpicadura.',
        'Guarda el hipoclorito en un sitio fresco, oscuro y ventilado — pierde concentración con el calor y la luz, incluso sin abrir.',
      ],
      commonMistakes: [
        'Verter el hipoclorito directamente y sin diluir en un único punto de la piscina.',
        'Bañarse antes de que el cloro libre haya vuelto a bajar de 3 ppm.',
        'Aplicar el choque sin haber ajustado antes el pH — el cloro pierde gran parte de su eficacia con el pH fuera de rango.',
        'Mezclar el hipoclorito con otros productos químicos de piscina directamente entre sí.',
        'Aplicar la dosis de choque a pleno sol, en vez de al atardecer o de noche.',
      ],
      calculadoraCloro: {
        // ml de hipoclorito de sodio por cada 1 m³ (1.000 L) de agua, para
        // subir el cloro libre aproximadamente 1 ppm — tabla de referencia
        // proporcionada, una entrada por concentración disponible en la
        // calculadora.
        dosisPorM3PorPpm: { 5: 20, 10: 10, 12: 8.3, 12.5: 8, 13: 7.7, 15: 6.7 },
      },
      recommendedProducts: [
        { nombre: 'HIPOCLORITO SODICO 10 L.12 KG.ENVASE VERDE INCL.', categoria: 'Piscinas', formato: '10 L', precio: '12,58 €' },
        { nombre: 'HIPOCLORITO SODICO 20 L.25 KG.ENV.AZUL RETORNABLE', categoria: 'Piscinas', formato: '20 L', precio: '16,52 €' },
        { nombre: 'ASTRALPOOL TIRAS ANALITICAS 3 EN 1 50 UDS.41925', categoria: 'Piscinas', formato: '50 uds', precio: '13,84 €' },
        { nombre: 'GUANTES LATEX AZUL EXT.FUERTE  50 UDS.T/M/L/XL', categoria: 'Protección personal', formato: '50 uds', precio: '20,27 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Formato granulado (alternativa)', nombre: 'Astralpool Cloro Rápido Granulado', precio: '28,85 €' },
        { etiqueta: 'Ajuste de pH antes del choque', nombre: 'ASTRALPOOL INCREMENT.DE PH 5 KG.', precio: '12,64 €' },
      ],
      relatedSolutions: ['mantenimiento-piscina'],
      seo: {
        title: 'Dosis de hipoclorito para el choque de cloro | Orencio Matas',
        description: 'Calculadora de dosis de hipoclorito de sodio para piscinas: introduce los m³ o las medidas de tu piscina y la concentración de tu garrafa para el mantenimiento o la cloración de choque.',
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
        { nombre: 'ARRIXACA INSECT.CUCARACHICIDA 750 ML.',                    categoria: 'Droguería', formato: '600 ml', precio: '7,56 €' },
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
        { nombre: 'TITANPRO P-40 P.Acrílica Premium Mate 15 L. Blanco', categoria: 'Pinturas', formato: '15 L',  precio: '66,03 €', fichaTecnica: 'https://www.titanpro.es/es/productos/p-40-pintura-acrilica-premium-mate' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción económica (retoques)', nombre: 'Jamicolor Pintura Plástica Mate Int/Ext 750 ml Blanco', precio: '2,54 €' },
        { etiqueta: 'Mayor cobertura',              nombre: 'Gilmaplas Pintura Plástica Satinada Extra 15 L', precio: '65,88 €' },
      ],
      relatedSolutions: ['restaurar-mueble-madera', 'eliminar-moho-pared-antes-pintar', 'pintar-techo-pasta-temple'],
      seo: {
        title: 'Cómo pintar una pared por dentro | Orencio Matas',
        description: 'Guía para preparar, imprimar si hace falta, y pintar correctamente una pared de interior, con dos manos de pintura plástica.',
      },
    },

    'pintar-techo-pasta-temple': {
      slug: 'pintar-techo-pasta-temple',
      title: 'Cómo pintar un techo de interior con pasta al temple',
      description: 'Pinta un techo (o pared) de interior con pasta al temple, la pintura tradicional en polvo/pasta que se diluye con agua, en acabado liso, gotelé o picado según cuánta densidad le des a la mezcla.',
      category: 'pintura', subcategory: 'Pintura de interior',
      problem: 'pintar_techo_temple',
      objective: 'pintar',
      surface: 'pared',
      difficulty: 'Fácil',
      estimatedTime: '1 día (según acabado y tiempo de secado entre manos)',
      result: 'Techo o pared de interior pintados con pasta al temple, en el acabado liso, gotelé o picado elegido',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Pintura de interior'],
      calculadoraTemple: {
        opciones: [
          { id: 'liso',   label: 'Liso',   rendimientoMin: 6, rendimientoMax: 7, aguaMinMlKg: 600, aguaMaxMlKg: 700 },
          { id: 'gotele', label: 'Gotelé', rendimiento: 1 },
          { id: 'picado', label: 'Picado', rendimiento: 1 },
        ],
      },
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Lijas y limpieza',    items: ['Lija fina (si hay imperfecciones)', 'Limpieza de polvo y grasa'] },
        { fase: 'Dilución',    familiaSugerida: 'Pasta al temple',     items: ['Recipiente limpio para diluir', 'Agua'] },
        { fase: 'Pintura',     familiaSugerida: 'Pasta al temple',     items: ['Pasta al temple (liso, gotelé o picado)'] },
        { fase: 'Aplicación',  familiaSugerida: 'Útiles de aplicación', items: ['Rodillo de pelo corto (liso) o pistola de gotelé (gotelé/picado)', 'Brocha para remates', 'Cinta de carrocero y plástico de protección'] },
      ],
      receta: [
        { fase: 'Preparar', emoji: '🧹' },
        { fase: 'Diluir',   emoji: '💧' },
        { fase: 'Aplicar',  emoji: '🎨' },
        { fase: 'Secar',    emoji: '⏳' },
      ],
      steps: [
        { n: 1, title: 'Preparar la superficie', text: 'Elimina el polvo y la grasa del techo o pared, y lija ligeramente cualquier imperfección — la pasta al temple cubre bien pero no disimula grietas ni desconchones importantes.', productos: ['Lija fina (si hay imperfecciones)', 'Limpieza de polvo y grasa'] },
        { n: 2, title: 'Proteger la zona de trabajo', text: 'En gotelé o picado aplicado a pistola las salpicaduras llegan mucho más lejos que con rodillo — protege suelo y muebles con plástico y cinta de carrocero antes de empezar.', productos: ['Cinta de carrocero y plástico de protección'] },
        { n: 3, title: 'Diluir la pasta al temple', text: 'Deposita el contenido en un recipiente limpio y agita unos momentos antes de añadir el agua. Remueve lentamente mientras vas agregando el agua poco a poco: para acabado liso, entre 600 y 700 ml de agua por Kg de pintura; para gotelé o picado, ve añadiendo agua según la densidad que busques (más agua, gota más fina; menos agua, textura más gruesa) — usa la calculadora de abajo como punto de partida.', productos: ['Recipiente limpio para diluir', 'Agua', 'Pasta al temple (liso, gotelé o picado)'] },
        { n: 4, title: 'Aplicar según el acabado', text: 'En liso, aplica con rodillo de pelo corto en pasadas cruzadas, rematando ángulos y esquinas con brocha. En gotelé o picado, aplica con pistola de gotelé (o el útil recomendado por el fabricante) manteniendo siempre la misma distancia y presión para que la textura salga uniforme en toda la superficie.', productos: ['Rodillo de pelo corto (liso) o pistola de gotelé (gotelé/picado)', 'Brocha para remates'] },
        { n: 5, title: 'Dejar secar y repasar si hace falta', text: 'Deja secar por completo. En acabado liso, una segunda mano suele dar un resultado más uniforme; en gotelé y picado, con una mano bien aplicada suele ser suficiente.', productos: [] },
      ],
      professionalTips: [
        'Si vas a aplicar a pistola (gotelé o picado), protégete con mascarilla — así lo indica el propio fabricante en el envase.',
        'La pasta al temple se limpia solo con agua mientras está fresca — una vez seca sobre suelos o muebles cuesta mucho más, de ahí la importancia de proteger bien antes de empezar.',
        'Antes de diluir toda la pasta para gotelé o picado, prueba la densidad en una zona pequeña oculta — así evitas quedarte corto o pasarte de agua en toda la mezcla de una vez.',
      ],
      commonMistakes: [
        'No agitar bien la pasta antes de empezar a añadir el agua, dejando grumos que luego se notan en la superficie.',
        'Añadir toda el agua de golpe en vez de ir removiendo lentamente mientras se agrega poco a poco.',
        'No proteger suelo y muebles antes de aplicar gotelé o picado a pistola, donde las salpicaduras llegan mucho más lejos que con rodillo.',
        'Aplicar a pistola sin mascarilla.',
      ],
      recommendedProducts: [
        { nombre: 'PASTA AL TEMPLE LISO SACO 22 KG.', categoria: 'Pinturas', formato: '22 Kg', precio: '7,24 €' },
        { nombre: 'PASTA AL TEMPLE BOLSA 1 KG. BLANCA (S/20 bolsas)', categoria: 'Pinturas', formato: '1 Kg', precio: '0,77 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Formato granel',              nombre: 'PASTA AL TEMPLE GRANEL SACO 22 KG.', precio: '7,18 €' },
        { etiqueta: 'Versión reforzada',            nombre: 'PASTA AL TEMPLE REFORZADA BOLSA 5 KG.BLA/CREMA', precio: '4,51 €' },
        { etiqueta: 'Específica para gotelé',       nombre: 'PASTA AL TEMPLE GOTELE JAFEP 25 KG.', precio: '11,30 €' },
        { etiqueta: 'Formato intermedio',           nombre: 'PASTA AL TEMPLE BOLSA 5 KG. BLANCA (S/4 bolsas)', precio: '3,30 €' },
      ],
      relatedSolutions: ['pintar-pared-interior', 'elegir-brocha-rodillo-pintar', 'elegir-cinta-papel-enmascarar'],
      seo: {
        title: 'Cómo pintar un techo de interior con pasta al temple | Orencio Matas',
        description: 'Guía para diluir y aplicar pasta al temple en techos y paredes de interior, en acabado liso, gotelé o picado, con calculadora de cantidad y dilución.',
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
        { etiqueta: 'Monodosis',                 nombre: 'PASO DESATASCADOR GEL PROFESIONAL 1 L.', precio: '0,61 €' },
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
        { nombre: 'ROE-BLOCK PLUS MASSÓ RATICIDA 1 KG.',           categoria: 'Droguería', formato: '20x10 g', precio: '3,41 €' },
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
        { nombre: 'HUMUS DE LOMBRIZ ABONO LIQUIDO 1 L.', categoria: 'Droguería', formato: '1,3 L', precio: '7,04 €' },
        { nombre: 'Gesal Insecticida Polivalente',          categoria: 'Droguería', formato: '500 ml (pistola)', precio: '4,32 €' },
        { nombre: 'Humus HLH Equisetem Fungicida',          categoria: 'Droguería', formato: '1 L', precio: '7,62 €' },
        { nombre: 'Compo Pasta Cicatrizante',               categoria: 'Droguería', formato: '250 g', precio: '8,74 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Plantas verdes/interior', nombre: 'Compo Fertilizante Líquido Plantas Verdes 1,3 L', precio: '7,15 €' },
        { etiqueta: 'Formato pequeño',          nombre: 'Impex Abono Universal 1 L', precio: '4,73 €' },
        { etiqueta: 'Contra hormigas específico', nombre: 'GESAL INSECT.ANTIHORMIGAS 500 GRS.', precio: '4,96 €' },
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
        { nombre: 'POLIL COLGADOR ANTIPOLILLA 4 UDS.LAVANDA',            categoria: 'Droguería', formato: '3 bloques', precio: '3,46 €' },
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
        { nombre: 'IMPRIMACION CHAPA/CRISTAL ZAPHIRO ZXS100 N 30ML.',            categoria: 'Talleres', precio: '2,31 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción económica',    nombre: 'Adhesivo PUR de Lunas ZXS150 310 ml', precio: '7,91 €' },
        { etiqueta: 'Reparación puntual',  nombre: 'ADHESIVO LUNAS MS POLIMERO ZXS410 290 ML. ZAPHIRO', precio: '17,53 €' },
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
        { nombre: 'TITAN-PRO R40 NF 100% ACRILICO MATE WHITE=WB 15 L.', categoria: 'Pinturas', formato: '15 L', precio: '95,41 €', fichaTecnica: 'https://www.titanpro.es/productos/r-40-revestimiento-liso-100-acrilico-puro' },
        { nombre: 'Aguaplast Exterior',                                  categoria: 'Pinturas', formato: '1,5 kg', precio: '5,43 €' },
        { nombre: 'Recambio Rodillo Fachadas Tripol',                     categoria: 'Pinturas', formato: '22 cm', precio: '4,69 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Color a elegir (Titán)', nombre: 'Orion A4 Plástico Fachadas Mate 15 L', precio: '73,93 €' },
        { etiqueta: 'Formato pequeño/retoque', nombre: 'Morakron Fachadas Ladrillo 1 L', precio: '5,52 €' },
        { etiqueta: 'Revestimiento con textura', nombre: 'Revotex Revestimiento Fachadas 4 L', precio: '21,73 €' },
      ],
      relatedSolutions: ['impermeabilizar-terraza-goteras', 'pintar-pared-interior', 'reparar-fisuras-fachada-hormigon', 'proteger-fachada-mortero-monocapa'],
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
      relatedSolutions: ['pintar-plastico-coche', 'corregir-descuelgues-pintura', 'elegir-lijadora-superficie'],
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
      description: 'Pinta estufas, chimeneas o tubos de escape con pintura anticalórica, la única que aguanta sin quemarse ni desprenderse con el calor extremo. Para un radiador de calefacción normal, consulta la guía específica de radiadores.',
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
        { n: 1, title: 'Apagar y dejar enfriar por completo', text: 'Nunca pintes con la estufa, la chimenea o el tubo todavía calientes — además del riesgo, la pintura no se aplica ni seca bien sobre una superficie caliente.', productos: [] },
        { n: 2, title: 'Limpiar y lijar ligeramente', text: 'Desengrasa a fondo (hollín, grasa) y lija suavemente para que la pintura nueva agarre bien sobre el metal o la pintura vieja bien adherida.', productos: ['Desengrasante', 'Lija fina'] },
        { n: 3, title: 'Aplicar la pintura anticalórica', text: 'Usa siempre una pintura específica anticalórica — un esmalte normal se quema, amarillea o se desprende en cuanto la pieza vuelve a calentarse. Aplica en manos finas.', productos: ['Pintura o esmalte anticalórico'] },
        { n: 4, title: 'Curado con calor', text: 'Muchas pinturas anticalóricas necesitan un primer ciclo de calor suave (encender el radiador/estufa a baja potencia) para terminar de curar y fijar el acabado — consulta el envase para el proceso exacto.', productos: [] },
      ],
      professionalTips: [
        'Cada pintura anticalórica tiene una temperatura máxima soportada (habitual: 300°C para estufas domésticas, hasta 800°C para tubos de escape) — comprueba que el producto aguanta la temperatura real de la pieza antes de comprarlo. Para un radiador de agua normal no hace falta una pintura anticalórica: basta con un esmalte específico para radiadores.',
      ],
      commonMistakes: [
        'Usar un esmalte normal en vez de uno anticalórico específico.',
        'Pintar con la pieza todavía caliente.',
        'No dejar el primer ciclo de calor suave para terminar de curar la pintura.',
        'Elegir una pintura anticalórica con menos temperatura soportada de la que la pieza alcanza en uso real.',
      ],
      recommendedProducts: [
        { nombre: 'OXIRON ANTICALORICO 750 ML.NEGRO', categoria: 'Pinturas', formato: '750 ml', precio: '18,71 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Tubos de escape (muy alta temperatura)', nombre: '.AK SPRAY ANTICALORICO 800º NEGRO 400 ML. 233099', precio: '15,19 €' },
        { etiqueta: 'Formato spray',                            nombre: 'SPRAY TITAN ANTICALORICO 400 ML NEGRO (302)', precio: '10,62 €' },
        { etiqueta: 'Acabado aluminio',                         nombre: 'TITAN ALUMINIO ANTICALORICO  750 ML', precio: '17,40 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal', 'pintar-radiador-calefaccion'],
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
        { nombre: 'KIT RESTAURACION FAROS C/POLIMERO ZAPHIRO CR03061',              categoria: 'Talleres', precio: '42,87 €' },
        { nombre: 'Spraymax Barniz 2K Óptica Faros 2en1',    categoria: 'Talleres', formato: '250 ml', precio: '25,35 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción completa/profesional', nombre: 'BODY LENS CLEAR SPRAY LACA FAROS 400 ML.', precio: '99,83 €' },
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
      relatedSolutions: ['pintar-pared-interior', 'renovar-banera-lavabo-sanitario', 'sellar-juntas-bano'],
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
        { nombre: 'AUTAN MOSQUITOS 100 ML.SPRAY ULTRA REPELENTE',     categoria: 'Droguería', formato: '500 ml', precio: '7,68 €' },
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
        { fase: 'Reparación rápida', familiaSugerida: 'Pegamentos instantáneos', items: ['SUPER GLUE-3 3 GRS.'] },
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
        { n: 5, title: 'Reparación rápida o pequeña', text: 'Para roturas pequeñas o reparaciones puntuales que necesitan fraguado en segundos, un pegamento instantáneo es la opción más práctica — aunque suele ser más rígido y menos adecuado para superficies grandes.', productos: ['SUPER GLUE-3 3 GRS.'] },
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
        { etiqueta: 'Reparación rápida',  nombre: 'SUPER GLUE-3 3 GRS.', precio: '2,20 €' },
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

    'limpiar-plata-metales': {
      slug: 'limpiar-plata-metales',
      title: 'Cómo limpiar y abrillantar plata, cobre o acero inoxidable',
      description: 'Recupera el brillo de objetos de plata, cobre o acero inoxidable que se han oscurecido u oxidado con el tiempo, sin rayarlos.',
      category: 'limpieza', subcategory: 'Limpieza de metales decorativos',
      problem: 'plata_oscurecida',
      objective: 'limpiar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '15-20 min',
      result: 'Objetos de plata, cobre o acero inoxidable limpios y brillantes de nuevo',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Limpieza de metales decorativos'],
      materials: [
        { fase: 'Plata',  familiaSugerida: 'Limpiametales', items: ['Limpiaplata específico'] },
        { fase: 'Cobre',  familiaSugerida: 'Limpiametales', items: ['Limpiador específico para cobre'] },
        { fase: 'Acero',  familiaSugerida: 'Limpiametales', items: ['Limpiador de acero inoxidable'] },
        { fase: 'Acabado',familiaSugerida: '—',             items: ['Paño suave'] },
      ],
      receta: [
        { fase: 'Identificar', emoji: '🔍' },
        { fase: 'Aplicar',     emoji: '🧴' },
        { fase: 'Frotar',      emoji: '✋' },
        { fase: 'Abrillantar', emoji: '✨' },
      ],
      steps: [
        { n: 1, title: 'Identificar el metal', text: 'Plata, cobre y acero inoxidable se oscurecen y manchan de forma distinta — cada uno tiene su propio limpiador específico, y usar el que no toca puede no limpiar bien o incluso dañar el acabado.', productos: [] },
        { n: 2, title: 'Aplicar el limpiador específico', text: 'Aplica el producto adecuado según el metal, siguiendo las instrucciones del envase — algunos se aplican con paño, otros en spray directo.', productos: ['Limpiaplata específico', 'Limpiador específico para cobre', 'Limpiador de acero inoxidable'] },
        { n: 3, title: 'Frotar suavemente', text: 'Frota con un paño suave, sin objetos abrasivos que puedan rayar el metal — la plata y el acero inoxidable se rayan con facilidad.', productos: [] },
        { n: 4, title: 'Abrillantar y pulir', text: 'Termina con un paño limpio y seco para retirar cualquier resto de producto y dejar el brillo final.', productos: ['Paño suave'] },
      ],
      professionalTips: [
        'Un paño específico de limpieza de plata de larga duración evita tener que repetir el proceso completo cada pocas semanas — se puede usar para el mantenimiento habitual entre limpiezas a fondo.',
      ],
      commonMistakes: [
        'Usar un limpiador de acero inoxidable sobre plata o cobre (no es el producto adecuado).',
        'Frotar con estropajos u objetos abrasivos que rayan el metal.',
        'No retirar bien el resto de producto, que puede volver a oscurecer el metal con el tiempo.',
        'Guardar la plata limpia sin ninguna protección, dejando que se oscurezca de nuevo enseguida.',
      ],
      recommendedProducts: [
        { nombre: 'Tarni-Shield Limpia Plata',   categoria: 'Droguería', formato: '250 ml', precio: '2,35 €' },
        { nombre: 'Tarni-Shield Cobre',           categoria: 'Droguería', formato: '250 ml', precio: '2,72 €' },
        { nombre: 'Paso Limpiador Acero Inox',    categoria: 'Droguería', formato: '500 ml', precio: '7,68 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Mantenimiento habitual', nombre: 'Tarni-Shield Paño Limpia Plata Larga Duración', precio: '3,36 €' },
        { etiqueta: 'Formato grande plata',    nombre: 'Tarni-Shield Limpia Plata 1 L', precio: '11,43 €' },
        { etiqueta: 'Uso profesional acero',   nombre: 'Inoxbrill Limpiador Abrillantador Acero Inox 5 L', precio: '32,72 €' },
      ],
      relatedSolutions: [],
      seo: {
        title: 'Cómo limpiar y abrillantar plata, cobre o acero inoxidable | Orencio Matas',
        description: 'Guía para limpiar objetos de plata, cobre o acero inoxidable oscurecidos, recuperando su brillo sin rayarlos.',
      },
    },

    'usar-lejia-segura': {
      slug: 'usar-lejia-segura',
      title: 'Cómo usar la lejía de forma segura',
      description: 'Aprende a diluir y usar la lejía correctamente para desinfectar sin dañar superficies ni poner en riesgo tu salud.',
      category: 'limpieza', subcategory: 'Uso seguro de productos químicos',
      problem: 'usar_lejia',
      objective: 'limpiar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '10 min',
      result: 'Superficie desinfectada correctamente, sin riesgos para la salud ni daños al material',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Uso seguro de productos químicos'],
      materials: [
        { fase: 'Producto',    familiaSugerida: 'Lejías',    items: ['Lejía'] },
        { fase: 'Protección',  familiaSugerida: 'Guantes',   items: ['Guantes de protección'] },
        { fase: 'Aplicación',  familiaSugerida: '—',         items: ['Agua para diluir', 'Paño o bayeta'] },
      ],
      receta: [
        { fase: 'Ventilar', emoji: '🌬️' },
        { fase: 'Diluir',   emoji: '💧' },
        { fase: 'Aplicar',  emoji: '🧴' },
        { fase: 'Aclarar',  emoji: '🚿' },
      ],
      steps: [
        { n: 1, title: 'Ventilar la zona', text: 'Abre ventanas antes de empezar — los vapores de la lejía en un espacio cerrado pueden irritar las vías respiratorias.', productos: [] },
        { n: 2, title: 'Diluir siempre en agua', text: 'La lejía casi nunca se usa pura — dilúyela en agua según las proporciones del envase (habitualmente muy poca cantidad por litro de agua). Usarla pura no desinfecta mejor y sí daña más superficies y tejidos.', productos: ['Lejía', 'Agua para diluir'] },
        { n: 3, title: 'Aplicar con guantes', text: 'Protege siempre las manos — la lejía irrita la piel con el contacto directo y prolongado.', productos: ['Guantes de protección'] },
        { n: 4, title: 'Dejar actuar y aclarar', text: 'Deja actuar unos minutos sobre la superficie y aclara con agua limpia después — no la dejes secar sola sobre superficies que vayan a tener contacto con alimentos o piel.', productos: ['Paño o bayeta'] },
      ],
      professionalTips: [
        'La lejía y el amoníaco (presente en muchos limpiacristales y algunos limpiadores) reaccionan generando un gas tóxico al mezclarse — nunca combines productos de limpieza distintos sin comprobar antes que son compatibles.',
      ],
      commonMistakes: [
        'Mezclar lejía con amoníaco o con otros productos de limpieza.',
        'Usar lejía pura sin diluir.',
        'No ventilar la zona mientras se usa.',
        'Usarla sobre metales o tejidos de color, que puede decolorar o corroer.',
      ],
      recommendedProducts: [
        { nombre: 'Lejía Ace Regular',           categoria: 'Droguería', formato: '2 L', precio: '1,75 €' },
        { nombre: 'Lejía Dos Castillas Neutra',   categoria: 'Droguería', formato: '2 L', precio: '1,17 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Mayor densidad/rendimiento', nombre: 'Lejía Ace Protección Más Densa 2 L', precio: '1,97 €' },
        { etiqueta: 'Formato grande',               nombre: 'Lejía Dos Castillas 5 L', precio: '2,42 €' },
        { etiqueta: 'En pastillas (dosificación fácil)', nombre: 'Lejía en Pastillas HC-Chlor Tablet 1 kg', precio: '22,03 €' },
      ],
      relatedSolutions: ['limpiar-moho-pared-azulejo', 'desinfectar-casa'],
      seo: {
        title: 'Cómo usar la lejía de forma segura | Orencio Matas',
        description: 'Guía para diluir y usar la lejía correctamente en casa, desinfectando sin riesgos para la salud ni daños en las superficies.',
      },
    },

    'desinfectar-casa': {
      slug: 'desinfectar-casa',
      title: 'Cómo desinfectar superficies en casa',
      description: 'Desinfecta correctamente las superficies de más contacto en casa (cocina, baño, pomos, interruptores) con el producto adecuado para cada una.',
      category: 'limpieza', subcategory: 'Desinfección del hogar',
      problem: 'desinfectar_hogar',
      objective: 'limpiar',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: '20-30 min (rutina periódica)',
      result: 'Superficies de la casa desinfectadas, sin gérmenes ni malos olores',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Desinfección del hogar'],
      materials: [
        { fase: 'Limpieza previa', familiaSugerida: '—',              items: ['Retirar la suciedad visible antes de desinfectar'] },
        { fase: 'Desinfección',    familiaSugerida: 'Desinfectantes', items: ['Desinfectante multiusos'] },
        { fase: 'Textiles',        familiaSugerida: 'Desinfectantes', items: ['Desinfectante para hogar y textil'] },
      ],
      receta: [
        { fase: 'Limpiar',      emoji: '🧹' },
        { fase: 'Desinfectar',  emoji: '🧴' },
        { fase: 'Dejar actuar', emoji: '⏳' },
        { fase: 'Secar',        emoji: '🧻' },
      ],
      steps: [
        { n: 1, title: 'Limpiar la suciedad visible primero', text: 'Un desinfectante no actúa bien sobre suciedad, grasa o restos de comida — limpia primero con el producto habitual y desinfecta después, nunca a la vez.', productos: [] },
        { n: 2, title: 'Aplicar el desinfectante', text: 'Aplica el desinfectante multiusos en las zonas de más contacto: pomos, interruptores, encimeras, grifos e inodoro.', productos: ['Desinfectante multiusos'] },
        { n: 3, title: 'Respetar el tiempo de contacto', text: 'Un desinfectante necesita permanecer húmedo sobre la superficie un tiempo mínimo para actuar de verdad — pasar el paño y secar inmediatamente reduce mucho su eficacia.', productos: [] },
        { n: 4, title: 'Textiles y tapicerías', text: 'Para sofás, cortinas o textiles que no se pueden lavar a menudo, usa un desinfectante específico para hogar y textil, que no mancha ni deja olor fuerte.', productos: ['Desinfectante para hogar y textil'] },
      ],
      professionalTips: [
        'La eficacia real de un desinfectante depende del tiempo que permanece húmedo sobre la superficie, no solo de aplicarlo — comprobar el tiempo de contacto indicado en el envase marca la diferencia entre desinfectar de verdad o solo dar una pasada superficial.',
      ],
      commonMistakes: [
        'Desinfectar sobre suciedad visible sin limpiar antes.',
        'Secar la superficie inmediatamente después de aplicar, sin respetar el tiempo de contacto.',
        'Usar el mismo paño para desinfectar varias zonas sin aclararlo entre una y otra.',
        'No ventilar la estancia mientras se usa un desinfectante con olor fuerte.',
      ],
      recommendedProducts: [
        { nombre: 'Asevi Gerpostar Desinfectante Multiusos', categoria: 'Droguería', formato: '750 ml', precio: '1,83 €' },
        { nombre: 'Asevi Gerpostar Hogar y Textil Antialérgico', categoria: 'Droguería', formato: '400 ml', precio: '1,97 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Sin lejía',           nombre: 'Asevi Oxy Active Multiusos Sin Lejía', precio: '1,57 €' },
        { etiqueta: 'Uso profesional/grandes superficies', nombre: 'Asevi Gerpostar Desinfectante Multiusos 5 kg', precio: '11,30 €' },
      ],
      relatedSolutions: ['usar-lejia-segura'],
      seo: {
        title: 'Cómo desinfectar superficies en casa | Orencio Matas',
        description: 'Guía para desinfectar correctamente las zonas de más contacto en casa, con el producto adecuado y el tiempo de actuación necesario.',
      },
    },

    'elegir-pistola-pintar': {
      slug: 'elegir-pistola-pintar',
      title: 'Cómo elegir la pistola de pintar adecuada',
      description: 'Gravedad, airless o HVLP: cada tipo de pistola encaja mejor con un trabajo distinto — elige la adecuada según la superficie y el producto que vayas a aplicar.',
      category: 'pintura', subcategory: 'Herramientas de pintor',
      problem: 'elegir_pistola',
      objective: 'preparar',
      surface: 'otro',
      difficulty: 'Media',
      estimatedTime: '10 min de decisión',
      result: 'La pistola de pintar adecuada para tu trabajo, con mejor acabado y menos producto desperdiciado',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Herramientas de pintor'],
      materials: [
        { fase: 'Trabajos pequeños/detalle', familiaSugerida: 'Pistolas de gravedad', items: ['Pistola de gravedad'] },
        { fase: 'Grandes superficies',        familiaSugerida: 'Pistolas airless',     items: ['Pistola airless'] },
        { fase: 'Acabados finos/carrocería',   familiaSugerida: 'Pistolas HVLP',        items: ['Pistola HVLP'] },
      ],
      receta: [
        { fase: 'Identificar', emoji: '🔍' },
        { fase: 'Elegir tipo', emoji: '🔫' },
        { fase: 'Ajustar',     emoji: '⚙️' },
        { fase: 'Probar',      emoji: '🎨' },
      ],
      steps: [
        { n: 1, title: 'Identificar el trabajo', text: 'La pregunta clave no es "cuál es la mejor pistola", sino "cuál es la mejor para ESTE trabajo" — una fachada entera y una pieza de coche necesitan equipos completamente distintos.', productos: [] },
        { n: 2, title: 'Gravedad: precisión en trabajos pequeños', text: 'El depósito va encima del cuerpo de la pistola, lo que da mejor control y menos desperdicio de producto — ideal para piezas de coche, muebles o retoques de detalle.', productos: ['Pistola de gravedad'] },
        { n: 3, title: 'Airless: grandes superficies rápido', text: 'Bombea la pintura a alta presión sin necesidad de aire comprimido, cubriendo mucha superficie en poco tiempo — la opción lógica para fachadas, naves o pintar muchos metros cuadrados de pared.', productos: ['Pistola airless'] },
        { n: 4, title: 'HVLP: acabado fino con poco desperdicio', text: 'Pulveriza a baja presión, lo que reduce mucho la niebla de pintura en el aire (overspray) y da un acabado muy fino — habitual en repintado de automoción donde el acabado importa mucho.', productos: ['Pistola HVLP'] },
        { n: 5, title: 'Ajustar antes de empezar', text: 'Sea cual sea el tipo elegido, prueba siempre el patrón de pulverización sobre un cartón antes de aplicar sobre la pieza real, ajustando presión y caudal.', productos: [] },
      ],
      professionalTips: [
        'El error más habitual no es elegir mal el tipo de pistola, sino no ajustarla — una pistola gravedad o HVLP mal regulada da peor acabado que una airless bien ajustada, así que dedica siempre unos minutos a probar el patrón antes de pintar la pieza definitiva.',
      ],
      commonMistakes: [
        'Usar una pistola airless para un acabado de detalle fino (da un chorro demasiado grueso para eso).',
        'Usar una pistola de gravedad pequeña para cubrir una fachada entera (demasiado lento e ineficiente).',
        'No probar el patrón de pulverización antes de aplicar sobre la pieza real.',
        'No limpiar la pistola justo después de usarla, dejando que el producto se seque dentro.',
      ],
      recommendedProducts: [
        { nombre: 'Pistola Gravedad Werku 1.5HP-600 ml (maletín)', categoria: 'Talleres', precio: '120,70 €', fichaTecnica: 'https://www.werku.com/wp-content/uploads/2022/05/WK500470_Techical_File_ESP.pdf' },
        { nombre: 'Pistola Airless Werku 1/4"-250 bar',             categoria: 'Talleres', precio: '66,70 €', fichaTecnica: 'https://www.werku.com/wp-content/uploads/2022/05/WK500600_Technical_File_ESP.pdf' },
        { nombre: 'Pistola Pintar Werku HVLP-I 500 W',              categoria: 'Talleres', precio: '68,55 €', fichaTecnica: 'https://www.werku.com/Technical_File_ESP/WK401200_Technical_File_ESP.pdf' },
      ],
      alternativeProducts: [
        { etiqueta: 'Airless con aire asistido (mejor acabado)', nombre: 'Pistola Airless Aire Asistido Werku', precio: '117,52 €' },
        { etiqueta: 'Gravedad económica',                          nombre: 'Pistola Gravedad Werku 1.7HP-600 ml', precio: '71,09 €' },
        { etiqueta: 'Gotelé/textura',                                nombre: 'Pistola Gravedad Werku Gotelé 6 L', precio: '44,41 €' },
      ],
      relatedSolutions: ['pintar-plastico-coche', 'pintar-fachada-exterior'],
      seo: {
        title: 'Cómo elegir la pistola de pintar adecuada | Orencio Matas',
        description: 'Guía para elegir entre pistola de gravedad, airless o HVLP según el trabajo: superficie, tamaño y tipo de acabado.',
      },
    },

    'elegir-lijadora-superficie': {
      slug: 'elegir-lijadora-superficie',
      title: 'Cómo elegir la lijadora adecuada para preparar una superficie',
      description: 'Rotorbital, de disco o manual: elige la lijadora adecuada según el tamaño de la superficie y el acabado que necesitas antes de pintar.',
      category: 'pintura', subcategory: 'Herramientas de pintor',
      problem: 'elegir_lijadora',
      objective: 'preparar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '10 min de decisión',
      result: 'La lijadora adecuada para tu superficie, con menos esfuerzo y mejor resultado antes de pintar',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Herramientas de pintor'],
      materials: [
        { fase: 'Superficies grandes/planas', familiaSugerida: 'Lijadoras rotorbitales', items: ['Lijadora rotorbital'] },
        { fase: 'Desbaste y óxido',            familiaSugerida: 'Amoladoras',            items: ['Amoladora'] },
        { fase: 'Discos de lija',              familiaSugerida: 'Discos de lija',        items: ['Discos de lija de varios granos'] },
      ],
      receta: [
        { fase: 'Identificar', emoji: '🔍' },
        { fase: 'Elegir',      emoji: '🛠️' },
        { fase: 'Elegir grano',emoji: '📄' },
        { fase: 'Lijar',       emoji: '✋' },
      ],
      steps: [
        { n: 1, title: 'Identificar el tipo de trabajo', text: 'No es lo mismo preparar una pared grande antes de pintar que desbastar óxido de una pieza metálica pequeña — cada tarea pide una herramienta distinta.', productos: [] },
        { n: 2, title: 'Lijadora rotorbital para superficies grandes', text: 'Su movimiento circular y orbital a la vez da un acabado muy uniforme sin marcas de giro, ideal para preparar paredes, muebles o carrocería antes de pintar.', productos: ['Lijadora rotorbital'] },
        { n: 3, title: 'Amoladora para desbaste y óxido', text: 'Para quitar óxido, soldaduras o desbastar metal rápido, una amoladora con disco adecuado rinde mucho más que lijar a mano — aunque es más agresiva y requiere más cuidado.', productos: ['Amoladora'] },
        { n: 4, title: 'Elegir el grano correcto', text: 'Empieza siempre con un grano más grueso para desbastar y ve subiendo a uno más fino para el acabado — saltarse pasos intermedios deja marcas que luego se notan bajo la pintura.', productos: ['Discos de lija de varios granos'] },
      ],
      professionalTips: [
        'Una lijadora eléctrica no sustituye el criterio de elegir bien el grano — usar solo un grano muy grueso "porque es más rápido" es la causa más habitual de que luego haya que repasar toda la superficie a mano antes de pintar.',
      ],
      commonMistakes: [
        'Usar una amoladora en una superficie grande y plana (deja marcas irregulares, mejor una rotorbital).',
        'Usar una lijadora rotorbital para desbastar óxido grueso (es lenta para eso, mejor una amoladora).',
        'Saltarse los granos intermedios entre el desbaste y el acabado final.',
        'No limpiar el polvo de lijado antes de pintar.',
      ],
      recommendedProducts: [
        { nombre: 'Lijadora Circular Rotorbital Werku 150 mm', categoria: 'Talleres', precio: '64,74 €', fichaTecnica: 'https://www.werku.com/Technical_File_ESP/WK400750_Technical_File_ESP.pdf' },
        { nombre: 'Amoladora Werku 115-125 mm 900 W',           categoria: 'Talleres', precio: '46,88 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Inalámbrica (sin cable)', nombre: 'Amoladora Inalámbrica Werku 125 mm/20V', precio: '86,39 €' },
        { etiqueta: 'Rotorbital de grano fino/detalle', nombre: 'Lijadora Werku Rotorbital 5 mm/5 mm-12000', precio: '76,17 €' },
        { etiqueta: 'Discos de repuesto',        nombre: 'Disco Lija Circular Werku Grano 120, 225 mm (10 uds)', precio: '13,21 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal', 'corregir-marcas-lijado', 'elegir-pistola-pintar'],
      seo: {
        title: 'Cómo elegir la lijadora adecuada para preparar una superficie | Orencio Matas',
        description: 'Guía para elegir entre lijadora rotorbital y amoladora según el tamaño de la superficie y el trabajo a realizar.',
      },
    },

    'proteger-estructura-metalica-corrosion': {
      slug: 'proteger-estructura-metalica-corrosion',
      title: 'Cómo proteger una estructura metálica frente a la corrosión',
      description: 'Elige el sistema anticorrosivo adecuado (imprimación + acabado) según el ambiente al que está expuesta tu estructura de acero, siguiendo el mismo criterio que la norma UNE-EN ISO 12944.',
      category: 'metal', subcategory: 'Protección anticorrosiva profesional',
      problem: 'proteger_estructura_metalica',
      objective: 'proteger',
      surface: 'metal',
      difficulty: 'Media',
      estimatedTime: 'Según tamaño — normalmente 1-2 días con secados incluidos',
      result: 'Estructura de acero protegida con un sistema anticorrosivo adecuado a su ambiente de exposición, con la durabilidad esperada',
      breadcrumb: ['Centro de Soluciones', 'Metal', 'Protección anticorrosiva profesional'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza / Desengrasantes', items: ['Desengrasante', 'Chorreado abrasivo o lijado (según el caso)'] },
        { fase: 'Imprimación', familiaSugerida: 'Imprimaciones anticorrosivas', items: ['Imprimación anticorrosiva (alquídica o epoxi, según el ambiente)'] },
        { fase: 'Acabado',      familiaSugerida: 'Esmaltes',                  items: ['Esmalte de acabado (alquídico o poliuretano, según exigencia)'] },
      ],
      receta: [
        { fase: 'Valorar ambiente', emoji: '🌍' },
        { fase: 'Preparar',         emoji: '🧽' },
        { fase: 'Imprimar',         emoji: '🎨' },
        { fase: 'Acabar',           emoji: '✨' },
      ],
      steps: [
        { n: 1, title: 'Valorar el ambiente de corrosión', text: 'No es lo mismo una estructura en interior con calefacción (ambiente C1, muy baja corrosión) que una zona costera con salinidad alta o una planta química (C5, muy alta) — el ambiente determina qué sistema necesitas de verdad, no solo el material.', productos: [] },
        { n: 2, title: 'Preparar la superficie', text: 'La preparación es la base de cualquier sistema anticorrosivo — sin ella, ni la mejor pintura del mundo protege bien. Elimina óxido, grasa y suciedad; en acero nuevo sin pintar, lo ideal es chorreado abrasivo, en superficies ya pintadas con lijado a fondo es suficiente en muchos casos.', productos: ['Desengrasante', 'Chorreado abrasivo o lijado (según el caso)'] },
        { n: 3, title: 'Aplicar la imprimación anticorrosiva', text: 'Elige entre imprimación alquídica (ambientes de corrosión baja-media, más económica) o epoxi (ambientes de corrosión alta-muy alta, mayor protección y adherencia) según el ambiente valorado en el paso 1.', productos: ['Imprimación anticorrosiva (alquídica o epoxi, según el ambiente)'] },
        { n: 4, title: 'Aplicar el esmalte de acabado', text: 'El acabado aporta el color final y una segunda barrera de protección — en ambientes más exigentes, un esmalte de poliuretano da mejor retención de brillo y color con el tiempo que uno alquídico convencional.', productos: ['Esmalte de acabado (alquídico o poliuretano, según exigencia)'] },
      ],
      professionalTips: [
        'La durabilidad de un sistema anticorrosivo no es un periodo de garantía, sino una estimación técnica — en la práctica, conviene inspeccionar la estructura al menos una vez al año y no esperar a que el óxido sea visible para actuar, sobre todo en ambientes de corrosión alta o muy alta.',
      ],
      commonMistakes: [
        'Elegir el sistema por precio en vez de por el ambiente real de corrosión al que está expuesta la estructura.',
        'Saltarse o hacer una preparación de superficie insuficiente, la causa más habitual de fallo prematuro.',
        'Aplicar el esmalte de acabado antes de que la imprimación haya secado el tiempo indicado.',
        'No revisar la estructura periódicamente, esperando a que el óxido ya sea visible para actuar.',
      ],
      recommendedProducts: [
        { nombre: 'Imprimación Sintética Secado Rápido SX-100', categoria: 'Talleres', formato: '15 L', precio: '88,75 €', fichaTecnica: 'http://ficheros.industriastitan.es/titan/FICHAS%20TECNICAS/X10_0000_SX100_IMPRIMACION_SINTETICA_SECADO_RAPIDO_ES.pdf?v=2023-06-27-165500' },
        { nombre: 'Imprimación Epoxi Anticorrosiva SXB-200',      categoria: 'Talleres', formato: '750 ml', precio: '14,40 €', fichaTecnica: 'http://ficheros.industriastitan.es/titan/FICHAS%20TECNICAS/X20_0000_SXB200_IMPRIMACION_EPOXI_ANTICORROSIVA_ES.pdf?v=2023-06-27-165500' },
        { nombre: 'Titantech Esmalte Sintético Brillo EX-330',    categoria: 'Talleres', formato: '4 L', precio: '45,82 €', fichaTecnica: 'http://ficheros.industriastitan.es/titan/FICHAS%20TECNICAS/X33_0000_EX330_ESMALTE_SINTETICO_BRILLANTE_ES.pdf?v=2023-06-27-165500' },
      ],
      alternativeProducts: [
        { etiqueta: 'Ambiente de corrosión alta',     nombre: 'Titantech SXB-210 Imprimación Epoxi AE HB SB 15 L', precio: '307,34 €' },
        { etiqueta: 'Acabado de altas prestaciones',   nombre: 'TITANTECH EX-390 ESM.FORJA DTM 4 L.BASE INCOL.', precio: '53,43 €' },
        { etiqueta: 'Imprimación anticorrosiva fosfatante', nombre: 'Imprimación Fosfatante SX-140 Anticorrosiva 20 L', precio: '206,26 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal', 'proteger-estructura-acero-fuego'],
      seo: {
        title: 'Cómo proteger una estructura metálica frente a la corrosión | Orencio Matas',
        description: 'Guía para elegir el sistema anticorrosivo adecuado (imprimación + acabado) según el ambiente de exposición de tu estructura de acero.',
      },
    },

    'proteger-estructura-acero-fuego': {
      slug: 'proteger-estructura-acero-fuego',
      title: 'Cómo proteger una estructura de acero contra el fuego',
      description: 'Aplica un sistema de pintura intumescente sobre una estructura de acero para darle resistencia al fuego, protegiéndola frente al colapso en caso de incendio.',
      category: 'metal', subcategory: 'Protección contra el fuego',
      problem: 'proteger_fuego_estructura',
      objective: 'proteger',
      surface: 'metal',
      difficulty: 'Difícil',
      estimatedTime: 'Varios días (aplicación + curado de 24h a 7 días según capa)',
      result: 'Estructura de acero con resistencia al fuego certificada, protegida frente al colapso por temperatura',
      breadcrumb: ['Centro de Soluciones', 'Metal', 'Protección contra el fuego'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Imprimaciones anticorrosivas', items: ['Imprimación anticorrosiva compatible'] },
        { fase: 'Intumescente', familiaSugerida: 'Pinturas intumescentes',      items: ['Pintura intumescente al agua'] },
        { fase: 'Acabado',      familiaSugerida: 'Esmaltes',                    items: ['Esmalte de acabado compatible (si hay exposición exterior o alta humedad)'] },
      ],
      receta: [
        { fase: 'Imprimar',    emoji: '🎨' },
        { fase: 'Medir',       emoji: '📏' },
        { fase: 'Intumescente',emoji: '🔥' },
        { fase: 'Acabar',      emoji: '✅' },
      ],
      steps: [
        { n: 1, title: 'Aplicar la imprimación anticorrosiva', text: 'Antes de la pintura intumescente, la estructura debe llevar una imprimación anticorrosiva compatible — el espesor de esta capa debe medirse y registrarse, porque afecta al cálculo del espesor real de intumescente aplicado.', productos: ['Imprimación anticorrosiva compatible'] },
        { n: 2, title: 'Determinar el espesor necesario', text: 'El espesor de intumescente necesario depende de la resistencia al fuego exigida (R30, R60, R90...), el perfil del acero y su masividad (factor de forma) — cuanto mayor la masividad, más espesor hace falta para la misma protección.', productos: [] },
        { n: 3, title: 'Aplicar la pintura intumescente', text: 'Aplica la pintura intumescente al agua en el espesor calculado, respetando las condiciones ambientales (temperatura entre 10-35°C, humedad por debajo del 80%) — de lo contrario pueden formarse ampollas o defectos en la película.', productos: ['Pintura intumescente al agua'] },
        { n: 4, title: 'Aplicar acabado si hace falta', text: 'En interiores secos no siempre hace falta acabado adicional; en exteriores semi-expuestos o de alta humedad, protege la intumescente con un esmalte de acabado compatible.', productos: ['Esmalte de acabado compatible (si hay exposición exterior o alta humedad)'] },
      ],
      professionalTips: [
        'Antes de aplicar el esmalte de acabado, hay que confirmar el espesor real de intumescente aplicado midiendo la película ya totalmente seca (24-48 horas) — no basta con haber aplicado la cantidad prevista, hay que verificar que se ha quedado en el espesor final correcto.',
      ],
      commonMistakes: [
        'No medir y registrar el espesor de la imprimación antes de aplicar la intumescente.',
        'Aplicar la pintura intumescente en condiciones de humedad o temperatura fuera de rango.',
        'No tener en cuenta la masividad real del perfil al calcular el espesor necesario.',
        'Aplicar un espesor de esmalte de acabado excesivo, que puede afectar a la expansión de la intumescente en caso de incendio.',
      ],
      recommendedProducts: [
        { nombre: 'Pintura Intumescente Agua A-80 IX-080',   categoria: 'Talleres', formato: '25 kg', precio: '384,72 €', fichaTecnica: 'http://ficheros.industriastitan.es/titan/FICHAS%20TECNICAS/X08_0000_IX080_PINTURA_INTUMESCENTE_A80_ES.pdf?v=2023-06-27-165500' },
        { nombre: 'Titantech Imprimación Sintética SX-100',   categoria: 'Talleres', formato: '15 L', precio: '88,75 €', fichaTecnica: 'http://ficheros.industriastitan.es/titan/FICHAS%20TECNICAS/X10_0000_SX100_IMPRIMACION_SINTETICA_SECADO_RAPIDO_ES.pdf?v=2023-06-27-165500' },
      ],
      alternativeProducts: [
        { etiqueta: 'Mayor resistencia al fuego (R120-R180)', nombre: 'Titantech IX-085 Intumescente A85 25 kg', precio: '392,16 €' },
        { etiqueta: 'Acabado poliuretano de altas prestaciones', nombre: 'Titantech EXB-560 Esmalte Poliuretano Brillante 4 L', precio: '100,91 €' },
      ],
      relatedSolutions: ['proteger-estructura-metalica-corrosion'],
      seo: {
        title: 'Cómo proteger una estructura de acero contra el fuego | Orencio Matas',
        description: 'Guía para aplicar un sistema de pintura intumescente sobre una estructura de acero, dándole resistencia al fuego.',
      },
    },

    'lacado-profesional-muebles': {
      slug: 'lacado-profesional-muebles',
      title: 'Cómo lacar muebles a nivel profesional con pistola',
      description: 'Aplica un sistema profesional de fondo y laca de poliuretano sobre mueble o madera, pensado para taller y aplicación con pistola.',
      category: 'madera', subcategory: 'Lacado profesional',
      problem: 'lacar_mueble_profesional',
      objective: 'preparar',
      surface: 'madera',
      difficulty: 'Media',
      estimatedTime: '1-2 días (fondo + lijado + laca + secado)',
      result: 'Mueble o superficie de madera con un acabado lacado uniforme y profesional',
      breadcrumb: ['Centro de Soluciones', 'Madera y restauración', 'Lacado profesional'],
      materials: [
        { fase: 'Sellado',   familiaSugerida: 'Fondos de poliuretano', items: ['Fondo poliuretano'] },
        { fase: 'Lijado',    familiaSugerida: 'Lijas',                 items: ['Lija fina'] },
        { fase: 'Acabado',   familiaSugerida: 'Lacas de poliuretano',  items: ['Laca de poliuretano (mate, satinada o incolora)'] },
      ],
      receta: [
        { fase: 'Fondo',   emoji: '🎨' },
        { fase: 'Lijar',   emoji: '📄' },
        { fase: 'Lacar',   emoji: '✨' },
        { fase: 'Curar',   emoji: '⏳' },
      ],
      steps: [
        { n: 1, title: 'Aplicar el fondo de poliuretano', text: 'El fondo sella la madera y rellena el poro, dando una buena cobertura de cantos y aristas — se aplica siempre antes de la laca, nunca la laca directamente sobre madera sin fondo.', productos: ['Fondo poliuretano'] },
        { n: 2, title: 'Lijar el fondo', text: 'Una vez seco el fondo (suele ser de secado muy rápido), lija suavemente para dejar la superficie totalmente lisa antes de aplicar la laca.', productos: ['Lija fina'] },
        { n: 3, title: 'Aplicar la laca de poliuretano', text: 'Aplica la laca con pistola en manos finas — el sistema de dos componentes necesita respetar la proporción de mezcla exacta (normalmente 2:1) y su pot life (tiempo útil de la mezcla ya activada).', productos: ['Laca de poliuretano (mate, satinada o incolora)'] },
        { n: 4, title: 'Dejar curar antes de manipular', text: 'Respeta el tiempo de secado antes de manipular la pieza y el de repintado si hace falta una segunda mano — manipular antes de tiempo deja marcas que ya no se corrigen sin repetir el proceso.', productos: [] },
      ],
      professionalTips: [
        'La proporción de mezcla en los sistemas de dos componentes (fondo y laca) es crítica — no ajustarla bien no solo afecta al acabado estético, también a la dureza y resistencia final del lacado.',
      ],
      commonMistakes: [
        'Aplicar la laca directamente sobre madera sin fondo previo.',
        'No lijar el fondo antes de aplicar la laca.',
        'No respetar la proporción de mezcla exacta en los sistemas de dos componentes.',
        'Manipular la pieza antes de que la laca haya curado del todo.',
      ],
      recommendedProducts: [
        { nombre: 'Titantech MXB-970 Fondo Poliuretano',       categoria: 'Talleres', formato: '750 ml', precio: '12,52 €', fichaTecnica: 'http://ficheros.industriastitan.es/titan/FICHAS%20TECNICAS/X97_0000_MXB970_LACA_POLIURETANO_BLANCA_MATE_ES.pdf?v=2023-06-27-165500' },
        { nombre: 'Titantech MXB-960 Laca Poliuretano Satinada', categoria: 'Talleres', formato: '6 L', precio: '72,36 €', fichaTecnica: 'http://ficheros.industriastitan.es/titan/FICHAS%20TECNICAS/X96_0000_MXB960_LACA_POLIURETANO_BLANCA_SATINADA_ES.pdf?v=2023-06-27-165500' },
      ],
      alternativeProducts: [
        { etiqueta: 'Acabado incoloro', nombre: 'Laca Poliuretano Incolora MXB-950' },
        { etiqueta: 'Para parqué/suelos de madera', nombre: 'Barniz Parquet al Agua MX-910' },
      ],
      relatedSolutions: ['restaurar-mueble-madera', 'elegir-pistola-pintar'],
      seo: {
        title: 'Cómo lacar muebles a nivel profesional con pistola | Orencio Matas',
        description: 'Guía para aplicar un sistema profesional de fondo y laca de poliuretano sobre mueble o madera, con pistola.',
      },
    },

    'hidrofugar-fachada-piedra-ladrillo': {
      slug: 'hidrofugar-fachada-piedra-ladrillo',
      title: 'Cómo hidrofugar una fachada de piedra o ladrillo visto',
      description: 'Aplica un hidrofugante invisible sobre piedra, ladrillo visto o mortero para evitar que absorban agua de lluvia, sin alterar su aspecto ni impedir que transpiren.',
      category: 'pintura', subcategory: 'Fachadas',
      problem: 'fachada_piedra_absorbe_agua',
      objective: 'proteger',
      surface: 'pared',
      difficulty: 'Fácil',
      estimatedTime: '1 día de aplicación (repintar, si procede, a partir de 7 días)',
      result: 'Fachada de piedra, ladrillo o mortero protegida frente a la lluvia, sin película visible ni pérdida de transpirabilidad',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Fachadas'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza exterior', items: ['Limpieza a presión eliminando polvo y suciedad'] },
        { fase: 'Protección',  familiaSugerida: 'Hidrofugantes',      items: ['Hidrofugante invisible al agua'] },
      ],
      receta: [
        { fase: 'Limpiar',    emoji: '🧴' },
        { fase: 'Aplicar',    emoji: '💧' },
        { fase: 'Saturar',    emoji: '🔁' },
        { fase: 'Esperar',    emoji: '⏳' },
      ],
      steps: [
        { n: 1, title: 'Limpiar la fachada', text: 'Elimina polvo, suciedad y restos sueltos de la superficie de piedra, ladrillo visto o mortero. El hidrofugante penetra por los poros del material, así que cualquier suciedad superficial reduce su eficacia.', productos: ['Limpieza a presión eliminando polvo y suciedad'] },
        { n: 2, title: 'Aplicar a saturación', text: 'Aplica el hidrofugante a brocha, rodillo o pulverizador sin diluir, trabajando de abajo hacia arriba para evitar que chorree sobre zonas ya tratadas. El producto no forma película ni altera el aspecto natural del soporte.', productos: ['Hidrofugante invisible al agua'] },
        { n: 3, title: 'Dar una segunda mano si el soporte es muy absorbente', text: 'En piedra o ladrillo muy poroso, una segunda mano aplicada "húmedo sobre húmedo" mejora la penetración y la protección final.', productos: [] },
        { n: 4, title: 'Respetar el tiempo de espera antes de pintar', text: 'Si además quieres pintar sobre la fachada, espera al menos 7 días desde la aplicación del hidrofugante antes de aplicar cualquier pintura, y haz siempre una prueba previa en una zona poco visible.', productos: [] },
      ],
      professionalTips: [
        'El hidrofugante no sustituye a una reparación de grietas o fisuras — si la fachada tiene fisuras, trátalas antes con un revestimiento antifisuras, porque el agua seguiría entrando por ahí aunque el resto de la superficie esté bien protegida.',
      ],
      commonMistakes: [
        'Aplicarlo sobre suciedad o musgo sin limpiar antes.',
        'Diluir el producto pensando que rinde igual: el hidrofugante se aplica puro.',
        'Pintar encima antes de que hayan pasado los días de espera indicados.',
        'Usarlo esperando que además selle grietas: solo protege frente a la absorción de agua, no repara fisuras.',
      ],
      recommendedProducts: [
        { nombre: 'HIDROFUGANTE INVISIBLE AGUA S-40 4 L.INCOLORO', categoria: 'Pinturas', formato: '4 L', precio: '42,54 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Fachadas grandes', nombre: 'HIDROFUGANTE INVISIBLE AGUA S-40 15 L.INCOLORO', precio: '110,12 €' },
        { etiqueta: 'Si además hay que fijar el soporte antes', nombre: 'IMPRIMACION FIJADOR SILOXANO S-30 4 L.INCOL.', precio: '28,85 €' },
      ],
      relatedSolutions: ['tratar-fachada-humedad-capilaridad', 'reparar-fisuras-fachada-hormigon', 'proteger-fachada-mortero-monocapa', 'pintar-fachada-exterior'],
      seo: {
        title: 'Cómo hidrofugar una fachada de piedra o ladrillo | Orencio Matas',
        description: 'Guía para aplicar un hidrofugante invisible sobre piedra, ladrillo visto o mortero, protegiendo la fachada de la lluvia sin alterar su aspecto.',
      },
    },

    'reparar-fisuras-fachada-hormigon': {
      slug: 'reparar-fisuras-fachada-hormigon',
      title: 'Cómo reparar y sellar fisuras en una fachada de hormigón o mortero',
      description: 'Sella fisuras y grietas de hasta 2 mm en fachadas de hormigón, mortero monocapa o revoco tradicional con un revestimiento elástico antifisuras, evitando que vuelvan a abrirse ni entre agua por ellas.',
      category: 'pintura', subcategory: 'Fachadas',
      problem: 'grietas_fachada',
      objective: 'reparar',
      surface: 'pared',
      difficulty: 'Media',
      estimatedTime: '1-2 días (imprimación + 2 manos de acabado con secado entre capas)',
      result: 'Fachada con las fisuras selladas mediante un revestimiento elástico que acompaña el movimiento del muro sin volver a agrietarse',
      colorChart: { label: 'Carta de colores Titanpro para fachadas (TF2)', url: 'https://www.titanpro.es/es/colores', logo: '../assets/proveedores/LOGO-TITANPRO.png' },
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Fachadas'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza exterior',   items: ['Limpieza de la fachada eliminando polvo y suciedad'] },
        { fase: 'Imprimación', familiaSugerida: 'Imprimaciones fachada', items: ['Imprimación fijadora super-penetrante'] },
        { fase: 'Acabado',     familiaSugerida: 'Revestimientos fachada', items: ['Revestimiento elástico antifisuras'] },
      ],
      receta: [
        { fase: 'Limpiar',  emoji: '🧴' },
        { fase: 'Imprimar', emoji: '🔧' },
        { fase: 'Sellar',   emoji: '🩹' },
        { fase: 'Acabar',   emoji: '🏠' },
      ],
      steps: [
        { n: 1, title: 'Limpiar la superficie', text: 'Elimina polvo, suciedad y restos de pintura suelta o mal adherida de la zona fisurada y de su entorno.', productos: ['Limpieza de la fachada eliminando polvo y suciedad'] },
        { n: 2, title: 'Aplicar la imprimación fijadora', text: 'Aplica una imprimación super-penetrante para sellar el soporte poroso y mejorar la adherencia del revestimiento — es especialmente importante en morteros pulverulentos o poco cohesionados.', productos: ['Imprimación fijadora super-penetrante'] },
        { n: 3, title: 'Aplicar el revestimiento antifisuras', text: 'Aplica el revestimiento elástico antifisuras en dos manos, dejando secar entre ellas. Este producto acompaña el movimiento de fisuras de hasta 2 mm sin perder su capacidad de sellado, algo que una pintura convencional no puede hacer.', productos: ['Revestimiento elástico antifisuras'] },
        { n: 4, title: 'Revisar puntos críticos', text: 'Presta atención extra a encuentros entre materiales distintos (por ejemplo, mortero con hormigón), ya que suelen ser las zonas donde antes reaparecen las fisuras si no quedan bien cubiertas.', productos: [] },
      ],
      professionalTips: [
        'Una fisura no tratada seguirá siendo un punto de entrada de agua aunque el resto de la fachada quede perfecta — no merece la pena pintar por encima sin haberla sellado antes con un producto realmente elástico.',
        'El R-50 se puede teñir sin problema con el sistema Titancolor (usando la versión de base neutra) para que combine con el color real de la fachada — no hace falta conformarse con blanco.',
      ],
      commonMistakes: [
        'Tapar una fisura con una pintura normal, sin capacidad de elongación, que se vuelve a abrir con el primer movimiento del muro.',
        'Saltarse la imprimación fijadora en soportes muy porosos o pulverulentos.',
        'Aplicar una sola mano de revestimiento antifisuras en vez de las dos recomendadas.',
        'No revisar los encuentros entre materiales de distinta naturaleza, donde suelen reaparecer las fisuras.',
      ],
      recommendedProducts: [
        { nombre: 'IMPRIMACION FIJ.SUPER PENETRANTE S-20 4 L.INCOL.', categoria: 'Pinturas', formato: '4 L', precio: '30,77 €' },
        { nombre: 'REVEST.ANTIFISURAS ELASTICO R-50 15 L.BLANCO MATE', categoria: 'Pinturas', formato: '15 L', precio: '96,85 €', fichaTecnica: 'https://msp.images.akzonobel.com/prd/dh/eesbdm/documents/ee/02/0a/94/tp_r50_revestimiento_elastico_antifisuras_mate_00_00_00_ftecnicaes.pdf' },
      ],
      alternativeProducts: [
        { etiqueta: 'Para teñir con Titancolor', nombre: 'REVEST.ANTIFISURAS ELASTICO R-50 15 L.BASE NEUTRA', precio: '74,49 €', fichaTecnica: 'https://msp.images.akzonobel.com/prd/dh/eesbdm/documents/ee/02/0a/94/tp_r50_revestimiento_elastico_antifisuras_mate_00_00_00_ftecnicaes.pdf' },
        { etiqueta: 'Imprimación en formato grande', nombre: 'IMPRIMACION FIJ.SUPER PENETRANTE S-20 10 L.', precio: '69,89 €' },
      ],
      relatedSolutions: ['hidrofugar-fachada-piedra-ladrillo', 'tratar-fachada-humedad-capilaridad', 'pintar-fachada-exterior', 'proteger-fachada-mortero-monocapa'],
      seo: {
        title: 'Cómo reparar y sellar fisuras en una fachada de hormigón | Orencio Matas',
        description: 'Guía para sellar fisuras de hasta 2 mm en fachadas de hormigón o mortero con un revestimiento elástico antifisuras.',
      },
    },

    'proteger-fachada-mortero-monocapa': {
      slug: 'proteger-fachada-mortero-monocapa',
      title: 'Cómo proteger un mortero monocapa con efecto hidrofugante',
      description: 'Protege un mortero monocapa (o cualquier fachada ya terminada) con un revestimiento acrílico siliconado con efecto hidrofugante, repeliendo el agua de lluvia y reforzando el acabado sin necesidad de teñir el producto.',
      category: 'pintura', subcategory: 'Fachadas',
      problem: 'proteger_fachada_monocapa',
      objective: 'proteger',
      surface: 'pared',
      difficulty: 'Media',
      estimatedTime: '1-2 días (imprimación si hace falta + 2 manos de acabado con secado entre capas)',
      result: 'Mortero monocapa o fachada protegidos con un revestimiento hidrofugante que repele la lluvia y refuerza la durabilidad del acabado',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Fachadas'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza exterior',     items: ['Limpieza de la fachada eliminando polvo y suciedad'] },
        { fase: 'Imprimación', familiaSugerida: 'Imprimaciones fachada', items: ['Imprimación fijadora (solo si el mortero es muy poroso o pulverulento)'] },
        { fase: 'Acabado',     familiaSugerida: 'Revestimientos fachada', items: ['Revestimiento acrílico siliconado hidrofugante'] },
      ],
      receta: [
        { fase: 'Limpiar',    emoji: '🧴' },
        { fase: 'Imprimar',   emoji: '🔧' },
        { fase: 'Proteger',   emoji: '💧' },
        { fase: 'Acabar',     emoji: '🏠' },
      ],
      steps: [
        { n: 1, title: 'Limpiar la superficie', text: 'Elimina polvo, suciedad y restos de pintura suelta o mal adherida del mortero monocapa o de la fachada ya pintada.', productos: ['Limpieza de la fachada eliminando polvo y suciedad'] },
        { n: 2, title: 'Imprimar si el soporte es muy poroso', text: 'En un mortero monocapa nuevo, muy poroso o pulverulento, una imprimación fijadora mejora la adherencia y el rendimiento del revestimiento — en un mortero ya consolidado o una fachada ya pintada no suele ser necesaria.', productos: ['Imprimación fijadora (solo si el mortero es muy poroso o pulverulento)'] },
        { n: 3, title: 'Aplicar el revestimiento acrílico siliconado', text: 'Aplica el revestimiento en dos manos, dejando secar entre ellas. El componente siliconado le da un efecto hidrofugante real: el agua de lluvia resbala en vez de penetrar, sin perder la transpirabilidad del muro.', productos: ['Revestimiento acrílico siliconado hidrofugante'] },
        { n: 4, title: 'Revisar juntas y remates', text: 'Presta atención extra a juntas de dilatación, vierteaguas y remates — son los puntos por donde con más frecuencia se filtra agua aunque el resto de la superficie quede bien protegida.', productos: [] },
      ],
      professionalTips: [
        'Este revestimiento NO se puede teñir a medida (a diferencia del R-50 antifisuras, que sí admite teñido con Titancolor) — viene en su gama de colores de fábrica, así que conviene elegir el tono antes de comprar la cantidad necesaria.',
        'Si la fachada tiene fisuras además de necesitar protección hidrofugante, trata primero las fisuras con un revestimiento elástico antifisuras — este producto protege frente al agua, pero no está pensado para absorber el movimiento de una grieta.',
      ],
      commonMistakes: [
        'Aplicarlo sobre suciedad o pintura suelta sin limpiar antes.',
        'Esperar poder teñirlo como el revestimiento antifisuras — este viene en colores de fábrica, no se tiñe a medida.',
        'No revisar juntas de dilatación y remates, los puntos donde más falla la protección con el tiempo.',
        'Usarlo pensando que también repara fisuras — para eso hace falta un revestimiento elástico antifisuras, no este.',
      ],
      recommendedProducts: [
        { nombre: 'REVEST.ACRILICO SILICONADO R-20 15 L.BLANCO', categoria: 'Pinturas', formato: '15 L', precio: '89,90 €', fichaTecnica: 'https://msp.images.akzonobel.com/prd/dh/eesbdm/documents/22/95/62/89/tp_r20_revestimiento_acrilico_siliconado_mate_00_00_00_ftecnicaes.pdf' },
      ],
      alternativeProducts: [
        { etiqueta: 'Formato pequeño/retoque', nombre: 'REVEST.ACRILICO SILICONADO R-20 4 L.BLANCO', precio: '28,45 €', fichaTecnica: 'https://msp.images.akzonobel.com/prd/dh/eesbdm/documents/22/95/62/89/tp_r20_revestimiento_acrilico_siliconado_mate_00_00_00_ftecnicaes.pdf' },
        { etiqueta: 'Si el mortero es muy poroso', nombre: 'IMPRIMACION FIJ.SUPER PENETRANTE S-20 4 L.INCOL.', precio: '30,77 €' },
      ],
      relatedSolutions: ['reparar-fisuras-fachada-hormigon', 'hidrofugar-fachada-piedra-ladrillo', 'pintar-fachada-exterior'],
      seo: {
        title: 'Cómo proteger un mortero monocapa con efecto hidrofugante | Orencio Matas',
        description: 'Guía para proteger un mortero monocapa o una fachada con un revestimiento acrílico siliconado hidrofugante, sin necesidad de teñirlo.',
      },
    },

    'tratar-fachada-humedad-capilaridad': {
      slug: 'tratar-fachada-humedad-capilaridad',
      title: 'Cómo tratar una fachada con humedad por capilaridad o salitre',
      description: 'Protege una fachada afectada por manchas blancas de salitre o humedad por capilaridad con un sistema transpirable al siloxano, que deja evacuar la humedad interior a la vez que repele el agua de lluvia.',
      category: 'pintura', subcategory: 'Fachadas',
      problem: 'salitre_fachada',
      objective: 'proteger',
      surface: 'pared',
      difficulty: 'Media',
      estimatedTime: '1-2 días (imprimación + acabado, con secado entre capas)',
      result: 'Fachada protegida con un sistema al siloxano que repele la lluvia sin bloquear la evacuación de humedad interior, evitando que reaparezcan las manchas de salitre',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Fachadas'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza exterior',     items: ['Limpieza y cepillado de cristales de sal y suciedad'] },
        { fase: 'Imprimación', familiaSugerida: 'Imprimaciones fachada', items: ['Imprimación fijadora al siloxano'] },
        { fase: 'Acabado',     familiaSugerida: 'Revestimientos fachada', items: ['Revestimiento transpirable de siloxano'] },
      ],
      receta: [
        { fase: 'Limpiar',   emoji: '🧴' },
        { fase: 'Cepillar',  emoji: '🧹' },
        { fase: 'Imprimar',  emoji: '🔧' },
        { fase: 'Proteger',  emoji: '🛡️' },
      ],
      steps: [
        { n: 1, title: 'Cepillar los cristales de sal', text: 'Elimina con cepillado en seco los cristales de sal (eflorescencias) visibles en la superficie. El efecto puede reaparecer tras la limpieza si la humedad de origen sigue activa, así que no te preocupes si vuelven a aparecer antes de tratar la fachada.', productos: ['Limpieza y cepillado de cristales de sal y suciedad'] },
        { n: 2, title: 'Aplicar la imprimación al siloxano', text: 'Aplica la imprimación fijadora al siloxano, pensada específicamente para preceder a un acabado transpirable de siloxano y mejorar su adherencia y penetración.', productos: ['Imprimación fijadora al siloxano'] },
        { n: 3, title: 'Aplicar el revestimiento transpirable', text: 'Aplica el revestimiento de siloxano en las manos indicadas. Este sistema deja "respirar" al muro, facilitando la evacuación del vapor de agua desde el interior, a la vez que repele el agua de lluvia desde el exterior — la combinación clave para frenar la humedad por capilaridad sin generar embolsamientos.', productos: ['Revestimiento transpirable de siloxano'] },
        { n: 4, title: 'Vigilar el origen de la humedad', text: 'Si la humedad viene del terreno por capilaridad ascendente, este sistema protege el acabado, pero no sustituye a una solución estructural (por ejemplo, una barrera química) si el problema es severo o reaparece con fuerza.', productos: [] },
      ],
      professionalTips: [
        'Un sistema al siloxano es la elección más adecuada precisamente cuando el problema es de humedad interior que necesita salir (capilaridad, salitre) — un revestimiento poco transpirable en este caso puede provocar embolsamientos y desprendimientos en vez de solucionar el problema.',
      ],
      commonMistakes: [
        'Usar un revestimiento poco transpirable sobre una fachada con humedad por capilaridad, provocando embolsamientos.',
        'No cepillar los cristales de sal antes de aplicar el sistema.',
        'Esperar que el tratamiento de fachada resuelva un problema de humedad ascendente del terreno sin abordar su origen.',
        'Saltarse la imprimación específica de siloxano, reduciendo la adherencia del acabado.',
      ],
      recommendedProducts: [
        { nombre: 'IMPRIMACION FIJADOR SILOXANO S-30 4 L.INCOL.', categoria: 'Pinturas', formato: '4 L', precio: '28,85 €' },
        { nombre: 'REVEST.TRANSP.SILOXANO R-60 15 L.BLANCO MATE', categoria: 'Pinturas', formato: '15 L', precio: '118,13 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Imprimación en formato grande', nombre: 'IMPRIMACION FIJADOR SILOXANO S-30 10 L.INCOLORO', precio: '65,51 €' },
        { etiqueta: 'Imprimación blanca', nombre: 'IMPRIMACION FIJADOR SILOXANO S-30 4 L.BLANCO', precio: '30,06 €' },
      ],
      relatedSolutions: ['hidrofugar-fachada-piedra-ladrillo', 'reparar-fisuras-fachada-hormigon', 'impermeabilizar-terraza-goteras'],
      seo: {
        title: 'Cómo tratar una fachada con humedad por capilaridad o salitre | Orencio Matas',
        description: 'Guía para proteger una fachada con salitre o humedad por capilaridad con un sistema transpirable al siloxano.',
      },
    },

    'pintar-reja-verja-hierro': {
      slug: 'pintar-reja-verja-hierro',
      title: 'Cómo pintar y proteger una verja, reja o barandilla de hierro',
      description: 'Aplica un sistema profesional de imprimación antioxidante multiadherente y esmalte de poliuretano sobre una verja, reja o barandilla de hierro, con un acabado duradero frente a la oxidación.',
      category: 'metal', subcategory: 'Pintura y protección de cerramientos metálicos',
      problem: 'pintar_verja_hierro',
      objective: 'pintar',
      surface: 'metal',
      difficulty: 'Media',
      estimatedTime: '1-2 días (imprimación + 2 manos de esmalte, con secado entre capas)',
      result: 'Verja, reja o barandilla protegida frente a la oxidación, con un acabado de poliuretano resistente a rayadas, impactos y manchas domésticas',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Metal', 'Pintura y protección de cerramientos metálicos'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza / Desengrasantes', items: ['Cepillado de óxido y desengrasado'] },
        { fase: 'Imprimación', familiaSugerida: 'Imprimaciones anticorrosivas', items: ['Imprimación antioxidante multiadherente'] },
        { fase: 'Acabado',     familiaSugerida: 'Esmaltes',                    items: ['Esmalte de poliuretano (brillante, satinado o mate)'] },
      ],
      receta: [
        { fase: 'Preparar', emoji: '🧽' },
        { fase: 'Imprimar', emoji: '🎨' },
        { fase: 'Pintar',   emoji: '🖌️' },
        { fase: 'Curar',    emoji: '✅' },
      ],
      steps: [
        { n: 1, title: 'Preparar la superficie', text: 'Elimina el óxido suelto con cepillo de púas metálicas o lijado, y desengrasa bien toda la pieza — la imprimación multiadherente necesita una superficie limpia para agarrar correctamente.', productos: ['Cepillado de óxido y desengrasado'] },
        { n: 2, title: 'Aplicar la imprimación antioxidante', text: 'Aplica dos capas de imprimación multiadherente sobre el hierro desnudo para una protección óptima frente a la oxidación. Esta imprimación está pensada para adherir bien tanto sobre metal como sobre otros soportes cercanos.', productos: ['Imprimación antioxidante multiadherente'] },
        { n: 3, title: 'Aplicar el esmalte de acabado', text: 'Aplica el esmalte de poliuretano en el acabado elegido (brillante, satinado o mate) hasta un espesor mínimo recomendado de 80 micras en 2 capas, respetando el tiempo de secado entre manos.', productos: ['Esmalte de poliuretano (brillante, satinado o mate)'] },
        { n: 4, title: 'Dejar curar antes de manipular', text: 'Evita apoyar objetos o manipular la pieza en las primeras horas tras la última mano — el esmalte necesita su tiempo de curado completo para alcanzar su máxima resistencia a rayadas e impactos.', productos: [] },
      ],
      professionalTips: [
        'En una verja o barandilla ya oxidada, no basta con pintar por encima del óxido suelto — repasa bien con cepillo de púas antes de imprimar, porque cualquier resto de óxido mal adherido hará que la pintura nueva se desprenda antes de tiempo.',
      ],
      commonMistakes: [
        'Pintar directamente sobre óxido suelto sin cepillar ni desengrasar antes.',
        'Aplicar una sola capa de imprimación en vez de las dos recomendadas sobre hierro desnudo.',
        'No respetar el espesor mínimo de esmalte en 2 capas, reduciendo la durabilidad del acabado.',
        'Manipular la pieza antes de que el esmalte haya curado del todo.',
      ],
      recommendedProducts: [
        { nombre: 'IMPRIMACION ANTIOX.S-70 MULTIADHERENTE 4 L.BLANCA', categoria: 'Pinturas', formato: '4 L', precio: '50,83 €' },
        { nombre: 'COLORLUX SATINADO C/POLIURET.4 L.NEGRO', categoria: 'Pinturas', formato: '4 L', precio: '48,34 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Acabado brillante', nombre: 'COLORLUX BRILLANTE C/POLIURET.4 L.NEGRO', precio: '48,34 €' },
        { etiqueta: 'Acabado mate', nombre: 'COLORLUX MATE C/POLIURETANO 4 L.NEGRO', precio: '48,34 €' },
        { etiqueta: 'Imprimación en gris', nombre: 'IMPRIMACION ANTIOX.S-70 MULTIADHERENTE 4 L.GRIS', precio: '50,83 €' },
        { etiqueta: 'Trabajos pequeños', nombre: 'IMPRIMACION ANTIOX.S-70 MULTIADHERENTE 750 GRIS', precio: '10,64 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal', 'proteger-estructura-metalica-corrosion', 'pintar-radiador-calefaccion'],
      seo: {
        title: 'Cómo pintar y proteger una verja o barandilla de hierro | Orencio Matas',
        description: 'Guía para aplicar un sistema profesional de imprimación antioxidante y esmalte de poliuretano sobre una verja, reja o barandilla de hierro.',
      },
    },

    'pintar-placas-pladur-yeso-laminado': {
      slug: 'pintar-placas-pladur-yeso-laminado',
      title: 'Cómo pintar placas de pladur o yeso laminado nuevas',
      description: 'Prepara y pinta placas de yeso laminado (pladur) recién instaladas o yeso proyectado, evitando las marcas de absorción irregular en las juntas emplastecidas.',
      category: 'pintura', subcategory: 'Paredes y techos',
      problem: 'pintar_pladur',
      objective: 'pintar',
      surface: 'pared',
      difficulty: 'Fácil',
      estimatedTime: '1 día (imprimación + 2 manos de acabado)',
      result: 'Pared o techo de pladur o yeso proyectado pintado sin marcas de absorción irregular en las juntas, con acabado uniforme',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Paredes y techos'],
      materials: [
        { fase: 'Imprimación', familiaSugerida: 'Selladoras e imprimaciones', items: ['Pintura para placas multiyeso'] },
        { fase: 'Acabado',     familiaSugerida: 'Pinturas para paredes',      items: ['Pintura vinílica o acrílica de acabado'] },
      ],
      receta: [
        { fase: 'Revisar', emoji: '🔍' },
        { fase: 'Imprimar',emoji: '🎨' },
        { fase: 'Pintar',  emoji: '🖌️' },
        { fase: 'Repasar', emoji: '✅' },
      ],
      steps: [
        { n: 1, title: 'Revisar las juntas emplastecidas', text: 'El montaje de placas de yeso laminado con juntas emplastecidas provoca distintas absorciones entre la placa y la masilla de junta — si se pinta directamente, esas juntas suelen marcarse en el acabado final.', productos: [] },
        { n: 2, title: 'Aplicar la pintura para placas multiyeso', text: 'Aplica esta pintura de imprimación y terminación pensada específicamente para placas de yeso laminado, paneles de fibra-yeso o cartón-yeso, y superficies de yeso proyectado. Iguala la absorción entre placa y juntas antes del acabado.', productos: ['Pintura para placas multiyeso'] },
        { n: 3, title: 'Aplicar la pintura de acabado', text: 'Una vez seca la base, aplica dos manos de la pintura de acabado elegida (vinílica o acrílica), dejando secar entre manos según lo indicado en el envase.', productos: ['Pintura vinílica o acrílica de acabado'] },
        { n: 4, title: 'Repasar bajo luz rasante', text: 'Antes de dar por terminado el trabajo, revisa la pared con una luz rasante (de lado) — así se detectan mejor posibles marcas de junta que con luz frontal.', productos: [] },
      ],
      professionalTips: [
        'Saltarse la pintura específica para multiyeso es la causa más habitual de que, meses después de pintar un pladur nuevo, se empiecen a marcar las líneas de las juntas bajo ciertas luces — a esas alturas, ya no queda otra que volver a imprimar y repintar toda la superficie.',
      ],
      commonMistakes: [
        'Pintar directamente el acabado final sobre pladur nuevo sin una base que iguale la absorción de las juntas.',
        'No dejar secar completamente la base multiyeso antes de aplicar el acabado.',
        'No revisar el resultado con luz rasante antes de dar el trabajo por terminado.',
      ],
      recommendedProducts: [
        { nombre: 'TITAN-PRO S-60 PLACAS MULTIYESO 4 L.BL.MATE', categoria: 'Pinturas', formato: '4 L', precio: '24,79 €', fichaTecnica: 'https://www.titanpro.es/productos/s-60-pintura-placas-multi-yeso' },
        { nombre: 'TITAN P-60 P.VINILICA PREMIUM MATE 4 L.BLANCO', categoria: 'Pinturas', formato: '4 L', precio: '22,32 €', fichaTecnica: 'https://msp.images.akzonobel.com/prd/dh/eesbdm/documents/b7/70/6e/2c/tp_p60_vinilica_premium_mate_00_00_00_ftecnicaes.pdf' },
      ],
      alternativeProducts: [
        { etiqueta: 'Formato grande', nombre: 'TITAN-PRO S-60 P.PLACAS MULTIYESO 15 L.BL.MATE', precio: '71,03 €' },
        { etiqueta: 'Acabado de alta decoración', nombre: 'PINT.ACRILICA P-500 EXTRA PREMIUM 15 L.BLANCO MATE', precio: '69,67 €' },
      ],
      relatedSolutions: ['pintar-pared-interior'],
      seo: {
        title: 'Cómo pintar placas de pladur o yeso laminado nuevas | Orencio Matas',
        description: 'Guía para preparar y pintar placas de pladur o yeso proyectado nuevas, evitando las marcas de absorción en las juntas.',
      },
    },

    'pintar-metal-oxidado-directo-oxiron': {
      slug: 'pintar-metal-oxidado-directo-oxiron',
      title: 'Cómo pintar metal oxidado directamente, sin quitar el óxido ni imprimar',
      description: 'Pinta hierro oxidado directamente con un esmalte antioxidante formulado para aplicarse sobre el óxido, sin necesidad de imprimación previa ni de eliminar el óxido por completo.',
      category: 'metal', subcategory: 'Pintura y protección de cerramientos metálicos',
      problem: 'pintar_directo_oxido',
      objective: 'pintar',
      surface: 'metal',
      difficulty: 'Fácil',
      estimatedTime: '1 día (2 manos, la segunda a partir de 1 hora)',
      result: 'Pieza de hierro pintada y protegida directamente sobre el óxido, en un solo día y sin necesidad de imprimación',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Metal', 'Pintura y protección de cerramientos metálicos'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza / Desengrasantes', items: ['Cepillado de óxido suelto'] },
        { fase: 'Acabado',     familiaSugerida: 'Esmaltes antioxidantes directos al óxido', items: ['Esmalte antioxidante directo al óxido'] },
      ],
      receta: [
        { fase: 'Limpiar',  emoji: '🧽' },
        { fase: 'Pintar',   emoji: '🖌️' },
        { fase: 'Repetir',  emoji: '🔁' },
        { fase: 'Curar',    emoji: '✅' },
      ],
      steps: [
        { n: 1, title: 'Limpiar la superficie con un cepillo', text: 'Cepilla la pieza para quitar las partículas de óxido sueltas y la suciedad superficial. No hace falta llegar a metal blanco ni eliminar todo el óxido: este tipo de esmalte está formulado precisamente para aplicarse sobre el óxido adherido.', productos: ['Cepillado de óxido suelto'] },
        { n: 2, title: 'Aplicar la primera mano directamente', text: 'Aplica el esmalte directamente sobre el hierro y el óxido, sin imprimación previa — el producto tiene una doble función de protección y decoración en una sola capa.', productos: ['Esmalte antioxidante directo al óxido'] },
        { n: 3, title: 'Aplicar la segunda mano', text: 'En el acabado liso, la segunda mano se puede aplicar transcurrida aproximadamente 1 hora, ya que este tipo de esmalte seca muy rápido. Esto permite terminar el trabajo en un solo día.', productos: [] },
        { n: 4, title: 'Dejar curar antes de exponerlo a uso intenso', text: 'Aunque seca rápido al tacto, deja pasar unas horas más antes de un uso o manipulación intensa de la pieza, para que alcance toda su resistencia a rayadas e impactos.', productos: [] },
      ],
      professionalTips: [
        'Se puede aplicar a brocha, rodillo o pistola sin que descuelgue, lo que lo hace muy práctico en piezas verticales como verjas o barandillas — a diferencia de otros esmaltes, no hace falta trabajar con capas muy finas para evitar chorreos.',
      ],
      commonMistakes: [
        'Aplicar una imprimación antes, pensando que hace falta como en un sistema tradicional — con este tipo de esmalte no es necesaria y no aporta ninguna mejora.',
        'Esperar 4 horas entre manos como con un esmalte convencional, perdiendo tiempo de trabajo sin necesidad.',
        'Pintar sobre óxido muy suelto o escamado sin cepillar antes: el esmalte protege el óxido adherido, no sustituye a un cepillado mínimo de lo que ya se está desprendiendo.',
        'Usar esta técnica sobre superficies con grasa o aceite, que sí hay que desengrasar antes en cualquier sistema.',
      ],
      recommendedProducts: [
        { nombre: 'OXIRON LISO BRILLANTE 750 ML.NEGRO', categoria: 'Pinturas', formato: '750 ml', precio: '17,19 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Acabado satinado', nombre: 'OXIRON LISO SATINADO 750 ML.NEGRO', precio: '17,57 €' },
        { etiqueta: 'Zonas de difícil acceso', nombre: 'SPRAY OXIRON P. 400 ML NEGRO (204)', precio: '11,65 €' },
        { etiqueta: 'Si hay mucho óxido suelto antes de empezar', nombre: 'DESOXIDANTE TITAN MULTIUSOS 1 L.', precio: '11,43 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal', 'pintar-reja-verja-hierro', 'dar-acabado-forjado-metal-jardin'],
      seo: {
        title: 'Cómo pintar metal oxidado sin quitar el óxido | Orencio Matas',
        description: 'Guía para pintar hierro oxidado directamente, sin imprimación, con un esmalte antioxidante formulado para aplicarse sobre el óxido.',
      },
    },

    'dar-acabado-forjado-metal-jardin': {
      slug: 'dar-acabado-forjado-metal-jardin',
      title: 'Cómo dar un acabado de forja, pavonado o martelé a una verja o mueble metálico',
      description: 'Elige entre los acabados decorativos de forja, pavonado o martelé para dar a una verja, farola o mueble de jardín un aspecto metálico trabajado, con la misma protección antioxidante directa al óxido.',
      category: 'metal', subcategory: 'Pintura y protección de cerramientos metálicos',
      problem: 'acabado_forjado_metal',
      objective: 'acabado',
      surface: 'metal',
      difficulty: 'Fácil',
      estimatedTime: '1 día (2 manos, con secado entre ellas)',
      result: 'Pieza metálica con un acabado decorativo de forja, pavonado o martelé, protegida frente a la oxidación durante años',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Metal', 'Pintura y protección de cerramientos metálicos'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza / Desengrasantes', items: ['Cepillado de óxido suelto y desengrasado'] },
        { fase: 'Acabado',     familiaSugerida: 'Esmaltes antioxidantes directos al óxido', items: ['Esmalte antioxidante con acabado decorativo (forja, pavonado o martelé)'] },
      ],
      receta: [
        { fase: 'Elegir textura', emoji: '🎯' },
        { fase: 'Limpiar',        emoji: '🧽' },
        { fase: 'Pintar',         emoji: '🖌️' },
        { fase: 'Proteger',       emoji: '🛡️' },
      ],
      steps: [
        { n: 1, title: 'Elegir el acabado según el resultado que buscas', text: 'Forja da un aspecto metálico natural tipo forjado clásico; pavonado es una forja más fina, ideal cuando se busca un acabado más discreto; martelé tiene una textura martillada más marcada, muy usada en mobiliario urbano, ascensores o cerrajería. Los tres son igual de resistentes: la diferencia es solo estética.', productos: [] },
        { n: 2, title: 'Preparar la superficie', text: 'Cepilla el óxido suelto y desengrasa la pieza. Igual que con el resto de la gama, no hace falta eliminar todo el óxido adherido ni aplicar imprimación.', productos: ['Cepillado de óxido suelto y desengrasado'] },
        { n: 3, title: 'Aplicar el esmalte decorativo', text: 'Aplica el esmalte elegido directamente sobre el metal. En piezas donde se busque un acabado más perfecto (mobiliario urbano, cerrajería fina), es aconsejable aplicar a pistola en vez de a brocha.', productos: ['Esmalte antioxidante con acabado decorativo (forja, pavonado o martelé)'] },
        { n: 4, title: 'Dar la segunda mano', text: 'Aplica una segunda mano una vez seca al tacto la primera, para una cobertura uniforme y la máxima protección de hasta 10 años frente a la intemperie.', productos: [] },
      ],
      professionalTips: [
        'En piezas grandes y muy visibles (verjas de entrada, mobiliario urbano), conviene probar antes el acabado elegido en una zona poco visible: la textura final de forja, pavonado o martelé varía ligeramente según el grosor de la capa aplicada.',
      ],
      commonMistakes: [
        'Mezclar sin querer productos de acabado liso y de acabado texturado (forja/pavonado/martelé) en la misma pieza, dando un resultado irregular.',
        'Aplicar a brocha en piezas donde se buscaba un acabado muy perfecto, en vez de a pistola.',
        'Pensar que el acabado martelé o forja requiere imprimación adicional por ser más decorativo: no la necesita, igual que el resto de la gama.',
        'No dejar secar bien entre manos, empastando la textura decorativa en vez de marcarla con nitidez.',
      ],
      recommendedProducts: [
        { nombre: 'OXIRON FORJA 750 ML.NEGRO', categoria: 'Pinturas', formato: '750 ml', precio: '15,06 €' },
        { nombre: 'OXIRON PAVONADO 750 ML.NEGRO', categoria: 'Pinturas', formato: '750 ml', precio: '15,91 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Acabado martillado', nombre: 'OXIRON MARTELE 750 ML.GRIS PLATA', precio: '17,19 €' },
        { etiqueta: 'Zonas de difícil acceso', nombre: 'SPRAY OXIRON P. 400 ML NEGRO (204)', precio: '11,65 €' },
      ],
      relatedSolutions: ['pintar-metal-oxidado-directo-oxiron', 'pintar-reja-verja-hierro', 'eliminar-oxido-metal'],
      seo: {
        title: 'Cómo dar un acabado de forja, pavonado o martelé a una verja | Orencio Matas',
        description: 'Guía para elegir entre los acabados decorativos de forja, pavonado o martelé en una verja, farola o mueble metálico.',
      },
    },

    'renovar-banera-lavabo-sanitario': {
      slug: 'renovar-banera-lavabo-sanitario',
      title: 'Cómo renovar una bañera, lavabo o sanitario sin cambiarlo',
      description: 'Devuelve el aspecto de fábrica a una bañera, lavabo o sanitario desgastado con un esmalte de aspecto cerámico, sin obra ni necesidad de sustituir la pieza.',
      category: 'pintura', subcategory: 'Bañeras y sanitarios',
      problem: 'renovar_banera_sanitario',
      objective: 'pintar',
      surface: 'ceramica',
      difficulty: 'Media',
      estimatedTime: '2 días (imprimación + 2 manos, con secado entre capas) + 72 h antes de usar',
      result: 'Bañera, lavabo o sanitario con un aspecto renovado tipo cerámica, sin necesidad de picar ni sustituir la pieza',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Bañeras y sanitarios'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza / Desengrasantes', items: ['Desengrasante y lija de grano fino'] },
        { fase: 'Acabado',     familiaSugerida: 'Esmaltes',                  items: ['Esmalte de aspecto cerámico para bañeras y sanitarios'] },
      ],
      receta: [
        { fase: 'Limpiar',  emoji: '🧴' },
        { fase: 'Lijar',    emoji: '🪚' },
        { fase: 'Pintar',   emoji: '🎨' },
        { fase: 'Esperar',  emoji: '⏳' },
      ],
      steps: [
        { n: 1, title: 'Desengrasar a fondo', text: 'Limpia y desengrasa por completo la superficie a pintar, eliminando cualquier resto de cal, jabón o grasa — es el paso que más condiciona que el esmalte agarre bien.', productos: ['Desengrasante y lija de grano fino'] },
        { n: 2, title: 'Matizar la superficie', text: 'Si la pieza es muy brillante (esmalte cerámico original, bañera de fundición o acrílico muy pulido), pasa lija de grano fino para que el esmalte nuevo tenga a qué agarrarse.', productos: ['Desengrasante y lija de grano fino'] },
        { n: 3, title: 'Aplicar el esmalte de aspecto cerámico', text: 'Aplica el esmalte específico de aspecto cerámico con brocha o rodillo pequeño, en dos capas a intervalos de 24 horas.', productos: ['Esmalte de aspecto cerámico para bañeras y sanitarios'] },
        { n: 4, title: 'Respetar el tiempo antes de usar', text: 'Deja curar el esmalte por completo antes de volver a usar la pieza — en el caso de una bañera, espera al menos 72 horas antes de llenarla de agua.', productos: [] },
      ],
      professionalTips: [
        'No sirve cualquier esmalte de pared o de azulejo para una bañera o sanitario: necesitas uno formulado específicamente con aspecto cerámico, pensado para aguantar agua estancada y el roce diario sin perder brillo.',
      ],
      commonMistakes: [
        'Pintar sin desengrasar y lijar antes la superficie brillante original.',
        'Usar la bañera antes de que el esmalte haya curado del todo (mínimo 72 horas).',
        'Aplicar una sola mano en vez de las dos recomendadas.',
        'Confundir un esmalte de azulejo de pared con uno específico para bañeras y sanitarios.',
      ],
      recommendedProducts: [
        { nombre: 'TITANLUX ASPECTO CERAMICO 750 ML.BLANCO', categoria: 'Pinturas', formato: '750 ml', precio: '33,89 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Tono marfil', nombre: 'TITANLUX ASPECTO CERAMICO 750 ML.MARFIL', precio: '28,04 €' },
        { etiqueta: 'Tono visón', nombre: 'TITANLUX ASPECTO CERAMICO 750 ML.VISON', precio: '28,04 €' },
        { etiqueta: 'Tono gris cinzento', nombre: 'TITANLUX ASPECTO CERAMICO 750 MLGRIS CINZENTO', precio: '28,04 €' },
        { etiqueta: 'Formulación Sanitarios', nombre: 'TITANLUX ASPECTO CERAMICO SANT.750 ML.BLANCO', precio: '34,04 €' },
      ],
      relatedSolutions: ['pintar-azulejos', 'sellar-juntas-bano'],
      seo: {
        title: 'Cómo renovar una bañera, lavabo o sanitario sin cambiarlo | Orencio Matas',
        description: 'Guía para dar un aspecto cerámico renovado a una bañera, lavabo o sanitario desgastado, sin obra ni sustitución de la pieza.',
      },
    },

    'pintar-radiador-calefaccion': {
      slug: 'pintar-radiador-calefaccion',
      title: 'Cómo pintar un radiador de calefacción',
      description: 'Renueva el color de un radiador de hierro con una imprimación antioxidante y un esmalte específico para radiadores, resistente al calor y sin desprender mal olor.',
      category: 'metal', subcategory: 'Pintura de radiadores',
      problem: 'pintar_radiador',
      objective: 'pintar',
      surface: 'metal',
      difficulty: 'Fácil',
      estimatedTime: '1-2 días (imprimación + 2 manos de esmalte, con secado entre capas)',
      result: 'Radiador con un acabado renovado, resistente al calor de uso normal y sin desprender olor una vez seco',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Metal', 'Pintura de radiadores'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza / Desengrasantes', items: ['Cepillado de óxido y desengrasado con aguarrás'] },
        { fase: 'Imprimación', familiaSugerida: 'Imprimaciones anticorrosivas', items: ['Minio sintético o imprimación antioxidante (solo si hay hierro visto u óxido)'] },
        { fase: 'Acabado',     familiaSugerida: 'Esmaltes',                    items: ['Esmalte específico para radiadores'] },
        { fase: 'Aplicación',  familiaSugerida: 'Brochas y útiles',            items: ['Paletina de codo especial para radiadores'] },
      ],
      receta: [
        { fase: 'Preparar', emoji: '🧽' },
        { fase: 'Imprimar', emoji: '🛡️' },
        { fase: 'Pintar',   emoji: '🖌️' },
        { fase: 'Ventilar', emoji: '💨' },
      ],
      steps: [
        { n: 1, title: 'Eliminar suciedad y óxido', text: 'Frota toda la superficie con un cepillo de púas o tela de esmeril para eliminar suciedad y óxido, y quita el polvillo resultante con un trapo humedecido en aguarrás. Deja secar.', productos: ['Cepillado de óxido y desengrasado con aguarrás'] },
        { n: 2, title: 'Imprimar si hay hierro visto', text: 'Si el radiador tiene zonas de hierro desnudo o puntos de óxido, aplica antes una capa de minio sintético o imprimación antioxidante y deja secar 24 horas. Sobre un radiador ya pintado y en buen estado, este paso no es necesario.', productos: ['Minio sintético o imprimación antioxidante (solo si hay hierro visto u óxido)'] },
        { n: 3, title: 'Aplicar el esmalte con paletina de codo', text: 'Usa una brocha de codo especial para radiadores para llegar bien entre las láminas, y aplica dos capas del esmalte elegido a intervalos de 24 horas.', productos: ['Esmalte específico para radiadores', 'Paletina de codo especial para radiadores'] },
        { n: 4, title: 'Pintar y encender en la época adecuada', text: 'Para evitar molestias de olor mientras se seca del todo, pinta los radiadores quitados de uso (primavera o verano) y no los enciendas hasta que el esmalte esté completamente curado.', productos: [] },
      ],
      professionalTips: [
        'Si el radiador estaba pintado y la pintura vieja está bien adherida, sin desconchados, basta con desengrasar y lijar suavemente antes de pintar — no hace falta repetir la imprimación.',
      ],
      commonMistakes: [
        'Pintar sobre óxido o suciedad sin cepillar y desengrasar antes.',
        'Encender la calefacción antes de que el esmalte esté completamente seco, generando mal olor en toda la casa.',
        'Usar un esmalte normal de pared en vez de uno específico para radiadores, formulado para resistir el calor de uso habitual.',
        'Pintar en pleno invierno con el radiador en uso, en vez de aprovechar primavera o verano.',
      ],
      recommendedProducts: [
        { nombre: 'BRUGUER ESM.RADIADORES 750 ML.BLANCO', categoria: 'Pinturas', formato: '750 ml', precio: '16,25 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Imprimación (gris)', nombre: 'MINIO SINTETICO TITANLUX MATE 750 ML.GRIS', precio: '20,18 €' },
        { etiqueta: 'Imprimación (naranja)', nombre: 'MINIO SINTETICO TITANLUX MATE 750 ML.NARANJA', precio: '20,18 €' },
        { etiqueta: 'Brocha de codo', nombre: 'PALETINA RADIADOR Nº 18 CIRET', precio: '1,97 €' },
        { etiqueta: 'Limpieza y dilución', nombre: 'AGUARRAS PINO KELSIA 750 ML.', precio: '2,52 €' },
      ],
      relatedSolutions: ['pintar-reja-verja-hierro', 'eliminar-oxido-metal'],
      seo: {
        title: 'Cómo pintar un radiador de calefacción | Orencio Matas',
        description: 'Guía para pintar un radiador de hierro con imprimación antioxidante y esmalte específico, resistente al calor y sin mal olor.',
      },
    },

    'limpiar-moho-pared-azulejo': {
      slug: 'limpiar-moho-pared-azulejo',
      title: 'Cómo limpiar el moho de una pared o azulejo',
      description: 'Elimina las manchas de moho de una pared, azulejo u otra superficie dura con un limpiador fungicida específico (o lejía diluida), dejándola limpia y desinfectada, sin necesidad de pintar después.',
      category: 'limpieza', subcategory: 'Moho y humedad',
      problem: 'moho_general',
      objective: 'limpiar',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: '1-2 h (incluye el tiempo de actuación del producto) + varias horas de secado',
      result: 'Superficie limpia, desinfectada y sin manchas de moho, lista para seguir usándose con normalidad',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Moho y humedad'],
      materials: [
        { fase: 'Protección', familiaSugerida: 'Guantes y mascarillas', items: ['Guantes de protección', 'Mascarilla'] },
        { fase: 'Limpieza',   familiaSugerida: 'Limpiadores antimoho', items: ['Limpiador antimoho fungicida (o lejía diluida en agua)'] },
        { fase: 'Aplicación', familiaSugerida: 'Brochas y útiles',     items: ['Cepillo, estropajo, brocha o rodillo'] },
      ],
      receta: [
        { fase: 'Proteger',  emoji: '🧤' },
        { fase: 'Aplicar',   emoji: '🧴' },
        { fase: 'Actuar',    emoji: '⏳' },
        { fase: 'Aclarar',   emoji: '🚿' },
      ],
      steps: [
        { n: 1, title: 'Ventilar y protegerte', text: 'Abre ventanas antes de empezar y ponte guantes — si vas a tratar una zona amplia, usa también mascarilla. Los vapores del producto y las esporas del propio moho pueden irritar las vías respiratorias.', productos: ['Guantes de protección', 'Mascarilla'] },
        { n: 2, title: 'Cepillar la suciedad suelta', text: 'Antes de aplicar el producto, elimina con un cepillo la mayor cantidad posible de suciedad y polvo de la zona afectada — el limpiador actúa mejor sobre una superficie ya desempolvada.', productos: [] },
        { n: 3, title: 'Aplicar el limpiador antimoho', text: 'Aplica el producto sobre las zonas con moho con brocha, rodillo o estropajo, y déjalo actuar al menos 1 hora sin aclarar — es el tiempo que necesita el fungicida para matar el hongo, no solo tapar la mancha. Como alternativa, una solución de lejía diluida en agua también limpia y desinfecta.', productos: ['Limpiador antimoho fungicida (o lejía diluida en agua)'] },
        { n: 4, title: 'Aclarar y dejar secar bien', text: 'Aclara la superficie tratada con agua limpia y déjala secar completamente, con buena ventilación, para no dejar humedad residual que favorezca que el moho vuelva a aparecer.', productos: [] },
      ],
      professionalTips: [
        'La dosis orientativa del limpiador antimoho es de unos 200 ml por m² (rinde unos 5 m² por litro), en una o dos capas según lo afectada que esté la superficie.',
        'Si el moho reaparece con frecuencia en la misma zona pese a limpiarlo bien, el problema de fondo suele ser de humedad o falta de ventilación — conviene identificar y corregir esa causa, o la mancha volverá antes o después por muy bien que se limpie.',
      ],
      commonMistakes: [
        'Frotar solo por encima sin dejar actuar el producto el tiempo indicado — el hongo puede seguir vivo bajo la mancha aunque visualmente haya desaparecido.',
        'Mezclar el limpiador antimoho con lejía u otros productos de limpieza distintos — algunas combinaciones (como lejía y amoníaco) generan gases tóxicos.',
        'No proteger manos ni vías respiratorias durante la aplicación.',
        'No ventilar la zona durante y después del tratamiento.',
      ],
      recommendedProducts: [
        { nombre: 'TITAN LIMPIADOR ANTIMOHO 500 ML.', categoria: 'Droguería', formato: '500 ml', precio: '4,84 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Otra marca', nombre: 'PASO ELIMINA MOHO 500 ML.PISTOLA', precio: '4,96 €' },
        { etiqueta: 'Método alternativo (diluida en agua)', nombre: 'LEJIA ACE 2 L.REGULAR', precio: '1,75 €' },
      ],
      relatedSolutions: ['eliminar-moho-pared-antes-pintar', 'usar-lejia-segura', 'sellar-juntas-bano'],
      seo: {
        title: 'Cómo limpiar el moho de una pared o azulejo | Orencio Matas',
        description: 'Guía para eliminar el moho de una pared, azulejo u otra superficie con un limpiador fungicida específico o con lejía diluida.',
      },
    },

    'eliminar-moho-pared-antes-pintar': {
      slug: 'eliminar-moho-pared-antes-pintar',
      title: 'Cómo eliminar el moho de una pared antes de pintar',
      description: 'Limpia y elimina el moho de una pared con un fungicida antes de pintar, y protege el resultado con una pintura con conservante antimoho — pintar directamente sobre el moho no lo elimina, solo lo tapa temporalmente y suele reaparecer.',
      category: 'pintura', subcategory: 'Tratamiento de moho',
      problem: 'moho_antes_pintar',
      objective: 'preparar',
      surface: 'pared',
      difficulty: 'Media',
      estimatedTime: '1 día para limpiar y secar + 1 día para pintar (2 manos)',
      result: 'Pared limpia, sin moho activo, y pintada con un acabado que retarda que vuelva a aparecer',
      colorChart: null,
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Tratamiento de moho'],
      materials: [
        { fase: 'Protección',           familiaSugerida: 'Guantes y mascarillas', items: ['Guantes de protección', 'Mascarilla'] },
        { fase: 'Limpieza y fungicida', familiaSugerida: 'Limpiadores antimoho',  items: ['Limpiador antimoho fungicida (o lejía diluida en agua)'] },
        { fase: 'Acabado',              familiaSugerida: 'Pinturas',             items: ['Pintura vinílica mate con conservante antimoho'] },
      ],
      receta: [
        { fase: 'Limpiar',  emoji: '🧴' },
        { fase: 'Matar el hongo', emoji: '🦠' },
        { fase: 'Secar',    emoji: '⏳' },
        { fase: 'Pintar',   emoji: '🎨' },
      ],
      steps: [
        { n: 1, title: 'Cepillar la suciedad suelta', text: 'Antes de aplicar ningún producto, elimina con un cepillo la mayor cantidad posible de suciedad y polvo de la zona afectada.', productos: [] },
        { n: 2, title: 'Aplicar el fungicida y dejar actuar', text: 'Aplica el limpiador antimoho (o una solución de lejía diluida en agua) sobre toda la zona con moho y déjalo actuar al menos 1 hora. Este paso es el que de verdad MATA el hongo — pintar sin hacerlo antes no lo elimina, solo lo tapa temporalmente.', productos: ['Limpiador antimoho fungicida (o lejía diluida en agua)'] },
        { n: 3, title: 'Aclarar y dejar secar bien', text: 'Aclara la superficie con agua limpia y déjala secar por completo — al menos 6 horas, y no apliques el limpiador con la superficie a menos de 5°C. No empieces a pintar hasta que esté totalmente seca.', productos: [] },
        { n: 4, title: 'Pintar con una pintura antimoho', text: 'Aplica dos manos de una pintura vinílica mate con conservante antimoho, respetando las condiciones de aplicación: nunca por debajo de 7°C, con humedad relativa igual o superior al 80%, ni con lluvia prevista en las próximas horas.', productos: ['Pintura vinílica mate con conservante antimoho'] },
      ],
      professionalTips: [
        'Si la pintura vieja está en mal estado (desconchada, con moho muy extendido), sanea primero toda la zona eliminando lo que no esté bien adherido antes de limpiar y pintar, igual que en cualquier otra pared en mal estado.',
        'La pintura con conservante antimoho retrasa que la mancha vuelva a salir, pero no sustituye a una buena ventilación — si el problema de fondo es una humedad estructural (condensación, filtración, etc.), conviene corregirla o el moho reaparecerá antes o después.',
      ],
      commonMistakes: [
        'Pintar directamente sobre el moho sin limpiarlo y desinfectarlo antes — es el error más común, y hace que el hongo siga vivo bajo la pintura nueva y vuelva a salir.',
        'No respetar el tiempo de secado de la limpieza antes de empezar a pintar.',
        'Aplicar la pintura con temperaturas bajas, humedad relativa muy alta o lluvia prevista.',
        'Usar una pintura cualquiera en vez de una formulada con conservante antimoho en zonas donde el moho es propenso a reaparecer.',
      ],
      recommendedProducts: [
        { nombre: 'TITAN LIMPIADOR ANTIMOHO 500 ML.', categoria: 'Droguería', formato: '500 ml', precio: '4,84 €' },
        { nombre: 'TITAN P-60 P.VINILICA PREMIUM MATE 4 L.BLANCO', categoria: 'Pinturas', formato: '4 L', precio: '22,32 €', fichaTecnica: 'https://msp.images.akzonobel.com/prd/dh/eesbdm/documents/b7/70/6e/2c/tp_p60_vinilica_premium_mate_00_00_00_ftecnicaes.pdf' },
      ],
      alternativeProducts: [
        { etiqueta: 'Método alternativo de limpieza', nombre: 'LEJIA ACE 2 L.REGULAR', precio: '1,75 €' },
        { etiqueta: 'Formato pequeño de pintura',      nombre: 'TITAN P-60 P.VINILICA PREMIUM 1 L.BLANCO MATE', precio: '8,54 €' },
        { etiqueta: 'Formato grande / base teñible',   nombre: 'PINT.VINILICA P-60 PREMIUM 15 L.BASE NEUTRA', precio: '49,91 €' },
      ],
      calculadoraCantidad: { rendimiento: 9, etiqueta: 'pintura vinílica antimoho' },
      relatedSolutions: ['limpiar-moho-pared-azulejo', 'pintar-pared-interior', 'usar-lejia-segura'],
      seo: {
        title: 'Cómo eliminar el moho de una pared antes de pintar | Orencio Matas',
        description: 'Guía para limpiar y matar el moho de una pared con un fungicida antes de pintar, y protegerla con una pintura con conservante antimoho.',
      },
    },

    'solucionar-problemas-pintura-aplicacion': {
      slug: 'solucionar-problemas-pintura-aplicacion',
      title: 'Por qué la pintura no cubre, no se adhiere, se descascarilla o hace burbujas',
      description: 'Diagnóstico rápido de los problemas más frecuentes al pintar una pared — falta de cubrición, mala adherencia, descascarillado, burbujas o marcas de rodillo/brocha — y cómo solucionar cada uno.',
      category: 'pintura', subcategory: 'Problemas al pintar',
      problem: 'pintura_problemas_aplicacion',
      objective: 'reparar',
      surface: 'pared',
      difficulty: 'Fácil',
      estimatedTime: '30 min de diagnóstico + tiempo de la reparación',
      result: 'Acabado uniforme, bien adherido y sin defectos visibles',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Problemas al pintar'],
      materials: [
        { fase: 'Preparación',  familiaSugerida: 'Fijadores / imprimaciones', items: ['Fijador sellador al agua'] },
        { fase: 'Aplicación',   familiaSugerida: 'Brochas y rodillos',        items: ['Rodillo de pelo corto o medio', 'Brocha de calidad'] },
        { fase: 'Acabado',      familiaSugerida: 'Pintura',                  items: ['Pintura plástica de calidad'] },
      ],
      receta: [
        { fase: 'Diagnosticar', emoji: '🔍' },
        { fase: 'Corregir causa', emoji: '🛠️' },
        { fase: 'Sellar si hace falta', emoji: '🧴' },
        { fase: 'Repintar',      emoji: '🎨' },
      ],
      steps: [
        { n: 1, title: 'Identificar el problema exacto', text: 'No todos los defectos se solucionan igual: "no cubre" (se transparenta el color de abajo), "no se adhiere" (se despega al tacto o con cinta), "se descascarilla" (salta en placas) y "hace burbujas" (ampollas bajo la película seca) tienen causas distintas — sigue el apartado que corresponda al tuyo.', productos: [] },
        { n: 2, title: 'Si la pintura NO CUBRE bien', text: 'Casi siempre es por aplicar poca cantidad, diluir de más, o pintar un color oscuro/muy diferente con una sola mano. Aplica 2 manos completas dejando secar entre ellas, sin diluir la pintura más de lo que indique el envase.', productos: [] },
        { n: 3, title: 'Si la pintura NO SE ADHIERE o se descascarilla', text: 'La causa casi siempre es una superficie mal preparada: polvo, grasa, humedad, o pintar directamente sobre una superficie muy lisa, brillante o con pintura antigua en mal estado. Lija ligeramente, limpia el polvo y aplica un fijador sellador antes de pintar — mucho más barato que tener que repetir el trabajo.', productos: ['Fijador sellador al agua'] },
        { n: 4, title: 'Si aparecen BURBUJAS', text: 'Suelen deberse a pintar con demasiado sol/calor directo (se seca la superficie antes de tiempo), a una superficie porosa sin sellar que suelta aire al secarse la pintura, o a agitar el bote generando espuma. Deja secar del todo, lija suavemente la zona con burbujas y vuelve a aplicar una mano fina.', productos: [] },
        { n: 5, title: 'Si quedan MARCAS DE RODILLO O BROCHA', text: 'Casi siempre es por aplicar con el rodillo casi seco, presionar demasiado, o no rematar cada pasada extendiendo bien hacia el borde ya pintado ("carga en cruz"). Usa un rodillo de pelo adecuado al acabado (corto para liso, medio para gotelé fino) y trabaja siempre de zona húmeda a zona húmeda.', productos: ['Rodillo de pelo corto o medio', 'Brocha de calidad'] },
        { n: 6, title: 'Repintar con la superficie ya corregida', text: 'Con la causa ya solucionada (superficie sellada, seca, lijada donde tocaba), aplica la pintura en 2 manos finas y uniformes, dejando secar completamente entre cada una según el tiempo indicado en el envase.', productos: ['Pintura plástica de calidad'] },
      ],
      professionalTips: [
        'El 90% de los problemas de adherencia y descascarillado empiezan por saltarse la preparación de la superficie — la pintura nunca arregla una base mal preparada, solo la disimula unos meses.',
        'Nunca apliques una mano gruesa para "cubrir de una vez" — dos manos finas cubren mejor, se adhieren mejor y tardan menos en secar sin problemas que una sola mano cargada.',
      ],
      commonMistakes: [
        'Pintar sobre polvo, grasa o humedad sin limpiar antes.',
        'Diluir la pintura más de lo que indica el fabricante para "rendir más".',
        'Pintar a pleno sol o con la superficie muy caliente.',
        'Aplicar una única mano gruesa en vez de dos manos finas.',
        'No lijar ni sellar una superficie muy lisa o brillante antes de pintar encima.',
      ],
      recommendedProducts: [
        { nombre: 'FIJAPREN RX-500 FIJADOR AL AGUA 5 L.', categoria: 'Pintura', formato: '5 L', precio: '25,16 €' },
        { nombre: 'DISCO LIJA CIRCULAR WERKU GRANO 120 225 M/M 10 UDS', categoria: 'Abrasivos', formato: '10 uds', precio: '13,21 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Fijador incoloro para exterior', nombre: 'IMPRIMACION FIJADOR SILOXANO S-30 10 L.INCOLORO', precio: '65,51 €' },
        { etiqueta: 'Fondo fijador universal', nombre: 'FONDO FIJADOR D13 10 L.INCOLORO', precio: '75,52 €' },
      ],
      relatedSolutions: ['pintar-pared-interior', 'eliminar-moho-pared-antes-pintar'],
      seo: {
        title: 'Por qué la pintura no cubre o no se adhiere | Orencio Matas',
        description: 'Diagnóstico y solución para los problemas más frecuentes al pintar: falta de cubrición, mala adherencia, descascarillado, burbujas y marcas de rodillo o brocha.',
      },
    },

    'eliminar-grasa-desengrasar': {
      slug: 'eliminar-grasa-desengrasar',
      title: 'Cómo eliminar grasa de cualquier superficie',
      description: 'Elige el desengrasante adecuado según la superficie (cocina, suelo, taller o piezas metálicas) y aplica la técnica correcta para eliminar la grasa sin dejar restos ni marcas.',
      category: 'limpieza', subcategory: 'Desengrasado',
      problem: 'eliminar_grasa',
      objective: 'limpiar',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: '10-20 min',
      result: 'Superficie limpia de grasa, sin residuos ni marcas',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Desengrasado'],
      materials: [
        { fase: 'Desengrasado', familiaSugerida: 'Desengrasantes',        items: ['Desengrasante en pistola'] },
        { fase: 'Aclarado',     familiaSugerida: 'Bayetas y gamuzas',      items: ['Bayeta de microfibra'] },
      ],
      receta: [
        { fase: 'Pulverizar', emoji: '💦' },
        { fase: 'Dejar actuar', emoji: '⏱️' },
        { fase: 'Frotar',     emoji: '🧽' },
        { fase: 'Aclarar',    emoji: '🚿' },
      ],
      steps: [
        { n: 1, title: 'Elegir el desengrasante según la superficie', text: 'Para cocina y superficies domésticas, un desengrasante estándar en pistola es suficiente. Para talleres, piezas metálicas o grasa muy incrustada, conviene uno de mayor concentración o con disolvente.', productos: ['Desengrasante en pistola'] },
        { n: 2, title: 'Pulverizar y dejar actuar', text: 'Aplica directamente sobre la grasa y deja actuar 2-5 minutos sin dejar que se seque — el desengrasante necesita tiempo para romper la grasa antes de frotar.', productos: [] },
        { n: 3, title: 'Frotar con una bayeta o estropajo suave', text: 'Frota con una bayeta de microfibra para superficies delicadas, o un estropajo no abrasivo si la grasa está muy incrustada — evita estropajos metálicos sobre superficies pintadas o pulidas.', productos: ['Bayeta de microfibra'] },
        { n: 4, title: 'Aclarar con agua limpia', text: 'Aclara bien con agua para retirar cualquier resto de producto — dejarlo sin aclarar puede volver la superficie pegajosa o resbaladiza.', productos: [] },
      ],
      professionalTips: [
        'En grasa muy antigua o cocinada (hornos, campanas extractoras), deja actuar el desengrasante más tiempo del habitual en vez de frotar con más fuerza — ahorra esfuerzo y evita rayar la superficie.',
        'Prueba siempre el desengrasante en una zona poco visible si la superficie es delicada (plástico, superficies pintadas) — algunos desengrasantes concentrados pueden opacar ciertos acabados.',
      ],
      commonMistakes: [
        'Dejar secar el desengrasante antes de frotar — pierde eficacia.',
        'Usar estropajos metálicos sobre superficies pintadas, pulidas o de acero inoxidable satinado.',
        'No aclarar bien, dejando la superficie pegajosa.',
        'Mezclar el desengrasante con lejía u otros productos químicos.',
      ],
      recommendedProducts: [
        { nombre: 'ASEVI DESENGRASANTE 750 ML.PISTOLA', categoria: 'Limpieza', formato: '750 ml', precio: '2,14 €' },
        { nombre: 'VOLGRASSS DESENGRASANTE 1 L.PISTOLA', categoria: 'Limpieza', formato: '1 L', precio: '2,86 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Uso profesional / gran cantidad', nombre: 'VINFER DESENGRASANTE BAJA ESPUMA M4 5 L.', precio: '14,13 €' },
        { etiqueta: 'Taller / grasa muy incrustada',    nombre: 'HERCOL DESENGRASANTE C/DISOLV.20 L.', precio: '180,10 €' },
      ],
      relatedSolutions: ['desinfectar-casa'],
      seo: {
        title: 'Cómo eliminar grasa de cualquier superficie | Orencio Matas',
        description: 'Guía para elegir el desengrasante adecuado y eliminar grasa de cocina, taller o piezas metálicas sin dejar restos ni marcas.',
      },
    },

    'eliminar-cal-sarro-bano': {
      slug: 'eliminar-cal-sarro-bano',
      title: 'Cómo eliminar la cal y el sarro del baño',
      description: 'Elimina la cal acumulada en grifería, mampara, azulejos y sanitarios con un desincrustante adecuado, sin dañar el esmalte ni el cromado.',
      category: 'limpieza', subcategory: 'Cal y sarro',
      problem: 'cal_bano',
      objective: 'limpiar',
      surface: 'ceramica',
      difficulty: 'Fácil',
      estimatedTime: '15-30 min',
      result: 'Grifería, mampara y azulejos sin cal ni sarro, con su brillo original',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Cal y sarro'],
      materials: [
        { fase: 'Desincrustado', familiaSugerida: 'Desincrustantes',    items: ['Desincrustante de cal'] },
        { fase: 'Frotado',       familiaSugerida: 'Estropajos',         items: ['Estropajo suave o esponja'] },
      ],
      receta: [
        { fase: 'Aplicar',  emoji: '🧴' },
        { fase: 'Dejar actuar', emoji: '⏱️' },
        { fase: 'Frotar',   emoji: '🧽' },
        { fase: 'Aclarar',  emoji: '🚿' },
      ],
      steps: [
        { n: 1, title: 'Aplicar el desincrustante', text: 'Pulveriza o extiende el producto sobre la zona con cal — grifería, mampara, juntas o sanitarios — cubriendo bien toda la superficie afectada.', productos: ['Desincrustante de cal'] },
        { n: 2, title: 'Dejar actuar unos minutos', text: 'Deja actuar entre 5 y 10 minutos (consulta el envase) — la cal necesita tiempo para disolverse antes de frotar, sobre todo si está muy acumulada.', productos: [] },
        { n: 3, title: 'Frotar con un estropajo suave', text: 'Frota con un estropajo no abrasivo o una esponja — en cromados y aceros satinados, evita estropajos metálicos que puedan rayar el acabado.', productos: ['Estropajo suave o esponja'] },
        { n: 4, title: 'Aclarar y secar', text: 'Aclara con agua abundante y seca con un paño — secar después de cada uso reduce mucho la velocidad a la que vuelve a acumularse la cal.', productos: [] },
      ],
      professionalTips: [
        'Secar la grifería y la mampara después de cada ducha es lo que más retrasa la reaparición de la cal — mucho más que cualquier producto aplicado después.',
        'En cal muy incrustada, repite la aplicación en vez de frotar con fuerza — es más eficaz y evita rayar cromados o esmaltes.',
      ],
      commonMistakes: [
        'Usar estropajos metálicos sobre grifería cromada o sanitarios esmaltados.',
        'No dejar actuar el producto el tiempo suficiente antes de frotar.',
        'Mezclar el desincrustante con lejía — puede generar gases tóxicos.',
        'No secar la grifería tras la ducha, acelerando que la cal vuelva a aparecer.',
      ],
      recommendedProducts: [
        { nombre: 'L1 LIMPIADOR DESINCRUSTANTE BAÑOS 750 ML.PIST.', categoria: 'Limpieza', formato: '750 ml', precio: '2,23 €' },
        { nombre: 'M.P.L.LIMP.DESINCRUST.WC GEL FRESH 1,500 ML.', categoria: 'Limpieza', formato: '1,5 L', precio: '1,98 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Uso profesional / cal muy incrustada', nombre: 'DW-20 LIMPIADOR DESINCRUST.ACIDO 4 L.', precio: '36,47 €' },
        { etiqueta: 'Formato pequeño de garrafa', nombre: 'TENAZ DESINCRUSTANTE SUPERF.5 L.REF.091', precio: '14,99 €' },
      ],
      relatedSolutions: ['sellar-juntas-bano', 'limpiar-moho-pared-azulejo'],
      seo: {
        title: 'Cómo eliminar la cal y el sarro del baño | Orencio Matas',
        description: 'Guía para eliminar la cal de grifería, mampara, azulejos y sanitarios sin dañar el esmalte ni el cromado.',
      },
    },

    'eliminar-restos-cemento-mortero': {
      slug: 'eliminar-restos-cemento-mortero',
      title: 'Cómo eliminar restos de cemento o mortero tras una obra',
      description: 'Elimina las salpicaduras y velos de cemento o mortero secos en azulejos, suelos y otras superficies después de una reforma, sin rayar ni dañar el acabado.',
      category: 'limpieza', subcategory: 'Limpieza tras obra',
      problem: 'restos_cemento',
      objective: 'limpiar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '20-40 min según la superficie',
      result: 'Superficie limpia, sin restos ni velos de cemento',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Limpieza tras obra'],
      materials: [
        { fase: 'Limpieza', familiaSugerida: 'Quitacementos', items: ['Quitacementos / limpiajuntas'] },
        { fase: 'Frotado',  familiaSugerida: 'Estropajos',    items: ['Estropajo o cepillo de cerdas'] },
      ],
      receta: [
        { fase: 'Barrer restos sueltos', emoji: '🧹' },
        { fase: 'Aplicar',   emoji: '🧴' },
        { fase: 'Frotar',    emoji: '🧽' },
        { fase: 'Aclarar',   emoji: '🚿' },
      ],
      steps: [
        { n: 1, title: 'Retirar los restos sueltos', text: 'Barre o aspira los restos de cemento o mortero seco que no estén pegados a la superficie, antes de aplicar cualquier producto.', productos: [] },
        { n: 2, title: 'Aplicar el quitacementos', text: 'Extiende el producto sobre las manchas o el velo de cemento, cubriendo bien toda la zona afectada.', productos: ['Quitacementos / limpiajuntas'] },
        { n: 3, title: 'Dejar actuar y frotar', text: 'Deja actuar el tiempo indicado en el envase y frota con un estropajo o cepillo de cerdas — el cemento seco necesita algo más de frotado que la suciedad normal.', productos: ['Estropajo o cepillo de cerdas'] },
        { n: 4, title: 'Aclarar con agua abundante', text: 'Aclara bien con agua limpia para retirar cualquier resto de producto y de cemento disuelto.', productos: [] },
      ],
      professionalTips: [
        'Cuanto más reciente esté el cemento, más fácil es eliminarlo — si acabas de terminar la obra, límpialo antes de que pase mucho tiempo y se endurezca del todo.',
        'Prueba primero en una zona poco visible en superficies delicadas (mármol pulido, gres esmaltado) — algunos quitacementos son ácidos y pueden opacar ciertos acabados.',
      ],
      commonMistakes: [
        'Frotar con un cepillo o estropajo metálico sobre superficies pulidas, rayándolas.',
        'Dejar secar el cemento durante semanas antes de intentar limpiarlo.',
        'No aclarar bien, dejando residuo del producto sobre la superficie.',
      ],
      recommendedProducts: [
        { nombre: 'M.P.L.QUITACEMENTOS/LIMPIAJUNTAS 1 L.', categoria: 'Limpieza', formato: '1 L', precio: '2,75 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Decapante para restos más resistentes', nombre: 'TITAN DECAPANTE GEL PROFESIONAL 1 LL.', precio: '17,13 €' },
      ],
      relatedSolutions: ['limpiar-moho-pared-azulejo', 'abrillantar-suelo-marmol'],
      seo: {
        title: 'Cómo eliminar restos de cemento o mortero tras una obra | Orencio Matas',
        description: 'Guía para eliminar salpicaduras y velos de cemento seco en azulejos y suelos tras una reforma, sin dañar el acabado.',
      },
    },

    'limpiar-cristales-sin-marcas': {
      slug: 'limpiar-cristales-sin-marcas',
      title: 'Cómo limpiar cristales y ventanas sin que queden marcas',
      description: 'La técnica y el producto correctos para dejar cristales, espejos y ventanas limpios y sin marcas ni rayas, tanto en casa como en el trabajo.',
      category: 'limpieza', subcategory: 'Cristales',
      problem: 'limpiar_cristales',
      objective: 'limpiar',
      surface: 'cristal',
      difficulty: 'Fácil',
      estimatedTime: '15-20 min',
      result: 'Cristales limpios, transparentes y sin marcas ni rayas',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Cristales'],
      materials: [
        { fase: 'Limpieza', familiaSugerida: 'Limpiacristales', items: ['Limpiacristales'] },
        { fase: 'Secado',   familiaSugerida: 'Bayetas',          items: ['Bayeta o gamuza de microfibra'] },
      ],
      receta: [
        { fase: 'Quitar polvo', emoji: '🧹' },
        { fase: 'Pulverizar', emoji: '💦' },
        { fase: 'Repasar',    emoji: '🧽' },
        { fase: 'Secar',      emoji: '✨' },
      ],
      steps: [
        { n: 1, title: 'Quitar el polvo antes de mojar', text: 'Pasa un paño seco o una gamuza para quitar el polvo suelto — si aplicas el limpiacristales sobre polvo, este se convierte en barrillo y deja más marcas.', productos: [] },
        { n: 2, title: 'Pulverizar el limpiacristales', text: 'Aplica el producto de forma uniforme por toda la superficie, sin empapar en exceso — con una capa fina es suficiente.', productos: ['Limpiacristales'] },
        { n: 3, title: 'Repasar con movimientos en una sola dirección', text: 'Repasa con la bayeta de microfibra en movimientos en zigzag o siempre en la misma dirección (nunca en círculos) — así evitas que el producto se reparta de forma irregular y deje marcas.', productos: ['Bayeta o gamuza de microfibra'] },
        { n: 4, title: 'Secar con una gamuza limpia y seca', text: 'Repasa enseguida con una gamuza seca y limpia antes de que el producto se seque solo — es lo que más evita que queden marcas o cercos.', productos: ['Bayeta o gamuza de microfibra'] },
      ],
      professionalTips: [
        'Evita limpiar cristales con sol directo — el producto se seca demasiado rápido y deja marcas antes de poder repasarlo bien.',
        'Usa una gamuza distinta para aplicar el producto y para el secado final — mezclar ambas funciones en el mismo paño reparte la suciedad en vez de retirarla.',
      ],
      commonMistakes: [
        'Limpiar con papel de cocina normal en vez de gamuza de microfibra — suelta pelusa.',
        'Frotar en movimientos circulares en vez de en una sola dirección.',
        'Aplicar demasiado producto de una vez.',
        'Limpiar con sol directo sobre el cristal.',
      ],
      recommendedProducts: [
        { nombre: 'GLASSPON CRISTALES Y SUPERFICIES 5 L.', categoria: 'Limpieza', formato: '5 L', precio: '9,03 €' },
        { nombre: 'BAYETA CISNE CRISTALES MICROFIBRA 38X40CMS.', categoria: 'Limpieza', formato: '38x40 cm', precio: '0,76 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Uso profesional con mango y goma', nombre: 'LIMPIACRISTALES DUO RESSOL REF. 01771', precio: '10,93 €' },
        { etiqueta: 'Formato profesional grande', nombre: 'LIMPIACRISTALES EXCELERATOR C/GOMA 45 CMS.RF.2338', precio: '38,12 €' },
      ],
      relatedSolutions: [],
      seo: {
        title: 'Cómo limpiar cristales y ventanas sin que queden marcas | Orencio Matas',
        description: 'Técnica y producto adecuados para limpiar cristales, espejos y ventanas dejándolos transparentes y sin marcas ni rayas.',
      },
    },

    'elegir-lija-grano-abrasivo': {
      slug: 'elegir-lija-grano-abrasivo',
      title: 'Cómo elegir la lija y el grano adecuado para cada trabajo',
      description: 'Guía para elegir el tipo de lija y el grano correcto según el trabajo — desde desbastar madera o metal hasta dar el último repaso antes de pintar o barnizar.',
      category: 'pintura', subcategory: 'Elegir herramientas y consumibles',
      problem: 'elegir_lija',
      objective: 'preparar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '5 min para decidir',
      result: 'La lija y el grano correctos para tu trabajo, sin comprar por prueba y error',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Elegir herramientas y consumibles'],
      materials: [
        { fase: 'Selección', familiaSugerida: 'Lijas y abrasivos', items: ['Lija o disco abrasivo del grano adecuado'] },
      ],
      receta: [
        { fase: 'Identificar el trabajo', emoji: '🔍' },
        { fase: 'Elegir el grano', emoji: '🔢' },
        { fase: 'Elegir el soporte', emoji: '📄' },
        { fase: 'Lijar',   emoji: '🖐️' },
      ],
      steps: [
        { n: 1, title: 'Grano bajo (40-80) para desbastar', text: 'Para quitar pintura vieja, óxido superficial grueso o nivelar madera muy irregular, empieza con un grano bajo (40 a 80) — arranca material rápido pero deja la superficie marcada, así que nunca es el último paso.', productos: [] },
        { n: 2, title: 'Grano medio (100-180) para preparar', text: 'Es el grano más habitual para preparar una superficie antes de pintar o barnizar — suaviza las marcas del grano bajo sin llevarse demasiado material.', productos: [] },
        { n: 3, title: 'Grano fino (220-400) para el acabado', text: 'Para el último repaso antes de pintar, o entre manos de barniz/pintura, usa un grano fino — deja la superficie lisa al tacto sin marcar la pintura de abajo.', productos: [] },
        { n: 4, title: 'Grano muy fino (600 en adelante) para pulir', text: 'Se usa sobre todo al agua, para pulir barnices, lacas o pequeñas imperfecciones justo antes del acabado final — es el que menos material arranca.', productos: [] },
        { n: 5, title: 'Elegir el soporte según la herramienta', text: 'Hoja de lija para lijar a mano, rollo para grandes superficies, y disco (velcro o autoadhesivo) para lijadora orbital o radial — comprueba el diámetro de tu lijadora antes de comprar los discos.', productos: ['Lija o disco abrasivo del grano adecuado'] },
      ],
      professionalTips: [
        'Ve subiendo de grano en pasos, sin saltar demasiado (por ejemplo de 80 a 180, no directamente de 80 a 400) — cada grano necesita quitar las marcas del anterior, y si el salto es muy grande, el más fino no consigue eliminarlas.',
        'La lija al agua dura más y genera menos polvo que la lija seca en trabajos de pulido fino, aunque hay que mojarla mientras se usa.',
      ],
      commonMistakes: [
        'Usar un único grano para todo el proceso, desde desbastar hasta el acabado.',
        'Saltar directamente de un grano muy bajo a uno muy alto.',
        'Comprar discos sin comprobar el diámetro que admite la lijadora.',
        'No limpiar el polvo entre pasadas de distinto grano.',
      ],
      recommendedProducts: [
        { nombre: 'DISCO LIJA CIRCULAR WERKU GRANO 080 225 M/M 10 UDS', categoria: 'Abrasivos', formato: '225 mm', precio: '13,21 €' },
        { nombre: 'DISCO LIJA CIRCULAR WERKU GRANO 120 225 M/M 10 UDS', categoria: 'Abrasivos', formato: '225 mm', precio: '13,21 €' },
        { nombre: 'DISCO LIJA CIRCULAR WERKU GRANO 060 225 M/M 10 UDS', categoria: 'Abrasivos', formato: '225 mm', precio: '13,21 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Lija al agua para pulido fino', nombre: '.LIJA AL AGUA 314 HOJA 230x280 MM. P-800 01972', precio: '1,91 €' },
      ],
      // Selector interactivo: el usuario elige qué va a hacer y se le
      // muestra la lija/disco real del grano correspondiente, en vez de
      // tener que traducir él mismo la explicación de grano bajo/medio/
      // fino/muy fino de los pasos de arriba a un producto concreto.
      selectorSuperficie: {
        pregunta: '¿Qué necesitas hacer?',
        opciones: [
          { id: 'desbastar', label: 'Desbastar (quitar pintura vieja, óxido grueso, nivelar)', nombre: 'LIJA TELA PLIEGO GRANO 2 (60) PENTRILO', motivo: 'Grano bajo (60): arranca material rápido para desbastar — nunca es el último paso, deja marca.' },
          { id: 'preparar', label: 'Preparar antes de pintar o barnizar', nombre: 'LIJA PAPEL IMPERMEABLE PLIEGO GRANO 150 PENTRILO', motivo: 'Grano medio (150): suaviza las marcas del desbastado sin llevarse demasiado material — el más habitual antes de pintar.' },
          { id: 'acabado', label: 'Último repaso antes de pintar, o entre manos', nombre: 'LIJA PAPEL IMPERMEABLE GRANO 320 PENTRILO', motivo: 'Grano fino (320): deja la superficie lisa al tacto sin marcar la pintura o el barniz de abajo.' },
          { id: 'pulir', label: 'Pulir barniz, laca o pequeñas imperfecciones', nombre: 'LIJA PAPEL IMPERMEABLE GRANO 800 PENTRILO', motivo: 'Grano muy fino (800), para usar al agua: el que menos material arranca, pensado para pulir el acabado final.' },
        ],
      },
      relatedSolutions: ['elegir-lijadora-superficie', 'corregir-marcas-lijado'],
      seo: {
        title: 'Cómo elegir la lija y el grano adecuado para cada trabajo | Orencio Matas',
        description: 'Guía para elegir el tipo de lija y el grano correcto, desde desbastar hasta el acabado final, antes de pintar o barnizar.',
      },
    },

    'perfumeria-elegir-fragancia-regalo': {
      slug: 'perfumeria-elegir-fragancia-regalo',
      title: 'Cómo elegir un perfume o colonia como regalo',
      description: 'Ideas para acertar con un perfume de regalo según la persona y el momento, con opciones de eau de parfum, eau de toilette y estuches ya preparados para regalar.',
      category: 'perfumeria', subcategory: 'Elegir fragancia',
      problem: 'elegir_perfume',
      objective: 'limpiar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '10 min para decidir',
      result: 'Un perfume o colonia acertado, con o sin necesidad de envolver para regalo',
      breadcrumb: ['Centro de Soluciones', 'Perfumería y cuidado personal', 'Elegir fragancia'],
      materials: [
        { fase: 'Elección', familiaSugerida: 'Colonias', items: ['Eau de parfum o eau de toilette'] },
      ],
      receta: [
        { fase: 'Elegir la intensidad', emoji: '💧' },
        { fase: 'Elegir el estilo', emoji: '🌸' },
        { fase: 'Formato regalo', emoji: '🎁' },
      ],
      steps: [
        { n: 1, title: 'Eau de parfum (EDP) para mayor duración', text: 'Tiene mayor concentración de esencia, dura más horas sobre la piel y suele notarse algo más intensa — buena opción por defecto para un regalo, ya que "cunde" más.', productos: ['Eau de parfum o eau de toilette'] },
        { n: 2, title: 'Eau de toilette (EDT) para un uso más ligero', text: 'Menor concentración, más fresca y ligera — habitual para el día a día o climas cálidos, y suele costar algo menos que un EDP del mismo tamaño.', productos: [] },
        { n: 3, title: 'Elegir según el estilo de la persona', text: 'Si no conoces bien sus gustos, las fragancias amaderadas o cítricas suelen ser opciones seguras y versátiles; los aromas florales o dulces son más arriesgados si no sabes con certeza que le gustan.', productos: [] },
        { n: 4, title: 'Formato estuche, listo para regalar', text: 'Si buscas algo ya preparado para regalar sin envolver, hay estuches que combinan el perfume con un formato de viaje o una crema a juego — resuelven el regalo sin más vueltas.', productos: [] },
      ],
      professionalTips: [
        'Si tienes dudas entre dos fragancias, elige la más ligera — es más fácil que guste a más gente, mientras que una fragancia muy intensa puede no ser del gusto de todos.',
        'Los formatos pequeños o de viaje son una buena opción para un primer regalo, antes de invertir en un frasco grande de una fragancia que la persona no haya probado antes.',
      ],
      commonMistakes: [
        'Elegir una fragancia muy dulce o intensa para alguien de quien no conoces bien los gustos.',
        'No fijarse en si es EDP o EDT esperando la misma duración en ambos.',
      ],
      recommendedProducts: [
        { nombre: 'TOUS EDP 90 ML.VAP.', categoria: 'Perfumería', formato: '90 ml', precio: '34,17 €' },
        { nombre: 'SAPHIR ESTUCHE MINI DUPLO 200+30 ML.PERFECT WOMAN', categoria: 'Perfumería', formato: 'Estuche', precio: '13,02 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Para hombre, formato estuche', nombre: 'SAPHIR ESTUCHE MINI DUPLO 200+30 ML.PERFECT MAN', precio: '13,02 €' },
        { etiqueta: 'Colonia unisex clásica', nombre: 'ALVAREZ GOMEZ LATA EDT.300 ML+EMUL.HID.280 ML.', precio: '18,36 €' },
      ],
      relatedSolutions: [],
      seo: {
        title: 'Cómo elegir un perfume o colonia como regalo | Orencio Matas',
        description: 'Guía para acertar con un perfume de regalo: diferencia entre eau de parfum y eau de toilette, estilos seguros y estuches listos para regalar.',
      },
    },

    'elegir-brocha-rodillo-pintar': {
      slug: 'elegir-brocha-rodillo-pintar',
      title: 'Cómo elegir la brocha y el rodillo adecuados para pintar',
      description: 'Guía para elegir el tipo de brocha y de rodillo según la superficie y el acabado que buscas, para conseguir un resultado uniforme sin marcas.',
      category: 'pintura', subcategory: 'Elegir herramientas y consumibles',
      problem: 'elegir_brocha_rodillo',
      objective: 'preparar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '5 min para decidir',
      result: 'La brocha y el rodillo correctos para tu superficie y acabado',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Elegir herramientas y consumibles'],
      materials: [
        { fase: 'Selección', familiaSugerida: 'Brochas y rodillos', items: ['Brocha', 'Rodillo'] },
      ],
      receta: [
        { fase: 'Elegir la brocha', emoji: '🖌️' },
        { fase: 'Elegir el rodillo', emoji: '🎨' },
        { fase: 'Combinar ambos', emoji: '🤝' },
      ],
      steps: [
        { n: 1, title: 'Brocha para remates, rincones y superficies pequeñas', text: 'Usa brocha en marcos, esquinas, radiadores o superficies irregulares donde el rodillo no llega bien — el número de la brocha indica su anchura, más número, más ancha.', productos: ['Brocha'] },
        { n: 2, title: 'Rodillo de pelo corto para superficies lisas', text: 'En paredes lisas, muebles o metal, un rodillo de pelo corto (espuma o microfibra corta) da un acabado fino, sin apenas textura.', productos: ['Rodillo'] },
        { n: 3, title: 'Rodillo de pelo medio o largo para superficies rugosas', text: 'En gotelé, fachadas o superficies con textura, un rodillo de pelo medio o largo (fibra o lana) llega bien a los huecos y cubre mejor ese tipo de acabado.', productos: [] },
        { n: 4, title: 'Combinar brocha y rodillo en el mismo trabajo', text: 'Lo habitual es empezar por los bordes y rincones con brocha ("cortar" el perímetro) y después rellenar el resto de la superficie con rodillo — así el acabado queda uniforme en toda la pared.', productos: ['Brocha', 'Rodillo'] },
      ],
      professionalTips: [
        'Una brocha o rodillo de mala calidad suelta pelo/pelusa sobre la pintura fresca — no siempre compensa ahorrar en la herramienta si vas a estropear el acabado.',
        'Humedece ligeramente una brocha o rodillo nuevo antes de usarlo con pintura al agua — ayuda a que suelte menos pelusa en las primeras pasadas.',
      ],
      commonMistakes: [
        'Usar un rodillo de pelo largo en una superficie lisa, dejando textura de "piel de naranja" no deseada.',
        'Cargar demasiada pintura en la brocha o el rodillo, provocando goteos y marcas.',
        'No limpiar bien la herramienta entre usos, endureciendo las cerdas o el pelo.',
      ],
      recommendedProducts: [
        { nombre: 'BROCHA PRENSADA ESSENTIAL COMPETIDOR S-10 Nº 10', categoria: 'Herramientas', formato: 'Nº 10', precio: '3,74 €' },
        { nombre: 'RODILLO ESP/FACHADAS SUPER FELPON 22 CMS.', categoria: 'Herramientas', formato: '22 cm', precio: '7,88 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Brocha más ancha', nombre: 'BROCHA PRENSADA REDONDA C/COLG.Nº12 TINAJERO', precio: '5,66 €' },
        { etiqueta: 'Rodillo para superficie lisa', nombre: 'RODILLO ESP.FACHADAS NESPOLI 22 CMS.FIBROR VERDE', precio: '6,40 €' },
      ],
      // Selector interactivo: el usuario elige la superficie y se le
      // muestra el rodillo real del catálogo más adecuado para ella, en
      // vez de tener que deducirlo leyendo la explicación general de los
      // pasos de arriba. Cada "nombre" está verificado contra el
      // catálogo real (data/productos.json) antes de escribirlo aquí.
      selectorSuperficie: {
        pregunta: '¿Sobre qué superficie vas a pintar?',
        opciones: [
          { id: 'pared_lisa', label: 'Pared lisa (interior)', nombre: 'RECAMBIO RODILLO VELOUR 11 CMS.', motivo: 'Pelo corto tipo velour: ofrece un acabado fino y uniforme, sin apenas textura — ideal para paredes lisas.' },
          { id: 'gotele', label: 'Gotelé o pared con textura', nombre: 'RODILLO TRILOX LANA NATURAL 22 CMS.', motivo: 'Pelo largo de lana natural: llega bien dentro de los huecos del gotelé sin dejar zonas sin cubrir.' },
          { id: 'fachada', label: 'Fachada o exterior', nombre: 'RODILLO FIBROR BICOLOR ESPECIAL FACHADAS 22 CMS.', motivo: 'Pensado específicamente para la porosidad y el tacto rugoso de una fachada.' },
          { id: 'suelo', label: 'Suelo', nombre: 'RECAMBIO RODILLO ESPECIAL SUELOS 45 CMS.PENTRILO', motivo: 'Formato ancho (45 cm) para cubrir más superficie de suelo en cada pasada.' },
          { id: 'techos_altura', label: 'Techos o zonas altas', nombre: 'RODILLO ANTIGOTA SUPER 60 22 CMS.M/BIM.RF.71580', motivo: 'Diseño antigota: reduce las salpicaduras al trabajar por encima de la cabeza.' },
          { id: 'verjas', label: 'Verjas o superficies estrechas', nombre: 'RODILLO MINI ESPECIAL VERJAS PENTRILO RF.07665', motivo: 'Formato mini, pensado para barrotes y perfiles estrechos donde un rodillo normal no entra bien.' },
        ],
      },
      relatedSolutions: ['pintar-pared-interior', 'solucionar-problemas-pintura-aplicacion', 'pintar-metal-antioxidante-interior-exterior', 'pintar-techo-pasta-temple'],
      seo: {
        title: 'Cómo elegir la brocha y el rodillo adecuados para pintar | Orencio Matas',
        description: 'Guía para elegir brocha y rodillo según la superficie y el acabado, y cómo combinarlos para un resultado uniforme.',
      },
    },

    'elegir-cinta-papel-enmascarar': {
      slug: 'elegir-cinta-papel-enmascarar',
      title: 'Cómo elegir la cinta y el papel de enmascarar antes de pintar',
      description: 'Guía para elegir la cinta de carrocero, el papel y el film de enmascarado adecuados para proteger lo que no quieres pintar, tanto en casa como en el taller.',
      category: 'coche', subcategory: 'Preparación y enmascarado',
      problem: 'elegir_cinta_enmascarar',
      objective: 'preparar',
      surface: 'coche',
      difficulty: 'Fácil',
      estimatedTime: '10-20 min de enmascarado',
      result: 'Zonas protegidas correctamente, con un corte de pintura limpio y sin que se cuele producto por debajo',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Preparación y enmascarado'],
      materials: [
        { fase: 'Enmascarado', familiaSugerida: 'Productos de enmascarado', items: ['Cinta de carrocero', 'Papel o film de enmascarar'] },
      ],
      receta: [
        { fase: 'Elegir la cinta', emoji: '🎗️' },
        { fase: 'Elegir el papel/film', emoji: '📄' },
        { fase: 'Enmascarar',   emoji: '🚗' },
      ],
      steps: [
        { n: 1, title: 'Elegir la cinta según la precisión que necesitas', text: 'Para un corte de pintura muy fino y preciso (perfiles, molduras), usa una cinta fina de calidad. Para zonas más amplias, una cinta estándar de carrocero es suficiente.', productos: ['Cinta de carrocero'] },
        { n: 2, title: 'Papel para superficies planas grandes', text: 'El papel (a veces ya combinado con cinta en el mismo rollo) es la opción habitual para cubrir paneles de carrocería, cristales o muebles antes de pintar con pistola.', productos: ['Papel o film de enmascarar'] },
        { n: 3, title: 'Film plástico para zonas amplias o irregulares', text: 'El film se adapta mejor a formas irregulares y grandes superficies (ruedas, asientos, el resto del vehículo) que no vas a pintar pero necesitas proteger del polvo y las salpicaduras.', productos: [] },
        { n: 4, title: 'Aplicar bien pegado, sin arrugas ni huecos', text: 'Presiona bien el borde de la cinta para que quede totalmente adherido — cualquier hueco o arruga deja pasar pintura por debajo, estropeando el corte limpio que buscas.', productos: [] },
      ],
      professionalTips: [
        'Retira la cinta de enmascarar cuando la pintura esté seca al tacto pero no del todo curada — retirarla demasiado tarde puede levantar pintura por el borde.',
        'En trabajos con pistola, una cinta de mala calidad puede dejar pasar disolvente por debajo — para trabajos serios compensa una cinta específica de carrocero.',
      ],
      commonMistakes: [
        'Usar cinta de pintor doméstica para trabajos con pistola de pintar (deja pasar producto).',
        'No presionar bien el borde de la cinta antes de pintar.',
        'Dejar la cinta puesta demasiados días, dificultando su retirada limpia.',
      ],
      recommendedProducts: [
        { nombre: '.CINTA FINA NARANJA ZAPHIRO 18MM X 50M', categoria: 'Talleres', formato: '18mm x 50m', precio: '3,44 €' },
        { nombre: '.PAPEL ENMASCARAR ZAPHIRO PREMIUM 110 CM X 300 M.', categoria: 'Talleres', formato: '110cm x 300m', precio: '51,81 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Film con cinta incorporada', nombre: '.FILM CON CINTA ZAPHIRO GOLD 25 YR.x120 CM.', precio: '3,07 €' },
        { etiqueta: 'Cinta de perfilar de precisión', nombre: '.CINTA PERFILAR BESA 12 MM. X 55 M.', precio: '11,53 €' },
      ],
      // Selector interactivo: elige qué va a proteger y se le muestra el
      // producto real más adecuado para esa zona concreta.
      selectorSuperficie: {
        pregunta: '¿Qué vas a proteger?',
        opciones: [
          { id: 'perfiles', label: 'Perfiles, molduras o un corte muy preciso', nombre: '.CINTA PERFILAR BESA 12 MM. X 55 M.', motivo: 'Cinta estrecha de precisión: pensada para conseguir un corte de pintura muy limpio en perfiles y molduras.' },
          { id: 'paneles', label: 'Paneles de carrocería o superficies planas grandes', nombre: '.PAPEL ENMASCARAR ZAPHIRO PREMIUM 110 CM X 300 M.', motivo: 'Papel ancho, la opción habitual para cubrir superficies planas grandes al pintar con pistola.' },
          { id: 'irregular', label: 'El resto del vehículo o una zona irregular', nombre: '.FILM CON CINTA ZAPHIRO GOLD 25 YR.x120 CM.', motivo: 'El film se adapta mejor que el papel a formas irregulares, y ya lleva la cinta incorporada.' },
        ],
      },
      relatedSolutions: ['pintar-plastico-coche', 'elegir-pistola-pintar', 'pintar-metal-antioxidante-interior-exterior', 'pintar-techo-pasta-temple'],
      seo: {
        title: 'Cómo elegir la cinta y el papel de enmascarar antes de pintar | Orencio Matas',
        description: 'Guía para elegir cinta de carrocero, papel y film de enmascarado para proteger correctamente antes de pintar.',
      },
    },

    'eliminar-hologramas-pulido': {
      slug: 'eliminar-hologramas-pulido',
      title: 'Cómo eliminar hologramas y marcas de pulido en la carrocería',
      description: 'Corrige los hologramas o remolinos que quedan tras pulir la carrocería, con un pulimento fino y la técnica adecuada para recuperar un brillo uniforme.',
      category: 'coche', subcategory: 'Pulido y acabado',
      problem: 'hologramas_pulido',
      objective: 'pulir',
      surface: 'coche',
      difficulty: 'Media',
      estimatedTime: '30-60 min por panel',
      result: 'Brillo uniforme, sin remolinos ni marcas visibles bajo el sol',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Pulido y acabado'],
      materials: [
        { fase: 'Pulido fino',  familiaSugerida: 'Pulimentos',       items: ['Pulimento fino (paso 2)'] },
        { fase: 'Aplicación',   familiaSugerida: 'Boinas de pulido', items: ['Boina de pulido fina'] },
        { fase: 'Protección',   familiaSugerida: 'Ceras y selladores', items: ['Cera o sellador de protección'] },
      ],
      receta: [
        { fase: 'Diagnosticar', emoji: '🔍' },
        { fase: 'Pulido fino', emoji: '✨' },
        { fase: 'Repasar',    emoji: '🔄' },
        { fase: 'Proteger',   emoji: '🛡️' },
      ],
      steps: [
        { n: 1, title: 'Confirmar que son hologramas y no arañazos profundos', text: 'Los hologramas se ven como remolinos o círculos concéntricos bajo luz directa, y afectan solo a la capa de barniz más superficial — a diferencia de un arañazo, no se nota al pasar la uña.', productos: [] },
        { n: 2, title: 'Aplicar un pulimento fino con boina fina', text: 'Usa una boina de pulido fina (no la de corte agresivo que probablemente causó los hologramas) con un pulimento de acabado — trabaja por paneles pequeños, sin presionar en exceso.', productos: ['Pulimento fino (paso 2)', 'Boina de pulido fina'] },
        { n: 3, title: 'Trabajar con pasadas cruzadas y velocidad baja-media', text: 'Alterna la dirección de las pasadas (horizontal y vertical) y evita la velocidad máxima de la pulidora — es precisamente el exceso de velocidad y presión lo que suele generar hologramas nuevos.', productos: [] },
        { n: 4, title: 'Revisar bajo luz directa antes de dar por terminado', text: 'Comprueba el resultado con luz de sol o una lámpora potente en ángulo — es la única forma fiable de ver si los hologramas han desaparecido del todo.', productos: [] },
        { n: 5, title: 'Proteger el resultado con cera o sellador', text: 'Aplica una cera o sellador de protección al terminar — además de dar brillo, protege la capa de barniz recién pulida.', productos: ['Cera o sellador de protección'] },
      ],
      professionalTips: [
        'Los hologramas suelen ser el resultado de pulir con un paso de corte demasiado agresivo y no terminar con un paso fino de acabado — pulir siempre en pasos, de más agresivo a más fino, nunca al revés.',
        'Una boina sucia o saturada de producto reseco puede generar hologramas nuevos — límpiala o cámbiala entre paneles si es necesario.',
      ],
      commonMistakes: [
        'Usar solo un pulimento de corte agresivo sin terminar con un paso fino.',
        'Trabajar siempre en la misma dirección con la pulidora.',
        'Pulir a máxima velocidad y con demasiada presión.',
        'No revisar el resultado con luz directa antes de dar el trabajo por terminado.',
      ],
      recommendedProducts: [
        { nombre: '.PULIMENTO FINO ZAPHIRO (PASO 2) SATURNO 1 L.', categoria: 'Talleres', formato: '1 L', precio: '35,80 €' },
        { nombre: '.BOINA PULIDO BODY AMARILLA 806 150 MM.', categoria: 'Talleres', formato: '150 mm', precio: '9,44 €' },
        { nombre: '.PROTECTOR ALTO BRILLO ZAPHIRO WAX 0,5 L.', categoria: 'Talleres', formato: '0,5 L', precio: '15,81 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Boina de alto corte (paso previo)', nombre: '.BOINA BOSSAUTO ALTO CORTE T120 VERDE 150X35MM', precio: '13,92 €' },
        { etiqueta: 'Pulimento fino en formato pequeño', nombre: '.PULIMENTO FINO 807 SEAL POLISH BODY BEIGE 200 ML.', precio: '14,11 €' },
      ],
      relatedSolutions: ['recuperar-brillo-carroceria', 'corregir-marcas-lijado'],
      seo: {
        title: 'Cómo eliminar hologramas y marcas de pulido en la carrocería | Orencio Matas',
        description: 'Guía para corregir hologramas y remolinos tras pulir la carrocería, con pulimento fino y la técnica correcta.',
      },
    },

    'elegir-disolvente-diluir-pintura': {
      slug: 'elegir-disolvente-diluir-pintura',
      title: 'Qué disolvente necesito según el uso',
      description: 'Selector para saber qué disolvente necesitas según lo que vayas a hacer: diluir pintura, limpiar una pistola o herramientas, eliminar pintura seca, o desengrasar.',
      category: 'pintura', subcategory: 'Elegir pintura y disolventes',
      problem: 'elegir_disolvente',
      objective: 'preparar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '5-10 min',
      result: 'Pintura con la fluidez correcta para aplicar, sin perder cubrición ni color',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Elegir pintura y disolventes'],
      materials: [
        { fase: 'Dilución', familiaSugerida: 'Disolventes', items: ['Disolvente universal o aguarrás'] },
      ],
      receta: [
        { fase: 'Identificar el tipo de pintura', emoji: '🎨' },
        { fase: 'Elegir el disolvente', emoji: '🧪' },
        { fase: 'Diluir con medida', emoji: '📏' },
      ],
      steps: [
        { n: 1, title: 'Identificar si la pintura es al agua o al disolvente', text: 'Las pinturas plásticas o al agua se diluyen con agua; las pinturas y esmaltes sintéticos, con aguarrás o disolvente universal — mezclar el tipo equivocado puede cortar la pintura y estropearla.', productos: [] },
        { n: 2, title: 'Elegir el disolvente para pintura sintética', text: 'Un aguarrás sirve para la mayoría de esmaltes sintéticos domésticos; un disolvente universal es una opción más versátil que también sirve para limpiar herramientas.', productos: ['Disolvente universal o aguarrás'] },
        { n: 3, title: 'Diluir poco a poco, sin pasarte', text: 'Añade el disolvente en pequeñas cantidades removiendo bien, comprobando la fluidez cada vez — normalmente no hace falta pasar del 5-10% del volumen de pintura salvo que el envase indique otra cosa.', productos: [] },
        { n: 4, title: 'Comprobar en una zona de prueba', text: 'Aplica una pasada de prueba en una zona poco visible — una pintura demasiado diluida pierde cubrición y puede gotear al aplicarla.', productos: [] },
      ],
      professionalTips: [
        'Diluir de más para "rendir más" es uno de los motivos más habituales de que la pintura no cubra bien — casi siempre sale más caro por tener que dar una mano extra.',
        'Guarda el disolvente sobrante en un envase bien cerrado y etiquetado — pierde propiedades con el tiempo si queda expuesto al aire.',
      ],
      commonMistakes: [
        'Diluir una pintura al agua con disolvente, o una pintura al disolvente con agua.',
        'Diluir más del porcentaje recomendado por el fabricante.',
        'No remover bien tras añadir el disolvente, quedando zonas más diluidas que otras.',
      ],
      recommendedProducts: [
        { nombre: 'DISOLVENTE UNIVERSAL M.P.L.PURO 1 L.', categoria: 'Pintura', formato: '1 L', precio: '3,75 €' },
        { nombre: 'AGUARRAS PINO KELSIA 500 ML.', categoria: 'Pintura', formato: '500 ml', precio: '1,75 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Formato profesional grande', nombre: 'DISOLVENTE UNIVERSAL PROF.C&Q 25 L.', precio: '76,17 €' },
        { etiqueta: 'Disolvente específico epoxi', nombre: 'TITANTECH DX-820 DISOLVENTE EPOXI 5 L.', precio: '43,00 €' },
      ],
      // Selector interactivo: elige para qué lo necesita y se le
      // recomienda el producto real más adecuado a ese uso concreto —
      // no todos los "disolventes" sirven igual de bien para diluir que
      // para limpiar una pistola o desengrasar.
      selectorSuperficie: {
        pregunta: '¿Para qué lo necesitas?',
        opciones: [
          { id: 'diluir_pintura', label: 'Diluir pintura o esmalte sintético', nombre: 'AGUARRAS PINO KELSIA 500 ML.', motivo: 'El aguarrás es la opción habitual para diluir esmaltes sintéticos domésticos sin perjudicar el color ni la cubrición.' },
          { id: 'limpiar_pistola', label: 'Limpiar una pistola de pintar', nombre: 'DILUYENTE TITAN YATE 1 LITRO', motivo: 'Disuelve bien la pintura fresca de dentro de la pistola — imprescindible para que no se seque y obstruya la boquilla.' },
          { id: 'limpiar_herramientas', label: 'Limpiar brochas o rodillos', nombre: 'DISOLVENTE UNIVERSAL M.P.L.PURO 1 L.', motivo: 'Disolvente universal, válido tanto para diluir como para limpiar herramientas manchadas de pintura al disolvente.' },
          { id: 'eliminar_restos', label: 'Eliminar restos de pintura ya seca', nombre: 'TITAN DECAPANTE GEL PROFESIONAL 1 LL.', motivo: 'Un disolvente normal no ablanda pintura ya seca — hace falta un decapante en gel, pensado específicamente para eso.' },
          { id: 'desengrasar', label: 'Desengrasar una superficie', nombre: 'ASEVI DESENGRASANTE 750 ML.PISTOLA', motivo: 'Para grasa, lo adecuado es un desengrasante, no un disolvente de pintura — son productos distintos aunque a veces se confundan.' },
        ],
      },
      relatedSolutions: ['solucionar-problemas-pintura-aplicacion', 'pintar-pared-interior'],
      seo: {
        title: 'Cómo elegir el disolvente y diluir la pintura | Orencio Matas',
        description: 'Guía para elegir disolvente según el tipo de pintura y diluir sin perjudicar la cubrición ni el color.',
      },
    },

    'higiene-personal-cuidado-corporal': {
      slug: 'higiene-personal-cuidado-corporal',
      title: 'Productos de higiene personal y cuidado corporal para el día a día',
      description: 'Selección de productos habituales de higiene y cuidado corporal y facial, para el uso diario en casa.',
      category: 'perfumeria', subcategory: 'Higiene y cuidado personal',
      problem: 'higiene_personal',
      objective: 'limpiar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '5 min para decidir',
      result: 'Los productos de higiene y cuidado adecuados para el uso diario',
      breadcrumb: ['Centro de Soluciones', 'Perfumería y cuidado personal', 'Higiene y cuidado personal'],
      materials: [
        { fase: 'Selección', familiaSugerida: 'Higiene personal', items: ['Gel de ducha o baño', 'Crema corporal o facial'] },
      ],
      receta: [
        { fase: 'Higiene diaria', emoji: '🚿' },
        { fase: 'Hidratación',   emoji: '💧' },
        { fase: 'Cuidado facial', emoji: '🧴' },
      ],
      steps: [
        { n: 1, title: 'Gel de ducha o baño para la higiene diaria', text: 'Elige según el tipo de piel: fórmulas suaves o con avena para pieles sensibles, o gel/champú 2 en 1 para mayor rapidez en el día a día.', productos: ['Gel de ducha o baño'] },
        { n: 2, title: 'Crema corporal para hidratar después de la ducha', text: 'Aplicar crema corporal justo después de la ducha, con la piel aún ligeramente húmeda, ayuda a que se absorba mejor y a retener la hidratación.', productos: ['Crema corporal o facial'] },
        { n: 3, title: 'Cuidado facial específico', text: 'La piel del rostro suele necesitar una crema distinta a la corporal, más ligera o con protección solar según la época del año.', productos: [] },
      ],
      professionalTips: [
        'Las fórmulas con aloe vera o avena son buenas opciones por defecto para pieles sensibles o con tendencia a la sequedad.',
        'Guarda el envase bien cerrado y en un lugar fresco — el calor y el sol directo pueden alterar la fórmula de cremas y geles con el tiempo.',
      ],
      commonMistakes: [
        'Usar crema corporal en el rostro esperando el mismo resultado que una crema facial específica.',
        'No hidratar la piel después de la ducha, cuando mejor se absorbe la crema.',
      ],
      recommendedProducts: [
        { nombre: 'AVENA KINESIA GEL 750 ML.', categoria: 'Perfumería', formato: '750 ml', precio: '2,66 €' },
        { nombre: 'INST.ESPAÑOL CREMA CORPORAL 400 ML.CREMOSO M/KARIT', categoria: 'Perfumería', formato: '400 ml', precio: '3,23 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Gel 2 en 1 con champú', nombre: 'DENENES GEL/CHAMPU 600 ML.SUEÑOS FELICES', precio: '3,40 €' },
        { etiqueta: 'Crema corporal con aloe vera', nombre: 'INST.ESPAÑOL CREMA CORPORAL 400 ML.ALOE VERA', precio: '3,05 €' },
      ],
      relatedSolutions: ['perfumeria-elegir-fragancia-regalo'],
      seo: {
        title: 'Higiene personal y cuidado corporal | Orencio Matas',
        description: 'Selección de gel de ducha, crema corporal y cuidado facial para la higiene y el cuidado diario.',
      },
    },

    'preparar-pieza-taller-antes-pintar': {
      slug: 'preparar-pieza-taller-antes-pintar',
      title: 'Cómo preparar una pieza en el taller antes de pintarla',
      description: 'Los pasos de preparación de una pieza de carrocería antes de pintarla: desengrasado, lijado e imprimación, para que la pintura se agarre bien y el acabado quede uniforme.',
      category: 'coche', subcategory: 'Preparación y enmascarado',
      problem: 'preparar_pieza_taller',
      objective: 'preparar',
      surface: 'coche',
      difficulty: 'Media',
      estimatedTime: '45-90 min según el estado de la pieza',
      result: 'Una pieza lista para pintar, con buena adherencia y sin defectos que luego se vean en la pintura',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Preparación y enmascarado'],
      materials: [
        { fase: 'Desengrasado', familiaSugerida: 'Desengrasantes',       items: ['Desengrasante'] },
        { fase: 'Lijado',       familiaSugerida: 'Abrasivos',            items: ['Lija de grano medio'] },
        { fase: 'Imprimación',  familiaSugerida: 'Aparejos/imprimaciones', items: ['Imprimación'] },
      ],
      receta: [
        { fase: 'Desengrasar', emoji: '🧴' },
        { fase: 'Lijar',       emoji: '🖐️' },
        { fase: 'Limpiar el polvo', emoji: '🧹' },
        { fase: 'Imprimar',    emoji: '🎨' },
      ],
      steps: [
        { n: 1, title: 'Desengrasar la pieza', text: 'Antes de lijar, desengrasa toda la superficie — si lijas sobre grasa, la extiendes en vez de eliminarla, y queda metida en los poros de la superficie.', productos: ['Desengrasante'] },
        { n: 2, title: 'Lijar con el grano adecuado', text: 'Lija toda la zona a pintar con un grano medio (100-180) para crear un anclaje uniforme — si hay pintura vieja en mal estado, óxido o masilla, empieza con un grano más bajo antes de pasar al medio.', productos: ['Lija de grano medio'] },
        { n: 3, title: 'Limpiar el polvo antes de imprimar', text: 'Retira todo el polvo del lijado con aire comprimido y un paño antiestático — cualquier resto de polvo queda atrapado bajo la imprimación y se nota en el acabado final.', productos: [] },
        { n: 4, title: 'Aplicar la imprimación', text: 'Aplica una imprimación adecuada al material de la pieza (metal o plástico) — mejora la adherencia de la pintura y, en el caso de piezas metálicas, protege frente al óxido.', productos: ['Imprimación'] },
        { n: 5, title: 'Enmascarar antes de pintar', text: 'Con la pieza ya imprimada, protege lo que no se va a pintar con cinta y papel o film antes de aplicar el color.', productos: [] },
      ],
      professionalTips: [
        'Nunca desengrases con un trapo cualquiera reutilizado — puede volver a depositar grasa en vez de retirarla. Usa un paño limpio cada vez.',
        'Deja secar bien la imprimación el tiempo indicado por el fabricante antes de pintar — pintar sobre imprimación aún fresca puede levantar o craquelar la pintura.',
      ],
      commonMistakes: [
        'Lijar sobre grasa sin desengrasar antes.',
        'No limpiar el polvo del lijado antes de imprimar.',
        'Pintar sobre la imprimación antes de que esté completamente seca.',
        'Usar una imprimación no adecuada al material de la pieza (metal/plástico).',
      ],
      recommendedProducts: [
        { nombre: 'ASEVI DESENGRASANTE 750 ML.PISTOLA', categoria: 'Limpieza', formato: '750 ml', precio: '2,14 €' },
        { nombre: '.AK SPRAY IMPRIMACION ZINC-ALU 400 ML. 233057', categoria: 'Talleres', formato: '400 ml', precio: '11,39 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Imprimación específica para plástico', nombre: '.R-M IMPRIMACION PLASTICOS PM2A20 SPRAY 0,4 L.', precio: '65,62 €' },
        { etiqueta: 'Desengrasante de mayor concentración', nombre: 'VOLGRASSS DESENGRASANTE 1 L.PISTOLA', precio: '2,86 €' },
      ],
      relatedSolutions: ['elegir-lija-grano-abrasivo', 'elegir-cinta-papel-enmascarar', 'eliminar-oxido-metal'],
      seo: {
        title: 'Cómo preparar una pieza en el taller antes de pintarla | Orencio Matas',
        description: 'Pasos de preparación de una pieza de carrocería antes de pintar: desengrasado, lijado e imprimación para una buena adherencia.',
      },
    },

    'problemas-pulverizacion-pistola': {
      slug: 'problemas-pulverizacion-pistola',
      title: 'Por qué la pistola de pintar no pulveriza bien o no cubre',
      description: 'Diagnóstico de los problemas más habituales al pintar con pistola — mala pulverización, chorreo, cobertura irregular — y cómo solucionarlos.',
      category: 'coche', subcategory: 'Herramientas de pintor',
      problem: 'problemas_pulverizacion',
      objective: 'reparar',
      surface: 'coche',
      difficulty: 'Media',
      estimatedTime: '15-30 min de diagnóstico',
      result: 'Una pulverización uniforme y una cobertura correcta con la pistola',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Herramientas de pintor'],
      materials: [
        { fase: 'Limpieza',  familiaSugerida: 'Diluyentes',      items: ['Diluyente para limpiar la pistola'] },
        { fase: 'Filtrado',  familiaSugerida: 'Filtros y consumibles', items: ['Filtro de pintura'] },
      ],
      receta: [
        { fase: 'Diagnosticar', emoji: '🔍' },
        { fase: 'Limpiar la pistola', emoji: '🧴' },
        { fase: 'Ajustar',    emoji: '🔧' },
        { fase: 'Probar',     emoji: '🎯' },
      ],
      steps: [
        { n: 1, title: 'Si la pulverización sale irregular o "escupe"', text: 'Casi siempre es una boquilla sucia o parcialmente obstruida, o pintura sin colar con alguna partícula atascada — limpia bien la pistola y cuela siempre la pintura antes de cargarla.', productos: ['Filtro de pintura'] },
        { n: 2, title: 'Si la pintura sale muy espesa o a chorro', text: 'Revisa la dilución (puede que esté demasiado espesa) y el ajuste del gatillo/aguja de la pistola — una apertura excesiva satura la superficie y provoca chorreo.', productos: [] },
        { n: 3, title: 'Si la cobertura queda irregular o "en bandas"', text: 'Comprueba la distancia y el ángulo respecto a la pieza (lo habitual es mantener la pistola perpendicular, a una distancia constante) y solapa cada pasada sobre la mitad de la anterior.', productos: [] },
        { n: 4, title: 'Limpiar la pistola a fondo tras cada uso', text: 'Desmonta y limpia bien la pistola con diluyente al terminar — la pintura seca acumulada en la boquilla o el conducto es la causa más habitual de que, la próxima vez, no pulverice bien desde el principio.', productos: ['Diluyente para limpiar la pistola'] },
        { n: 5, title: 'Hacer una prueba antes de pintar la pieza definitiva', text: 'Prueba siempre sobre un cartón o una zona de descarte antes de pintar la pieza real — así detectas cualquier problema de pulverización sin arriesgar el trabajo final.', productos: [] },
      ],
      professionalTips: [
        'La presión de aire incorrecta es una causa muy habitual de mala pulverización — demasiado baja da un acabado grumoso, demasiado alta genera niebla y desperdicia producto.',
        'Guarda la pistola limpia y con las juntas humedecidas con un poco de aceite específico — evita que se resequen y pierdan estanqueidad.',
      ],
      commonMistakes: [
        'No colar la pintura antes de cargar la pistola.',
        'No limpiar la pistola a fondo justo después de usarla.',
        'Trabajar demasiado cerca o demasiado lejos de la pieza.',
        'No hacer una prueba previa antes de pintar la pieza definitiva.',
      ],
      recommendedProducts: [
        { nombre: '.FILTRO BRONCE POROSO SAGOLA', categoria: 'Talleres', formato: 'Unidad', precio: '24,18 €' },
        { nombre: 'DILUYENTE TITAN YATE 1 LITRO', categoria: 'Pintura', formato: '1 L', precio: '18,16 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Vaso de recambio para pistola', nombre: '.VASO PLASTICO COLAD 700 ML S/TAPA 9370300', precio: '0,50 €' },
      ],
      relatedSolutions: ['elegir-pistola-pintar', 'preparar-pieza-taller-antes-pintar'],
      seo: {
        title: 'Por qué la pistola de pintar no pulveriza bien o no cubre | Orencio Matas',
        description: 'Diagnóstico de problemas al pintar con pistola: mala pulverización, chorreo y cobertura irregular, y cómo solucionarlos.',
      },
    },

    'proteger-acabado-pintura-nueva': {
      slug: 'proteger-acabado-pintura-nueva',
      title: 'Cómo proteger el acabado después de pintar una pieza',
      description: 'Protege el trabajo recién pintado con laca de acabado y cera, y respeta los tiempos de curado para que el resultado dure y mantenga el brillo.',
      category: 'coche', subcategory: 'Pulido y acabado',
      problem: 'proteger_acabado',
      objective: 'proteger',
      surface: 'coche',
      difficulty: 'Fácil',
      estimatedTime: '20-30 min + tiempo de curado',
      result: 'Un acabado protegido, con brillo uniforme y mayor duración frente al desgaste diario',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Pulido y acabado'],
      materials: [
        { fase: 'Acabado',   familiaSugerida: 'Lacas',   items: ['Laca de acabado'] },
        { fase: 'Protección', familiaSugerida: 'Ceras y selladores', items: ['Cera o sellador de protección'] },
      ],
      receta: [
        { fase: 'Dejar secar el color', emoji: '⏱️' },
        { fase: 'Aplicar la laca', emoji: '✨' },
        { fase: 'Dejar curar', emoji: '🌡️' },
        { fase: 'Proteger con cera', emoji: '🛡️' },
      ],
      steps: [
        { n: 1, title: 'Dejar secar el color antes de la laca', text: 'Respeta el tiempo de secado entre la mano de color y la laca de acabado que indique la ficha técnica del producto — aplicar la laca demasiado pronto puede levantar el color de debajo.', productos: [] },
        { n: 2, title: 'Aplicar la laca de acabado', text: 'La laca protege el color frente a rayaduras leves, rayos UV e intemperie, además de dar el brillo final — aplícala en 2 manos finas, igual que el resto de la pintura.', productos: ['Laca de acabado'] },
        { n: 3, title: 'Respetar el tiempo de curado', text: 'La laca puede estar seca al tacto en pocas horas pero seguir curando varios días — evita lavar la pieza o exponerla a productos químicos hasta que haya curado del todo.', productos: [] },
        { n: 4, title: 'Proteger con cera una vez curado', text: 'Cuando el curado esté completo, una cera o sellador de protección añade una capa extra de brillo y protege la laca frente al desgaste diario.', productos: ['Cera o sellador de protección'] },
      ],
      professionalTips: [
        'La temperatura ambiente afecta mucho al tiempo de curado real — en días fríos, cuenta con bastante más tiempo del indicado en condiciones estándar de laboratorio.',
        'No apliques cera antes de que la laca haya curado del todo — puede quedar atrapada humedad o disolvente bajo la capa de cera.',
      ],
      commonMistakes: [
        'Aplicar la laca sin dejar secar bien la mano de color.',
        'Lavar o encerar la pieza antes de que la laca haya curado por completo.',
        'Aplicar la cera en una sola capa gruesa en vez de una fina y uniforme.',
      ],
      recommendedProducts: [
        { nombre: '.P-C-92 LACA MATE 0,75 L. 2:1', categoria: 'Talleres', formato: '0,75 L', precio: '128,64 €' },
        { nombre: '.PROTECTOR ALTO BRILLO ZAPHIRO WAX 0,5 L.', categoria: 'Talleres', formato: '0,5 L', precio: '15,81 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Laca de secado rápido', nombre: '.A-C-10 LACA ECO BALANCE SECADO RAPIDO 1 L. 3:1:1', precio: '168,63 €' },
      ],
      relatedSolutions: ['eliminar-hologramas-pulido', 'recuperar-brillo-carroceria'],
      seo: {
        title: 'Cómo proteger el acabado después de pintar una pieza | Orencio Matas',
        description: 'Guía para proteger una pieza recién pintada con laca de acabado y cera, respetando los tiempos de curado.',
      },
    },

    'elegir-acabado-pintura-mate-satinado-brillante': {
      slug: 'elegir-acabado-pintura-mate-satinado-brillante',
      title: 'Cómo elegir entre pintura mate, satinada o brillante',
      description: 'Diferencias entre acabado mate, satinado y brillante, y qué pintura real elegir según el efecto y la resistencia a la limpieza que buscas.',
      category: 'pintura', subcategory: 'Elegir pintura y disolventes',
      problem: 'elegir_acabado_pintura',
      objective: 'preparar',
      surface: 'pared',
      difficulty: 'Fácil',
      estimatedTime: '5 min para decidir',
      result: 'El acabado correcto para tu espacio, según el efecto visual y el uso que le vayas a dar',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Elegir pintura y disolventes'],
      materials: [
        { fase: 'Selección', familiaSugerida: 'Pintura', items: ['Pintura del acabado elegido'] },
      ],
      receta: [
        { fase: 'Mate', emoji: '⬜' },
        { fase: 'Satinado', emoji: '◻️' },
        { fase: 'Brillante', emoji: '✨' },
      ],
      steps: [
        { n: 1, title: 'Mate: disimula imperfecciones', text: 'El acabado mate absorbe la luz y disimula mejor las pequeñas imperfecciones de la pared — buena opción por defecto para techos y paredes en mal estado. Se ensucia con más facilidad y es algo más difícil de limpiar sin marca.', productos: [] },
        { n: 2, title: 'Satinado: equilibrio entre estética y limpieza', text: 'Un punto intermedio: algo más resistente a la limpieza que el mate, sin llegar al brillo del esmalte — habitual en cocinas, baños y zonas de más tránsito.', productos: [] },
        { n: 3, title: 'Brillante: máxima resistencia y reflejo', text: 'El acabado brillante es el más resistente a la limpieza y a los golpes, pero también el que más resalta cualquier imperfección de la superficie — típico en carpintería, puertas o mobiliario más que en paredes grandes.', productos: [] },
      ],
      professionalTips: [
        'Cuanto más brillo tiene un acabado, más se nota cualquier defecto de la superficie — si la pared no está perfecta, un acabado mate disimula mucho mejor que uno brillante.',
        'En zonas húmedas o de mucho uso (cocina, baño, pasillos), un satinado o brillante aguanta mejor la limpieza frecuente que un mate.',
      ],
      commonMistakes: [
        'Elegir brillante en una pared con muchas imperfecciones, que quedan más a la vista.',
        'Elegir mate en una zona de mucho tránsito o salpicaduras, que luego cuesta más limpiar.',
      ],
      recommendedProducts: [
        { nombre: 'PINT.VINILICA P-50 EXTRA MATE 1 L.BLANCA', categoria: 'Pintura', formato: '1 L', precio: '6,30 €' },
        { nombre: 'PINT.VINILICA P-40 PREMIUM 1 L.SATIN.BLANCO', categoria: 'Pintura', formato: '1 L', precio: '7,66 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Acabado brillante con poliuretano', nombre: 'COLORLUX BRILLANTE C/POLIURET.4 L.BLANCO', precio: '48,38 €' },
      ],
      // Selector interactivo: elige el efecto/uso que buscas y se le
      // recomienda la pintura real del acabado correspondiente.
      selectorSuperficie: {
        pregunta: '¿Qué buscas para tu pared?',
        opciones: [
          { id: 'disimular', label: 'Disimular imperfecciones (techos, paredes en mal estado)', nombre: 'PINT.VINILICA P-50 EXTRA MATE 1 L.BLANCA', motivo: 'El acabado mate absorbe la luz y disimula mejor las pequeñas imperfecciones de la superficie.' },
          { id: 'equilibrio', label: 'Equilibrio entre estética y facilidad de limpieza', nombre: 'PINT.VINILICA P-40 PREMIUM 1 L.SATIN.BLANCO', motivo: 'El satinado es más fácil de limpiar que el mate, sin llegar al reflejo del brillante — habitual en cocinas y baños.' },
          { id: 'resistencia', label: 'Máxima resistencia a la limpieza y a los golpes', nombre: 'COLORLUX BRILLANTE C/POLIURET.4 L.BLANCO', motivo: 'El brillante con poliuretano es el acabado más resistente a la limpieza frecuente y a los golpes.' },
        ],
      },
      relatedSolutions: ['pintar-pared-interior', 'elegir-disolvente-diluir-pintura'],
      seo: {
        title: 'Cómo elegir entre pintura mate, satinada o brillante | Orencio Matas',
        description: 'Diferencias entre acabado mate, satinado y brillante, y qué pintura elegir según el efecto y la resistencia a la limpieza.',
      },
    },

    'limpieza-profesional-hosteleria-empresas': {
      slug: 'limpieza-profesional-hosteleria-empresas',
      title: 'Consumibles de limpieza para hostelería y empresas',
      description: 'Selección de consumibles de limpieza para uso profesional — hostelería, oficinas y comercios — pensados para un uso más intensivo que el doméstico.',
      category: 'limpieza', subcategory: 'Limpieza profesional',
      problem: 'limpieza_profesional',
      objective: 'limpiar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '10 min para decidir',
      result: 'Los consumibles de limpieza adecuados para un uso profesional continuado',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Limpieza profesional'],
      materials: [
        { fase: 'Suelos',    familiaSugerida: 'Mopas',    items: ['Mopa'] },
        { fase: 'Superficies', familiaSugerida: 'Bayetas', items: ['Bayetas o gamuzas'] },
        { fase: 'Higiene',   familiaSugerida: 'Guantes',  items: ['Guantes desechables'] },
      ],
      receta: [
        { fase: 'Suelos',      emoji: '🧹' },
        { fase: 'Superficies', emoji: '🧽' },
        { fase: 'Higiene y desinfección', emoji: '🧴' },
      ],
      steps: [
        { n: 1, title: 'Mopa para suelos de uso continuado', text: 'Una mopa con bastidor y recambio independiente resulta más económica a medio plazo que ir reponiendo la mopa entera cada vez — habitual en locales con mucho tránsito diario.', productos: ['Mopa'] },
        { n: 2, title: 'Bayetas por zonas o por código de color', text: 'En hostelería es habitual usar bayetas de distintos colores para distintas zonas (cocina, baño, sala) y evitar mezclar la limpieza entre ellas — un rollo precortado facilita tener siempre bayetas limpias a mano.', productos: ['Bayetas o gamuzas'] },
        { n: 3, title: 'Guantes desechables para manipulación', text: 'Para tareas de limpieza y manipulación en cocina u hostelería, unos guantes desechables en formato caja facilitan cambiarlos con frecuencia.', productos: ['Guantes desechables'] },
        { n: 4, title: 'Lejía y desinfección de superficies', text: 'Para la desinfección de superficies en contacto con alimentos, una lejía de uso general en formato grande resulta más práctica que ir reponiendo botes pequeños.', productos: [] },
      ],
      professionalTips: [
        'Tener un color de bayeta reservado en exclusiva para cocina/zona de alimentos (y no usarlo en baños) reduce mucho el riesgo de contaminación cruzada.',
        'Comprar guantes y bayetas en formato caja/pack grande suele salir más económico por unidad que reponer en formatos pequeños con frecuencia.',
      ],
      commonMistakes: [
        'Usar la misma bayeta para baño y zona de alimentos.',
        'No renovar los guantes desechables con la frecuencia necesaria.',
        'Comprar en formatos pequeños para un uso de alto consumo diario, encareciendo el coste por unidad.',
      ],
      recommendedProducts: [
        { nombre: 'MOPA CISNE SOFT 75 CMS.C/BASTIDOR REF.203075 AZUL', categoria: 'Limpieza', formato: '75 cm', precio: '11,57 €' },
        { nombre: 'ROLLO BAYETA CISNE MICROPUNT PRECORT.0,40X8 MTS', categoria: 'Limpieza', formato: '0,40x8 m', precio: '5,34 €' },
        { nombre: 'GUANTES EX.VINILO ECO S/POLVO T/XL C/100 UDS.', categoria: 'Limpieza', formato: '100 uds', precio: '3,56 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Guantes de nitrilo', nombre: 'GUANTES JUPITER CENTURION NITRILO NYLON T/8', precio: '1,46 €' },
        { etiqueta: 'Lejía en formato grande', nombre: 'LEJIA ACE 4 L.REGULAR', precio: '3,05 €' },
      ],
      relatedSolutions: ['usar-lejia-segura', 'desinfectar-casa'],
      seo: {
        title: 'Consumibles de limpieza para hostelería y empresas | Orencio Matas',
        description: 'Selección de mopas, bayetas, guantes y desinfección para limpieza profesional en hostelería, oficinas y comercios.',
      },
    },

    'manchas-grietas-antes-pintar': {
      slug: 'manchas-grietas-antes-pintar',
      title: 'Cómo tratar manchas, grietas y agujeros antes de pintar una pared',
      description: 'Rellena agujeros, sella las grietas y trata las manchas (humedad, nicotina, óxido) antes de pintar, para que la pared quede regular y nada de esto vuelva a aparecer a través de la pintura nueva.',
      category: 'pintura', subcategory: 'Problemas al pintar',
      problem: 'manchas_grietas_antes_pintar',
      objective: 'reparar',
      surface: 'pared',
      difficulty: 'Media',
      estimatedTime: '30-90 min + tiempo de secado',
      result: 'Una pared regular, sin manchas, grietas ni agujeros visibles, lista para pintar sin que vuelvan a salir',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Problemas al pintar'],
      materials: [
        { fase: 'Agujeros', familiaSugerida: 'Masillas',        items: ['Masilla acrílica pintable'] },
        { fase: 'Grietas',  familiaSugerida: 'Masillas',        items: ['Masilla tapagrietas'] },
        { fase: 'Manchas',  familiaSugerida: 'Selladores de manchas', items: ['Sellador o pintura antimanchas'] },
      ],
      receta: [
        { fase: 'Identificar', emoji: '🔍' },
        { fase: 'Tapar agujeros', emoji: '🕳️' },
        { fase: 'Reparar grietas', emoji: '🧱' },
        { fase: 'Sellar manchas', emoji: '🎨' },
      ],
      steps: [
        { n: 1, title: 'Tapar agujeros con masilla acrílica pintable', text: 'Para agujeros de tacos, clavos o pequeños desconchones, rellena con una masilla acrílica pintable usando una espátula — en agujeros más profundos, aplica en dos capas dejando secar entre ellas, ya que la masilla se retrae un poco al secar.', productos: ['Masilla acrílica pintable'] },
        { n: 2, title: 'Rellenar las grietas con masilla tapagrietas', text: 'Aplica masilla tapagrietas rellenando bien toda la grieta — igual que con los agujeros, en grietas profundas puede hacer falta una segunda pasada.', productos: ['Masilla tapagrietas'] },
        { n: 3, title: 'Lijar una vez seco todo', text: 'Cuando la masilla esté completamente seca (tanto en agujeros como en grietas), lija la zona para dejarla a ras con el resto de la pared — si pintas sobre masilla sin lijar, se nota el relieve.', productos: [] },
        { n: 4, title: 'Sellar las manchas antes de pintar', text: 'Las manchas de humedad, nicotina, óxido o rotulador NO desaparecen solo con pintar encima — sin un sellador o pintura antimanchas específica, acaban traspasando la pintura nueva al cabo de un tiempo.', productos: ['Sellador o pintura antimanchas'] },
        { n: 5, title: 'Dejar secar antes de pintar el color', text: 'Respeta el tiempo de secado del sellador antimanchas indicado en el envase antes de aplicar la pintura definitiva.', productos: [] },
      ],
      professionalTips: [
        'Si la mancha es de humedad, sella primero la CAUSA de la humedad (una gotera, condensación...) — si no, la mancha puede volver a aparecer aunque hayas sellado bien la superficie.',
        'Un sellador antimanchas en spray es más rápido para manchas puntuales pequeñas; en superficies grandes, aplicarlo con brocha o rodillo cunde más.',
        'Para agujeros muy grandes o profundos, rellena por capas en vez de una sola aplicación gruesa — seca de forma más uniforme y con menos riesgo de que se agriete al secar.',
      ],
      commonMistakes: [
        'Pintar directamente sobre una mancha sin sellarla antes, esperando que la pintura la tape para siempre.',
        'Pintar sobre masilla sin lijarla antes, dejando relieve visible.',
        'No resolver la causa real de una mancha de humedad antes de sellarla.',
        'Rellenar un agujero profundo de una sola vez en vez de por capas.',
      ],
      recommendedProducts: [
        { nombre: 'RUALAIX RX-422 MASILLA ACRYL.PINTABLE 300 GMS.', categoria: 'Pintura', formato: '300 g', precio: '2,29 €' },
        { nombre: 'BAIXENS B-18C MASILLA TAPAGRIETAS CART.310 ML.', categoria: 'Pintura', formato: '310 ml', precio: '1,98 €' },
        { nombre: 'TITAN PINTURA ANTIMANCHAS H24 750 ML.BLANCO MATE', categoria: 'Pintura', formato: '750 ml', precio: '18,25 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Sellador de manchas en spray', nombre: 'XYLAZEL SPRAY ANTIMANCHAS PAREDES/TECHOS 500', precio: '11,35 €' },
        { etiqueta: 'Masilla para exterior', nombre: 'BAIXENS B-33C MASILLA TAPAGRIETAS EXTERIOR CAT.310', precio: '2,99 €' },
        { etiqueta: 'Juego de espátulas para aplicar la masilla', nombre: 'JUEGO ESPATULAS ENMASILLAR WK601560 4 UDS.50-120', precio: '5,08 €' },
      ],
      relatedSolutions: ['solucionar-problemas-pintura-aplicacion', 'pintar-pared-interior'],
      seo: {
        title: 'Cómo tratar manchas, grietas y agujeros antes de pintar | Orencio Matas',
        description: 'Guía para rellenar agujeros, sellar grietas y tratar manchas antes de pintar una pared, evitando que vuelvan a aparecer.',
      },
    },

    'tratar-humedad-interior-pared': {
      slug: 'tratar-humedad-interior-pared',
      title: 'Cómo tratar la humedad de una pared interior',
      description: 'Identifica el tipo de humedad de una pared interior y trátala con el producto adecuado antes de pintar, para que no vuelva a salir la mancha.',
      category: 'pintura', subcategory: 'Humedad y moho',
      problem: 'humedad_interior',
      objective: 'reparar',
      surface: 'pared',
      difficulty: 'Media',
      estimatedTime: '1-2 h + tiempo de secado',
      result: 'Pared seca y tratada, con menos probabilidad de que la mancha vuelva a salir',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Humedad y moho'],
      materials: [
        { fase: 'Secado',    familiaSugerida: 'Deshumidificadores', items: ['Absorbente de humedad'] },
        { fase: 'Tratamiento', familiaSugerida: 'Pinturas antihumedad', items: ['Pintura antihumedad'] },
      ],
      receta: [
        { fase: 'Identificar el origen', emoji: '🔍' },
        { fase: 'Secar la zona', emoji: '💨' },
        { fase: 'Aplicar antihumedad', emoji: '🎨' },
        { fase: 'Pintar',      emoji: '🖌️' },
      ],
      steps: [
        { n: 1, title: 'Diferenciar el tipo de humedad', text: 'La condensación (típica en baños y cocinas mal ventilados) aparece y desaparece con la ventilación; una humedad por filtración o capilaridad deja mancha permanente y no depende de la ventilación diaria — el tratamiento no es el mismo en ambos casos.', productos: [] },
        { n: 2, title: 'Mejorar la ventilación si es condensación', text: 'Si es condensación, ventilar más la estancia y, si es posible, usar un absorbente de humedad ambiental reduce mucho el problema antes de tocar la pared.', productos: ['Absorbente de humedad'] },
        { n: 3, title: 'Dejar secar bien la pared antes de tratarla', text: 'Antes de aplicar cualquier producto, la pared debe estar seca al tacto — tratar sobre una pared aún húmeda reduce mucho la eficacia del producto.', productos: [] },
        { n: 4, title: 'Aplicar una pintura o sellador antihumedad', text: 'Una pintura antihumedad sella la superficie y dificulta que la mancha vuelva a traspasar — aplícala siguiendo las manos indicadas en el envase antes de pintar el color final.', productos: ['Pintura antihumedad'] },
      ],
      professionalTips: [
        'Si la mancha de humedad reaparece al poco tiempo pese a haber tratado la pared, es una señal de que el origen (filtración, capilaridad, una tubería) sigue sin resolverse — ningún producto de pintura soluciona una fuga de agua real.',
        'Ventilar 10-15 minutos al día, aunque haga frío, reduce mucho la condensación en baños y cocinas sin gastar en ningún producto.',
      ],
      commonMistakes: [
        'Aplicar pintura antihumedad sobre una pared todavía húmeda.',
        'Tratar solo la mancha visible sin mejorar la ventilación cuando la causa es condensación.',
        'Confundir una humedad por filtración con condensación y aplicar el tratamiento equivocado.',
      ],
      recommendedProducts: [
        { nombre: 'PINTURA ANTIHUMEDAD KOLMAN 750 ML.', categoria: 'Pintura', formato: '750 ml', precio: '10,93 €' },
        { nombre: 'SECADRY ANTIHUMEDAD 450 GRS.APARATO', categoria: 'Droguería', formato: '450 g', precio: '4,83 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Formato grande de pintura antihumedad', nombre: 'TITAN ANTIHUMEDAD D14 4 L.BLANCO MATE', precio: '47,84 €' },
        { etiqueta: 'Recambio del absorbente de humedad', nombre: 'SECADRY ANTIHUMEDAD 450 GRS.RECAMBIO', precio: '2,86 €' },
      ],
      relatedSolutions: ['eliminar-moho-pared-antes-pintar', 'manchas-grietas-antes-pintar'],
      seo: {
        title: 'Cómo tratar la humedad de una pared interior | Orencio Matas',
        description: 'Guía para identificar el tipo de humedad de una pared interior y tratarla antes de pintar con el producto adecuado.',
      },
    },

    'limpiar-herramientas-maquinaria-pintura': {
      slug: 'limpiar-herramientas-maquinaria-pintura',
      title: 'Cómo limpiar brochas, rodillos y herramientas después de pintar',
      description: 'Limpia correctamente brochas, rodillos y otras herramientas de pintura al terminar el trabajo, para que se puedan reutilizar en vez de tirarlas.',
      category: 'limpieza', subcategory: 'Desengrasado',
      problem: 'limpiar_herramientas',
      objective: 'limpiar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '10-15 min',
      result: 'Herramientas limpias y listas para volver a usarse',
      breadcrumb: ['Centro de Soluciones', 'Limpieza y droguería', 'Desengrasado'],
      materials: [
        { fase: 'Limpieza', familiaSugerida: 'Disolventes', items: ['Disolvente o agua, según el tipo de pintura'] },
        { fase: 'Escurrido', familiaSugerida: 'Útiles de limpieza', items: ['Batidor limpia-rodillos'] },
      ],
      receta: [
        { fase: 'Retirar el exceso', emoji: '🎨' },
        { fase: 'Limpiar',   emoji: '🧴' },
        { fase: 'Escurrir',  emoji: '💧' },
        { fase: 'Secar',     emoji: '☀️' },
      ],
      steps: [
        { n: 1, title: 'Retirar el exceso de pintura antes de limpiar', text: 'Pasa la brocha o el rodillo sobre papel o cartón para retirar la mayor cantidad de pintura posible antes de empezar a limpiar — así gastas mucho menos producto de limpieza.', productos: [] },
        { n: 2, title: 'Limpiar con agua o disolvente según el tipo de pintura', text: 'Si la pintura era al agua (plástica), basta con agua templada y algo de jabón. Si era al disolvente (esmalte sintético), necesitas disolvente o aguarrás — el agua sola no la disuelve.', productos: ['Disolvente o agua, según el tipo de pintura'] },
        { n: 3, title: 'Escurrir bien el rodillo', text: 'Un batidor o clip limpia-rodillos ayuda a escurrir el agua o disolvente sobrante girando la herramienta — deja el rodillo mucho más seco que escurriendo solo con la mano.', productos: ['Batidor limpia-rodillos'] },
        { n: 4, title: 'Dejar secar bien antes de guardar', text: 'Deja secar la brocha o el rodillo al aire antes de guardarlos — guardarlos húmedos favorece que se deformen o les salga moho.', productos: [] },
      ],
      professionalTips: [
        'Peina las cerdas de la brocha con los dedos bajo el grifo hasta que salga el agua limpia — es la forma más fiable de comprobar que ya no queda pintura dentro.',
        'Guarda las brochas colgadas o planas, nunca apoyadas sobre las cerdas — deformarlas acorta mucho su vida útil.',
      ],
      commonMistakes: [
        'Intentar limpiar pintura al disolvente solo con agua.',
        'Guardar las herramientas todavía húmedas.',
        'No retirar el exceso de pintura antes de empezar a limpiar, gastando mucho más producto del necesario.',
      ],
      recommendedProducts: [
        { nombre: 'DISOLVENTE UNIVERSAL M.P.L.PURO 1 L.', categoria: 'Pintura', formato: '1 L', precio: '3,75 €' },
        { nombre: 'BATIDOR Y LIMPIA RODILLOS PENTRILO CLIP 8', categoria: 'Herramientas', formato: 'Unidad', precio: '4,57 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Aguarrás para pintura sintética', nombre: 'AGUARRAS PINO KELSIA 500 ML.', precio: '1,75 €' },
      ],
      relatedSolutions: ['elegir-brocha-rodillo-pintar', 'elegir-disolvente-diluir-pintura'],
      seo: {
        title: 'Cómo limpiar brochas, rodillos y herramientas después de pintar | Orencio Matas',
        description: 'Guía para limpiar correctamente brochas, rodillos y herramientas de pintura tras el trabajo, según el tipo de pintura usada.',
      },
    },

    'elegir-pintura-segun-superficie-metal-madera-exterior': {
      slug: 'elegir-pintura-segun-superficie-metal-madera-exterior',
      title: 'Qué pintura elegir según la superficie: metal, madera o fachada',
      description: 'Selector rápido para saber qué tipo de pintura necesitas según sobre qué vas a pintar — metal con antioxidante, madera con barniz, o fachada exterior con pintura hidrófuga.',
      category: 'pintura', subcategory: 'Elegir pintura y disolventes',
      problem: 'elegir_pintura_superficie',
      objective: 'preparar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '5 min para decidir',
      result: 'La pintura correcta para tu superficie, sin comprar por prueba y error',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Elegir pintura y disolventes'],
      materials: [
        { fase: 'Selección', familiaSugerida: 'Pintura', items: ['Pintura según la superficie'] },
      ],
      receta: [
        { fase: 'Metal',   emoji: '🔩' },
        { fase: 'Madera',  emoji: '🪵' },
        { fase: 'Fachada', emoji: '🧱' },
      ],
      steps: [
        { n: 1, title: 'Metal o hierro: esmalte antioxidante', text: 'Sobre metal o hierro (verjas, barandillas, mobiliario metálico), usa un esmalte con protección antioxidante — muchos son "3 en 1" (imprimación + color + protección en un solo producto), pensados para aplicar directamente incluso sobre algo de óxido superficial.', productos: ['Pintura según la superficie'] },
        { n: 2, title: 'Madera exterior: barniz con protección UV', text: 'En madera de exterior (puertas, ventanas, mobiliario de jardín), un barniz con filtro UV protege también frente al sol, que es lo que más degrada la madera exterior con el tiempo, además de la humedad.', productos: [] },
        { n: 3, title: 'Fachada: pintura hidrófuga transpirable', text: 'En fachadas, una pintura hidrófuga repele el agua de lluvia mientras deja "respirar" el muro (transpirable) — evita que se quede humedad atrapada dentro de la pared.', productos: [] },
      ],
      professionalTips: [
        'En metal con óxido ya visible, retira primero el óxido suelto con un cepillo o lija antes de pintar — el antioxidante frena que avance, pero no sustituye una limpieza previa de lo que ya está muy oxidado.',
        'Un barniz o pintura de exterior con más manos de las mínimas indicadas dura más años sin necesidad de repintar — no compensa ahorrar una mano en superficies muy expuestas al sol o la lluvia.',
      ],
      commonMistakes: [
        'Usar una pintura de interior en una superficie de exterior, que se degrada mucho antes con el sol y la lluvia.',
        'Pintar metal oxidado sin retirar antes el óxido suelto.',
        'Usar un barniz sin filtro UV en madera muy expuesta al sol.',
      ],
      recommendedProducts: [
        { nombre: 'HAMMERITE ESM.LISO HIERRO Y OXIDO 750 ML.BLANCO', categoria: 'Pintura', formato: '750 ml', precio: '17,67 €' },
        { nombre: 'BARNIZ TITAN INTEMP. BRILLO 750 ML.INCOL.', categoria: 'Pintura', formato: '750 ml', precio: '14,13 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Esmalte antioxidante efecto martelé', nombre: 'OXIRON MARTELE 750 ML BLANCO (2966)', precio: '18,39 €' },
        { etiqueta: 'Pintura hidrófuga de fachadas', nombre: 'O.MATAS PINT.HIDRAFUGA FACHADAS 20 L.INVISIBLE', precio: '89,41 €' },
      ],
      // Selector interactivo: elige sobre qué va a pintar y se le
      // recomienda la pintura real correspondiente.
      selectorSuperficie: {
        pregunta: '¿Sobre qué vas a pintar?',
        opciones: [
          { id: 'metal', label: 'Metal o hierro (verjas, barandillas, mobiliario)', nombre: 'HAMMERITE ESM.LISO HIERRO Y OXIDO 750 ML.BLANCO', motivo: 'Esmalte "3 en 1": imprimación, color y protección antioxidante en un solo producto, aplicable incluso sobre algo de óxido superficial.' },
          { id: 'madera_exterior', label: 'Madera de exterior (puertas, ventanas, mobiliario de jardín)', nombre: 'BARNIZ TITAN INTEMP. BRILLO 750 ML.INCOL.', motivo: 'Barniz de intemperie: protege frente al sol y la humedad, las dos causas principales de deterioro de la madera exterior.' },
          { id: 'fachada', label: 'Fachada exterior', nombre: 'O.MATAS PINT.HIDRAFUGA FACHADAS 20 L.INVISIBLE', motivo: 'Pintura hidrófuga: repele el agua de lluvia dejando que el muro siga transpirando, evitando que se quede humedad atrapada dentro.' },
        ],
      },
      relatedSolutions: ['eliminar-oxido-metal', 'proteger-madera-exterior', 'pintar-fachada-exterior', 'pintar-metal-antioxidante-interior-exterior'],
      seo: {
        title: 'Qué pintura elegir según la superficie: metal, madera o fachada | Orencio Matas',
        description: 'Selector para elegir la pintura correcta según la superficie: antioxidante para metal, barniz UV para madera exterior, hidrófuga para fachada.',
      },
    },

    'material-desechable-proteccion-taller': {
      slug: 'material-desechable-proteccion-taller',
      title: 'Material desechable y de protección para trabajar en el taller',
      description: 'Monos desechables, guantes y demás material de protección de un solo uso para trabajar con pintura y productos químicos en el taller.',
      category: 'coche', subcategory: 'Herramientas de pintor',
      problem: 'material_desechable_taller',
      objective: 'preparar',
      surface: 'coche',
      difficulty: 'Fácil',
      estimatedTime: '5 min para decidir',
      result: 'Protección adecuada de un solo uso para trabajar con pintura y productos químicos',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Herramientas de pintor'],
      materials: [
        { fase: 'Protección corporal', familiaSugerida: 'Ropa desechable', items: ['Mono desechable'] },
        { fase: 'Manos',   familiaSugerida: 'Guantes',                items: ['Guantes desechables'] },
      ],
      receta: [
        { fase: 'Cuerpo',  emoji: '🦺' },
        { fase: 'Manos',   emoji: '🧤' },
        { fase: 'Vías respiratorias', emoji: '😷' },
      ],
      steps: [
        { n: 1, title: 'Mono desechable para trabajos con pintura o químicos', text: 'Un mono desechable protege la ropa y la piel de salpicaduras al pintar con pistola o manipular productos químicos — elige la talla adecuada para que no queden zonas sin cubrir en los movimientos.', productos: ['Mono desechable'] },
        { n: 2, title: 'Guantes desechables para manipulación', text: 'Cambia los guantes con frecuencia durante el trabajo — unos guantes rotos o muy sucios ya no protegen igual, y en formato caja siempre tienes recambio a mano.', productos: ['Guantes desechables'] },
        { n: 3, title: 'Protección de vías respiratorias al pulverizar', text: 'Al trabajar con pistola de pintar o disolventes, una mascarilla o careta con el filtro adecuado protege frente a los vapores — no todos los filtros sirven para todos los productos, comprueba que sea el indicado para pintura/disolventes.', productos: [] },
      ],
      professionalTips: [
        'Ten siempre un mono y un par de guantes de repuesto a mano — cambiar de EPI a mitad de un trabajo por tener uno roto es mucho más incómodo que prevenirlo.',
        'Los monos desechables de mayor categoría de protección son algo más caros pero se notan mucho en comodidad y durabilidad durante jornadas largas de trabajo.',
      ],
      commonMistakes: [
        'Reutilizar un mono o guantes desechables varias veces cuando ya están rotos o muy sucios.',
        'No usar protección respiratoria adecuada al pulverizar con pistola.',
        'Comprar una talla de mono demasiado ajustada, que se rompe con los movimientos.',
      ],
      recommendedProducts: [
        { nombre: '.MONO ALTA PROTECC DESECHABLE CAT4/5/6 BOSSAU T-L', categoria: 'Talleres', formato: 'Talla L', precio: '8,71 €' },
        { nombre: 'GUANTES LATEX AZUL EXT.FUERTE  50 UDS.T/M/L/XL', categoria: 'Protección personal', formato: '50 uds', precio: '20,27 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Talla M del mono desechable', nombre: '.MONO ALTA PROTECC DESECHABLE CAT4/5/6 BOSSAU T-M', precio: '8,71 €' },
        { etiqueta: 'Protección respiratoria para pintura', nombre: '.MASCARA PARA PINTURA FFA1P2 REF. 06941', precio: '38,05 €' },
      ],
      // Selector interactivo: elige qué parte necesita proteger y se le
      // recomienda el EPI real correspondiente.
      selectorSuperficie: {
        pregunta: '¿Qué necesitas proteger?',
        opciones: [
          { id: 'cuerpo', label: 'El cuerpo (salpicaduras de pintura o químicos)', nombre: '.MONO ALTA PROTECC DESECHABLE CAT4/5/6 BOSSAU T-L', motivo: 'Mono desechable de alta protección — cubre todo el cuerpo frente a salpicaduras al pintar con pistola o manipular químicos.' },
          { id: 'manos', label: 'Las manos', nombre: 'GUANTES LATEX AZUL EXT.FUERTE  50 UDS.T/M/L/XL', motivo: 'Guantes resistentes de un solo uso, en formato caja para poder cambiarlos con frecuencia.' },
          { id: 'respiratoria', label: 'Las vías respiratorias (al pintar con pistola)', nombre: '.MASCARA PARA PINTURA FFA1P2 REF. 06941', motivo: 'Máscara específica para pintura, con filtro FFA1P2 — protege frente a los vapores del disolvente y la pintura al pulverizar.' },
        ],
      },
      relatedSolutions: ['problemas-pulverizacion-pistola', 'elegir-pistola-pintar'],
      seo: {
        title: 'Material desechable y de protección para trabajar en el taller | Orencio Matas',
        description: 'Guía de monos desechables, guantes y protección respiratoria para trabajar con pintura y productos químicos en el taller.',
      },
    },

    'piscinas-pintar-renovar': {
      slug: 'piscinas-pintar-renovar',
      title: 'Cómo pintar o renovar una piscina',
      description: 'Prepara y pinta el vaso de una piscina con pintura de clorocaucho, o renuévala si la pintura anterior está desprendiéndose, con los productos reales de nuestro catálogo.',
      category: 'piscinas', subcategory: 'Pintar y renovar',
      problem: 'pintar_renovar_piscina',
      objective: 'pintar',
      surface: 'piscina',
      difficulty: 'Media',
      estimatedTime: '1-2 días (incluyendo secados) + vaciado',
      result: 'El vaso de la piscina pintado o renovado, con un acabado uniforme y duradero',
      breadcrumb: ['Centro de Soluciones', 'Piscinas', 'Pintar y renovar'],
      materials: [
        { fase: 'Reparación', familiaSugerida: 'Reparadores de piscina', items: ['Reparador de piscinas'] },
        { fase: 'Pintura',    familiaSugerida: 'Pinturas de piscina',    items: ['Pintura de piscina al clorocaucho'] },
        { fase: 'Dilución',   familiaSugerida: 'Disolventes',            items: ['Disolvente para pintura de piscinas'] },
      ],
      receta: [
        { fase: 'Vaciar y limpiar', emoji: '💧' },
        { fase: 'Reparar',    emoji: '🧱' },
        { fase: 'Pintar',     emoji: '🎨' },
        { fase: 'Curar y llenar', emoji: '⏱️' },
      ],
      steps: [
        { n: 1, title: 'Vaciar y limpiar bien el vaso', text: 'Con la piscina vacía, limpia a fondo el vaso retirando algas, cal e incrustaciones — la pintura nueva no se agarra bien sobre una superficie sucia o con restos de cal.', productos: [] },
        { n: 2, title: 'Reparar grietas o desperfectos', text: 'Si la pintura anterior se está desprendiendo o hay grietas en el vaso, repáralas antes de pintar con un reparador específico de piscinas — pintar directamente sobre una zona dañada no la soluciona, solo la disimula un tiempo.', productos: ['Reparador de piscinas'] },
        { n: 3, title: 'Dejar secar completamente antes de pintar', text: 'El vaso debe estar totalmente seco antes de aplicar la pintura — la humedad residual es una de las causas más habituales de que la pintura de piscina se desprenda después.', productos: [] },
        { n: 4, title: 'Aplicar la pintura de piscina', text: 'Aplica la pintura al clorocaucho en 2 manos, diluyendo según indique el envase con el disolvente específico para pintura de piscinas — no sirve cualquier disolvente genérico.', productos: ['Pintura de piscina al clorocaucho', 'Disolvente para pintura de piscinas'] },
        { n: 5, title: 'Respetar el tiempo de curado antes de llenar', text: 'Deja curar la pintura el tiempo indicado en el envase (normalmente varios días) antes de volver a llenar la piscina — llenarla antes de tiempo puede levantar la pintura recién aplicada.', productos: [] },
      ],
      professionalTips: [
        'Si la pintura anterior se desprende en placas grandes, suele deberse a que se pintó sobre una superficie mal preparada o húmeda la vez anterior — no repitas el mismo error al renovarla.',
        'Elegir el mismo tipo de pintura que ya tenía la piscina (o uno compatible) evita problemas de adherencia entre la pintura vieja y la nueva.',
      ],
      commonMistakes: [
        'Pintar sobre el vaso todavía húmedo.',
        'No reparar grietas o zonas dañadas antes de pintar.',
        'Llenar la piscina antes de que la pintura haya curado del todo.',
        'Usar un disolvente genérico en vez del específico para pintura de piscinas.',
      ],
      recommendedProducts: [
        { nombre: 'GLOBALPOOL P.PISCINAS CLOROCAUCHO 15 L.AZUL', categoria: 'Piscinas', formato: '15 L', precio: '74,81 €' },
        { nombre: 'BAIXENS B-14 REPARADOR PISCINAS PTE.1 KG.', categoria: 'Piscinas', formato: '1 kg', precio: '3,81 €' },
        { nombre: 'DISOLVENTE PISCINAS TOLLENS 1 L.', categoria: 'Piscinas', formato: '1 L', precio: '10,22 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Renovador para piscinas ya pintadas', nombre: 'GLOBALPOOL RENOVA 4 L.BLANCO', precio: '47,18 €' },
        { etiqueta: 'Pintura al agua (más fácil de aplicar)', nombre: 'TOLLENS PINT.PISCINAS BASE AGUA 4 L.AZUL MARINO', precio: '29,67 €' },
        { etiqueta: 'Reparador en formato grande', nombre: 'BAIXENS B-14 REPARADOR PISCINAS SACO 5 KG.', precio: '17,53 €' },
      ],
      relatedSolutions: ['mantenimiento-piscina', 'tratamiento-choque-piscina'],
      seo: {
        title: 'Cómo pintar o renovar una piscina | Orencio Matas',
        description: 'Guía para preparar y pintar el vaso de una piscina con pintura de clorocaucho, o renovarla si la pintura anterior se desprende.',
      },
    },

    'elegir-imprimacion-superficie': {
      slug: 'elegir-imprimacion-superficie',
      title: 'Qué imprimación necesito según la superficie',
      description: 'Selector rápido para saber si necesitas imprimación antes de pintar y cuál, según si vas a pintar metal, madera o plástico.',
      category: 'pintura', subcategory: 'Elegir pintura y disolventes',
      problem: 'elegir_imprimacion',
      objective: 'preparar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '5 min para decidir',
      result: 'La imprimación correcta para tu superficie, o la confirmación de que no la necesitas',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Elegir pintura y disolventes'],
      materials: [
        { fase: 'Selección', familiaSugerida: 'Imprimaciones', items: ['Imprimación según la superficie'] },
      ],
      receta: [
        { fase: '¿La necesito?', emoji: '❓' },
        { fase: 'Metal',   emoji: '🔩' },
        { fase: 'Madera',  emoji: '🪵' },
        { fase: 'Plástico', emoji: '🧴' },
      ],
      steps: [
        { n: 1, title: '¿Siempre hace falta imprimación?', text: 'No siempre — si la superficie ya está pintada, en buen estado y vas a aplicar un color similar, muchas veces puedes pintar directamente. La imprimación se vuelve importante cuando cambias de tipo de superficie, hay material poroso, metal desnudo, o quieres asegurar la máxima adherencia.', productos: [] },
        { n: 2, title: 'Metal o hierro: imprimación antioxidante', text: 'Sobre metal desnudo, una imprimación antioxidante (a menudo en spray) protege frente al óxido además de mejorar el agarre de la pintura — muchos esmaltes para metal ya la llevan incorporada en un solo producto "3 en 1".', productos: ['Imprimación según la superficie'] },
        { n: 3, title: 'Madera o superficies porosas: tapaporos', text: 'En madera nueva o superficies porosas, un tapaporos sella la superficie para que la pintura no se absorba de forma irregular, lo que ayuda a conseguir un color más uniforme.', productos: [] },
        { n: 4, title: 'Plástico: imprimación específica para plástico', text: 'El plástico es una superficie muy lisa donde la pintura normal apenas se agarra — una imprimación específica para plástico es casi imprescindible para que no se despegue con el tiempo.', productos: [] },
      ],
      professionalTips: [
        'En superficies difíciles (muy lisas, brillantes, o donde ya ha fallado la adherencia antes), no compensa arriesgarse sin imprimación — sale mucho más caro repetir el trabajo que el coste de la imprimación.',
        'Respeta siempre el tiempo de secado de la imprimación antes de pintar el color — pintar sobre imprimación fresca puede levantarla.',
      ],
      commonMistakes: [
        'Pintar plástico sin imprimación específica, esperando que se agarre igual que en otras superficies.',
        'No sellar madera muy porosa antes de pintar, dejando un acabado irregular.',
        'Aplicar la pintura antes de que la imprimación esté seca.',
      ],
      recommendedProducts: [
        { nombre: '.AK SPRAY IMPRIMACION ZINC-ALU 400 ML. 233057', categoria: 'Talleres', formato: '400 ml', precio: '11,39 €' },
        { nombre: 'XYLAZEL TAPAPOROS AL AGUA 750 ML.', categoria: 'Pintura', formato: '750 ml', precio: '13,38 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Imprimación específica para plástico', nombre: '.R-M IMPRIMACION PLASTICOS PM2A20 SPRAY 0,4 L.', precio: '65,62 €' },
        { etiqueta: 'Imprimación fijadora universal', nombre: 'FIJAPREN RX-500 FIJADOR AL AGUA 5 L.', precio: '25,16 €' },
      ],
      // Selector interactivo: elige la superficie y se le recomienda la
      // imprimación real correspondiente.
      selectorSuperficie: {
        pregunta: '¿Sobre qué superficie vas a aplicar la imprimación?',
        opciones: [
          { id: 'metal', label: 'Metal o hierro', nombre: '.AK SPRAY IMPRIMACION ZINC-ALU 400 ML. 233057', motivo: 'Imprimación de zinc-aluminio en spray: mejora la adherencia y protege frente al óxido en metal desnudo.' },
          { id: 'madera_porosa', label: 'Madera o superficie porosa', nombre: 'XYLAZEL TAPAPOROS AL AGUA 750 ML.', motivo: 'Sella los poros de la madera para que la pintura no se absorba de forma irregular.' },
          { id: 'plastico', label: 'Plástico', nombre: '.R-M IMPRIMACION PLASTICOS PM2A20 SPRAY 0,4 L.', motivo: 'Imprimación específica para plástico — sin ella, la pintura apenas se agarra a esta superficie tan lisa.' },
          { id: 'superficie_dificil', label: 'Superficie muy lisa, brillante o donde ya ha fallado antes', nombre: 'FIJAPREN RX-500 FIJADOR AL AGUA 5 L.', motivo: 'Fijador universal para mejorar la adherencia en superficies difíciles donde la pintura normal no se agarra bien.' },
        ],
      },
      relatedSolutions: ['solucionar-problemas-pintura-aplicacion', 'preparar-pieza-taller-antes-pintar', 'eliminar-oxido-metal'],
      seo: {
        title: 'Qué imprimación necesito según la superficie | Orencio Matas',
        description: 'Selector para saber si necesitas imprimación antes de pintar y cuál, según si es metal, madera o plástico.',
      },
    },

    'cuanto-producto-necesito': {
      slug: 'cuanto-producto-necesito',
      title: '¿Cuánta pintura o producto necesito?',
      description: 'Calculadora para saber cuánta pintura, esmalte, barniz o sistema epoxi necesitas según los metros cuadrados a cubrir y el número de manos, con el rendimiento real de cada tipo de producto.',
      category: 'pintura', subcategory: 'Elegir pintura y disolventes',
      problem: 'cuanto_producto_necesito',
      objective: 'preparar',
      surface: 'otro',
      difficulty: 'Fácil',
      estimatedTime: '2 min',
      result: 'La cantidad exacta de producto a comprar, sin que sobre ni falte',
      breadcrumb: ['Centro de Soluciones', 'Pintura y decoración', 'Elegir pintura y disolventes'],
      materials: [
        { fase: 'Cálculo', familiaSugerida: 'Pintura', items: ['Según el producto elegido en la calculadora'] },
      ],
      receta: [
        { fase: 'Elegir producto', emoji: '🎨' },
        { fase: 'Indicar m²',   emoji: '📐' },
        { fase: 'Manos',        emoji: '🖌️' },
        { fase: 'Resultado',    emoji: '🧮' },
      ],
      steps: [
        { n: 1, title: 'Elegir qué vas a aplicar', text: 'Cada tipo de producto cubre una superficie distinta por litro (su "rendimiento") — elige en la calculadora el que corresponda a tu trabajo para que el cálculo sea el correcto.', productos: [] },
        { n: 2, title: 'Medir la superficie a cubrir', text: 'Mide el ancho y el alto de cada zona a pintar y multiplícalos para obtener los m² — si son varias paredes o zonas, suma el total antes de usar la calculadora.', productos: [] },
        { n: 3, title: 'Indicar el número de manos', text: 'Lo habitual son 2 manos para un resultado uniforme, aunque en colores muy oscuros sobre uno claro (o al revés) a veces hace falta una tercera.', productos: [] },
        { n: 4, title: 'Comprar con un pequeño margen', text: 'El resultado es orientativo — comprar un poco más de lo justo evita quedarte a medias si hay que aplicar una mano extra en alguna zona.', productos: [] },
      ],
      professionalTips: [
        'El rendimiento real varía según la superficie: una pared muy porosa o rugosa consume más producto por m² que una lisa ya pintada — el dato de la calculadora es el orientativo del fabricante en condiciones normales.',
        'Guarda el resto de producto bien cerrado para retoques futuros — así no hace falta volver a comprar un bote entero por un desperfecto pequeño más adelante.',
      ],
      commonMistakes: [
        'No sumar todas las zonas a pintar, calculando solo una pared y comprando de menos.',
        'No tener en cuenta que un color muy distinto al de base puede necesitar una mano extra.',
        'Comprar exactamente la cantidad justa sin ningún margen para retoques.',
      ],
      // Calculadora combinada: primero se elige QUÉ producto se va a
      // aplicar (cada uno con su rendimiento real, tomado de la
      // calculadoraCantidad ya verificada de su propia guía completa —
      // no se inventa ningún dato nuevo) y después se calculan los
      // litros según la superficie y el número de manos, igual que las
      // calculadoras individuales ya existentes.
      calculadoraCantidadMultiple: {
        pregunta: '¿Qué vas a aplicar?',
        opciones: [
          { id: 'pintura_pared', label: 'Pintura plástica para pared interior', rendimiento: 10, etiqueta: 'pintura plástica de pared', solucionRelacionada: 'pintar-pared-interior' },
          { id: 'pintura_fachada', label: 'Pintura hidrófuga para fachada', rendimiento: 6, etiqueta: 'pintura hidrófuga de fachada', solucionRelacionada: 'pintar-fachada-exterior' },
          { id: 'pintura_antimoho', label: 'Pintura vinílica antimoho', rendimiento: 9, etiqueta: 'pintura vinílica antimoho', solucionRelacionada: 'eliminar-moho-pared-antes-pintar' },
          { id: 'esmalte_metal', label: 'Esmalte para metal', rendimiento: 12, etiqueta: 'esmalte de metal', solucionRelacionada: 'eliminar-oxido-metal' },
          { id: 'barniz_madera', label: 'Barniz para madera', rendimiento: 12, etiqueta: 'barniz', solucionRelacionada: 'restaurar-mueble-madera' },
          { id: 'epoxi_suelo', label: 'Sistema epoxi para suelo de garaje', rendimiento: 5, etiqueta: 'sistema epoxi de suelos', solucionRelacionada: 'suelo-epoxi-garaje' },
        ],
      },
      recommendedProducts: [
        { nombre: 'TITAN P-60 P.VINILICA PREMIUM 1 L.BLANCO MATE', categoria: 'Pintura', formato: '1 L', precio: '8,54 €', fichaTecnica: 'https://msp.images.akzonobel.com/prd/dh/eesbdm/documents/b7/70/6e/2c/tp_p60_vinilica_premium_mate_00_00_00_ftecnicaes.pdf' },
        { nombre: 'HAMMERITE ESM.LISO HIERRO Y OXIDO 750 ML.BLANCO', categoria: 'Pintura', formato: '750 ml', precio: '17,67 €' },
      ],
      alternativeProducts: [],
      relatedSolutions: ['pintar-pared-interior', 'pintar-fachada-exterior', 'suelo-epoxi-garaje', 'eliminar-oxido-metal', 'restaurar-mueble-madera'],
      seo: {
        title: '¿Cuánta pintura o producto necesito? | Orencio Matas',
        description: 'Calculadora para saber cuánta pintura, esmalte, barniz o sistema epoxi necesitas según los m² a cubrir y el número de manos.',
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
        limpiar: 'limpiar-moho-pared-azulejo',
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
      // 'ceramica' cubre azulejos, bañeras, lavabos y sanitarios — dos
      // guías dedicadas se reparten según la intención: pintar/preparar
      // apunta a azulejos (lo más habitual bajo "pintar"), mientras que
      // restaurar/acabado apunta a renovar bañera-lavabo-sanitario (el
      // caso de "quiero que quede como nuevo sin picarlo"). El resto de
      // acciones (limpiar/reparar/proteger/pegar) son casos de junta con
      // moho o silicona, la incidencia más común en esta superficie.
      ceramica: {
        pintar: 'pintar-azulejos',
        preparar: 'pintar-azulejos',
        restaurar: 'renovar-banera-lavabo-sanitario',
        acabado: 'renovar-banera-lavabo-sanitario',
        limpiar: 'limpiar-moho-pared-azulejo',
        reparar: 'sellar-juntas-bano',
        proteger: 'sellar-juntas-bano',
        pegar: 'sellar-juntas-bano',
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
    if (superficieId === 'ceramica') return 'pintar-azulejos';

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
      // 'pintar_directo_oxido' ANTES de 'oxido': una consulta específica sobre
      // pintar sin quitar el óxido debe ir a la guía de la tecnología OXIRON
      // "directo al óxido", no a la guía general de eliminación de óxido.
      'pintar_directo_oxido': ['sin quitar el oxido', 'sin quitar el óxido', 'sin quitarlo', 'directo sobre el oxido', 'directo sobre el óxido', 'directo al oxido', 'directo al óxido', 'sin lijar el oxido', 'sin lijar el óxido', 'pintar sin imprimacion', 'pintar sin imprimación', 'sin imprimar', 'ni imprimar'],
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
      // 'igualar_color_madera' ANTES de 'mal_acabado': una consulta sobre
      // conseguir que un mueble nuevo haga juego de color con el resto no
      // es lo mismo que un problema de acabado — se queda con frases
      // específicas de igualar/combinar/hacer juego de color en madera.
      'igualar_color_madera': ['mismo color', 'igual color', 'igualar el color', 'igualar color', 'combinar el color', 'que haga juego', 'hacer juego con', 'haga juego', 'hagan juego', 'mismo tono', 'igual tono', 'silla nueva', 'mueble nuevo del mismo', 'que pegue con'],
      'mal_acabado':['barniz', 'blanquecino', 'burbuja', 'madera', 'no ha quedado bien'],
      // 'renovar_banera_sanitario' ANTES de 'moho_junta': una consulta sobre
      // renovar/cambiar el aspecto de la bañera o el lavabo no es lo mismo
      // que un problema de moho o silicona en la junta — se queda con
      // frases específicas de renovación para no eclipsar la guía nueva.
      'renovar_banera_sanitario': ['renovar la bañera', 'renovar la banera', 'renovar el lavabo', 'renovar el sanitario', 'pintar la bañera', 'pintar la banera', 'pintar el lavabo', 'pintar el sanitario', 'esmaltar la bañera', 'esmaltar la banera', 'cambiar el color de la bañera', 'sin cambiarlo'],
      // 'moho_antes_pintar' ANTES de 'moho_junta': una consulta sobre moho
      // en una pared con intención de pintar después no es lo mismo que
      // un problema de moho en la junta de silicona del baño. Ya no hace
      // falta la máxima cautela de antes con la palabra genérica "moho":
      // desde que diagnosticarPorTexto() devuelve TODAS las coincidencias
      // (no solo la primera — ver más abajo), las 3 entradas de moho
      // pueden compartir la palabra "moho" a secas sin que eso "robe" la
      // respuesta a las demás — una búsqueda de "moho" sin más contexto
      // simplemente muestra las 3 guías juntas, que es justo lo que se
      // pidió. El orden aquí solo decide cuál aparece primero cuando hay
      // varias.
      'moho_antes_pintar': ['moho antes de pintar', 'moho para pintar', 'moho y quiero pintar', 'moho y pintar', 'pintar sobre el moho', 'pintar sobre moho', 'quitar el moho para pintar', 'eliminar el moho para pintar', 'moho en la fachada', 'moho'],
      'moho_junta': ['junta', 'silicona', 'bañera', 'banera', 'ducha', 'moho'],
      // 'moho_general' (moho a secas, sin más contexto) DESPUÉS de las dos
      // anteriores: solo actúa como red de seguridad para "tengo moho en
      // la pared/el techo/el azulejo" u otras frases que no hayan
      // coincidido ya con un caso más específico — se queda con la guía
      // de limpieza general, la más honesta por defecto (no todo el mundo
      // que tiene moho quiere pintar encima).
      'moho_general': ['moho'],
      'agua_turbia':['piscina', 'turbia', 'algas', 'cloro', 'ph del agua'],
      'choque_piscina': ['choque', 'hipoclorito', 'sobrecloracion', 'sobrecloración', 'cloracion de choque', 'cloración de choque'],
      'cucarachas': ['cucaracha', 'hormiga', 'insecto', 'plaga', 'bicho'],
      // Frases específicas en vez de palabras sueltas como "cubre" o
      // "adhiere" (demasiado genéricas, podrían colisionar con cualquier
      // otra guía de pintura) y "burbujas en la pintura"/"burbujas al
      // pintar" en vez de "burbuja" a secas — esa palabra suelta ya la
      // usa 'mal_acabado' para burbujas en BARNIZ de muebles, un
      // contexto distinto.
      'pintura_problemas_aplicacion': ['pintura no cubre', 'no cubre bien', 'pintura no se adhiere', 'no se adhiere la pintura', 'se descascarilla', 'descascarillado', 'burbujas en la pintura', 'burbujas al pintar', 'marcas de rodillo', 'marcas de brocha'],
      'eliminar_grasa': ['grasa'],
      'cal_bano': ['cal', 'sarro', 'incrustaciones'],
      'restos_cemento': ['cemento', 'mortero'],
      'limpiar_cristales': ['cristal', 'cristales', 'ventana', 'ventanas'],
      'elegir_lija': ['lija', 'grano de lija', 'que lija', 'disco abrasivo'],
      'elegir_perfume': ['perfume', 'colonia', 'fragancia'],
      'elegir_brocha_rodillo': ['brocha', 'rodillo'],
      'elegir_cinta_enmascarar': ['cinta de carrocero', 'cinta carrocero', 'enmascarar', 'enmascarado'],
      'hologramas_pulido': ['holograma', 'hologramas', 'remolinos'],
      'elegir_disolvente': ['disolvente', 'diluir', 'aguarras', 'aguarrás'],
      'higiene_personal': ['higiene personal', 'gel de ducha', 'gel de baño', 'crema corporal'],
      'preparar_pieza_taller': ['preparar la pieza', 'preparar una pieza', 'preparar antes de pintar'],
      'problemas_pulverizacion': ['pulveriza', 'pulverizacion', 'pulverización', 'chorrea', 'chorreo', 'pistola no cubre'],
      'proteger_acabado': ['proteger el acabado', 'proteger la pintura nueva'],
      'elegir_acabado_pintura': ['pintura mate', 'pintura satinada', 'pintura brillante', 'acabado mate', 'acabado satinado', 'acabado brillante'],
      'limpieza_profesional': ['limpieza profesional', 'hosteleria', 'hostelería', 'consumibles de limpieza', 'limpieza para empresas'],
      'manchas_grietas_antes_pintar': ['grieta', 'grietas', 'mancha antes de pintar', 'manchas antes de pintar', 'mancha de nicotina', 'agujero', 'agujeros', 'tapar agujeros'],
      'humedad_interior': ['humedad', 'pared con humedad', 'mancha de humedad', 'humedad en una pared'],
      'limpiar_herramientas': ['brochas y rodillos', 'limpiar la brocha', 'limpiar el rodillo', 'limpieza de pinceles'],
      'elegir_pintura_superficie': ['que pintura elegir', 'qué pintura elegir', 'pintura antioxidante', 'pintura para metal', 'pintura para madera'],
      // 'pintar_metal_general' es la guía completa paso a paso (con todo
      // el material necesario); 'elegir_pintura_superficie' de arriba es
      // solo un selector rápido de 5 min — se dejan ambas, ya que
      // diagnosticarPorTexto() devuelve todas las coincidencias, no solo
      // la primera, así que una búsqueda amplia como "pintura para metal"
      // ya muestra las dos y quien busca decide cuál le interesa más.
      'pintar_metal_general': ['pintar metal', 'pintar hierro', 'como pintar metal', 'cómo pintar metal', 'como pintar hierro', 'cómo pintar hierro', 'pintar una superficie metalica', 'pintar una superficie metálica', 'pintar una superficie de metal', 'superficie de metal', 'esmalte antioxidante', 'pintura antioxidante', 'antioxidante al agua', 'antioxidante sintetico', 'antioxidante sintético'],
      'pintar_techo_temple': ['pasta al temple', 'pintura al temple', 'temple liso', 'temple gotele', 'temple gotelé', 'temple picado', 'pintar techo', 'pintar un techo', 'pintar el techo', 'gotele', 'gotelé', 'picado techo'],
      'material_desechable_taller': ['mono desechable', 'material desechable', 'proteccion desechable', 'protección desechable'],
      'pintar_renovar_piscina': ['pintar piscina', 'pintar la piscina', 'renovar piscina', 'renovar la piscina', 'renovar mi piscina', 'pintura de piscina', 'pintura para piscinas'],
      'elegir_imprimacion': ['imprimacion', 'imprimación', 'necesito imprimacion', 'que imprimacion'],
      'cuanto_producto_necesito': ['cuanta pintura', 'cuánta pintura', 'cuanto producto', 'cuánto producto', 'cuanta necesito', 'cuántos litros'],
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
      'mancha_ropa':       ['mancha en la ropa', 'mancha en la camisa', 'mancha de la ropa', 'camisa', 'tejido'],
      'ratones':           ['raton', 'ratón', 'ratones', 'roedor'],
      'plantas_debiles':   ['planta', 'abono', 'maceta'],
      'polillas_ropa':     ['polilla', 'armario', 'guardarropa'],
      'goteras':           ['gotera', 'goteras', 'humedad', 'filtracion', 'filtración', 'terraza'],
      // Términos específicos de fachada colocados ANTES de 'fachada_deteriorada'
      // (que reacciona a la palabra genérica "fachada"), para que una consulta
      // concreta apunte a la solución correcta en vez de caer siempre en la
      // guía general de pintar fachada exterior.
      'fachada_piedra_absorbe_agua': ['hidrofugar', 'piedra vista', 'ladrillo visto', 'impermeabilizar la piedra', 'fachada de piedra', 'absorbe agua', 'absorbe mucha agua'],
      'grietas_fachada': ['grieta en la fachada', 'grietas en la fachada', 'fisura en la fachada', 'fisuras en la fachada', 'fisuras en fachada', 'fisura en fachada', 'fachada agrietada', 'revestimiento elastico antifisuras', 'revestimiento elástico antifisuras', 'revestimiento antifisuras', 'revestimiento', 'fachada', 'r-50', 'r 50', 'r50'],
      'salitre_fachada': ['salitre', 'eflorescencia', 'eflorescencias', 'manchas blancas en la fachada', 'capilaridad'],
      // 'proteger_fachada_monocapa' ANTES de 'fachada_deteriorada' (que
      // reacciona a la palabra genérica "fachada"): una consulta sobre
      // proteger/hidrofugar un mortero monocapa concreto no debe caer en
      // la guía general de pintar fachada exterior.
      'proteger_fachada_monocapa': ['mortero monocapa', 'monocapa', 'revestimiento acrilico siliconado', 'revestimiento acrílico siliconado', 'revestimiento', 'fachada', 'hidrofugante fachada', 'hidrofugante para fachada', 'proteccion de fachada', 'protección de fachada', 'proteccion de fachadas', 'protección de fachadas', 'r-20', 'r 20', 'r20'],
      // 'acabado_forjado_metal' ANTES de 'pintar_verja_hierro': si el usuario
      // pide específicamente un acabado de forja/pavonado/martelé, no debe
      // caer en la guía genérica de pintar una verja con esmalte liso.
      'acabado_forjado_metal': ['acabado forjado', 'efecto forjado', 'imitar la forja', 'aspecto forjado', 'pavonado', 'martele', 'martelé', 'acabado martillado', 'efecto martillado'],
      'pintar_verja_hierro': ['verja', 'barandilla', 'reja de hierro'],
      'pintar_pladur': ['pladur', 'placa de yeso laminado', 'placas de yeso laminado'],
      'fachada_deteriorada': ['fachada', 'exterior de la casa', 'exterior de casa'],
      // 'pintar_radiador' ANTES de 'pintar_calor': la consulta más habitual
      // sobre "radiador" es la calefacción normal de agua de casa, no una
      // pieza de altísima temperatura — esa guía general de anticalórico
      // se queda solo para estufas, tubos de escape, etc.
      'pintar_radiador':  ['radiador', 'radiadores', 'pintar el radiador', 'calefaccion', 'calefacción'],
      'pintar_calor':     ['estufa', 'tubo de escape', 'anticalorico', 'anticalórico', 'que da calor', 'pintura resistente al calor'],
      'faros_opacos':     ['faro', 'faros', 'optica amarillenta', 'óptica amarillenta'],
      'madera_exterior':  ['mueble de jardin', 'mueble de jardín', 'valla', 'lasur'],
      'pintar_azulejos':  ['azulejo', 'azulejos'],
      'mosquitos':        ['mosquito', 'mosquitos'],
      'suelo_madera_desgastado': ['parquet', 'tarima'],
      'pintar_llantas':   ['llanta', 'llantas'],
      'plata_oscurecida': ['plata', 'oscurecid', 'cobre'],
      'usar_lejia':       ['lejia', 'lejía'],
      'desinfectar_hogar':['desinfectar', 'desinfeccion', 'desinfección'],
      'elegir_pistola':   ['pistola de pintar', 'pistola gravedad', 'pistola airless', 'pistola hvlp'],
      'elegir_lijadora':  ['que lijadora', 'qué lijadora', 'lijadora rotorbital'],
      'proteger_estructura_metalica': ['estructura metalica', 'estructura metálica', 'nave industrial', 'corrosion de la estructura'],
      'proteger_fuego_estructura': ['contra el fuego', 'resistencia al fuego', 'intumescente'],
      'lacar_mueble_profesional': ['lacar', 'lacado', 'laca poliuretano'],
    };
    // Se recogen TODAS las coincidencias, no solo la primera — antes se
    // paraba en cuanto encontraba un problema y solo se ofrecía esa única
    // solución, aunque el texto pudiera encajar razonablemente con varias
    // guías distintas (p. ej. buscar "moho" a secas: hay guía de junta con
    // moho, de limpieza general y de moho antes de pintar). Se sigue
    // manteniendo el orden de aparición en el objeto (los términos más
    // específicos siguen listados antes que los genéricos) para que el
    // PRIMER resultado sea el más relevante, pero ya no se descarta el
    // resto.
    const idsCoincidentes = [];
    for (const [id, palabras] of Object.entries(coincidencias)) {
      if (palabras.some((p) => t.includes(p))) idsCoincidentes.push(id);
    }

    if (!idsCoincidentes.length) {
      // Honestidad ante todo: si el texto no coincide con ningún problema
      // conocido, no forzamos una recomendación al azar (mismo criterio ya
      // aplicado en encontrarSolucionPorDiagnostico del wizard). El llamador
      // debe entonces intentar una búsqueda real en el catálogo en su lugar.
      return { problemaDetectado: null, solutionSlug: null, todasLasSoluciones: [] };
    }

    // Varios ids de "problema" distintos pueden apuntar a la MISMA
    // solución (por ejemplo, dos formas de describir el mismo caso) — se
    // deduplica por solutionSlug para no repetir la misma guía dos veces
    // en los resultados.
    const vistos = new Set();
    const todasLasSoluciones = [];
    idsCoincidentes.forEach((id) => {
      const p = problemasFrecuentes.find((pf) => pf.id === id);
      if (!p || vistos.has(p.solutionSlug)) return;
      vistos.add(p.solutionSlug);
      todasLasSoluciones.push({ problemaDetectado: p.label, solutionSlug: p.solutionSlug });
    });

    const problema = problemasFrecuentes.find((p) => p.id === idsCoincidentes[0]) || problemasFrecuentes[0];
    return {
      problemaDetectado: problema.label,
      solutionSlug: problema.solutionSlug,
      todasLasSoluciones,
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

  // Misma caché en vivo de Apps Script que usa buscador.html (ver
  // PRODUCTOS_REMOTO_URL ahí) — se actualiza de forma síncrona en el
  // propio Apps Script justo tras subir una imagen, validarla, etc., así
  // que es la única fuente que refleja esos cambios al instante para
  // CUALQUIER visitante del Centro de Soluciones, no solo para quien hizo
  // el cambio. Antes esta página solo leía data/productos.json (el JSON
  // estático del repo), que depende de que el workflow correspondiente
  // haya regenerado el archivo y GitHub Pages haya terminado de
  // desplegarlo — de ahí que una imagen recién actualizada en el
  // buscador tardase en verse aquí, o incluso no llegase a verse durante
  // horas. No se cachea en localStorage (el catálogo completo pesa varios
  // MB y excede la cuota típica por origen); simplemente se vuelve a
  // pedir en cada visita de página, igual que ya hacía antes con el JSON
  // estático.
  const PRODUCTOS_REMOTO_URL = 'https://script.google.com/macros/s/AKfycbwqJOASK7XTqZ_XH2wt512Es5DlItsjIQn24JYGuuNMcuolzvi5P8L-m0N5Sf0oHzQ7/exec?accion=obtener_productos';

  let catalogoRealCache = null;
  let catalogoRealCachePromise = null;
  function cargarCatalogoReal() {
    if (catalogoRealCache) return Promise.resolve(catalogoRealCache);
    if (catalogoRealCachePromise) return catalogoRealCachePromise;

    // 1) Fuente de verdad: la caché en vivo de Apps Script — así una
    //    imagen recién actualizada desde el buscador (por cualquier
    //    persona) se ve aquí sin depender de ningún despliegue.
    catalogoRealCachePromise = fetch(PRODUCTOS_REMOTO_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('respuesta no OK'))))
      .then((d) => {
        catalogoRealCache = (d.productos || []).filter((p) => !p.fecha_baja);
        return catalogoRealCache;
      })
      .catch(() => {
        // 2) Si Apps Script no responde (caído, cuota, CORS…), último
        //    recurso: el JSON estático del propio despliegue.
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
      });
    return catalogoRealCachePromise;
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
    const t = normalizarTexto(texto);
    const palabras = t.split(/[^a-z0-9áéíóúñ]+/i)
      // Palabras normales: mínimo 4 letras. Códigos de producto cortos
      // (p.ej. "p60", "ex330") se permiten desde 2 caracteres, pero solo
      // si combinan letra Y dígito — un fragmento puramente numérico
      // como "60" (lo que queda de "P-60" al partir por el guion) NO
      // basta por sí solo: coincidiría por igual con "R-60", "S-60" o
      // cualquier otro código que también termine en 60, perdiendo
      // justo la parte que distingue un código de otro.
      .filter((w) => (w.length >= 4 || (w.length >= 2 && /[a-z]/i.test(w) && /\d/.test(w))) && !STOPWORDS_BUSQUEDA.has(w));
    // Códigos de producto con guion ("p-60", "pxb-730", "ex-330"):
    // capturados aparte como token combinado sin el guion, para no
    // depender de que el split genérico los mantenga unidos — así
    // buscar "p-60" añade también "p60" a la lista de términos, en vez
    // de perderse entre los fragmentos "p" y "60" por separado.
    const codigos = t.match(/[a-z]{1,4}-\d{2,4}/gi) || [];
    codigos.forEach((c) => {
      const combinado = c.replace(/-/g, '');
      if (combinado.length >= 3 && !palabras.includes(combinado)) palabras.push(combinado);
    });
    return palabras;
  }

  function contienePalabra(textoNorm, palabra) {
    // Coincidencia por palabra completa, no subcadena (mismo tipo de bug ya
    // corregido antes: "olor" coincidía dentro de "incolora").
    return new RegExp('(^|[^a-z0-9áéíóúñ])' + palabra + '($|[^a-z0-9áéíóúñ])').test(textoNorm);
  }

  // Coincidencia de código de producto ignorando guiones/puntos/espacios:
  // "p60" o "p-60" deben encontrar por igual un producto llamado
  // "TITAN P-60 P.VINILICA...". contienePalabra() por sí sola no basta
  // aquí porque exige límites de palabra completos, y un guion ya cuenta
  // como límite — "p60" nunca sería "la misma palabra" que "p-60" para esa
  // función aunque sean el mismo código para cualquier persona.
  function coincideCodigoProducto(textoNorm, terminoNorm) {
    const bSinSep = terminoNorm.replace(/[^a-z0-9]/g, '');
    if (bSinSep.length < 3) return false;
    // Se localiza la coincidencia ignorando separadores (para que "r50"
    // encuentre "R-50"), pero SIN perder la posición real dentro del
    // texto ORIGINAL — a diferencia de la versión anterior, que
    // primero eliminaba TODOS los separadores del texto objetivo y ya
    // no podía distinguir "R-50 15 L" (con espacio real, código
    // completo) de un código realmente pegado a más dígitos como
    // "HP-600" (bug real: buscar "r50" no encontraba el R-50 porque,
    // tras quitar los espacios, quedaba pegado al "15" del formato,
    // y el carácter siguiente parecía "otro dígito del mismo número").
    const posicionesAlfanum = [];
    for (let idx = 0; idx < textoNorm.length; idx++) {
      if (/[a-z0-9]/.test(textoNorm[idx])) posicionesAlfanum.push(idx);
    }
    const tSinSep = posicionesAlfanum.map((idx) => textoNorm[idx]).join('');
    const i = tSinSep.indexOf(bSinSep);
    if (i === -1) return false;
    const posUltimoCaracterReal = posicionesAlfanum[i + bSinSep.length - 1];
    const siguienteEnOriginal = textoNorm.charAt(posUltimoCaracterReal + 1);
    if (!siguienteEnOriginal || !/[a-z0-9]/.test(siguienteEnOriginal)) return true; // fin de texto o separador real: código completo
    // Pegado a otro carácter alfanumérico sin separador real de por
    // medio: solo se rechaza si es OTRO DÍGITO (mismo caso a evitar de
    // siempre: "p60" dentro de "hp600"). Pegado a una letra sí se acepta.
    return !/\d/.test(siguienteEnOriginal);
  }

  // Búsqueda global entre TODAS las soluciones (título, descripción,
  // categoría/subcategoría, migas de pan, Y los productos recomendados de
  // cada una) — a diferencia de diagnosticarPorTexto(), que solo reconoce
  // los ~90 "problemas frecuentes" curados a mano, esta función encuentra
  // cualquier guía cuyo contenido O cuyos productos mencionen lo buscado.
  // Incluir los productos es lo que permite que buscar el código de un
  // barniz o una pintura concreta (p.ej. "p60", "pxb-730") lleve
  // directamente a la guía que lo usa, no solo a guías que mencionan esa
  // palabra en el título.
  function buscarSolucionesPorTexto(texto) {
    const palabras = palabrasSignificativas(texto);
    if (!palabras.length) return [];
    const resultados = [];
    Object.values(soluciones).forEach((s) => {
      const tituloNorm = normalizarTexto(s.title || '');
      const restoNorm = normalizarTexto(
        [s.description, s.category, s.subcategory, (s.breadcrumb || []).join(' ')].filter(Boolean).join(' ')
      );
      const productosNorm = (s.recommendedProducts || [])
        .map((p) => normalizarTexto(p.nombre || ''))
        .join(' | ');
      let puntuacion = 0;
      palabras.forEach((w) => {
        if (contienePalabra(tituloNorm, w)) puntuacion += 3; // el título pesa más
        else if (contienePalabra(restoNorm, w)) puntuacion += 1;
        else if (contienePalabra(productosNorm, w) || coincideCodigoProducto(productosNorm, w)) puntuacion += 2;
      });
      if (puntuacion > 0) resultados.push({ solucion: s, puntuacion });
    });
    resultados.sort((a, b) => b.puntuacion - a.puntuacion);
    return resultados.map((r) => r.solucion);
  }

  // Índice de todos los productos con ficha técnica de fabricante
  // conocida (TitanTech/TitanPro, ver recommendedProducts[].fichaTecnica),
  // construido una sola vez y cacheado — permite responder directamente a
  // "ficha técnica p60" o "ficha técnica pxb-730" sin depender de que esa
  // guía aparezca entre los resultados normales de búsqueda.
  let indiceFichaTecnicaCache = null;
  function construirIndiceFichaTecnica() {
    if (indiceFichaTecnicaCache) return indiceFichaTecnicaCache;
    const indice = [];
    Object.values(soluciones).forEach((sol) => {
      (sol.recommendedProducts || []).forEach((p) => {
        if (p.fichaTecnica) {
          indice.push({
            nombre: p.nombre,
            fichaTecnica: p.fichaTecnica,
            codigoNorm: normalizarTexto(p.nombre),
            solutionSlug: sol.slug,
            solutionTitle: sol.title,
          });
        }
      });
    });
    indiceFichaTecnicaCache = indice;
    return indice;
  }

  // Detecta consultas del tipo "ficha técnica X" (o simplemente "X" si X
  // ya es un código reconocible) y devuelve el producto + enlace directo
  // a su ficha técnica de fabricante si hay una coincidencia razonable.
  // null si no hay nada que se le parezca lo suficiente.
  function buscarFichaTecnicaPorTexto(texto) {
    const t = normalizarTexto(texto);
    if (!t.trim()) return null;
    // Si la consulta menciona explícitamente "ficha" (técnica o no), se
    // interpreta el resto como el código a buscar; si no, se prueba con
    // el texto completo tal cual (para que un buscador ya centrado en
    // fichas técnicas, o alguien que solo teclea el código, funcione
    // igual sin tener que escribir la palabra "ficha").
    const m = t.match(/\bficha\s*(tecnica|técnica)?\s*(?:de(?:l)?)?\s*(.*)/);
    const consulta = (m && m[2].trim()) ? m[2] : t;
    const codigoBuscado = consulta.replace(/[^a-z0-9]/g, '');
    if (codigoBuscado.length < 3) return null;
    const indice = construirIndiceFichaTecnica();
    return indice.find((p) => coincideCodigoProducto(p.codigoNorm, codigoBuscado)) || null;
  }

  // Búsqueda combinada — pensada para el buscador rápido del hero, donde
  // el usuario escribe una palabra suelta esperando encontrar algo SIEMPRE
  // que exista una guía relacionada, sin tener que "acertar" con el
  // término exacto. Antes ese buscador solo llamaba a
  // buscarSolucionesPorTexto (coincidencia literal en título/descripción),
  // completamente ciego a los ~90 sinónimos y términos coloquiales que sí
  // conoce diagnosticarPorTexto (p. ej. "cloro" no aparece escrito en el
  // título ni la descripción de la guía de mantenimiento de piscinas, pero
  // SÍ está en su lista de palabras clave) — bug real reportado: buscar
  // "cloro" no devolvía nada pese a existir una guía perfectamente
  // relacionada. Combina ambas fuentes, con el diagnóstico curado primero
  // (más fiable, es una lista mantenida a mano) y sin repetir una misma
  // guía si ya apareció por el otro camino.
  function buscarSolucionesCombinado(texto) {
    const vistos = new Set();
    const resultado = [];
    const { todasLasSoluciones } = diagnosticarPorTexto(texto);
    todasLasSoluciones.forEach((s) => {
      if (vistos.has(s.solutionSlug)) return;
      vistos.add(s.solutionSlug);
      const sol = soluciones[s.solutionSlug];
      if (sol) resultado.push(sol);
    });
    buscarSolucionesPorTexto(texto).forEach((sol) => {
      if (vistos.has(sol.slug)) return;
      vistos.add(sol.slug);
      resultado.push(sol);
    });
    return resultado;
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
    normalizarTexto, cargarCatalogoReal, buscarProductosEnCatalogo, buscarSolucionesPorTexto, buscarSolucionesCombinado, buscarFichaTecnicaPorTexto, resolverProductoReal,
  };
})();
