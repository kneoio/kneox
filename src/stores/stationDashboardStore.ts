import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import keycloak from '../keycloakFactory';

export type QueueSong = {
  duration: number | null;
  itemType: string | null;
  artist: string | null;
  album: string | null;
  genre: string | null;
  title: string | null;
  languageCode: string | null;
  songId: string;
};

export type StationDetails = {
  status: string;
  zoneId?: string;
  regularQueueSongs: QueueSong[];
  prioritizedQueueSongs: QueueSong[];
  regularQueueSize?: number;
  prioritizedQueueSize?: number;
};

function songsEqual(a: QueueSong[], b: QueueSong[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((s, i) => s.songId === b[i].songId);
}

export const useStationDashboardStore = defineStore('stationDashboardStore', () => {
  // ── state ──────────────────────────────────────────────
  const stationDetails = ref<StationDetails>({
    status: '',
    zoneId: undefined,
    regularQueueSongs: [],
    prioritizedQueueSongs: [],
  });
  const lastUpdateTime = ref<string>('N/A');
  const isConnected = ref(false);

  // ── WebSocket ──────────────────────────────────────────
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let currentBrandName: string | null = null;

  const applyUpdate = (incoming: StationDetails) => {
    // only mutate fields that changed — avoids triggering watchers/re-renders unnecessarily
    if (incoming.status !== stationDetails.value.status) {
      stationDetails.value.status = incoming.status;
    }
    if (incoming.zoneId !== stationDetails.value.zoneId) {
      stationDetails.value.zoneId = incoming.zoneId;
    }
    if (incoming.regularQueueSize !== stationDetails.value.regularQueueSize) {
      stationDetails.value.regularQueueSize = incoming.regularQueueSize;
    }
    if (incoming.prioritizedQueueSize !== stationDetails.value.prioritizedQueueSize) {
      stationDetails.value.prioritizedQueueSize = incoming.prioritizedQueueSize;
    }
    // only replace song arrays when content actually differs (avoids TransitionGroup churn)
    if (!songsEqual(incoming.regularQueueSongs, stationDetails.value.regularQueueSongs)) {
      stationDetails.value.regularQueueSongs = incoming.regularQueueSongs;
    }
    if (!songsEqual(incoming.prioritizedQueueSongs, stationDetails.value.prioritizedQueueSongs)) {
      stationDetails.value.prioritizedQueueSongs = incoming.prioritizedQueueSongs;
    }
  };

  const connect = (brandName: string) => {
    // Clear any pending reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // Close any existing connection first
    if (ws) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        return;
      }
      ws.close();
      ws = null;
    }

    currentBrandName = brandName;
    // Reset state for new connection
    stationDetails.value = {
      status: '',
      zoneId: undefined,
      regularQueueSongs: [],
      prioritizedQueueSongs: [],
      regularQueueSize: undefined,
      prioritizedQueueSize: undefined,
    };
    lastUpdateTime.value = 'N/A';

    const metriqServer = import.meta.env.VITE_METRIQ_SERVER || `http://${window.location.host}`;
    const url = new URL(metriqServer);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const basePath = url.pathname.replace(/\/$/, '');
    const token = keycloak.token;
    let wsUrl = `${wsProtocol}//${url.host}${basePath}/ws/metrics/${brandName}`;
    if (token) {
      const separator = wsUrl.includes('?') ? '&' : '?';
      wsUrl = `${wsUrl}${separator}token=${token}`;
    }
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      isConnected.value = true;
      ws?.send(JSON.stringify({ action: 'getStation' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const payload = data.payload ?? data;
        applyUpdate({
          status: payload.status ?? data.type ?? 'UNKNOWN',
          zoneId: payload.zoneId,
          regularQueueSongs: payload.regularQueueSongs ?? [],
          prioritizedQueueSongs: payload.prioritizedQueueSongs ?? [],
          regularQueueSize: payload.regularQueueSize,
          prioritizedQueueSize: payload.prioritizedQueueSize,
        });
        lastUpdateTime.value = new Date().toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
      } catch (e) {
        console.error('StationDashboardStore WS parse error', e);
      }
    };

    ws.onclose = () => {
      isConnected.value = false;
      // Only reconnect if this wasn't an intentional disconnect (currentBrandName still set)
      if (currentBrandName && !reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          if (currentBrandName) {
            connect(currentBrandName);
          }
        }, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error('StationDashboardStore WS error', err);
      ws?.close();
    };
  };

  const disconnect = () => {
    currentBrandName = null;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    ws?.close();
    ws = null;
    isConnected.value = false;
  };

  // ── computed ───────────────────────────────────────────
  const regularQueueSongs = computed<QueueSong[]>(() => stationDetails.value.regularQueueSongs);
  const prioritizedQueueSongs = computed<QueueSong[]>(() => stationDetails.value.prioritizedQueueSongs);
  const regularQueueLength = computed(() => 
    regularQueueSongs.value.length || stationDetails.value.regularQueueSize || 0
  );
  const prioritizedQueueLength = computed(() => 
    prioritizedQueueSongs.value.length || stationDetails.value.prioritizedQueueSize || 0
  );

  const statusPillClass = computed(() => {
    switch (stationDetails.value.status) {
      case 'ON_LINE':
      case 'QUEUE_SATURATED': return 'online';
      case 'WARMING_UP':
      case 'IDLE': return 'warming';
      default: return 'offline';
    }
  });

  const statusPillText = computed(() => {
    switch (stationDetails.value.status) {
      case 'ON_LINE': return 'Online';
      case 'QUEUE_SATURATED': return 'Saturated';
      case 'WARMING_UP': return 'Warming up';
      case 'IDLE': return 'Idle';
      case 'SYSTEM_ERROR': return 'System error';
      default: return stationDetails.value.status?.replace(/_/g, ' ') ?? 'Offline';
    }
  });

  const hasQueueData = computed(() =>
    regularQueueSongs.value.length > 0 ||
    prioritizedQueueSongs.value.length > 0 ||
    stationDetails.value.regularQueueSize != null
  );

  return {
    // state
    stationDetails,
    lastUpdateTime,
    isConnected,
    // actions
    connect,
    disconnect,
    // computed
    regularQueueSongs,
    prioritizedQueueSongs,
    regularQueueLength,
    prioritizedQueueLength,
    statusPillClass,
    statusPillText,
    hasQueueData,
  };
});
