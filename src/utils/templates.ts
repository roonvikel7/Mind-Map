import type {
  OrganizerEdge,
  OrganizerNode,
  OrganizerProject,
  OrganizerType,
  ThemeId,
} from '../types/organizer';
import { generateOrganizer } from './aiService';

export interface CartographicAxisDef {
  name: string;
  connector: string;
  childContent: string;
  icon?: string;
}

export const CARTOGRAPHIC_EIGHT_AXES: CartographicAxisDef[] = [
  {
    name: '1. Ejemplificación',
    connector: 'se ejemplifica mediante',
    childContent:
      'un caso documentado donde la teoría se aplicó con éxito para resolver una problemática real en su contexto',
    icon: '💡',
  },
  {
    name: '2. Noción',
    connector: 'se define como',
    childContent:
      'el significado etimológico y conceptual esencial que delimita con precisión el campo de acción del término',
    icon: '📖',
  },
  {
    name: '3. Categorización',
    connector: 'pertenece a',
    childContent:
      'la clase o disciplina mayor del conocimiento que engloba su estudio y fundamentación teórica',
    icon: '🗂️',
  },
  {
    name: '4. Caracterización',
    connector: 'se caracteriza por',
    childContent:
      'los rasgos distintivos y principios rectores que estructuran su funcionamiento y validez conceptual',
    icon: '✨',
  },
  {
    name: '5. Diferenciación',
    connector: 'se distingue de',
    childContent:
      'otros conceptos y nociones cercanas estableciendo fronteras claras para evitar confusiones epistemológicas',
    icon: '⚖️',
  },
  {
    name: '6. Subdivisión',
    connector: 'se subdivide en',
    childContent:
      'las tipologías, clases o componentes fundamentales que integran su estructura interna',
    icon: '🧩',
  },
  {
    name: '7. Vinculación',
    connector: 'se vincula con',
    childContent:
      'las leyes, modelos científicos y disciplinas complementarias que fortalecen su aplicación práctica',
    icon: '🔗',
  },
  {
    name: '8. Metodología',
    connector: 'se aplica mediante',
    childContent:
      'la secuencia ordenada de fases y procedimientos rigurosos para su implementación efectiva',
    icon: '🧭',
  },
];

export function buildCartographicProjectNodes(
  title: string,
  rootId?: string,
  existingRoot?: OrganizerNode
): { nodes: OrganizerNode[]; edges: OrganizerEdge[] } {
  const stamp = Date.now();
  const actualRootId = rootId || existingRoot?.id || `root-${stamp}`;

  const rootNode: OrganizerNode = {
    ...(existingRoot || {}),
    id: actualRootId,
    text: title.trim() || existingRoot?.text || 'Cartografía Conceptual',
    subtitle: 'Cartografía Conceptual de Ocho Ejes',
    x: 0,
    y: 0,
    width: Math.max(180, existingRoot?.width || 200),
    height: Math.max(56, existingRoot?.height || 60),
    isRoot: true,
    depth: 0,
    icon: existingRoot?.icon || '🧭',
  };

  const nodes: OrganizerNode[] = [rootNode];
  const edges: OrganizerEdge[] = [];

  CARTOGRAPHIC_EIGHT_AXES.forEach((axis, idx) => {
    const axisId = `axis-${actualRootId}-${idx + 1}`;
    const childId = `content-${actualRootId}-${idx + 1}`;

    const axisNode: OrganizerNode = {
      id: axisId,
      parentId: actualRootId,
      text: axis.name,
      subtitle: undefined,
      x: 0,
      y: 0,
      width: 175,
      height: 52,
      depth: 1,
      icon: axis.icon,
    };

    const childNode: OrganizerNode = {
      id: childId,
      parentId: axisId,
      text: axis.childContent,
      subtitle: undefined,
      x: 0,
      y: 0,
      width: 185,
      height: 52,
      depth: 2,
    };

    nodes.push(axisNode, childNode);

    edges.push({
      id: `edge-${actualRootId}-${axisId}`,
      from: actualRootId,
      to: axisId,
    });

    edges.push({
      id: `edge-${axisId}-${childId}`,
      from: axisId,
      to: childId,
      label: axis.connector,
    });
  });

  return { nodes, edges };
}

export function isCartographicStructure(nodes: OrganizerNode[]): boolean {
  if (!nodes || nodes.length < 9) return false;
  const root = nodes.find(n => n.isRoot || (n.depth || 0) === 0);
  if (!root) return false;
  const directChildren = nodes.filter(n => n.parentId === root.id);
  if (directChildren.length < 8) return false;
  const keywords = [
    'noción',
    'categorización',
    'caracter',
    'diferencia',
    'subdivisión',
    'vinculación',
    'metodología',
    'ejemplificación',
  ];
  const matches = directChildren.filter(c =>
    keywords.some(k => c.text.toLowerCase().includes(k))
  );
  return matches.length >= 6;
}

export type TemplateCategory =
  | 'all'
  | 'mindmap'
  | 'flowchart'
  | 'academic'
  | 'business'
  | 'strategy';

export const TEMPLATE_CATEGORY_META: {
  id: TemplateCategory;
  label: string;
  emoji: string;
}[] = [
  { id: 'all', label: 'Para ti (Todo)', emoji: '✨' },
  { id: 'mindmap', label: 'Mapas Mentales y Radios', emoji: '🧠' },
  { id: 'academic', label: 'Cartografía y Estudio', emoji: '🧭' },
  { id: 'flowchart', label: 'Flujo y Ciclos', emoji: '⚡' },
  { id: 'business', label: 'Organigrama y Red', emoji: '🏛️' },
  { id: 'strategy', label: 'FODA, Calidad y Gantt', emoji: '📊' },
];

export interface TemplateCard {
  id: string;
  title: string;
  queryKey: string;
  type: OrganizerType;
  theme: ThemeId;
  category: Exclude<TemplateCategory, 'all'>;
  description: string;
  badge: string;
  icon: string;
  featured?: boolean;
}

export const TEMPLATE_CARDS: TemplateCard[] = [
  // === ACADÉMICOS Y CARTOGRAFÍA CONCEPTUAL ===
  {
    id: 'tpl-cartographic-fin',
    title: 'Cartografía Conceptual: Administración Financiera',
    queryKey: 'administracion financiera',
    type: 'cartographic',
    theme: 'vitality-warm',
    category: 'academic',
    description:
      'Mapa académico simétrico 1-3-1-3 de los 8 ejes de Sergio Tobón con conectores naturales y argumentación formal.',
    badge: 'Tobón • 8 Ejes',
    icon: '🧭',
    featured: true,
  },
  {
    id: 'tpl-cartographic-emo',
    title: 'Cartografía Conceptual: Inteligencia Emocional',
    queryKey: 'inteligencia emocional',
    type: 'cartographic',
    theme: 'edraw-azure',
    category: 'academic',
    description:
      'Desarrollo integral de los 8 ejes conceptuales sobre autorregulación, empatía y habilidades socioemocionales.',
    badge: 'Psicología • 8 Ejes',
    icon: '💡',
  },
  {
    id: 'tpl-synoptic',
    title: 'Cuadro Sinóptico: Géneros Literarios',
    queryKey: 'sinoptico',
    type: 'synoptic',
    theme: 'academic-classic',
    category: 'academic',
    description:
      'Llaves caligráficas grupales { perfectamente calibradas para clasificar ramas principales y subcategorías.',
    badge: 'Académico • Llaves',
    icon: '🗂️',
    featured: true,
  },
  {
    id: 'tpl-concept',
    title: 'Mapa Conceptual: La Fotosíntesis',
    queryKey: 'fotosintesis',
    type: 'concept',
    theme: 'nature-sage',
    category: 'academic',
    description:
      'Jerarquía científica Novak con proposiciones sobre cada conector direccional y separación anticolisión.',
    badge: 'Ciencia • Novak',
    icon: '🌱',
    featured: true,
  },

  // === MAPAS MENTALES, LÓGICOS Y CÍRCULOS Y RADIOS (EDRAWMAX) ===
  {
    id: 'tpl-mindmap-ai',
    title: 'Mapa Mental: Inteligencia Artificial',
    queryKey: 'inteligencia artificial',
    type: 'mindmap',
    theme: 'vitality-warm',
    category: 'mindmap',
    description:
      'Distribución equilibrada izquierda y derecha con prioridades P1-P2, indicadores de avance y relación cruzada.',
    badge: 'Mapa Mental • IA',
    icon: '🧠',
    featured: true,
  },
  {
    id: 'tpl-mindmap-fruits',
    title: 'Mapa Mental: Beneficios de las Frutas',
    queryKey: 'beneficios nutricionales',
    type: 'mindmap',
    theme: 'nature-sage',
    category: 'mindmap',
    description:
      'Plantilla clásica estilo EdrawMax con ramas nutricionales claras sobre energía celular, antioxidantes y salud.',
    badge: 'Salud • EdrawMax',
    icon: '🍎',
  },
  {
    id: 'tpl-mindmap-time',
    title: 'Mapa Mental: Gestión del Tiempo',
    queryKey: 'gestion del tiempo',
    type: 'mindmap',
    theme: 'edraw-azure',
    category: 'mindmap',
    description:
      'Organizador de productividad personal con bloques de foco profundo, priorización y balance diario.',
    badge: 'Productividad',
    icon: '⏰',
  },
  {
    id: 'tpl-mindmap-plants',
    title: 'Mapa Mental: Cultivo de Plantas',
    queryKey: 'cultivo de plantas',
    type: 'mindmap',
    theme: 'nature-sage',
    category: 'mindmap',
    description:
      'Guía visual botánica sobre sustratos, iluminación, riego equilibrado y mantenimiento preventivo.',
    badge: 'Botánica • Estudio',
    icon: '🌿',
  },
  {
    id: 'tpl-logic-marketing',
    title: 'Mapa Lógico: Marketing en Internet',
    queryKey: 'marketing en internet',
    type: 'logic',
    theme: 'edraw-azure',
    category: 'mindmap',
    description:
      'Árbol lógico hacia la derecha sobre posicionamiento orgánico, campañas de conversión y fidelización digital.',
    badge: 'Marketing Digital',
    icon: '📣',
  },
  {
    id: 'tpl-logic-saas',
    title: 'Mapa Lógico: Lanzamiento de Producto SaaS',
    queryKey: 'mapa logico',
    type: 'logic',
    theme: 'edraw-underline',
    category: 'mindmap',
    description:
      'Desglose ejecutivo de izquierda a derecha con el estilo de ramas subrayadas minimalistas de EdrawMax.',
    badge: 'Estrategia • SaaS',
    icon: '🚀',
    featured: true,
  },
  {
    id: 'tpl-radial-ecosystem',
    title: 'Círculos y Radios: Transformación Digital',
    queryKey: 'circulos y radios',
    type: 'radial',
    theme: 'edraw-azure',
    category: 'mindmap',
    description:
      'Diagrama satelital 360° de burbujas concéntricas ideal para ecosistemas tecnológicos, lluvias de ideas y pilares.',
    badge: 'Círculos y Radios',
    icon: '🫧',
    featured: true,
  },

  // === DIAGRAMAS DE FLUJO, PROCESOS Y CICLOS (EDRAWMAX) ===
  {
    id: 'tpl-flowchart-algo',
    title: 'Diagrama de Flujo de Algoritmos',
    queryKey: 'flujo de algoritmos',
    type: 'flowchart',
    theme: 'edraw-azure',
    category: 'flowchart',
    description:
      'Secuencia algorítmica estructurada con inicio, lectura de variables, rombo de validación condicional y salida.',
    badge: 'Algoritmos • ISO',
    icon: '⚡',
    featured: true,
  },
  {
    id: 'tpl-flowchart-support',
    title: 'Diagrama de Flujo: Atención de Incidencias',
    queryKey: 'flujo',
    type: 'flowchart',
    theme: 'miro-pastel',
    category: 'flowchart',
    description:
      'Flujo operativo de soporte técnico con triaje inicial, bifurcación Sí / No y cierre verificado.',
    badge: 'Soporte • Flujo',
    icon: '🛠️',
  },
  {
    id: 'tpl-flowchart-process',
    title: 'Mapa de Procesos: Pedido E-Commerce',
    queryKey: 'mapa de procesos',
    type: 'flowchart',
    theme: 'minimal-slate',
    category: 'flowchart',
    description:
      'Recorrido logístico completo desde la solicitud del cliente y control de inventario hasta la entrega final.',
    badge: 'Procesos • Negocio',
    icon: '📦',
  },
  {
    id: 'tpl-cycle-pdca',
    title: 'Ciclo Continuo PDCA: Mejora Continua',
    queryKey: 'ciclo pdca',
    type: 'cycle',
    theme: 'vitality-warm',
    category: 'flowchart',
    description:
      'Anillo circular de 4 etapas conectadas (Planificar, Hacer, Verificar y Actuar) con flechas curvas de retorno.',
    badge: 'Ciclo Deming • PDCA',
    icon: '🔄',
    featured: true,
  },

  // === ORGANIGRAMA, GENOGRAMA Y ARQUITECTURA DE RED (EDRAWMAX) ===
  {
    id: 'tpl-tree-org',
    title: 'Organigrama Automatizado Corporativo',
    queryKey: 'organigrama',
    type: 'tree',
    theme: 'academic-classic',
    category: 'business',
    description:
      'Jerarquía ejecutiva con cargos directivos, equipos operativos y líneas conectoras ortogonales limpias.',
    badge: 'Organigrama',
    icon: '🏛️',
    featured: true,
  },
  {
    id: 'tpl-tree-genogram',
    title: 'Genograma y Árbol Genealógico Familiar',
    queryKey: 'genograma familiar',
    type: 'tree',
    theme: 'sunset-amber',
    category: 'business',
    description:
      'Estructura intergeneracional ordenada por ramas familiares para historia clínica, social o genealógica.',
    badge: 'Genograma',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'tpl-tree-network',
    title: 'Diagrama Básico de Red Empresarial',
    queryKey: 'arquitectura de red',
    type: 'tree',
    theme: 'minimal-slate',
    category: 'business',
    description:
      'Topología jerárquica con cortafuegos perimetral, balanceador de carga, servidores de aplicación y clúster de datos.',
    badge: 'Ingeniería • Red',
    icon: '🌐',
  },

  // === ESTRATEGIA: MATRIZ DE BLOQUES 2x2, ISHIKAWA Y GANTT ===
  {
    id: 'tpl-matrix-swot',
    title: 'Diagrama de Bloques: Matriz FODA 2×2',
    queryKey: 'matriz foda',
    type: 'matrix',
    theme: 'edraw-azure',
    category: 'strategy',
    description:
      'Cuadrícula estratégica de 4 cuadrantes simétricos para evaluar Fortalezas, Oportunidades, Debilidades y Amenazas.',
    badge: 'Matriz 2×2 • FODA',
    icon: '⊞',
    featured: true,
  },
  {
    id: 'tpl-fishbone',
    title: 'Diagrama Ishikawa: Causa y Efecto (6M)',
    queryKey: 'ishikawa',
    type: 'fishbone',
    theme: 'sunset-amber',
    category: 'strategy',
    description:
      'Espina de pescado calibrada con causas primarias inclinadas y sub-causas horizontales sin cruces.',
    badge: 'Calidad • 6M',
    icon: '🐟',
    featured: true,
  },
  {
    id: 'tpl-timeline-gantt',
    title: 'Diagrama de Gantt y Hoja de Ruta 2026',
    queryKey: 'cronograma',
    type: 'timeline',
    theme: 'vitality-warm',
    category: 'strategy',
    description:
      'Cronograma secuencial por fases trimestrales con porcentajes de avance e hitos alternados arriba y abajo.',
    badge: 'Gantt • Roadmap',
    icon: '⏳',
    featured: true,
  },
];

export async function createDefaultProjects(): Promise<OrganizerProject[]> {
  const now = Date.now();
  const projects: OrganizerProject[] = [];
  const starterCards = TEMPLATE_CARDS.filter(c => c.featured).slice(0, 8);

  for (let i = 0; i < starterCards.length; i++) {
    const card = starterCards[i];
    const generated = await generateOrganizer(
      { topic: card.queryKey, type: card.type },
      card.theme
    );

    projects.push({
      id: `proj-default-${card.id}`,
      title: generated.title,
      type: card.type,
      theme: card.theme,
      canvasBg: 'dots',
      rainbowBranches: true,
      nodes: generated.nodes,
      edges: generated.edges,
      createdAt: now - i * 1000,
      updatedAt: now - i * 1000,
    });
  }

  return projects;
}
