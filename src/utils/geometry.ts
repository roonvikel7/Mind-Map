import type {
  EdgeStyle,
  OrganizerEdge,
  OrganizerNode,
  OrganizerProject,
} from '../types/organizer';
import { getThemeConfig } from './themes';
import { computeHierarchyVisibility, resolveEffectiveShape } from './measure';

export interface RenderedPathItem {
  id: string;
  edgeId?: string;
  kind: 'stroke' | 'fill' | 'dashed';
  d: string;
  color: string;
  strokeWidth?: number;
  arrowEnd?: { x: number; y: number; angleDeg: number; color: string };
  label?: string;
  labelX?: number;
  labelY?: number;
  isCrossLink?: boolean;
}

export interface TimelineBadgeItem {
  id: string;
  x: number;
  y: number;
  index: number;
  color: string;
}

export interface SceneVectorGeometry {
  paths: RenderedPathItem[];
  timelineBadges: TimelineBadgeItem[];
  visibleNodes: OrganizerNode[];
  hiddenIds: Set<string>;
  descendantCount: Map<string, number>;
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
}

/** Calcula una curva Bézier horizontal suave entre dos puertos (Izquierda <-> Derecha) */
export function cubicHorizontal(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const cOffset = Math.max(32, Math.abs(dx) * 0.48) * Math.sign(dx || 1);
  return `M ${r2(x1)} ${r2(y1)} C ${r2(x1 + cOffset)} ${r2(y1)}, ${r2(x2 - cOffset)} ${r2(y2)}, ${r2(x2)} ${r2(y2)}`;
}

/** Calcula una curva Bézier vertical suave entre dos puertos (Arriba -> Abajo) */
export function cubicVertical(x1: number, y1: number, x2: number, y2: number): string {
  const dy = y2 - y1;
  const cOffset = Math.max(32, Math.abs(dy) * 0.48) * Math.sign(dy || 1);
  return `M ${r2(x1)} ${r2(y1)} C ${r2(x1)} ${r2(y1 + cOffset)}, ${r2(x2)} ${r2(y2 - cOffset)}, ${r2(x2)} ${r2(y2)}`;
}

/** Conector ortogonal horizontal con tronco compartido y esquinas redondeadas */
export function elbowHorizontal(x1: number, y1: number, x2: number, y2: number): string {
  if (Math.abs(y2 - y1) < 2) {
    return `M ${r2(x1)} ${r2(y1)} L ${r2(x2)} ${r2(y2)}`;
  }
  const sx = x2 >= x1 ? 1 : -1;
  const sy = y2 >= y1 ? 1 : -1;
  const trunkDist = Math.min(32, Math.abs(x2 - x1) * 0.45);
  const trunkX = x1 + sx * trunkDist;
  const radius = Math.min(9, Math.abs(y2 - y1) / 2, trunkDist * 0.8);

  return [
    `M ${r2(x1)} ${r2(y1)}`,
    `L ${r2(trunkX - sx * radius)} ${r2(y1)}`,
    `Q ${r2(trunkX)} ${r2(y1)}, ${r2(trunkX)} ${r2(y1 + sy * radius)}`,
    `L ${r2(trunkX)} ${r2(y2 - sy * radius)}`,
    `Q ${r2(trunkX)} ${r2(y2)}, ${r2(trunkX + sx * radius)} ${r2(y2)}`,
    `L ${r2(x2)} ${r2(y2)}`,
  ].join(' ');
}

/** Conector ortogonal vertical con esquinas redondeadas (Organigrama y Flujo) */
export function elbowVertical(x1: number, y1: number, x2: number, y2: number, busOffset = 34): string {
  if (Math.abs(x2 - x1) < 2) {
    return `M ${r2(x1)} ${r2(y1)} L ${r2(x2)} ${r2(y2)}`;
  }
  const sy = y2 >= y1 ? 1 : -1;
  const sx = x2 >= x1 ? 1 : -1;
  const busY = y1 + sy * Math.min(busOffset, Math.abs(y2 - y1) * 0.5);
  const radius = Math.min(9, Math.abs(x2 - x1) / 2, Math.abs(busY - y1) * 0.8, Math.abs(y2 - busY) * 0.8);

  return [
    `M ${r2(x1)} ${r2(y1)}`,
    `L ${r2(x1)} ${r2(busY - sy * radius)}`,
    `Q ${r2(x1)} ${r2(busY)}, ${r2(x1 + sx * radius)} ${r2(busY)}`,
    `L ${r2(x2 - sx * radius)} ${r2(busY)}`,
    `Q ${r2(x2)} ${r2(busY)}, ${r2(x2)} ${r2(busY + sy * radius)}`,
    `L ${r2(x2)} ${r2(y2)}`,
  ].join(' ');
}

/** Polígono orgánico cónico estilo Tony Buzan / EdrawMax */
export function taperedBranchPolygon(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  wStart: number,
  wEnd: number
): string {
  const dx = x2 - x1;
  const c = Math.max(34, Math.abs(dx) * 0.48) * Math.sign(dx || 1);
  const hs = wStart / 2;
  const he = wEnd / 2;
  return [
    `M ${r2(x1)} ${r2(y1 - hs)}`,
    `C ${r2(x1 + c)} ${r2(y1 - hs * 0.7)}, ${r2(x2 - c)} ${r2(y2 - he)}, ${r2(x2)} ${r2(y2 - he)}`,
    `L ${r2(x2)} ${r2(y2 + he)}`,
    `C ${r2(x2 - c)} ${r2(y2 + he)}, ${r2(x1 + c)} ${r2(y1 + hs * 0.7)}, ${r2(x1)} ${r2(y1 + hs)}`,
    'Z',
  ].join(' ');
}

/** Llave caligráfica grupal '{' para Cuadro Sinóptico */
export function synopticCurlyBracePath(
  pRightX: number,
  cLeftX: number,
  topY: number,
  midY: number,
  bottomY: number
): string {
  const gap = Math.max(40, cLeftX - pRightX);
  const cuspX = pRightX + gap * 0.24;
  const spineX = pRightX + gap * 0.54;
  const armEndX = cLeftX - gap * 0.14;

  const halfTop = Math.max(8, midY - topY);
  const halfBot = Math.max(8, bottomY - midY);
  const rTop = Math.min(13, halfTop * 0.45, (armEndX - cuspX) * 0.48);
  const rBot = Math.min(13, halfBot * 0.45, (armEndX - cuspX) * 0.48);

  return [
    // Tallo corto desde el borde derecho del padre hacia el vértice central de la llave
    `M ${r2(pRightX)} ${r2(midY)} L ${r2(cuspX)} ${r2(midY)}`,
    // Cuerpo caligráfico completo de la llave '{'
    `M ${r2(armEndX)} ${r2(topY)}`,
    `Q ${r2(spineX)} ${r2(topY)}, ${r2(spineX)} ${r2(topY + rTop)}`,
    `L ${r2(spineX)} ${r2(midY - rTop)}`,
    `Q ${r2(spineX)} ${r2(midY)}, ${r2(cuspX)} ${r2(midY)}`,
    `Q ${r2(spineX)} ${r2(midY)}, ${r2(spineX)} ${r2(midY + rBot)}`,
    `L ${r2(spineX)} ${r2(bottomY - rBot)}`,
    `Q ${r2(spineX)} ${r2(bottomY)}, ${r2(armEndX)} ${r2(bottomY)}`,
  ].join(' ');
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Construye toda la geometría vectorial de conectores, llaves, espinas, ejes y relaciones
 * cruzadas de un proyecto, garantizando 100% de fidelidad entre el lienzo interactivo y la exportación.
 */
export function buildProjectSceneGeometry(project: OrganizerProject): SceneVectorGeometry {
  const theme = getThemeConfig(project.theme);
  const connectorMode: EdgeStyle = project.connectorStyle || theme.defaultConnector;
  const { hiddenIds, descendantCount, childrenMap } = computeHierarchyVisibility(
    project.nodes,
    project.edges
  );

  const visibleNodes = project.nodes.filter(n => !hiddenIds.has(n.id));
  const nodeMap = new Map<string, OrganizerNode>();
  visibleNodes.forEach(n => nodeMap.set(n.id, n));

  const paths: RenderedPathItem[] = [];
  const timelineBadges: TimelineBadgeItem[] = [];

  // Rango global del diagrama (incluyendo espinas, colas y curvas)
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const expandBounds = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  visibleNodes.forEach(n => {
    const w = n.width || 140;
    const h = n.height || 48;
    expandBounds(n.x - w / 2, n.y - h / 2);
    expandBounds(n.x + w / 2, n.y + h / 2);
  });

  // Expandir límites con las imágenes libres colocadas en el lienzo
  if (project.images && project.images.length > 0) {
    project.images.forEach(img => {
      const w = img.width || 200;
      const h = img.height || 150;
      expandBounds(img.x - w / 2, img.y - h / 2);
      expandBounds(img.x + w / 2, img.y + h / 2);
    });
  }

  if (visibleNodes.length === 0) {
    minX = -200;
    minY = -120;
    maxX = 200;
    maxY = 120;
  }

  // Mapa rápido de aristas jerárquicas por clave "from->to"
  const edgeByPair = new Map<string, OrganizerEdge>();
  project.edges.forEach(e => {
    if (!e.isCrossLink) {
      edgeByPair.set(`${e.from}->${e.to}`, e);
    }
  });

  const root =
    visibleNodes.find(n => n.isRoot) ||
    visibleNodes.find(n => !n.parentId || !nodeMap.has(n.parentId)) ||
    visibleNodes[0];

  /* --------------------------------------------------------------------------
   * A. CONECTORES ESTRUCTURALES SEGÚN EL TIPO DE DIAGRAMA
   * -------------------------------------------------------------------------- */
  if (project.type === 'synoptic') {
    // Una sola llave caligráfica '{' por cada grupo padre -> hijos visibles
    for (const parent of visibleNodes) {
      const kidIds = (childrenMap.get(parent.id) || []).filter(cid => nodeMap.has(cid));
      if (kidIds.length === 0) continue;

      const kids = kidIds
        .map(cid => nodeMap.get(cid)!)
        .sort((a, b) => a.y - b.y);

      const pRight = parent.x + parent.width / 2;
      const cLeft = Math.min(...kids.map(k => k.x - k.width / 2));

      let topY: number;
      let bottomY: number;
      if (kids.length === 1) {
        const only = kids[0];
        const half = Math.max(18, only.height / 2 - 2);
        topY = only.y - half;
        bottomY = only.y + half;
      } else {
        const first = kids[0];
        const last = kids[kids.length - 1];
        topY = first.y - first.height / 2 + 5;
        bottomY = last.y + last.height / 2 - 5;
      }

      const braceColor = parent.isRoot
        ? theme.spineColor
        : parent.color || theme.palette[0];

      paths.push({
        id: `brace-${parent.id}`,
        kind: 'stroke',
        d: synopticCurlyBracePath(pRight, cLeft, topY, parent.y, bottomY),
        color: braceColor,
        strokeWidth: 2.35,
      });
    }
  } else if (project.type === 'fishbone' && root) {
    // 1. Espina dorsal horizontal + aleta caudal + punta hacia la cabeza
    const headLeftX = root.x - root.width / 2;
    let spineLeftX = headLeftX - 240;
    visibleNodes.forEach(n => {
      if (n.id !== root.id) {
        spineLeftX = Math.min(spineLeftX, n.x - n.width / 2 - 42);
      }
      if (n.ribSpineX !== undefined) {
        spineLeftX = Math.min(spineLeftX, n.ribSpineX - 50);
      }
    });

    expandBounds(spineLeftX - 34, -30);
    expandBounds(headLeftX, 30);

    // Aleta de cola geométrica elegante
    const tailPath = [
      `M ${r2(spineLeftX)} 0`,
      `L ${r2(spineLeftX - 26)} -22`,
      `L ${r2(spineLeftX - 18)} 0`,
      `L ${r2(spineLeftX - 26)} 22`,
      'Z',
    ].join(' ');
    paths.push({
      id: 'fishbone-tail',
      kind: 'fill',
      d: tailPath,
      color: theme.spineColor,
    });

    // Línea maestra de la espina dorsal
    paths.push({
      id: 'fishbone-spine',
      kind: 'stroke',
      d: `M ${r2(spineLeftX)} 0 L ${r2(headLeftX - 4)} 0`,
      color: theme.spineColor,
      strokeWidth: 3.6,
      arrowEnd: { x: headLeftX - 2, y: 0, angleDeg: 0, color: theme.spineColor },
    });

    // 2. Espinas diagonales primarias y sub-causas horizontales
    const catIds = (childrenMap.get(root.id) || []).filter(cid => nodeMap.has(cid));
    for (const catId of catIds) {
      const cat = nodeMap.get(catId)!;
      const ribColor = cat.color || theme.palette[0];
      const spineX = cat.ribSpineX ?? cat.x + 110;
      const startY = cat.y < 0 ? cat.y + cat.height / 2 : cat.y - cat.height / 2;
      const startX = cat.ribTipX ?? cat.x;

      paths.push({
        id: `fishbone-rib-${cat.id}`,
        kind: 'stroke',
        d: `M ${r2(startX)} ${r2(startY)} L ${r2(spineX)} 0`,
        color: ribColor,
        strokeWidth: 2.75,
        arrowEnd: {
          x: spineX,
          y: 0,
          angleDeg: (Math.atan2(0 - startY, spineX - startX) * 180) / Math.PI,
          color: ribColor,
        },
      });

      // Sub-causas horizontales conectadas con precisión milimétrica a la espina diagonal
      const subIds = (childrenMap.get(cat.id) || []).filter(sid => nodeMap.has(sid));
      for (const subId of subIds) {
        const sub = nodeMap.get(subId)!;
        const hitX = sub.ribAnchorX ?? spineX - 0.52 * Math.abs(sub.y);
        const subRight = sub.x + sub.width / 2;
        const pairEdge = edgeByPair.get(`${cat.id}->${sub.id}`);

        paths.push({
          id: `fishbone-sub-${sub.id}`,
          edgeId: pairEdge?.id,
          kind: 'stroke',
          d: `M ${r2(subRight)} ${r2(sub.y)} L ${r2(hitX)} ${r2(sub.y)}`,
          color: ribColor,
          strokeWidth: 2,
          arrowEnd: { x: hitX, y: sub.y, angleDeg: 0, color: ribColor },
          label: pairEdge?.label,
          labelX: (subRight + hitX) / 2,
          labelY: sub.y - 12,
        });

        // Causas de 3er nivel si existen
        const renderDeepFishbone = (pNode: OrganizerNode) => {
          const dKids = (childrenMap.get(pNode.id) || []).filter(did => nodeMap.has(did));
          for (const did of dKids) {
            const dNode = nodeMap.get(did)!;
            const dRight = dNode.x + dNode.width / 2;
            const pLeft = pNode.x - pNode.width / 2;
            paths.push({
              id: `fishbone-deep-${dNode.id}`,
              kind: 'stroke',
              d: elbowHorizontal(dRight, dNode.y, pLeft, pNode.y),
              color: ribColor,
              strokeWidth: 1.75,
            });
            renderDeepFishbone(dNode);
          }
        };
        renderDeepFishbone(sub);
      }
    }
  } else if (project.type === 'timeline' && root) {
    // Eje cronológico horizontal desde el borde derecho de la raíz hasta el último hito + flecha
    const milestoneIds = (childrenMap.get(root.id) || []).filter(mid => nodeMap.has(mid));
    const axisStartX = root.x + root.width / 2;
    let axisEndX = axisStartX + 180;
    milestoneIds.forEach(mid => {
      const mn = nodeMap.get(mid)!;
      axisEndX = Math.max(axisEndX, mn.x + mn.width / 2 + 54);
    });

    expandBounds(axisStartX, -24);
    expandBounds(axisEndX + 20, 24);

    paths.push({
      id: 'timeline-axis',
      kind: 'stroke',
      d: `M ${r2(axisStartX)} 0 L ${r2(axisEndX)} 0`,
      color: theme.spineColor,
      strokeWidth: 3.4,
      arrowEnd: { x: axisEndX + 2, y: 0, angleDeg: 0, color: theme.spineColor },
    });

    milestoneIds.forEach((mid, idx) => {
      const mNode = nodeMap.get(mid)!;
      const mColor = mNode.color || theme.palette[idx % theme.palette.length];
      const cardPortY = mNode.y < 0 ? mNode.y + mNode.height / 2 : mNode.y - mNode.height / 2;

      paths.push({
        id: `timeline-stem-${mNode.id}`,
        kind: 'stroke',
        d: `M ${r2(mNode.x)} 0 L ${r2(mNode.x)} ${r2(cardPortY)}`,
        color: mColor,
        strokeWidth: 2.4,
      });

      timelineBadges.push({
        id: `badge-${mNode.id}`,
        x: mNode.x,
        y: 0,
        index: mNode.milestoneIndex || idx + 1,
        color: mColor,
      });

      // Subtareas apiladas del hito
      const connectSubTimeline = (pNode: OrganizerNode) => {
        const sIds = (childrenMap.get(pNode.id) || []).filter(sid => nodeMap.has(sid));
        for (const sid of sIds) {
          const sNode = nodeMap.get(sid)!;
          const y1 = sNode.y < pNode.y ? pNode.y - pNode.height / 2 : pNode.y + pNode.height / 2;
          const y2 = sNode.y < pNode.y ? sNode.y + sNode.height / 2 : sNode.y - sNode.height / 2;
          paths.push({
            id: `timeline-sub-${sNode.id}`,
            kind: 'stroke',
            d: `M ${r2(pNode.x)} ${r2(y1)} L ${r2(sNode.x)} ${r2(y2)}`,
            color: mColor,
            strokeWidth: 1.9,
          });
          connectSubTimeline(sNode);
        }
      };
      connectSubTimeline(mNode);
    });
  } else {
    // Mindmap, Logic, Tree, Concept, Flowchart
    for (const e of project.edges) {
      if (e.isCrossLink) continue;
      const from = nodeMap.get(e.from);
      const to = nodeMap.get(e.to);
      if (!from || !to) continue;

      const branchColor = e.color || to.color || from.color || theme.palette[0];
      const style: EdgeStyle = e.style || connectorMode;

      if (project.type === 'cartographic') {
        const isFromRoot = Boolean(from.isRoot || (from.depth || 0) === 0);
        let x1: number, y1: number, x2: number, y2: number;
        let d: string;

        if (isFromRoot) {
          const sector =
            to.cartographicSector ||
            (to.y < -40 ? 'top' : to.y > 40 ? 'bottom' : to.x >= 0 ? 'right' : 'left');

          if (sector === 'top') {
            x1 = from.x;
            y1 = from.y - from.height / 2;
            x2 = to.x;
            y2 = to.y + to.height / 2;
            d = cubicVertical(x1, y1, x2, y2);
          } else if (sector === 'bottom') {
            x1 = from.x;
            y1 = from.y + from.height / 2;
            x2 = to.x;
            y2 = to.y - to.height / 2;
            d = cubicVertical(x1, y1, x2, y2);
          } else if (sector === 'right') {
            x1 = from.x + from.width / 2;
            y1 = from.y;
            x2 = to.x - to.width / 2;
            y2 = to.y;
            d = cubicHorizontal(x1, y1, x2, y2);
          } else {
            x1 = from.x - from.width / 2;
            y1 = from.y;
            x2 = to.x + to.width / 2;
            y2 = to.y;
            d = cubicHorizontal(x1, y1, x2, y2);
          }

          paths.push({
            id: e.id,
            edgeId: e.id,
            kind: 'stroke',
            d,
            color: branchColor,
            strokeWidth: 2.85,
            label: e.label,
            labelX: (x1 + x2) / 2,
            labelY: (y1 + y2) / 2,
          });
        } else {
          // Conexión de subtemas secundarios
          const isRight = to.x >= from.x;
          if (from.cartographicSector === 'top' || (to.y < from.y - 20 && Math.abs(to.x - from.x) < 40)) {
            x1 = from.x;
            y1 = from.y - from.height / 2;
            x2 = to.x;
            y2 = to.y + to.height / 2;
            d = cubicVertical(x1, y1, x2, y2);
          } else if (from.cartographicSector === 'bottom' || (to.y > from.y + 20 && Math.abs(to.x - from.x) < 40)) {
            x1 = from.x;
            y1 = from.y + from.height / 2;
            x2 = to.x;
            y2 = to.y - to.height / 2;
            d = cubicVertical(x1, y1, x2, y2);
          } else {
            x1 = isRight ? from.x + from.width / 2 : from.x - from.width / 2;
            y1 = from.y;
            x2 = isRight ? to.x - to.width / 2 : to.x + to.width / 2;
            y2 = to.y;
            d = cubicHorizontal(x1, y1, x2, y2);
          }

          paths.push({
            id: e.id,
            edgeId: e.id,
            kind: 'stroke',
            d,
            color: branchColor,
            strokeWidth: 2.1,
            label: e.label,
            labelX: (x1 + x2) / 2,
            labelY: (y1 + y2) / 2,
          });
        }
      } else if (project.type === 'mindmap' || project.type === 'logic') {
        const isRight = to.x >= from.x;
        const fromShape = resolveEffectiveShape(from, from.depth || 0, project.type, project.theme);
        const toShape = resolveEffectiveShape(to, to.depth || 1, project.type, project.theme);

        const x1 = isRight ? from.x + from.width / 2 : from.x - from.width / 2;
        const y1 = fromShape === 'underline' ? from.y + from.height / 2 : from.y;

        const x2 = isRight ? to.x - to.width / 2 : to.x + to.width / 2;
        const y2 = toShape === 'underline' ? to.y + to.height / 2 : to.y;

        if (style === 'tapered' && toShape !== 'underline') {
          const wStart = from.isRoot ? 7.5 : 4.2;
          const wEnd = (to.depth || 1) === 1 ? 3.0 : 1.9;
          paths.push({
            id: e.id,
            edgeId: e.id,
            kind: 'fill',
            d: taperedBranchPolygon(x1, y1, x2, y2, wStart, wEnd),
            color: branchColor,
            label: e.label,
            labelX: (x1 + x2) / 2,
            labelY: (y1 + y2) / 2,
          });
        } else {
          let d: string;
          if (style === 'elbow') {
            d = elbowHorizontal(x1, y1, x2, y2);
          } else if (style === 'straight') {
            d = `M ${r2(x1)} ${r2(y1)} L ${r2(x2)} ${r2(y2)}`;
          } else {
            d = cubicHorizontal(x1, y1, x2, y2);
          }

          // Si el subtema es de estilo subrayado Edraw, prolongar la línea por debajo de todo el nodo
          if (toShape === 'underline') {
            const farX = isRight ? to.x + to.width / 2 : to.x - to.width / 2;
            d = `${d} L ${r2(farX)} ${r2(y2)}`;
          }

          paths.push({
            id: e.id,
            edgeId: e.id,
            kind: 'stroke',
            d,
            color: branchColor,
            strokeWidth: from.isRoot ? 2.8 : 2.1,
            label: e.label,
            labelX: (x1 + x2) / 2,
            labelY: (y1 + y2) / 2,
          });
        }
      } else if (project.type === 'tree') {
        const x1 = from.x;
        const y1 = from.y + from.height / 2;
        const x2 = to.x;
        const y2 = to.y - to.height / 2;

        paths.push({
          id: e.id,
          edgeId: e.id,
          kind: 'stroke',
          d: elbowVertical(x1, y1, x2, y2, 36),
          color: branchColor,
          strokeWidth: 2.2,
          label: e.label,
          labelX: (x1 + x2) / 2,
          labelY: (y1 + y2) / 2,
        });
      } else if (project.type === 'concept') {
        const x1 = from.x;
        const y1 = from.y + from.height / 2;
        const x2 = to.x;
        const y2 = to.y - to.height / 2 - 4;
        const dy = y2 - y1;
        const cOffset = Math.max(32, Math.abs(dy) * 0.48) * Math.sign(dy || 1);
        const d =
          style === 'straight'
            ? `M ${r2(x1)} ${r2(y1)} L ${r2(x2)} ${r2(y2)}`
            : cubicVertical(x1, y1, x2, y2);

        // Si hay varios hijos hermanos que parten del mismo nodo padre,
        // escalonar el parámetro t para que las etiquetas no se alineen en la misma cota Y
        // y se ubiquen más cerca del destino donde la apertura horizontal es más ancha.
        const siblingKids = (childrenMap.get(from.id) || []).filter(cid => nodeMap.has(cid));
        const sIndex = siblingKids.indexOf(to.id);
        const sCount = siblingKids.length;

        let t = 0.52;
        if (sCount > 1) {
          // Escalonado suave alternado entre 0.44 y 0.64
          t = sIndex % 2 === 0 ? 0.44 : 0.64;
        }

        const oneMinusT = 1 - t;
        const p0x = x1, p0y = y1;
        const p1x = x1, p1y = y1 + cOffset;
        const p2x = x2, p2y = y2 - cOffset;
        const p3x = x2, p3y = y2;

        const lx =
          Math.pow(oneMinusT, 3) * p0x +
          3 * Math.pow(oneMinusT, 2) * t * p1x +
          3 * oneMinusT * Math.pow(t, 2) * p2x +
          Math.pow(t, 3) * p3x;

        const ly =
          Math.pow(oneMinusT, 3) * p0y +
          3 * Math.pow(oneMinusT, 2) * t * p1y +
          3 * oneMinusT * Math.pow(t, 2) * p2y +
          Math.pow(t, 3) * p3y;

        paths.push({
          id: e.id,
          edgeId: e.id,
          kind: 'stroke',
          d,
          color: branchColor,
          strokeWidth: 2.15,
          arrowEnd: { x: x2, y: y2 + 2, angleDeg: 90, color: branchColor },
          label: e.label || 'se relaciona con',
          labelX: lx,
          labelY: ly,
        });
      } else if (project.type === 'flowchart') {
        const fromShape = resolveEffectiveShape(from, from.depth || 0, 'flowchart', project.theme);
        const x2 = to.x;
        const y2 = to.y - to.height / 2 - 4;

        let d: string;
        let labelX = (from.x + x2) / 2;
        let labelY = (from.y + from.height / 2 + y2) / 2;

        if (fromShape === 'diamond' && Math.abs(to.x - from.x) > 30) {
          // Puertos laterales Este / Oeste para rombos de decisión Sí / No
          const goRight = to.x > from.x;
          const x1 = goRight ? from.x + from.width / 2 : from.x - from.width / 2;
          const y1 = from.y;
          const sx = goRight ? 1 : -1;
          const radius = 9;
          d = [
            `M ${r2(x1)} ${r2(y1)}`,
            `L ${r2(x2 - sx * radius)} ${r2(y1)}`,
            `Q ${r2(x2)} ${r2(y1)}, ${r2(x2)} ${r2(y1 + radius)}`,
            `L ${r2(x2)} ${r2(y2)}`,
          ].join(' ');
          labelX = (x1 + x2) / 2;
          labelY = y1 - 13;
        } else {
          const x1 = from.x;
          const y1 = from.y + from.height / 2;
          d = elbowVertical(x1, y1, x2, y2, 42);
        }

        paths.push({
          id: e.id,
          edgeId: e.id,
          kind: 'stroke',
          d,
          color: branchColor,
          strokeWidth: 2.25,
          arrowEnd: { x: x2, y: y2 + 2, angleDeg: 90, color: branchColor },
          label: e.label,
          labelX,
          labelY,
        });
      }
    }
  }

  /* --------------------------------------------------------------------------
   * B. RELACIONES CRUZADAS LIBRES (Estilo EdrawMax <Relationship>)
   * -------------------------------------------------------------------------- */
  for (const e of project.edges) {
    if (!e.isCrossLink) continue;
    const from = nodeMap.get(e.from);
    const to = nodeMap.get(e.to);
    if (!from || !to || from.id === to.id) continue;

    const relColor = e.color || '#D97706';
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Elegir los puertos más limpios según el vector entre ambos nodos
    let x1 = from.x;
    let y1 = from.y;
    let x2 = to.x;
    let y2 = to.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      x1 = dx >= 0 ? from.x + from.width / 2 : from.x - from.width / 2;
      x2 = dx >= 0 ? to.x - to.width / 2 : to.x + to.width / 2;
    } else {
      y1 = dy >= 0 ? from.y + from.height / 2 : from.y - from.height / 2;
      y2 = dy >= 0 ? to.y - to.height / 2 : to.y + to.height / 2;
    }

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dist = Math.hypot(x2 - x1, y2 - y1) || 1;
    // Arco perpendicular elegante para no cruzar por encima de conectores rectos
    const nx = -(y2 - y1) / dist;
    const ny = (x2 - x1) / dist;
    const bulge = Math.min(90, Math.max(42, dist * 0.24));
    const ctrlX = midX + nx * bulge;
    const ctrlY = midY + ny * bulge;

    expandBounds(ctrlX, ctrlY);

    const endAngle = (Math.atan2(y2 - ctrlY, x2 - ctrlX) * 180) / Math.PI;
    // Punto en t=0.5 de una curva cuadrática Bézier: 0.25*P0 + 0.5*C + 0.25*P2
    const curveMidX = 0.25 * x1 + 0.5 * ctrlX + 0.25 * x2;
    const curveMidY = 0.25 * y1 + 0.5 * ctrlY + 0.25 * y2;

    paths.push({
      id: e.id,
      edgeId: e.id,
      kind: 'dashed',
      d: `M ${r2(x1)} ${r2(y1)} Q ${r2(ctrlX)} ${r2(ctrlY)}, ${r2(x2)} ${r2(y2)}`,
      color: relColor,
      strokeWidth: 2.1,
      arrowEnd: { x: x2, y: y2, angleDeg: endAngle, color: relColor },
      label: e.label || 'Relación',
      labelX: curveMidX,
      labelY: curveMidY,
      isCrossLink: true,
    });
  }

  // Des-colisión inteligente de etiquetas de conectores y proposiciones para que jamás se monten entre sí
  resolveLabelCollisions(paths);
  // Garantizar separación física estricta entre etiquetas y cuadros/nodos de contenido
  preventLabelsOverlappingNodes(paths, nodeMap);

  return {
    paths,
    timelineBadges,
    visibleNodes,
    hiddenIds,
    descendantCount,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(200, maxX - minX),
      height: Math.max(120, maxY - minY),
    },
  };
}

/**
 * Separa dinámicamente cualquier par de etiquetas/píldoras de conectores
 * que se encuentren a menos distancia de su ancho/alto, eliminando solapamientos.
 */
function resolveLabelCollisions(paths: RenderedPathItem[]) {
  const labeled = paths.filter(
    p => p.label && p.labelX !== undefined && p.labelY !== undefined
  );
  if (labeled.length <= 1) return;

  for (let iter = 0; iter < 6; iter++) {
    let moved = false;
    for (let i = 0; i < labeled.length; i++) {
      for (let j = i + 1; j < labeled.length; j++) {
        const a = labeled[i];
        const b = labeled[j];
        const wA = Math.max(90, (a.label?.length || 10) * 7.5 + 24);
        const wB = Math.max(90, (b.label?.length || 10) * 7.5 + 24);
        const hA = 28;
        const hB = 28;

        const dx = b.labelX! - a.labelX!;
        const dy = b.labelY! - a.labelY!;
        const minGapX = (wA + wB) / 2 + 10;
        const minGapY = (hA + hB) / 2 + 6;

        const overlapX = minGapX - Math.abs(dx);
        const overlapY = minGapY - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          moved = true;
          if (overlapY <= overlapX) {
            const shiftY = overlapY / 2 + 1;
            if (dy >= 0) {
              a.labelY! -= shiftY;
              b.labelY! += shiftY;
            } else {
              a.labelY! += shiftY;
              b.labelY! -= shiftY;
            }
          } else {
            const shiftX = overlapX / 2 + 2;
            if (dx >= 0) {
              a.labelX! -= shiftX;
              b.labelX! += shiftX;
            } else {
              a.labelX! += shiftX;
              b.labelX! -= shiftX;
            }
          }
        }
      }
    }
    if (!moved) break;
  }
}

/**
 * Garantiza de forma estricta que ninguna píldora de conector toque ni se sobreponga
 * con los cuadros/nodos de la escena, manteniendo una separación visual limpia de al menos 12px.
 */
function preventLabelsOverlappingNodes(
  paths: RenderedPathItem[],
  nodeMap: Map<string, OrganizerNode>
) {
  const labeled = paths.filter(
    p => p.label && p.labelX !== undefined && p.labelY !== undefined
  );
  if (labeled.length === 0) return;

  const margin = 12; // Margen de separación física obligatoria entre la píldora y cualquier cuadro

  for (const path of labeled) {
    const pillW = Math.max(90, (path.label!.length * 7.5) + 24);
    const pillH = 26;

    for (const node of nodeMap.values()) {
      const halfNodeW = node.width / 2 + margin;
      const halfNodeH = node.height / 2 + margin;
      const halfPillW = pillW / 2;
      const halfPillH = pillH / 2;

      const dx = path.labelX! - node.x;
      const dy = path.labelY! - node.y;

      const requiredX = halfNodeW + halfPillW;
      const requiredY = halfNodeH + halfPillH;

      const overlapX = requiredX - Math.abs(dx);
      const overlapY = requiredY - Math.abs(dy);

      // Si la píldora intersecta la caja del nodo con su margen de seguridad
      if (overlapX > 0 && overlapY > 0) {
        if (overlapY <= overlapX) {
          // Desplazar verticalmente fuera del nodo asegurando el margen
          path.labelY! += (dy >= 0 ? 1 : -1) * (overlapY + 4);
        } else {
          // Desplazar horizontalmente fuera del nodo asegurando el margen
          path.labelX! += (dx >= 0 ? 1 : -1) * (overlapX + 4);
        }
      }
    }
  }
}
