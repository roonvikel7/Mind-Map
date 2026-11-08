import {
  OrganizerEdge,
  OrganizerNode,
  OrganizerProject,
  OrganizerType,
  ThemeId,
} from '../types/organizer';
import { applyLayout } from './layouts';
import { buildStarterProjectNodes, getDefaultTitleForType } from './templates';
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
  title?: string
): OrganizerProject {
  const stamp = Date.now();
  const rootId = `root-${stamp}`;
  const actualTitle = (title && title.trim()) || getDefaultTitleForType(type);
  const theme: ThemeId = 'vitality-warm';

  const { nodes, edges } = buildStarterProjectNodes(type, actualTitle, rootId);
  const relaid = applyLayout(nodes, edges, type, theme, true, 'clockwise');

  return {
    id: `proj-${stamp}`,
    title: actualTitle,
    type,
    theme,
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

let pendingProjectsToSave: OrganizerProject[] | null = null;
let saveTimerId: ReturnType<typeof setTimeout> | null = null;

function flushPendingProjectsSave() {
  if (!pendingProjectsToSave) return;
  const snapshot = pendingProjectsToSave;
  pendingProjectsToSave = null;
  if (saveTimerId !== null) {
    clearTimeout(saveTimerId);
    saveTimerId = null;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.error('Error guardando proyectos:', err);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPendingProjectsSave);
  window.addEventListener('beforeunload', flushPendingProjectsSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingProjectsSave();
    }
  });
}

export async function loadInitialProjects(): Promise<{
  projects: OrganizerProject[];
  activeId: string;
}> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: OrganizerProject[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Limitar proyectos antiguos duplicados sin editar para mantener localStorage ultraligero
        const sanitized = parsed.slice(0, 40).map(p => {
          const validTheme = normalizeThemeId(p.theme);
          const direction = p.cartographicDirection || 'clockwise';
          const needsInitialMeasure =
            !Array.isArray(p.nodes) ||
            p.nodes.some(n => !n.width || !n.height || !Array.isArray(n.lines));

          const resolved = needsInitialMeasure
            ? applyLayout(p.nodes || [], p.edges || [], p.type, validTheme, false, direction)
            : { nodes: p.nodes, edges: p.edges || [] };

          return {
            ...p,
            theme: validTheme,
            cartographicDirection: direction,
            canvasBg: p.canvasBg || 'dots',
            rainbowBranches: p.rainbowBranches ?? true,
            images: Array.isArray(p.images) ? p.images : [],
            nodes: resolved.nodes,
            edges: resolved.edges,
          };
        });

        const savedActive = localStorage.getItem(ACTIVE_PROJECT_KEY);
        const validActive =
          savedActive && sanitized.some(p => p.id === savedActive)
            ? savedActive
            : sanitized[0].id;

        return { projects: sanitized, activeId: validActive };
      }
    }
  } catch (err) {
    console.error('Error cargando proyectos guardados:', err);
  }

  const cleanInitial = createCleanInitialProject('mindmap', 'Idea Central');
  const defaults = [cleanInitial];
  saveProjects(defaults, true);
  localStorage.setItem(ACTIVE_PROJECT_KEY, cleanInitial.id);
  return { projects: defaults, activeId: cleanInitial.id };
}

/**
 * Persistencia no bloqueante en segundo plano (0 ms de impacto en los FPS de arrastre y edición)
 */
export function saveProjects(projects: OrganizerProject[], immediate = false) {
  pendingProjectsToSave = projects;
  if (immediate) {
    flushPendingProjectsSave();
    return;
  }
  if (saveTimerId !== null) {
    clearTimeout(saveTimerId);
  }
  saveTimerId = setTimeout(() => {
    saveTimerId = null;
    const idle = (window as any).requestIdleCallback;
    if (typeof idle === 'function') {
      idle(() => flushPendingProjectsSave(), { timeout: 500 });
    } else {
      flushPendingProjectsSave();
    }
  }, 320);
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
