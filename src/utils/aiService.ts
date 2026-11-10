import type {
  AiGenerationRequest,
  FlowNodeRole,
  NodeShape,
  OrganizerEdge,
  OrganizerNode,
  OrganizerType,
  ThemeId,
} from '../types/organizer';
import type { ApiSettings } from './storage';
import { applyLayout, PALETTES } from './layouts';

interface TemplateSeedNode {
  text: string;
  subtitle?: string;
  parentIndex: number | null;
  icon?: string;
  shape?: NodeShape;
  flowType?: FlowNodeRole;
  label?: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  progress?: 0 | 25 | 50 | 75 | 100;
  notes?: string;
  imageUrl?: string;
  imagePrompt?: string;
}

/**
 * Genera una URL de imagen ilustrativa en alta resolución basada en el contenido conceptual del punto,
 * utilizando un servicio de fotografía temática de alta calidad sin restricciones de cuota ni costo.
 */
export function buildAiImageUrl(prompt: string, seed?: number): string {
  const words = prompt
    .replace(/[^\w\s]/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(
      w =>
        w.length > 2 &&
        !['with', 'from', 'that', 'this', 'have', 'more', 'about', 'real'].includes(
          w.toLowerCase()
        )
    )
    .slice(0, 3)
    .join('-');
  const s = seed || Math.floor(Math.random() * 900000) + 100000;
  return `https://picsum.photos/seed/${encodeURIComponent(words || 'concept')}-${s}/480/280`;
}

/**
 * Genera un pie o título representativo formal para la tarjeta de imagen externa de cada uno de los 8 ejes
 */
export function getCartographicImageCaption(parentAxisText: string): string {
  const t = parentAxisText.toLowerCase();
  if (t.includes('ejemplificaci') || t.includes('1.')) return 'Ilustración: Caso aplicado';
  if (t.includes('noci') || t.includes('2.')) return 'Gráfico: Concepto esencial';
  if (t.includes('categorizaci') || t.includes('3.')) return 'Taxonomía: Campo disciplinar';
  if (t.includes('caracter') || t.includes('4.')) return 'Detalle: Rasgos distintivos';
  if (t.includes('diferenciaci') || t.includes('5.')) return 'Comparativa: Diferencias';
  if (t.includes('subdivisi') || t.includes('6.')) return 'Estructura: Componentes';
  if (t.includes('vinculaci') || t.includes('7.')) return 'Red: Disciplinas vinculadas';
  if (t.includes('metodolog') || t.includes('8.')) return 'Protocolo: Fases de aplicación';
  return 'Ilustración: Representación visual';
}

const BUILTIN_KNOWLEDGE: Record<
  string,
  {
    title: string;
    type: OrganizerType;
    nodes: TemplateSeedNode[];
    crossLinks?: { fromIndex: number; toIndex: number; label: string }[];
  }
> = {
  'inteligencia artificial': {
    title: 'Ecosistema de Inteligencia Artificial',
    type: 'mindmap',
    nodes: [
      {
        text: 'Inteligencia Artificial',
        subtitle: 'Panorama Tecnológico',
        parentIndex: null,
        icon: '🧠',
        notes: 'Rama de las ciencias de la computación dedicada a crear sistemas capaces de razonar, aprender y actuar.',
      },
      { text: 'Machine Learning', parentIndex: 0, icon: '📈', priority: 1, progress: 100 },
      { text: 'Supervisado (Clasificación)', parentIndex: 1, icon: '🏷️' },
      { text: 'No Supervisado (Clustering)', parentIndex: 1, icon: '🧩' },
      { text: 'Por Refuerzo (RLHF)', parentIndex: 1, icon: '🎮' },
      { text: 'Deep Learning', parentIndex: 0, icon: '⚡', priority: 2, progress: 75 },
      { text: 'Redes Convolucionales (CNN)', parentIndex: 5, icon: '🖼️' },
      { text: 'Arquitectura Transformer', parentIndex: 5, icon: '💬' },
      { text: 'Modelos Multimodales', parentIndex: 5, icon: '🔮' },
      { text: 'Aplicaciones Reales', parentIndex: 0, icon: '🚀', progress: 50 },
      { text: 'Visión Computacional', parentIndex: 9, icon: '👁️' },
      { text: 'Asistentes y Agentes IA', parentIndex: 9, icon: '🤖' },
      { text: 'Diagnóstico Biomédico', parentIndex: 9, icon: '🔬' },
      { text: 'Ética y Gobernanza', parentIndex: 0, icon: '⚖️', priority: 1 },
      { text: 'Mitigación de Sesgos', parentIndex: 13, icon: '🔍' },
      { text: 'Alineamiento y Privacidad', parentIndex: 13, icon: '🛡️' },
    ],
    crossLinks: [{ fromIndex: 7, toIndex: 11, label: 'impulsa' }],
  },
  'administracion financiera': {
    title: 'Cartografía Conceptual: Administración Financiera',
    type: 'cartographic',
    nodes: [
      {
        text: 'Administración Financiera',
        subtitle: 'Cartografía Conceptual de Ocho Ejes',
        parentIndex: null,
        shape: 'rounded',
      },
      // 1. Ejemplificación (Norte)
      { text: '1. Ejemplificación', parentIndex: 0 },
      {
        text: 'un modelo corporativo contemporáneo que aplica los principios clásicos de gestión de liquidez y presupuesto de capital para garantizar su estabilidad',
        label: 'se ejemplifica mediante',
        parentIndex: 1,
      },
      // 2. Noción (Noreste)
      { text: '2. Noción', parentIndex: 0 },
      {
        text: 'la disciplina directiva encargada de planificar, organizar y controlar los recursos monetarios para maximizar el valor integral de la organización',
        label: 'se define como',
        parentIndex: 3,
      },
      // 3. Categorización (Este medio-alto)
      { text: '3. Categorización', parentIndex: 0 },
      {
        text: 'la rama de las ciencias económico-administrativas orientada a la toma de decisiones estratégicas sobre inversiones y financiamiento',
        label: 'pertenece a',
        parentIndex: 5,
      },
      // 4. Características (Este medio-bajo)
      { text: '4. Características', parentIndex: 0 },
      {
        text: 'la optimización equilibrada de la rentabilidad, la mitigación rigurosa de riesgos y la preservación de liquidez operativa a largo plazo',
        label: 'se caracteriza por',
        parentIndex: 7,
      },
      // 5. Diferencias (Sureste)
      { text: '5. Diferencias', parentIndex: 0 },
      {
        text: 'la contabilidad formal enfocada en el registro de hechos históricos y la economía macro por su orientación ejecutiva hacia el futuro financiero',
        label: 'se distingue de',
        parentIndex: 9,
      },
      // 6. Subdivisión (Sur)
      { text: '6. Subdivisión', parentIndex: 0 },
      {
        text: 'la gestión de tesorería, el análisis de inversiones de capital, la estructura de financiamiento y el mercado de valores',
        label: 'se subdivide en',
        parentIndex: 11,
      },
      // 7. Vinculación (Suroeste)
      { text: '7. Vinculación', parentIndex: 0 },
      {
        text: 'las teorías cuantitativas del riesgo, los modelos de gobernanza corporativa y la economía conductual para la toma de decisiones',
        label: 'se vincula con',
        parentIndex: 13,
      },
      // 8. Metodología (Oeste)
      { text: '8. Metodología', parentIndex: 0 },
      {
        text: 'el diagnóstico de flujo de caja, la formulación de proyecciones rigurosas y la aplicación de métricas de control presupuestario continuo',
        label: 'se aplica mediante',
        parentIndex: 15,
      },
    ],
  },
  'cartografia conceptual': {
    title: 'Cartografía Conceptual: Administración Financiera',
    type: 'cartographic',
    nodes: [
      {
        text: 'Administración Financiera',
        subtitle: 'Cartografía Conceptual de Ocho Ejes',
        parentIndex: null,
        shape: 'rounded',
      },
      { text: '1. Ejemplificación', parentIndex: 0 },
      {
        text: 'un modelo corporativo contemporáneo que aplica los principios clásicos de gestión de liquidez y presupuesto de capital para garantizar su estabilidad',
        label: 'se ejemplifica mediante',
        parentIndex: 1,
      },
      { text: '2. Noción', parentIndex: 0 },
      {
        text: 'la disciplina directiva encargada de planificar, organizar y controlar los recursos monetarios para maximizar el valor integral de la organización',
        label: 'se define como',
        parentIndex: 3,
      },
      { text: '3. Categorización', parentIndex: 0 },
      {
        text: 'la rama de las ciencias económico-administrativas orientada a la toma de decisiones estratégicas sobre inversiones y financiamiento',
        label: 'pertenece a',
        parentIndex: 5,
      },
      { text: '4. Características', parentIndex: 0 },
      {
        text: 'la optimización equilibrada de la rentabilidad, la mitigación rigurosa de riesgos y la preservación de liquidez operativa a largo plazo',
        label: 'se caracteriza por',
        parentIndex: 7,
      },
      { text: '5. Diferencias', parentIndex: 0 },
      {
        text: 'la contabilidad formal enfocada en el registro de hechos históricos y la economía macro por su orientación ejecutiva hacia el futuro financiero',
        label: 'se distingue de',
        parentIndex: 9,
      },
      { text: '6. Subdivisión', parentIndex: 0 },
      {
        text: 'la gestión de tesorería, el análisis de inversiones de capital, la estructura de financiamiento y el mercado de valores',
        label: 'se subdivide en',
        parentIndex: 11,
      },
      { text: '7. Vinculación', parentIndex: 0 },
      {
        text: 'las teorías cuantitativas del riesgo, los modelos de gobernanza corporativa y la economía conductual para la toma de decisiones',
        label: 'se vincula con',
        parentIndex: 13,
      },
      { text: '8. Metodología', parentIndex: 0 },
      {
        text: 'el diagnóstico de flujo de caja, la formulación de proyecciones rigurosas y la aplicación de métricas de control presupuestario continuo',
        label: 'se aplica mediante',
        parentIndex: 15,
      },
    ],
  },
  'mapa logico': {
    title: 'Estrategia de Lanzamiento SaaS',
    type: 'logic',
    nodes: [
      { text: 'Lanzamiento Producto SaaS', subtitle: 'Plan Maestro Q1-Q4', parentIndex: null, icon: '🚀' },
      { text: 'Investigación de Mercado', parentIndex: 0, icon: '🔍', priority: 1, progress: 100 },
      { text: 'Entrevistas a Usuarios', parentIndex: 1 },
      { text: 'Benchmarking Competitivo', parentIndex: 1 },
      { text: 'Propuesta de Valor Única', parentIndex: 1 },
      { text: 'Ingeniería y Producto', parentIndex: 0, icon: '💻', priority: 1, progress: 75 },
      { text: 'Arquitectura Escalable', parentIndex: 5 },
      { text: 'Diseño UX/UI Cálido', parentIndex: 5 },
      { text: 'Pruebas Automatizadas QA', parentIndex: 5 },
      { text: 'Adquisición y Crecimiento', parentIndex: 0, icon: '📊', priority: 2, progress: 50 },
      { text: 'SEO y Marketing de Contenidos', parentIndex: 9 },
      { text: 'Programa Beta Privada', parentIndex: 9 },
      { text: 'Métricas de Retención (LTV)', parentIndex: 9 },
    ],
  },
  sinoptico: {
    title: 'Los Géneros Literarios',
    type: 'synoptic',
    nodes: [
      { text: 'Géneros Literarios', subtitle: 'Clasificación Clásica y Moderna', parentIndex: null, icon: '📚' },
      { text: 'Género Lírico', parentIndex: 0, icon: '✍️' },
      { text: 'Oda e Himno', parentIndex: 1 },
      { text: 'Soneto y Elegía', parentIndex: 1 },
      { text: 'Égloga y Madrigal', parentIndex: 1 },
      { text: 'Género Narrativo', parentIndex: 0, icon: '📖' },
      { text: 'Novela Contemporánea', parentIndex: 5 },
      { text: 'Cuento y Microrrelato', parentIndex: 5 },
      { text: 'Mito, Leyenda y Fábula', parentIndex: 5 },
      { text: 'Género Dramático', parentIndex: 0, icon: '🎭' },
      { text: 'Tragedia Clásica', parentIndex: 9 },
      { text: 'Comedia de Costumbres', parentIndex: 9 },
      { text: 'Drama Moderno', parentIndex: 9 },
      { text: 'Género Didáctico', parentIndex: 0, icon: '🎓' },
      { text: 'Ensayo Crítico', parentIndex: 13 },
      { text: 'Biografía y Crónica', parentIndex: 13 },
    ],
  },
  fotosintesis: {
    title: 'Proceso de la Fotosíntesis',
    type: 'concept',
    nodes: [
      { text: 'La Fotosíntesis', subtitle: 'Proceso Anabólico Vegetal', parentIndex: null, icon: '🌱' },
      { text: 'Energía Luminosa', parentIndex: 0, icon: '☀️', label: 'requiere' },
      { text: 'Clorofila en Cloroplastos', parentIndex: 1, icon: '🍃', label: 'es captada por' },
      { text: 'ATP y NADPH', parentIndex: 2, label: 'sintetiza en fase luminosa' },
      { text: 'Sustratos Inorgánicos', parentIndex: 0, icon: '💧', label: 'transforma' },
      { text: 'Agua (H₂O) Radicular', parentIndex: 4, label: 'absorbe' },
      { text: 'Dióxido de Carbono (CO₂)', parentIndex: 4, label: 'fija mediante Ciclo de Calvin' },
      { text: 'Productos Vitales', parentIndex: 0, icon: '🍎', label: 'libera y produce' },
      { text: 'Glucosa (C₆H₁₂O₆)', parentIndex: 7, label: 'almacena energía en' },
      { text: 'Oxígeno Molecular (O₂)', parentIndex: 7, label: 'oxigena la atmósfera con' },
    ],
  },
  ishikawa: {
    title: 'Retraso en Entrega de Software',
    type: 'fishbone',
    nodes: [
      { text: 'Retraso en Releases', subtitle: 'Efecto Crítico', parentIndex: null, icon: '🎯' },
      { text: 'Métodos y Procesos', parentIndex: 0, icon: '📋' },
      { text: 'Historias sin criterios claros', parentIndex: 1 },
      { text: 'Revisiones de código tardías', parentIndex: 1 },
      { text: 'Equipo y Talento', parentIndex: 0, icon: '👥' },
      { text: 'Sobrecarga multitarea', parentIndex: 4 },
      { text: 'Onboarding incompleto', parentIndex: 4 },
      { text: 'Infraestructura Técnica', parentIndex: 0, icon: '💻' },
      { text: 'Pipeline CI/CD lento', parentIndex: 7 },
      { text: 'Entornos de staging inestables', parentIndex: 7 },
      { text: 'Requisitos y Alcance', parentIndex: 0, icon: '📦' },
      { text: 'Cambios de alcance (Scope Creep)', parentIndex: 10 },
      { text: 'Dependencias externas bloqueadas', parentIndex: 10 },
      { text: 'Medición y Calidad', parentIndex: 0, icon: '📊' },
      { text: 'Baja cobertura de tests unitarios', parentIndex: 13 },
      { text: 'Detección tardía de regresiones', parentIndex: 13 },
      { text: 'Comunicación', parentIndex: 0, icon: '💬' },
      { text: 'Silos entre Diseño y Backend', parentIndex: 16 },
    ],
  },
  organigrama: {
    title: 'Estructura Organizacional Tecnológica',
    type: 'tree',
    nodes: [
      { text: 'Dirección General', subtitle: 'CEO • Sofía Méndez', parentIndex: null, icon: '🏛️' },
      { text: 'Dirección de Tecnología', subtitle: 'CTO • Carlos Vega', parentIndex: 0, icon: '💻' },
      { text: 'Plataforma Frontend', subtitle: 'Equipo Web & Móvil', parentIndex: 1 },
      { text: 'Servicios Backend & IA', subtitle: 'APIs y Datos', parentIndex: 1 },
      { text: 'Infraestructura Cloud', subtitle: 'SRE & Seguridad', parentIndex: 1 },
      { text: 'Dirección de Producto', subtitle: 'CPO • Lucía Rojas', parentIndex: 0, icon: '🎯' },
      { text: 'Diseño de Experiencia', subtitle: 'Design System', parentIndex: 5 },
      { text: 'Investigación de Usuarios', subtitle: 'Discovery Continuo', parentIndex: 5 },
      { text: 'Dirección de Operaciones', subtitle: 'COO • Martín Silva', parentIndex: 0, icon: '⚙️' },
      { text: 'Talento y Cultura', subtitle: 'People Ops', parentIndex: 8 },
      { text: 'Finanzas y Legal', subtitle: 'Planeación', parentIndex: 8 },
    ],
  },
  flujo: {
    title: 'Flujo de Atención de Incidencias',
    type: 'flowchart',
    nodes: [
      { text: 'Inicio: Recepción de Solicitud', parentIndex: null, icon: '🏁', flowType: 'start' },
      { text: 'Registro de Datos y Triaje', parentIndex: 0, icon: '📝', flowType: 'data' },
      { text: '¿Se resuelve en Primer Nivel?', parentIndex: 1, icon: '⚖️', flowType: 'decision' },
      { text: 'Aplicar Solución Inmediata', parentIndex: 2, icon: '✅', flowType: 'process', label: 'Sí' },
      { text: 'Escalar a Ingeniería Especialista', parentIndex: 2, icon: '🛠️', flowType: 'process', label: 'No' },
      { text: 'Desplegar Parche Verificado', parentIndex: 4, icon: '🚀', flowType: 'process' },
      { text: 'Fin: Confirmación y Cierre', parentIndex: 3, icon: '🏆', flowType: 'end' },
    ],
  },
  cronograma: {
    title: 'Hoja de Ruta Anual del Proyecto',
    type: 'timeline',
    nodes: [
      { text: 'Hoja de Ruta 2026', subtitle: 'Visión Anual', parentIndex: null, icon: '⏳' },
      { text: 'Fase 1: Descubrimiento', subtitle: 'Enero – Marzo', parentIndex: 0, icon: '🔍', progress: 100 },
      { text: 'Definición de Arquitectura', parentIndex: 1 },
      { text: 'Prototipo Validado', parentIndex: 1 },
      { text: 'Fase 2: Construcción MVP', subtitle: 'Abril – Junio', parentIndex: 0, icon: '⚡', progress: 75 },
      { text: 'Motor Gráfico Interactivo', parentIndex: 4 },
      { text: 'Exportador Vectorial HD', parentIndex: 4 },
      { text: 'Fase 3: Beta Abierta', subtitle: 'Julio – Septiembre', parentIndex: 0, icon: '🚀', progress: 25 },
      { text: 'Colaboración y Plantillas', parentIndex: 7 },
      { text: 'Optimización de Rendimiento', parentIndex: 7 },
      { text: 'Fase 4: Escalamiento Global', subtitle: 'Octubre – Diciembre', parentIndex: 0, icon: '🏆', progress: 0 },
      { text: 'Lanzamiento Oficial 2.0', parentIndex: 10 },
      { text: 'Integración Empresarial', parentIndex: 10 },
    ],
  },
  'beneficios nutricionales': {
    title: 'Beneficios de las Frutas y Nutrición Natural',
    type: 'mindmap',
    nodes: [
      { text: 'Beneficios de las Frutas', parentIndex: null, icon: '🍎' },
      { text: 'Aporte Vitamínico Esencial', parentIndex: 0, icon: '🍊', priority: 1 },
      { text: 'Fortalecimiento del sistema inmunológico mediante vitamina C natural', parentIndex: 1 },
      { text: 'Protección celular frente al estrés oxidativo diario', parentIndex: 1 },
      { text: 'Salud Cardiovascular', parentIndex: 0, icon: '❤️', priority: 2 },
      { text: 'Regulación equilibrada de la presión arterial gracias al potasio', parentIndex: 4 },
      { text: 'Reducción progresiva del colesterol mediante fibra soluble', parentIndex: 4 },
      { text: 'Hidratación y Digestión', parentIndex: 0, icon: '💧' },
      { text: 'Equilibrio de la microbiota intestinal y tránsito saludable', parentIndex: 7 },
      { text: 'Reposición natural de agua y minerales esenciales', parentIndex: 7 },
      { text: 'Energía y Vitalidad Diaria', parentIndex: 0, icon: '⚡' },
      { text: 'Glucosa de absorción gradual para el rendimiento cognitivo', parentIndex: 10 },
      { text: 'Prevención de la fatiga física en actividades prolongadas', parentIndex: 10 },
    ],
  },
  'gestion del tiempo': {
    title: 'Gestión Efectiva del Tiempo y Productividad',
    type: 'mindmap',
    nodes: [
      { text: 'Gestión del Tiempo', parentIndex: null, icon: '🕒' },
      { text: 'Definición de Prioridades', parentIndex: 0, icon: '🎯', priority: 1, progress: 100 },
      { text: 'Distinción clara entre tareas urgentes y objetivos estratégicos', parentIndex: 1 },
      { text: 'Enfoque diario en las tres metas de mayor impacto real', parentIndex: 1 },
      { text: 'Bloques de Enfoque Profundo', parentIndex: 0, icon: '🧠', priority: 2, progress: 75 },
      { text: 'Sesiones estructuradas sin interrupciones ni notificaciones', parentIndex: 4 },
      { text: 'Pausas activas programadas para sostener la claridad mental', parentIndex: 4 },
      { text: 'Sistemas de Organización', parentIndex: 0, icon: '📋', progress: 50 },
      { text: 'Planificación semanal anticipada de proyectos y entregables', parentIndex: 7 },
      { text: 'Delegación efectiva de procesos operativos recurrentes', parentIndex: 7 },
      { text: 'Control de Distracciones', parentIndex: 0, icon: '🛡️' },
      { text: 'Revisión agrupada de correos y mensajería en horarios fijos', parentIndex: 10 },
      { text: 'Auditoría periódica de hábitos que consumen energía', parentIndex: 10 },
    ],
  },
  'cultivo de plantas': {
    title: 'Guía de Cultivo y Cuidado Botánico',
    type: 'mindmap',
    nodes: [
      { text: 'Cultivo Sostenible de Plantas', parentIndex: null, icon: '🌱' },
      { text: 'Preparación del Sustrato', parentIndex: 0, icon: '🌍', priority: 1 },
      { text: 'Aireación equilibrada con materia orgánica y compost maduro', parentIndex: 1 },
      { text: 'Drenaje eficiente para prevenir el exceso de humedad radicular', parentIndex: 1 },
      { text: 'Iluminación y Clima', parentIndex: 0, icon: '☀️' },
      { text: 'Ubicación orientada según requerimiento de luz directa o filtrada', parentIndex: 4 },
      { text: 'Estabilidad térmica frente a corrientes frías y heladas', parentIndex: 4 },
      { text: 'Riego Inteligente', parentIndex: 0, icon: '💧', progress: 75 },
      { text: 'Verificación previa de la humedad real de la tierra antes de regar', parentIndex: 7 },
      { text: 'Ajuste estacional de frecuencia durante verano e invierno', parentIndex: 7 },
      { text: 'Mantenimiento y Salud', parentIndex: 0, icon: '✨' },
      { text: 'Poda formativa de hojas secas para estimular nuevos brotes', parentIndex: 10 },
      { text: 'Control ecológico preventivo frente a plagas comunes', parentIndex: 10 },
    ],
  },
  'marketing en internet': {
    title: 'Estrategia Integral de Marketing en Internet',
    type: 'logic',
    nodes: [
      { text: 'Marketing en Internet', parentIndex: null, icon: '🌐' },
      { text: 'Posicionamiento Orgánico SEO', parentIndex: 0, icon: '🔍', priority: 1, progress: 100 },
      { text: 'Investigación de intención de búsqueda y arquitectura semántica', parentIndex: 1 },
      { text: 'Optimización de velocidad web y experiencia en dispositivos móviles', parentIndex: 1 },
      { text: 'Estrategia de Contenidos', parentIndex: 0, icon: '✍️', priority: 2, progress: 75 },
      { text: 'Artículos educativos de alto valor orientados al cliente ideal', parentIndex: 4 },
      { text: 'Narrativa audiovisual breve para redes y comunidades digitales', parentIndex: 4 },
      { text: 'Campañas de Adquisición', parentIndex: 0, icon: '🚀', progress: 50 },
      { text: 'Segmentación precisa de audiencias con retorno medible', parentIndex: 7 },
      { text: 'Automatización de embudos de conversión por correo electrónico', parentIndex: 7 },
      { text: 'Analítica y Fidelización', parentIndex: 0, icon: '📊', progress: 25 },
      { text: 'Seguimiento de tasas de conversión y retención a largo plazo', parentIndex: 10 },
    ],
  },
  'circulos y radios': {
    title: 'Ecosistema de Transformación Digital',
    type: 'radial',
    nodes: [
      { text: 'Núcleo Digital', parentIndex: null, icon: '🫧' },
      { text: 'Experiencia del Usuario', parentIndex: 0, icon: '🎨' },
      { text: 'Interfaces intuitivas centradas en la accesibilidad universal', parentIndex: 1 },
      { text: 'Infraestructura en la Nube', parentIndex: 0, icon: '☁️' },
      { text: 'Escalabilidad elástica y disponibilidad continua de servicios', parentIndex: 3 },
      { text: 'Inteligencia de Datos', parentIndex: 0, icon: '📊' },
      { text: 'Decisiones respaldadas por métricas predictivas en tiempo real', parentIndex: 5 },
      { text: 'Ciberseguridad Activa', parentIndex: 0, icon: '🔒' },
      { text: 'Protección cifrada de identidades y activos críticos', parentIndex: 7 },
      { text: 'Cultura Ágil', parentIndex: 0, icon: '🤝' },
      { text: 'Iteración colaborativa orientada a la entrega continua de valor', parentIndex: 9 },
      { text: 'Automatización Inteligente', parentIndex: 0, icon: '🤖' },
      { text: 'Optimización de flujos operativos repetitivos sin fricción', parentIndex: 11 },
    ],
  },
  'matriz foda': {
    title: 'Matriz Estratégica de Bloques FODA',
    type: 'matrix',
    nodes: [
      { text: 'Análisis Estratégico FODA', parentIndex: null, icon: '🧭' },
      { text: 'Fortalezas Internas', parentIndex: 0, icon: '💎', priority: 1 },
      { text: 'Equipo multidisciplinario con alta capacidad de innovación propia', parentIndex: 1 },
      { text: 'Calidad reconocida del servicio y fidelidad sostenida de usuarios', parentIndex: 1 },
      { text: 'Oportunidades del Entorno', parentIndex: 0, icon: '🚀', priority: 2 },
      { text: 'Expansión acelerada hacia nuevos mercados digitales regionales', parentIndex: 4 },
      { text: 'Adopción de inteligencia artificial para personalizar soluciones', parentIndex: 4 },
      { text: 'Debilidades por Superar', parentIndex: 0, icon: '🛠️' },
      { text: 'Procesos administrativos internos que requieren mayor automatización', parentIndex: 7 },
      { text: 'Alcance limitado en canales de distribución tradicionales', parentIndex: 7 },
      { text: 'Amenazas Externas', parentIndex: 0, icon: '🛡️' },
      { text: 'Entrada de competidores globales con presupuestos agresivos', parentIndex: 10 },
      { text: 'Cambios regulatorios y variaciones económicas del sector', parentIndex: 10 },
    ],
  },
  'ciclo pdca': {
    title: 'Ciclo Continuo de Mejora de Calidad Deming',
    type: 'cycle',
    nodes: [
      { text: 'Mejora Continua', parentIndex: null, icon: '🔄' },
      { text: '1. Planificar Estrategia', parentIndex: 0, icon: '🧭' },
      { text: 'Identificar oportunidades de mejora y trazar metas medibles', parentIndex: 1 },
      { text: '2. Hacer e Implementar', parentIndex: 0, icon: '⚡' },
      { text: 'Ejecutar el plan piloto de manera controlada y documentada', parentIndex: 3 },
      { text: '3. Verificar Resultados', parentIndex: 0, icon: '📊' },
      { text: 'Evaluar los indicadores obtenidos frente a los objetivos iniciales', parentIndex: 5 },
      { text: '4. Actuar y Estandarizar', parentIndex: 0, icon: '🏆' },
      { text: 'Consolidar los aciertos como nuevo estándar y reiniciar el ciclo', parentIndex: 7 },
    ],
  },
  'flujo de algoritmos': {
    title: 'Diagrama de Flujo de Validación Algorítmica',
    type: 'flowchart',
    nodes: [
      { text: 'Inicio del Algoritmo', parentIndex: null, icon: '🏁', flowType: 'start' },
      { text: 'Lectura de Parámetros de Entrada', parentIndex: 0, icon: '📝', flowType: 'data' },
      { text: '¿Los Datos Tienen Formato Válido?', parentIndex: 1, icon: '❓', flowType: 'decision' },
      { text: 'Procesamiento Lógico y Cálculo Principal', parentIndex: 2, icon: '⚙️', flowType: 'process', label: 'Sí' },
      { text: 'Notificar Error y Solicitar Corrección', parentIndex: 2, icon: '⚠️', flowType: 'process', label: 'No' },
      { text: 'Almacenamiento Seguro del Resultado', parentIndex: 3, icon: '💾', flowType: 'data' },
      { text: 'Fin de la Ejecución', parentIndex: 5, icon: '✅', flowType: 'end' },
    ],
  },
  'mapa de procesos': {
    title: 'Mapa de Procesos de Atención Empresarial',
    type: 'flowchart',
    nodes: [
      { text: 'Inicio por Requerimiento del Cliente', parentIndex: null, icon: '🤝', flowType: 'start' },
      { text: 'Análisis de Necesidades y Cotización', parentIndex: 0, icon: '📊', flowType: 'data' },
      { text: '¿Propuesta Aprobada por el Cliente?', parentIndex: 1, icon: '⚖️', flowType: 'decision' },
      { text: 'Planificación y Producción del Servicio', parentIndex: 2, icon: '🚀', flowType: 'process', label: 'Sí' },
      { text: 'Ajuste Comercial de Alcance', parentIndex: 2, icon: '🔄', flowType: 'process', label: 'No' },
      { text: 'Control de Calidad y Entrega Final', parentIndex: 3, icon: '🏆', flowType: 'end' },
    ],
  },
  'genograma familiar': {
    title: 'Genograma y Estructura Relacional Familiar',
    type: 'tree',
    nodes: [
      { text: 'Núcleo Fundador Abuelos', parentIndex: null, icon: '🏛️' },
      { text: 'Rama Paterna Principal', parentIndex: 0, icon: '🤝' },
      { text: 'Vínculo de apoyo cohesivo y tradición profesional compartida', parentIndex: 1 },
      { text: 'Primera generación descendiente con residencia cercana', parentIndex: 1 },
      { text: 'Unidad Familiar Central', parentIndex: 0, icon: '❤️' },
      { text: 'Hijo Mayor en etapa universitaria de ciencias de la salud', parentIndex: 4 },
      { text: 'Hija Menor en formación escolar artística y deportiva', parentIndex: 4 },
      { text: 'Rama Materna Extendida', parentIndex: 0, icon: '🌱' },
      { text: 'Red de acompañamiento emocional e integración intergeneracional', parentIndex: 7 },
    ],
  },
  'arquitectura de red': {
    title: 'Diagrama de Bloques de Red e Infraestructura',
    type: 'tree',
    nodes: [
      { text: 'Puerta de Enlace y Cortafuegos Central', parentIndex: null, icon: '🛡️' },
      { text: 'Balanceador de Carga Principal', parentIndex: 0, icon: '🌐' },
      { text: 'Clúster de Servidores de Aplicación Web', parentIndex: 1, icon: '💻' },
      { text: 'Microservicios de Autenticación y Pagos', parentIndex: 1, icon: '🔒' },
      { text: 'Red Interna de Datos', parentIndex: 0, icon: '⚙️' },
      { text: 'Base de Datos Primaria de Alta Disponibilidad', parentIndex: 4, icon: '📊' },
      { text: 'Nodo de Réplica y Respaldo Automatizado', parentIndex: 4, icon: '☁️' },
    ],
  },
  'inteligencia emocional': {
    title: 'Cartografía Conceptual: Inteligencia Emocional',
    type: 'cartographic',
    nodes: [
      { text: 'Inteligencia Emocional', parentIndex: null, shape: 'rounded' },
      { text: '1. Ejemplificación', parentIndex: 0 },
      { text: 'un líder de equipo que escucha activamente durante una crisis laboral y transforma la tensión en acuerdos constructivos', label: 'se ejemplifica mediante', parentIndex: 1 },
      { text: '2. Noción', parentIndex: 0 },
      { text: 'la capacidad psicológica de reconocer, comprender y regular las emociones propias y ajenas para construir relaciones armónicas', label: 'se define como', parentIndex: 3 },
      { text: '3. Categorización', parentIndex: 0 },
      { text: 'el campo de las competencias socioemocionales y la psicología cognitivo-afectiva aplicada al desarrollo humano', label: 'pertenece a', parentIndex: 5 },
      { text: '4. Características', parentIndex: 0 },
      { text: 'la autoconciencia constante, el equilibrio ante la frustración, la empatía genuina y la asertividad comunicativa', label: 'se caracteriza por', parentIndex: 7 },
      { text: '5. Diferencias', parentIndex: 0 },
      { text: 'el coeficiente intelectual lógico-matemático tradicional y la simple represión pasiva de los estados afectivos', label: 'se distingue de', parentIndex: 9 },
      { text: '6. Subdivisión', parentIndex: 0 },
      { text: 'la dimensión intrapersonal orientada al autoconocimiento y la dimensión interpersonal enfocada en la empatía social', label: 'se subdivide en', parentIndex: 11 },
      { text: '7. Vinculación', parentIndex: 0 },
      { text: 'la neurociencia afectiva, la pedagogía humanista y el liderazgo organizacional contemporáneo', label: 'se vincula con', parentIndex: 13 },
      { text: '8. Metodología', parentIndex: 0 },
      { text: 'la observación consciente de reacciones diarias, la pausa reflexiva y el entrenamiento deliberado de la escucha empática', label: 'se aplica mediante', parentIndex: 15 },
    ],
  },
};

export async function generateOrganizer(
  req: AiGenerationRequest,
  themeId: ThemeId = 'vitality-warm'
): Promise<{
  title: string;
  type: OrganizerType;
  nodes: OrganizerNode[];
  edges: OrganizerEdge[];
}> {
  const normTopic = req.topic
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Integración con Google Gemini o OpenAI si el usuario configuró su clave
  if (req.apiKey && (req.provider === 'gemini' || !req.provider || req.provider === 'local')) {
    try {
      return await generateWithGemini(req, themeId);
    } catch (err: any) {
      console.warn('Error llamando a Google Gemini, usando motor local como respaldo:', err);
    }
  } else if (req.apiKey && req.provider === 'openai') {
    try {
      return await generateWithOpenAi(req, themeId);
    } catch (err: any) {
      console.warn('Error llamando a OpenAI, usando motor local como respaldo:', err);
    }
  }

  // 2. Si el usuario ingresó un esquema/apuntes multilínea, estructurarlo fielmente
  if (req.details && req.details.trim().includes('\n')) {
    return parseTextToOrganizer(req.topic.trim(), req.details, req.type, themeId);
  }

  // 3. Base de conocimiento curada de alta calidad (solo si coincide con exactitud y no hay detalles)
  if (!req.details || !req.details.trim()) {
    for (const [key, preset] of Object.entries(BUILTIN_KNOWLEDGE)) {
      if (normTopic === key || normTopic.startsWith(key) || key.startsWith(normTopic)) {
        return buildFromTemplate(
          preset.title,
          req.type || preset.type,
          preset.nodes,
          themeId,
          preset.crossLinks,
          req.includeImages !== false
        );
      }
    }
  }

  // 4. Generador semántico inteligente adaptado al tipo exacto de diagrama
  return generateHeuristicOrganizer(req, themeId);
}

function buildFromTemplate(
  title: string,
  type: OrganizerType,
  rawNodes: TemplateSeedNode[],
  themeId: ThemeId,
  crossLinks?: { fromIndex: number; toIndex: number; label: string }[],
  includeImages = true
) {
  const nodes: OrganizerNode[] = [];
  const edges: OrganizerEdge[] = [];
  const prefix = `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const isCarto = type === 'cartographic';

  rawNodes.forEach((rn, index) => {
    const id = `${prefix}-${index}`;
    const parentId = rn.parentIndex !== null ? `${prefix}-${rn.parentIndex}` : null;
    const isCartoChild = isCarto && rn.parentIndex !== null && rn.parentIndex !== 0;

    // Para cartografía conceptual: el cuadro de texto del eje permanece limpio (sin imagen interior).
    // Las imágenes se generan como un nodo exterior independiente enlazado con "se ilustra mediante".
    const hasExternalImage = isCarto && includeImages && isCartoChild;

    nodes.push({
      id,
      text: rn.text,
      subtitle: rn.subtitle,
      parentId,
      x: 0,
      y: 0,
      width: 140,
      height: 48,
      icon: isCarto ? undefined : rn.icon,
      shape: rn.shape,
      flowType: rn.flowType,
      priority: rn.priority,
      progress: rn.progress,
      notes: rn.notes,
      imageUrl: hasExternalImage ? undefined : rn.imageUrl,
      imagePrompt: hasExternalImage ? undefined : rn.imagePrompt,
      isRoot: index === 0,
    });

    if (parentId) {
      edges.push({
        id: `e-${id}`,
        from: parentId,
        to: id,
        label: rn.label,
      });
    }

    // Nuevo enlace externo para la imagen del punto
    if (hasExternalImage) {
      const parentAxis = rn.parentIndex !== null ? rawNodes[rn.parentIndex] : null;
      const caption = getCartographicImageCaption(parentAxis?.text || '');
      const promptText =
        rn.imagePrompt ||
        `${title} ${rn.text.slice(0, 70)} high resolution conceptual photo`;
      const imgUrl =
        rn.imageUrl || buildAiImageUrl(promptText, index * 41 + 101);
      const imgId = `${id}-img`;

      nodes.push({
        id: imgId,
        text: caption,
        parentId: id,
        isImageNode: true,
        imageUrl: imgUrl,
        imagePrompt: promptText,
        x: 0,
        y: 0,
        width: 220,
        height: 148,
        shape: 'rounded',
      });

      edges.push({
        id: `e-${imgId}`,
        from: id,
        to: imgId,
        label: 'se ilustra mediante',
      });
    }
  });

  if (crossLinks) {
    crossLinks.forEach((cl, i) => {
      if (nodes[cl.fromIndex] && nodes[cl.toIndex]) {
        edges.push({
          id: `cross-${prefix}-${i}`,
          from: nodes[cl.fromIndex].id,
          to: nodes[cl.toIndex].id,
          label: cl.label,
          isCrossLink: true,
          color: '#D97706',
        });
      }
    });
  }

  return {
    title,
    type,
    ...applyLayout(nodes, edges, type, themeId, true),
  };
}

function generateHeuristicOrganizer(req: AiGenerationRequest, themeId: ThemeId) {
  const topic = req.topic.trim() || 'Idea Central';
  const type = req.type || 'mindmap';
  const prefix = `h-${Date.now().toString(36)}`;

  if (type === 'cartographic') {
    const withImg = req.includeImages !== false;
    const seed: TemplateSeedNode[] = [
      { text: topic, subtitle: 'Cartografía Conceptual de Ocho Ejes', parentIndex: null, shape: 'rounded' },
      // 1. Ejemplificación
      { text: '1. Ejemplificación', parentIndex: 0 },
      {
        text: `un caso documentado y verificable donde se observa la aplicación práctica y resolución de problemas vinculados a ${topic}`,
        label: 'se ejemplifica mediante',
        parentIndex: 1,
        imagePrompt: `${topic} practical real world case study documentary photograph`,
        imageUrl: withImg ? buildAiImageUrl(`${topic} real world practical example documentary`, 101) : undefined,
      },
      // 2. Noción
      { text: '2. Noción', parentIndex: 0 },
      {
        text: `el significado etimológico y conceptual esencial que fundamenta y delimita el estudio riguroso de ${topic}`,
        label: 'se define como',
        parentIndex: 3,
        imagePrompt: `${topic} core scientific concept visual diagram`,
        imageUrl: withImg ? buildAiImageUrl(`${topic} core scientific definition concept diagram`, 202) : undefined,
      },
      // 3. Categorización
      { text: '3. Categorización', parentIndex: 0 },
      {
        text: `la disciplina o clase mayor del conocimiento humano en la que se inscribe y fundamenta ${topic}`,
        label: 'pertenece a',
        parentIndex: 5,
        imagePrompt: `${topic} broader academic field taxonomy classification`,
        imageUrl: withImg ? buildAiImageUrl(`${topic} academic taxonomy discipline classification`, 303) : undefined,
      },
      // 4. Características
      { text: '4. Características', parentIndex: 0 },
      {
        text: `los principios rectores, propiedades distintivas y rasgos esenciales que estructuran a ${topic}`,
        label: 'se caracteriza por',
        parentIndex: 7,
        imagePrompt: `${topic} distinctive features essential properties detailed view`,
        imageUrl: withImg ? buildAiImageUrl(`${topic} key distinctive characteristics detailed visual`, 404) : undefined,
      },
      // 5. Diferencias
      { text: '5. Diferencias', parentIndex: 0 },
      {
        text: `las nociones cercanas y enfoques paralelos de los cuales se distingue formalmente ${topic} para evitar confusiones`,
        label: 'se distingue de',
        parentIndex: 9,
        imagePrompt: `${topic} contrasting concepts clear distinction comparison`,
        imageUrl: withImg ? buildAiImageUrl(`${topic} contrasting comparison distinction visual`, 505) : undefined,
      },
      // 6. Subdivisión
      { text: '6. Subdivisión', parentIndex: 0 },
      {
        text: `las tipologías, clases y componentes internos fundamentales que integran la estructura de ${topic}`,
        label: 'se subdivide en',
        parentIndex: 11,
        imagePrompt: `${topic} internal structural components classification breakdown`,
        imageUrl: withImg ? buildAiImageUrl(`${topic} structural components types breakdown`, 606) : undefined,
      },
      // 7. Vinculación
      { text: '7. Vinculación', parentIndex: 0 },
      {
        text: `los marcos teóricos, leyes científicas y disciplinas complementarias que fortalecen a ${topic}`,
        label: 'se vincula con',
        parentIndex: 13,
        imagePrompt: `${topic} interconnected scientific laws complementary theories`,
        imageUrl: withImg ? buildAiImageUrl(`${topic} interconnected theories scientific network`, 707) : undefined,
      },
      // 8. Metodología
      { text: '8. Metodología', parentIndex: 0 },
      {
        text: `la secuencia ordenada de fases metodológicas y protocolos rigurosos para la implementación de ${topic}`,
        label: 'se aplica mediante',
        parentIndex: 15,
        imagePrompt: `${topic} step by step practical methodology experimental process`,
        imageUrl: withImg ? buildAiImageUrl(`${topic} experimental scientific process step by step`, 808) : undefined,
      },
    ];
    return buildFromTemplate(topic, type, seed, themeId);
  }

  if (type === 'flowchart') {
    const seed: TemplateSeedNode[] = [
      { text: `Inicio: ${topic}`, parentIndex: null, icon: '🏁', flowType: 'start' },
      { text: 'Recopilación de Datos y Contexto', parentIndex: 0, icon: '📝', flowType: 'data' },
      { text: '¿Cumple Criterios de Calidad?', parentIndex: 1, icon: '⚖️', flowType: 'decision' },
      { text: 'Ejecución e Implementación', parentIndex: 2, icon: '⚡', flowType: 'process', label: 'Sí' },
      { text: 'Ajuste y Optimización Previa', parentIndex: 2, icon: '🔄', flowType: 'process', label: 'No' },
      { text: 'Cierre y Validación de Resultados', parentIndex: 3, icon: '🏆', flowType: 'end' },
    ];
    return buildFromTemplate(topic, type, seed, themeId);
  }

  if (type === 'timeline') {
    const seed: TemplateSeedNode[] = [
      { text: topic, subtitle: 'Línea Cronológica', parentIndex: null, icon: '⏳' },
      { text: 'Etapa 1: Diagnóstico y Bases', subtitle: 'Inicio', parentIndex: 0, icon: '🌱', progress: 100 },
      { text: 'Análisis del contexto inicial', parentIndex: 1 },
      { text: 'Definición de objetivos clave', parentIndex: 1 },
      { text: 'Etapa 2: Planificación y Diseño', subtitle: 'Desarrollo', parentIndex: 0, icon: '🧭', progress: 75 },
      { text: 'Estructuración de recursos', parentIndex: 4 },
      { text: 'Validación de prototipo', parentIndex: 4 },
      { text: 'Etapa 3: Ejecución Estratégica', subtitle: 'Despliegue', parentIndex: 0, icon: '🚀', progress: 50 },
      { text: 'Implementación progresiva', parentIndex: 7 },
      { text: 'Control de indicadores', parentIndex: 7 },
      { text: 'Etapa 4: Consolidación y Mejora', subtitle: 'Meta', parentIndex: 0, icon: '🏆', progress: 25 },
      { text: 'Evaluación de impacto final', parentIndex: 10 },
    ];
    return buildFromTemplate(topic, type, seed, themeId);
  }

  if (type === 'fishbone') {
    const seed: TemplateSeedNode[] = [
      { text: topic, subtitle: 'Efecto Analizado', parentIndex: null, icon: '🎯' },
      { text: 'Métodos y Procesos', parentIndex: 0, icon: '📋' },
      { text: 'Estandarización insuficiente', parentIndex: 1 },
      { text: 'Cuellos de botella operativos', parentIndex: 1 },
      { text: 'Personas y Equipo', parentIndex: 0, icon: '👥' },
      { text: 'Capacitación requerida', parentIndex: 4 },
      { text: 'Coordinación entre áreas', parentIndex: 4 },
      { text: 'Tecnología y Equipos', parentIndex: 0, icon: '💻' },
      { text: 'Herramientas desactualizadas', parentIndex: 7 },
      { text: 'Falta de automatización', parentIndex: 7 },
      { text: 'Insumos y Datos', parentIndex: 0, icon: '📦' },
      { text: 'Calidad variable de entradas', parentIndex: 10 },
      { text: 'Información incompleta', parentIndex: 10 },
    ];
    return buildFromTemplate(topic, type, seed, themeId);
  }

  if (type === 'matrix') {
    const seed: TemplateSeedNode[] = [
      { text: topic, parentIndex: null, icon: '⊞' },
      { text: 'Fortalezas y Ventajas', parentIndex: 0, icon: '💎', priority: 1 },
      { text: `Capacidades internas consolidadas que respaldan el éxito de ${topic}`, parentIndex: 1 },
      { text: 'Recursos diferenciales de alto valor estratégico', parentIndex: 1 },
      { text: 'Oportunidades Clave', parentIndex: 0, icon: '🚀', priority: 2 },
      { text: `Tendencias favorables del entorno para potenciar ${topic}`, parentIndex: 4 },
      { text: 'Nuevos espacios de crecimiento e innovación', parentIndex: 4 },
      { text: 'Aspectos por Mejorar', parentIndex: 0, icon: '🛠️' },
      { text: 'Procesos internos que requieren optimización y refuerzo', parentIndex: 7 },
      { text: 'Limitaciones operativas identificadas a corto plazo', parentIndex: 7 },
      { text: 'Riesgos Externos', parentIndex: 0, icon: '🛡️' },
      { text: 'Factores competitivos o cambios externos que exigen prevención', parentIndex: 10 },
      { text: 'Contingencias del contexto que deben monitorearse', parentIndex: 10 },
    ];
    return buildFromTemplate(topic, type, seed, themeId);
  }

  if (type === 'cycle') {
    const seed: TemplateSeedNode[] = [
      { text: topic, parentIndex: null, icon: '🔄' },
      { text: '1. Diagnóstico Inicial', parentIndex: 0, icon: '🔍' },
      { text: `Evaluación integral del punto de partida para ${topic}`, parentIndex: 1 },
      { text: '2. Diseño y Planificación', parentIndex: 0, icon: '🧭' },
      { text: 'Definición de objetivos claros, recursos y hoja de acción', parentIndex: 3 },
      { text: '3. Ejecución Activa', parentIndex: 0, icon: '⚡' },
      { text: 'Implementación coordinada de las estrategias establecidas', parentIndex: 5 },
      { text: '4. Evaluación y Mejora', parentIndex: 0, icon: '🏆' },
      { text: 'Medición de resultados y retroalimentación del nuevo ciclo', parentIndex: 7 },
    ];
    return buildFromTemplate(topic, type, seed, themeId);
  }

  const pillars =
    req.depth === 'deep'
      ? [
          { name: 'Fundamentos y Concepto', icon: '💡', rel: 'se fundamenta en', items: ['Definición esencial', 'Antecedentes clave', 'Principios rectores'] },
          { name: 'Estructura y Componentes', icon: '🧩', rel: 'se compone de', items: ['Ejes principales', 'Arquitectura interna', 'Relaciones clave'] },
          { name: 'Metodología de Acción', icon: '⚙️', rel: 'opera mediante', items: ['Fase de diagnóstico', 'Implementación paso a paso', 'Control de calidad'] },
          { name: 'Aplicaciones Prácticas', icon: '🚀', rel: 'se aplica en', items: ['Casos reales destacados', 'Soluciones innovadoras', 'Herramientas clave'] },
          { name: 'Impacto y Futuro', icon: '📈', rel: 'genera', items: ['Beneficios medibles', 'Retos actuales', 'Tendencias emergentes'] },
        ]
      : [
          { name: 'Fundamentos Clave', icon: '💡', rel: 'comprende', items: ['Definición central', 'Principios esenciales'] },
          { name: 'Componentes Principales', icon: '🧩', rel: 'se divide en', items: ['Estructura base', 'Factores críticos'] },
          { name: 'Estrategia y Proceso', icon: '⚙️', rel: 'ejecuta', items: ['Planificación inicial', 'Desarrollo práctico'] },
          { name: 'Aplicaciones e Impacto', icon: '🚀', rel: 'produce', items: ['Casos de uso reales', 'Resultados esperados'] },
        ];

  const nodes: OrganizerNode[] = [
    {
      id: `${prefix}-root`,
      text: topic,
      x: 0,
      y: 0,
      width: 150,
      height: 52,
      isRoot: true,
      icon: '💡',
    },
  ];
  const edges: OrganizerEdge[] = [];

  let counter = 1;
  for (const p of pillars) {
    const pid = `${prefix}-${counter++}`;
    nodes.push({
      id: pid,
      text: p.name,
      parentId: `${prefix}-root`,
      x: 0,
      y: 0,
      width: 140,
      height: 46,
      icon: p.icon,
    });
    edges.push({
      id: `e-${pid}`,
      from: `${prefix}-root`,
      to: pid,
      label: type === 'concept' ? p.rel : undefined,
    });

    for (const item of p.items) {
      const sid = `${prefix}-${counter++}`;
      nodes.push({
        id: sid,
        text: item,
        parentId: pid,
        x: 0,
        y: 0,
        width: 130,
        height: 40,
      });
      edges.push({
        id: `e-${sid}`,
        from: pid,
        to: sid,
        label: type === 'concept' ? 'incluye' : undefined,
      });
    }
  }

  return {
    title: topic,
    type,
    ...applyLayout(nodes, edges, type, themeId, true),
  };
}

export function parseTextToOrganizer(
  title: string,
  rawText: string,
  type: OrganizerType,
  themeId: ThemeId = 'vitality-warm'
) {
  const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
  const prefix = `txt-${Date.now().toString(36)}`;
  const rootId = `${prefix}-0`;

  const nodes: OrganizerNode[] = [
    {
      id: rootId,
      text: title || 'Esquema Estructurado',
      x: 0,
      y: 0,
      width: 150,
      height: 52,
      isRoot: true,
      icon: '📌',
    },
  ];
  const edges: OrganizerEdge[] = [];

  const levelStack: { level: number; id: string }[] = [{ level: -1, id: rootId }];
  let counter = 1;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    let indentLevel = 0;
    let cleanText = '';

    if (headingMatch) {
      indentLevel = (headingMatch[1].length - 1) * 2;
      cleanText = headingMatch[2].trim();
    } else {
      const spaceMatch = line.match(/^(\s*)/);
      indentLevel = spaceMatch ? spaceMatch[1].replace(/\t/g, '  ').length : 0;
      cleanText = line.trim().replace(/^[-*•\d.)]+\s*/, '');
    }

    if (!cleanText) continue;

    while (levelStack.length > 1 && levelStack[levelStack.length - 1].level >= indentLevel) {
      levelStack.pop();
    }

    const parentId = levelStack[levelStack.length - 1].id;
    const nodeId = `${prefix}-${counter++}`;

    nodes.push({
      id: nodeId,
      text: cleanText,
      parentId,
      x: 0,
      y: 0,
      width: 130,
      height: 42,
    });
    edges.push({
      id: `e-${nodeId}`,
      from: parentId,
      to: nodeId,
      label: type === 'concept' ? 'comprende' : undefined,
    });

    levelStack.push({ level: indentLevel, id: nodeId });
  }

  return {
    title: title || 'Esquema Estructurado',
    type,
    ...applyLayout(nodes, edges, type, themeId, true),
  };
}

function cleanJsonResponse(rawText: string): any {
  if (!rawText) throw new Error('La respuesta de la IA está vacía.');
  let clean = rawText.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(clean);
}

export {
  cleanAndNaturalizeArgument,
  pruneRedundantConnectorNodes,
} from './graphCleaners';
import {
  cleanAndNaturalizeArgument,
  pruneRedundantConnectorNodes,
} from './graphCleaners';

function buildGeminiPrompt(req: AiGenerationRequest): string {
  const isCartographic = req.type === 'cartographic';

  const naturalLanguageDirectives = `
NORMAS ESTRICTAS DE REDACCIÓN NATURAL Y LENGUAJE FORMAL (OBLIGATORIAS):
1. PROHIBIDO TOTALMENTE EL USO DE DOS PUNTOS (:) DENTRO DE LOS CUADROS: NUNCA inicies un texto con "Definición conceptual:", "Origen etimológico:", "Propósito:", "Concepto:", "Características:", "Caso real:", etc. Escribe directamente la idea como un argumento continuo y fluido.
2. PROHIBIDO EL USO DE PARÉNTESIS (...): No pongas aclaraciones ni palabras entre paréntesis. Toda explicación debe redactarse de forma corrida e integrada con comas y nexos naturales.
3. CONECTORES TEXTUALES Y CONTINUIDAD SINTÁCTICA PERFECTA:
   En cada rama secundaria o cuadro de contenido, proporciona en "label" un conector textual o proposición verbal en minúscula (ej. "se define como", "deriva de", "se fundamenta en", "se clasifica en", "se distingue de", "comprende", "se caracteriza por", "conduce a", "se vincula con", "se manifiesta mediante", "se aplica mediante").
   El contenido del cuadro ("text") DEBE continuar gramaticalmente la frase del conector, de tal forma que al leer: [Nodo Padre] + [conector] + [cuadro hijo], se lea en voz alta como una sola oración continua, elegante, formal y con sentido perfecto en español.
   - Ejemplo CORRECTO:
     Padre: "2. Noción"
     label: "se define como"
     text: "la valoración integral y el reconocimiento del propio mérito que orienta la dignidad y la seguridad personal"
     Lectura: "2. Noción se define como la valoración integral y el reconocimiento del propio mérito..."
   - Ejemplo PROHIBIDO (robótico):
     label: "establece"
     text: "Definición conceptual: Juicio evaluativo (autoestima)..."
4. CERO SUBTÍTULOS EN CUADROS DE CONTENIDO:
   En las ramas secundarias y cuadros de contenido NO pongas "subtitle" (deja "subtitle": null o no envíes la propiedad). Prohibido poner frases como "Esencia psicológica", "Raíz lingüística", "Detalle explicativo", etc. Los cuadros deben ser limpios y enfocados en su argumento. Solo la idea central raíz puede llevar subtítulo.
5. LENGUAJE FORMAL, COMPRENSIBLE Y ARGUMENTATIVO: Redacta con estilo académico riguroso pero fácil de entender, con argumentos completos y fluidos.
6. PROHIBIDO ABSOLUTAMENTE CREAR CUADROS O NODOS INTERMEDIOS PARA LOS CONECTORES:
   - El conector va ÚNICAMENTE en la propiedad "label" de la línea o arista de conexión.
   - NUNCA crees un cuadro o nodo cuyo texto ("text") sea únicamente una palabra o frase de enlace (ej. NUNCA crees un cuadro con texto "como", "por", "pertenece a", "se define", "comprende", "integra", "es").
   - NUNCA pongas dos cuadros seguidos para conectar una misma idea (ej. [Eje] -> [como] -> [el proceso...] ESTÁ TERMINANTEMENTE PROHIBIDO).
   - Debe haber UN SOLO CUADRO de contenido conectado directamente al nodo padre con el conector sobre la línea en "label".`;

  let typeGuidance = '';
  switch (req.type) {
    case 'cartographic':
      typeGuidance = `
TIPO: Cartografía Conceptual (Metodología Pedagógica de los 8 Ejes de Sergio Tobón).
1. El nodo raíz DEBE ser exactamente "${req.topic}" con subtítulo "Cartografía Conceptual de Ocho Ejes".
2. DEBE tener exactamente los 8 ejes principales con sus nombres formales como hijos directos de la raíz:
   - "1. Ejemplificación"
   - "2. Noción"
   - "3. Categorización"
   - "4. Caracterización"
   - "5. Diferenciación"
   - "6. Subdivisión"
   - "7. Vinculación"
   - "8. Metodología"
3. ARQUITECTURA DE UN SOLO CUADRO DE CONTENIDO DIRECTO POR EJE (TOTAL EXACTO DE 17 NODOS: 1 raíz + 8 ejes + 8 cuadros de contenido):
   - Cada uno de los 8 ejes DEBE conectarse DIRECTAMENTE a su propio y único cuadro de contenido mediante la propiedad "label" de la conexión.
   - PROHIBIDO crear cuadros intermediarios para las palabras conectoras (como "como", "por", "pertenece a", etc.). El conector va en "label", NUNCA en un cuadro.
   - Eje "1. Ejemplificación" (hijo de raíz) -> conectado directamente mediante label "se ejemplifica mediante" a un único cuadro hijo con el caso práctico real documentado.
   - Eje "2. Noción" (hijo de raíz) -> conectado directamente mediante label "se define como" a un único cuadro hijo con el significado conceptual y etimológico esencial.
   - Eje "3. Categorización" (hijo de raíz) -> conectado directamente mediante label "pertenece a" a un único cuadro hijo con la clase o disciplina mayor que lo engloba.
   - Eje "4. Caracterización" (hijo de raíz) -> conectado directamente mediante label "se caracteriza por" a un único cuadro hijo con sus rasgos esenciales.
   - Eje "5. Diferenciación" (hijo de raíz) -> conectado directamente mediante label "se distingue de" a un único cuadro hijo con las nociones de las que se deslinda.
   - Eje "6. Subdivisión" (hijo de raíz) -> conectado directamente mediante label "se subdivide en" a un único cuadro hijo con sus componentes o clases internas.
   - Eje "7. Vinculación" (hijo de raíz) -> conectado directamente mediante label "se vincula con" a un único cuadro hijo con las leyes y teorías complementarias.
   - Eje "8. Metodología" (hijo de raíz) -> conectado directamente mediante label "se aplica mediante" a un único cuadro hijo con las fases y pasos de aplicación.
${req.includeImages !== false ? `4. ILUSTRACIONES VISUALES REPRESENTATIVAS PARA LOS 8 PUNTOS:
   Para CADA UNO de los 8 cuadros de contenido hijos, DEBES incluir la propiedad "imagePrompt" con una descripción precisa en inglés (de 6 a 12 palabras) que represente de forma exacta y visual lo descrito en ese punto (ej: para ejemplificación un caso real fotográfico, para noción un diagrama o vista satelital/conceptual de alta resolución, para metodología un procedimiento de campo o laboratorio). La plataforma generará automáticamente un nuevo enlace visual exterior ("se ilustra mediante") conectado a ese cuadro con la imagen correspondiente.` : ''}
5. En Cartografía Conceptual NO uses emojis ni iconos en ningún nodo.
6. Los cuadros hijos NO deben tener "subtitle" (deja "subtitle": null).`;
      break;

    case 'concept':
      typeGuidance = `
TIPO: Mapa Conceptual de Joseph Novak.
REGLAS:
1. Conceptos y proposiciones argumentativas claras sin dos puntos ni paréntesis.
2. Cada conector entre nodos DEBE tener en "label" una proposición o verbo relacionador claro en minúscula (ej. "comprende", "produce", "depende de", "se clasifica en", "se manifiesta mediante", "requiere de").
3. Estructura piramidal con 3 o 4 niveles jerárquicos donde cada conexión se lee como una oración completa.
4. Los cuadros secundarios NO deben tener "subtitle" (deja "subtitle": null).`;
      break;

    case 'timeline':
      typeGuidance = `
TIPO: Línea de Tiempo Cronológica e Histórica.
REGLAS:
1. La raíz es el proceso o hito global.
2. Cada evento o etapa lleva en "text" la descripción argumentativa de lo ocurrido sin paréntesis ni dos puntos iniciales.
3. El campo "subtitle" solo se usa para el año o fecha exacta (ej. "1969", "Siglo XIX").
4. Ordenación estrictamente cronológica.`;
      break;

    case 'fishbone':
      typeGuidance = `
TIPO: Diagrama de Causa y Efecto Ishikawa (Espina de Pescado 6M).
REGLAS:
1. La raíz es el problema o efecto analizado.
2. Las ramas de primer nivel deben ser las categorías 6M ("Métodos", "Mano de Obra", "Materiales", "Maquinaria", "Medición", "Medio Ambiente").
3. Bajo cada categoría, añade de 2 a 3 causas raíz redactadas como argumentos formales sin dos puntos ni paréntesis.
4. Los cuadros de causa NO deben tener "subtitle" (deja "subtitle": null).`;
      break;

    case 'synoptic':
      typeGuidance = `
TIPO: Cuadro Sinóptico Académico con Llaves.
REGLAS:
1. Jerarquía limpia de izquierda a derecha: Tema Central -> Ideas Principales -> Ideas Secundarias -> Detalles.
2. Cada cuadro con un argumento fluido y formal sin dos puntos ni paréntesis.
3. Los cuadros de detalle NO deben tener "subtitle" (deja "subtitle": null).`;
      break;

    case 'tree':
      typeGuidance = `
TIPO: Organigrama Jerárquico / Estructural.
REGLAS:
1. Estructura ejecutiva de liderazgo a unidades operativas.
2. El campo "text" contiene el nombre del área o rol, redactado de forma formal y comprensible sin dos puntos ni paréntesis.
3. Los cuadros de nivel 2 o inferior NO deben tener subtítulos artificiales.`;
      break;

    case 'flowchart':
      typeGuidance = `
TIPO: Diagrama de Flujo de Procesos.
REGLAS:
1. El nodo inicial debe tener "flowType": "start".
2. Pasos operativos sucesivos con "flowType": "process", "decision", "data" o "end".
3. Redacta las acciones de forma natural y directa sin dos puntos ni paréntesis.
4. Las decisiones ("decision") deben ramificar con "label": "Sí" y "label": "No".`;
      break;

    default: // mindmap, logic
      typeGuidance = `
TIPO: Mapa Mental Radial Equilibrado / Mapa Lógico.
REGLAS:
1. Desarrolla entre 4 y 6 ramas temáticas principales bien diferenciadas.
2. Cada rama principal debe tener sub-ramas con argumentos fluidos y proposiciones conectivas naturales en "label".
3. Prohibido usar dos puntos iniciales o paréntesis en los cuadros.
4. Los cuadros secundarios NO deben tener "subtitle" (deja "subtitle": null).`;
      break;
  }

  return `Actúa como diseñador experto en organizadores visuales y arquitectura conceptual de información estilo EdrawMax.
Genera un organizador visual completo, profundo, analítico y pedagógico en español sobre el tema: "${req.topic}".
Detalles adicionales del usuario: ${req.details || 'Ninguno (desarrolla de forma profunda y profesional)'}.
Profundidad: ${req.depth || 'deep'}.

${naturalLanguageDirectives}

${typeGuidance}

Devuelve ÚNICAMENTE un objeto JSON válido (sin texto antes o después ni marcas markdown) con el siguiente formato:
{
  "title": "${req.topic}",
  "nodes": [
    {
      "id": "1",
      "text": "${req.topic}",
      "subtitle": "${isCartographic ? 'Cartografía Conceptual de Ocho Ejes' : 'Idea Central'}",
      "parentId": null${isCartographic ? '' : ',\n      "icon": "🧠"'}
    },
    {
      "id": "2",
      "text": "${isCartographic ? '2. Noción' : 'Aspecto Fundamental'}",
      "parentId": "1"${isCartographic ? '' : ',\n      "icon": "💡"'}
    },
    {
      "id": "3",
      "text": "el argumento fluido que continúa naturalmente el conector sobre la línea sin cuadros intermediarios",
      "parentId": "2",
      "label": "${isCartographic ? 'se define como' : 'se fundamenta en'}"${isCartographic ? ',\n      "imagePrompt": "scientific infrared satellite map pacific ocean heat anomaly"' : ',\n      "icon": "✨"'}
    }
  ]
}`;
}

export const GEMINI_PREFERRED_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

/** Valida rápidamente si una clave de API de Gemini es funcional */
export async function testGeminiApiKey(apiKey: string): Promise<{
  success: boolean;
  model?: string;
  error?: string;
}> {
  const key = apiKey.trim();
  if (!key) {
    return { success: false, error: 'Por favor ingresa una clave de API válida.' };
  }

  const models = GEMINI_PREFERRED_MODELS;
  let lastErr = '';

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Responde exclusivamente con el JSON: {"status":"ok"}' }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (res.ok) {
        return { success: true, model };
      }

      const errBody = await res.json().catch(() => null);
      lastErr =
        errBody?.error?.message ||
        `Error HTTP ${res.status}: ${res.statusText}`;
    } catch (e: any) {
      lastErr = e?.message || 'Error de conexión con los servidores de Google.';
    }
  }

  return { success: false, error: lastErr || 'No se pudo conectar con los modelos de Gemini.' };
}

async function generateWithGemini(req: AiGenerationRequest, themeId: ThemeId) {
  const prompt = buildGeminiPrompt(req);
  const models = GEMINI_PREFERRED_MODELS;
  let lastError: Error | null = null;
  const isCartographic = req.type === 'cartographic';

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(req.apiKey!)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.35,
            },
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        const msg = errBody?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        lastError = new Error(msg);
        console.warn(`Modelo ${model} devolvió error:`, msg);
        continue;
      }

      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) {
        lastError = new Error(`Respuesta vacía del modelo ${model}`);
        continue;
      }

      const parsed = cleanJsonResponse(raw);
      if (!parsed || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
        lastError = new Error('El JSON devuelto no contiene una lista de nodos válida.');
        continue;
      }

      const nodes: OrganizerNode[] = [];
      const edges: OrganizerEdge[] = [];

      parsed.nodes.forEach((n: any, idx: number) => {
        const id = String(n.id || `g-${idx}`);
        const pId = n.parentId ? String(n.parentId) : null;
        const isRootNode = !pId || idx === 0;

        // Limpiar y naturalizar texto argumentativo y conector textual (cero dos puntos, cero paréntesis y cero subtítulos robóticos en cuadros)
        const naturalized = cleanAndNaturalizeArgument(
          String(n.text || 'Tema'),
          n.label,
          isRootNode
        );

        const rootIdInParsed = parsed.nodes[0]?.id ? String(parsed.nodes[0].id) : '1';
        const isCartographicChild = isCartographic && pId && pId !== rootIdInParsed;
        const hasExternalImage = isCartographic && req.includeImages !== false && isCartographicChild;

        nodes.push({
          id,
          text: naturalized.text,
          subtitle: isRootNode ? (n.subtitle ? String(n.subtitle).trim() : undefined) : undefined,
          parentId: pId,
          x: 0,
          y: 0,
          width: 140,
          height: 46,
          icon: isCartographic ? undefined : n.icon,
          shape: n.shape,
          flowType: n.flowType,
          imageUrl: hasExternalImage ? undefined : (n.imageUrl ? String(n.imageUrl) : undefined),
          imagePrompt: hasExternalImage ? undefined : (n.imagePrompt ? String(n.imagePrompt).trim() : undefined),
          isRoot: isRootNode,
        });

        if (pId) {
          edges.push({
            id: `eg-${id}`,
            from: pId,
            to: id,
            label: naturalized.label,
          });
        }

        // Nuevo enlace externo para la imagen representativa del punto
        if (hasExternalImage) {
          const parentNode = parsed.nodes.find((pn: any) => String(pn.id) === pId);
          const caption = getCartographicImageCaption(parentNode ? String(parentNode.text || '') : '');
          let promptDesc = n.imagePrompt ? String(n.imagePrompt).trim() : '';
          if (!promptDesc) {
            promptDesc = `${req.topic} ${naturalized.text.slice(0, 70)} high resolution conceptual photo`;
          }
          const imgUrl = n.imageUrl ? String(n.imageUrl) : buildAiImageUrl(promptDesc, idx * 37 + 101);
          const imgNodeId = `${id}-img`;

          nodes.push({
            id: imgNodeId,
            text: caption,
            parentId: id,
            isImageNode: true,
            imageUrl: imgUrl,
            imagePrompt: promptDesc,
            x: 0,
            y: 0,
            width: 220,
            height: 148,
            shape: 'rounded',
          });

          edges.push({
            id: `eg-${imgNodeId}`,
            from: id,
            to: imgNodeId,
            label: 'se ilustra mediante',
          });
        }
      });

      if (Array.isArray(parsed.crossLinks)) {
        parsed.crossLinks.forEach((cl: any, clIdx: number) => {
          if (cl.from && cl.to) {
            edges.push({
              id: `cl-${clIdx}-${Date.now().toString(36)}`,
              from: String(cl.from),
              to: String(cl.to),
              label: cl.label || 'se relaciona con',
              isCrossLink: true,
              color: '#D97706',
            });
          }
        });
      }

      return {
        title: parsed.title || req.topic,
        type: req.type,
        ...applyLayout(nodes, edges, req.type, themeId, true),
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Error llamando a Gemini con modelo ${model}:`, err);
    }
  }

  throw lastError || new Error('No se pudo conectar con los modelos de Google Gemini.');
}

async function generateWithOpenAi(req: AiGenerationRequest, themeId: ThemeId) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Genera un organizador visual en español en JSON con {"title": "...", "nodes": [{"id":"1","text":"...","subtitle":"...","parentId":null,"icon":"💡","label":"..."}]}',
        },
        {
          role: 'user',
          content: `Tipo: ${req.type}. Tema: ${req.topic}. Detalles: ${req.details || ''}`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
  const data = await response.json();
  const parsed = cleanJsonResponse(data.choices[0].message.content);

  const nodes: OrganizerNode[] = [];
  const edges: OrganizerEdge[] = [];
  parsed.nodes.forEach((n: any, idx: number) => {
    const id = String(n.id || `o-${idx}`);
    const pId = n.parentId ? String(n.parentId) : null;
    const isRootNode = !pId || idx === 0;

    const naturalized = cleanAndNaturalizeArgument(
      String(n.text || 'Tema'),
      n.label,
      isRootNode
    );

    const isCartographic = req.type === 'cartographic';
    const isCartographicChild = isCartographic && pId && pId !== '1';
    const hasExternalImage = isCartographic && req.includeImages !== false && isCartographicChild;

    nodes.push({
      id,
      text: naturalized.text,
      subtitle: isRootNode ? (n.subtitle ? String(n.subtitle).trim() : undefined) : undefined,
      parentId: pId,
      x: 0,
      y: 0,
      width: 140,
      height: 46,
      icon: req.type === 'cartographic' ? undefined : n.icon,
      imageUrl: hasExternalImage ? undefined : (n.imageUrl ? String(n.imageUrl) : undefined),
      imagePrompt: hasExternalImage ? undefined : (n.imagePrompt ? String(n.imagePrompt).trim() : undefined),
      isRoot: isRootNode,
    });
    if (pId) {
      edges.push({ id: `eo-${id}`, from: pId, to: id, label: naturalized.label });
    }

    if (hasExternalImage) {
      const parentNode = parsed.nodes.find((pn: any) => String(pn.id) === pId);
      const caption = getCartographicImageCaption(parentNode ? String(parentNode.text || '') : '');
      const promptDesc =
        n.imagePrompt ? String(n.imagePrompt).trim() : `${req.topic} ${naturalized.text.slice(0, 70)} high resolution conceptual photo`;
      const imgUrl = n.imageUrl ? String(n.imageUrl) : buildAiImageUrl(promptDesc, idx * 37 + 101);
      const imgNodeId = `${id}-img`;

      nodes.push({
        id: imgNodeId,
        text: caption,
        parentId: id,
        isImageNode: true,
        imageUrl: imgUrl,
        imagePrompt: promptDesc,
        x: 0,
        y: 0,
        width: 220,
        height: 148,
        shape: 'rounded',
      });

      edges.push({
        id: `eo-${imgNodeId}`,
        from: id,
        to: imgNodeId,
        label: 'se ilustra mediante',
      });
    }
  });

  return {
    title: parsed.title || req.topic,
    type: req.type,
    ...applyLayout(nodes, edges, req.type, themeId, true),
  };
}

/** Consulta a Google Gemini para ramificar inteligentemente un nodo con argumentos naturales y formales */
async function expandNodeWithGemini(
  node: OrganizerNode,
  lineageContext: string,
  type: OrganizerType,
  projectTitle: string | undefined,
  apiKey: string
): Promise<Array<{ text: string; subtitle?: string; label?: string; icon?: string }>> {
  const isCartographic = type === 'cartographic';
  const models = GEMINI_PREFERRED_MODELS;

  const prompt = `Eres un redactor académico y pedagógico experto en organizadores visuales y mapas estructurados estilo EdrawMax.
El usuario está profundizando el tema "${projectTitle || 'Diagrama'}" sobre el nodo:
- Texto del nodo: "${node.text}"
${node.subtitle ? `- Subtítulo actual: "${node.subtitle}"` : ''}
- Contexto de la rama: "${lineageContext}"

Genera entre 2 y 3 nuevas sub-ramificaciones lógicas formuladas como argumentos formales, claros y continuos en español.

NORMAS ESTRICTAS DE LENGUAJE Y NATURALIDAD:
1. PROHIBIDO USAR DOS PUNTOS (:): NUNCA inicies un texto con etiquetas como "Definición:", "Concepto:", "Propósito:", "Ejemplo:", etc. Escribe directamente el argumento.
2. PROHIBIDO USAR PARÉNTESIS (...): No pongas aclaraciones entre paréntesis; redacta de forma corrida integrando las ideas con comas y nexos naturales.
3. CONEXIÓN SINTÁCTICA NATURAL CON EL CONECTOR: En "label" coloca un conector textual o proposición verbal en minúscula (ej. "se define como", "se fundamenta en", "se manifiesta en", "se distingue de", "comprende", "conduce a", "se vincula con", "se aplica mediante"). El texto del cuadro ("text") DEBE continuar gramaticalmente el conector para que al leer [Nodo] + [conector] + [cuadro] se lea en voz alta como una sola oración fluida, elegante y con sentido completo.
4. CERO SUBTÍTULOS: No incluyas "subtitle" en las sub-ramas; los cuadros deben lucir limpios y humanos.
${isCartographic ? '5. En Cartografía Conceptual NO uses emojis ni iconos en ningún campo.' : '5. "icon": Emoji opcional pertinente.'}

Devuelve ÚNICAMENTE un objeto JSON válido con este formato:
{
  "branches": [
    {
      "text": "el argumento fluido que continúa naturalmente el conector",
      "label": "se fundamenta en"${isCartographic ? '' : ',\n      "icon": "💡"'}
    }
  ]
}`;

  let lastErr: Error | null = null;
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.35,
            },
          }),
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        lastErr = new Error(errJson?.error?.message || `HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) continue;

      const parsed = cleanJsonResponse(raw);
      if (Array.isArray(parsed.branches) && parsed.branches.length > 0) {
        return parsed.branches.map((b: any) => {
          const naturalized = cleanAndNaturalizeArgument(
            String(b.text || 'Subtema'),
            b.label,
            false
          );
          return {
            text: naturalized.text,
            subtitle: undefined,
            label: naturalized.label,
            icon: isCartographic ? undefined : b.icon,
          };
        });
      }
    } catch (e: any) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('No se pudo obtener ramificaciones de Gemini.');
}

/** Generador semántico local enriquecido cuando no hay API conectada o en modo sin conexión */
function generateLocalSemanticBranches(
  node: OrganizerNode,
  type: OrganizerType
): Array<{ text: string; subtitle?: string; label?: string; icon?: string }> {
  const baseTopic = node.text.replace(/^\d+\.\s*/, '').trim();

  if (type === 'cartographic') {
    const isEjemplo = node.text.includes('Ejemplificación');
    const isNocion = node.text.includes('Noción');
    const isCat = node.text.includes('Categorización');
    const isCaract = node.text.includes('Características') || node.text.includes('Caracterización');
    const isDif = node.text.includes('Diferencias') || node.text.includes('Diferenciación');
    const isSub = node.text.includes('Subdivisión');
    const isVinc = node.text.includes('Vinculación');
    const isMetod = node.text.includes('Metodología');

    if (isEjemplo) {
      return [
        { text: 'un caso documentado y representativo donde se aprecia su impacto y aplicación real', label: 'se ejemplifica mediante' },
        { text: 'la resolución práctica de una problemática concreta y verificable en su contexto', label: 'se demuestra en' },
      ];
    }
    if (isNocion) {
      return [
        { text: 'el significado conceptual esencial y las raíces etimológicas que delimitan con rigor el término', label: 'se define como' },
        { text: 'la evolución histórica y transformaciones teóricas que moldearon su comprensión actual', label: 'comprende' },
      ];
    }
    if (isCat) {
      return [
        { text: 'la disciplina o campo mayor del saber científico en el cual se inserta su fundamentación', label: 'pertenece a' },
        { text: 'las áreas interdisciplinarias directas con las que interactúa y comparte fronteras teóricas', label: 'se vincula con' },
      ];
    }
    if (isCaract) {
      return [
        { text: 'los principios rectores y leyes conceptuales que definen su estructura intrínseca', label: 'se caracteriza por' },
        { text: 'los patrones operativos observables que permiten verificar su consistencia en la práctica', label: 'se manifiesta mediante' },
      ];
    }
    if (isDif) {
      return [
        { text: 'las nociones cercanas y términos paralelos para evitar confusiones de significado', label: 'se distingue de' },
        { text: 'los límites conceptuales que establecen una separación rigurosa frente a conceptos afines', label: 'establece fronteras con' },
      ];
    }
    if (isSub) {
      return [
        { text: 'las tipologías y variantes internas estructuradas según el contexto de aplicación', label: 'se subdivide en' },
        { text: 'los módulos y subsistemas constitutivos que integran su cuerpo operativo', label: 'se compone de' },
      ];
    }
    if (isVinc) {
      return [
        { text: 'los marcos teóricos y leyes científicas que respaldan su validez explicativa', label: 'se fundamenta en' },
        { text: 'las contribuciones bibliográficas fundamentales de autores y escuelas de pensamiento', label: 'se nutre de' },
      ];
    }
    if (isMetod) {
      return [
        { text: 'la secuencia metódica de fases estructuradas para su aplicación efectiva', label: 'se aplica mediante' },
        { text: 'las herramientas de evaluación y criterios de verificación de resultados alcanzados', label: 'se evalúa con' },
      ];
    }

    return [
      { text: `los fundamentos teóricos y principios que justifican el estudio riguroso de ${baseTopic}`, label: 'se fundamenta en' },
      { text: 'los criterios metodológicos y herramientas operativas para su puesta en marcha', label: 'se instrumenta con' },
      { text: 'los indicadores verificables de impacto y consistencia en el entorno real', label: 'conduce a' },
    ];
  }

  if (type === 'timeline') {
    return [
      { text: `la fase preliminar de diagnóstico y levantamiento de requerimientos para ${baseTopic}`, label: 'inicia con' },
      { text: 'el despliegue operativo central y la coordinación de acciones estratégicas', label: 'continúa con' },
      { text: 'la consolidación de resultados finales y auditoría de impacto alcanzado', label: 'culmina en' },
    ];
  }

  if (type === 'tree') {
    return [
      { text: `la dirección estratégica y coordinación integral para ${baseTopic}`, label: 'supervisa a' },
      { text: 'la unidad técnica especializada en operaciones y desarrollo', label: 'coordina a' },
      { text: 'el equipo de aseguramiento de calidad y cumplimiento normativo', label: 'audita a' },
    ];
  }

  if (type === 'fishbone') {
    return [
      { text: `la ausencia de protocolos estandarizados y actualizados para el seguimiento del proceso`, label: 'causado por' },
      { text: 'la dispersión de prioridades y sobrecarga de actividades sin herramientas adecuadas', label: 'asociado a' },
      { text: 'las fluctuaciones no controladas en las condiciones del entorno operativo', label: 'debido a' },
    ];
  }

  if (type === 'concept') {
    return [
      { text: `los componentes esenciales y principios rectores del sistema`, label: 'comprende' },
      { text: `las reglas formativas y normativas que dirigen su comportamiento`, label: 'determina' },
      { text: `un impacto concreto y verificable en la resolución de problemáticas del área`, label: 'conduce a' },
    ];
  }

  if (type === 'flowchart') {
    return [
      { text: `Revisar y verificar las condiciones iniciales para ${baseTopic}`, label: 'requiere' },
      { text: 'Ejecutar las acciones estandarizadas del procedimiento', label: 'luego' },
      { text: 'Registrar la conformidad y validar el cierre formal del proceso', label: 'finalmente' },
    ];
  }

  // Mapa mental, lógico, sinóptico
  return [
    { text: `los fundamentos conceptuales y directrices estratégicas de ${baseTopic}`, label: 'se fundamenta en', icon: '📌' },
    { text: 'las acciones prioritarias y metodologías para una ejecución efectiva', label: 'se implementa con', icon: '⚡' },
    { text: 'los mecanismos de seguimiento y optimización continua de resultados', label: 'conduce a', icon: '📊' },
  ];
}

/** Expande un nodo agregando 3-4 nuevas sub-ramificaciones lógicas (vía Gemini API o motor semántico local) */
export async function expandNodeWithAi(
  node: OrganizerNode,
  currentNodes: OrganizerNode[],
  currentEdges: OrganizerEdge[],
  type: OrganizerType,
  themeId: ThemeId = 'vitality-warm',
  apiSettings?: Partial<ApiSettings>,
  projectTitle?: string,
  cartographicDirection: 'clockwise' | 'counterclockwise' = 'clockwise'
): Promise<{ nodes: OrganizerNode[]; edges: OrganizerEdge[]; count: number }> {
  // Construir contexto de linaje ascendente
  const lineage: string[] = [];
  let curr: OrganizerNode | undefined = node;
  while (curr?.parentId) {
    const parent = currentNodes.find(n => n.id === curr!.parentId);
    if (parent) {
      lineage.unshift(parent.text);
      curr = parent;
    } else {
      break;
    }
  }
  const lineageContext =
    lineage.length > 0 ? lineage.join(' > ') : projectTitle || 'Diagrama';

  let branches: Array<{ text: string; subtitle?: string; label?: string; icon?: string }> = [];

  // 1. Intentar llamar a Google Gemini si hay clave configurada
  if (apiSettings?.geminiApiKey && apiSettings.geminiApiKey.trim()) {
    try {
      branches = await expandNodeWithGemini(
        node,
        lineageContext,
        type,
        projectTitle,
        apiSettings.geminiApiKey.trim()
      );
    } catch (err) {
      console.warn('Gemini expand falló, usando motor semántico local:', err);
    }
  }

  // 2. Respaldo semántico inteligente si no hubo respuesta de API
  if (branches.length === 0) {
    branches = generateLocalSemanticBranches(node, type);
  }

  const newNodes = currentNodes.map(n =>
    n.id === node.id ? { ...n, collapsed: false } : n
  );
  const newEdges = [...currentEdges];
  const stamp = Date.now();
  const isCartographic = type === 'cartographic';

  branches.forEach((branch, idx) => {
    const newId = `node-ai-${stamp}-${idx}`;
    const branchColor = node.color || PALETTES[idx % PALETTES.length];

    const naturalized = cleanAndNaturalizeArgument(branch.text, branch.label, false);

    newNodes.push({
      id: newId,
      text: naturalized.text,
      subtitle: undefined, // Cero subtítulos robóticos en cuadros de contenido
      parentId: node.id,
      x: node.x,
      y: node.y,
      width: 140,
      height: 44,
      color: branchColor,
      icon: isCartographic ? undefined : branch.icon,
    });

    newEdges.push({
      id: `edge-ai-${stamp}-${idx}`,
      from: node.id,
      to: newId,
      color: branchColor,
      label: naturalized.label || (type === 'concept' ? 'comprende' : undefined),
    });
  });

  const relaid = applyLayout(
    newNodes,
    newEdges,
    type,
    themeId,
    false,
    cartographicDirection
  );
  return {
    nodes: relaid.nodes,
    edges: relaid.edges,
    count: branches.length,
  };
}
