import React from 'react';
import type { OrganizerType, ThemeId } from '../types/organizer';
import { EDRAW_THEMES } from '../utils/themes';

interface TemplateThumbnailProps {
  type: OrganizerType;
  theme: ThemeId;
  title: string;
}

export const TemplateThumbnail: React.FC<TemplateThumbnailProps> = ({
  type,
  theme,
}) => {
  const themeObj = EDRAW_THEMES[theme] || EDRAW_THEMES['vitality-warm'];
  const palette = themeObj.palette;
  const c0 = palette[0] || '#EA580C';
  const c1 = palette[1] || '#2563EB';
  const c2 = palette[2] || '#059669';
  const c3 = palette[3] || '#D97706';
  const c4 = palette[4] || '#7C3AED';
  const c5 = palette[5] || '#0891B2';
  const c6 = palette[6] || '#DB2777';
  const c7 = palette[7] || '#65A30D';

  return (
    <div className="w-full h-28 rounded-xl overflow-hidden border border-stone-200/80 bg-[#FCFBF8] relative flex items-center justify-center select-none shadow-inner">
      {/* Patrón de puntos sutil de fondo */}
      <svg
        className="w-full h-full"
        viewBox="0 0 360 140"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id={`dot-grid-${type}-${theme}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.85" fill="#E7E5E4" />
          </pattern>
          <filter id={`shadow-${type}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#1C1917" floodOpacity="0.08" />
          </filter>
        </defs>

        <rect width="360" height="140" fill={`url(#dot-grid-${type}-${theme})`} />

        {/* 1. CARTOGRAFÍA CONCEPTUAL (8 EJES DE TOBÓN) */}
        {type === 'cartographic' && (
          <g>
            {/* Conectores radiales a los 8 ejes */}
            <path d="M 180 56 L 180 28" stroke={c0} strokeWidth="2" strokeLinecap="round" />
            <path d="M 230 65 Q 260 45 285 32" fill="none" stroke={c1} strokeWidth="1.8" />
            <path d="M 230 70 Q 265 65 295 62" fill="none" stroke={c2} strokeWidth="1.8" />
            <path d="M 230 75 Q 265 85 295 90" fill="none" stroke={c3} strokeWidth="1.8" />
            <path d="M 230 80 Q 260 105 285 116" fill="none" stroke={c4} strokeWidth="1.8" />
            <path d="M 180 88 L 180 114" stroke={c5} strokeWidth="2" strokeLinecap="round" />
            <path d="M 130 80 Q 95 105 70 108" fill="none" stroke={c6} strokeWidth="1.8" />
            <path d="M 130 65 Q 95 45 70 42" fill="none" stroke={c7} strokeWidth="1.8" />

            {/* Nodo Raíz Central */}
            <rect x="125" y="56" width="110" height="32" rx="10" fill={themeObj.rootBg} filter={`url(#shadow-${type})`} />
            <text x="180" y="76" textAnchor="middle" fill={themeObj.rootText} fontSize="10.5" fontWeight="800">
              Tema Central
            </text>

            {/* 8 Nodos Periféricos Numerados */}
            {/* 1. Top */}
            <rect x="145" y="14" width="70" height="18" rx="6" fill="#FFFFFF" stroke={c0} strokeWidth="1.5" />
            <text x="180" y="27" textAnchor="middle" fill={c0} fontSize="8" fontWeight="700">1. Ejemplo</text>

            {/* 2. Top-Right */}
            <rect x="260" y="22" width="68" height="18" rx="6" fill="#FFFFFF" stroke={c1} strokeWidth="1.5" />
            <text x="294" y="35" textAnchor="middle" fill={c1} fontSize="8" fontWeight="700">2. Noción</text>

            {/* 3. Mid-Right */}
            <rect x="265" y="52" width="76" height="18" rx="6" fill="#FFFFFF" stroke={c2} strokeWidth="1.5" />
            <text x="303" y="65" textAnchor="middle" fill={c2} fontSize="8" fontWeight="700">3. Categoría</text>

            {/* 4. Mid2-Right */}
            <rect x="265" y="80" width="72" height="18" rx="6" fill="#FFFFFF" stroke={c3} strokeWidth="1.5" />
            <text x="301" y="93" textAnchor="middle" fill={c3} fontSize="8" fontWeight="700">4. Característica</text>

            {/* 5. Bottom-Right */}
            <rect x="255" y="108" width="66" height="18" rx="6" fill="#FFFFFF" stroke={c4} strokeWidth="1.5" />
            <text x="288" y="121" textAnchor="middle" fill={c4} fontSize="8" fontWeight="700">5. Diferencias</text>

            {/* 6. Bottom */}
            <rect x="145" y="112" width="70" height="18" rx="6" fill="#FFFFFF" stroke={c5} strokeWidth="1.5" />
            <text x="180" y="125" textAnchor="middle" fill={c5} fontSize="8" fontWeight="700">6. Subdivisión</text>

            {/* 7. Bottom-Left */}
            <rect x="35" y="98" width="70" height="18" rx="6" fill="#FFFFFF" stroke={c6} strokeWidth="1.5" />
            <text x="70" y="111" textAnchor="middle" fill={c6} fontSize="8" fontWeight="700">7. Vinculación</text>

            {/* 8. Top-Left */}
            <rect x="35" y="32" width="70" height="18" rx="6" fill="#FFFFFF" stroke={c7} strokeWidth="1.5" />
            <text x="70" y="45" textAnchor="middle" fill={c7} fontSize="8" fontWeight="700">8. Metodología</text>
          </g>
        )}

        {/* 2. MAPA MENTAL RADIAL */}
        {type === 'mindmap' && (
          <g>
            {/* Ramas orgánicas cónicas izquierda y derecha */}
            <path d="M 180 70 C 215 70, 235 40, 275 38" fill="none" stroke={c0} strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 275 38 Q 295 36 315 28" fill="none" stroke={c0} strokeWidth="1.6" />
            <path d="M 275 38 Q 295 44 315 50" fill="none" stroke={c0} strokeWidth="1.6" />

            <path d="M 180 70 C 215 70, 235 100, 275 102" fill="none" stroke={c1} strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 275 102 Q 295 96 315 90" fill="none" stroke={c1} strokeWidth="1.6" />
            <path d="M 275 102 Q 295 108 315 114" fill="none" stroke={c1} strokeWidth="1.6" />

            <path d="M 180 70 C 145 70, 125 40, 85 38" fill="none" stroke={c2} strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 85 38 Q 65 36 45 28" fill="none" stroke={c2} strokeWidth="1.6" />
            <path d="M 85 38 Q 65 44 45 50" fill="none" stroke={c2} strokeWidth="1.6" />

            <path d="M 180 70 C 145 70, 125 100, 85 102" fill="none" stroke={c3} strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 85 102 Q 65 96 45 90" fill="none" stroke={c3} strokeWidth="1.6" />
            <path d="M 85 102 Q 65 108 45 114" fill="none" stroke={c3} strokeWidth="1.6" />

            {/* Tarjetas de rama */}
            <rect x="245" y="28" width="62" height="20" rx="8" fill="#FFFFFF" stroke={c0} strokeWidth="1.6" filter={`url(#shadow-${type})`} />
            <text x="276" y="42" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Objetivos</text>

            <rect x="245" y="92" width="62" height="20" rx="8" fill="#FFFFFF" stroke={c1} strokeWidth="1.6" filter={`url(#shadow-${type})`} />
            <text x="276" y="106" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Métricas</text>

            <rect x="52" y="28" width="62" height="20" rx="8" fill="#FFFFFF" stroke={c2} strokeWidth="1.6" filter={`url(#shadow-${type})`} />
            <text x="83" y="42" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Hipótesis</text>

            <rect x="52" y="92" width="62" height="20" rx="8" fill="#FFFFFF" stroke={c3} strokeWidth="1.6" filter={`url(#shadow-${type})`} />
            <text x="83" y="106" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Recursos</text>

            {/* Raíz Central */}
            <rect x="135" y="53" width="90" height="34" rx="12" fill={themeObj.rootBg} filter={`url(#shadow-${type})`} />
            <text x="180" y="74" textAnchor="middle" fill={themeObj.rootText} fontSize="10.5" fontWeight="800">
              Idea Central
            </text>
          </g>
        )}

        {/* 3. MAPA LÓGICO DERECHO */}
        {type === 'logic' && (
          <g>
            {/* Raíz Izquierda */}
            <rect x="25" y="53" width="80" height="34" rx="10" fill={themeObj.rootBg} filter={`url(#shadow-${type})`} />
            <text x="65" y="74" textAnchor="middle" fill={themeObj.rootText} fontSize="10" fontWeight="800">
              Proyecto
            </text>

            {/* Conectores hacia la derecha */}
            <path d="M 105 70 C 130 70, 140 35, 165 35" fill="none" stroke={c0} strokeWidth="2" />
            <line x1="165" y1="35" x2="245" y2="35" stroke={c0} strokeWidth="2.2" />

            <path d="M 105 70 L 165 70" fill="none" stroke={c1} strokeWidth="2" />
            <line x1="165" y1="70" x2="245" y2="70" stroke={c1} strokeWidth="2.2" />

            <path d="M 105 70 C 130 70, 140 105, 165 105" fill="none" stroke={c2} strokeWidth="2" />
            <line x1="165" y1="105" x2="245" y2="105" stroke={c2} strokeWidth="2.2" />

            {/* Nivel 1 */}
            <text x="175" y="30" fill="#1C1917" fontSize="9" fontWeight="700">1. Arquitectura</text>
            <text x="175" y="65" fill="#1C1917" fontSize="9" fontWeight="700">2. Desarrollo</text>
            <text x="175" y="100" fill="#1C1917" fontSize="9" fontWeight="700">3. Lanzamiento</text>

            {/* Sub-ramas Nivel 2 */}
            <line x1="245" y1="35" x2="265" y2="24" stroke={c0} strokeWidth="1.5" />
            <line x1="265" y1="24" x2="330" y2="24" stroke={c0} strokeWidth="1.5" />
            <text x="270" y="20" fill="#78716C" fontSize="8">Base de datos</text>

            <line x1="245" y1="70" x2="265" y2="70" stroke={c1} strokeWidth="1.5" />
            <line x1="265" y1="70" x2="330" y2="70" stroke={c1} strokeWidth="1.5" />
            <text x="270" y="66" fill="#78716C" fontSize="8">API Frontend</text>

            <line x1="245" y1="105" x2="265" y2="114" stroke={c2} strokeWidth="1.5" />
            <line x1="265" y1="114" x2="330" y2="114" stroke={c2} strokeWidth="1.5" />
            <text x="270" y="110" fill="#78716C" fontSize="8">Marketing</text>
          </g>
        )}

        {/* 4. CUADRO SINÓPTICO DE LLAVES */}
        {type === 'synoptic' && (
          <g>
            {/* Raíz Izquierda */}
            <rect x="20" y="52" width="78" height="36" rx="8" fill={themeObj.rootBg} filter={`url(#shadow-${type})`} />
            <text x="59" y="74" textAnchor="middle" fill={themeObj.rootText} fontSize="9.5" fontWeight="800">
              Categoría
            </text>

            {/* Llave caligráfica principal { */}
            <path
              d="M 106 32 C 114 32, 117 48, 117 62 C 117 68, 122 70, 126 70 C 122 70, 117 72, 117 78 C 117 92, 114 108, 106 108"
              fill="none"
              stroke="#EA580C"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* 3 Filas Centrales */}
            <rect x="135" y="24" width="75" height="20" rx="6" fill="#FFFFFF" stroke="#D6D3D1" strokeWidth="1.2" />
            <text x="172" y="38" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Género Lírico</text>

            <rect x="135" y="60" width="75" height="20" rx="6" fill="#FFFFFF" stroke="#D6D3D1" strokeWidth="1.2" />
            <text x="172" y="74" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Narrativo</text>

            <rect x="135" y="96" width="75" height="20" rx="6" fill="#FFFFFF" stroke="#D6D3D1" strokeWidth="1.2" />
            <text x="172" y="110" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Dramático</text>

            {/* Llaves secundarias más pequeñas */}
            <path
              d="M 216 20 C 221 20, 224 28, 224 34 C 224 36, 227 37, 229 37 C 227 37, 224 38, 224 40 C 224 46, 221 54, 216 54"
              fill="none"
              stroke="#2563EB"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <text x="238" y="28" fill="#57534E" fontSize="8">• Oda, Himno</text>
            <text x="238" y="46" fill="#57534E" fontSize="8">• Soneto, Elegía</text>

            <path
              d="M 216 56 C 221 56, 224 64, 224 70 C 224 72, 227 73, 229 73 C 227 73, 224 74, 224 76 C 224 82, 221 90, 216 90"
              fill="none"
              stroke="#059669"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <text x="238" y="66" fill="#57534E" fontSize="8">• Novela, Cuento</text>
            <text x="238" y="84" fill="#57534E" fontSize="8">• Crónica, Mito</text>
          </g>
        )}

        {/* 5. DIAGRAMA ISHIKAWA (ESPINA DE PESCADO) */}
        {type === 'fishbone' && (
          <g>
            {/* Espina dorsal horizontal */}
            <line x1="30" y1="70" x2="280" y2="70" stroke="#44403C" strokeWidth="3.2" strokeLinecap="round" />
            <polygon points="280,66 288,70 280,74" fill="#44403C" />

            {/* Cabeza del pez (Efecto Principal) */}
            <polygon points="288,70 338,48 338,92" fill={themeObj.rootBg} stroke="#C2410C" strokeWidth="1.5" />
            <text x="314" y="73" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800">
              Efecto
            </text>

            {/* Espinas inclinadas superiores a 55° */}
            <line x1="100" y1="70" x2="60" y2="24" stroke={c0} strokeWidth="2.2" strokeLinecap="round" />
            <rect x="25" y="14" width="60" height="16" rx="5" fill="#FFFFFF" stroke={c0} strokeWidth="1.3" />
            <text x="55" y="25" textAnchor="middle" fill={c0} fontSize="7.5" fontWeight="700">Métodos</text>
            <line x1="72" y1="46" x2="115" y2="46" stroke={c0} strokeWidth="1.4" />
            <text x="94" y="42" textAnchor="middle" fill="#57534E" fontSize="7">Sin manual</text>

            <line x1="200" y1="70" x2="160" y2="24" stroke={c1} strokeWidth="2.2" strokeLinecap="round" />
            <rect x="125" y="14" width="60" height="16" rx="5" fill="#FFFFFF" stroke={c1} strokeWidth="1.3" />
            <text x="155" y="25" textAnchor="middle" fill={c1} fontSize="7.5" fontWeight="700">Personas</text>
            <line x1="172" y1="46" x2="215" y2="46" stroke={c1} strokeWidth="1.4" />
            <text x="194" y="42" textAnchor="middle" fill="#57534E" fontSize="7">Fatiga</text>

            {/* Espinas inclinadas inferiores a 55° */}
            <line x1="100" y1="70" x2="60" y2="116" stroke={c2} strokeWidth="2.2" strokeLinecap="round" />
            <rect x="25" y="110" width="60" height="16" rx="5" fill="#FFFFFF" stroke={c2} strokeWidth="1.3" />
            <text x="55" y="122" textAnchor="middle" fill={c2} fontSize="7.5" fontWeight="700">Máquinas</text>
            <line x1="72" y1="94" x2="115" y2="94" stroke={c2} strokeWidth="1.4" />
            <text x="94" y="90" textAnchor="middle" fill="#57534E" fontSize="7">Falla de red</text>

            <line x1="200" y1="70" x2="160" y2="116" stroke={c3} strokeWidth="2.2" strokeLinecap="round" />
            <rect x="125" y="110" width="60" height="16" rx="5" fill="#FFFFFF" stroke={c3} strokeWidth="1.3" />
            <text x="155" y="122" textAnchor="middle" fill={c3} fontSize="7.5" fontWeight="700">Materiales</text>
            <line x1="172" y1="94" x2="215" y2="94" stroke={c3} strokeWidth="1.4" />
            <text x="194" y="90" textAnchor="middle" fill="#57534E" fontSize="7">Desactualizado</text>
          </g>
        )}

        {/* 6. MAPA CONCEPTUAL DE NOVAK */}
        {type === 'concept' && (
          <g>
            {/* Raíz Superior */}
            <rect x="135" y="16" width="90" height="26" rx="7" fill={themeObj.rootBg} filter={`url(#shadow-${type})`} />
            <text x="180" y="33" textAnchor="middle" fill={themeObj.rootText} fontSize="9.5" fontWeight="800">
              Fotosíntesis
            </text>

            {/* Conectores con flechas y proposiciones separadas */}
            {/* Rama Izquierda */}
            <path d="M 160 42 C 145 65, 85 75, 75 96" fill="none" stroke={c0} strokeWidth="1.8" />
            <polygon points="75,98 72,90 79,92" fill={c0} />
            <rect x="90" y="60" width="55" height="14" rx="7" fill="#FFFFFF" stroke="#D6D3D1" strokeWidth="1" />
            <text x="117" y="70" textAnchor="middle" fill="#44403C" fontSize="7" fontWeight="600">requiere de</text>
            <rect x="35" y="100" width="80" height="24" rx="6" fill="#FFFFFF" stroke={c0} strokeWidth="1.5" />
            <text x="75" y="115" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Luz Solar</text>

            {/* Rama Central */}
            <path d="M 180 42 L 180 96" fill="none" stroke={c1} strokeWidth="1.8" />
            <polygon points="180,98 177,90 183,90" fill={c1} />
            <rect x="153" y="60" width="54" height="14" rx="7" fill="#FFFFFF" stroke="#D6D3D1" strokeWidth="1" />
            <text x="180" y="70" textAnchor="middle" fill="#44403C" fontSize="7" fontWeight="600">produce</text>
            <rect x="140" y="100" width="80" height="24" rx="6" fill="#FFFFFF" stroke={c1} strokeWidth="1.5" />
            <text x="180" y="115" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Glucosa</text>

            {/* Rama Derecha */}
            <path d="M 200 42 C 215 65, 275 75, 285 96" fill="none" stroke={c2} strokeWidth="1.8" />
            <polygon points="285,98 281,92 288,90" fill={c2} />
            <rect x="215" y="60" width="55" height="14" rx="7" fill="#FFFFFF" stroke="#D6D3D1" strokeWidth="1" />
            <text x="242" y="70" textAnchor="middle" fill="#44403C" fontSize="7" fontWeight="600">libera al aire</text>
            <rect x="245" y="100" width="80" height="24" rx="6" fill="#FFFFFF" stroke={c2} strokeWidth="1.5" />
            <text x="285" y="115" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Oxígeno</text>
          </g>
        )}

        {/* 7. ORGANIGRAMA JERÁRQUICO */}
        {type === 'tree' && (
          <g>
            {/* Raíz Dirección General */}
            <rect x="135" y="14" width="90" height="28" rx="8" fill={themeObj.rootBg} filter={`url(#shadow-${type})`} />
            <text x="180" y="32" textAnchor="middle" fill={themeObj.rootText} fontSize="9.5" fontWeight="800">
              Dirección CEO
            </text>

            {/* Bus ortogonal */}
            <line x1="180" y1="42" x2="180" y2="60" stroke="#78716C" strokeWidth="2" />
            <line x1="75" y1="60" x2="285" y2="60" stroke="#78716C" strokeWidth="2" />

            <line x1="75" y1="60" x2="75" y2="78" stroke="#78716C" strokeWidth="2" />
            <line x1="180" y1="60" x2="180" y2="78" stroke="#78716C" strokeWidth="2" />
            <line x1="285" y1="60" x2="285" y2="78" stroke="#78716C" strokeWidth="2" />

            {/* 3 Departamentos */}
            <rect x="35" y="78" width="80" height="42" rx="7" fill="#FFFFFF" stroke={c0} strokeWidth="1.6" filter={`url(#shadow-${type})`} />
            <text x="75" y="94" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Ingeniería</text>
            <text x="75" y="108" textAnchor="middle" fill="#78716C" fontSize="7.5">CTO & Devs</text>

            <rect x="140" y="78" width="80" height="42" rx="7" fill="#FFFFFF" stroke={c1} strokeWidth="1.6" filter={`url(#shadow-${type})`} />
            <text x="180" y="94" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Diseño</text>
            <text x="180" y="108" textAnchor="middle" fill="#78716C" fontSize="7.5">UX/UI Leads</text>

            <rect x="245" y="78" width="80" height="42" rx="7" fill="#FFFFFF" stroke={c2} strokeWidth="1.6" filter={`url(#shadow-${type})`} />
            <text x="285" y="94" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="700">Marketing</text>
            <text x="285" y="108" textAnchor="middle" fill="#78716C" fontSize="7.5">Growth & Ads</text>
          </g>
        )}

        {/* 8. DIAGRAMA DE FLUJO */}
        {type === 'flowchart' && (
          <g>
            {/* Inicio (Píldora) */}
            <rect x="50" y="56" width="56" height="26" rx="13" fill="#10B981" />
            <text x="78" y="72" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">Inicio</text>
            <line x1="106" y1="69" x2="135" y2="69" stroke="#57534E" strokeWidth="2" markerEnd="url(#arrow)" />
            <polygon points="135,69 128,66 128,72" fill="#57534E" />

            {/* Proceso (Rectángulo) */}
            <rect x="138" y="55" width="62" height="28" rx="5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="1.8" />
            <text x="169" y="72" textAnchor="middle" fill="#1C1917" fontSize="7.5" fontWeight="700">Validar Datos</text>
            <line x1="200" y1="69" x2="225" y2="69" stroke="#57534E" strokeWidth="2" />
            <polygon points="225,69 218,66 218,72" fill="#57534E" />

            {/* Decisión (Rombo) */}
            <polygon points="245,52 265,69 245,86 225,69" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.8" />
            <text x="245" y="72" textAnchor="middle" fill="#92400E" fontSize="7.5" fontWeight="800">¿Válido?</text>

            {/* Rama Sí (hacia la derecha -> Fin éxito) */}
            <line x1="265" y1="69" x2="300" y2="69" stroke="#57534E" strokeWidth="2" />
            <polygon points="300,69 293,66 293,72" fill="#57534E" />
            <text x="282" y="63" textAnchor="middle" fill="#059669" fontSize="7.5" fontWeight="800">Sí</text>
            <rect x="302" y="56" width="46" height="26" rx="13" fill="#3B82F6" />
            <text x="325" y="72" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">Fin</text>

            {/* Rama No (hacia abajo -> Corrección) */}
            <line x1="245" y1="86" x2="245" y2="108" stroke="#57534E" strokeWidth="2" />
            <polygon points="245,108 242,101 248,101" fill="#57534E" />
            <text x="253" y="100" textAnchor="start" fill="#DC2626" fontSize="7.5" fontWeight="800">No</text>
            <rect x="215" y="110" width="60" height="20" rx="4" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
            <text x="245" y="123" textAnchor="middle" fill="#DC2626" fontSize="7" fontWeight="700">Reintentar</text>
          </g>
        )}

        {/* 9. LÍNEA DE TIEMPO */}
        {type === 'timeline' && (
          <g>
            {/* Eje horizontal */}
            <line x1="25" y1="70" x2="335" y2="70" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />

            {/* Hito 1: Arriba */}
            <circle cx="65" cy="70" r="9" fill={c0} stroke="#FFFFFF" strokeWidth="2" />
            <text x="65" y="73.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">1</text>
            <line x1="65" y1="61" x2="65" y2="44" stroke={c0} strokeWidth="1.5" strokeDasharray="2 2" />
            <rect x="30" y="20" width="70" height="24" rx="6" fill="#FFFFFF" stroke={c0} strokeWidth="1.4" />
            <text x="65" y="32" textAnchor="middle" fill="#1C1917" fontSize="7.5" fontWeight="700">Q1 Investigación</text>
            <text x="65" y="40" textAnchor="middle" fill="#78716C" fontSize="6.5">Enero 2026</text>

            {/* Hito 2: Abajo */}
            <circle cx="140" cy="70" r="9" fill={c1} stroke="#FFFFFF" strokeWidth="2" />
            <text x="140" y="73.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">2</text>
            <line x1="140" y1="79" x2="140" y2="96" stroke={c1} strokeWidth="1.5" strokeDasharray="2 2" />
            <rect x="105" y="96" width="70" height="24" rx="6" fill="#FFFFFF" stroke={c1} strokeWidth="1.4" />
            <text x="140" y="108" textAnchor="middle" fill="#1C1917" fontSize="7.5" fontWeight="700">Q2 Prototipo</text>
            <text x="140" y="116" textAnchor="middle" fill="#78716C" fontSize="6.5">Abril 2026</text>

            {/* Hito 3: Arriba */}
            <circle cx="215" cy="70" r="9" fill={c2} stroke="#FFFFFF" strokeWidth="2" />
            <text x="215" y="73.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">3</text>
            <line x1="215" y1="61" x2="215" y2="44" stroke={c2} strokeWidth="1.5" strokeDasharray="2 2" />
            <rect x="180" y="20" width="70" height="24" rx="6" fill="#FFFFFF" stroke={c2} strokeWidth="1.4" />
            <text x="215" y="32" textAnchor="middle" fill="#1C1917" fontSize="7.5" fontWeight="700">Q3 Beta Test</text>
            <text x="215" y="40" textAnchor="middle" fill="#78716C" fontSize="6.5">Julio 2026</text>

            {/* Hito 4: Abajo */}
            <circle cx="290" cy="70" r="9" fill={c3} stroke="#FFFFFF" strokeWidth="2" />
            <text x="290" y="73.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">4</text>
            <line x1="290" y1="79" x2="290" y2="96" stroke={c3} strokeWidth="1.5" strokeDasharray="2 2" />
            <rect x="255" y="96" width="70" height="24" rx="6" fill="#FFFFFF" stroke={c3} strokeWidth="1.4" />
            <text x="290" y="108" textAnchor="middle" fill="#1C1917" fontSize="7.5" fontWeight="700">Q4 Lanzamiento</text>
            <text x="290" y="116" textAnchor="middle" fill="#78716C" fontSize="6.5">Octubre 2026</text>
          </g>
        )}
      </svg>
    </div>
  );
};
