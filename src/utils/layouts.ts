import type {
  OrganizerEdge,
  OrganizerNode,
  OrganizerType,
  ThemeId,
} from '../types/organizer';
import { getThemeConfig } from './themes';
import { computeHierarchyVisibility, measureNodeDimensions } from './measure';
import { pruneRedundantConnectorNodes } from './graphCleaners';

export const PALETTES = [
  '#E11D48',
  '#2563EB',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#65A30D',
];

/**
 * Motor Maestro de Disposición Estructural (Inspirado en edgraphics.dll de EdrawMax).
 * Pre-mide cada caja de texto en coordenadas del mundo y aplica geometría determinista
 * libre de colisiones para los 8 tipos de organizadores visuales.
 */
export function applyLayout(
  rawNodes: OrganizerNode[],
  rawEdges: OrganizerEdge[],
  type: OrganizerType,
  themeId: ThemeId = 'vitality-warm',
  recolorBranches = false,
  cartographicDirection: 'clockwise' | 'counterclockwise' = 'clockwise'
): { nodes: OrganizerNode[]; edges: OrganizerEdge[] } {
  if (!rawNodes || rawNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Poda preventiva: eliminar nodos puentes conectores redundantes ("como", "por", etc.)
  const pruned = pruneRedundantConnectorNodes(rawNodes, rawEdges, type);
  const cleanRawNodes = pruned.nodes;
  const cleanRawEdges = pruned.edges;

  const theme = getThemeConfig(themeId);
  const nodes: OrganizerNode[] = cleanRawNodes.map(n => ({
    ...n,
    ribSpineX: undefined,
    ribTipX: undefined,
    ribTipY: undefined,
    ribAnchorX: undefined,
    milestoneIndex: undefined,
    cartographicSector: undefined,
  }));
  const edges: OrganizerEdge[] = cleanRawEdges.map(e => ({ ...e }));

  const nodeMap = new Map<string, OrganizerNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // 1. Identificar nodo raíz principal
  let root =
    nodes.find(n => n.isRoot) ||
    nodes.find(n => !n.parentId || !nodeMap.has(n.parentId)) ||
    nodes[0];

  nodes.forEach(n => {
    n.isRoot = n.id === root.id;
  });
  root.parentId = null;

  // 2. Construir árbol jerárquico seguro sin ciclos (excluyendo relaciones cruzadas)
  const childrenMap = new Map<string, string[]>();
  nodes.forEach(n => childrenMap.set(n.id, []));

  const attached = new Set<string>([root.id]);

  for (const n of nodes) {
    if (n.id === root.id) continue;
    if (n.parentId && nodeMap.has(n.parentId) && !attached.has(n.id)) {
      childrenMap.get(n.parentId)!.push(n.id);
      attached.add(n.id);
    }
  }

  for (const e of edges) {
    if (e.isCrossLink) continue;
    if (
      nodeMap.has(e.from) &&
      nodeMap.has(e.to) &&
      !attached.has(e.to) &&
      e.from !== e.to
    ) {
      childrenMap.get(e.from)!.push(e.to);
      nodeMap.get(e.to)!.parentId = e.from;
      attached.add(e.to);
    }
  }

  // Si algún nodo quedó huérfano, conectarlo a la raíz para no perderlo jamás
  for (const n of nodes) {
    if (!attached.has(n.id)) {
      n.parentId = root.id;
      childrenMap.get(root.id)!.push(n.id);
      attached.add(n.id);
    }
  }

  // 3. Asignar depth, branchIndex, roles de diagrama de flujo y colores Rainbow
  const visitedWalk = new Set<string>();
  function assignMetadata(id: string, depth: number, branchIdx: number) {
    if (visitedWalk.has(id)) return;
    visitedWalk.add(id);

    const node = nodeMap.get(id)!;
    node.depth = depth;
    node.branchIndex = branchIdx;

    if (depth === 0) {
      if (recolorBranches || !node.color) {
        node.color = theme.rootBg;
      }
    } else {
      const paletteColor = theme.palette[branchIdx % theme.palette.length];
      const parentNode = node.parentId ? nodeMap.get(node.parentId) : undefined;
      if (recolorBranches || !node.color) {
        node.color = depth === 1 ? paletteColor : parentNode?.color || paletteColor;
      }
    }

    const kids = childrenMap.get(id) || [];

    // Inferencia semántica automática en Diagramas de Flujo
    if (type === 'flowchart') {
      const lower = node.text.toLowerCase();
      if (depth === 0) {
        node.flowType = 'start';
      } else if (
        node.flowType === 'decision' ||
        node.shape === 'diamond' ||
        kids.length >= 2 ||
        lower.includes('?') ||
        lower.includes('¿')
      ) {
        node.flowType = 'decision';
      } else if (
        kids.length === 0 &&
        (lower.includes('fin') ||
          lower.includes('cierre') ||
          lower.includes('entrega') ||
          lower.includes('completado') ||
          lower.includes('éxito'))
      ) {
        node.flowType = 'end';
      } else if (
        node.flowType === 'data' ||
        lower.includes('datos') ||
        lower.includes('entrada') ||
        lower.includes('formulario') ||
        lower.includes('registro')
      ) {
        node.flowType = 'data';
      } else if (!node.flowType || node.flowType === 'start') {
        node.flowType = 'process';
      }
    }

    // Medir dimensiones determinísticas exactas en coordenadas del mundo
    const measured = measureNodeDimensions(node, depth, type, themeId);
    node.width = measured.width;
    node.height = measured.height;
    node.lines = measured.lines;

    kids.forEach((childId, idx) => {
      const nextBranchIdx = depth === 0 ? idx : branchIdx;
      assignMetadata(childId, depth + 1, nextBranchIdx);
    });
  }

  assignMetadata(root.id, 0, 0);

  // 4. Determinar visibilidad respetando nodos contraídos (`collapsed`)
  const { hiddenIds } = computeHierarchyVisibility(nodes, edges);
  const visibleChildren = (id: string): string[] =>
    (childrenMap.get(id) || []).filter(cid => !hiddenIds.has(cid));

  // 5. Ejecutar el motor geométrico específico según el tipo de organizador
  switch (type) {
    case 'mindmap':
      layoutMindmap(root.id, nodeMap, visibleChildren);
      break;
    case 'cartographic':
      layoutCartographic(root.id, nodeMap, visibleChildren, cartographicDirection);
      break;
    case 'logic':
      layoutLogic(root.id, nodeMap, visibleChildren);
      break;
    case 'synoptic':
      layoutSynoptic(root.id, nodeMap, visibleChildren);
      break;
    case 'fishbone':
      layoutFishbone(root.id, nodeMap, visibleChildren);
      break;
    case 'tree':
      layoutVerticalTree(root.id, nodeMap, visibleChildren, 98, 58);
      break;
    case 'concept':
      layoutVerticalTree(root.id, nodeMap, visibleChildren, 148, 120);
      break;
    case 'flowchart':
      layoutVerticalTree(root.id, nodeMap, visibleChildren, 120, 80);
      break;
    case 'timeline':
      layoutTimeline(root.id, nodeMap, visibleChildren);
      break;
    case 'radial':
      layoutRadial(root.id, nodeMap, visibleChildren);
      break;
    case 'matrix':
      layoutMatrix(root.id, nodeMap, visibleChildren);
      break;
    case 'cycle':
      layoutCycle(root.id, nodeMap, visibleChildren);
      break;
    default:
      layoutMindmap(root.id, nodeMap, visibleChildren);
  }

  // 6. Estacionar nodos ocultos (colapsados) en las coordenadas de su ancestro visible
  function parkHiddenSubtrees(id: string, anchorX: number, anchorY: number) {
    const node = nodeMap.get(id)!;
    if (hiddenIds.has(id)) {
      node.x = anchorX;
      node.y = anchorY;
    }
    const nextX = hiddenIds.has(id) ? anchorX : node.x;
    const nextY = hiddenIds.has(id) ? anchorY : node.y;
    for (const cid of childrenMap.get(id) || []) {
      parkHiddenSubtrees(cid, nextX, nextY);
    }
  }
  parkHiddenSubtrees(root.id, root.x, root.y);

  // Evitar estrictamente la sobreposición de cuadros y garantizar separación para conectores
  preventNodeCollisions(nodes, hiddenIds, edges);

  // 7. Sincronizar aristas jerárquicas y sus colores/etiquetas semánticas
  const existingEdgeKey = new Set<string>();
  edges.forEach(e => {
    existingEdgeKey.add(`${e.from}->${e.to}`);
    if (!e.isCrossLink) {
      const target = nodeMap.get(e.to);
      const source = nodeMap.get(e.from);
      if (target?.color) {
        e.color = target.color;
      }
      if (type === 'flowchart' && source?.flowType === 'decision' && !e.label) {
        const siblings = childrenMap.get(source.id) || [];
        const idx = siblings.indexOf(e.to);
        if (idx === 0 && siblings.length >= 2) e.label = 'Sí';
        else if (idx === 1 && siblings.length >= 2) e.label = 'No';
      }
    }
  });

  // Asegurar que todo vínculo padre->hijo tenga su arista correspondiente
  for (const n of nodes) {
    if (n.parentId && nodeMap.has(n.parentId)) {
      const key = `${n.parentId}->${n.id}`;
      if (!existingEdgeKey.has(key)) {
        edges.push({
          id: `edge-${n.parentId}-${n.id}`,
          from: n.parentId,
          to: n.id,
          color: n.color || theme.palette[0],
        });
        existingEdgeKey.add(key);
      }
    }
  }

  const finalNodeIds = new Set(nodes.map(n => n.id));
  const validEdges = edges.filter(e => finalNodeIds.has(e.from) && finalNodeIds.has(e.to));

  return { nodes, edges: validEdges };
}

/* ============================================================================
 * 1. MAPA MENTAL RADIAL EQUILIBRADO (Estilo EdrawMax Balanced Mind Map)
 * ============================================================================ */
function computeVerticalSubtreeSpan(
  id: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[],
  vGap: number,
  memo: Map<string, number>
): number {
  if (memo.has(id)) return memo.get(id)!;
  const node = nodeMap.get(id)!;
  const kids = visibleChildren(id);
  if (kids.length === 0) {
    memo.set(id, node.height);
    return node.height;
  }
  let childrenSum = 0;
  for (const cid of kids) {
    childrenSum += computeVerticalSubtreeSpan(cid, nodeMap, visibleChildren, vGap, memo);
  }
  childrenSum += (kids.length - 1) * vGap;
  const span = Math.max(node.height, childrenSum);
  memo.set(id, span);
  return span;
}

function placeHorizontalSubtree(
  id: string,
  side: 'left' | 'right',
  centerY: number,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[],
  spanMemo: Map<string, number>,
  vGap: number
) {
  const node = nodeMap.get(id)!;
  node.y = centerY;
  node.side = side;

  const kids = visibleChildren(id);
  if (kids.length === 0) return;

  // Separación horizontal generosa para dar holgura completa a las píldoras de conectores
  const hGap = (node.depth || 0) === 0 ? 116 : 124;
  const totalKidsSpan =
    kids.reduce((acc, cid) => acc + (spanMemo.get(cid) || 48), 0) +
    (kids.length - 1) * vGap;

  let cursorY = centerY - totalKidsSpan / 2;

  for (const cid of kids) {
    const child = nodeMap.get(cid)!;
    const cSpan = spanMemo.get(cid) || child.height;
    const childCenterY = cursorY + cSpan / 2;

    if (side === 'right') {
      child.x = node.x + node.width / 2 + hGap + child.width / 2;
    } else {
      child.x = node.x - node.width / 2 - hGap - child.width / 2;
    }

    placeHorizontalSubtree(
      cid,
      side,
      childCenterY,
      nodeMap,
      visibleChildren,
      spanMemo,
      vGap
    );

    cursorY += cSpan + vGap;
  }
}

function layoutMindmap(
  rootId: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[]
) {
  const root = nodeMap.get(rootId)!;
  root.x = 0;
  root.y = 0;
  root.side = 'center';

  const vGap = 18;
  const mainBranchGap = 32;
  const spanMemo = new Map<string, number>();
  computeVerticalSubtreeSpan(rootId, nodeMap, visibleChildren, vGap, spanMemo);

  const mainKids = visibleChildren(rootId);
  if (mainKids.length === 0) return;

  // Partición equilibrada por altura acumulada (Derecha primero, luego Izquierda)
  const rightKids: string[] = [];
  const leftKids: string[] = [];
  let rightHeight = 0;
  let leftHeight = 0;

  mainKids.forEach((cid, index) => {
    const h = spanMemo.get(cid) || 50;
    if (index === 0 || rightHeight <= leftHeight) {
      rightKids.push(cid);
      rightHeight += h + mainBranchGap;
    } else {
      leftKids.push(cid);
      leftHeight += h + mainBranchGap;
    }
  });

  const placeSideGroup = (group: string[], side: 'left' | 'right') => {
    if (group.length === 0) return;
    const totalH =
      group.reduce((acc, cid) => acc + (spanMemo.get(cid) || 50), 0) +
      (group.length - 1) * mainBranchGap;

    let cursorY = -totalH / 2;
    const hGap = 92;

    for (const cid of group) {
      const child = nodeMap.get(cid)!;
      const cSpan = spanMemo.get(cid) || child.height;
      const childCenterY = cursorY + cSpan / 2;

      child.x =
        side === 'right'
          ? root.x + root.width / 2 + hGap + child.width / 2
          : root.x - root.width / 2 - hGap - child.width / 2;

      placeHorizontalSubtree(
        cid,
        side,
        childCenterY,
        nodeMap,
        visibleChildren,
        spanMemo,
        vGap
      );
      cursorY += cSpan + mainBranchGap;
    }
  };

  placeSideGroup(rightKids, 'right');
  placeSideGroup(leftKids, 'left');
}

/* ============================================================================
 * 1.B CARTOGRAFÍA CONCEPTUAL DE OCHO EJES (Sergio Tobón / Mapa Gráfico)
 * Configurable en Sentido Horario o Antihorario
 * ============================================================================ */
function layoutCartographic(
  rootId: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[],
  direction: 'clockwise' | 'counterclockwise' = 'clockwise'
) {
  const root = nodeMap.get(rootId)!;
  root.x = 0;
  root.y = 0;
  root.side = 'center';

  const vGap = 32;
  const spanMemo = new Map<string, number>();
  computeVerticalSubtreeSpan(rootId, nodeMap, visibleChildren, vGap, spanMemo);

  const axes = visibleChildren(rootId);
  if (axes.length === 0) return;

  const topAxes: string[] = [];
  const bottomAxes: string[] = [];
  const rightAxes: string[] = [];
  const leftAxes: string[] = [];

  const n = axes.length;

  if (n === 8) {
    if (direction === 'clockwise') {
      // Sentido Horario Canónico 1-3-1-3 (Simetría Bilateral Perfecta)
      // Norte: 12:00
      topAxes.push(axes[0]);                             // 1. Ejemplificación
      // Este: 1:30, 3:00, 4:30 (3 ejes)
      rightAxes.push(axes[1], axes[2], axes[3]);         // 2. Noción, 3. Categorización, 4. Caracterización
      // Sur: 6:00
      bottomAxes.push(axes[5]);                          // 6. Subdivisión
      // Oeste: 10:30, 9:00, 7:30 (3 ejes de arriba a abajo en el flanco izquierdo)
      leftAxes.push(axes[7], axes[6], axes[4]);          // 8. Metodología, 7. Vinculación, 5. Diferenciación
    } else {
      // Sentido Antihorario Canónico 1-3-1-3 (Simetría Bilateral Perfecta)
      topAxes.push(axes[0]);                             // 1. Ejemplificación
      // Oeste: 10:30, 9:00, 7:30 (3 ejes)
      leftAxes.push(axes[1], axes[2], axes[3]);          // 2. Noción, 3. Categorización, 4. Caracterización
      // Sur: 6:00
      bottomAxes.push(axes[5]);                          // 6. Subdivisión
      // Este: de arriba a abajo en el flanco derecho
      rightAxes.push(axes[7], axes[6], axes[4]);         // 8. Metodología, 7. Vinculación, 5. Diferenciación
    }
  } else {
    // Distribución general perfectamente equilibrada para cualquier número de ramas
    topAxes.push(axes[0]);
    if (n > 1) {
      const remaining = axes.slice(1);
      if (remaining.length === 1) {
        bottomAxes.push(remaining[0]);
      } else {
        const hasBottom = remaining.length >= 3;
        let rightList: string[] = [];
        let leftList: string[] = [];

        if (hasBottom) {
          const mid = Math.floor(remaining.length / 2);
          bottomAxes.push(remaining[mid]);
          rightList = remaining.slice(0, mid);
          leftList = remaining.slice(mid + 1);
        } else {
          const half = Math.ceil(remaining.length / 2);
          rightList = remaining.slice(0, half);
          leftList = remaining.slice(half);
        }

        if (direction === 'clockwise') {
          rightAxes.push(...rightList);
          leftAxes.push(...leftList.reverse());
        } else {
          leftAxes.push(...rightList);
          rightAxes.push(...leftList.reverse());
        }
      }
    }
  }

  // Función recursiva para apilar limpiamente subárboles verticales en los ejes Norte y Sur
  const stackVerticalCartographicSubtree = (
    parentId: string,
    currentEdgeY: number,
    dirSign: -1 | 1 // -1 = hacia arriba (Norte), +1 = hacia abajo (Sur)
  ) => {
    const kids = visibleChildren(parentId);
    if (kids.length === 0) return;

    let cursorEdgeY = currentEdgeY;
    for (const kidId of kids) {
      const kidNode = nodeMap.get(kidId);
      if (!kidNode) continue;
      kidNode.x = root.x;
      kidNode.side = dirSign === -1 ? 'top' : 'bottom';
      kidNode.cartographicSector = dirSign === -1 ? 'top' : 'bottom';
      kidNode.y = cursorEdgeY + dirSign * (kidNode.height / 2);

      // Separación vertical amplia para permitir que la píldora conectora "se ilustra mediante" flote holgada
      const nextEdgeY = kidNode.y + dirSign * (kidNode.height / 2 + 76);
      stackVerticalCartographicSubtree(kidId, nextEdgeY, dirSign);
      cursorEdgeY = nextEdgeY;
    }
  };

  // 1. Sector Top (Norte: Ej. 1. Ejemplificación)
  if (topAxes.length > 0) {
    const vGapTop = 96;
    for (const tid of topAxes) {
      const tNode = nodeMap.get(tid)!;
      tNode.cartographicSector = 'top';
      tNode.side = 'top';
      tNode.x = root.x;
      tNode.y = root.y - root.height / 2 - vGapTop - tNode.height / 2;

      stackVerticalCartographicSubtree(
        tid,
        tNode.y - tNode.height / 2 - 84,
        -1
      );
    }
  }

  // 2. Sector Bottom (Sur: Ej. 6. Subdivisión)
  if (bottomAxes.length > 0) {
    const vGapBot = 96;
    for (const bid of bottomAxes) {
      const bNode = nodeMap.get(bid)!;
      bNode.cartographicSector = 'bottom';
      bNode.side = 'bottom';
      bNode.x = root.x;
      bNode.y = root.y + root.height / 2 + vGapBot + bNode.height / 2;

      stackVerticalCartographicSubtree(
        bid,
        bNode.y + bNode.height / 2 + 84,
        1
      );
    }
  }

  // 3. Sector Right (Flanco Este)
  if (rightAxes.length > 0) {
    const hGapRight = 135;
    const totalSpanRight =
      rightAxes.reduce((acc, cid) => acc + (spanMemo.get(cid) || 50), 0) +
      (rightAxes.length - 1) * 32;

    let cursorY = root.y - totalSpanRight / 2;

    for (const rid of rightAxes) {
      const rNode = nodeMap.get(rid)!;
      const cSpan = spanMemo.get(rid) || rNode.height;
      const centerY = cursorY + cSpan / 2;

      rNode.cartographicSector = 'right';
      rNode.side = 'right';
      rNode.x = root.x + root.width / 2 + hGapRight + rNode.width / 2;
      rNode.y = centerY;

      placeHorizontalSubtree(
        rid,
        'right',
        centerY,
        nodeMap,
        visibleChildren,
        spanMemo,
        32
      );

      cursorY += cSpan + 32;
    }
  }

  // 4. Sector Left (Flanco Oeste)
  if (leftAxes.length > 0) {
    const hGapLeft = 135;
    const totalSpanLeft =
      leftAxes.reduce((acc, cid) => acc + (spanMemo.get(cid) || 50), 0) +
      (leftAxes.length - 1) * 32;

    let cursorY = root.y - totalSpanLeft / 2;

    for (const lid of leftAxes) {
      const lNode = nodeMap.get(lid)!;
      const cSpan = spanMemo.get(lid) || lNode.height;
      const centerY = cursorY + cSpan / 2;

      lNode.cartographicSector = 'left';
      lNode.side = 'left';
      lNode.x = root.x - root.width / 2 - hGapLeft - lNode.width / 2;
      lNode.y = centerY;

      placeHorizontalSubtree(
        lid,
        'left',
        centerY,
        nodeMap,
        visibleChildren,
        spanMemo,
        32
      );

      cursorY += cSpan + 32;
    }
  }
}

/* ============================================================================
 * 2. MAPA LÓGICO DERECHO (Jerarquía fluida Izquierda -> Derecha)
 * ============================================================================ */
function layoutLogic(
  rootId: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[]
) {
  const root = nodeMap.get(rootId)!;
  root.x = -300;
  root.y = 0;
  root.side = 'right';

  const vGap = 20;
  const spanMemo = new Map<string, number>();
  computeVerticalSubtreeSpan(rootId, nodeMap, visibleChildren, vGap, spanMemo);
  placeHorizontalSubtree(rootId, 'right', 0, nodeMap, visibleChildren, spanMemo, vGap);
}

/* ============================================================================
 * 3. CUADRO SINÓPTICO DE LLAVES '{' (Columnas alineadas a la izquierda por grupo)
 * ============================================================================ */
function layoutSynoptic(
  rootId: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[]
) {
  const root = nodeMap.get(rootId)!;
  root.x = -360;
  root.y = 0;
  root.side = 'right';

  const vGap = 18;
  const braceGap = 82; // Espacio amplio y limpio para las llaves caligráficas '{'
  const spanMemo = new Map<string, number>();
  computeVerticalSubtreeSpan(rootId, nodeMap, visibleChildren, vGap, spanMemo);

  function placeSynopticGroup(parentId: string, centerY: number) {
    const parent = nodeMap.get(parentId)!;
    parent.y = centerY;
    parent.side = 'right';

    const kids = visibleChildren(parentId);
    if (kids.length === 0) return;

    // Todos los hijos directos de esta llave comparten exactamente el mismo margen izquierdo
    const columnLeftX = parent.x + parent.width / 2 + braceGap;

    const totalSpan =
      kids.reduce((acc, cid) => acc + (spanMemo.get(cid) || 44), 0) +
      (kids.length - 1) * vGap;

    let cursorY = centerY - totalSpan / 2;
    for (const cid of kids) {
      const child = nodeMap.get(cid)!;
      const cSpan = spanMemo.get(cid) || child.height;
      const childCenterY = cursorY + cSpan / 2;

      child.x = columnLeftX + child.width / 2;
      placeSynopticGroup(cid, childCenterY);

      cursorY += cSpan + vGap;
    }
  }

  placeSynopticGroup(rootId, 0);
}

/* ============================================================================
 * 4. DIAGRAMA DE ISHIKAWA / ESPINA DE PESCADO (Geometría Exacta a ~62°)
 * ============================================================================ */
function layoutFishbone(
  rootId: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[]
) {
  const root = nodeMap.get(rootId)!;
  const SLOPE = 0.52; // Inclinación horizontal por píxel vertical de la espina

  root.y = 0;
  root.x = 380;
  root.side = 'left';

  const categories = visibleChildren(rootId);
  if (categories.length === 0) return;

  const vSubGap = 18;
  const subSpanMemo = new Map<string, number>();
  for (const catId of categories) {
    for (const subId of visibleChildren(catId)) {
      computeVerticalSubtreeSpan(subId, nodeMap, visibleChildren, 14, subSpanMemo);
    }
  }

  interface LocalRibData {
    catId: string;
    sign: 1 | -1;
    nodesInRib: string[];
    localMinX: number;
    localMaxX: number;
  }

  const topRibs: LocalRibData[] = [];
  const bottomRibs: LocalRibData[] = [];

  // Paso 1: Construir cada espina en coordenadas locales (spineX = 0) para medir su alcance exacto
  categories.forEach((catId, idx) => {
    const sign: 1 | -1 = idx % 2 === 0 ? -1 : 1; // Pares arriba (-Y), impares abajo (+Y)
    const cat = nodeMap.get(catId)!;
    const subCauses = visibleChildren(catId);
    const nodesInRib: string[] = [catId];

    let cursorAbsY = 52;

    for (const subId of subCauses) {
      const sub = nodeMap.get(subId)!;
      const spanH = subSpanMemo.get(subId) || sub.height;
      const centerAbsY = cursorAbsY + spanH / 2;
      const subY = sign * centerAbsY;

      // Coordenada X exacta sobre la espina diagonal en localSpineX = 0
      const ribHitX = -SLOPE * centerAbsY;
      sub.ribAnchorX = ribHitX;
      sub.y = subY;
      sub.x = ribHitX - 28 - sub.width / 2;
      sub.side = 'left';
      nodesInRib.push(subId);

      // Si una sub-causa tiene causas terciarias, apilarlas limpiamente a su izquierda
      const collectDeep = (parentSubId: string) => {
        const deepKids = visibleChildren(parentSubId);
        if (deepKids.length === 0) return;
        const pNode = nodeMap.get(parentSubId)!;
        const totalDeepH =
          deepKids.reduce((a, id) => a + (subSpanMemo.get(id) || nodeMap.get(id)!.height), 0) +
          (deepKids.length - 1) * 14;
        let dCursor = pNode.y - totalDeepH / 2;
        for (const dId of deepKids) {
          const dNode = nodeMap.get(dId)!;
          const dSpan = subSpanMemo.get(dId) || dNode.height;
          dNode.y = dCursor + dSpan / 2;
          dNode.x = pNode.x - pNode.width / 2 - 42 - dNode.width / 2;
          dNode.side = 'left';
          nodesInRib.push(dId);
          collectDeep(dId);
          dCursor += dSpan + 14;
        }
      };
      collectDeep(subId);

      cursorAbsY += spanH + vSubGap;
    }

    if (subCauses.length === 0) {
      cursorAbsY = 112;
    }

    const tipAbsY = cursorAbsY + 18;
    const tipX = -SLOPE * tipAbsY;

    cat.ribSpineX = 0;
    cat.ribTipX = tipX;
    cat.ribTipY = sign * tipAbsY;
    cat.x = tipX;
    cat.y = sign * (tipAbsY + cat.height / 2 + 2);
    cat.side = sign === -1 ? 'top' : 'bottom';

    let localMinX = Infinity;
    let localMaxX = -Infinity;
    for (const nid of nodesInRib) {
      const n = nodeMap.get(nid)!;
      localMinX = Math.min(localMinX, n.x - n.width / 2);
      localMaxX = Math.max(localMaxX, n.x + n.width / 2);
    }
    localMaxX = Math.max(localMaxX, 0);

    const ribData: LocalRibData = {
      catId,
      sign,
      nodesInRib,
      localMinX,
      localMaxX,
    };

    if (sign === -1) topRibs.push(ribData);
    else bottomRibs.push(ribData);
  });

  // Paso 2: Posicionar columnas de derecha a izquierda sin ninguna colisión horizontal
  const numCols = Math.max(topRibs.length, bottomRibs.length);
  const headLeftEdge = root.x - root.width / 2;
  let currentRightBoundaryTop = headLeftEdge - 75;
  let currentRightBoundaryBottom = headLeftEdge - 105; // Ligero desfase estético clásico Ishikawa

  for (let col = 0; col < numCols; col++) {
    const top = topRibs[col];
    const bot = bottomRibs[col];

    if (top) {
      // Asegurar que localMaxX + spineX <= currentRightBoundaryTop
      const spineX = Math.min(currentRightBoundaryTop - top.localMaxX, currentRightBoundaryTop);
      shiftRibNodes(top, spineX, nodeMap);
      currentRightBoundaryTop = spineX + top.localMinX - 52;
    }

    if (bot) {
      const spineX = Math.min(currentRightBoundaryBottom - bot.localMaxX, currentRightBoundaryBottom);
      shiftRibNodes(bot, spineX, nodeMap);
      currentRightBoundaryBottom = spineX + bot.localMinX - 52;
    }
  }

  // Paso 3: Centrar el conjunto completo alrededor de X = 0 para equilibrio visual inmediato
  let globalMinX = root.x - root.width / 2;
  let globalMaxX = root.x + root.width / 2;
  nodeMap.forEach(n => {
    if (n.x !== undefined) {
      globalMinX = Math.min(globalMinX, n.x - n.width / 2);
      globalMaxX = Math.max(globalMaxX, n.x + n.width / 2);
    }
  });
  const centerShiftX = -((globalMinX + globalMaxX) / 2);
  nodeMap.forEach(n => {
    n.x += centerShiftX;
    if (n.ribSpineX !== undefined) n.ribSpineX += centerShiftX;
    if (n.ribTipX !== undefined) n.ribTipX += centerShiftX;
    if (n.ribAnchorX !== undefined) n.ribAnchorX += centerShiftX;
  });
}

function shiftRibNodes(
  rib: { catId: string; nodesInRib: string[] },
  spineX: number,
  nodeMap: Map<string, OrganizerNode>
) {
  for (const nid of rib.nodesInRib) {
    const n = nodeMap.get(nid)!;
    n.x += spineX;
    if (n.ribSpineX !== undefined) n.ribSpineX += spineX;
    if (n.ribTipX !== undefined) n.ribTipX += spineX;
    if (n.ribAnchorX !== undefined) n.ribAnchorX += spineX;
  }
}

/* ============================================================================
 * 5, 6, 7. ÁRBOL JERÁRQUICO, MAPA CONCEPTUAL Y DIAGRAMA DE FLUJO
 * ============================================================================ */
function computeHorizontalSubtreeWidth(
  id: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[],
  hGap: number,
  memo: Map<string, number>
): number {
  if (memo.has(id)) return memo.get(id)!;
  const node = nodeMap.get(id)!;
  const kids = visibleChildren(id);
  if (kids.length === 0) {
    memo.set(id, node.width);
    return node.width;
  }
  let sum = 0;
  for (const cid of kids) {
    sum += computeHorizontalSubtreeWidth(cid, nodeMap, visibleChildren, hGap, memo);
  }
  sum += (kids.length - 1) * hGap;
  const totalW = Math.max(node.width, sum);
  memo.set(id, totalW);
  return totalW;
}

function layoutVerticalTree(
  rootId: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[],
  levelGapY: number,
  siblingGapX: number
) {
  const widthMemo = new Map<string, number>();
  computeHorizontalSubtreeWidth(rootId, nodeMap, visibleChildren, siblingGapX, widthMemo);

  function placeNode(id: string, centerX: number, topY: number) {
    const node = nodeMap.get(id)!;
    node.x = centerX;
    node.y = topY + node.height / 2;
    node.side = 'bottom';

    const kids = visibleChildren(id);
    if (kids.length === 0) return;

    const totalKidsW =
      kids.reduce((acc, cid) => acc + (widthMemo.get(cid) || 140), 0) +
      (kids.length - 1) * siblingGapX;

    let cursorX = centerX - totalKidsW / 2;
    const nextTopY = topY + node.height + levelGapY;

    for (const cid of kids) {
      const cSpanW = widthMemo.get(cid) || nodeMap.get(cid)!.width;
      const childCenterX = cursorX + cSpanW / 2;
      placeNode(cid, childCenterX, nextTopY);
      cursorX += cSpanW + siblingGapX;
    }
  }

  placeNode(rootId, 0, -240);
}

/* ============================================================================
 * 8. LÍNEA DE TIEMPO CRONOLÓGICA (Eje central + Hitos alternados arriba/abajo)
 * ============================================================================ */
function layoutTimeline(
  rootId: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[]
) {
  const root = nodeMap.get(rootId)!;
  root.y = 0;
  root.x = 0;
  root.side = 'right';

  const milestones = visibleChildren(rootId);
  if (milestones.length === 0) return;

  let cursorX = root.x + root.width / 2 + 110;

  milestones.forEach((mId, index) => {
    const mNode = nodeMap.get(mId)!;
    const sign: -1 | 1 = index % 2 === 0 ? -1 : 1; // Alternar arriba (-1) y abajo (+1)
    const subTasks = visibleChildren(mId);

    // Calcular el ancho máximo de columna para este hito y sus subtareas
    let colWidth = mNode.width;
    const collectMaxW = (id: string) => {
      const n = nodeMap.get(id)!;
      colWidth = Math.max(colWidth, n.width);
      visibleChildren(id).forEach(collectMaxW);
    };
    subTasks.forEach(collectMaxW);

    const centerX = cursorX + colWidth / 2;
    mNode.x = centerX;
    mNode.y = sign * (72 + mNode.height / 2);
    mNode.side = sign === -1 ? 'top' : 'bottom';
    mNode.milestoneIndex = index + 1;

    // Apilar subtareas hacia afuera (más arriba si es superior, más abajo si es inferior)
    let subCursorEdgeY = mNode.y + sign * (mNode.height / 2 + 22);

    const stackSubtasks = (ids: string[]) => {
      for (const sId of ids) {
        const sNode = nodeMap.get(sId)!;
        sNode.x = centerX;
        sNode.y = subCursorEdgeY + sign * (sNode.height / 2);
        sNode.side = sign === -1 ? 'top' : 'bottom';
        subCursorEdgeY = sNode.y + sign * (sNode.height / 2 + 16);
        const deeper = visibleChildren(sId);
        if (deeper.length > 0) {
          stackSubtasks(deeper);
        }
      }
    };
    stackSubtasks(subTasks);

    cursorX += colWidth + 56;
  });

  // Centrar horizontalmente toda la línea de tiempo alrededor del origen
  let minX = root.x - root.width / 2;
  let maxX = cursorX;
  nodeMap.forEach(n => {
    minX = Math.min(minX, n.x - n.width / 2);
    maxX = Math.max(maxX, n.x + n.width / 2);
  });
  const shiftX = -((minX + maxX) / 2);
  nodeMap.forEach(n => {
    n.x += shiftX;
  });
}

/* ============================================================================
 * 8. CÍRCULOS Y RADIOS / MAPA DE BURBUJAS (EdrawMax Circle & Spoke 360°)
 * ============================================================================ */
function layoutRadial(
  rootId: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[]
) {
  const root = nodeMap.get(rootId)!;
  root.x = 0;
  root.y = 0;
  root.side = 'center';

  const vGap = 28;
  const spanMemo = new Map<string, number>();
  computeVerticalSubtreeSpan(rootId, nodeMap, visibleChildren, vGap, spanMemo);

  const mainKids = visibleChildren(rootId);
  const m = mainKids.length;
  if (m === 0) return;

  const baseRadius = Math.max(250, (m * 245) / (2 * Math.PI));
  const rx = baseRadius * 1.24;
  const ry = baseRadius * 0.98;

  const stackVerticalOutward = (
    parentId: string,
    startEdgeY: number,
    dirSign: -1 | 1
  ) => {
    const kids = visibleChildren(parentId);
    if (kids.length === 0) return;
    const pNode = nodeMap.get(parentId)!;
    let cursorEdgeY = startEdgeY;
    for (const kidId of kids) {
      const kNode = nodeMap.get(kidId);
      if (!kNode) continue;
      kNode.x = pNode.x;
      kNode.y = cursorEdgeY + dirSign * (kNode.height / 2);
      kNode.side = dirSign === -1 ? 'top' : 'bottom';
      const nextEdgeY = kNode.y + dirSign * (kNode.height / 2 + 26);
      stackVerticalOutward(kidId, nextEdgeY, dirSign);
      cursorEdgeY = nextEdgeY;
    }
  };

  mainKids.forEach((cid, idx) => {
    const child = nodeMap.get(cid)!;
    const angle = -Math.PI / 2 + (2 * Math.PI * idx) / m;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    child.x = Math.round(cosA * rx);
    child.y = Math.round(sinA * ry);

    if (Math.abs(sinA) > 0.85 && Math.abs(cosA) < 0.45) {
      const dirSign: -1 | 1 = sinA < 0 ? -1 : 1;
      child.side = dirSign === -1 ? 'top' : 'bottom';
      stackVerticalOutward(
        cid,
        child.y + dirSign * (child.height / 2 + 56),
        dirSign
      );
    } else {
      const side: 'left' | 'right' = cosA >= 0 ? 'right' : 'left';
      child.side = side;
      placeHorizontalSubtree(
        cid,
        side,
        child.y,
        nodeMap,
        visibleChildren,
        spanMemo,
        vGap
      );
    }
  });
}

/* ============================================================================
 * 9. MATRIZ DE BLOQUES 2x2 / FODA (EdrawMax Block & SWOT Matrix)
 * ============================================================================ */
function layoutMatrix(
  rootId: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[]
) {
  const root = nodeMap.get(rootId)!;
  root.x = 0;
  root.y = 0;
  root.side = 'center';

  const vGap = 26;
  const quadrantGapY = 68;
  const spanMemo = new Map<string, number>();
  computeVerticalSubtreeSpan(rootId, nodeMap, visibleChildren, vGap, spanMemo);

  const blocks = visibleChildren(rootId);
  if (blocks.length === 0) return;

  const leftBlocks: string[] = [];
  const rightBlocks: string[] = [];

  blocks.forEach((bid, idx) => {
    // En FODA / Matriz 2x2: [0]=Arriba-Izq, [1]=Arriba-Der, [2]=Abajo-Izq, [3]=Abajo-Der
    if (idx % 2 === 0) {
      leftBlocks.push(bid);
    } else {
      rightBlocks.push(bid);
    }
  });

  const placeQuadrantColumn = (group: string[], side: 'left' | 'right') => {
    if (group.length === 0) return;
    const totalH =
      group.reduce((acc, bid) => acc + Math.max(96, spanMemo.get(bid) || 64), 0) +
      (group.length - 1) * quadrantGapY;

    let cursorY = -totalH / 2;
    const hOffset = 128;

    for (const bid of group) {
      const bNode = nodeMap.get(bid)!;
      const bSpan = Math.max(96, spanMemo.get(bid) || bNode.height);
      const centerY = cursorY + bSpan / 2;

      bNode.x =
        side === 'right'
          ? root.x + root.width / 2 + hOffset + bNode.width / 2
          : root.x - root.width / 2 - hOffset - bNode.width / 2;
      bNode.y = centerY;
      bNode.side = side;

      placeHorizontalSubtree(
        bid,
        side,
        centerY,
        nodeMap,
        visibleChildren,
        spanMemo,
        vGap
      );

      cursorY += bSpan + quadrantGapY;
    }
  };

  placeQuadrantColumn(leftBlocks, 'left');
  placeQuadrantColumn(rightBlocks, 'right');
}

/* ============================================================================
 * 10. DIAGRAMA DE CICLO CONTINUO (EdrawMax Circular Process)
 * ============================================================================ */
function layoutCycle(
  rootId: string,
  nodeMap: Map<string, OrganizerNode>,
  visibleChildren: (id: string) => string[]
) {
  const root = nodeMap.get(rootId)!;
  root.x = 0;
  root.y = 0;
  root.side = 'center';

  const vGap = 28;
  const spanMemo = new Map<string, number>();
  computeVerticalSubtreeSpan(rootId, nodeMap, visibleChildren, vGap, spanMemo);

  const stages = visibleChildren(rootId);
  const m = stages.length;
  if (m === 0) return;

  const radius = Math.max(235, (m * 235) / (2 * Math.PI));
  const rx = radius * 1.18;
  const ry = radius * 1.02;

  const stackVerticalOutward = (
    parentId: string,
    startEdgeY: number,
    dirSign: -1 | 1
  ) => {
    const kids = visibleChildren(parentId);
    if (kids.length === 0) return;
    const pNode = nodeMap.get(parentId)!;
    let cursorEdgeY = startEdgeY;
    for (const kidId of kids) {
      const kNode = nodeMap.get(kidId);
      if (!kNode) continue;
      kNode.x = pNode.x;
      kNode.y = cursorEdgeY + dirSign * (kNode.height / 2);
      kNode.side = dirSign === -1 ? 'top' : 'bottom';
      const nextEdgeY = kNode.y + dirSign * (kNode.height / 2 + 26);
      stackVerticalOutward(kidId, nextEdgeY, dirSign);
      cursorEdgeY = nextEdgeY;
    }
  };

  stages.forEach((sid, idx) => {
    const sNode = nodeMap.get(sid)!;
    const angle = -Math.PI / 2 + (2 * Math.PI * idx) / m;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    sNode.x = Math.round(cosA * rx);
    sNode.y = Math.round(sinA * ry);
    sNode.milestoneIndex = idx + 1;

    if (Math.abs(sinA) > 0.85 && Math.abs(cosA) < 0.45) {
      const dirSign: -1 | 1 = sinA < 0 ? -1 : 1;
      sNode.side = dirSign === -1 ? 'top' : 'bottom';
      stackVerticalOutward(
        sid,
        sNode.y + dirSign * (sNode.height / 2 + 54),
        dirSign
      );
    } else {
      const side: 'left' | 'right' = cosA >= 0 ? 'right' : 'left';
      sNode.side = side;
      placeHorizontalSubtree(
        sid,
        side,
        sNode.y,
        nodeMap,
        visibleChildren,
        spanMemo,
        vGap
      );
    }
  });
}

/**
 * Garantiza de forma estricta que ningún cuadro/nodo se sobreponga a otro
 * y que cualquier par de nodos conectados por una proposición o etiqueta (conector)
 * cuenten con una separación física suficiente para que la píldora jamás roce ni se sobreponga
 * con los cuadros en ningún organizador visual.
 */
function preventNodeCollisions(
  nodes: OrganizerNode[],
  hiddenIds: Set<string>,
  edges: OrganizerEdge[] = []
) {
  const visible = nodes.filter(n => !hiddenIds.has(n.id));
  if (visible.length <= 1) return;

  // Mapa de etiquetas entre pares de nodos para calcular holgura de conectores
  const edgeLabelMap = new Map<string, string>();
  for (const e of edges) {
    if (e.label && e.label.trim()) {
      edgeLabelMap.set(`${e.from}->${e.to}`, e.label.trim());
      edgeLabelMap.set(`${e.to}->${e.from}`, e.label.trim());
    }
  }

  const baseMinGap = 32; // Separación base limpia entre cuadros no conectados

  for (let iter = 0; iter < 10; iter++) {
    let hadCollision = false;

    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const a = visible[i];
        const b = visible[j];

        const pairLabel = edgeLabelMap.get(`${a.id}->${b.id}`);
        const hasConnector = Boolean(pairLabel);
        const labelW = hasConnector ? Math.max(90, pairLabel!.length * 7.5 + 24) : 0;
        const labelH = 26;

        const halfWa = a.width / 2;
        const halfHa = a.height / 2;
        const halfWb = b.width / 2;
        const halfHb = b.height / 2;

        const dx = b.x - a.x;
        const dy = b.y - a.y;

        // Si hay conector entre a y b, garantizar espacio físico para la píldora sin que roce ninguno
        let minGapX = baseMinGap;
        let minGapY = baseMinGap;

        if (hasConnector) {
          if (Math.abs(dy) > Math.abs(dx)) {
            // Conexión vertical (ej. eje superior/inferior en Cartografía o árbol vertical):
            // Requiere espacio vertical amplio para que la píldora flote holgada
            minGapY = Math.max(minGapY, labelH + 52); // Al menos 78px entre bordes
            minGapX = Math.max(minGapX, 26);
          } else {
            // Conexión horizontal (ej. ramas Este/Oeste):
            // Requiere espacio horizontal para acomodar el ancho de la píldora
            minGapX = Math.max(minGapX, labelW + 30);
            minGapY = Math.max(minGapY, 26);
          }
        }

        const requiredDistX = halfWa + halfWb + minGapX;
        const requiredDistY = halfHa + halfHb + minGapY;

        const overlapX = requiredDistX - Math.abs(dx);
        const overlapY = requiredDistY - Math.abs(dy);

        // Si hay solapamiento simultáneo en X y en Y, los cuadros se están tocando o invadiendo el espacio
        if (overlapX > 0 && overlapY > 0) {
          hadCollision = true;

          // Separar por el eje con menor penetración
          if (overlapY <= overlapX) {
            const shiftY = overlapY / 2 + 1;
            if (a.isRoot) {
              b.y += dy >= 0 ? shiftY * 2 : -shiftY * 2;
            } else if (b.isRoot) {
              a.y += dy >= 0 ? -shiftY * 2 : shiftY * 2;
            } else {
              if (dy >= 0) {
                a.y -= shiftY;
                b.y += shiftY;
              } else {
                a.y += shiftY;
                b.y -= shiftY;
              }
            }
          } else {
            const shiftX = overlapX / 2 + 1;
            if (a.isRoot) {
              b.x += dx >= 0 ? shiftX * 2 : -shiftX * 2;
            } else if (b.isRoot) {
              a.x += dx >= 0 ? -shiftX * 2 : shiftX * 2;
            } else {
              if (dx >= 0) {
                a.x -= shiftX;
                b.x += shiftX;
              } else {
                a.x += shiftX;
                b.x -= shiftX;
              }
            }
          }
        }
      }
    }

    if (!hadCollision) break;
  }
}
