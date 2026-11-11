import mqtt, { MqttClient } from 'mqtt';
import { CollaboratorInfo, OrganizerProject } from '../types/organizer';

const BROKER_SERVERS = [
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://broker.emqx.io:8084/mqtt',
];

const COLLAB_COLORS = [
  '#EA580C', // Naranja
  '#2563EB', // Azul
  '#16A34A', // Verde
  '#9333EA', // Púrpura
  '#DB2777', // Rosa
  '#D97706', // Ámbar
  '#0D9488', // Verde azulado
];

/**
 * Obtiene o inicializa la identidad del usuario en esta sesión
 */
export function getMyCollaboratorInfo(): CollaboratorInfo {
  const isMobile =
    typeof window !== 'undefined' &&
    (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      window.innerWidth < 768);

  const key = 'synapse_collab_identity_v1';
  let cached: CollaboratorInfo | null = null;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) cached = JSON.parse(raw);
  } catch {}

  if (cached && cached.id) {
    cached.device = isMobile ? 'mobile' : 'desktop';
    return cached;
  }

  const randomNum = Math.floor(Math.random() * 900) + 100;
  const color = COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)];
  const info: CollaboratorInfo = {
    id: `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: `${isMobile ? 'Móvil' : 'PC'} #${randomNum}`,
    color,
    device: isMobile ? 'mobile' : 'desktop',
    lastSeen: Date.now(),
  };

  try {
    sessionStorage.setItem(key, JSON.stringify(info));
  } catch {}

  return info;
}

/**
 * Comprime un proyecto completo usando la API nativa de gzip del navegador
 * para empaquetarlo limpiamente en el hash de la URL (#d=...)
 */
export async function compressProjectToHash(project: OrganizerProject): Promise<string> {
  try {
    const payload = {
      id: project.id,
      title: project.title,
      type: project.type,
      theme: project.theme,
      canvasBg: project.canvasBg,
      rainbowBranches: project.rainbowBranches,
      cartographicDirection: project.cartographicDirection,
      shareRoomId: project.shareRoomId,
      updatedAt: project.updatedAt || Date.now(),
      nodes: project.nodes.map(n => ({
        id: n.id,
        text: n.text,
        subtitle: n.subtitle,
        parentId: n.parentId,
        x: Math.round(n.x),
        y: Math.round(n.y),
        width: Math.round(n.width),
        height: Math.round(n.height),
        icon: n.icon,
        shape: n.shape,
        color: n.color,
        bgColor: n.bgColor,
        textColor: n.textColor,
        flowType: n.flowType,
        priority: n.priority,
        progress: n.progress,
        notes: n.notes,
        collapsed: n.collapsed,
        side: n.side,
        cartographicSector: n.cartographicSector,
      })),
      edges: project.edges.map(e => ({
        id: e.id,
        from: e.from,
        to: e.to,
        label: e.label,
        isCrossLink: e.isCrossLink,
        color: e.color,
      })),
    };

    const json = JSON.stringify(payload);
    const blob = new Blob([json], { type: 'application/json' });
    const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
    const compressedBuffer = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(compressedBuffer);

    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunk))
      );
    }

    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (err) {
    console.warn('Error comprimiendo mapa para URL:', err);
    return '';
  }
}

/**
 * Descomprime un mapa desde el hash de la URL
 */
export async function decompressProjectFromHash(hash: string): Promise<OrganizerProject | null> {
  try {
    if (!hash || hash.trim().length === 0) return null;
    let clean = hash.trim();
    if (clean.startsWith('#d=')) clean = clean.slice(3);
    else if (clean.startsWith('#')) clean = clean.slice(1);
    if (!clean) return null;

    let base64 = clean.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(stream).text();
    const parsed = JSON.parse(text);

    if (parsed && Array.isArray(parsed.nodes)) {
      return parsed as OrganizerProject;
    }
  } catch (err) {
    console.warn('No se pudo descomprimir el mapa desde el enlace:', err);
  }
  return null;
}

/**
 * Genera un ID de sala único y ultra-corto (6 caracteres alfanuméricos)
 * Ej: 'k7x9p2', 'm4b8c1'
 */
export function generateShortRoomId(): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Publica una snapshot completa con bandera retain: true en el broker MQTT
 * para que cualquier dispositivo que abra el enlace corto reciba el mapa
 */
export function broadcastProjectSnapshotImmediate(roomId: string, project: OrganizerProject) {
  if (!roomId || !project || !project.nodes || project.nodes.length === 0) return;
  const topic = `synapse_map/v1/${roomId}`;
  const myInfo = getMyCollaboratorInfo();
  const payload = JSON.stringify({
    type: 'STATE_SNAPSHOT',
    sender: myInfo,
    project: {
      ...project,
      shareRoomId: roomId,
      updatedAt: project.updatedAt || Date.now(),
    },
    timestamp: Date.now(),
  });

  if (session.client && session.client.connected && session.roomId === roomId) {
    session.client.publish(topic, payload, { qos: 1, retain: true });
    return;
  }

  try {
    const tempClient = mqtt.connect(BROKER_SERVERS[0], {
      clientId: `snap_${myInfo.id}_${Math.random().toString(36).slice(2, 6)}`,
      clean: true,
      connectTimeout: 4000,
    });
    tempClient.on('connect', () => {
      tempClient.publish(topic, payload, { qos: 1, retain: true }, () => {
        tempClient.end(false);
      });
    });
  } catch (err) {
    console.warn('Error publicando snapshot retenida en broker:', err);
  }
}

/**
 * Construye el enlace de compartición único ultra-corto (menos de 50 caracteres, < 1 línea)
 * Formato: https://mindmap-chi-nine.vercel.app/?r=k7x9p2
 */
export async function buildShareUrl(project: OrganizerProject, roomId: string): Promise<string> {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://mindmap-chi-nine.vercel.app';
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  // Asegurar que el estado actual quede retenido en el broker para nuevos suscriptores
  if (project && project.nodes && project.nodes.length > 0) {
    broadcastProjectSnapshotImmediate(roomId, project);
  }

  // Enlace ultra-corto de menos de una sola línea
  return `${origin}${path}?r=${encodeURIComponent(roomId)}`;
}

export type CollaborationStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

interface CollabClientSession {
  client: MqttClient | null;
  roomId: string | null;
  status: CollaborationStatus;
  collaborators: Map<string, CollaboratorInfo>;
  onProjectUpdate?: (project: OrganizerProject) => void;
  onStatusChange?: (status: CollaborationStatus, count: number) => void;
  getCurrentProject?: () => OrganizerProject | null;
  heartbeatTimer?: ReturnType<typeof setInterval>;
}

const session: CollabClientSession = {
  client: null,
  roomId: null,
  status: 'disconnected',
  collaborators: new Map(),
};

/**
 * Conecta el dispositivo a la sala de sincronización en tiempo real
 */
export function connectToRoom(
  roomId: string,
  initialProject: OrganizerProject,
  onRemoteProjectUpdate: (project: OrganizerProject) => void,
  onStatusChange?: (status: CollaborationStatus, activeCount: number) => void,
  getCurrentProject?: () => OrganizerProject | null
) {
  if (session.roomId === roomId && session.client?.connected) {
    session.onProjectUpdate = onRemoteProjectUpdate;
    session.onStatusChange = onStatusChange;
    session.getCurrentProject = getCurrentProject;
    return;
  }

  // Cerrar sesión anterior si la había
  disconnectFromRoom();

  session.roomId = roomId;
  session.onProjectUpdate = onRemoteProjectUpdate;
  session.onStatusChange = onStatusChange;
  session.getCurrentProject = getCurrentProject;
  session.status = 'connecting';
  session.collaborators.clear();

  const myInfo = getMyCollaboratorInfo();
  session.collaborators.set(myInfo.id, myInfo);
  session.onStatusChange?.('connecting', 1);

  const topic = `synapse_map/v1/${roomId}`;
  const brokerUrl = BROKER_SERVERS[0];

  try {
    const client = mqtt.connect(brokerUrl, {
      clientId: `mindmap_${myInfo.id}_${Math.random().toString(36).slice(2, 6)}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2500,
      keepalive: 30,
    });

    session.client = client;

    client.on('connect', () => {
      session.status = 'connected';
      session.onStatusChange?.('connected', session.collaborators.size);

      // Suscribirse al topic único de la sala
      client.subscribe(topic, { qos: 1 }, err => {
        if (!err) {
          // Anunciar presencia
          client.publish(
            topic,
            JSON.stringify({
              type: 'PING',
              sender: myInfo,
              timestamp: Date.now(),
            }),
            { qos: 0 }
          );

          // Si el mapa local tiene contenido, enviar una snapshot inicial retenida
          if (initialProject && initialProject.nodes && initialProject.nodes.length > 0) {
            client.publish(
              topic,
              JSON.stringify({
                type: 'STATE_SNAPSHOT',
                sender: myInfo,
                project: initialProject,
                timestamp: initialProject.updatedAt || Date.now(),
              }),
              { qos: 1, retain: true }
            );
          } else {
            // Si el dispositivo está vacío (abriendo enlace corto por primera vez),
            // solicitar sincronización activa a los demás dispositivos en línea
            client.publish(
              topic,
              JSON.stringify({
                type: 'SYNC_REQUEST',
                sender: myInfo,
                timestamp: Date.now(),
              }),
              { qos: 1 }
            );
          }
        }
      });

      // Latido periódico para mantener activa la lista de participantes en vivo
      if (session.heartbeatTimer) clearInterval(session.heartbeatTimer);
      session.heartbeatTimer = setInterval(() => {
        if (client.connected) {
          client.publish(
            topic,
            JSON.stringify({
              type: 'PING',
              sender: getMyCollaboratorInfo(),
              timestamp: Date.now(),
            }),
            { qos: 0 }
          );
        }

        // Limpiar participantes inactivos por más de 25 segundos
        const now = Date.now();
        let changed = false;
        session.collaborators.forEach((c, id) => {
          if (id !== myInfo.id && now - c.lastSeen > 25000) {
            session.collaborators.delete(id);
            changed = true;
          }
        });
        if (changed) {
          session.onStatusChange?.('connected', session.collaborators.size);
        }
      }, 8000);
    });

    client.on('reconnect', () => {
      session.status = 'reconnecting';
      session.onStatusChange?.('reconnecting', session.collaborators.size);
    });

    client.on('error', err => {
      console.warn('Error en conexión de colaboración MQTT:', err);
      session.status = 'error';
      session.onStatusChange?.('error', session.collaborators.size);
    });

    client.on('message', (_topic, payload) => {
      try {
        const msg = JSON.parse(payload.toString());
        if (!msg || typeof msg !== 'object') return;

        const myId = getMyCollaboratorInfo().id;

        // 1. Mensaje de presencia / ping
        if (msg.type === 'PING' && msg.sender) {
          if (msg.sender.id !== myId) {
            session.collaborators.set(msg.sender.id, {
              ...msg.sender,
              lastSeen: Date.now(),
            });
            session.onStatusChange?.('connected', session.collaborators.size);

            // Responder con PONG para que el recién llegado sepa que estamos aquí
            client.publish(
              topic,
              JSON.stringify({
                type: 'PONG',
                sender: getMyCollaboratorInfo(),
                timestamp: Date.now(),
              }),
              { qos: 0 }
            );

            // Si el cliente actual tiene el mapa cargado, responder además con la snapshot
            const cur = session.getCurrentProject ? session.getCurrentProject() : initialProject;
            if (cur && cur.nodes && cur.nodes.length > 0) {
              client.publish(
                topic,
                JSON.stringify({
                  type: 'STATE_SNAPSHOT',
                  sender: myInfo,
                  project: cur,
                  timestamp: cur.updatedAt || Date.now(),
                }),
                { qos: 1, retain: true }
              );
            }
          }
          return;
        }

        if (msg.type === 'PONG' && msg.sender) {
          if (msg.sender.id !== myId) {
            session.collaborators.set(msg.sender.id, {
              ...msg.sender,
              lastSeen: Date.now(),
            });
            session.onStatusChange?.('connected', session.collaborators.size);
          }
          return;
        }

        // 2. Solicitud explícita de sincronización de un nuevo dispositivo
        if (msg.type === 'SYNC_REQUEST') {
          if (msg.sender?.id !== myId) {
            const cur = session.getCurrentProject ? session.getCurrentProject() : initialProject;
            if (cur && cur.nodes && cur.nodes.length > 0) {
              client.publish(
                topic,
                JSON.stringify({
                  type: 'STATE_SNAPSHOT',
                  sender: myInfo,
                  project: cur,
                  timestamp: cur.updatedAt || Date.now(),
                }),
                { qos: 1, retain: true }
              );
            }
          }
          return;
        }

        // 2. Mensaje de actualización de proyecto
        if (
          (msg.type === 'PROJECT_UPDATE' || msg.type === 'STATE_SNAPSHOT') &&
          msg.project
        ) {
          // Ignorar actualizaciones emitidas por este mismo dispositivo
          if (msg.sender?.id === myId) return;

          // Registrar presencia del remitente
          if (msg.sender?.id) {
            session.collaborators.set(msg.sender.id, {
              ...msg.sender,
              lastSeen: Date.now(),
            });
            session.onStatusChange?.('connected', session.collaborators.size);
          }

          // Notificar a React con el proyecto actualizado
          session.onProjectUpdate?.(msg.project);
        }
      } catch (err) {
        console.warn('Error procesando mensaje de sincronización:', err);
      }
    });
  } catch (err) {
    console.warn('No se pudo inicializar cliente MQTT de colaboración:', err);
    session.status = 'error';
    session.onStatusChange?.('error', 1);
  }
}

/**
 * Emite una actualización del mapa a todos los dispositivos en la sala
 */
let broadcastDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastBroadcastTimestamp = 0;

export function broadcastProjectUpdate(project: OrganizerProject) {
  if (!session.client || !session.client.connected || !session.roomId) {
    return;
  }

  const topic = `synapse_map/v1/${session.roomId}`;
  const myInfo = getMyCollaboratorInfo();

  if (broadcastDebounceTimer) clearTimeout(broadcastDebounceTimer);

  broadcastDebounceTimer = setTimeout(() => {
    const now = Date.now();
    lastBroadcastTimestamp = now;

    const payload = JSON.stringify({
      type: 'PROJECT_UPDATE',
      sender: myInfo,
      project: {
        ...project,
        shareRoomId: session.roomId,
        updatedAt: now,
      },
      timestamp: now,
    });

    session.client?.publish(topic, payload, { qos: 1, retain: true });
  }, 120);
}

/**
 * Cierra la sala de colaboración
 */
export function disconnectFromRoom() {
  if (session.heartbeatTimer) {
    clearInterval(session.heartbeatTimer);
    session.heartbeatTimer = undefined;
  }
  if (broadcastDebounceTimer) {
    clearTimeout(broadcastDebounceTimer);
    broadcastDebounceTimer = null;
  }
  if (session.client) {
    try {
      session.client.end(true);
    } catch {}
    session.client = null;
  }
  session.roomId = null;
  session.status = 'disconnected';
  session.collaborators.clear();
  session.onStatusChange?.('disconnected', 0);
}
