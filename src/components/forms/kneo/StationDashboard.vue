<style scoped>
  * {
    box-sizing: border-box;
  }

  .metric-dashboard {
    min-height: 100vh;
    background: #0f0f1e;
    color: #eee;
    padding: 28px;
    font-family: 'Inter', 'Segoe UI', sans-serif;
  }

  .metric-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .metric-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .metric-header h1 {
    margin: 0;
    font-size: 2.4rem;
    letter-spacing: 1px;
    color: #00d4aa;
  }

  .status-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .status-chip {
    display: inline-flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 18px;
    border-radius: 18px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid #2a2a4a;
    min-width: 200px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  }

  .status-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #8f9bb3;
  }

  .status-value {
    font-size: 1.4rem;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .status-pill {
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .status-pill.connected {
    background: #00d4aa;
    color: #0f0f1e;
  }

  .status-pill.connecting {
    background: #f39c12;
    color: #0f0f1e;
  }

  .status-pill.disconnected {
    background: #e74c3c;
    color: #fff;
  }

  .songs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px;
  }

  .songs-card {
    padding: 20px;
    border-radius: 16px;
    background: #0f0f1e;
    border: 1px solid #2a2a4a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  .song-item {
    border: 1px solid #2a2a4a;
    border-radius: 12px;
    padding: 14px;
    margin-top: 10px;
    background: linear-gradient(135deg, #181830 0%, #141428 100%);
  }

  .song-title {
    font-size: 1rem;
    font-weight: 600;
  }

  .song-meta {
    margin-top: 6px;
    font-size: 0.85rem;
    color: #8f9bb3;
  }

  .empty-state {
    margin-top: 40px;
    padding: 36px;
    border-radius: 16px;
    border: 1px dashed rgba(255, 255, 255, 0.12);
    text-align: center;
    color: #666;
    font-style: italic;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>

<template>
  <div class="metric-dashboard">
    <div class="metric-container">
      <div class="metric-header">
        <h1>{{ brandName }}</h1>
        <div class="status-row">
          <div class="status-pill" :class="statusPillClass">
            {{ statusPillText }}
          </div>
          <div class="status-chip">
            <span class="status-label">Status</span>
            <span class="status-value">{{ statusText }}</span>
            <span class="queue-meta">Zone: {{ stationDetails?.zoneId || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <div class="songs-grid">
        <div class="songs-card">
          <div class="queue-title">Regular Queue Songs</div>
          <div v-if="regularQueueSongs.length === 0" class="queue-meta">Queue empty</div>
          <div v-for="song in regularQueueSongs" :key="song.songId" class="song-item">
            <div class="song-title">{{ formatSongTitle(song) }}</div>
            <div class="song-meta">
              {{ song.artist || 'Unknown Artist' }}
              <span v-if="song.duration"> · {{ song.duration }}s</span>
            </div>
          </div>
        </div>
        <div class="songs-card">
          <div class="queue-title">Prioritized Queue Songs</div>
          <div v-if="prioritizedQueueSongs.length === 0" class="queue-meta">Queue empty</div>
          <div v-for="song in prioritizedQueueSongs" :key="song.songId" class="song-item">
            <div class="song-title">{{ formatSongTitle(song) }}</div>
            <div class="song-meta">
              {{ song.artist || 'Unknown Artist' }}
              <span v-if="song.duration"> · {{ song.duration }}s</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-if="!hasQueueData">
        Waiting for queue data...
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted } from 'vue';
import { useDashboardStore } from '../../../stores/kneo/dashboardStore';

type QueueSong = {
  duration: number | null;
  itemType: string | null;
  artist: string | null;
  album: string | null;
  genre: string | null;
  title: string | null;
  languageCode: string | null;
  songId: string;
};

export default defineComponent({
  name: 'StationDashboard',
  props: {
    brandName: {
      type: String,
      required: true
    }
  },
  setup(props: { brandName: string }) {
    const dashboardStore = useDashboardStore();

    const stationDetails = computed(() => {
      return dashboardStore.getStationDetails(props.brandName);
    });

    const lastUpdateTime = computed(() => {
      const lastUpdate = dashboardStore.getStationLastUpdate(props.brandName);
      return lastUpdate?.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) ?? 'N/A';
    });

    const regularQueueSongs = computed<QueueSong[]>(() => stationDetails.value?.regularQueueSongs ?? []);
    const prioritizedQueueSongs = computed<QueueSong[]>(() => stationDetails.value?.prioritizedQueueSongs ?? []);

    const regularQueueLength = computed(() => regularQueueSongs.value.length ?? (stationDetails.value?.regularQueueSize ?? stationDetails.value?.queueSize ?? 0));
    const prioritizedQueueLength = computed(() => prioritizedQueueSongs.value.length ?? (stationDetails.value?.prioritizedQueueSize ?? 0));

    const statusText = computed(() => stationDetails.value?.status?.replace(/_/g, ' ') ?? 'Unknown');

    const statusPillClass = computed(() => {
      switch (stationDetails.value?.status) {
        case 'ON_LINE':
        case 'QUEUE_SATURATED':
          return 'status-pill connected';
        case 'WARMING_UP':
        case 'IDLE':
          return 'status-pill connecting';
        default:
          return 'status-pill disconnected';
      }
    });

    const statusPillText = computed(() => {
      switch (stationDetails.value?.status) {
        case 'ON_LINE':
          return 'Connected';
        case 'QUEUE_SATURATED':
          return 'Queue Saturated';
        case 'WARMING_UP':
          return 'Warming Up';
        case 'IDLE':
          return 'Idle';
        case 'SYSTEM_ERROR':
          return 'System Error';
        default:
          return stationDetails.value?.status ? stationDetails.value.status.replace(/_/g, ' ') : 'Disconnected';
      }
    });

    const hasQueueData = computed(() => {
      return (
        regularQueueSongs.value.length > 0 ||
        prioritizedQueueSongs.value.length > 0 ||
        stationDetails.value?.regularQueueSize != null ||
        stationDetails.value?.prioritizedQueueSize != null
      );
    });

    const formatSongTitle = (song: QueueSong) => {
      if (song.title && song.artist) {
        return `${song.title} — ${song.artist}`;
      }
      return song.title || song.artist || 'Untitled';
    };

    onMounted(() => {
      dashboardStore.startStationPolling(props.brandName);
    });

    onUnmounted(() => {
      dashboardStore.stopStationPolling(props.brandName);
    });

    return {
      brandName: props.brandName,
      stationDetails,
      lastUpdateTime,
      regularQueueSongs,
      prioritizedQueueSongs,
      regularQueueLength,
      prioritizedQueueLength,
      statusText,
      statusPillClass,
      statusPillText,
      hasQueueData,
      formatSongTitle
    };
  }
});
</script>
