import type PptxGenJS from 'pptxgenjs';
import type { OrganizerNode, OrganizerProject } from '../types/organizer';
import { buildProjectSceneGeometry, type RenderedPathItem } from './geometry';
import { getNodeTypography, measureStringPx, resolveEffectiveShape } from './measure';
import {
  getThemeConfig,
  hexToPastelSolid,
  ORGANIZER_TYPES_META,
  PRIORITY_BADGES,
} from './themes';

export interface CanvaPptxOptions {
  /** Si es true, añade diapositivas 2..N desglosando cada rama/eje principal para exponer en Canva */
  includeBranchSlides?: boolean;
  /** Incluye encabezado superior con título y fecha en la diapositiva principal */
  includeHeader?: boolean;
  /** Exporta notas de los cuadros como Notas del Presentador */
  includeSpeakerNotes?: boolean;
}

export interface CanvaExportResult {
  fileName: string;
  slideCount: number;
  editableShapeCount: number;
  editableTextCount: number;
  nativeLineCount: number;
}

/** Tamaño nativo 16:9 estándar de Presentaciones de Canva (1920 × 1080 px a 96 DPI) */
const SLIDE_W = 20;
const SLIDE_H = 11.25;
const LAYOUT_NAME = 'CANVA_PRESENTATION_16_9';
const FONT_FAMILY = 'Plus Jakarta Sans';

function sanitizeFileName(title: string): string {
  return (
    (title || 'organizador-synapse')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'organizador-synapse'
  );
}

/**
 * Convierte cualquier color CSS (#RGB, #RRGGBB, rgb(...), rgba(...)) a Hex de 6 dígitos
 * sin prefijo '#', requerido estrictamente por OOXML / PowerPoint / Canva.
 */
function toHex6(color?: string, fallback = 'FFFFFF'): string {
  if (!color) return fallback;
  const trimmed = color.trim();

  if (trimmed.startsWith('#')) {
    const raw = trimmed.slice(1).replace(/[^0-9a-fA-F]/g, '');
    if (raw.length === 3) {
      return raw
        .split('')
        .map(c => c + c)
        .join('')
        .toUpperCase();
    }
    if (raw.length >= 6) {
      return raw.slice(0, 6).toUpperCase();
    }
  }

  const rgbMatch = trimmed.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (rgbMatch) {
    const alpha = rgbMatch[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(rgbMatch[4]))) : 1;
    const blend = (ch: number) =>
      Math.max(0, Math.min(255, Math.round(ch * alpha + 255 * (1 - alpha))));
    const r = blend(parseFloat(rgbMatch[1])).toString(16).padStart(2, '0');
    const g = blend(parseFloat(rgbMatch[2])).toString(16).padStart(2, '0');
    const b = blend(parseFloat(rgbMatch[3])).toString(16).padStart(2, '0');
    return `${r}${g}${b}`.toUpperCase();
  }

  return fallback;
}

/** Detecta si un path SVG está formado exclusivamente por segmentos rectos (M y L) */
function parseStraightSegments(d: string): Array<{ x1: number; y1: number; x2: number; y2: number }> | null {
  if (!d || /[CQASTHV]/i.test(d)) return null;
  const tokens = d.match(/[MLZ]|-?\d+(?:\.\d+)?/gi);
  if (!tokens) return null;

  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  let cmd = '';
  let i = 0;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;

  while (i < tokens.length) {
    const tok = tokens[i];
    if (/^[MLZ]$/i.test(tok)) {
      cmd = tok.toUpperCase();
      i++;
      if (cmd === 'Z') {
        if (Math.hypot(sx - cx, sy - cy) > 0.5) {
          segments.push({ x1: cx, y1: cy, x2: sx, y2: sy });
        }
        cx = sx;
        cy = sy;
      }
      continue;
    }

    const nx = parseFloat(tokens[i]);
    const ny = parseFloat(tokens[i + 1]);
    if (Number.isNaN(nx) || Number.isNaN(ny)) return null;
    i += 2;

    if (cmd === 'M') {
      cx = nx;
      cy = ny;
      sx = nx;
      sy = ny;
      cmd = 'L';
    } else if (cmd === 'L') {
      if (Math.hypot(nx - cx, ny - cy) > 0.5) {
        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny });
      }
      cx = nx;
      cy = ny;
    }
  }

  return segments.length > 0 ? segments : null;
}

/** Calcula la envolvente convexa (segura para M/L/C/Q) de un path SVG */
function computePathBoundingBox(p: RenderedPathItem): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const nums = p.d.match(/-?\d+(?:\.\d+)?/g);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (nums) {
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = parseFloat(nums[i]);
      const y = parseFloat(nums[i + 1]);
      if (!Number.isNaN(x) && !Number.isNaN(y)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (p.arrowEnd) {
    minX = Math.min(minX, p.arrowEnd.x - 16);
    minY = Math.min(minY, p.arrowEnd.y - 16);
    maxX = Math.max(maxX, p.arrowEnd.x + 16);
    maxY = Math.max(maxY, p.arrowEnd.y + 16);
  }

  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 20, maxY: 20 };
  }

  const pad = Math.max(12, (p.strokeWidth || 2.4) * 3.5 + 8);
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  };
}

/** Dibuja uno o varios conectores curvos/orgánicos en un lienzo transparente Retina 3x */
function renderPathsToTransparentPng(
  paths: RenderedPathItem[],
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
): string | null {
  if (typeof document === 'undefined' || paths.length === 0) return null;
  const worldW = Math.max(4, bbox.maxX - bbox.minX);
  const worldH = Math.max(4, bbox.maxY - bbox.minY);
  const maxDim = 2800;
  const scale = Math.min(3, maxDim / worldW, maxDim / worldH);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(worldW * scale));
  canvas.height = Math.max(2, Math.round(worldH * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-bbox.minX, -bbox.minY);

  for (const p of paths) {
    const path2d = new Path2D(p.d);
    if (p.kind === 'fill') {
      ctx.fillStyle = p.color;
      ctx.fill(path2d);
    } else {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.strokeWidth || 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (p.kind === 'dashed') {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke(path2d);
      ctx.setLineDash([]);
    }

    if (p.arrowEnd) {
      ctx.save();
      ctx.translate(p.arrowEnd.x, p.arrowEnd.y);
      ctx.rotate((p.arrowEnd.angleDeg * Math.PI) / 180);
      ctx.fillStyle = p.arrowEnd.color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10.5, -4.8);
      ctx.lineTo(-8.4, 0);
      ctx.lineTo(-10.5, 4.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
  return canvas.toDataURL('image/png');
}

/** Convierte imágenes de lienzo (incluso SVG/WebP o URLs) a PNG/JPEG compatible con Canva PPTX */
async function resolveImageDataForPptx(url: string): Promise<string | null> {
  if (!url) return null;
  if (/^data:image\/(png|jpeg|jpg|gif);base64,/i.test(url)) {
    return url;
  }

  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  return new Promise(resolve => {
    const img = new Image();
    if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const w = Math.max(1, img.naturalWidth || img.width || 300);
        const h = Math.max(1, img.naturalHeight || img.height || 300);
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(1800, w);
        canvas.height = Math.min(1800, h);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function mapNodeShapeToPptx(
  pptx: PptxGenJS,
  shape: OrganizerNode['shape']
): PptxGenJS.SHAPE_NAME {
  switch (shape) {
    case 'diamond':
      return pptx.ShapeType.diamond;
    case 'parallelogram':
      return pptx.ShapeType.parallelogram;
    case 'hexagon':
      return pptx.ShapeType.hexagon;
    case 'circle':
      return pptx.ShapeType.ellipse;
    case 'cloud':
      return pptx.ShapeType.cloud;
    case 'rectangle':
      return pptx.ShapeType.roundRect;
    case 'pill':
      return pptx.ShapeType.roundRect;
    default:
      return pptx.ShapeType.roundRect;
  }
}

/**
 * Construye las diapositivas 2..N con el desglose editable por cada rama/eje principal,
 * optimizado para exponer en Presentaciones de Canva con tipografía amplia.
 */
function appendBranchBreakdownSlides(
  pptx: PptxGenJS,
  project: OrganizerProject,
  includeSpeakerNotes: boolean,
  counters: { shapes: number; texts: number; lines: number }
): number {
  const theme = getThemeConfig(project.theme);
  const canvasHex = toHex6(theme.canvasBg, 'FAF7F2');
  const textPrimaryHex = toHex6(theme.textPrimary, '1C1917');
  const textSecondaryHex = toHex6(theme.textSecondary, '57534E');
  const typeMeta = ORGANIZER_TYPES_META.find(m => m.type === project.type);

  const nodeMap = new Map<string, OrganizerNode>();
  project.nodes.forEach(n => nodeMap.set(n.id, n));

  const root =
    project.nodes.find(n => n.isRoot) ||
    project.nodes.find(n => !n.parentId || !nodeMap.has(n.parentId)) ||
    project.nodes[0];
  if (!root) return 0;

  const mainBranches = project.nodes.filter(n => n.parentId === root.id && n.id !== root.id);
  if (mainBranches.length === 0) return 0;

  const childrenOf = new Map<string, OrganizerNode[]>();
  project.nodes.forEach(n => {
    if (n.parentId && n.id !== n.parentId) {
      const arr = childrenOf.get(n.parentId) || [];
      arr.push(n);
      childrenOf.set(n.parentId, arr);
    }
  });

  const collectDeepDescendantLines = (parentId: string, level = 0): string[] => {
    const kids = childrenOf.get(parentId) || [];
    const lines: string[] = [];
    for (const k of kids) {
      const prefix = level === 0 ? '• ' : `${'  '.repeat(level)}◦ `;
      const sub = k.subtitle ? ` (${k.subtitle})` : '';
      lines.push(`${prefix}${k.icon ? `${k.icon} ` : ''}${k.text}${sub}`);
      if (level < 2) {
        lines.push(...collectDeepDescendantLines(k.id, level + 1));
      }
    }
    return lines;
  };

  mainBranches.forEach((branch, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: canvasHex };

    const branchHex = toHex6(
      branch.color || theme.palette[idx % theme.palette.length],
      'EA580C'
    );
    const softHeaderTint = toHex6(hexToPastelSolid(`#${branchHex}`, 0.14), 'FFF7ED');

    // Franja superior de color editable
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: SLIDE_W,
      h: 0.16,
      fill: { color: branchHex },
      line: { type: 'none' },
    });
    counters.shapes++;

    // Píldora indicadora de tema/eje
    const badgeLabel = `${typeMeta?.shortLabel || 'Tema'} • ${idx + 1} de ${mainBranches.length}`;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.9,
      y: 0.55,
      w: 3.9,
      h: 0.42,
      fill: { color: softHeaderTint },
      line: { color: branchHex, width: 1.2 },
      rectRadius: 0.21,
    });
    slide.addText(badgeLabel.toUpperCase(), {
      x: 0.9,
      y: 0.55,
      w: 3.9,
      h: 0.42,
      fontFace: FONT_FAMILY,
      fontSize: 10.5,
      bold: true,
      color: branchHex,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
    counters.shapes++;
    counters.texts++;

    // Título editable de la diapositiva de rama
    const titlePrefix = branch.icon ? `${branch.icon} ` : '';
    slide.addText(`${titlePrefix}${branch.text}`, {
      x: 0.9,
      y: 1.12,
      w: 15.2,
      h: 0.85,
      fontFace: FONT_FAMILY,
      fontSize: 28,
      bold: true,
      color: textPrimaryHex,
      align: 'left',
      valign: 'middle',
      margin: 0,
      wrap: true,
    });
    counters.texts++;

    if (branch.subtitle) {
      slide.addText(branch.subtitle, {
        x: 0.9,
        y: 1.96,
        w: 15.2,
        h: 0.4,
        fontFace: FONT_FAMILY,
        fontSize: 13.5,
        color: textSecondaryHex,
        align: 'left',
        margin: 0,
      });
      counters.texts++;
    }

    // Insignias de prioridad / progreso si existen
    let badgeX = SLIDE_W - 0.9;
    if (branch.progress !== undefined) {
      badgeX -= 1.95;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: badgeX,
        y: 0.55,
        w: 1.95,
        h: 0.42,
        fill: { color: 'ECFDF5' },
        line: { color: '10B981', width: 1 },
        rectRadius: 0.21,
      });
      slide.addText(`${branch.progress}% completado`, {
        x: badgeX,
        y: 0.55,
        w: 1.95,
        h: 0.42,
        fontFace: FONT_FAMILY,
        fontSize: 11,
        bold: true,
        color: '047857',
        align: 'center',
        valign: 'middle',
        margin: 0,
      });
      counters.shapes++;
      counters.texts++;
      badgeX -= 0.2;
    }

    if (branch.priority && PRIORITY_BADGES[branch.priority]) {
      const pb = PRIORITY_BADGES[branch.priority];
      badgeX -= 0.95;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: badgeX,
        y: 0.55,
        w: 0.95,
        h: 0.42,
        fill: { color: toHex6(pb.bg, 'EF4444') },
        line: { type: 'none' },
        rectRadius: 0.14,
      });
      slide.addText(pb.label, {
        x: badgeX,
        y: 0.55,
        w: 0.95,
        h: 0.42,
        fontFace: FONT_FAMILY,
        fontSize: 11,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle',
        margin: 0,
      });
      counters.shapes++;
      counters.texts++;
    }

    let contentTopY = branch.subtitle ? 2.52 : 2.18;

    // Si el nodo tiene notas visibles, mostrarlas en tarjeta editorial superior
    if (branch.notes && branch.notes.trim()) {
      const noteH = 0.95;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: contentTopY,
        w: SLIDE_W - 1.8,
        h: noteH,
        fill: { color: 'FFFBEB' },
        line: { color: 'FCD34D', width: 1 },
        rectRadius: 0.14,
      });
      slide.addText(branch.notes.trim(), {
        x: 1.15,
        y: contentTopY + 0.08,
        w: SLIDE_W - 2.3,
        h: noteH - 0.16,
        fontFace: FONT_FAMILY,
        fontSize: 13,
        color: textPrimaryHex,
        align: 'left',
        valign: 'middle',
        margin: 0,
        wrap: true,
      });
      counters.shapes++;
      counters.texts++;
      contentTopY += noteH + 0.28;
    }

    const children = childrenOf.get(branch.id) || [];
    const availH = SLIDE_H - 0.85 - contentTopY;

    if (children.length === 0) {
      // Diapositiva limpia centrada en el concepto principal cuando no tiene subtemas
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: contentTopY,
        w: SLIDE_W - 1.8,
        h: Math.min(4.6, availH),
        fill: { color: 'FFFFFF' },
        line: { color: branchHex, width: 1.8 },
        rectRadius: 0.2,
      });
      slide.addText(branch.text, {
        x: 1.35,
        y: contentTopY + 0.3,
        w: SLIDE_W - 2.7,
        h: Math.min(4.0, availH - 0.6),
        fontFace: FONT_FAMILY,
        fontSize: 20,
        bold: false,
        color: textPrimaryHex,
        align: branch.textAlign || 'center',
        valign: 'middle',
        margin: 0,
        wrap: true,
      });
      counters.shapes++;
      counters.texts++;
    } else if (children.length === 1) {
      // Tarjeta amplia hero (ideal para ejes de Cartografía Conceptual o definiciones desarrolladas)
      const child = children[0];
      const deepLines = collectDeepDescendantLines(child.id);
      const cardFill = child.bgColor
        ? toHex6(child.bgColor, 'FFFFFF')
        : theme.topicFillMode === 'tinted-pastel'
        ? toHex6(hexToPastelSolid(`#${branchHex}`, 0.1), 'FFFFFF')
        : 'FFFFFF';
      const cardH = Math.min(availH, deepLines.length > 0 ? 5.8 : 4.6);

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: contentTopY,
        w: SLIDE_W - 1.8,
        h: cardH,
        fill: { color: cardFill },
        line: { color: branchHex, width: 1.8 },
        rectRadius: 0.22,
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.1,
        y: contentTopY + 0.26,
        w: 0.1,
        h: cardH - 0.52,
        fill: { color: branchHex },
        line: { type: 'none' },
        rectRadius: 0.05,
      });
      counters.shapes += 2;

      const textRuns: PptxGenJS.TextProps[] = [
        {
          text: `${child.icon ? `${child.icon} ` : ''}${child.text}`,
          options: {
            fontFace: FONT_FAMILY,
            fontSize: child.text.length > 220 ? 17 : 21,
            bold: deepLines.length > 0,
            color: toHex6(child.textColor, textPrimaryHex),
            align: child.textAlign || (child.text.length > 140 ? 'justify' : 'left'),
            breakLine: deepLines.length > 0 || Boolean(child.subtitle),
          },
        },
      ];
      if (child.subtitle) {
        textRuns.push({
          text: child.subtitle,
          options: {
            fontFace: FONT_FAMILY,
            fontSize: 13.5,
            color: textSecondaryHex,
            align: 'left',
            breakLine: deepLines.length > 0,
          },
        });
      }
      if (deepLines.length > 0) {
        textRuns.push({
          text: `\n${deepLines.join('\n')}`,
          options: {
            fontFace: FONT_FAMILY,
            fontSize: 15,
            color: textPrimaryHex,
            align: 'left',
          },
        });
      }

      slide.addText(textRuns, {
        x: 1.45,
        y: contentTopY + 0.28,
        w: SLIDE_W - 2.65,
        h: cardH - 0.56,
        valign: 'middle',
        margin: 0,
        wrap: true,
      });
      counters.texts++;
    } else {
      // Cuadrícula editorial de tarjetas (máximo 6 por diapositiva; si hay más, ajusta compactamente)
      const shown = children.slice(0, 9);
      const cols = shown.length <= 4 ? 2 : 3;
      const rows = Math.ceil(shown.length / cols);
      const gapX = 0.38;
      const gapY = 0.34;
      const cardW = (SLIDE_W - 1.8 - gapX * (cols - 1)) / cols;
      const cardH = Math.max(1.45, (availH - gapY * (rows - 1)) / rows);

      shown.forEach((child, cIdx) => {
        const col = cIdx % cols;
        const row = Math.floor(cIdx / cols);
        const cx = 0.9 + col * (cardW + gapX);
        const cy = contentTopY + row * (cardH + gapY);
        const cColor = toHex6(child.color, branchHex);
        const cardFill = child.bgColor
          ? toHex6(child.bgColor, 'FFFFFF')
          : theme.topicFillMode === 'tinted-pastel'
          ? toHex6(hexToPastelSolid(`#${cColor}`, 0.09), 'FFFFFF')
          : 'FFFFFF';

        slide.addShape(pptx.ShapeType.roundRect, {
          x: cx,
          y: cy,
          w: cardW,
          h: cardH,
          fill: { color: cardFill },
          line: { color: cColor, width: 1.5 },
          rectRadius: 0.16,
        });
        slide.addShape(pptx.ShapeType.roundRect, {
          x: cx + 0.12,
          y: cy + 0.18,
          w: 0.08,
          h: Math.max(0.4, cardH - 0.36),
          fill: { color: cColor },
          line: { type: 'none' },
          rectRadius: 0.04,
        });
        counters.shapes += 2;

        const deepLines = collectDeepDescendantLines(child.id).slice(0, 6);
        const titleSize = shown.length > 6 ? 12.5 : shown.length > 4 ? 14 : 15.5;
        const bodyRuns: PptxGenJS.TextProps[] = [
          {
            text: `${child.icon ? `${child.icon} ` : ''}${child.text}`,
            options: {
              fontFace: FONT_FAMILY,
              fontSize: titleSize,
              bold: deepLines.length > 0,
              color: toHex6(child.textColor, textPrimaryHex),
              align: child.textAlign || 'left',
              breakLine: Boolean(child.subtitle) || deepLines.length > 0 || Boolean(child.notes),
            },
          },
        ];

        if (child.subtitle) {
          bodyRuns.push({
            text: child.subtitle,
            options: {
              fontFace: FONT_FAMILY,
              fontSize: Math.max(10.5, titleSize - 2.5),
              color: textSecondaryHex,
              align: 'left',
              breakLine: deepLines.length > 0 || Boolean(child.notes),
            },
          });
        }

        if (deepLines.length > 0) {
          bodyRuns.push({
            text: deepLines.join('\n'),
            options: {
              fontFace: FONT_FAMILY,
              fontSize: Math.max(10.5, titleSize - 2),
              color: textSecondaryHex,
              align: 'left',
            },
          });
        } else if (child.notes) {
          bodyRuns.push({
            text: child.notes.trim(),
            options: {
              fontFace: FONT_FAMILY,
              fontSize: Math.max(10.5, titleSize - 2.5),
              color: textSecondaryHex,
              align: 'left',
            },
          });
        }

        slide.addText(bodyRuns, {
          x: cx + 0.32,
          y: cy + 0.14,
          w: cardW - 0.48,
          h: cardH - 0.28,
          valign: 'middle',
          margin: 0,
          wrap: true,
        });
        counters.texts++;
      });
    }

    // Pie de diapositiva sutil editable
    slide.addText(`${project.title}  •  Diapositiva editable generada desde Synapse Studio`, {
      x: 0.9,
      y: SLIDE_H - 0.52,
      w: SLIDE_W - 1.8,
      h: 0.32,
      fontFace: FONT_FAMILY,
      fontSize: 9.5,
      color: textSecondaryHex,
      align: 'left',
      margin: 0,
    });
    counters.texts++;

    // Notas del presentador de PowerPoint / Canva
    if (includeSpeakerNotes) {
      const notesList: string[] = [];
      if (branch.notes?.trim()) notesList.push(`${branch.text}: ${branch.notes.trim()}`);
      children.forEach(c => {
        if (c.notes?.trim()) notesList.push(`- ${c.text}: ${c.notes.trim()}`);
      });
      if (notesList.length > 0) {
        slide.addNotes(notesList.join('\n'));
      }
    }
  });

  return mainBranches.length;
}

/**
 * Genera y descarga una Presentación (.pptx) optimizada para importarse en Canva
 * manteniendo todos los cuadros, textos, títulos, etiquetas, insignias e imágenes editables.
 */
export async function exportForCanvaPresentation(
  project: OrganizerProject,
  options: CanvaPptxOptions = {}
): Promise<CanvaExportResult> {
  const {
    includeBranchSlides = true,
    includeHeader = true,
    includeSpeakerNotes = true,
  } = options;

  const PptxGenModule = await import('pptxgenjs');
  const PptxGenCtor = PptxGenModule.default;
  const pptx = new PptxGenCtor();

  pptx.defineLayout({ name: LAYOUT_NAME, width: SLIDE_W, height: SLIDE_H });
  pptx.layout = LAYOUT_NAME;
  pptx.title = project.title || 'Organizador Visual';
  pptx.subject = 'Mapa editable generado con Synapse Studio para Canva';
  pptx.author = 'Synapse Studio';
  pptx.theme = {
    headFontFace: FONT_FAMILY,
    bodyFontFace: FONT_FAMILY,
  };

  const counters = { shapes: 0, texts: 0, lines: 0 };
  const theme = getThemeConfig(project.theme);
  const scene = buildProjectSceneGeometry(project);
  const typeMeta = ORGANIZER_TYPES_META.find(m => m.type === project.type);

  // Calcular límites efectivos incluyendo etiquetas de conectores y badges
  let effMinX = scene.bounds.minX;
  let effMinY = scene.bounds.minY;
  let effMaxX = scene.bounds.maxX;
  let effMaxY = scene.bounds.maxY;

  for (const p of scene.paths) {
    const pBox = computePathBoundingBox(p);
    effMinX = Math.min(effMinX, pBox.minX);
    effMinY = Math.min(effMinY, pBox.minY);
    effMaxX = Math.max(effMaxX, pBox.maxX);
    effMaxY = Math.max(effMaxY, pBox.maxY);

    if (p.label && p.labelX !== undefined && p.labelY !== undefined) {
      const pillW = Math.max(46, measureStringPx(p.label.trim(), 11, 600) + 22);
      effMinX = Math.min(effMinX, p.labelX - pillW / 2 - 8);
      effMaxX = Math.max(effMaxX, p.labelX + pillW / 2 + 8);
      effMinY = Math.min(effMinY, p.labelY - 18);
      effMaxY = Math.max(effMaxY, p.labelY + 18);
    }
  }

  for (const b of scene.timelineBadges) {
    effMinX = Math.min(effMinX, b.x - 18);
    effMaxX = Math.max(effMaxX, b.x + 18);
    effMinY = Math.min(effMinY, b.y - 18);
    effMaxY = Math.max(effMaxY, b.y + 18);
  }

  const effWidth = Math.max(120, effMaxX - effMinX);
  const effHeight = Math.max(100, effMaxY - effMinY);

  // Diapositiva 1: Mapa completo editable en 16:9 (1920 × 1080 equivalente)
  const slide1 = pptx.addSlide();
  slide1.background = { color: toHex6(theme.canvasBg, 'FAF7F2') };

  const marginX = 0.55;
  const marginTop = includeHeader ? 1.15 : 0.45;
  const marginBottom = 0.45;
  const availW = SLIDE_W - marginX * 2;
  const availH = SLIDE_H - marginTop - marginBottom;

  const scalePxToIn = Math.min(availW / effWidth, availH / effHeight, 1 / 74);
  const drawnW = effWidth * scalePxToIn;
  const drawnH = effHeight * scalePxToIn;
  const originX = marginX + (availW - drawnW) / 2;
  const originY = marginTop + (availH - drawnH) / 2;

  const toInX = (wx: number) => originX + (wx - effMinX) * scalePxToIn;
  const toInY = (wy: number) => originY + (wy - effMinY) * scalePxToIn;
  const toInLen = (wLen: number) => wLen * scalePxToIn;
  const pxToPt = (px: number) => px * scalePxToIn * 72;

  if (includeHeader) {
    slide1.addText(project.title || 'Mapa Conceptual', {
      x: 0.65,
      y: 0.3,
      w: SLIDE_W - 4.6,
      h: 0.44,
      fontFace: FONT_FAMILY,
      fontSize: 20,
      bold: true,
      color: toHex6(theme.textPrimary, '1C1917'),
      align: 'left',
      margin: 0,
    });
    slide1.addText(
      `${typeMeta?.shortLabel || 'Organizador Visual'} • Editable en Canva • ${new Date().toLocaleDateString('es-ES')}`,
      {
        x: 0.65,
        y: 0.72,
        w: SLIDE_W - 4.6,
        h: 0.28,
        fontFace: FONT_FAMILY,
        fontSize: 10.5,
        color: toHex6(theme.textSecondary, '57534E'),
        align: 'left',
        margin: 0,
      }
    );
    counters.texts += 2;
  }

  // 1. Capa de Conectores (Líneas nativas de PowerPoint/Canva + curvas transparentes Retina)
  const curvedPaths: RenderedPathItem[] = [];

  for (const p of scene.paths) {
    const straightSegs = p.kind !== 'fill' ? parseStraightSegments(p.d) : null;
    if (straightSegs) {
      const colorHex = toHex6(p.color, '44403C');
      const widthPt = Math.max(1, (p.strokeWidth || 2.2) * scalePxToIn * 72);
      straightSegs.forEach((seg, sIdx) => {
        const sx = toInX(Math.min(seg.x1, seg.x2));
        const sy = toInY(Math.min(seg.y1, seg.y2));
        const sw = toInLen(Math.abs(seg.x2 - seg.x1));
        const sh = toInLen(Math.abs(seg.y2 - seg.y1));
        const isLast = sIdx === straightSegs.length - 1;
        slide1.addShape(pptx.ShapeType.line, {
          x: sx,
          y: sy,
          w: sw,
          h: sh,
          flipH: seg.x2 < seg.x1,
          flipV: seg.y2 < seg.y1,
          line: {
            color: colorHex,
            width: widthPt,
            dashType: p.kind === 'dashed' ? 'dash' : 'solid',
            endArrowType: isLast && p.arrowEnd ? 'triangle' : 'none',
          },
        });
        counters.lines++;
      });
    } else {
      curvedPaths.push(p);
    }
  }

  // Conectores curvos / llaves '{' / ramas cónicas: PNG transparente vectorial-crisp 3x (nunca omitido por Canva)
  if (curvedPaths.length > 0) {
    if (curvedPaths.length <= 45) {
      for (const cp of curvedPaths) {
        const bbox = computePathBoundingBox(cp);
        const pngData = renderPathsToTransparentPng([cp], bbox);
        if (pngData) {
          slide1.addImage({
            data: pngData,
            x: toInX(bbox.minX),
            y: toInY(bbox.minY),
            w: toInLen(bbox.maxX - bbox.minX),
            h: toInLen(bbox.maxY - bbox.minY),
          });
        }
      }
    } else {
      let cMinX = Infinity;
      let cMinY = Infinity;
      let cMaxX = -Infinity;
      let cMaxY = -Infinity;
      for (const cp of curvedPaths) {
        const b = computePathBoundingBox(cp);
        cMinX = Math.min(cMinX, b.minX);
        cMinY = Math.min(cMinY, b.minY);
        cMaxX = Math.max(cMaxX, b.maxX);
        cMaxY = Math.max(cMaxY, b.maxY);
      }
      const groupBbox = { minX: cMinX, minY: cMinY, maxX: cMaxX, maxY: cMaxY };
      const pngData = renderPathsToTransparentPng(curvedPaths, groupBbox);
      if (pngData) {
        slide1.addImage({
          data: pngData,
          x: toInX(groupBbox.minX),
          y: toInY(groupBbox.minY),
          w: toInLen(groupBbox.maxX - groupBbox.minX),
          h: toInLen(groupBbox.maxY - groupBbox.minY),
        });
      }
    }
  }

  // Píldoras de conectores / palabras enlace: 100% nativas y editables encima de los conectores
  for (const p of scene.paths) {
    if (p.label && p.labelX !== undefined && p.labelY !== undefined) {
      const lbl = p.label.trim();
      if (!lbl) continue;

      const textPx = measureStringPx(lbl, 11, 600);
      const pillWpx = Math.max(46, textPx + 22);
      const pillHpx = 23;
      const pillX = toInX(p.labelX - pillWpx / 2);
      const pillY = toInY(p.labelY - pillHpx / 2);
      const pillW = toInLen(pillWpx);
      const pillH = toInLen(pillHpx);
      const borderCol = toHex6(p.isCrossLink ? p.color : '#CBD5E1', 'CBD5E1');
      const textCol = toHex6(p.isCrossLink ? p.color : '#334155', '334155');
      const lblFontPt = Math.max(6.5, pxToPt(10.5));

      slide1.addShape(pptx.ShapeType.roundRect, {
        x: pillX,
        y: pillY,
        w: pillW,
        h: pillH,
        fill: { color: 'FFFFFF' },
        line: { color: borderCol, width: 0.9 },
        rectRadius: pillH / 2,
      });
      slide1.addText(lbl, {
        x: pillX,
        y: pillY,
        w: pillW,
        h: pillH,
        fontFace: FONT_FAMILY,
        fontSize: lblFontPt,
        bold: true,
        color: textCol,
        align: 'center',
        valign: 'middle',
        margin: 0,
        wrap: false,
      });
      counters.shapes++;
      counters.texts++;
    }
  }

  // Insignias numeradas de la Línea de Tiempo
  for (const b of scene.timelineBadges) {
    const rIn = toInLen(14);
    const bx = toInX(b.x) - rIn;
    const by = toInY(b.y) - rIn;
    slide1.addShape(pptx.ShapeType.ellipse, {
      x: bx,
      y: by,
      w: rIn * 2,
      h: rIn * 2,
      fill: { color: toHex6(b.color, 'EA580C') },
      line: { color: 'FFFFFF', width: 1.5 },
    });
    slide1.addText(String(b.index), {
      x: bx,
      y: by,
      w: rIn * 2,
      h: rIn * 2,
      fontFace: FONT_FAMILY,
      fontSize: Math.max(6.5, pxToPt(11)),
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
    counters.shapes++;
    counters.texts++;
  }

  // 2. Capa de Imágenes libres colocadas en el lienzo
  if (project.images && project.images.length > 0) {
    for (const img of project.images) {
      const resolvedData = await resolveImageDataForPptx(img.url);
      if (!resolvedData) continue;
      const transparency =
        img.opacity !== undefined ? Math.round((1 - Math.max(0.1, Math.min(1, img.opacity))) * 100) : 0;
      slide1.addImage({
        data: resolvedData,
        x: toInX(img.x - img.width / 2),
        y: toInY(img.y - img.height / 2),
        w: toInLen(img.width),
        h: toInLen(img.height),
        rounding: (img.borderRadius ?? 10) >= Math.min(img.width, img.height) * 0.45,
        transparency,
      });
    }
  }

  // 3. Capa de Nodos (Cuadros y Textos 100% Editables en Canva)
  for (const node of scene.visibleNodes) {
    const depth = node.depth || 0;
    const isRoot = Boolean(node.isRoot || depth === 0);
    const typo = getNodeTypography(depth, isRoot);
    const shape = resolveEffectiveShape(node, depth, project.type, project.theme);
    const branchColor = node.color || theme.palette[0];

    let fillRaw = '#FFFFFF';
    let strokeRaw = branchColor;
    let textRaw = node.textColor || theme.textPrimary;
    const strokePx = isRoot ? 2.4 : depth === 1 ? 2 : 1.6;

    if (node.bgColor) {
      fillRaw = node.bgColor;
    } else if (isRoot) {
      fillRaw = branchColor;
      strokeRaw = theme.rootBorder || branchColor;
      textRaw = node.textColor || '#FFFFFF';
    } else if (theme.topicFillMode === 'tinted-pastel') {
      fillRaw = hexToPastelSolid(branchColor, depth === 1 ? 0.14 : 0.08);
    }

    const fillHex = toHex6(fillRaw, 'FFFFFF');
    const strokeHex = toHex6(strokeRaw, '2563EB');
    const textHex = toHex6(textRaw, isRoot ? 'FFFFFF' : '1C1917');
    const branchHex = toHex6(branchColor, '2563EB');

    const nx = toInX(node.x - node.width / 2);
    const ny = toInY(node.y - node.height / 2);
    const nw = toInLen(node.width);
    const nh = toInLen(node.height);
    const strokePt = Math.max(0.85, strokePx * scalePxToIn * 72);

    if (shape === 'underline') {
      // Fondo transparente sutil + línea inferior editable estilo EdrawMax
      slide1.addShape(pptx.ShapeType.line, {
        x: nx,
        y: ny + nh - toInLen(1),
        w: nw,
        h: 0,
        line: { color: strokeHex, width: Math.max(1.2, strokePt) },
      });
      counters.lines++;
    } else {
      const pptxShape = mapNodeShapeToPptx(pptx, shape);
      const rectRadiusIn =
        shape === 'pill'
          ? Math.min(nw, nh) / 2
          : shape === 'rectangle'
          ? Math.min(toInLen(6), Math.min(nw, nh) * 0.2)
          : shape === 'cloud'
          ? Math.min(toInLen(22), Math.min(nw, nh) * 0.35)
          : Math.min(toInLen(isRoot ? 16 : 12), Math.min(nw, nh) * 0.28);

      const shapeOpts: PptxGenJS.ShapeProps = {
        x: nx,
        y: ny,
        w: nw,
        h: nh,
        fill: { color: fillHex },
        line: {
          color: strokeHex,
          width: strokePt,
          dashType: shape === 'cloud' ? 'dash' : 'solid',
        },
        shadow: {
          type: 'outer',
          color: '1C1917',
          opacity: 0.08,
          blur: 3,
          offset: 1.5,
          angle: 90,
        },
      };

      if (pptxShape === pptx.ShapeType.roundRect) {
        shapeOpts.rectRadius = rectRadiusIn;
      }

      slide1.addShape(pptxShape, shapeOpts);
      counters.shapes++;
    }

    // Acento lateral en tarjetas blancas (nivel >= 1)
    if (
      !isRoot &&
      !node.bgColor &&
      theme.topicFillMode === 'white-accent' &&
      (shape === 'rounded' || shape === 'rectangle')
    ) {
      const barHpx = Math.max(16, node.height - 18);
      const barXpx = node.x - node.width / 2 + 6;
      const barYpx = node.y - barHpx / 2;
      const barW = toInLen(4);
      slide1.addShape(pptx.ShapeType.roundRect, {
        x: toInX(barXpx),
        y: toInY(barYpx),
        w: barW,
        h: toInLen(barHpx),
        fill: { color: branchHex },
        line: { type: 'none' },
        rectRadius: barW / 2,
      });
      counters.shapes++;
    }

    // Insignias internas a la izquierda (icono, prioridad, progreso)
    const iconW = node.icon ? 22 : 0;
    const prioW = node.priority ? 28 : 0;
    const progW = node.progress !== undefined ? 20 : 0;
    const leftExtraTotal = iconW + prioW + progW;

    const diamondInset = shape === 'diamond' ? node.width * 0.14 : 0;
    const contentLeftPx = node.x - node.width / 2 + typo.padX + diamondInset;
    let cursorPx = contentLeftPx;

    if (node.icon) {
      slide1.addText(node.icon, {
        x: toInX(cursorPx),
        y: ny,
        w: toInLen(iconW),
        h: nh,
        fontFace: FONT_FAMILY,
        fontSize: Math.max(7.5, pxToPt(isRoot ? 15 : 13)),
        align: 'center',
        valign: 'middle',
        margin: 0,
      });
      counters.texts++;
      cursorPx += iconW;
    }

    if (node.priority && PRIORITY_BADGES[node.priority]) {
      const pb = PRIORITY_BADGES[node.priority];
      const badgeW = toInLen(22);
      const badgeH = toInLen(17);
      const badgeY = toInY(node.y - 8.5);
      const badgeX = toInX(cursorPx);
      slide1.addShape(pptx.ShapeType.roundRect, {
        x: badgeX,
        y: badgeY,
        w: badgeW,
        h: badgeH,
        fill: { color: toHex6(pb.bg, 'EF4444') },
        line: { type: 'none' },
        rectRadius: toInLen(4.5),
      });
      slide1.addText(pb.label, {
        x: badgeX,
        y: badgeY,
        w: badgeW,
        h: badgeH,
        fontFace: FONT_FAMILY,
        fontSize: Math.max(5.5, pxToPt(9)),
        bold: true,
        color: toHex6(pb.text, 'FFFFFF'),
        align: 'center',
        valign: 'middle',
        margin: 0,
      });
      counters.shapes++;
      counters.texts++;
      cursorPx += prioW;
    }

    if (node.progress !== undefined) {
      const ringSize = toInLen(14);
      const rx = toInX(cursorPx + 1);
      const ry = toInY(node.y - 7);
      slide1.addShape(pptx.ShapeType.ellipse, {
        x: rx,
        y: ry,
        w: ringSize,
        h: ringSize,
        fill: { color: node.progress >= 100 ? branchHex : 'FFFFFF' },
        line: { color: isRoot ? 'FFFFFF' : branchHex, width: 1.1 },
      });
      if (node.progress > 0 && node.progress < 100) {
        slide1.addText(`${node.progress}`, {
          x: rx - toInLen(3),
          y: ry,
          w: ringSize + toInLen(6),
          h: ringSize,
          fontFace: FONT_FAMILY,
          fontSize: Math.max(5, pxToPt(7.5)),
          bold: true,
          color: isRoot ? branchHex : branchHex,
          align: 'center',
          valign: 'middle',
          margin: 0,
        });
        counters.texts++;
      }
      counters.shapes++;
      cursorPx += progW;
    }

    // Caja de texto principal + subtítulo 100% editable
    const textBoxLeftPx =
      leftExtraTotal > 0 ? cursorPx + 2 : node.x - node.width / 2 + Math.max(8, typo.padX - 4) + diamondInset;
    const textBoxRightPx = node.x + node.width / 2 - Math.max(8, typo.padX - 4) - diamondInset;
    const textBoxWpx = Math.max(24, textBoxRightPx - textBoxLeftPx);

    const effectiveAlign: 'left' | 'center' | 'right' | 'justify' =
      node.textAlign ||
      (isRoot || shape === 'diamond' || shape === 'circle' || shape === 'pill'
        ? leftExtraTotal > 0
          ? 'left'
          : 'center'
        : 'left');

    // Escala levemente conservadora (0.94) para que la sustitución tipográfica en Canva no desborde cuadros
    const mainFontPt = Math.max(6.2, pxToPt(typo.fontSize * 0.94));
    const subFontPt = Math.max(5.5, pxToPt(11 * 0.94));

    const runs: PptxGenJS.TextProps[] = [
      {
        text: node.text || 'Tema',
        options: {
          fontFace: FONT_FAMILY,
          fontSize: mainFontPt,
          bold: isRoot || typo.fontWeight >= 600,
          color: textHex,
          align: effectiveAlign,
          breakLine: Boolean(node.subtitle),
        },
      },
    ];

    if (node.subtitle) {
      runs.push({
        text: node.subtitle,
        options: {
          fontFace: FONT_FAMILY,
          fontSize: subFontPt,
          bold: false,
          color: isRoot ? 'F5F5F4' : toHex6(theme.textSecondary, '57534E'),
          align: effectiveAlign,
        },
      });
    }

    const textOpts: PptxGenJS.TextPropsOptions = {
      x: toInX(textBoxLeftPx),
      y: ny + toInLen(3),
      w: toInLen(textBoxWpx),
      h: Math.max(0.12, nh - toInLen(6)),
      valign: 'middle',
      margin: 0,
      wrap: true,
    };

    if (node.hyperlink) {
      textOpts.hyperlink = { url: node.hyperlink, tooltip: node.text };
    }

    slide1.addText(runs, textOpts);
    counters.texts++;
  }

  // Notas del presentador para la Diapositiva 1
  if (includeSpeakerNotes) {
    const slide1Notes = scene.visibleNodes
      .filter(n => n.notes && n.notes.trim())
      .map(n => `• ${n.text}: ${n.notes!.trim()}`)
      .join('\n');
    if (slide1Notes) {
      slide1.addNotes(slide1Notes);
    }
  }

  // Diapositivas 2..N opcionales: presentación por rama con tarjetas grandes editables en Canva
  let slideCount = 1;
  if (includeBranchSlides) {
    slideCount += appendBranchBreakdownSlides(pptx, project, includeSpeakerNotes, counters);
  }

  const fileName = `${sanitizeFileName(project.title)}-canva-editable.pptx`;
  await pptx.writeFile({ fileName, compression: true });

  return {
    fileName,
    slideCount,
    editableShapeCount: counters.shapes,
    editableTextCount: counters.texts,
    nativeLineCount: counters.lines,
  };
}
