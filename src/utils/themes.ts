import type { EdgeStyle, OrganizerType, ThemeId } from '../types/organizer';

export interface EdrawThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  canvasBg: string;
  rootBg: string;
  rootText: string;
  rootBorder: string;
  topicFillMode: 'white-accent' | 'tinted-pastel' | 'solid-soft' | 'underline';
  subtopicStyle: 'card' | 'tinted' | 'underline';
  defaultConnector: EdgeStyle;
  textPrimary: string;
  textSecondary: string;
  spineColor: string;
  palette: string[];
}

export const EDRAW_THEMES: Record<ThemeId, EdrawThemeConfig> = {
  'vitality-warm': {
    id: 'vitality-warm',
    name: 'Vitalidad Cálida',
    description: 'Crema cálido con ramas vibrantes y tarjetas luminosas',
    canvasBg: '#FAF7F2',
    rootBg: '#EA580C',
    rootText: '#FFFFFF',
    rootBorder: '#C2410C',
    topicFillMode: 'white-accent',
    subtopicStyle: 'card',
    defaultConnector: 'bezier',
    textPrimary: '#1C1917',
    textSecondary: '#57534E',
    spineColor: '#44403C',
    palette: [
      '#E11D48', // Coral carmesí
      '#2563EB', // Azul cobalto
      '#059669', // Esmeralda vivo
      '#D97706', // Ámbar dorado
      '#7C3AED', // Violeta real
      '#0891B2', // Turquesa océano
      '#DB2777', // Magenta cálido
      '#65A30D', // Lima oliva
    ],
  },
  'miro-pastel': {
    id: 'miro-pastel',
    name: 'Pastel Creativo',
    description: 'Rellenos suaves apastelados de alta legibilidad',
    canvasBg: '#FDFBF7',
    rootBg: '#1E293B',
    rootText: '#FFFFFF',
    rootBorder: '#0F172A',
    topicFillMode: 'tinted-pastel',
    subtopicStyle: 'tinted',
    defaultConnector: 'tapered',
    textPrimary: '#1E293B',
    textSecondary: '#475569',
    spineColor: '#334155',
    palette: [
      '#F97316', // Mandarina
      '#3B82F6', // Azul cielo
      '#10B981', // Menta esmeralda
      '#8B5CF6', // Lavanda intenso
      '#EC4899', // Rosa coral
      '#14B8A6', // Aguamarina
      '#EAB308', // Sol suave
      '#6366F1', // Índigo
    ],
  },
  'edraw-underline': {
    id: 'edraw-underline',
    name: 'Rama Subrayada Edraw',
    description: 'Estilo icónico de EdrawMax con subramas continuas subrayadas',
    canvasBg: '#FAF8F5',
    rootBg: '#0F766E',
    rootText: '#FFFFFF',
    rootBorder: '#115E59',
    topicFillMode: 'tinted-pastel',
    subtopicStyle: 'underline',
    defaultConnector: 'bezier',
    textPrimary: '#1C1917',
    textSecondary: '#57534E',
    spineColor: '#0F766E',
    palette: [
      '#0D9488', // Verde azulado
      '#EA580C', // Terracota
      '#2563EB', // Azul Edraw
      '#7C3AED', // Púrpura
      '#16A34A', // Verde hoja
      '#DC2626', // Rojo coral
      '#CA8A04', // Ocre
      '#0284C7', // Celeste profundo
    ],
  },
  'nature-sage': {
    id: 'nature-sage',
    name: 'Bosque Salvia',
    description: 'Tonos botánicos serenos que descansan la vista',
    canvasBg: '#F5F7F4',
    rootBg: '#2F5E4E',
    rootText: '#FFFFFF',
    rootBorder: '#1F4236',
    topicFillMode: 'tinted-pastel',
    subtopicStyle: 'card',
    defaultConnector: 'tapered',
    textPrimary: '#1C2421',
    textSecondary: '#4A5953',
    spineColor: '#2F5E4E',
    palette: [
      '#2E7D5B', // Salvia bosque
      '#B45309', // Tierra ámbar
      '#0369A1', // Río profundo
      '#6D28D9', // Ciruela silvestre
      '#4D7C0F', // Musgo
      '#BE123C', // Frambuesa
      '#0F766E', // Pino azul
      '#A16207', // Miel antigua
    ],
  },
  'academic-classic': {
    id: 'academic-classic',
    name: 'Académico Editorial',
    description: 'Ideal para cuadros sinópticos, mapas conceptuales y tesis',
    canvasBg: '#F8FAFC',
    rootBg: '#1D4ED8',
    rootText: '#FFFFFF',
    rootBorder: '#1E40AF',
    topicFillMode: 'white-accent',
    subtopicStyle: 'card',
    defaultConnector: 'elbow',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    spineColor: '#334155',
    palette: [
      '#1D4ED8', // Azul académico
      '#0F766E', // Verde pizarra
      '#B45309', // Bronce
      '#6D28D9', // Violeta editorial
      '#BE185D', // Burdeos
      '#0369A1', // Marino claro
      '#15803D', // Verde clásico
      '#4338CA', // Índigo real
    ],
  },
  'sunset-amber': {
    id: 'sunset-amber',
    name: 'Atardecer Cálido',
    description: 'Arena luminosa con acentos terracota, oro y ciruela',
    canvasBg: '#FEFBF6',
    rootBg: '#C2410C',
    rootText: '#FFFFFF',
    rootBorder: '#9A3412',
    topicFillMode: 'tinted-pastel',
    subtopicStyle: 'card',
    defaultConnector: 'bezier',
    textPrimary: '#292524',
    textSecondary: '#57534E',
    spineColor: '#78350F',
    palette: [
      '#EA580C', // Naranja sol
      '#D97706', // Ámbar cálido
      '#E11D48', // Rubí suave
      '#9333EA', // Violeta cálido
      '#0D9488', // Turquesa contraste
      '#2563EB', // Azul sereno
      '#CA8A04', // Oro viejo
      '#BE185D', // Vino cálido
    ],
  },
  'edraw-azure': {
    id: 'edraw-azure',
    name: 'Azul Ejecutivo Edraw',
    description: 'Paleta corporativa clásica de Wondershare EdrawMax de alta claridad',
    canvasBg: '#F7F9FC',
    rootBg: '#0284C7',
    rootText: '#FFFFFF',
    rootBorder: '#0369A1',
    topicFillMode: 'white-accent',
    subtopicStyle: 'card',
    defaultConnector: 'bezier',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    spineColor: '#0369A1',
    palette: [
      '#0284C7', // Azul Edraw
      '#0D9488', // Turquesa pro
      '#4F46E5', // Índigo moderno
      '#EA580C', // Naranja energía
      '#16A34A', // Esmeralda limpio
      '#9333EA', // Púrpura innovación
      '#E11D48', // Coral ejecutivo
      '#CA8A04', // Oro métrica
    ],
  },
  'minimal-slate': {
    id: 'minimal-slate',
    name: 'Estudio Pizarra iOS',
    description: 'Estética minimalista estilo Apple Freeform con contraste sereno',
    canvasBg: '#F9F9FB',
    rootBg: '#18181B',
    rootText: '#FFFFFF',
    rootBorder: '#27272A',
    topicFillMode: 'tinted-pastel',
    subtopicStyle: 'card',
    defaultConnector: 'bezier',
    textPrimary: '#18181B',
    textSecondary: '#52525B',
    spineColor: '#3F3F46',
    palette: [
      '#2563EB', // Azul sistema iOS
      '#059669', // Verde sistema iOS
      '#D97706', // Ámbar sistema iOS
      '#7C3AED', // Púrpura sistema iOS
      '#E11D48', // Rosa sistema iOS
      '#0891B2', // Cian sistema iOS
      '#4F46E5', // Índigo sistema iOS
      '#EA580C', // Naranja sistema iOS
    ],
  },
};

export function getThemeConfig(themeId?: string): EdrawThemeConfig {
  if (themeId && themeId in EDRAW_THEMES) {
    return EDRAW_THEMES[themeId as ThemeId];
  }
  return EDRAW_THEMES['vitality-warm'];
}

/** Convierte un color HEX (#RRGGBB) a rgba con opacidad controlada */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || '#2563EB').replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mezcla un color HEX con blanco puro para obtener un tono pastel opaco (ideal para SVG y Canvas sin transparencias raras) */
export function hexToPastelSolid(hex: string, ratio = 0.12): string {
  const clean = (hex || '#2563EB').replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  const r = Math.round(((num >> 16) & 255) * ratio + 255 * (1 - ratio));
  const g = Math.round(((num >> 8) & 255) * ratio + 255 * (1 - ratio));
  const b = Math.round((num & 255) * ratio + 255 * (1 - ratio));
  return `rgb(${r}, ${g}, ${b})`;
}

export const PRIORITY_BADGES: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: 'P1', bg: '#EF4444', text: '#FFFFFF' },
  2: { label: 'P2', bg: '#F97316', text: '#FFFFFF' },
  3: { label: 'P3', bg: '#EAB308', text: '#FFFFFF' },
  4: { label: 'P4', bg: '#3B82F6', text: '#FFFFFF' },
  5: { label: 'P5', bg: '#64748B', text: '#FFFFFF' },
};

export type OrganizerCategory = 'mental' | 'academic' | 'process' | 'strategy';

export interface OrganizerTypeMeta {
  type: OrganizerType;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
  category: OrganizerCategory;
}

export const ORGANIZER_CATEGORY_LABELS: Record<OrganizerCategory, string> = {
  mental: 'Mapas Mentales y Radiales',
  academic: 'Educación y Síntesis',
  process: 'Flujos, Ciclos y Cronogramas',
  strategy: 'Empresa, Bloques y Calidad',
};

export const ORGANIZER_TYPES_META: OrganizerTypeMeta[] = [
  {
    type: 'mindmap',
    label: 'Mapa Mental Radial',
    shortLabel: 'Mapa Mental',
    emoji: '🧠',
    description: 'Idea central equilibrada a ambos lados con ramas orgánicas EdrawMax',
    category: 'mental',
  },
  {
    type: 'logic',
    label: 'Mapa Lógico Derecho',
    shortLabel: 'Mapa Lógico',
    emoji: '🌿',
    description: 'Desglose estructurado de izquierda a derecha con jerarquía limpia',
    category: 'mental',
  },
  {
    type: 'radial',
    label: 'Círculos y Radios (Burbujas)',
    shortLabel: 'Círculos y Radios',
    emoji: '🫧',
    description: 'Núcleo central con temas orbitando en 360° estilo EdrawMax',
    category: 'mental',
  },
  {
    type: 'cartographic',
    label: 'Cartografía Conceptual (8 Ejes)',
    shortLabel: 'Cartografía',
    emoji: '🧭',
    description: 'Los 8 ejes de Tobón equilibrados y listos para redactar',
    category: 'academic',
  },
  {
    type: 'concept',
    label: 'Mapa Conceptual',
    shortLabel: 'Mapa Conceptual',
    emoji: '🕸️',
    description: 'Jerarquía de conceptos unidos por conectores textuales editables',
    category: 'academic',
  },
  {
    type: 'synoptic',
    label: 'Cuadro Sinóptico de Llaves',
    shortLabel: 'Cuadro Sinóptico',
    emoji: '🗂️',
    description: 'Llaves caligráficas { grupales que abrazan categorías y subtemas',
    category: 'academic',
  },
  {
    type: 'flowchart',
    label: 'Diagrama de Flujo',
    shortLabel: 'Flujograma',
    emoji: '⚡',
    description: 'Algoritmos, procesos, datos y rombos de decisión Sí / No',
    category: 'process',
  },
  {
    type: 'cycle',
    label: 'Diagrama de Ciclo Continuo',
    shortLabel: 'Ciclo Circular',
    emoji: '🔄',
    description: 'Fases conectadas en anillo continuo de mejora o proceso iterativo',
    category: 'process',
  },
  {
    type: 'timeline',
    label: 'Línea de Tiempo / Gantt',
    shortLabel: 'Línea de Tiempo',
    emoji: '⏳',
    description: 'Hoja de ruta cronológica con hitos numerados y entregables',
    category: 'process',
  },
  {
    type: 'tree',
    label: 'Organigrama y Genograma',
    shortLabel: 'Organigrama',
    emoji: '🏛️',
    description: 'Estructura piramidal automatizada con conectores ortogonales',
    category: 'strategy',
  },
  {
    type: 'matrix',
    label: 'Matriz de Bloques / FODA',
    shortLabel: 'Matriz Bloques',
    emoji: '⊞',
    description: 'Cuadrantes estratégicos organizados alrededor del eje central',
    category: 'strategy',
  },
  {
    type: 'fishbone',
    label: 'Diagrama de Ishikawa (6M)',
    shortLabel: 'Ishikawa',
    emoji: '🐟',
    description: 'Espina de pescado a 55° para análisis profundo de causas y efecto',
    category: 'strategy',
  },
];

export const ICON_CATEGORIES: { id: string; label: string; icons: string[] }[] = [
  {
    id: 'ideas',
    label: 'Ideas y Estrategia',
    icons: ['💡', '🎯', '🚀', '🧠', '⭐', '🔥', '🏆', '💎', '🧭', '📈', '📊', '🤝'],
  },
  {
    id: 'tech',
    label: 'Tecnología y Flujos',
    icons: ['⚡', '💻', '⚙️', '🛠️', '🔍', '🧩', '🛡️', '🌐', '📱', '☁️', '🔒', '🤖'],
  },
  {
    id: 'academic',
    label: 'Educación y Ciencia',
    icons: ['📚', '🎓', '🔬', '🌱', '🌍', '⚖️', '🏛️', '📖', '✍️', '🧬', '🧪', '🎨'],
  },
  {
    id: 'status',
    label: 'Estado y Alertas',
    icons: ['✅', '⚠️', '📌', '🕒', '💬', '❤️', '🔔', '🏁', '🔄', '➕', '❓', '✨'],
  },
];

export const CURATED_ICONS = ICON_CATEGORIES.flatMap(c => c.icons);
