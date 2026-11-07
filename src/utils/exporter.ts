import type { OrganizerNode, OrganizerProject } from '../types/organizer';
import { buildProjectSceneGeometry } from './geometry';
import { getNodeTypography, resolveEffectiveShape } from './measure';
import {
  getThemeConfig,
  hexToPastelSolid,
  PRIORITY_BADGES,
} from './themes';
import { applyLayout } from './layouts';

export interface ExportSvgOptions {
  transparentBg?: boolean;
  includeGrid?: boolean;
  includeHeader?: boolean;
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Construye el arco SVG de progreso circular (0..100) */
function renderProgressPieSvg(cx: number, cy: number, r: number, pct: number, color: string): string {
  const baseCircle = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" stroke="${color}" stroke-width="1.6"/>`;
  if (pct <= 0) return baseCircle;
  if (pct >= 100) {
    return (
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>` +
      `<path d="M ${cx - 3.2} ${cy + 0.2} L ${cx - 0.8} ${cy + 2.6} L ${cx + 3.6} ${cy - 2.4}" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }
  const angle = (pct / 100) * Math.PI * 2 - Math.PI / 2;
  const ex = cx + r * Math.cos(angle);
  const ey = cy + r * Math.sin(angle);
  const largeArc = pct > 50 ? 1 : 0;
  const slice = `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z`;
  return `${baseCircle}<path d="${slice}" fill="${color}"/>`;
}

/** Renderiza la silueta vectorial exacta de un nodo */
function renderNodeShapeSvg(
  node: OrganizerNode,
  project: OrganizerProject,
  fill: string,
  stroke: string,
  strokeW: number
): string {
  const shape = resolveEffectiveShape(node, node.depth || 0, project.type, project.theme);
  const w = node.width;
  const h = node.height;
  const x = node.x - w / 2;
  const y = node.y - h / 2;

  if (shape === 'underline') {
    return '';
  }

  if (shape === 'diamond') {
    const pts = `${node.x},${y} ${x + w},${node.y} ${node.x},${y + h} ${x},${node.y}`;
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round" filter="url(#edrawShadow)"/>`;
  }

  if (shape === 'parallelogram') {
    const skew = 14;
    const pts = `${x + skew},${y} ${x + w},${y} ${x + w - skew},${y + h} ${x},${y + h}`;
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round" filter="url(#edrawShadow)"/>`;
  }

  if (shape === 'hexagon') {
    const inset = 14;
    const pts = `${x + inset},${y} ${x + w - inset},${y} ${x + w},${node.y} ${x + w - inset},${y + h} ${x + inset},${y + h} ${x},${node.y}`;
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round" filter="url(#edrawShadow)"/>`;
  }

  if (shape === 'circle') {
    const r = Math.min(w, h) / 2;
    return `<circle cx="${node.x}" cy="${node.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" filter="url(#edrawShadow)"/>`;
  }

  const rx =
    shape === 'pill'
      ? Math.min(h / 2, 999)
      : shape === 'rectangle'
      ? 6
      : shape === 'cloud'
      ? 22
      : node.isRoot
      ? 16
      : 12;

  const dashAttr = shape === 'cloud' ? ` stroke-dasharray="6 3"` : '';
  return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"${dashAttr} filter="url(#edrawShadow)"/>`;
}

/**
 * Genera un documento SVG autónomo y 100% vectorial del organizador completo,
 * libre de dependencias externas o bloqueos CORS.
 */
export function generateStandaloneSvg(
  project: OrganizerProject,
  options: ExportSvgOptions = {}
): { svg: string; width: number; height: number } {
  const theme = getThemeConfig(project.theme);
  const scene = buildProjectSceneGeometry(project);

  const padX = 76;
  const padBottom = 76;
  const headerSpace = options.includeHeader ? 62 : 0;
  const padTop = 76 + headerSpace;

  const vbX = Math.floor(scene.bounds.minX - padX);
  const vbY = Math.floor(scene.bounds.minY - padTop);
  const totalW = Math.ceil(scene.bounds.maxX - scene.bounds.minX + padX * 2);
  const totalH = Math.ceil(scene.bounds.maxY - scene.bounds.minY + padTop + padBottom);

  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="${vbX} ${vbY} ${totalW} ${totalH}" style="font-family: 'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">`
  );

  // Definiciones de sombras y patrones de fondo
  parts.push(`<defs>
    <filter id="edrawShadow" x="-12%" y="-12%" width="128%" height="132%">
      <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="#1C1917" flood-opacity="0.08"/>
    </filter>
    <pattern id="dotPattern" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1.25" fill="#A8A29E" fill-opacity="0.32"/>
    </pattern>
    <pattern id="gridPattern" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#A8A29E" stroke-opacity="0.18" stroke-width="1"/>
    </pattern>
  </defs>`);

  // Fondo del lienzo
  if (!options.transparentBg) {
    parts.push(
      `<rect x="${vbX}" y="${vbY}" width="${totalW}" height="${totalH}" fill="${theme.canvasBg}"/>`
    );
    const bgMode = options.includeGrid ? project.canvasBg || 'dots' : 'clean';
    if (bgMode === 'dots') {
      parts.push(
        `<rect x="${vbX}" y="${vbY}" width="${totalW}" height="${totalH}" fill="url(#dotPattern)"/>`
      );
    } else if (bgMode === 'grid') {
      parts.push(
        `<rect x="${vbX}" y="${vbY}" width="${totalW}" height="${totalH}" fill="url(#gridPattern)"/>`
      );
    }
  }

  // Encabezado opcional elegante
  if (options.includeHeader) {
    parts.push(
      `<g transform="translate(${vbX + 36}, ${vbY + 42})">
        <text x="0" y="0" font-size="18" font-weight="700" fill="${theme.textPrimary}">${escapeXml(project.title)}</text>
        <text x="0" y="19" font-size="11.5" font-weight="500" fill="${theme.textSecondary}">Generado con Synapse Studio • ${new Date().toLocaleDateString('es-ES')}</text>
      </g>`
    );
  }

  // 1. Capa de conectores, llaves, espinas y flechas
  parts.push(`<g id="layer-connectors">`);
  for (const p of scene.paths) {
    if (p.kind === 'fill') {
      parts.push(`<path d="${p.d}" fill="${p.color}"/>`);
    } else if (p.kind === 'dashed') {
      parts.push(
        `<path d="${p.d}" fill="none" stroke="${p.color}" stroke-width="${p.strokeWidth || 2}" stroke-dasharray="6 4" stroke-linecap="round"/>`
      );
    } else {
      parts.push(
        `<path d="${p.d}" fill="none" stroke="${p.color}" stroke-width="${p.strokeWidth || 2.2}" stroke-linecap="round" stroke-linejoin="round"/>`
      );
    }

    if (p.arrowEnd) {
      const { x, y, angleDeg, color } = p.arrowEnd;
      parts.push(
        `<polygon points="0,0 -10.5,-4.8 -8.4,0 -10.5,4.8" fill="${color}" transform="translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${angleDeg.toFixed(2)})"/>`
      );
    }

    if (p.label && p.labelX !== undefined && p.labelY !== undefined) {
      const lbl = p.label.trim();
      if (lbl) {
        const pillW = Math.max(40, lbl.length * 6.7 + 18);
        const pillH = 22;
        const px = p.labelX - pillW / 2;
        const py = p.labelY - pillH / 2;
        const borderCol = p.isCrossLink ? p.color : '#CBD5E1';
        const textCol = p.isCrossLink ? p.color : '#334155';
        parts.push(
          `<g>
            <rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${pillW.toFixed(2)}" height="${pillH}" rx="11" fill="#FFFFFF" stroke="${borderCol}" stroke-width="1.3"/>
            <text x="${p.labelX.toFixed(2)}" y="${(p.labelY + 4).toFixed(2)}" text-anchor="middle" font-size="11" font-weight="600" fill="${textCol}">${escapeXml(lbl)}</text>
          </g>`
        );
      }
    }
  }

  // Insignias numeradas de la Línea de Tiempo
  for (const b of scene.timelineBadges) {
    parts.push(
      `<g>
        <circle cx="${b.x.toFixed(2)}" cy="${b.y.toFixed(2)}" r="14" fill="${b.color}" stroke="#FFFFFF" stroke-width="2.5"/>
        <text x="${b.x.toFixed(2)}" y="${(b.y + 4).toFixed(2)}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#FFFFFF">${b.index}</text>
      </g>`
    );
  }
  parts.push(`</g>`);

  // Capa de imágenes libres colocadas en el lienzo
  if (project.images && project.images.length > 0) {
    parts.push(`<g id="layer-images">`);
    for (const img of project.images) {
      const ix = img.x - img.width / 2;
      const iy = img.y - img.height / 2;
      const br = img.borderRadius ?? 10;
      const op = img.opacity ?? 1;
      const clipId = `clip-img-${escapeXml(img.id)}`;

      parts.push(
        `<defs>` +
          `<clipPath id="${clipId}">` +
            `<rect x="${ix.toFixed(2)}" y="${iy.toFixed(2)}" width="${img.width.toFixed(2)}" height="${img.height.toFixed(2)}" rx="${br}" ry="${br}"/>` +
          `</clipPath>` +
        `</defs>` +
        `<g opacity="${op}">` +
          `<rect x="${ix.toFixed(2)}" y="${iy.toFixed(2)}" width="${img.width.toFixed(2)}" height="${img.height.toFixed(2)}" rx="${br}" ry="${br}" fill="#FFFFFF" filter="url(#edrawShadow)"/>` +
          `<image href="${escapeXml(img.url)}" x="${ix.toFixed(2)}" y="${iy.toFixed(2)}" width="${img.width.toFixed(2)}" height="${img.height.toFixed(2)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>` +
          `<rect x="${ix.toFixed(2)}" y="${iy.toFixed(2)}" width="${img.width.toFixed(2)}" height="${img.height.toFixed(2)}" rx="${br}" ry="${br}" fill="none" stroke="#E2E8F0" stroke-width="1.2"/>` +
        `</g>`
      );
    }
    parts.push(`</g>`);
  }

  // 2. Capa de nodos, insignias Edraw y textos envueltos
  parts.push(`<g id="layer-nodes">`);
  for (const node of scene.visibleNodes) {
    const depth = node.depth || 0;
    const isRoot = Boolean(node.isRoot || depth === 0);
    const typo = getNodeTypography(depth, isRoot);
    const shape = resolveEffectiveShape(node, depth, project.type, project.theme);
    const branchColor = node.color || theme.palette[0];

    let fill = '#FFFFFF';
    let stroke = branchColor;
    let textColor = node.textColor || theme.textPrimary;
    let strokeW = isRoot ? 2.4 : depth === 1 ? 2 : 1.6;

    if (node.bgColor) {
      fill = node.bgColor;
    } else if (isRoot) {
      fill = branchColor;
      stroke = theme.rootBorder || branchColor;
      textColor = node.textColor || '#FFFFFF';
    } else if (theme.topicFillMode === 'tinted-pastel') {
      fill = hexToPastelSolid(branchColor, depth === 1 ? 0.14 : 0.08);
    } else {
      fill = '#FFFFFF';
    }

    parts.push(`<g id="svg-${escapeXml(node.id)}">`);
    parts.push(renderNodeShapeSvg(node, project, fill, stroke, strokeW));

    // Acento lateral en tarjetas blancas (nivel >= 1)
    if (
      !isRoot &&
      !node.bgColor &&
      theme.topicFillMode === 'white-accent' &&
      (shape === 'rounded' || shape === 'rectangle')
    ) {
      const barH = Math.max(16, node.height - 18);
      const barX = node.x - node.width / 2 + 6;
      const barY = node.y - barH / 2;
      parts.push(
        `<rect x="${barX.toFixed(2)}" y="${barY.toFixed(2)}" width="4" height="${barH.toFixed(2)}" rx="2" fill="${branchColor}"/>`
      );
    }

    // Cálculo de posición interna horizontal centrada para [icono + prioridad + progreso + bloque de texto]
    const lines = node.lines && node.lines.length > 0 ? node.lines : [node.text];
    const textBlockH = lines.length * typo.lineHeight + (node.subtitle ? 17 : 0);

    const iconW = node.icon ? 22 : 0;
    const prioW = node.priority ? 28 : 0;
    const progW = node.progress !== undefined ? 20 : 0;
    const leftExtraTotal = iconW + prioW + progW;

    const contentLeft = node.x - node.width / 2 + typo.padX + (shape === 'diamond' ? node.width * 0.14 : 0);
    let badgeCursorX = contentLeft;
    const midY = node.y;

    if (node.icon) {
      parts.push(
        `<text x="${(badgeCursorX + 9).toFixed(2)}" y="${(midY + 5).toFixed(2)}" text-anchor="middle" font-size="${isRoot ? 16 : 14}">${escapeXml(node.icon)}</text>`
      );
      badgeCursorX += iconW;
    }

    if (node.priority && PRIORITY_BADGES[node.priority]) {
      const pb = PRIORITY_BADGES[node.priority];
      parts.push(
        `<rect x="${badgeCursorX.toFixed(2)}" y="${(midY - 8.5).toFixed(2)}" width="22" height="17" rx="4.5" fill="${pb.bg}"/>` +
          `<text x="${(badgeCursorX + 11).toFixed(2)}" y="${(midY + 3.5).toFixed(2)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${pb.text}">${pb.label}</text>`
      );
      badgeCursorX += prioW;
    }

    if (node.progress !== undefined) {
      parts.push(renderProgressPieSvg(badgeCursorX + 8, midY, 7.2, node.progress, isRoot ? '#FFFFFF' : branchColor));
      badgeCursorX += progW;
    }

    const isCenteredShape =
      isRoot || shape === 'diamond' || shape === 'circle' || shape === 'pill';

    const textAnchor = isCenteredShape && leftExtraTotal === 0 ? 'middle' : 'start';
    const textStartX =
      textAnchor === 'middle' ? node.x : badgeCursorX + (leftExtraTotal > 0 ? 2 : 0);

    const firstLineBaselineY =
      node.y - textBlockH / 2 + typo.fontSize * 0.88 - (shape === 'underline' ? 2 : 0);

    lines.forEach((ln, idx) => {
      const ly = firstLineBaselineY + idx * typo.lineHeight;
      parts.push(
        `<text x="${textStartX.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="${textAnchor}" font-size="${typo.fontSize}" font-weight="${typo.fontWeight}" fill="${textColor}">${escapeXml(ln)}</text>`
      );
    });

    if (node.subtitle) {
      const subY = firstLineBaselineY + lines.length * typo.lineHeight + 13;
      const subColor = isRoot ? 'rgba(255,255,255,0.86)' : theme.textSecondary;
      parts.push(
        `<text x="${textStartX.toFixed(2)}" y="${subY.toFixed(2)}" text-anchor="${textAnchor}" font-size="11" font-weight="500" fill="${subColor}">${escapeXml(node.subtitle)}</text>`
      );
    }

    // Indicador de subrama contraída (+N)
    const hiddenCount = scene.descendantCount.get(node.id) || 0;
    if (node.collapsed && hiddenCount > 0) {
      const bx =
        node.side === 'left'
          ? node.x - node.width / 2 - 14
          : node.side === 'bottom'
          ? node.x
          : node.x + node.width / 2 + 14;
      const by = node.side === 'bottom' ? node.y + node.height / 2 + 13 : node.y;
      parts.push(
        `<circle cx="${bx.toFixed(2)}" cy="${by.toFixed(2)}" r="10.5" fill="${branchColor}" stroke="#FFFFFF" stroke-width="2"/>` +
          `<text x="${bx.toFixed(2)}" y="${(by + 3.5).toFixed(2)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#FFFFFF">+${hiddenCount}</text>`
      );
    }

    parts.push(`</g>`);
  }
  parts.push(`</g>`);

  parts.push(`</svg>`);

  return { svg: parts.join('\n'), width: totalW, height: totalH };
}

/** Exporta directamente como archivo vectorial SVG */
export function exportAsSvgFile(project: OrganizerProject, options: ExportSvgOptions = {}) {
  const { svg } = generateStandaloneSvg(project, options);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  triggerBlobDownload(blob, `${sanitizeFileName(project.title)}.svg`);
}

/** Rasteriza el SVG autónomo a PNG Ultra HD (3x Retina) o JPG en un <canvas> fuera de pantalla */
export async function exportAsRasterFile(
  project: OrganizerProject,
  format: 'png' | 'jpg',
  options: ExportSvgOptions = {}
): Promise<void> {
  const effectiveOpts: ExportSvgOptions = {
    ...options,
    transparentBg: format === 'jpg' ? false : options.transparentBg,
  };
  const { svg, width, height } = generateStandaloneSvg(project, effectiveOpts);
  const theme = getThemeConfig(project.theme);

  // Escala Retina 3x garantizando no exceder el límite máximo de píxeles del navegador
  const maxSafePixels = 10800;
  const scale = Math.min(3, maxSafePixels / Math.max(width, height, 1));
  const canvasW = Math.max(1, Math.round(width * scale));
  const canvasH = Math.max(1, Math.round(height * scale));

  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto gráfico 2D'));
          return;
        }

        if (format === 'jpg' || !effectiveOpts.transparentBg) {
          ctx.fillStyle = theme.canvasBg;
          ctx.fillRect(0, 0, canvasW, canvasH);
        }

        ctx.drawImage(img, 0, 0, canvasW, canvasH);

        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const quality = format === 'jpg' ? 0.95 : undefined;

        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('No se pudo generar el archivo de imagen'));
              return;
            }
            triggerBlobDownload(blob, `${sanitizeFileName(project.title)}.${format}`);
            resolve();
          },
          mime,
          quality
        );
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Error al renderizar la imagen vectorial'));
    img.src = svgDataUrl;
  });
}

/** Exporta documento PDF vectorial listo para guardar o imprimir a máxima nitidez */
export function exportAsVectorPdf(project: OrganizerProject) {
  const { svg } = generateStandaloneSvg(project, {
    transparentBg: false,
    includeGrid: false,
    includeHeader: true,
  });

  const htmlDoc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(project.title)} - PDF Vectorial</title>
  <style>
    @page { size: landscape; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .sheet {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
    }
    svg {
      max-width: 100%;
      max-height: 96vh;
      width: auto;
      height: auto;
      border-radius: 10px;
    }
    .toolbar {
      position: fixed;
      top: 14px;
      right: 18px;
      display: flex;
      gap: 8px;
      background: #1C1917;
      color: #FFF;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 13px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.18);
    }
    .toolbar button {
      background: #EA580C;
      color: #FFF;
      border: none;
      padding: 5px 12px;
      border-radius: 999px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      .toolbar { display: none !important; }
      svg { max-height: 100%; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>Vista Vectorial Lista para PDF</span>
    <button onclick="window.print()">Guardar como PDF / Imprimir</button>
  </div>
  <div class="sheet">${svg}</div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 350);
    });
  </script>
</body>
</html>`;

  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(htmlDoc);
    printWin.document.close();
  } else {
    // Respaldo mediante iframe oculto si el navegador bloquea pestañas emergentes
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlDoc);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 3000);
      }, 450);
    }
  }
}

/** Exporta un archivo HTML interactivo autónomo con paneo y zoom integrados */
export function exportAsInteractiveHtml(project: OrganizerProject) {
  const theme = getThemeConfig(project.theme);
  const { svg } = generateStandaloneSvg(project, {
    transparentBg: false,
    includeGrid: true,
    includeHeader: false,
  });

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeXml(project.title)} • Visor Interactivo Synapse</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: ${theme.canvasBg}; font-family: system-ui, -apple-system, sans-serif; user-select: none; }
    #viewport { width: 100%; height: 100%; cursor: grab; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    #viewport:active { cursor: grabbing; }
    #stage { transform-origin: center center; transition: transform 0.04s linear; }
    .hud { position: fixed; top: 16px; left: 16px; background: rgba(255,255,255,0.94); border: 1px solid #E7E5E4; border-radius: 14px; padding: 10px 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 14px; }
    .hud h1 { margin: 0; font-size: 15px; color: #1C1917; }
    .controls { position: fixed; bottom: 18px; right: 18px; background: rgba(255,255,255,0.95); border: 1px solid #E7E5E4; border-radius: 12px; padding: 6px; display: flex; gap: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    button { border: 1px solid #E7E5E4; background: #FFF; color: #292524; border-radius: 8px; padding: 6px 11px; font-size: 13px; font-weight: 600; cursor: pointer; }
    button:hover { background: #F5F5F4; }
  </style>
</head>
<body>
  <div class="hud">
    <h1>${escapeXml(project.title)}</h1>
    <span style="font-size:12px;color:#78716C;">Arrastra para mover • Rueda para zoom</span>
  </div>
  <div id="viewport">
    <div id="stage">${svg}</div>
  </div>
  <div class="controls">
    <button onclick="zoomBy(0.85)">−</button>
    <button id="zlbl" onclick="resetView()">100%</button>
    <button onclick="zoomBy(1.18)">+</button>
    <button onclick="resetView()">Centrar</button>
  </div>
  <script>
    let scale = 1, tx = 0, ty = 0, dragging = false, sx = 0, sy = 0;
    const stage = document.getElementById('stage');
    const vp = document.getElementById('viewport');
    const zlbl = document.getElementById('zlbl');
    function apply() {
      stage.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
      zlbl.textContent = Math.round(scale * 100) + '%';
    }
    function zoomBy(f) { scale = Math.min(4, Math.max(0.2, scale * f)); apply(); }
    function resetView() { scale = 0.92; tx = 0; ty = 0; apply(); }
    vp.addEventListener('mousedown', e => { dragging = true; sx = e.clientX - tx; sy = e.clientY - ty; });
    window.addEventListener('mousemove', e => { if (!dragging) return; tx = e.clientX - sx; ty = e.clientY - sy; apply(); });
    window.addEventListener('mouseup', () => { dragging = false; });
    vp.addEventListener('wheel', e => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.1 : 0.9); }, { passive: false });
    resetView();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  triggerBlobDownload(blob, `${sanitizeFileName(project.title)}-interactivo.html`);
}

/** Convierte el proyecto completo a un esquema Markdown jerárquico enriquecido */
export function convertProjectToMarkdown(project: OrganizerProject): string {
  const nodeMap = new Map<string, OrganizerNode>();
  project.nodes.forEach(n => nodeMap.set(n.id, n));

  const root =
    project.nodes.find(n => n.isRoot) ||
    project.nodes.find(n => !n.parentId || !nodeMap.has(n.parentId)) ||
    project.nodes[0];

  if (!root) return `# ${project.title}\n`;

  const childrenMap = new Map<string, OrganizerNode[]>();
  project.nodes.forEach(n => childrenMap.set(n.id, []));
  project.nodes.forEach(n => {
    if (n.id !== root.id && n.parentId && childrenMap.has(n.parentId)) {
      childrenMap.get(n.parentId)!.push(n);
    }
  });

  const lines: string[] = [];
  const iconPrefix = root.icon ? `${root.icon} ` : '';
  lines.push(`# ${iconPrefix}${root.text}`);
  if (root.subtitle) lines.push(`> *${root.subtitle}*`);
  if (root.notes) lines.push(`\n${root.notes}`);
  lines.push('');

  const visited = new Set<string>([root.id]);
  function walk(parentId: string, depth: number) {
    const kids = childrenMap.get(parentId) || [];
    for (const k of kids) {
      if (visited.has(k.id)) continue;
      visited.add(k.id);

      const badges: string[] = [];
      if (k.priority) badges.push(`[P${k.priority}]`);
      if (k.progress !== undefined) badges.push(`[${k.progress}%]`);
      const badgeStr = badges.length > 0 ? ` ${badges.join(' ')}` : '';
      const ic = k.icon ? `${k.icon} ` : '';
      const sub = k.subtitle ? ` — *${k.subtitle}*` : '';

      if (depth === 1) {
        lines.push(`## ${ic}${k.text}${badgeStr}${sub}`);
      } else {
        const indent = '  '.repeat(Math.max(0, depth - 2));
        lines.push(`${indent}- **${ic}${k.text}**${badgeStr}${sub}`);
      }

      if (k.notes) {
        const noteIndent = depth === 1 ? '> ' : `${'  '.repeat(Math.max(0, depth - 1))}> `;
        lines.push(`${noteIndent}${k.notes.replace(/\r?\n/g, ' ')}`);
      }

      walk(k.id, depth + 1);
      if (depth === 1) lines.push('');
    }
  }

  walk(root.id, 1);

  const crossLinks = project.edges.filter(e => e.isCrossLink);
  if (crossLinks.length > 0) {
    lines.push('---');
    lines.push('## Relaciones Cruzadas');
    for (const cl of crossLinks) {
      const a = nodeMap.get(cl.from)?.text || cl.from;
      const b = nodeMap.get(cl.to)?.text || cl.to;
      lines.push(`- **${a}** → *${cl.label || 'se relaciona con'}* → **${b}**`);
    }
  }

  return lines.join('\n');
}

export function exportAsMarkdownFile(project: OrganizerProject) {
  const md = convertProjectToMarkdown(project);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  triggerBlobDownload(blob, `${sanitizeFileName(project.title)}.md`);
}

export function exportAsJsonFile(project: OrganizerProject) {
  const payload = JSON.stringify(project, null, 2);
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
  triggerBlobDownload(blob, `${sanitizeFileName(project.title)}.synapse.json`);
}

/** Valida e importa un archivo JSON de proyecto re-calculando su geometría si es necesario */
export function parseImportedProjectJson(rawJson: string): OrganizerProject {
  const parsed = JSON.parse(rawJson);
  if (!parsed || !Array.isArray(parsed.nodes)) {
    throw new Error('El archivo JSON no contiene un proyecto válido de Synapse.');
  }

  const validType = parsed.type || 'mindmap';
  const validTheme = parsed.theme || 'vitality-warm';
  const validDirection = parsed.cartographicDirection || 'clockwise';
  const relaid = applyLayout(
    parsed.nodes,
    Array.isArray(parsed.edges) ? parsed.edges : [],
    validType,
    validTheme,
    false,
    validDirection
  );

  return {
    id: `proj-import-${Date.now()}`,
    title: parsed.title || 'Proyecto Importado',
    type: validType,
    theme: validTheme,
    connectorStyle: parsed.connectorStyle,
    canvasBg: parsed.canvasBg || 'dots',
    rainbowBranches: parsed.rainbowBranches ?? true,
    cartographicDirection: validDirection,
    nodes: relaid.nodes,
    edges: relaid.edges,
    images: Array.isArray(parsed.images) ? parsed.images : [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
