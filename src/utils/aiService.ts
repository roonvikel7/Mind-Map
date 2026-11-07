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
        text: 'Los 14 principios de Fayol (1880) se siguen usando en la actualidad en la gestión de capital y liquidez.',
        parentIndex: 1,
      },
      // 2. Noción (Noreste)
      { text: '2. Noción', parentIndex: 0 },
      {
        text: 'A principios del siglo XX la gestión financiera se separa de la administración como una ciencia propia.',
        parentIndex: 3,
      },
      // 3. Categorización (Este medio-alto)
      { text: '3. Categorización', parentIndex: 0 },
      {
        text: 'Pertenece a las ciencias económico-administrativas y a la toma de decisiones estratégicas de recursos.',
        parentIndex: 5,
      },
      // 4. Características (Este medio-bajo)
      { text: '4. Características', parentIndex: 0 },
      {
        text: 'Optimización de rentabilidad, control estricto de riesgos, liquidez operativa y sostenibilidad a largo plazo.',
        parentIndex: 7,
      },
      // 5. Diferencias (Sureste)
      { text: '5. Diferencias', parentIndex: 0 },
      {
        text: 'Se diferencia de la Contabilidad (registro histórico) y de la Economía (análisis macro) por su enfoque directivo.',
        parentIndex: 9,
      },
      // 6. Subdivisión (Sur)
      { text: '6. Subdivisión', parentIndex: 0 },
      {
        text: 'Administración de personal, tesorería, mercado de capitales y valoración de inversiones.',
        parentIndex: 11,
      },
      // 7. Vinculación (Suroeste)
      { text: '7. Vinculación', parentIndex: 0 },
      {
        text: 'Weber, la administración científica de Taylor y la psicología en la administración de Mayo.',
        parentIndex: 13,
      },
      // 8. Metodología (Oeste)
      { text: '8. Metodología', parentIndex: 0 },
      {
        text: 'Diagnóstico de problemas de contexto, aplicación rigurosa de la teoría en la práctica y control financiero.',
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
        text: 'Los 14 principios de Fayol (1880) se siguen usando en la actualidad en la gestión de capital y liquidez.',
        parentIndex: 1,
      },
      { text: '2. Noción', parentIndex: 0 },
      {
        text: 'A principios del siglo XX la gestión financiera se separa de la administración como una ciencia propia.',
        parentIndex: 3,
      },
      { text: '3. Categorización', parentIndex: 0 },
      {
        text: 'Pertenece a las ciencias económico-administrativas y a la toma de decisiones estratégicas de recursos.',
        parentIndex: 5,
      },
      { text: '4. Características', parentIndex: 0 },
      {
        text: 'Optimización de rentabilidad, control estricto de riesgos, liquidez operativa y sostenibilidad a largo plazo.',
        parentIndex: 7,
      },
      { text: '5. Diferencias', parentIndex: 0 },
      {
        text: 'Se diferencia de la Contabilidad (registro histórico) y de la Economía (análisis macro) por su enfoque directivo.',
        parentIndex: 9,
      },
      { text: '6. Subdivisión', parentIndex: 0 },
      {
        text: 'Administración de personal, tesorería, mercado de capitales y valoración de inversiones.',
        parentIndex: 11,
      },
      { text: '7. Vinculación', parentIndex: 0 },
      {
        text: 'Weber, la administración científica de Taylor y la psicología en la administración de Mayo.',
        parentIndex: 13,
      },
      { text: '8. Metodología', parentIndex: 0 },
      {
        text: 'Diagnóstico de problemas de contexto, aplicación rigurosa de la teoría en la práctica y control financiero.',
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
      { text: 'Género Lírico', subtitle: 'Subjetividad y emoción', parentIndex: 0, icon: '✍️' },
      { text: 'Oda e Himno', parentIndex: 1 },
      { text: 'Soneto y Elegía', parentIndex: 1 },
      { text: 'Égloga y Madrigal', parentIndex: 1 },
      { text: 'Género Narrativo', subtitle: 'Relato de sucesos', parentIndex: 0, icon: '📖' },
      { text: 'Novela Contemporánea', parentIndex: 5 },
      { text: 'Cuento y Microrrelato', parentIndex: 5 },
      { text: 'Mito, Leyenda y Fábula', parentIndex: 5 },
      { text: 'Género Dramático', subtitle: 'Representación escénica', parentIndex: 0, icon: '🎭' },
      { text: 'Tragedia Clásica', parentIndex: 9 },
      { text: 'Comedia de Costumbres', parentIndex: 9 },
      { text: 'Drama Moderno', parentIndex: 9 },
      { text: 'Género Didáctico', subtitle: 'Reflexión y divulgación', parentIndex: 0, icon: '🎓' },
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
          preset.crossLinks
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
  crossLinks?: { fromIndex: number; toIndex: number; label: string }[]
) {
  const nodes: OrganizerNode[] = [];
  const edges: OrganizerEdge[] = [];
  const prefix = `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

  rawNodes.forEach((rn, index) => {
    const id = `${prefix}-${index}`;
    const parentId = rn.parentIndex !== null ? `${prefix}-${rn.parentIndex}` : null;

    nodes.push({
      id,
      text: rn.text,
      subtitle: rn.subtitle,
      parentId,
      x: 0,
      y: 0,
      width: 140,
      height: 48,
      icon: rn.icon,
      shape: rn.shape,
      flowType: rn.flowType,
      priority: rn.priority,
      progress: rn.progress,
      notes: rn.notes,
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
    const seed: TemplateSeedNode[] = [
      { text: topic, subtitle: 'Cartografía Conceptual de Ocho Ejes', parentIndex: null, shape: 'rounded' },
      { text: '1. Ejemplificación', parentIndex: 0 },
      { text: `Caso de estudio real y aplicación histórica de ${topic}.`, parentIndex: 1 },
      { text: '2. Noción', parentIndex: 0 },
      { text: `Etimología, definición esencial y origen conceptual de ${topic}.`, parentIndex: 3 },
      { text: '3. Categorización', parentIndex: 0 },
      { text: `Clase o disciplina mayor a la que pertenece ${topic}.`, parentIndex: 5 },
      { text: '4. Características', parentIndex: 0 },
      { text: `Rasgos distintivos, elementos y principios rectores de ${topic}.`, parentIndex: 7 },
      { text: '5. Diferencias', parentIndex: 0 },
      { text: `Conceptos cercanos o paralelos de los cuales se diferencia ${topic}.`, parentIndex: 9 },
      { text: '6. Subdivisión', parentIndex: 0 },
      { text: `Tipologías, ramas, fases o componentes internos de ${topic}.`, parentIndex: 11 },
      { text: '7. Vinculación', parentIndex: 0 },
      { text: `Relación interdisciplinaria, teorías de apoyo y autores clave.`, parentIndex: 13 },
      { text: '8. Metodología', parentIndex: 0 },
      { text: `Pasos de aplicación práctica y resolución de problemas de contexto.`, parentIndex: 15 },
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

function buildGeminiPrompt(req: AiGenerationRequest): string {
  const isCartographic = req.type === 'cartographic';

  let typeGuidance = '';
  switch (req.type) {
    case 'cartographic':
      typeGuidance = `
TIPO: Cartografía Conceptual (Metodología Pedagógica de los 8 Ejes de Sergio Tobón).
REGLAS ESTRICTAS DE CALIDAD Y FORMALIDAD:
1. El nodo raíz DEBE ser exactamente "${req.topic}" con subtítulo "Cartografía Conceptual de Ocho Ejes".
2. DEBE tener exactamente 8 ejes principales con la numeración formal:
   - "1. Ejemplificación" (Caso real o aplicación práctica)
   - "2. Noción" (Definición etimológica y esencial)
   - "3. Categorización" (Disciplina o clase mayor a la que pertenece)
   - "4. Características" (Rasgos distintivos y principios rectores)
   - "5. Diferencias" (De qué otros conceptos se distingue o no debe confundirse)
   - "6. Subdivisión" (Tipologías, componentes o ramas internas)
   - "7. Vinculación" (Teorías, autores interdisciplinarios y disciplinas de apoyo)
   - "8. Metodología" (Pasos o protocolo de aplicación práctica en contexto)
3. Bajo CADA uno de los 8 ejes, agrega 1 o 2 subnodos detallados con una explicación conceptual sólida en "text" y un resumen en "subtitle".
4. REGLA OBLIGATORIA: En la Cartografía Conceptual NO uses emojis ni iconos en ningún nodo. Mantén un formato formal académico.`;
      break;

    case 'concept':
      typeGuidance = `
TIPO: Mapa Conceptual de Joseph Novak.
REGLAS:
1. Conceptos breves y precisos en cada nodo (de 1 a 4 palabras).
2. Cada conector entre nodos DEBE tener en "label" una proposición o verbo relacionador claro (ej. "comprende", "produce", "depende de", "se clasifica en").
3. Estructura piramidal con 3 o 4 niveles jerárquicos.`;
      break;

    case 'timeline':
      typeGuidance = `
TIPO: Línea de Tiempo Cronológica e Histórica.
REGLAS:
1. La raíz es el proceso o hito global.
2. Cada evento o etapa DEBE llevar en el campo "subtitle" el año, fecha exacta o período (ej. "1969", "Etapa 1: Mes 1", "Siglo XIX").
3. Ordenación estrictamente cronológica.`;
      break;

    case 'fishbone':
      typeGuidance = `
TIPO: Diagrama de Causa y Efecto Ishikawa (Espina de Pescado 6M).
REGLAS:
1. La raíz es el problema o efecto analizado.
2. Las ramas de primer nivel deben ser las categorías 6M ("Métodos", "Mano de Obra", "Materiales", "Maquinaria", "Medición", "Medio Ambiente").
3. Bajo cada categoría, añade de 2 a 3 causas raíz específicas con un "subtitle" que explique el impacto o factor causante.`;
      break;

    case 'synoptic':
      typeGuidance = `
TIPO: Cuadro Sinóptico Académico con Llaves.
REGLAS:
1. Jerarquía limpia de izquierda a derecha: Tema Central -> Ideas Principales -> Ideas Secundarias -> Detalles y Ejemplos.
2. Cada nodo con texto conciso y "subtitle" complementario.`;
      break;

    case 'tree':
      typeGuidance = `
TIPO: Organigrama Jerárquico / Estructural.
REGLAS:
1. Estructura ejecutiva de liderazgo a unidades operativas.
2. El campo "subtitle" DEBE contener el cargo o función (ej. "Dirección General", "Gerencia de Operaciones", "Líder Técnico").`;
      break;

    case 'flowchart':
      typeGuidance = `
TIPO: Diagrama de Flujo de Procesos.
REGLAS:
1. El nodo inicial debe tener "flowType": "start".
2. Pasos operativos sucesivos con "flowType": "process", "decision", "data" o "end".
3. Las decisiones ("decision") deben ramificar con "label": "Sí" y "label": "No".`;
      break;

    default: // mindmap, logic
      typeGuidance = `
TIPO: Mapa Mental Radial Equilibrado / Mapa Lógico.
REGLAS:
1. Desarrolla entre 4 y 6 ramas temáticas principales bien diferenciadas.
2. Cada rama principal debe tener de 2 a 3 niveles de sub-ramas ricas en contenido, con títulos claros y subtítulos explicativos.`;
      break;
  }

  return `Actúa como diseñador experto en organizadores visuales y arquitectura conceptual de información estilo EdrawMax.
Genera un organizador visual completo, profundo, analítico y pedagógico en español sobre el tema: "${req.topic}".
Detalles adicionales del usuario: ${req.details || 'Ninguno (desarrolla de forma profunda y profesional)'}.
Profundidad: ${req.depth || 'deep'}.

${typeGuidance}

Devuelve ÚNICAMENTE un objeto JSON válido (sin texto antes o después ni marcas markdown) con el siguiente formato:
{
  "title": "${req.topic}",
  "nodes": [
    {
      "id": "1",
      "text": "Idea Central",
      "subtitle": "Subtítulo descriptivo opcional",
      "parentId": null${isCartographic ? '' : ',\n      "icon": "🧠"'}
    },
    {
      "id": "2",
      "text": "Rama 1",
      "subtitle": "Detalle explicativo",
      "parentId": "1",
      "label": "verbo conector opcional"${isCartographic ? '' : ',\n      "icon": "💡"'}
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
        nodes.push({
          id,
          text: String(n.text || 'Tema').trim(),
          subtitle: n.subtitle ? String(n.subtitle).trim() : undefined,
          parentId: pId,
          x: 0,
          y: 0,
          width: 140,
          height: 46,
          icon: isCartographic ? undefined : n.icon,
          shape: n.shape,
          flowType: n.flowType,
          isRoot: !pId || idx === 0,
        });

        if (pId) {
          edges.push({
            id: `eg-${id}`,
            from: pId,
            to: id,
            label: n.label,
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
    nodes.push({
      id,
      text: n.text || 'Tema',
      subtitle: n.subtitle,
      parentId: pId,
      x: 0,
      y: 0,
      width: 140,
      height: 46,
      icon: req.type === 'cartographic' ? undefined : n.icon,
      isRoot: !pId || idx === 0,
    });
    if (pId) {
      edges.push({ id: `eo-${id}`, from: pId, to: id, label: n.label });
    }
  });

  return {
    title: parsed.title || req.topic,
    type: req.type,
    ...applyLayout(nodes, edges, req.type, themeId, true),
  };
}

/** Consulta a Google Gemini para ramificar inteligentemente un nodo con subtemas y subtítulos */
async function expandNodeWithGemini(
  node: OrganizerNode,
  lineageContext: string,
  type: OrganizerType,
  projectTitle: string | undefined,
  apiKey: string
): Promise<Array<{ text: string; subtitle?: string; label?: string; icon?: string }>> {
  const isCartographic = type === 'cartographic';
  const models = GEMINI_PREFERRED_MODELS;

  const prompt = `Eres un experto pedagógico en organizadores visuales estilo EdrawMax.
El usuario está editando un organizador visual de tipo "${type}" titulado "${projectTitle || 'Diagrama'}".
Desea ramificar y profundizar el nodo seleccionado:
- Título actual: "${node.text}"
${node.subtitle ? `- Subtítulo actual: "${node.subtitle}"` : ''}
- Contexto de la rama padre: "${lineageContext}"

Genera exactamente entre 3 y 4 nuevas sub-ramificaciones lógicas, profundas, coherentes y específicas que deriven de este nodo.
Para CADA sub-rama proporciona:
1. "text": Título conciso del concepto o subtema (máx 5-7 palabras).
2. "subtitle": Subtítulo explicativo, dato clave, fecha, cargo, métrica o detalle complementario de apoyo (máx 8-12 palabras).
3. "label": Proposición conectora opcional (útil si es mapa conceptual).
${isCartographic ? 'REGLA ESTRICTA: NO uses emojis ni iconos en los textos ni en campos "icon".' : '4. "icon": Emoji pertinente opcional.'}

Devuelve ÚNICAMENTE un objeto JSON válido con este formato:
{
  "branches": [
    {
      "text": "Subtema generado",
      "subtitle": "Explicación o detalle clave",
      "label": "comprende"${isCartographic ? '' : ',\n      "icon": "💡"'}
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
              temperature: 0.4,
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
        return parsed.branches.map((b: any) => ({
          text: String(b.text || 'Subtema').trim(),
          subtitle: b.subtitle ? String(b.subtitle).trim() : undefined,
          label: b.label ? String(b.label).trim() : undefined,
          icon: isCartographic ? undefined : b.icon,
        }));
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
    const isCaract = node.text.includes('Características');
    const isDif = node.text.includes('Diferencias');
    const isSub = node.text.includes('Subdivisión');
    const isVinc = node.text.includes('Vinculación');
    const isMetod = node.text.includes('Metodología');

    if (isEjemplo) {
      return [
        { text: 'Caso de Estudio Contemporáneo', subtitle: 'Aplicación empírica en organizaciones líderes y precedentes' },
        { text: 'Demostración Práctica Documentada', subtitle: 'Evidencia cuantificable de resolución de problemas en contexto' },
      ];
    }
    if (isNocion) {
      return [
        { text: 'Etimología y Definición Esencial', subtitle: 'Raíz conceptual y delimitación epistemológica precisa' },
        { text: 'Evolución Histórica del Concepto', subtitle: 'Transformación del significado a través de las etapas clave' },
      ];
    }
    if (isCat) {
      return [
        { text: 'Clase o Disciplina Matriz', subtitle: 'Ubicación taxonómica dentro del corpus científico general' },
        { text: 'Campos Conexos Directos', subtitle: 'Áreas del saber con las que comparte fronteras teóricas' },
      ];
    }
    if (isCaract) {
      return [
        { text: 'Principios Rectores Fundamentales', subtitle: 'Leyes y normativas conceptuales inmutables' },
        { text: 'Rasgos Operativos Diferenciadores', subtitle: 'Patrones específicos observables en la práctica' },
      ];
    }
    if (isDif) {
      return [
        { text: 'Conceptos Cercanos o Paralelos', subtitle: 'Términos con los que suele confundirse en el uso cotidiano' },
        { text: 'Límites y Distinciones Críticas', subtitle: 'Criterios formales para una separación rigurosa' },
      ];
    }
    if (isSub) {
      return [
        { text: 'Componentes Primarios de la Estructura', subtitle: 'Módulos o subsistemas constitutivos esenciales' },
        { text: 'Tipologías y Variantes Especializadas', subtitle: 'Clasificación interna según contexto de aplicación' },
      ];
    }
    if (isVinc) {
      return [
        { text: 'Teorías Científicas de Soporte', subtitle: 'Marcos explicativos y modelos interdisciplinarios' },
        { text: 'Autores y Obras de Referencia', subtitle: 'Aportes bibliográficos y escuelas de pensamiento' },
      ];
    }
    if (isMetod) {
      return [
        { text: 'Fases del Protocolo de Acción', subtitle: 'Secuencia ordenada de etapas para implementación' },
        { text: 'Instrumentos y Métricas de Control', subtitle: 'Herramientas de evaluación y verificación de resultados' },
      ];
    }

    return [
      { text: `Fundamentación de ${baseTopic}`, subtitle: 'Marco teórico y justificación científica' },
      { text: `Instrumentación Operativa`, subtitle: 'Criterios de aplicación y desarrollo metodológico' },
      { text: `Evaluación de Consistencia`, subtitle: 'Métricas de impacto y control de calidad' },
    ];
  }

  if (type === 'timeline') {
    return [
      { text: `Fase 1: Preparación de ${baseTopic}`, subtitle: 'Hito Inicial • Diagnóstico y requerimientos' },
      { text: `Fase 2: Ejecución y Despliegue`, subtitle: 'Hito Central • Operación y seguimiento' },
      { text: `Fase 3: Auditoría y Resultados`, subtitle: 'Hito Final • Evaluación y consolidación' },
    ];
  }

  if (type === 'tree') {
    return [
      { text: `Área de Coordinación`, subtitle: 'Supervisión Estratégica' },
      { text: `Unidad de Ejecución Técnica`, subtitle: 'Operaciones de Campo' },
      { text: `Aseguramiento de Calidad`, subtitle: 'Control y Compliance' },
    ];
  }

  if (type === 'fishbone') {
    return [
      { text: `Procedimientos Desactualizados`, subtitle: 'Falta de estandarización en procesos clave' },
      { text: `Limitación de Recursos`, subtitle: 'Brechas de capacitación y herramientas' },
      { text: `Variabilidad del Entorno`, subtitle: 'Factores externos no controlados' },
    ];
  }

  if (type === 'concept') {
    return [
      { text: `Elemento Constitutivo`, subtitle: 'Componente nuclear del sistema', label: 'comprende' },
      { text: `Principio de Acción`, subtitle: 'Regla rectora del comportamiento', label: 'determina' },
      { text: `Impacto Observable`, subtitle: 'Resultado verificable en la práctica', label: 'produce' },
    ];
  }

  if (type === 'flowchart') {
    return [
      { text: `Verificación Inicial de ${baseTopic}`, subtitle: 'Comprobación de condiciones previas' },
      { text: `Protocolo de Ejecución`, subtitle: 'Paso operativo estandarizado' },
      { text: `Cierre y Validación`, subtitle: 'Registro formal y bitácora' },
    ];
  }

  // Mapa mental, lógico, sinóptico
  return [
    { text: `Aspectos Clave de ${baseTopic}`, subtitle: 'Fundamentos estructurales y directrices', icon: '📌' },
    { text: `Estrategia e Implementación`, subtitle: 'Acciones prácticas para ejecución efectiva', icon: '⚡' },
    { text: `Monitoreo y Resultados`, subtitle: 'Indicadores de desempeño y optimización continua', icon: '📊' },
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
  projectTitle?: string
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

    newNodes.push({
      id: newId,
      text: branch.text,
      subtitle: branch.subtitle,
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
      label: branch.label || (type === 'concept' ? 'comprende' : undefined),
    });
  });

  const relaid = applyLayout(newNodes, newEdges, type, themeId, false);
  return {
    nodes: relaid.nodes,
    edges: relaid.edges,
    count: branches.length,
  };
}
