import type {
  OrganizerEdge,
  OrganizerNode,
  OrganizerProject,
  OrganizerType,
  ThemeId,
} from '../types/organizer';
import {
  generateOrganizer,
  buildAiImageUrl,
  getCartographicImageCaption,
} from './aiService';

export interface CartographicAxisDef {
  name: string;
  connector: string;
  childContent: string;
  icon?: string;
}

export const CARTOGRAPHIC_EIGHT_AXES: CartographicAxisDef[] = [
  {
    name: '1. Ejemplificación',
    connector: 'se ejemplifica mediante',
    childContent:
      'un caso documentado donde la teoría se aplicó con éxito para resolver una problemática real en su contexto',
    icon: '💡',
  },
  {
    name: '2. Noción',
    connector: 'se define como',
    childContent:
      'el significado etimológico y conceptual esencial que delimita con precisión el campo de acción del término',
    icon: '📖',
  },
  {
    name: '3. Categorización',
    connector: 'pertenece a',
    childContent:
      'la clase o disciplina mayor del conocimiento que engloba su estudio y fundamentación teórica',
    icon: '🗂️',
  },
  {
    name: '4. Caracterización',
    connector: 'se caracteriza por',
    childContent:
      'los rasgos distintivos y principios rectores que estructuran su funcionamiento y validez conceptual',
    icon: '✨',
  },
  {
    name: '5. Diferenciación',
    connector: 'se distingue de',
    childContent:
      'otros conceptos y nociones cercanas estableciendo fronteras claras para evitar confusiones epistemológicas',
    icon: '⚖️',
  },
  {
    name: '6. Subdivisión',
    connector: 'se subdivide en',
    childContent:
      'las tipologías, clases o componentes fundamentales que integran su estructura interna',
    icon: '🧩',
  },
  {
    name: '7. Vinculación',
    connector: 'se vincula con',
    childContent:
      'las leyes, modelos científicos y disciplinas complementarias que fortalecen su aplicación práctica',
    icon: '🔗',
  },
  {
    name: '8. Metodología',
    connector: 'se aplica mediante',
    childContent:
      'la secuencia ordenada de fases y procedimientos rigurosos para su implementación efectiva',
    icon: '🧭',
  },
];

export function buildCartographicProjectNodes(
  title: string,
  rootId?: string,
  existingRoot?: OrganizerNode
): { nodes: OrganizerNode[]; edges: OrganizerEdge[] } {
  const stamp = Date.now();
  const actualRootId = rootId || existingRoot?.id || `root-${stamp}`;

  const rootNode: OrganizerNode = {
    ...(existingRoot || {}),
    id: actualRootId,
    text: title.trim() || existingRoot?.text || 'Cartografía Conceptual',
    subtitle: 'Cartografía Conceptual de Ocho Ejes',
    x: 0,
    y: 0,
    width: Math.max(180, existingRoot?.width || 200),
    height: Math.max(56, existingRoot?.height || 60),
    isRoot: true,
    depth: 0,
    icon: existingRoot?.icon || '🧭',
  };

  const nodes: OrganizerNode[] = [rootNode];
  const edges: OrganizerEdge[] = [];

  CARTOGRAPHIC_EIGHT_AXES.forEach((axis, idx) => {
    const axisId = `axis-${actualRootId}-${idx + 1}`;
    const childId = `content-${actualRootId}-${idx + 1}`;
    const imgId = `img-${actualRootId}-${idx + 1}`;

    const axisNode: OrganizerNode = {
      id: axisId,
      parentId: actualRootId,
      text: axis.name,
      subtitle: undefined,
      x: 0,
      y: 0,
      width: 175,
      height: 52,
      depth: 1,
      icon: axis.icon,
    };

    const childNode: OrganizerNode = {
      id: childId,
      parentId: axisId,
      text: axis.childContent,
      subtitle: undefined,
      x: 0,
      y: 0,
      width: 185,
      height: 52,
      depth: 2,
    };

    const promptText = `${rootNode.text} ${axis.name} ${axis.childContent.slice(0, 50)} documentary photograph`;
    const imgNode: OrganizerNode = {
      id: imgId,
      parentId: childId,
      text: getCartographicImageCaption(axis.name),
      subtitle: undefined,
      x: 0,
      y: 0,
      width: 220,
      height: 148,
      depth: 3,
      isImageNode: true,
      imageUrl: buildAiImageUrl(promptText, (idx + 1) * 73 + 101),
      imagePrompt: promptText,
      shape: 'rounded',
    };

    nodes.push(axisNode, childNode, imgNode);

    edges.push({
      id: `edge-${actualRootId}-${axisId}`,
      from: actualRootId,
      to: axisId,
    });

    edges.push({
      id: `edge-${axisId}-${childId}`,
      from: axisId,
      to: childId,
      label: axis.connector,
    });

    edges.push({
      id: `edge-${childId}-${imgId}`,
      from: childId,
      to: imgId,
      label: 'se ilustra mediante',
    });
  });

  return { nodes, edges };
}

export function getDefaultTitleForType(type: OrganizerType): string {
  switch (type) {
    case 'concept':
      return 'Mapa Conceptual';
    case 'cartographic':
      return 'Cartografía Conceptual';
    case 'mindmap':
      return 'Idea Central';
    case 'logic':
      return 'Mapa Lógico';
    case 'synoptic':
      return 'Cuadro Sinóptico';
    case 'fishbone':
      return 'Diagrama de Ishikawa';
    case 'tree':
      return 'Organigrama Institucional';
    case 'flowchart':
      return 'Proceso de Gestión';
    case 'timeline':
      return 'Hoja de Ruta y Cronograma';
    case 'radial':
      return 'Núcleo Central';
    case 'matrix':
      return 'Matriz FODA';
    case 'cycle':
      return 'Ciclo de Mejora Continua';
    default:
      return 'Idea Central';
  }
}

export function buildStarterProjectNodes(
  type: OrganizerType,
  customTitle?: string,
  rootId?: string,
  existingRoot?: OrganizerNode
): { nodes: OrganizerNode[]; edges: OrganizerEdge[] } {
  const stamp = Date.now();
  const actualRootId = rootId || existingRoot?.id || `root-${stamp}`;
  const title = (customTitle && customTitle.trim()) || existingRoot?.text || getDefaultTitleForType(type);

  // 1. Cartografía Conceptual de 8 Ejes (Tobón)
  if (type === 'cartographic') {
    return buildCartographicProjectNodes(title, actualRootId, existingRoot);
  }

  // 2. Mapa Conceptual (Novak: Proposiciones, conceptos jerárquicos y conectores explícitos)
  if (type === 'concept') {
    const rootNode: OrganizerNode = {
      ...(existingRoot || {}),
      id: actualRootId,
      text: title,
      subtitle: 'Estructura Jerárquica Conceptual',
      x: 0,
      y: 0,
      width: Math.max(190, existingRoot?.width || 200),
      height: Math.max(56, existingRoot?.height || 60),
      isRoot: true,
      depth: 0,
      icon: existingRoot?.icon || '🕸️',
    };

    const concepts = [
      {
        id: `c1-${actualRootId}`,
        text: 'Concepto y Noción Fundamental',
        icon: '💡',
        connectorToChild: 'se define como',
        subtopics: [
          {
            id: `sub1-1-${actualRootId}`,
            text: 'Conjunto estructurado de conceptos vinculados mediante palabras de enlace claras',
            connector: 'comprende',
          },
          {
            id: `sub1-2-${actualRootId}`,
            text: 'Representación explícita de proposiciones con coherencia lógica y analítica',
            connector: 'generando',
          },
        ],
      },
      {
        id: `c2-${actualRootId}`,
        text: 'Estructura y Organización',
        icon: '🗂️',
        connectorToChild: 'se estructura en',
        subtopics: [
          {
            id: `sub2-1-${actualRootId}`,
            text: 'Niveles jerárquicos ordenados de mayor generalidad a mayor especificidad',
            connector: 'mediante',
          },
          {
            id: `sub2-2-${actualRootId}`,
            text: 'Enlaces cruzados que articulan dominios y disciplinas complementarias',
            connector: 'e integra',
          },
        ],
      },
      {
        id: `c3-${actualRootId}`,
        text: 'Propósito y Beneficios',
        icon: '🚀',
        connectorToChild: 'tiene como fin',
        subtopics: [
          {
            id: `sub3-1-${actualRootId}`,
            text: 'Estimular el aprendizaje significativo y la asimilación profunda de ideas',
            connector: 'para favorecer',
          },
          {
            id: `sub3-2-${actualRootId}`,
            text: 'Facilitar el pensamiento crítico y la síntesis analítica de contenidos',
            connector: 'optimizando',
          },
        ],
      },
    ];

    const nodes: OrganizerNode[] = [rootNode];
    const edges: OrganizerEdge[] = [];

    concepts.forEach(c => {
      nodes.push({
        id: c.id,
        parentId: actualRootId,
        text: c.text,
        x: 0,
        y: 0,
        width: 175,
        height: 50,
        depth: 1,
        icon: c.icon,
      });

      edges.push({
        id: `e-${actualRootId}-${c.id}`,
        from: actualRootId,
        to: c.id,
        label: c.connectorToChild,
      });

      c.subtopics.forEach(s => {
        nodes.push({
          id: s.id,
          parentId: c.id,
          text: s.text,
          x: 0,
          y: 0,
          width: 185,
          height: 52,
          depth: 2,
        });

        edges.push({
          id: `e-${c.id}-${s.id}`,
          from: c.id,
          to: s.id,
          label: s.connector,
        });
      });
    });

    return { nodes, edges };
  }

  // 3. Mapa Mental Radial (Buzan/Edraw: Equilibrado a izquierda y derecha con ramas orgánicas)
  if (type === 'mindmap') {
    const rootNode: OrganizerNode = {
      ...(existingRoot || {}),
      id: actualRootId,
      text: title,
      subtitle: 'Mapa Mental Equilibrado',
      x: 0,
      y: 0,
      width: Math.max(180, existingRoot?.width || 190),
      height: Math.max(54, existingRoot?.height || 56),
      isRoot: true,
      depth: 0,
      icon: existingRoot?.icon || '🧠',
    };

    const branches = [
      {
        id: `br-1-${actualRootId}`,
        text: '1. Fundamentos y Principios',
        icon: '💡',
        subtopics: [
          'Definición esencial y marco de referencia',
          'Objetivos estratégicos y alcance',
        ],
      },
      {
        id: `br-2-${actualRootId}`,
        text: '2. Características Clave',
        icon: '✨',
        subtopics: [
          'Propiedades distintivas y fortalezas',
          'Factores críticos de éxito',
        ],
      },
      {
        id: `br-3-${actualRootId}`,
        text: '3. Metodología y Procesos',
        icon: '⚙️',
        subtopics: [
          'Secuencia de implementación paso a paso',
          'Herramientas y recursos operativos',
        ],
      },
      {
        id: `br-4-${actualRootId}`,
        text: '4. Aplicaciones y Resultados',
        icon: '🚀',
        subtopics: [
          'Casos de uso e impacto práctico',
          'Métricas de avance y mejora continua',
        ],
      },
    ];

    const nodes: OrganizerNode[] = [rootNode];
    const edges: OrganizerEdge[] = [];

    branches.forEach(b => {
      nodes.push({
        id: b.id,
        parentId: actualRootId,
        text: b.text,
        x: 0,
        y: 0,
        width: 175,
        height: 50,
        depth: 1,
        icon: b.icon,
      });

      edges.push({
        id: `e-${actualRootId}-${b.id}`,
        from: actualRootId,
        to: b.id,
      });

      b.subtopics.forEach((sub, sIdx) => {
        const subId = `sub-${b.id}-${sIdx + 1}`;
        nodes.push({
          id: subId,
          parentId: b.id,
          text: sub,
          x: 0,
          y: 0,
          width: 180,
          height: 48,
          depth: 2,
        });

        edges.push({
          id: `e-${b.id}-${subId}`,
          from: b.id,
          to: subId,
        });
      });
    });

    return { nodes, edges };
  }

  // 4. Mapa Lógico Derecho (Izquierda -> Derecha)
  if (type === 'logic') {
    const rootNode: OrganizerNode = {
      ...(existingRoot || {}),
      id: actualRootId,
      text: title,
      subtitle: 'Desglose Jerárquico Horizontal',
      x: 0,
      y: 0,
      width: Math.max(180, existingRoot?.width || 190),
      height: Math.max(54, existingRoot?.height || 56),
      isRoot: true,
      depth: 0,
      icon: existingRoot?.icon || '🌿',
    };

    const pillars = [
      {
        id: `log-1-${actualRootId}`,
        text: '1. Diagnóstico y Entorno',
        icon: '🔍',
        subtopics: [
          'Análisis de la situación de partida y antecedentes',
          'Identificación de necesidades prioritarias',
        ],
      },
      {
        id: `log-2-${actualRootId}`,
        text: '2. Formulación Estratégica',
        icon: '🎯',
        subtopics: [
          'Definición de metas cuantitativas y cualitativas',
          'Criterios técnicos de validación y control',
        ],
      },
      {
        id: `log-3-${actualRootId}`,
        text: '3. Plan de Acción Operativo',
        icon: '📋',
        subtopics: [
          'Asignación de responsabilidades y cronograma',
          'Distribución eficiente de presupuesto y recursos',
        ],
      },
      {
        id: `log-4-${actualRootId}`,
        text: '4. Indicadores de Logro',
        icon: '📈',
        subtopics: [
          'Métricas clave de avance y seguimiento periódico',
          'Evaluación de impacto y entregables finales',
        ],
      },
    ];

    const nodes: OrganizerNode[] = [rootNode];
    const edges: OrganizerEdge[] = [];

    pillars.forEach(p => {
      nodes.push({
        id: p.id,
        parentId: actualRootId,
        text: p.text,
        x: 0,
        y: 0,
        width: 175,
        height: 50,
        depth: 1,
        icon: p.icon,
      });

      edges.push({
        id: `e-${actualRootId}-${p.id}`,
        from: actualRootId,
        to: p.id,
      });

      p.subtopics.forEach((sub, sIdx) => {
        const subId = `sub-${p.id}-${sIdx + 1}`;
        nodes.push({
          id: subId,
          parentId: p.id,
          text: sub,
          x: 0,
          y: 0,
          width: 180,
          height: 48,
          depth: 2,
        });

        edges.push({
          id: `e-${p.id}-${subId}`,
          from: p.id,
          to: subId,
        });
      });
    });

    return { nodes, edges };
  }

  // 5. Cuadro Sinóptico de Llaves ({)
  if (type === 'synoptic') {
    const rootNode: OrganizerNode = {
      ...(existingRoot || {}),
      id: actualRootId,
      text: title,
      subtitle: 'Cuadro Sinóptico de Llaves',
      x: 0,
      y: 0,
      width: Math.max(180, existingRoot?.width || 190),
      height: Math.max(54, existingRoot?.height || 56),
      isRoot: true,
      depth: 0,
      icon: existingRoot?.icon || '🗂️',
    };

    const mainIdeas = [
      {
        id: `syn-1-${actualRootId}`,
        text: 'Idea Principal: Fundamentos Teóricos',
        icon: '💡',
        subtopics: [
          'Conceptos esenciales y antecedentes históricos',
          'Principios rectores y marco normativo',
        ],
      },
      {
        id: `syn-2-${actualRootId}`,
        text: 'Idea Principal: Componentes Estructurales',
        icon: '🧩',
        subtopics: [
          'Elementos constitutivos de primer nivel',
          'Mecanismos de integración operativa',
        ],
      },
      {
        id: `syn-3-${actualRootId}`,
        text: 'Idea Principal: Aplicación y Práctica',
        icon: '🚀',
        subtopics: [
          'Ámbitos prioritarios de implementación',
          'Herramientas de seguimiento y verificación',
        ],
      },
    ];

    const nodes: OrganizerNode[] = [rootNode];
    const edges: OrganizerEdge[] = [];

    mainIdeas.forEach(m => {
      nodes.push({
        id: m.id,
        parentId: actualRootId,
        text: m.text,
        x: 0,
        y: 0,
        width: 185,
        height: 50,
        depth: 1,
        icon: m.icon,
      });

      edges.push({
        id: `e-${actualRootId}-${m.id}`,
        from: actualRootId,
        to: m.id,
      });

      m.subtopics.forEach((sub, sIdx) => {
        const subId = `sub-${m.id}-${sIdx + 1}`;
        nodes.push({
          id: subId,
          parentId: m.id,
          text: sub,
          x: 0,
          y: 0,
          width: 180,
          height: 48,
          depth: 2,
        });

        edges.push({
          id: `e-${m.id}-${subId}`,
          from: m.id,
          to: subId,
        });
      });
    });

    return { nodes, edges };
  }

  // 6. Diagrama de Ishikawa / Causa y Efecto (6M)
  if (type === 'fishbone') {
    const rootNode: OrganizerNode = {
      ...(existingRoot || {}),
      id: actualRootId,
      text: title,
      subtitle: 'Efecto Principal (Espina Central)',
      x: 0,
      y: 0,
      width: Math.max(190, existingRoot?.width || 200),
      height: Math.max(54, existingRoot?.height || 56),
      isRoot: true,
      depth: 0,
      icon: existingRoot?.icon || '🎯',
    };

    const ribs = [
      {
        id: `rib-1-${actualRootId}`,
        text: 'Métodos y Procedimientos',
        icon: '📋',
        subtopics: [
          'Procesos operativos con pasos no estandarizados',
          'Manuales desactualizados o sin difusión adecuada',
        ],
      },
      {
        id: `rib-2-${actualRootId}`,
        text: 'Personas y Equipo',
        icon: '👥',
        subtopics: [
          'Curva de aprendizaje prolongada en nuevas tareas',
          'Falta de programas continuos de capacitación',
        ],
      },
      {
        id: `rib-3-${actualRootId}`,
        text: 'Tecnología y Maquinaria',
        icon: '💻',
        subtopics: [
          'Herramientas informáticas con soporte limitado',
          'Mantenimiento preventivo con baja regularidad',
        ],
      },
      {
        id: `rib-4-${actualRootId}`,
        text: 'Materiales e Insumos',
        icon: '📦',
        subtopics: [
          'Variabilidad en la calidad de los insumos recibidos',
          'Tiempos de entrega con retrasos imprevistos',
        ],
      },
      {
        id: `rib-5-${actualRootId}`,
        text: 'Medición y Calibración',
        icon: '📊',
        subtopics: [
          'Indicadores métricos con tolerancias dispersas',
          'Seguimiento tardío de observaciones críticas',
        ],
      },
      {
        id: `rib-6-${actualRootId}`,
        text: 'Medio y Contexto',
        icon: '🌍',
        subtopics: [
          'Condiciones ambientales de trabajo desfavorables',
          'Variaciones normativas del mercado externo',
        ],
      },
    ];

    const nodes: OrganizerNode[] = [rootNode];
    const edges: OrganizerEdge[] = [];

    ribs.forEach(r => {
      nodes.push({
        id: r.id,
        parentId: actualRootId,
        text: r.text,
        x: 0,
        y: 0,
        width: 175,
        height: 50,
        depth: 1,
        icon: r.icon,
      });

      edges.push({
        id: `e-${actualRootId}-${r.id}`,
        from: actualRootId,
        to: r.id,
      });

      r.subtopics.forEach((sub, sIdx) => {
        const subId = `sub-${r.id}-${sIdx + 1}`;
        nodes.push({
          id: subId,
          parentId: r.id,
          text: sub,
          x: 0,
          y: 0,
          width: 180,
          height: 48,
          depth: 2,
        });

        edges.push({
          id: `e-${r.id}-${subId}`,
          from: r.id,
          to: subId,
        });
      });
    });

    return { nodes, edges };
  }

  // 7. Organigrama Jerárquico Vertical (Tree)
  if (type === 'tree') {
    const rootNode: OrganizerNode = {
      ...(existingRoot || {}),
      id: actualRootId,
      text: title,
      subtitle: 'Presidencia y Liderazgo Estratégico',
      x: 0,
      y: 0,
      width: Math.max(190, existingRoot?.width || 200),
      height: Math.max(54, existingRoot?.height || 56),
      isRoot: true,
      depth: 0,
      icon: existingRoot?.icon || '🏛️',
    };

    const departments = [
      {
        id: `dept-1-${actualRootId}`,
        text: 'Dirección de Operaciones',
        icon: '⚙️',
        subtopics: [
          'Área de Producción y Calidad',
          'Logística y Cadena de Suministro',
        ],
      },
      {
        id: `dept-2-${actualRootId}`,
        text: 'Dirección de Tecnología',
        icon: '💻',
        subtopics: [
          'Arquitectura y Desarrollo Digital',
          'Infraestructura y Redes',
        ],
      },
      {
        id: `dept-3-${actualRootId}`,
        text: 'Dirección Comercial y Marketing',
        icon: '📈',
        subtopics: [
          'Estrategia de Marca y Adquisición',
          'Atención y Fidelización',
        ],
      },
      {
        id: `dept-4-${actualRootId}`,
        text: 'Dirección de Talento Humano',
        icon: '👥',
        subtopics: [
          'Atracción, Cultura y Bienestar',
          'Capacitación y Desarrollo Profesional',
        ],
      },
    ];

    const nodes: OrganizerNode[] = [rootNode];
    const edges: OrganizerEdge[] = [];

    departments.forEach(d => {
      nodes.push({
        id: d.id,
        parentId: actualRootId,
        text: d.text,
        x: 0,
        y: 0,
        width: 175,
        height: 50,
        depth: 1,
        icon: d.icon,
      });

      edges.push({
        id: `e-${actualRootId}-${d.id}`,
        from: actualRootId,
        to: d.id,
      });

      d.subtopics.forEach((sub, sIdx) => {
        const subId = `sub-${d.id}-${sIdx + 1}`;
        nodes.push({
          id: subId,
          parentId: d.id,
          text: sub,
          x: 0,
          y: 0,
          width: 170,
          height: 48,
          depth: 2,
        });

        edges.push({
          id: `e-${d.id}-${subId}`,
          from: d.id,
          to: subId,
        });
      });
    });

    return { nodes, edges };
  }

  // 8. Diagrama de Flujo (Flowchart: Formas semánticas, decisión y loop)
  if (type === 'flowchart') {
    const startId = `node-start-${actualRootId}`;
    const dataId = `node-data-${actualRootId}`;
    const proc1Id = `node-proc1-${actualRootId}`;
    const decId = `node-dec-${actualRootId}`;
    const procYesId = `node-procyes-${actualRootId}`;
    const procNoId = `node-procno-${actualRootId}`;
    const endId = `node-end-${actualRootId}`;

    const nodes: OrganizerNode[] = [
      {
        id: startId,
        text: `Inicio: ${title}`,
        x: 0,
        y: 0,
        width: 180,
        height: 52,
        isRoot: true,
        flowType: 'start',
        icon: '🏁',
      },
      {
        id: dataId,
        parentId: startId,
        text: 'Recepción y Registro de Solicitud',
        x: 0,
        y: 0,
        width: 180,
        height: 50,
        flowType: 'data',
        icon: '📝',
      },
      {
        id: proc1Id,
        parentId: dataId,
        text: 'Evaluación Técnica de Parámetros',
        x: 0,
        y: 0,
        width: 180,
        height: 50,
        flowType: 'process',
        icon: '🔍',
      },
      {
        id: decId,
        parentId: proc1Id,
        text: '¿Cumple con los Criterios Establecidos?',
        x: 0,
        y: 0,
        width: 190,
        height: 54,
        flowType: 'decision',
        icon: '⚖️',
      },
      {
        id: procYesId,
        parentId: decId,
        text: 'Aprobación y Despliegue de la Solución',
        x: 0,
        y: 0,
        width: 185,
        height: 50,
        flowType: 'process',
        icon: '⚡',
      },
      {
        id: procNoId,
        parentId: decId,
        text: 'Notificación de Correcciones y Reenvío',
        x: 0,
        y: 0,
        width: 185,
        height: 50,
        flowType: 'process',
        icon: '🔄',
      },
      {
        id: endId,
        parentId: procYesId,
        text: 'Validación Final y Cierre del Proceso',
        x: 0,
        y: 0,
        width: 180,
        height: 52,
        flowType: 'end',
        icon: '🏆',
      },
    ];

    const edges: OrganizerEdge[] = [
      { id: `e-${startId}-${dataId}`, from: startId, to: dataId },
      { id: `e-${dataId}-${proc1Id}`, from: dataId, to: proc1Id },
      { id: `e-${proc1Id}-${decId}`, from: proc1Id, to: decId },
      { id: `e-${decId}-${procYesId}`, from: decId, to: procYesId, label: 'Sí' },
      { id: `e-${decId}-${procNoId}`, from: decId, to: procNoId, label: 'No' },
      { id: `e-${procYesId}-${endId}`, from: procYesId, to: endId },
      { id: `e-${procNoId}-${proc1Id}`, from: procNoId, to: proc1Id, label: 'Reajuste', isCrossLink: true },
    ];

    return { nodes, edges };
  }

  // 9. Línea de Tiempo / Hoja de Ruta Gantt (Timeline)
  if (type === 'timeline') {
    const rootNode: OrganizerNode = {
      ...(existingRoot || {}),
      id: actualRootId,
      text: title,
      subtitle: 'Cronograma Cronológico por Fases',
      x: 0,
      y: 0,
      width: Math.max(190, existingRoot?.width || 200),
      height: Math.max(54, existingRoot?.height || 56),
      isRoot: true,
      depth: 0,
      icon: existingRoot?.icon || '⏳',
    };

    const milestones = [
      {
        id: `tl-1-${actualRootId}`,
        text: 'Fase 1: Diagnóstico y Alcance',
        subtitle: 'Mes 1',
        icon: '🌱',
        progress: 100 as const,
        subtopics: [
          'Levantamiento riguroso de requerimientos',
          'Aprobación formal de las bases del proyecto',
        ],
      },
      {
        id: `tl-2-${actualRootId}`,
        text: 'Fase 2: Arquitectura y Prototipado',
        subtitle: 'Mes 2',
        icon: '🧭',
        progress: 75 as const,
        subtopics: [
          'Diseño técnico de la infraestructura',
          'Validación de prototipos con usuarios clave',
        ],
      },
      {
        id: `tl-3-${actualRootId}`,
        text: 'Fase 3: Implementación y Pruebas',
        subtitle: 'Mes 3',
        icon: '🚀',
        progress: 50 as const,
        subtopics: [
          'Despliegue escalonado de funcionalidades',
          'Auditoría de calidad y pruebas piloto',
        ],
      },
      {
        id: `tl-4-${actualRootId}`,
        text: 'Fase 4: Lanzamiento y Consolidación',
        subtitle: 'Mes 4',
        icon: '🏆',
        progress: 0 as const,
        subtopics: [
          'Capacitación integral a los equipos',
          'Entrega del informe final de resultados',
        ],
      },
    ];

    const nodes: OrganizerNode[] = [rootNode];
    const edges: OrganizerEdge[] = [];

    milestones.forEach(m => {
      nodes.push({
        id: m.id,
        parentId: actualRootId,
        text: m.text,
        subtitle: m.subtitle,
        x: 0,
        y: 0,
        width: 185,
        height: 52,
        depth: 1,
        icon: m.icon,
        progress: m.progress,
      });

      edges.push({
        id: `e-${actualRootId}-${m.id}`,
        from: actualRootId,
        to: m.id,
      });

      m.subtopics.forEach((sub, sIdx) => {
        const subId = `sub-${m.id}-${sIdx + 1}`;
        nodes.push({
          id: subId,
          parentId: m.id,
          text: sub,
          x: 0,
          y: 0,
          width: 180,
          height: 48,
          depth: 2,
        });

        edges.push({
          id: `e-${m.id}-${subId}`,
          from: m.id,
          to: subId,
        });
      });
    });

    return { nodes, edges };
  }

  // 10. Diagrama de Círculos y Radios (Radial / Burbujas 360°)
  if (type === 'radial') {
    const rootNode: OrganizerNode = {
      ...(existingRoot || {}),
      id: actualRootId,
      text: title,
      subtitle: 'Ecosistema Circular 360°',
      x: 0,
      y: 0,
      width: Math.max(160, existingRoot?.width || 170),
      height: Math.max(56, existingRoot?.height || 60),
      isRoot: true,
      depth: 0,
      shape: 'circle',
      icon: existingRoot?.icon || '🫧',
    };

    const spokes = [
      { id: `sp-1-${actualRootId}`, text: 'Propósito Estratégico', sub: 'Misión y visión que orientan la iniciativa', icon: '🎯' },
      { id: `sp-2-${actualRootId}`, text: 'Propuesta de Valor', sub: 'Beneficio diferencial y satisfacción de usuarios', icon: '💎' },
      { id: `sp-3-${actualRootId}`, text: 'Recursos y Capacidades', sub: 'Talento técnico e infraestructura de vanguardia', icon: '🛠️' },
      { id: `sp-4-${actualRootId}`, text: 'Comunidad y Alianzas', sub: 'Red colaborativa y ecosistema de integración', icon: '🤝' },
      { id: `sp-5-${actualRootId}`, text: 'Sostenibilidad Operativa', sub: 'Gestión responsable y viabilidad a largo plazo', icon: '🌱' },
      { id: `sp-6-${actualRootId}`, text: 'Innovación y Adaptabilidad', sub: 'Evolución activa ante nuevas oportunidades', icon: '🚀' },
    ];

    const nodes: OrganizerNode[] = [rootNode];
    const edges: OrganizerEdge[] = [];

    spokes.forEach(sp => {
      nodes.push({
        id: sp.id,
        parentId: actualRootId,
        text: sp.text,
        subtitle: sp.sub,
        x: 0,
        y: 0,
        width: 170,
        height: 52,
        depth: 1,
        icon: sp.icon,
      });

      edges.push({
        id: `e-${actualRootId}-${sp.id}`,
        from: actualRootId,
        to: sp.id,
      });
    });

    return { nodes, edges };
  }

  // 11. Matriz de Bloques 2x2 / FODA (Matrix)
  if (type === 'matrix') {
    const rootNode: OrganizerNode = {
      ...(existingRoot || {}),
      id: actualRootId,
      text: title,
      subtitle: 'Cuadrantes de Diagnóstico 2×2',
      x: 0,
      y: 0,
      width: Math.max(180, existingRoot?.width || 190),
      height: Math.max(54, existingRoot?.height || 56),
      isRoot: true,
      depth: 0,
      icon: existingRoot?.icon || '⊞',
    };

    const quadrants = [
      {
        id: `quad-1-${actualRootId}`,
        text: 'Fortalezas Internas',
        icon: '💪',
        priority: 1 as const,
        subtopics: [
          'Capacidades técnicas consolidadas y de alto valor',
          'Equipo con amplia experiencia y compromiso comprobado',
        ],
      },
      {
        id: `quad-2-${actualRootId}`,
        text: 'Oportunidades de Crecimiento',
        icon: '🚀',
        priority: 2 as const,
        subtopics: [
          'Apertura de nuevos mercados y demandas emergentes',
          'Alianzas estratégicas con actores clave del sector',
        ],
      },
      {
        id: `quad-3-${actualRootId}`,
        text: 'Debilidades Operativas',
        icon: '🛠️',
        priority: 3 as const,
        subtopics: [
          'Procesos manuales pendientes de automatizar',
          'Tiempos de respuesta que requieren optimización',
        ],
      },
      {
        id: `quad-4-${actualRootId}`,
        text: 'Amenazas Externas',
        icon: '⚠️',
        priority: 4 as const,
        subtopics: [
          'Variabilidad en el contexto regulatorio y económico',
          'Entrada de competidores con estrategias agresivas',
        ],
      },
    ];

    const nodes: OrganizerNode[] = [rootNode];
    const edges: OrganizerEdge[] = [];

    quadrants.forEach(q => {
      nodes.push({
        id: q.id,
        parentId: actualRootId,
        text: q.text,
        x: 0,
        y: 0,
        width: 175,
        height: 50,
        depth: 1,
        icon: q.icon,
        priority: q.priority,
      });

      edges.push({
        id: `e-${actualRootId}-${q.id}`,
        from: actualRootId,
        to: q.id,
      });

      q.subtopics.forEach((sub, sIdx) => {
        const subId = `sub-${q.id}-${sIdx + 1}`;
        nodes.push({
          id: subId,
          parentId: q.id,
          text: sub,
          x: 0,
          y: 0,
          width: 180,
          height: 48,
          depth: 2,
        });

        edges.push({
          id: `e-${q.id}-${subId}`,
          from: q.id,
          to: subId,
        });
      });
    });

    return { nodes, edges };
  }

  // 12. Diagrama de Ciclo Continuo (Cycle / PDCA)
  if (type === 'cycle') {
    const rootNode: OrganizerNode = {
      ...(existingRoot || {}),
      id: actualRootId,
      text: title,
      subtitle: 'Metodología Iterativa Deming / PDCA',
      x: 0,
      y: 0,
      width: Math.max(180, existingRoot?.width || 190),
      height: Math.max(54, existingRoot?.height || 56),
      isRoot: true,
      depth: 0,
      icon: existingRoot?.icon || '🔄',
    };

    const stages = [
      {
        id: `st-1-${actualRootId}`,
        text: '1. Planificar (Plan)',
        icon: '📋',
        subtopics: ['Diagnóstico de situación, fijación de metas y plan operativo'],
      },
      {
        id: `st-2-${actualRootId}`,
        text: '2. Hacer (Do)',
        icon: '⚡',
        subtopics: ['Ejecución disciplinada de las actividades programadas'],
      },
      {
        id: `st-3-${actualRootId}`,
        text: '3. Verificar (Check)',
        icon: '📊',
        subtopics: ['Monitoreo de indicadores clave y evaluación de desviaciones'],
      },
      {
        id: `st-4-${actualRootId}`,
        text: '4. Actuar (Act)',
        icon: '🔄',
        subtopics: ['Estandarización de aciertos y ajustes para el próximo ciclo'],
      },
    ];

    const nodes: OrganizerNode[] = [rootNode];
    const edges: OrganizerEdge[] = [];

    stages.forEach((st, idx) => {
      nodes.push({
        id: st.id,
        parentId: actualRootId,
        text: st.text,
        x: 0,
        y: 0,
        width: 175,
        height: 50,
        depth: 1,
        icon: st.icon,
      });

      edges.push({
        id: `e-${actualRootId}-${st.id}`,
        from: actualRootId,
        to: st.id,
      });

      st.subtopics.forEach((sub, sIdx) => {
        const subId = `sub-${st.id}-${sIdx + 1}`;
        nodes.push({
          id: subId,
          parentId: st.id,
          text: sub,
          x: 0,
          y: 0,
          width: 180,
          height: 48,
          depth: 2,
        });

        edges.push({
          id: `e-${st.id}-${subId}`,
          from: st.id,
          to: subId,
        });
      });
    });

    return { nodes, edges };
  }

  // Fallback seguro
  return {
    nodes: [
      {
        ...(existingRoot || {}),
        id: actualRootId,
        text: title,
        x: 0,
        y: 0,
        width: 180,
        height: 54,
        isRoot: true,
        depth: 0,
        icon: existingRoot?.icon || '💡',
      },
    ],
    edges: [],
  };
}

export function isCartographicStructure(nodes: OrganizerNode[]): boolean {
  if (!nodes || nodes.length < 9) return false;
  const root = nodes.find(n => n.isRoot || (n.depth || 0) === 0);
  if (!root) return false;
  const directChildren = nodes.filter(n => n.parentId === root.id);
  if (directChildren.length < 8) return false;
  const keywords = [
    'noción',
    'categorización',
    'caracter',
    'diferencia',
    'subdivisión',
    'vinculación',
    'metodología',
    'ejemplificación',
  ];
  const matches = directChildren.filter(c =>
    keywords.some(k => c.text.toLowerCase().includes(k))
  );
  return matches.length >= 6;
}

export type TemplateCategory =
  | 'all'
  | 'mindmap'
  | 'flowchart'
  | 'academic'
  | 'business'
  | 'strategy';

export const TEMPLATE_CATEGORY_META: {
  id: TemplateCategory;
  label: string;
  emoji: string;
}[] = [
  { id: 'all', label: 'Para ti (Todo)', emoji: '✨' },
  { id: 'mindmap', label: 'Mapas Mentales y Radios', emoji: '🧠' },
  { id: 'academic', label: 'Cartografía y Estudio', emoji: '🧭' },
  { id: 'flowchart', label: 'Flujo y Ciclos', emoji: '⚡' },
  { id: 'business', label: 'Organigrama y Red', emoji: '🏛️' },
  { id: 'strategy', label: 'FODA, Calidad y Gantt', emoji: '📊' },
];

export interface TemplateCard {
  id: string;
  title: string;
  queryKey: string;
  type: OrganizerType;
  theme: ThemeId;
  category: Exclude<TemplateCategory, 'all'>;
  description: string;
  badge: string;
  icon: string;
  featured?: boolean;
}

export const TEMPLATE_CARDS: TemplateCard[] = [
  // === ACADÉMICOS Y CARTOGRAFÍA CONCEPTUAL ===
  {
    id: 'tpl-cartographic-fin',
    title: 'Cartografía Conceptual: Administración Financiera',
    queryKey: 'administracion financiera',
    type: 'cartographic',
    theme: 'vitality-warm',
    category: 'academic',
    description:
      'Mapa académico simétrico 1-3-1-3 de los 8 ejes de Sergio Tobón con conectores naturales y argumentación formal.',
    badge: 'Tobón • 8 Ejes',
    icon: '🧭',
    featured: true,
  },
  {
    id: 'tpl-cartographic-emo',
    title: 'Cartografía Conceptual: Inteligencia Emocional',
    queryKey: 'inteligencia emocional',
    type: 'cartographic',
    theme: 'edraw-azure',
    category: 'academic',
    description:
      'Desarrollo integral de los 8 ejes conceptuales sobre autorregulación, empatía y habilidades socioemocionales.',
    badge: 'Psicología • 8 Ejes',
    icon: '💡',
  },
  {
    id: 'tpl-synoptic',
    title: 'Cuadro Sinóptico: Géneros Literarios',
    queryKey: 'sinoptico',
    type: 'synoptic',
    theme: 'academic-classic',
    category: 'academic',
    description:
      'Llaves caligráficas grupales { perfectamente calibradas para clasificar ramas principales y subcategorías.',
    badge: 'Académico • Llaves',
    icon: '🗂️',
    featured: true,
  },
  {
    id: 'tpl-concept',
    title: 'Mapa Conceptual: La Fotosíntesis',
    queryKey: 'fotosintesis',
    type: 'concept',
    theme: 'nature-sage',
    category: 'academic',
    description:
      'Jerarquía científica Novak con proposiciones sobre cada conector direccional y separación anticolisión.',
    badge: 'Ciencia • Novak',
    icon: '🌱',
    featured: true,
  },

  // === MAPAS MENTALES, LÓGICOS Y CÍRCULOS Y RADIOS (EDRAWMAX) ===
  {
    id: 'tpl-mindmap-ai',
    title: 'Mapa Mental: Inteligencia Artificial',
    queryKey: 'inteligencia artificial',
    type: 'mindmap',
    theme: 'vitality-warm',
    category: 'mindmap',
    description:
      'Distribución equilibrada izquierda y derecha con prioridades P1-P2, indicadores de avance y relación cruzada.',
    badge: 'Mapa Mental • IA',
    icon: '🧠',
    featured: true,
  },
  {
    id: 'tpl-mindmap-fruits',
    title: 'Mapa Mental: Beneficios de las Frutas',
    queryKey: 'beneficios nutricionales',
    type: 'mindmap',
    theme: 'nature-sage',
    category: 'mindmap',
    description:
      'Plantilla clásica estilo EdrawMax con ramas nutricionales claras sobre energía celular, antioxidantes y salud.',
    badge: 'Salud • EdrawMax',
    icon: '🍎',
  },
  {
    id: 'tpl-mindmap-time',
    title: 'Mapa Mental: Gestión del Tiempo',
    queryKey: 'gestion del tiempo',
    type: 'mindmap',
    theme: 'edraw-azure',
    category: 'mindmap',
    description:
      'Organizador de productividad personal con bloques de foco profundo, priorización y balance diario.',
    badge: 'Productividad',
    icon: '⏰',
  },
  {
    id: 'tpl-mindmap-plants',
    title: 'Mapa Mental: Cultivo de Plantas',
    queryKey: 'cultivo de plantas',
    type: 'mindmap',
    theme: 'nature-sage',
    category: 'mindmap',
    description:
      'Guía visual botánica sobre sustratos, iluminación, riego equilibrado y mantenimiento preventivo.',
    badge: 'Botánica • Estudio',
    icon: '🌿',
  },
  {
    id: 'tpl-logic-marketing',
    title: 'Mapa Lógico: Marketing en Internet',
    queryKey: 'marketing en internet',
    type: 'logic',
    theme: 'edraw-azure',
    category: 'mindmap',
    description:
      'Árbol lógico hacia la derecha sobre posicionamiento orgánico, campañas de conversión y fidelización digital.',
    badge: 'Marketing Digital',
    icon: '📣',
  },
  {
    id: 'tpl-logic-saas',
    title: 'Mapa Lógico: Lanzamiento de Producto SaaS',
    queryKey: 'mapa logico',
    type: 'logic',
    theme: 'edraw-underline',
    category: 'mindmap',
    description:
      'Desglose ejecutivo de izquierda a derecha con el estilo de ramas subrayadas minimalistas de EdrawMax.',
    badge: 'Estrategia • SaaS',
    icon: '🚀',
    featured: true,
  },
  {
    id: 'tpl-radial-ecosystem',
    title: 'Círculos y Radios: Transformación Digital',
    queryKey: 'circulos y radios',
    type: 'radial',
    theme: 'edraw-azure',
    category: 'mindmap',
    description:
      'Diagrama satelital 360° de burbujas concéntricas ideal para ecosistemas tecnológicos, lluvias de ideas y pilares.',
    badge: 'Círculos y Radios',
    icon: '🫧',
    featured: true,
  },

  // === DIAGRAMAS DE FLUJO, PROCESOS Y CICLOS (EDRAWMAX) ===
  {
    id: 'tpl-flowchart-algo',
    title: 'Diagrama de Flujo de Algoritmos',
    queryKey: 'flujo de algoritmos',
    type: 'flowchart',
    theme: 'edraw-azure',
    category: 'flowchart',
    description:
      'Secuencia algorítmica estructurada con inicio, lectura de variables, rombo de validación condicional y salida.',
    badge: 'Algoritmos • ISO',
    icon: '⚡',
    featured: true,
  },
  {
    id: 'tpl-flowchart-support',
    title: 'Diagrama de Flujo: Atención de Incidencias',
    queryKey: 'flujo',
    type: 'flowchart',
    theme: 'miro-pastel',
    category: 'flowchart',
    description:
      'Flujo operativo de soporte técnico con triaje inicial, bifurcación Sí / No y cierre verificado.',
    badge: 'Soporte • Flujo',
    icon: '🛠️',
  },
  {
    id: 'tpl-flowchart-process',
    title: 'Mapa de Procesos: Pedido E-Commerce',
    queryKey: 'mapa de procesos',
    type: 'flowchart',
    theme: 'minimal-slate',
    category: 'flowchart',
    description:
      'Recorrido logístico completo desde la solicitud del cliente y control de inventario hasta la entrega final.',
    badge: 'Procesos • Negocio',
    icon: '📦',
  },
  {
    id: 'tpl-cycle-pdca',
    title: 'Ciclo Continuo PDCA: Mejora Continua',
    queryKey: 'ciclo pdca',
    type: 'cycle',
    theme: 'vitality-warm',
    category: 'flowchart',
    description:
      'Anillo circular de 4 etapas conectadas (Planificar, Hacer, Verificar y Actuar) con flechas curvas de retorno.',
    badge: 'Ciclo Deming • PDCA',
    icon: '🔄',
    featured: true,
  },

  // === ORGANIGRAMA, GENOGRAMA Y ARQUITECTURA DE RED (EDRAWMAX) ===
  {
    id: 'tpl-tree-org',
    title: 'Organigrama Automatizado Corporativo',
    queryKey: 'organigrama',
    type: 'tree',
    theme: 'academic-classic',
    category: 'business',
    description:
      'Jerarquía ejecutiva con cargos directivos, equipos operativos y líneas conectoras ortogonales limpias.',
    badge: 'Organigrama',
    icon: '🏛️',
    featured: true,
  },
  {
    id: 'tpl-tree-genogram',
    title: 'Genograma y Árbol Genealógico Familiar',
    queryKey: 'genograma familiar',
    type: 'tree',
    theme: 'sunset-amber',
    category: 'business',
    description:
      'Estructura intergeneracional ordenada por ramas familiares para historia clínica, social o genealógica.',
    badge: 'Genograma',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'tpl-tree-network',
    title: 'Diagrama Básico de Red Empresarial',
    queryKey: 'arquitectura de red',
    type: 'tree',
    theme: 'minimal-slate',
    category: 'business',
    description:
      'Topología jerárquica con cortafuegos perimetral, balanceador de carga, servidores de aplicación y clúster de datos.',
    badge: 'Ingeniería • Red',
    icon: '🌐',
  },

  // === ESTRATEGIA: MATRIZ DE BLOQUES 2x2, ISHIKAWA Y GANTT ===
  {
    id: 'tpl-matrix-swot',
    title: 'Diagrama de Bloques: Matriz FODA 2×2',
    queryKey: 'matriz foda',
    type: 'matrix',
    theme: 'edraw-azure',
    category: 'strategy',
    description:
      'Cuadrícula estratégica de 4 cuadrantes simétricos para evaluar Fortalezas, Oportunidades, Debilidades y Amenazas.',
    badge: 'Matriz 2×2 • FODA',
    icon: '⊞',
    featured: true,
  },
  {
    id: 'tpl-fishbone',
    title: 'Diagrama Ishikawa: Causa y Efecto (6M)',
    queryKey: 'ishikawa',
    type: 'fishbone',
    theme: 'sunset-amber',
    category: 'strategy',
    description:
      'Espina de pescado calibrada con causas primarias inclinadas y sub-causas horizontales sin cruces.',
    badge: 'Calidad • 6M',
    icon: '🐟',
    featured: true,
  },
  {
    id: 'tpl-timeline-gantt',
    title: 'Diagrama de Gantt y Hoja de Ruta 2026',
    queryKey: 'cronograma',
    type: 'timeline',
    theme: 'vitality-warm',
    category: 'strategy',
    description:
      'Cronograma secuencial por fases trimestrales con porcentajes de avance e hitos alternados arriba y abajo.',
    badge: 'Gantt • Roadmap',
    icon: '⏳',
    featured: true,
  },
];

export async function createDefaultProjects(): Promise<OrganizerProject[]> {
  const now = Date.now();
  const projects: OrganizerProject[] = [];
  const starterCards = TEMPLATE_CARDS.filter(c => c.featured).slice(0, 8);

  for (let i = 0; i < starterCards.length; i++) {
    const card = starterCards[i];
    const generated = await generateOrganizer(
      { topic: card.queryKey, type: card.type },
      card.theme
    );

    projects.push({
      id: `proj-default-${card.id}`,
      title: generated.title,
      type: card.type,
      theme: card.theme,
      canvasBg: 'dots',
      rainbowBranches: true,
      nodes: generated.nodes,
      edges: generated.edges,
      createdAt: now - i * 1000,
      updatedAt: now - i * 1000,
    });
  }

  return projects;
}
