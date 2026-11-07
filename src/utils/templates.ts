import type { OrganizerProject, OrganizerType, ThemeId } from '../types/organizer';
import { generateOrganizer } from './aiService';

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
