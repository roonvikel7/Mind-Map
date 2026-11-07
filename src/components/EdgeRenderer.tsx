import React from 'react';
import { SceneVectorGeometry } from '../utils/geometry';
import { Pencil, Trash2 } from 'lucide-react';

interface EdgeRendererProps {
  scene: SceneVectorGeometry;
  selectedEdgeId: string | null;
  onSelectEdge: (edgeId: string | null) => void;
  onEditEdgeLabel: (edgeId: string, currentLabel: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  connectingFrom?: { x: number; y: number } | null;
  mouseWorldPos?: { x: number; y: number } | null;
}

export const EdgeRenderer: React.FC<EdgeRendererProps> = ({
  scene,
  selectedEdgeId,
  onSelectEdge,
  onEditEdgeLabel,
  onDeleteEdge,
  connectingFrom,
  mouseWorldPos,
}) => {
  return (
    <svg
      width="1"
      height="1"
      viewBox="0 0 1 1"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {/* Conectores estructurales, llaves sinópticas, espinas Ishikawa y relaciones cruzadas */}
      {scene.paths.map(p => {
        const isSelected = Boolean(p.edgeId && selectedEdgeId === p.edgeId);

        return (
          <g key={p.id}>
            {/* Zona invisible ancha para facilitar toque y clic en relaciones y conectores */}
            {p.edgeId && (
              <path
                d={p.d}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onPointerDown={e => {
                  e.stopPropagation();
                }}
                onClick={e => {
                  e.stopPropagation();
                  if (isSelected) {
                    onEditEdgeLabel(p.edgeId!, p.label || '');
                  } else {
                    onSelectEdge(p.edgeId!);
                  }
                }}
                onDoubleClick={e => {
                  e.stopPropagation();
                  onEditEdgeLabel(p.edgeId!, p.label || '');
                }}
              />
            )}

            {p.kind === 'fill' ? (
              <path
                d={p.d}
                fill={p.color}
                opacity={isSelected ? 1 : 0.92}
              />
            ) : p.kind === 'dashed' ? (
              <path
                d={p.d}
                fill="none"
                stroke={isSelected ? '#EA580C' : p.color}
                strokeWidth={isSelected ? 3 : p.strokeWidth || 2.1}
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            ) : (
              <path
                d={p.d}
                fill="none"
                stroke={isSelected ? '#EA580C' : p.color}
                strokeWidth={isSelected ? (p.strokeWidth || 2.2) + 0.9 : p.strokeWidth || 2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Punta de flecha vectorial exacta */}
            {p.arrowEnd && (
              <polygon
                points="0,0 -10.5,-4.8 -8.4,0 -10.5,4.8"
                fill={isSelected ? '#EA580C' : p.arrowEnd.color}
                transform={`translate(${p.arrowEnd.x}, ${p.arrowEnd.y}) rotate(${p.arrowEnd.angleDeg})`}
              />
            )}

            {/* Píldora de proposición / etiqueta de relación editable */}
            {(p.label || (isSelected && p.edgeId)) &&
              p.labelX !== undefined &&
              p.labelY !== undefined && (
                <foreignObject
                  x={p.labelX - 105}
                  y={p.labelY - 17}
                  width={210}
                  height={34}
                  style={{ overflow: 'visible', pointerEvents: 'none' }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div
                      style={{ pointerEvents: 'auto' }}
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation();
                        if (!p.edgeId) return;
                        if (isSelected) {
                          onEditEdgeLabel(p.edgeId, p.label || '');
                        } else {
                          onSelectEdge(p.edgeId);
                        }
                      }}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        if (p.edgeId) onEditEdgeLabel(p.edgeId, p.label || '');
                      }}
                      title="Toca o haz doble clic para editar etiqueta"
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-sm transition-all cursor-pointer select-none whitespace-nowrap ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 text-orange-800 ring-2 ring-orange-200'
                          : p.isCrossLink
                          ? 'bg-amber-50/95 border-amber-400 text-amber-800 hover:bg-amber-100'
                          : 'bg-white/95 border-stone-300 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      <span>{p.label || '+ Etiqueta'}</span>
                      {isSelected && p.edgeId && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onEditEdgeLabel(p.edgeId!, p.label || '');
                          }}
                          title="Editar etiqueta"
                          className="ml-0.5 p-0.5 rounded-full hover:bg-orange-200/70 text-orange-700"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {isSelected && p.isCrossLink && p.edgeId && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteEdge(p.edgeId!);
                          }}
                          title="Eliminar relación cruzada"
                          className="p-0.5 rounded-full hover:bg-red-100 text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </foreignObject>
              )}
          </g>
        );
      })}

      {/* Hitos numerados sobre el eje de la Línea de Tiempo */}
      {scene.timelineBadges.map(b => (
        <g key={b.id}>
          <circle
            cx={b.x}
            cy={b.y}
            r={14}
            fill={b.color}
            stroke="#FFFFFF"
            strokeWidth={2.5}
          />
          <text
            x={b.x}
            y={b.y + 4}
            textAnchor="middle"
            fontSize={11.5}
            fontWeight={700}
            fill="#FFFFFF"
          >
            {b.index}
          </text>
        </g>
      ))}

      {/* Línea interactiva en vivo al crear una Relación Cruzada */}
      {connectingFrom && mouseWorldPos && (
        <g>
          <line
            x1={connectingFrom.x}
            y1={connectingFrom.y}
            x2={mouseWorldPos.x}
            y2={mouseWorldPos.y}
            stroke="#EA580C"
            strokeWidth={2.4}
            strokeDasharray="6 4"
          />
          <circle cx={mouseWorldPos.x} cy={mouseWorldPos.y} r={5} fill="#EA580C" />
        </g>
      )}
    </svg>
  );
};
