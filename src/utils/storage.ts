import {
  OrganizerEdge,
  OrganizerNode,
  OrganizerProject,
  OrganizerType,
  ThemeId,
} from '../types/organizer';
import { applyLayout } from './layouts';
import { buildCartographicProjectNodes } from './templates';
import { EDRAW_THEMES } from './themes';

const STORAGE_KEY = 'synapse_edraw_projects_v8';
const ACTIVE_PROJECT_KEY = 'synapse_edraw_active_id_v8';
const API_SETTINGS_KEY = 'visual_organizer_api_settings_v1';

export interface ApiSettings {
  geminiApiKey: string;
  openaiApiKey: string;
  defaultProvider: 'local' | 'gemini' | 'openai';
}

function normalizeThemeId(raw?: string): ThemeId {
  if (raw && raw in EDRAW_THEMES) {
    return raw as ThemeId;
  }
  return 'vitality-warm';
}

export function createCleanInitialProject(
  type: OrganizerType = 'mindmap',
  title = 'Idea Central'
): OrganizerProject {
  const stamp = Date.now();
  const rootId = `root-${stamp}`;
  
  let initialNodes: OrganizerNode[];
  let initialEdges: OrganizerEdge[];

  if (type === 'cartographic') {
    const built = buildCartographicProjectNodes(title, rootId);
    initialNodes = built.nodes;
    initialEdges = built.edges;
  } else {
    initialNodes = [
      {
        id: rootId,
        text: title,
        subtitle: 'Toca para editar o añadir subtemas',
        x: 0,
        y: 0,
        width: 180,
        height: 56,
        isRoot: true,
        icon: '💡',
      },
    ];
    initialEdges = [];
  }

  const relaid = applyLayout(initialNodes, initialEdges, type, 'vitality-warm', true, 'clockwise');
  return {
    id: `proj-${stamp}`,
    title,
    type,
    theme: 'vitality-warm',
    canvasBg: 'dots',
    rainbowBranches: true,
    cartographicDirection: 'clockwise',
    nodes: relaid.nodes,
    edges: relaid.edges,
    images: [],
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export async function loadInitialProjects(): Promise<{
  projects: OrganizerProject[];
  activeId: string;
}> {
  const cleanInitial = createCleanInitialProject('mindmap', 'Idea Central');

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: OrganizerProject[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = parsed.map(p => {
          const validTheme = normalizeThemeId(p.theme);
          const direction = p.cartographicDirection || 'clockwise';
          const { nodes, edges } = applyLayout(p.nodes, p.edges, p.type, validTheme, false, direction);
          return {
            ...p,
            theme: validTheme,
            cartographicDirection: direction,
            canvasBg: p.canvasBg || 'dots',
            rainbowBranches: p.rainbowBranches ?? true,
            images: Array.isArray(p.images) ? p.images : [],
            nodes,
            edges,
          };
        });

        // Si el primer proyecto ya es un lienzo limpio (solo 1 nodo raíz), lo usamos
        const firstIsClean =
          sanitized[0] &&
          sanitized[0].nodes.length === 1 &&
          sanitized[0].nodes[0].isRoot;

        if (firstIsClean) {
          return { projects: sanitized, activeId: sanitized[0].id };
        }

        // Siempre al inicio anteponer el proyecto limpio con solo la forma del título
        const combined = [cleanInitial, ...sanitized];
        saveProjects(combined);
        localStorage.setItem(ACTIVE_PROJECT_KEY, cleanInitial.id);
        return { projects: combined, activeId: cleanInitial.id };
      }
    }
  } catch (err) {
    console.error('Error cargando proyectos guardados:', err);
  }

  const defaults = [cleanInitial];
  saveProjects(defaults);
  localStorage.setItem(ACTIVE_PROJECT_KEY, cleanInitial.id);
  return { projects: defaults, activeId: cleanInitial.id };
}

export function saveProjects(projects: OrganizerProject[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Error guardando proyectos:', err);
  }
}

export function saveActiveProjectId(id: string) {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch (_) {}
}

function getDefaultGeminiKey(): string {
  try {
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (typeof envKey === 'string' && envKey.trim()) return envKey.trim();
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob('QVEuQWI4Uk42SzMyODVNdXpoQ01jUGdBcWMySXV4ek8yakNuMXR0R2NRUHNNenl5NlBqUmc=');
    }
  } catch (_) {}
  return '';
}

export function loadApiSettings(): ApiSettings {
  const defaultKey = getDefaultGeminiKey();
  try {
    const raw = localStorage.getItem(API_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.geminiApiKey || !parsed.geminiApiKey.trim()) {
        parsed.geminiApiKey = defaultKey;
        parsed.defaultProvider = defaultKey ? 'gemini' : 'local';
      }
      return parsed;
    }
  } catch (_) {}
  return {
    geminiApiKey: defaultKey,
    openaiApiKey: '',
    defaultProvider: defaultKey ? 'gemini' : 'local',
  };
}

export function saveApiSettings(settings: ApiSettings) {
  try {
    localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(settings));
  } catch (_) {}
}
