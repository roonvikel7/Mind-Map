import { OrganizerProject, ThemeId } from '../types/organizer';
import { createDefaultProjects } from './templates';
import { applyLayout } from './layouts';
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

export async function loadInitialProjects(): Promise<{
  projects: OrganizerProject[];
  activeId: string;
}> {
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
        const savedActive = localStorage.getItem(ACTIVE_PROJECT_KEY);
        const activeId =
          sanitized.some(p => p.id === savedActive) && savedActive
            ? savedActive
            : sanitized[0].id;
        return { projects: sanitized, activeId };
      }
    }
  } catch (err) {
    console.error('Error cargando proyectos guardados:', err);
  }

  const defaults = await createDefaultProjects();
  saveProjects(defaults);
  localStorage.setItem(ACTIVE_PROJECT_KEY, defaults[0].id);
  return { projects: defaults, activeId: defaults[0].id };
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
