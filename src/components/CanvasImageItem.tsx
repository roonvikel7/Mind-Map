import React from 'react';
import { Lock, Trash2, Unlock } from 'lucide-react';
import type { CanvasImage } from '../types/organizer';

interface CanvasImageItemProps {
  image: CanvasImage;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onStartDrag: (id: string, e: React.MouseEvent) => void;
  onStartResize: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string) => void;
}

export const CanvasImageItem: React.FC<CanvasImageItemProps> = ({
  image,
  isSelected,
  onSelect,
  onStartDrag,
  onStartResize,
  onDelete,
  onToggleLock,
}) => {
  const left = image.x - image.width / 2;
  const top = image.y - image.height / 2;
  const borderRadius = image.borderRadius ?? 10;
  const opacity = image.opacity ?? 1;

  return (
    <div
      style={{
        transform: `translate3d(${left}px, ${top}px, 0)`,
        width: `${image.width}px`,
        height: `${image.height}px`,
        opacity,
      }}
      className={`group absolute top-0 left-0 select-none will-change-transform ${
        image.locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      }`}
      onClick={e => {
        e.stopPropagation();
        onSelect(image.id);
      }}
      onMouseDown={e => {
        // Si no se hizo clic en un botón o en el manipulador de redimensión
        if ((e.target as HTMLElement).closest('.img-control-btn')) return;
        if ((e.target as HTMLElement).closest('.img-resize-handle')) return;
        e.stopPropagation();
        onSelect(image.id);
        if (!image.locked && e.button === 0) {
          onStartDrag(image.id, e);
        }
      }}
    >
      {/* Contenedor visual de la imagen con esquinas redondeadas y marco sutil */}
      <div
        style={{ borderRadius: `${borderRadius}px` }}
        className={`w-full h-full overflow-hidden bg-white shadow-md transition-shadow duration-150 ${
          isSelected
            ? 'ring-2 ring-orange-500 ring-offset-2 shadow-xl'
            : 'border border-stone-200/80 hover:shadow-lg'
        }`}
      >
        <img
          src={image.url}
          alt={image.title || 'Imagen de mapa'}
          draggable={false}
          className="w-full h-full object-cover pointer-events-none select-none"
        />
      </div>

      {/* Barra de herramientas flotante superior al seleccionar o pasar el cursor */}
      {(isSelected || image.locked) && (
        <div
          onMouseDown={e => e.stopPropagation()}
          className="img-control-btn absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-xl bg-stone-900/90 backdrop-blur-md text-white text-[11px] shadow-lg pointer-events-auto z-20"
        >
          {image.title && (
            <span className="max-w-[120px] truncate px-1 text-stone-300 font-medium">
              {image.title}
            </span>
          )}

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onToggleLock(image.id);
            }}
            title={image.locked ? 'Desbloquear imagen' : 'Bloquear posición'}
            className={`p-1 rounded-lg transition-colors ${
              image.locked
                ? 'bg-amber-500 text-stone-900 font-bold'
                : 'hover:bg-white/20 text-stone-200'
            }`}
          >
            {image.locked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
          </button>

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onDelete(image.id);
            }}
            title="Eliminar imagen del lienzo (Supr)"
            className="p-1 rounded-lg hover:bg-red-500 text-stone-200 hover:text-white transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Indicador de imagen bloqueada cuando no está seleccionada */}
      {image.locked && !isSelected && (
        <div className="absolute top-2 right-2 p-1 rounded-md bg-stone-900/70 text-amber-300 shadow">
          <Lock className="w-3 h-3" />
        </div>
      )}

      {/* Manipulador de redimensión en la esquina inferior derecha */}
      {isSelected && !image.locked && (
        <div
          onMouseDown={e => {
            e.stopPropagation();
            onStartResize(image.id, e);
          }}
          title="Arrastrar para redimensionar imagen"
          className="img-resize-handle absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-md bg-orange-600 border-2 border-white shadow-md cursor-se-resize hover:scale-125 transition-transform z-20"
        />
      )}
    </div>
  );
};
