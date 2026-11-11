export type OrganizerType =
  | 'mindmap'      // Mapa Mental Radial (Equilibrado Izquierda/Derecha estilo EdrawMax)
  | 'cartographic' // Cartografía Conceptual (8 Ejes de Tobón: Horario o Antihorario)
  | 'logic'        // Mapa Lógico Derecho (Jerarquía fluida Izquierda -> Derecha)
  | 'concept'      // Mapa Conceptual de Novak (Proposiciones y enlaces cruzados)
  | 'synoptic'     // Cuadro Sinóptico Académico (Llaves vectoriales grupales '{')
  | 'fishbone'     // Diagrama Causa-Efecto (Ishikawa / Espina de Pescado a 55°)
  | 'tree'         // Organigrama Jerárquico Vertical (Bus ortogonal redondeado)
  | 'flowchart'    // Diagrama de Flujo de Procesos (Formas semánticas + Sí/No)
  | 'timeline'     // Línea de Tiempo / Hoja de Ruta Gantt (Eje horizontal e hitos)
  | 'radial'       // Diagrama de Círculos y Radios / Burbujas (EdrawMax Circle & Spoke)
  | 'matrix'       // Matriz de Bloques 2x2 / FODA (EdrawMax Block & SWOT Matrix)
  | 'cycle';       // Diagrama de Ciclo Continuo (EdrawMax Circular Process)

export type NodeShape =
  | 'rounded'        // Tarjeta redondeada moderna
  | 'pill'           // Cápsula elíptica
  | 'rectangle'      // Rectángulo técnico limpio
  | 'diamond'        // Rombo de decisión (Diagrama de flujo)
  | 'parallelogram'  // Paralelogramo de entrada/salida de datos
  | 'hexagon'        // Hexágono de preparación / módulo
  | 'cloud'          // Nube creativa de énfasis
  | 'circle'         // Nodo circular
  | 'underline';     // Rama subrayada clásica estilo EdrawMax

export type EdgeStyle =
  | 'bezier'     // Curva Bézier cúbica suave y precisa
  | 'tapered'    // Rama orgánica cónica estilo Buzan / Edraw
  | 'elbow'      // Conector ortogonal con esquinas redondeadas
  | 'straight';  // Conector recto directo

export type ThemeId =
  | 'vitality-warm'     // Vitalidad Cálida (Crema suave + paleta viva armónica)
  | 'edraw-azure'       // Azul Ejecutivo EdrawMax (Limpio corporativo moderno)
  | 'miro-pastel'       // Pastel Creativo (Marfil + rellenos pastel suaves)
  | 'edraw-underline'   // Clásico Subrayado EdrawMax (Ramas continuas subrayadas)
  | 'nature-sage'       // Bosque Salvia (Tonos orgánicos tierra y esmeralda)
  | 'academic-classic'  // Académico Editorial (Papel limpio + azul/índigo serio)
  | 'sunset-amber'      // Atardecer Dorado (Tonos cálidos ámbar, coral y ciruela)
  | 'minimal-slate';    // Estudio Pizarra iOS (Estética Apple limpia y serena)

export type CanvasBgStyle = 'dots' | 'grid' | 'clean';

export type NodeSide = 'left' | 'right' | 'top' | 'bottom' | 'center';

export type FlowNodeRole = 'start' | 'process' | 'decision' | 'data' | 'end';

export interface OrganizerNode {
  id: string;
  text: string;
  subtitle?: string;
  x: number;              // SIEMPRE centro geométrico X en coordenadas del mundo
  y: number;              // SIEMPRE centro geométrico Y en coordenadas del mundo
  width: number;          // Ancho exacto precalculado en coordenadas del mundo
  height: number;         // Alto exacto precalculado en coordenadas del mundo
  lines?: string[];       // Líneas de texto envueltas para coincidencia exacta DOM/SVG
  parentId?: string | null;
  isRoot?: boolean;
  depth?: number;         // 0 = Raíz, 1 = Tema Principal, 2+ = Subtema
  side?: NodeSide;        // Dirección estructural asignada por el motor de layout
  branchIndex?: number;   // Índice de rama principal para color consistente Rainbow
  color?: string;         // Color acento/rama
  bgColor?: string;       // Relleno personalizado opcional
  textColor?: string;     // Color de texto personalizado opcional
  textAlign?: 'left' | 'center' | 'right' | 'justify'; // Alineación del texto (incluye justificado editorial)
  shape?: NodeShape;
  icon?: string;
  priority?: 1 | 2 | 3 | 4 | 5;          // Marcadores P1..P5 estilo EdrawMax
  progress?: 0 | 25 | 50 | 75 | 100;     // Progreso circular de tarea estilo EdrawMax
  notes?: string;
  hyperlink?: string;
  collapsed?: boolean;    // Contraer/expandir descendientes
  flowType?: FlowNodeRole;
  // Metadatos geométricos auxiliares para Ishikawa, Línea de Tiempo y Cartografía
  ribSpineX?: number;     // X donde la espina diagonal toca la espina dorsal (y=0)
  ribTipX?: number;
  ribTipY?: number;
  ribAnchorX?: number;    // X exacto sobre la espina diagonal para sub-causas Ishikawa
  milestoneIndex?: number;
  cartographicSector?: 'top' | 'right' | 'bottom' | 'left';
  // Ilustración visual contextual añadida por el usuario
  imageUrl?: string;
  imagePrompt?: string;
}

export interface CanvasImage {
  id: string;
  url: string;            // Data URL base64 o URL remota de la imagen
  x: number;              // Coordenada central X en el lienzo del mundo
  y: number;              // Coordenada central Y en el lienzo del mundo
  width: number;          // Ancho en píxeles del mundo
  height: number;         // Alto en píxeles del mundo
  title?: string;         // Nombre o descripción opcional
  opacity?: number;       // Opacidad (0.1 a 1)
  borderRadius?: number;  // Radio de esquinas (por defecto 10)
  locked?: boolean;       // Bloquear para evitar arrastres accidentales
}

export interface OrganizerEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  isCrossLink?: boolean;  // Relación cruzada libre entre dos nodos cualesquiera
  style?: EdgeStyle;
  color?: string;
  width?: number;
  arrow?: boolean;
  dashed?: boolean;
}

export interface OrganizerProject {
  id: string;
  title: string;
  type: OrganizerType;
  nodes: OrganizerNode[];
  edges: OrganizerEdge[];
  images?: CanvasImage[]; // Imágenes flotantes libres posicionables en cualquier lugar
  theme: ThemeId;
  connectorStyle?: EdgeStyle;
  canvasBg?: CanvasBgStyle;
  rainbowBranches?: boolean;
  cartographicDirection?: 'clockwise' | 'counterclockwise'; // Sentido horario o antihorario
  shareRoomId?: string; // ID de sala compartida única para edición multidispositivo en la nube
  createdAt: number;
  updatedAt: number;
}

export interface CollaboratorInfo {
  id: string;
  name: string;
  color: string;
  device: 'desktop' | 'mobile';
  lastSeen: number;
}

export interface AiGenerationRequest {
  topic: string;
  type: OrganizerType;
  details?: string;
  depth?: 'compact' | 'standard' | 'deep';
  apiKey?: string;
  provider?: 'local' | 'gemini' | 'openai';
  geminiTier?: 'pro' | 'flash' | 'auto'; // 'pro' = Plan Pro con razonamiento profundo (gemini-2.5-pro / gemini-1.5-pro)
}
