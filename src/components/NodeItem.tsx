import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ExternalLink,
  FileText,
  Plus,
} from 'lucide-react';
import { OrganizerNode, OrganizerType, ThemeId } from '../types/organizer';
import { getNodeTypography, resolveEffectiveShape } from '../utils/measure';
import {
  getThemeConfig,
  hexToPastelSolid,
  PRIORITY_BADGES,
} from '../utils/themes';

interface NodeItemProps {
  node: OrganizerNode;
  organizerType: OrganizerType;
  themeId: ThemeId;
  isSelected: boolean;
  isEditingExternal?: boolean;
  isConnectSource: boolean;
  isConnectMode: boolean;
  descendantCount: number;
  hasChildren: boolean;
  onSelect: (id: string) => void;
  onEditingChange?: (id: string, editing: boolean) => void;
  onStartDrag: (e: React.PointerEvent, node: OrganizerNode) => void;
  onCommitText: (id: string, newText: string) => void;
  onToggleCollapse: (id: string) => void;
  onCycleProgress: (id: string) => void;
  onAddChild: (id: string) => void;
  onOpenNotes: (id: string) => void;
}

export const NodeItem: React.FC<NodeItemProps> = ({
  node,
  organizerType,
  themeId,
  isSelected,
  isEditingExternal,
  isConnectSource,
  isConnectMode,
  descendantCount,
  hasChildren,
  onSelect,
  onEditingChange,
  onStartDrag,
  onCommitText,
  onToggleCollapse,
  onCycleProgress,
  onAddChild,
  onOpenNotes,
}) => {
  const [localEditing, setLocalEditing] = useState(false);
  const isEditing = isEditingExternal ?? localEditing;
  const setIsEditing = (next: boolean) => {
    setLocalEditing(next);
    onEditingChange?.(node.id, next);
  };
  const [draftText, setDraftText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    setDraftText(node.text);
  }, [node.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const depth = node.depth || 0;
  const isRoot = Boolean(node.isRoot || depth === 0);
  const theme = getThemeConfig(themeId);
  const typo = getNodeTypography(depth, isRoot);
  const shape = resolveEffectiveShape(node, depth, organizerType, themeId);
  const branchColor = node.color || theme.palette[0];

  const w = node.width || 148;
  const h = node.height || 48;
  const left = node.x - w / 2;
  const top = node.y - h / 2;

  // Cálculo de colores exactos según tema y jerarquía EdrawMax
  let fillBg = '#FFFFFF';
  let strokeColor = branchColor;
  let textColor = node.textColor || theme.textPrimary;
  const strokeWidth = isSelected ? 2.6 : isRoot ? 2.3 : depth === 1 ? 2 : 1.65;

  if (node.bgColor) {
    fillBg = node.bgColor;
  } else if (isRoot) {
    fillBg = branchColor;
    strokeColor = theme.rootBorder || branchColor;
    textColor = node.textColor || '#FFFFFF';
  } else if (theme.topicFillMode === 'tinted-pastel') {
    fillBg = hexToPastelSolid(branchColor, depth === 1 ? 0.14 : 0.08);
  } else {
    fillBg = '#FFFFFF';
  }

  const isPolygonShape =
    shape === 'diamond' || shape === 'parallelogram' || shape === 'hexagon';

  const saveEdit = () => {
    setIsEditing(false);
    const trimmed = draftText.trim() || 'Tema';
    if (trimmed !== node.text) {
      onCommitText(node.id, trimmed);
    } else {
      setDraftText(node.text);
    }
  };

  // Posición semántica del botón de contraer/expandir y añadir hijo rápido
  const portDirection: 'left' | 'right' | 'bottom' | 'top' =
    organizerType === 'tree' || organizerType === 'concept' || organizerType === 'flowchart'
      ? 'bottom'
      : organizerType === 'fishbone'
      ? 'left'
      : organizerType === 'timeline'
      ? node.y < 0
        ? 'top'
        : 'bottom'
      : node.side === 'left'
      ? 'left'
      : 'right';

  const renderProgressRing = (pct: number) => {
    const r = 7;
    const strokeCol = isRoot ? '#FFFFFF' : branchColor;
    if (pct >= 100) {
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
          <circle cx="9" cy="9" r={r} fill={strokeCol} />
          <path
            d="M5.6 9.2L8 11.5L12.6 6.6"
            fill="none"
            stroke={isRoot ? branchColor : '#FFFFFF'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    const angle = (pct / 100) * Math.PI * 2 - Math.PI / 2;
    const ex = 9 + r * Math.cos(angle);
    const ey = 9 + r * Math.sin(angle);
    const largeArc = pct > 50 ? 1 : 0;
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
        <circle
          cx="9"
          cy="9"
          r={r}
          fill={isRoot ? 'rgba(255,255,255,0.2)' : '#FFFFFF'}
          stroke={strokeCol}
          strokeWidth="1.6"
        />
        {pct > 0 && (
          <path
            d={`M 9 9 L 9 ${9 - r} A ${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z`}
            fill={strokeCol}
          />
        )}
      </svg>
    );
  };

  const borderRadiusStyle =
    shape === 'pill'
      ? '9999px'
      : shape === 'circle'
      ? '50%'
      : shape === 'rectangle'
      ? '7px'
      : shape === 'cloud'
      ? '24px'
      : isRoot
      ? '16px'
      : '12px';

  const isSmallScreen =
    typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div
      data-node-id={node.id}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${w}px`,
        height: `${h}px`,
        zIndex: isSelected ? 35 : isRoot ? 20 : 12,
      }}
      className="group select-none"
      onPointerDown={e => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.stopPropagation();

        // Detectar doble toque rápido en pantallas táctiles para editar texto al instante
        if (e.pointerType === 'touch' && !isConnectMode && !isEditing) {
          const now = Date.now();
          if (now - lastTapRef.current < 320) {
            lastTapRef.current = 0;
            onSelect(node.id);
            setIsEditing(true);
            return;
          }
          lastTapRef.current = now;
        }

        onSelect(node.id);
        if (!isEditing && !isConnectMode) {
          onStartDrag(e, node);
        }
      }}
      onDoubleClick={e => {
        e.stopPropagation();
        if (!isConnectMode) {
          setIsEditing(true);
        }
      }}
    >
      {/* Botón flotante de confirmación cuando se edita texto (ideal para móvil y escritorio) */}
      {isEditing && (
        <div
          onPointerDown={e => {
            e.preventDefault();
            e.stopPropagation();
            saveEdit();
          }}
          className="absolute left-1/2 -translate-x-1/2 -top-10 z-50"
        >
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Listo</span>
          </button>
        </div>
      )}

      {/* Fondo poligonal SVG para Rombo / Paralelogramo / Hexágono */}
      {isPolygonShape && (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="absolute inset-0 pointer-events-none overflow-visible"
        >
          {shape === 'diamond' && (
            <polygon
              points={`${w / 2},1 ${w - 1},${h / 2} ${w / 2},${h - 1} 1,${h / 2}`}
              fill={fillBg}
              stroke={isSelected ? '#EA580C' : strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 4px 10px rgba(28,25,23,0.08))' }}
            />
          )}
          {shape === 'parallelogram' && (
            <polygon
              points={`15,1 ${w - 1},1 ${w - 15},${h - 1} 1,${h - 1}`}
              fill={fillBg}
              stroke={isSelected ? '#EA580C' : strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 4px 10px rgba(28,25,23,0.08))' }}
            />
          )}
          {shape === 'hexagon' && (
            <polygon
              points={`14,1 ${w - 14},1 ${w - 1},${h / 2} ${w - 14},${h - 1} 14,${h - 1} 1,${h / 2}`}
              fill={fillBg}
              stroke={isSelected ? '#EA580C' : strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 4px 10px rgba(28,25,23,0.08))' }}
            />
          )}
        </svg>
      )}

      {/* Cuerpo principal del nodo */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: isPolygonShape || shape === 'underline' ? 'transparent' : fillBg,
          borderColor:
            isPolygonShape || shape === 'underline'
              ? 'transparent'
              : isConnectSource
              ? '#EA580C'
              : isSelected
              ? '#EA580C'
              : strokeColor,
          borderWidth: isPolygonShape || shape === 'underline' ? 0 : `${strokeWidth}px`,
          borderStyle: shape === 'cloud' ? 'dashed' : 'solid',
          borderRadius: borderRadiusStyle,
          color: textColor,
          paddingLeft:
            shape === 'diamond'
              ? `${Math.round(w * 0.16)}px`
              : shape === 'underline'
              ? '8px'
              : `${typo.padX}px`,
          paddingRight:
            shape === 'diamond'
              ? `${Math.round(w * 0.16)}px`
              : shape === 'underline'
              ? '8px'
              : `${typo.padX}px`,
        }}
        className={`relative flex items-center transition-shadow duration-150 ${
          isPolygonShape || shape === 'underline'
            ? ''
            : isSelected
            ? 'edraw-node-shadow-selected ring-4 ring-orange-500/15'
            : 'edraw-node-shadow hover:brightness-[0.99]'
        } ${
          isConnectMode
            ? 'cursor-crosshair ring-2 ring-amber-400/70 hover:scale-[1.03]'
            : 'cursor-grab active:cursor-grabbing'
        } ${
          isRoot || shape === 'diamond' || shape === 'circle' || shape === 'pill'
            ? 'justify-center text-center'
            : 'justify-start text-left'
        }`}
      >
        {/* Barra de acento lateral estilo Edraw en tarjetas blancas */}
        {!isRoot &&
          !node.bgColor &&
          theme.topicFillMode === 'white-accent' &&
          (shape === 'rounded' || shape === 'rectangle') && (
            <span
              style={{ backgroundColor: branchColor }}
              className="absolute left-1.5 top-2 bottom-2 w-1 rounded-full"
            />
          )}

        {/* Contenido interno: insignias + texto + indicadores */}
        <div className="flex items-center gap-1.5 w-full min-w-0 [justify-content:inherit]">
          {node.icon && (
            <span
              className="shrink-0 select-none leading-none"
              style={{ fontSize: isRoot ? '16px' : '14px' }}
            >
              {node.icon}
            </span>
          )}

          {node.priority && PRIORITY_BADGES[node.priority] && (
            <span
              style={{
                backgroundColor: PRIORITY_BADGES[node.priority].bg,
                color: PRIORITY_BADGES[node.priority].text,
              }}
              className="shrink-0 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold leading-none shadow-sm"
              title={`Prioridad ${node.priority}`}
            >
              {PRIORITY_BADGES[node.priority].label}
            </span>
          )}

          {node.progress !== undefined && (
            <button
              type="button"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation();
                onCycleProgress(node.id);
              }}
              title={`Progreso: ${node.progress}% (clic para avanzar)`}
              className="shrink-0 hover:scale-110 transition-transform"
            >
              {renderProgressRing(node.progress)}
            </button>
          )}

          {/* Bloque de texto editable o líneas exactas */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={draftText}
                rows={Math.max(1, (node.lines || [node.text]).length)}
                onChange={e => setDraftText(e.target.value)}
                onBlur={saveEdit}
                onPointerDown={e => e.stopPropagation()}
                onKeyDown={e => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                  } else if (e.key === 'Escape') {
                    setDraftText(node.text);
                    setIsEditing(false);
                  }
                }}
                style={{
                  fontSize: `${isSmallScreen ? Math.max(16, typo.fontSize) : typo.fontSize}px`,
                  fontWeight: typo.fontWeight,
                  lineHeight: `${typo.lineHeight}px`,
                  color: textColor,
                }}
                className="w-full bg-transparent resize-none outline-none border-b border-orange-400 p-0 m-0 text-inherit"
              />
            ) : (
              <div
                style={{
                  fontSize: `${typo.fontSize}px`,
                  fontWeight: typo.fontWeight,
                  lineHeight: `${typo.lineHeight}px`,
                }}
                className="whitespace-pre-wrap break-words"
              >
                {node.lines && node.lines.length > 0
                  ? node.lines.join('\n')
                  : node.text}
              </div>
            )}

            {node.subtitle && !isEditing && isRoot && (
              <div
                style={{
                  color: 'rgba(255,255,255,0.86)',
                }}
                className="text-[11px] font-medium leading-snug mt-0.5 break-words"
              >
                {node.subtitle}
              </div>
            )}
          </div>

          {/* Micro-indicadores de Notas e Hipervínculo */}
          {(node.notes || node.hyperlink) && !isEditing && (
            <div className="flex items-center gap-1 shrink-0 ml-0.5">
              {node.notes && (
                <button
                  type="button"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    onOpenNotes(node.id);
                  }}
                  title={node.notes}
                  className={`p-1 rounded transition-opacity opacity-80 hover:opacity-100 ${
                    isRoot ? 'text-white' : 'text-stone-500'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              )}
              {node.hyperlink && (
                <a
                  href={node.hyperlink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  title={node.hyperlink}
                  className={`p-1 rounded transition-opacity opacity-80 hover:opacity-100 ${
                    isRoot ? 'text-white' : 'text-blue-600'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botón EdrawMax para Contraer / Expandir subramas (+N / −) */}
      {hasChildren && !isConnectMode && (
        <button
          type="button"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            onToggleCollapse(node.id);
          }}
          title={
            node.collapsed
              ? `Expandir ${descendantCount} subtemas`
              : 'Contraer subrama'
          }
          style={{
            backgroundColor: node.collapsed ? branchColor : '#FFFFFF',
            borderColor: branchColor,
            color: node.collapsed ? '#FFFFFF' : branchColor,
            ...(portDirection === 'right'
              ? { right: '-14px', top: '50%', transform: 'translateY(-50%)' }
              : portDirection === 'left'
              ? { left: '-14px', top: '50%', transform: 'translateY(-50%)' }
              : portDirection === 'bottom'
              ? { bottom: '-14px', left: '50%', transform: 'translateX(-50%)' }
              : { top: '-14px', left: '50%', transform: 'translateX(-50%)' }),
          }}
          className={`absolute z-30 min-w-[22px] h-[22px] px-1 rounded-full border-2 text-[10px] font-bold flex items-center justify-center shadow-sm transition-opacity ${
            node.collapsed || isSelected
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {node.collapsed ? `+${descendantCount}` : '−'}
        </button>
      )}

      {/* Botón rápido '+' al seleccionar o pasar el cursor en hojas sin hijos */}
      {!hasChildren && !isConnectMode && !isEditing && (
        <button
          type="button"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            onAddChild(node.id);
          }}
          title="Añadir subtema (Tab)"
          style={{
            borderColor: branchColor,
            color: branchColor,
            ...(portDirection === 'right'
              ? { right: '-13px', top: '50%', transform: 'translateY(-50%)' }
              : portDirection === 'left'
              ? { left: '-13px', top: '50%', transform: 'translateY(-50%)' }
              : portDirection === 'bottom'
              ? { bottom: '-13px', left: '50%', transform: 'translateX(-50%)' }
              : { top: '-13px', left: '50%', transform: 'translateX(-50%)' }),
          }}
          className={`absolute z-30 w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-white border-2 flex items-center justify-center shadow-sm hover:scale-110 transition-all ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Plus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
        </button>
      )}
    </div>
  );
};
