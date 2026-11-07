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
    childContent: 'un caso documentado donde la teoría se aplicó con éxito para resolver una problemática real en su contexto',
    icon: '💡',
  },
  {
    name: '2. Noción',
    connector: 'se define como',
    childContent: 'el significado etimológico y conceptual esencial que delimita con precisión el campo de acción del término',
    icon: '📖',
  },
  {
    name: '3. Categorización',
    connector: 'pertenece a',
    childContent: 'la clase o disciplina mayor del conocimiento que engloba su estudio y fundamentación teórica',
    icon: '🗂️',
  },
  {
    name: '4. Caracterización',
    connector: 'se caracteriza por',
    childContent: 'los rasgos distintivos y principios rectores que estructuran su funcionamiento y validez conceptual',
    icon: '✨',
  },
  {
    name: '5. Diferenciación',
    connector: 'se distingue de',
    childContent: 'otros conceptos y nociones cercanas estableciendo fronteras claras para evitar confusiones epistemológicas',
    icon: '⚖️',
  },
  {
    name: '6. Subdivisión',
    connector: 'se subdivide en',
    childContent: 'las tipologías, clases o componentes fundamentales que integran su estructura interna',
    icon: '🧩',
  },
  {
    name: '7. Vinculación',
    connector: 'se vincula con',
    childContent: 'las leyes, modelos científicos y disciplinas complementarias que fortalecen su aplicación práctica',
    icon: '🔗',
  },
  {
    name: '8. Metodología',
    connector: 'se aplica mediante',
    childContent: 'la secuencia ordenada de fases y procedimientos rigurosos para su implementación efectiva',
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
      subtitle: undefined, // Sin subtítulo secundario artificial
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
      subtitle: undefined, // Sin palabras robóticas debajo del cuadro
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

export interface TemplateCard {
  id: string;
  title: string;
  queryKey: string;
  type: OrganizerType;
  theme: ThemeId;
  description: string;
  badge: string;
  icon: string;
}

export const TEMPLATE_CARDS: TemplateCard[] = [
  {
    id: 'tpl-cartographic',
    title: 'Cartografía Conceptual: Administración Financiera',
    queryKey: 'administracion financiera',
    type: 'cartographic',
    theme: 'vitality-warm',
    description: 'Mapa gráfico de 8 ejes de Sergio Tobón (Noción, Categorización, Caracterización, Diferencias, Subdivisión, Vinculación, Metodología y Ejemplificación).',
    badge: 'Pedagógico • Tobón 8 Ejes',
    icon: '🧭',
  },
  {
    id: 'tpl-mindmap',
    title: 'Mapa Mental Radial: Inteligencia Artificial',
    queryKey: 'inteligencia artificial',
    type: 'mindmap',
    theme: 'vitality-warm',
    description: 'Distribución equilibrada izquierda/derecha con prioridades P1-P2, progreso y enlace cruzado.',
    badge: 'Cognitivo • EdrawMax',
    icon: '🧠',
  },
  {
    id: 'tpl-logic',
    title: 'Mapa Lógico Derecho: Lanzamiento SaaS',
    queryKey: 'mapa logico',
    type: 'logic',
    theme: 'edraw-underline',
    description: 'Desglose estratégico de izquierda a derecha con el icónico estilo de ramas subrayadas de EdrawMax.',
    badge: 'Estrategia • Producto',
    icon: '🌿',
  },
  {
    id: 'tpl-synoptic',
    title: 'Cuadro Sinóptico: Géneros Literarios',
    queryKey: 'sinoptico',
    type: 'synoptic',
    theme: 'academic-classic',
    description: 'Llaves caligráficas { grupales auténticas que abrazan categorías y subtemas alineados.',
    badge: 'Académico • Estudio',
    icon: '🗂️',
  },
  {
    id: 'tpl-fishbone',
    title: 'Diagrama Ishikawa: Retrasos de Software',
    queryKey: 'ishikawa',
    type: 'fishbone',
    theme: 'sunset-amber',
    description: 'Espina de pescado 6M con espinas inclinadas exactas y sub-causas horizontales perfectamente ancladas.',
    badge: 'Calidad • Causa-Efecto',
    icon: '🐟',
  },
  {
    id: 'tpl-concept',
    title: 'Mapa Conceptual: La Fotosíntesis',
    queryKey: 'fotosintesis',
    type: 'concept',
    theme: 'nature-sage',
    description: 'Jerarquía científica Novak con proposiciones editables sobre cada conector direccional.',
    badge: 'Ciencia • Pedagogía',
    icon: '🌱',
  },
  {
    id: 'tpl-tree',
    title: 'Organigrama Corporativo Tech',
    queryKey: 'organigrama',
    type: 'tree',
    theme: 'academic-classic',
    description: ' Jerarquía ejecutiva con cargos, subtítulos y conectores ortogonales redondeados.',
    badge: 'Empresa • Equipos',
    icon: '🏛️',
  },
  {
    id: 'tpl-flowchart',
    title: 'Diagrama de Flujo: Soporte Técnico',
    queryKey: 'flujo',
    type: 'flowchart',
    theme: 'miro-pastel',
    description: 'Proceso con inicio, captura de datos, rombo de decisión (puertos Sí / No) y cierre.',
    badge: 'Procesos • Algoritmos',
    icon: '⚡',
  },
  {
    id: 'tpl-timeline',
    title: 'Línea de Tiempo: Hoja de Ruta 2026',
    queryKey: 'cronograma',
    type: 'timeline',
    theme: 'vitality-warm',
    description: 'Eje cronológico horizontal con hitos numerados y fases alternadas arriba y abajo.',
    badge: 'Planificación • Roadmap',
    icon: '⏳',
  },
];

export async function createDefaultProjects(): Promise<OrganizerProject[]> {
  const now = Date.now();
  const projects: OrganizerProject[] = [];

  for (let i = 0; i < TEMPLATE_CARDS.length; i++) {
    const card = TEMPLATE_CARDS[i];
    const generated = await generateOrganizer(
      { topic: card.queryKey, type: card.type },
      card.theme
    );

    projects.push({
      id: `proj-default-${card.type}`,
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
