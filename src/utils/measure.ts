import type { OrganizerNode, OrganizerType, ThemeId } from '../types/organizer';
import { getThemeConfig } from './themes';

export interface NodeTypographySpec {
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  maxTextWidth: number;
  padX: number;
  padY: number;
}

let cachedCanvasCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!cachedCanvasCtx) {
    const canvas = document.createElement('canvas');
    cachedCanvasCtx = canvas.getContext('2d');
  }
  return cachedCanvasCtx;
}

export function measureStringPx(text: string, fontSize: number, fontWeight: number): number {
  const ctx = getMeasureContext();
  if (!ctx) {
    return text.length * fontSize * 0.58;
  }
  ctx.font = `${fontWeight} ${fontSize}px "Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  return ctx.measureText(text).width;
}

export function getNodeTypography(depth: number, isRoot: boolean): NodeTypographySpec {
  if (isRoot || depth === 0) {
    return {
      fontSize: 15.5,
      fontWeight: 700,
      lineHeight: 22,
      maxTextWidth: 215,
      padX: 24,
      padY: 15,
    };
  }
  if (depth === 1) {
    return {
      fontSize: 13.5,
      fontWeight: 600,
      lineHeight: 19,
      maxTextWidth: 192,
      padX: 18,
      padY: 12,
    };
  }
  return {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 18,
    maxTextWidth: 182,
    padX: 15,
    padY: 9.5,
  };
}

/** Envuelve un texto en líneas respetando saltos manuales y ancho máximo en píxeles */
export function wrapTextLines(
  rawText: string,
  maxWidth: number,
  fontSize: number,
  fontWeight: number
): string[] {
  const clean = (rawText || 'Tema').trim();
  if (!clean) return ['Tema'];

  const manualParagraphs = clean.split(/\r?\n/);
  const result: string[] = [];

  for (const para of manualParagraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      result.push('');
      continue;
    }

    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${currentLine} ${words[i]}`;
      if (measureStringPx(candidate, fontSize, fontWeight) <= maxWidth) {
        currentLine = candidate;
      } else {
        result.push(currentLine);
        currentLine = words[i];
      }
    }
    result.push(currentLine);
  }

  return result.length > 0 ? result : ['Tema'];
}

export function resolveEffectiveShape(
  node: OrganizerNode,
  depth: number,
  organizerType: OrganizerType,
  themeId: ThemeId
): OrganizerNode['shape'] {
  if (organizerType === 'flowchart') {
    if (node.flowType === 'decision' || node.shape === 'diamond') return 'diamond';
    if (node.flowType === 'start' || node.flowType === 'end') return 'pill';
    if (node.flowType === 'data' || node.shape === 'parallelogram') return 'parallelogram';
    return node.shape || 'rectangle';
  }

  if (node.shape && node.shape !== 'rounded') {
    return node.shape;
  }

  const theme = getThemeConfig(themeId);
  if (
    theme.subtopicStyle === 'underline' &&
    depth >= 2 &&
    (organizerType === 'mindmap' || organizerType === 'logic')
  ) {
    return 'underline';
  }

  if (node.isRoot || depth === 0) {
    if (
      organizerType === 'mindmap' ||
      organizerType === 'logic' ||
      organizerType === 'radial' ||
      organizerType === 'cycle'
    ) {
      return 'pill';
    }
    return 'rounded';
  }

  if (depth === 1 && (organizerType === 'radial' || organizerType === 'cycle')) {
    return 'pill';
  }

  return node.shape || 'rounded';
}

/**
 * Calcula de forma 100% determinista las dimensiones exactas (width, height) y las líneas
 * de texto de un nodo en coordenadas del mundo (independientes del zoom del navegador).
 */
export function measureNodeDimensions(
  node: OrganizerNode,
  depth: number,
  organizerType: OrganizerType,
  themeId: ThemeId = 'vitality-warm'
): { width: number; height: number; lines: string[]; resolvedShape: OrganizerNode['shape'] } {
  const isRoot = Boolean(node.isRoot || depth === 0);
  const typo = getNodeTypography(depth, isRoot);
  const resolvedShape = resolveEffectiveShape(node, depth, organizerType, themeId);

  const lines = wrapTextLines(node.text, typo.maxTextWidth, typo.fontSize, typo.fontWeight);

  let maxLineW = 48;
  for (const line of lines) {
    const w = measureStringPx(line, typo.fontSize, typo.fontWeight);
    if (w > maxLineW) maxLineW = w;
  }

  let subLinesCount = 0;
  if (node.subtitle && isRoot) {
    const subMaxW = typo.maxTextWidth + 40;
    const subLines = wrapTextLines(node.subtitle, subMaxW, 11.5, 500);
    subLinesCount = subLines.length;
    for (const sl of subLines) {
      const sw = measureStringPx(sl, 11.5, 500);
      if (sw > maxLineW) maxLineW = sw;
    }
  }

  // Margen de seguridad de 12px para evitar cualquier truncado por kerning subpíxel
  const textBlockW = Math.ceil(maxLineW) + 12;

  const leftBadgesW =
    (node.icon ? 24 : 0) +
    (node.priority ? 30 : 0) +
    (node.progress !== undefined ? 22 : 0);

  const rightBadgesW =
    (node.notes ? 18 : 0) +
    (node.hyperlink ? 18 : 0);

  const contentW = leftBadgesW + textBlockW + rightBadgesW;
  const textBlockH =
    lines.length * typo.lineHeight + (subLinesCount > 0 ? subLinesCount * 15 + 4 : 0);

  let width = Math.max(isRoot ? 152 : 114, Math.ceil(contentW + typo.padX * 2));
  let height = Math.max(
    isRoot ? 54 : depth === 1 ? 44 : 38,
    Math.ceil(textBlockH + typo.padY * 2)
  );

  if (resolvedShape === 'underline') {
    width = Math.max(96, Math.ceil(contentW + 20));
    height = Math.max(32, Math.ceil(textBlockH + 12));
  } else if (resolvedShape === 'diamond') {
    // Geometría inscrita para que el texto nunca roce las aristas diagonales del rombo
    width = Math.max(176, Math.ceil(width * 1.46));
    height = Math.max(94, Math.ceil(height * 1.62));
  } else if (resolvedShape === 'parallelogram') {
    width += 28;
  } else if (resolvedShape === 'hexagon') {
    width += 24;
  } else if (resolvedShape === 'circle') {
    const diameter = Math.max(92, Math.ceil(Math.max(width, height) * 1.1));
    width = diameter;
    height = diameter;
  } else if (resolvedShape === 'cloud') {
    width += 18;
    height += 10;
  }

  return { width, height, lines, resolvedShape };
}

/**
 * Devuelve el conjunto de IDs de nodos ocultos porque alguno de sus ancestros tiene `collapsed: true`,
 * así como el mapa con el total de descendientes por nodo (para mostrar el contador `+N`).
 */
export function computeHierarchyVisibility(
  nodes: OrganizerNode[],
  edges: { from: string; to: string; isCrossLink?: boolean }[]
): {
  hiddenIds: Set<string>;
  descendantCount: Map<string, number>;
  childrenMap: Map<string, string[]>;
} {
  const nodeById = new Map<string, OrganizerNode>();
  nodes.forEach(n => nodeById.set(n.id, n));

  const childrenMap = new Map<string, string[]>();
  nodes.forEach(n => childrenMap.set(n.id, []));

  // Construimos hijos usando parentId primero y respaldando con aristas jerárquicas
  const assignedChild = new Set<string>();
  for (const n of nodes) {
    if (n.parentId && childrenMap.has(n.parentId) && !n.isRoot) {
      childrenMap.get(n.parentId)!.push(n.id);
      assignedChild.add(n.id);
    }
  }
  for (const e of edges) {
    if (e.isCrossLink) continue;
    if (!assignedChild.has(e.to) && childrenMap.has(e.from) && nodeById.has(e.to)) {
      const target = nodeById.get(e.to)!;
      if (!target.isRoot && e.from !== e.to) {
        childrenMap.get(e.from)!.push(e.to);
        assignedChild.add(e.to);
      }
    }
  }

  const hiddenIds = new Set<string>();
  const descendantCount = new Map<string, number>();

  const countVisited = new Set<string>();
  function countDescendants(id: string): number {
    if (countVisited.has(id)) return 0;
    countVisited.add(id);
    const kids = childrenMap.get(id) || [];
    let total = 0;
    for (const k of kids) {
      total += 1 + countDescendants(k);
    }
    descendantCount.set(id, total);
    return total;
  }

  nodes.forEach(n => {
    if (!countVisited.has(n.id)) {
      countDescendants(n.id);
    }
  });

  const walkVisited = new Set<string>();
  function propagateCollapse(id: string, ancestorCollapsed: boolean) {
    if (walkVisited.has(id)) return;
    walkVisited.add(id);
    if (ancestorCollapsed) {
      hiddenIds.add(id);
    }
    const node = nodeById.get(id);
    const nextCollapsed = ancestorCollapsed || Boolean(node?.collapsed);
    const kids = childrenMap.get(id) || [];
    for (const k of kids) {
      propagateCollapse(k, nextCollapsed);
    }
  }

  const roots = nodes.filter(n => n.isRoot || !n.parentId || !nodeById.has(n.parentId));
  if (roots.length > 0) {
    roots.forEach(r => propagateCollapse(r.id, false));
  }
  nodes.forEach(n => {
    if (!walkVisited.has(n.id)) propagateCollapse(n.id, false);
  });

  return { hiddenIds, descendantCount, childrenMap };
}
