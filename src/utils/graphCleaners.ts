import { OrganizerEdge, OrganizerNode, OrganizerType } from '../types/organizer';

/**
 * Transforma el texto de cualquier nodo en un argumento fluido, continuo y formal en español:
 * - Elimina etiquetas robóticas con dos puntos ("Definición conceptual:", "Origen etimológico:", "Propósito:")
 * - Elimina paréntesis integrando explicaciones de forma corrida
 * - Elimina dos puntos residuales
 * - Asegura continuidad sintáctica perfecta con el conector textual de la arista (label)
 */
export function cleanAndNaturalizeArgument(
  rawText: string,
  label?: string,
  isRoot?: boolean
): { text: string; label?: string } {
  if (!rawText) return { text: '', label };

  let text = rawText.trim();

  // En la raíz principal conservar su título limpio
  if (isRoot) {
    text = text.replace(/^["'«»“]+|["'«»”]+$/g, '').replace(/:\s*$/, '').trim();
    return { text, label };
  }

  // 1. Quitar comillas envolventes
  text = text.replace(/^["'«»“]+|["'«»”]+$/g, '').trim();

  // 2. Eliminar prefijos con dos puntos de IA: "Definición conceptual:", "Origen etimológico:", "Propósito:", etc.
  text = text.replace(/^[A-Za-zÁ-ÿ\s0-9'\-_/]{2,40}:\s*/i, '');

  // 3. Eliminar dos puntos dentro del texto (reemplazar por coma o nexo natural)
  text = text.replace(/\s*:\s*/g, ', ');

  // 4. Eliminar paréntesis y corchetes, integrando el contenido de forma corrida
  text = text.replace(/\s*\(([^)]+)\)\s*/g, (_m, inner) => {
    const trimmed = inner.trim();
    if (/^\d{4}$/.test(trimmed)) {
      return ` en el año ${trimmed} `;
    }
    return `, ${trimmed}, `;
  });
  text = text.replace(/\[([^\]]+)\]/g, '$1');

  // 5. Limpiar comas duplicadas y espacios
  text = text
    .replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;])/g, '$1')
    .replace(/,\s*\./g, '.')
    .replace(/^\s*,\s*/, '')
    .trim();

  // 6. Normalizar y naturalizar el conector textual de la arista (label)
  let cleanLabel = label ? label.trim().toLowerCase() : undefined;
  if (cleanLabel) {
    cleanLabel = cleanLabel.replace(/^["'«»]+|["'«»]+$/g, '').trim();
    if (cleanLabel === 'deriva') cleanLabel = 'deriva de';
    else if (cleanLabel === 'establece') cleanLabel = 'establece que';
    else if (cleanLabel === 'define') cleanLabel = 'se define como';
    else if (cleanLabel === 'clasifica') cleanLabel = 'se clasifica en';
    else if (cleanLabel === 'caracteriza') cleanLabel = 'se caracteriza por';
    else if (cleanLabel === 'distingue' || cleanLabel === 'diferencia') cleanLabel = 'se distingue de';
    else if (cleanLabel === 'vincula' || cleanLabel === 'relaciona') cleanLabel = 'se vincula con';
    else if (cleanLabel === 'aplica') cleanLabel = 'se aplica mediante';
    else if (cleanLabel === 'produce' || cleanLabel === 'genera') cleanLabel = 'conduce a';
    else if (cleanLabel === 'ejemplifica') cleanLabel = 'se ejemplifica con';
    else if (cleanLabel === 'manifiesta') cleanLabel = 'se manifiesta en';
    else if (cleanLabel === 'origina') cleanLabel = 'se origina en';

    // 7. Evitar redundancia si el cuadro repite el inicio del conector
    const redundantStartRegex = new RegExp(
      `^(${cleanLabel}|deriva(\\s+del|\\s+de)?|proviene(\\s+del|\\s+de)?|se define(\\s+como)?|establece(\\s+que)?|se caracteriza(\\s+por)?|se distingue(\\s+de)?|se vincula(\\s+con)?|se aplica(\\s+mediante)?)\\s+`,
      'i'
    );
    if (redundantStartRegex.test(text)) {
      text = text.replace(redundantStartRegex, '');
    }

    // Si el conector termina en preposición/conjunción, asegurar primera letra minúscula para lectura corrida
    if (/(?:de|del|en|como|por|que|con|mediante|hacia)$/i.test(cleanLabel)) {
      const firstWord = text.split(' ')[0] || '';
      const isProperNoun =
        /^[A-ZÁÉÍÓÚ][a-záéíóú]+$/.test(firstWord) &&
        ['España', 'Roma', 'Grecia', 'Aristóteles', 'Platón', 'Fayol', 'Taylor', 'Weber', 'América', 'Europa', 'Novak', 'Tobón'].includes(firstWord);
      if (!isProperNoun && text.length > 0) {
        text = text.charAt(0).toLowerCase() + text.slice(1);
      }
    }
  }

  // Asegurar punto final para oraciones argumentativas largas
  if (text.length > 35 && !/[.!?]$/.test(text)) {
    text = text + '.';
  }

  return { text, label: cleanLabel };
}

/** Limpia y normaliza una palabra o frase de enlace verbal según reglas de Novak (minúscula, concisa, sin puntuación final) */
export function cleanConceptLinkLabel(rawLabel?: string): string | undefined {
  if (!rawLabel) return undefined;
  let clean = rawLabel
    .trim()
    .toLowerCase()
    .replace(/^["'«»“”]+|["'«»“”]+$/g, '')
    .replace(/[.:;!?]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!clean) return undefined;

  // Normalizar verbos sueltos frecuentes a frases de enlace naturales
  const shortcuts: Record<string, string> = {
    define: 'se define como',
    clasifica: 'se clasifica en',
    divide: 'se divide en',
    caracteriza: 'se caracteriza por',
    distingue: 'se distingue de',
    vincula: 'se vincula con',
    relaciona: 'se relaciona con',
    aplica: 'se aplica en',
    ejemplifica: 'se ejemplifica en',
    compone: 'se compone de',
    deriva: 'deriva de',
    depende: 'depende de',
  };
  if (shortcuts[clean]) {
    clean = shortcuts[clean];
  }

  return clean;
}

/**
 * Limpia y formatea un nodo de Mapa Conceptual auténtico de Novak:
 * - Concepto nominal breve con mayúscula inicial (sin emojis, sin puntos finales, sin prefijos con dos puntos)
 * - Preserva siglas o fórmulas cortas útiles, evitando oraciones largas de estilo párrafo
 */
export function cleanConceptNodeText(
  rawText: string,
  label?: string,
  isRoot?: boolean
): { text: string; label?: string } {
  if (!rawText) return { text: 'Concepto', label: cleanConceptLinkLabel(label) };

  let text = rawText
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/^["'«»“”]+|["'«»“”]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (isRoot) {
    text = text.replace(/[:.;]+$/g, '').trim();
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    return { text: text || 'Concepto Central', label: undefined };
  }

  // Quitar prefijos artificiales ("Concepto:", "Ejemplo:", etc.) y puntos finales
  text = text.replace(/^[A-Za-zÁ-ÿ\s0-9'\-_/]{2,35}:\s*/i, '');
  text = text.replace(/\s*:\s*/g, ', ');

  // Conservar paréntesis muy cortos (fórmulas químicas o siglas <= 8 caracteres como H2O, CO2, IA, ADN) y eliminar aclaraciones largas
  text = text.replace(/\s*\(([^)]+)\)\s*/g, (_m, inner) => {
    const trimmed = inner.trim();
    if (trimmed.length <= 8) {
      return ` (${trimmed}) `;
    }
    return ' ';
  });

  text = text
    .replace(/[.;,]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const cleanLabel = cleanConceptLinkLabel(label);

  // Evitar que el texto del concepto repita el conector entrante al principio
  if (cleanLabel) {
    const escaped = cleanLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const dupRegex = new RegExp(`^${escaped}\\s+`, 'i');
    if (dupRegex.test(text)) {
      text = text.replace(dupRegex, '').trim();
    }
  }

  // Garantizar mayúscula inicial del concepto nominal
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return { text: text || 'Concepto', label: cleanLabel || 'comprende' };
}

export const CARTO_CANONICAL_CONNECTORS: Record<string, string> = {
  '1. ejemplificacion': 'se ejemplifica mediante',
  '1. ejemplificación': 'se ejemplifica mediante',
  '2. nocion': 'se define como',
  '2. noción': 'se define como',
  '3. categorizacion': 'pertenece a',
  '3. categorización': 'pertenece a',
  '4. caracterizacion': 'se caracteriza por',
  '4. caracterización': 'se caracteriza por',
  '4. caracteristicas': 'se caracteriza por',
  '4. características': 'se caracteriza por',
  '5. diferenciacion': 'se distingue de',
  '5. diferenciación': 'se distingue de',
  '5. diferencias': 'se distingue de',
  '6. subdivision': 'se subdivide en',
  '6. subdivisión': 'se subdivide en',
  '7. vinculacion': 'se vincula con',
  '7. vinculación': 'se vincula con',
  '8. metodologia': 'se aplica mediante',
  '8. metodología': 'se aplica mediante',
};

export function getCartoCanonicalConnector(axisText: string): string | undefined {
  const norm = axisText.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, val] of Object.entries(CARTO_CANONICAL_CONNECTORS)) {
    const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (norm.includes(keyNorm.slice(3))) {
      return val;
    }
  }
  return undefined;
}

/**
 * Determina si el texto de un nodo corresponde a una palabra de enlace o conector artificial
 */
export function isConnectorText(text: string, label?: string): boolean {
  if (!text) return true;
  const clean = text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.:;!?,]+$/, '')
    .trim();

  // Palabras gramaticales, preposiciones y verbos de enlace aislados
  const connectorWords = new Set([
    'como', 'por', 'de', 'del', 'en', 'a', 'al', 'con', 'para', 'que', 'es', 'son',
    'hacia', 'desde', 'entre', 'sobre', 'segun', 'mediante', 'o', 'y', 'e', 'ni',
    'sin', 'tras', 'define', 'deriva', 'pertenece', 'caracteriza', 'distingue',
    'subdivide', 'vincula', 'aplica', 'comprende', 'integra', 'incluye', 'abarca',
    'conduce', 'produce', 'determina', 'evidencia'
  ]);
  if (connectorWords.has(clean)) return true;

  // Frases conectoras comunes
  const phrases = [
    'se define como', 'define como', 'definido como', 'se define',
    'deriva de', 'deriva del', 'proviene de', 'se origina en',
    'pertenece a', 'pertenece al', 'se inscribe en', 'forma parte de',
    'se caracteriza por', 'caracteriza por', 'se compone de',
    'se distingue de', 'distingue de', 'se diferencia de', 'diferencia de',
    'se subdivide en', 'subdivide en', 'se divide en', 'se clasifica en',
    'se vincula con', 'vincula con', 'se relaciona con', 'relaciona con',
    'se aplica mediante', 'aplica mediante', 'se aplica en', 'se implementa con',
    'se ejemplifica mediante', 'se ejemplifica con', 'se manifiesta en',
    'comprende', 'integra', 'evidencia'
  ];
  if (phrases.some(p => p.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === clean)) {
    return true;
  }

  // Si el texto coincide con su label o es un sufijo/prefijo de la etiqueta entrante
  if (label) {
    const cleanL = label.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (clean === cleanL || cleanL.endsWith(' ' + clean) || cleanL.startsWith(clean + ' ')) {
      return true;
    }
  }

  return false;
}

/**
 * Poda y elimina cualquier nodo puente conector redundante (ej. cuadros con "como", "por", "pertenece a"),
 * reconectando a sus hijos directamente al nodo padre con el conector apropiado sobre la línea (label).
 * Garantiza que nunca haya un cuadro conector antes del cuadro de contenido real.
 */
export function pruneRedundantConnectorNodes(
  rawNodes: OrganizerNode[],
  rawEdges: OrganizerEdge[],
  type?: OrganizerType
): { nodes: OrganizerNode[]; edges: OrganizerEdge[] } {
  if (!Array.isArray(rawNodes) || rawNodes.length <= 2) {
    return { nodes: rawNodes || [], edges: rawEdges || [] };
  }

  let nodes: OrganizerNode[] = rawNodes.map(n => ({ ...n }));
  let edges: OrganizerEdge[] = rawEdges.map(e => ({ ...e }));

  // Ejecutar hasta 3 pasadas por si existen puentes encadenados
  for (let pass = 0; pass < 3; pass++) {
    const nodeMap = new Map<string, OrganizerNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    const childrenMap = new Map<string, string[]>();
    nodes.forEach(n => childrenMap.set(n.id, []));

    // Determinar hijos tanto por parentId como por aristas jerárquicas
    nodes.forEach(n => {
      if (n.parentId && nodeMap.has(n.parentId)) {
        childrenMap.get(n.parentId)!.push(n.id);
      }
    });

    edges.forEach(e => {
      if (!e.isCrossLink && nodeMap.has(e.from) && nodeMap.has(e.to)) {
        const list = childrenMap.get(e.from) || [];
        if (!list.includes(e.to)) {
          list.push(e.to);
          childrenMap.set(e.from, list);
        }
      }
    });

    const bridgeIdsToRemove = new Set<string>();

    for (const node of nodes) {
      if (node.isRoot || !node.parentId) continue;

      // Los 8 ejes estructurales de Cartografía jamás son puentes conectores
      if (getCartoCanonicalConnector(node.text) || /^\d\.\s+[A-Za-zÁ-ÿ]+/i.test(node.text.trim())) {
        continue;
      }

      const parent = nodeMap.get(node.parentId);
      if (!parent) continue;

      const childrenIds = childrenMap.get(node.id) || [];
      if (childrenIds.length === 0) continue; // Si es hoja, no es un puente intermediario

      const incomingEdge = edges.find(e => e.to === node.id && !e.isCrossLink);
      const incomingLabel = incomingEdge?.label;

      let isBridge = false;

      // Criterio 1: El texto del nodo es una palabra o frase conectora
      if (isConnectorText(node.text, incomingLabel)) {
        isBridge = true;
      }

      // Criterio 2: En Cartografía Conceptual cuando el padre es uno de los 8 ejes
      const cartoConnector = getCartoCanonicalConnector(parent.text);
      if (cartoConnector) {
        // Un eje jamás debe tener un nodo puente intermedio si los hijos contienen el argumento/párrafo real
        const childrenHaveContent = childrenIds.some(cid => {
          const childNode = nodeMap.get(cid);
          return childNode && childNode.text.length > 25;
        });
        if (childrenHaveContent && (isConnectorText(node.text, incomingLabel) || node.text.length < 35)) {
          isBridge = true;
        }
      }

      if (isBridge) {
        bridgeIdsToRemove.add(node.id);

        // Conector directo a aplicar en la arista que unirá el padre directamente con los hijos
        const finalConnector =
          cartoConnector ||
          (incomingLabel && !isConnectorText(incomingLabel) ? incomingLabel : undefined) ||
          incomingLabel ||
          (isConnectorText(node.text) ? node.text : undefined);

        // Reconectar cada hijo directamente al padre
        for (const childId of childrenIds) {
          const childNode = nodeMap.get(childId);
          if (childNode) {
            childNode.parentId = parent.id;

            // Determinar etiqueta para el hijo
            const childEdge = edges.find(e => e.to === childId && e.from === node.id && !e.isCrossLink);
            const currentChildLabel = childEdge?.label;
            
            let assignedLabel = finalConnector;
            if (!assignedLabel || ['comprende', 'integra', 'evidencia', 'incluye'].includes(currentChildLabel?.toLowerCase() || '')) {
              assignedLabel = finalConnector || currentChildLabel;
            }

            // Naturalizar el contenido del hijo respetando si es Mapa Conceptual de Novak o argumento continuo
            const naturalized =
              type === 'concept'
                ? cleanConceptNodeText(childNode.text, assignedLabel, false)
                : cleanAndNaturalizeArgument(childNode.text, assignedLabel, false);
            childNode.text = naturalized.text;
            childNode.subtitle = undefined; // Sin subtítulos robóticos

            // Actualizar o crear arista de conexión directa desde el padre
            if (childEdge) {
              childEdge.from = parent.id;
              childEdge.label = naturalized.label || assignedLabel;
            } else {
              edges.push({
                id: `rewired-${parent.id}-${childId}`,
                from: parent.id,
                to: childId,
                label: naturalized.label || assignedLabel,
              });
            }
          }
        }
      }
    }

    if (bridgeIdsToRemove.size === 0) break; // Ya no hay puentes

    // Eliminar nodos puente y aristas huérfanas
    nodes = nodes.filter(n => !bridgeIdsToRemove.has(n.id));
    edges = edges.filter(e => !bridgeIdsToRemove.has(e.from) && !bridgeIdsToRemove.has(e.to));
  }

  // Filtrar aristas para garantizar consistencia estricta
  const finalIds = new Set(nodes.map(n => n.id));
  edges = edges.filter(e => finalIds.has(e.from) && finalIds.has(e.to));

  return { nodes, edges };
}
