<template>
  <n-space vertical size="large" style="padding: 24px;">
    <n-card>
      <n-space vertical size="medium">
        <n-h2 style="margin: 0;">{{ brandName }} Dashboard</n-h2>
        <n-space align="center" size="small">
          <n-tag :type="getStatusInfo.type" size="small">
            {{ getStatusInfo.text }}
          </n-tag>
          <n-text depth="3" style="font-size: 14px;">
            {{ currentListeners }} listeners
          </n-text>
        </n-space>
        <n-space size="medium">
          <n-button
              type="primary"
              size="medium"
              :loading="isStartingStation"
              :disabled="isOnline"
              @click="handleStart">
            <template #icon>
              <n-icon><PlayerPlay /></n-icon>
            </template>
            Start Station
          </n-button>
          <n-button
              type="error"
              size="medium"
              :loading="isStoppingStation"
              :disabled="!isOnline"
              @click="handleStop">
            <template #icon>
              <n-icon><PlayerStop /></n-icon>
            </template>
            Stop Station
          </n-button>
        </n-space>

        <n-space vertical size="large">
          <n-space size="large">
            <n-card title="Live Playlist" size="small" style="flex: 1; min-width: 0;">
              <n-space vertical size="medium">
                <div>
                  <n-text depth="2" style="font-weight: 600; margin-bottom: 8px; display: block;">In Queue:</n-text>
                  <div v-if="stationDetails?.playlistManagerStats?.obtainedByPlaylist && stationDetails.playlistManagerStats.obtainedByPlaylist.length > 0">
                    <n-space vertical size="small">
                      <div
                          v-for="(fragment, index) in stationDetails.playlistManagerStats.obtainedByPlaylist"
                          :key="index"
                          :style="{
                            paddingLeft: '8px',
                            borderLeft: '2px solid #e8e8e8',
                            fontSize: '0.875rem',
                            backgroundColor: isCurrentSong(fragment) ? '#e6f7ff' : 'transparent',
                            padding: isCurrentSong(fragment) ? '4px 8px' : '0 0 0 8px',
                            borderRadius: isCurrentSong(fragment) ? '4px' : '0',
                            fontWeight: isCurrentSong(fragment) ? '600' : 'normal'
                          }"
                      >
                        <n-text :depth="isCurrentSong(fragment) ? 1 : 3">{{ index + 1 }}. {{ cleanTitle(fragment) }}</n-text>
                      </div>
                    </n-space>
                  </div>
                  <n-text depth="3" v-else>No played fragments available.</n-text>
                </div>

                <div>
                  <n-text depth="2" style="font-weight: 600; margin-bottom: 8px; display: block;">Ready to be queued:</n-text>
                  <div v-if="stationDetails?.playlistManagerStats?.readyToBeConsumed && stationDetails.playlistManagerStats.readyToBeConsumed.length > 0">
                    <n-space vertical size="small">
                      <div
                          v-for="(fragment, index) in stationDetails.playlistManagerStats.readyToBeConsumed"
                          :key="index"
                          :style="{
                            paddingLeft: '8px',
                            borderLeft: '2px solid #e8e8e8',
                            fontSize: '0.875rem',
                            backgroundColor: isCurrentSong(fragment) ? '#e6f7ff' : 'transparent',
                            padding: isCurrentSong(fragment) ? '4px 8px' : '0 0 0 8px',
                            borderRadius: isCurrentSong(fragment) ? '4px' : '0',
                            fontWeight: isCurrentSong(fragment) ? '600' : 'normal'
                          }"
                      >
                        <n-text :depth="isCurrentSong(fragment) ? 1 : 3">{{ index + 1 }}. {{ cleanTitle(fragment) }}</n-text>
                      </div>
                    </n-space>
                  </div>
                  <n-text depth="3" v-else>No ready to play fragments available.</n-text>
                </div>
              </n-space>
            </n-card>

            <div style="flex-shrink: 0; width: auto;">
              <n-card size="small">
                <template #header>
                  <n-space justify="space-between" align="center">
                    <span>Segments Timeline</span>
                    <n-text depth="3" style="font-size: 0.85rem;">Updated: {{ lastUpdateTime }}</n-text>
                  </n-space>
                </template>
                <n-space vertical size="small">
                  <div v-if="hasHlsSongStats()">
                    <n-space vertical size="small" style="padding: 12px; background-color: #f9f9f9; border-radius: 6px;">
                      <n-space justify="space-between">
                        <n-text strong>Current Track:</n-text>
                        <span class="song-title" :title="cleanTitle(getHlsCurrentTrack())">{{ getHlsCurrentTrack() }}</span>
                      </n-space>
                      <n-space justify="space-between">
                        <n-text strong>Est. Time:</n-text>
                        <n-text>{{ getHlsTimestamp() }}</n-text>
                      </n-space>
                      <n-space justify="space-between">
                        <n-text strong>Recent Requests:</n-text>
                        <n-space align="center" size="small">
                          <n-text>{{ getHlsRequestCount() }}</n-text>
                          <n-text depth="3" style="font-size: 0.9em;">/ 5min</n-text>
                          <span v-if="getHlsRequestCount() > 0" style="color: #28a745; font-size: 1.2em; animation: pulse 1.5s infinite ease-in-out;">●</span>
                        </n-space>
                      </n-space>
                      <n-space justify="space-between">
                        <n-text strong>Est. Listeners:</n-text>
                        <n-text v-if="getHlsListenersCount() === -1" depth="3" title="Cannot determine listeners (check config/duration)">N/A</n-text>
                        <n-text v-else>{{ getHlsListenersCount() }}</n-text>
                      </n-space>
                    </n-space>
                  </div>
                </n-space>
              </n-card>
            </div>

            <div v-if="timelineDisplay" style="flex-shrink: 0; width: auto;">
              <n-card size="small" title="Timeline">
                <div style="font-family: monospace; font-size: 0.9rem; background-color: #f0f0f0; padding: 10px 15px; border-radius: 4px; border: 1px solid #dcdcdc; white-space: nowrap; overflow-x: auto;">
                  {{ timelineDisplay }}
                </div>
              </n-card>
            </div>
          </n-space>
        </n-space>
      </n-space>
    </n-card>
  </n-space>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useDashboardStore } from '../../../stores/kneo/dashboardStore';
import {
  NButton, NCard, NIcon, NTag, NStatistic, NProgress, NSpace, NH2, NText,
  useMessage
} from 'naive-ui';
import { PlayerPlay, PlayerStop } from '@vicons/tabler';

export default defineComponent({
  name: 'StationDetail',
  components: {
    NButton, NCard, NIcon, NTag, NStatistic, NProgress, NSpace, NH2, NText,
    PlayerPlay, PlayerStop
  },
  props: {
    brandName: {
      type: String,
      required: true
    }
  },
  setup(props: { brandName: string }) {
    const dashboardStore = useDashboardStore();
    const message = useMessage();
    const isStartingStation = ref(false);
    const isStoppingStation = ref(false);
    const stationDetails = computed(() => {
      return dashboardStore.getStationDetails(props.brandName);
    });

    const isOnline = computed(() => {
      return stationDetails.value?.status === 'ON_LINE';
    });

    const currentListeners = computed(() => {
      return stationDetails.value?.currentListeners || 0;
    });

    const lastUpdateTime = computed(() => {
      const lastUpdate = dashboardStore.getStationLastUpdate(props.brandName);
      if (!lastUpdate) return 'N/A';
      return lastUpdate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    });

    const timelineDisplay = computed(() => {
      const timeline = stationDetails.value?.timeline;
      if (!timeline) return null;

      const parts = [];

      if (timeline.pastSegmentSequences?.length > 0) {
        parts.push(timeline.pastSegmentSequences.join('-'));
        parts.push('-');
      }

      parts.push('||>');

      if (timeline.visibleSegmentSequences?.length > 0) {
        parts.push(timeline.visibleSegmentSequences.join('-'));
      } else {
        parts.push('(empty)');
      }

      parts.push('<||');

      if (timeline.upcomingSegmentSequences?.length > 0) {
        parts.push('-');
        parts.push(timeline.upcomingSegmentSequences.join('-'));
      }

      return parts.join(' ');
    });

    const stationColor = computed(() => {
      const status = stationDetails.value?.status;
      switch (status) {
        case 'ON_LINE': return '#18a058';
        case 'WARMING_UP': return '#f0a020';
        case 'WAITING_FOR_CURATOR': return '#f0a020';
        case 'IDLE': return '#d03050';
        case 'SYSTEM_ERROR': return '#d03050';
        case 'OFF_LINE':
        default: return '#606266';
      }
    });

    const getStatusInfo = computed(() => {
      const status = stationDetails.value?.status;
      switch (status) {
        case 'ON_LINE':
          return { text: 'Online', type: 'success' as const };
        case 'WARMING_UP':
          return { text: 'Warming Up', type: 'warning' as const };
        case 'WAITING_FOR_CURATOR':
          return { text: 'Waiting for Curator', type: 'warning' as const };
        case 'IDLE':
          return { text: 'Idle', type: 'error' as const };
        case 'SYSTEM_ERROR':
          return { text: 'System Error', type: 'error' as const };
        case 'OFF_LINE':
        default:
          return { text: 'Offline', type: 'default' as const };
      }
    });

    const managedByInfo = computed(() => {
      const managedBy = stationDetails.value?.managedBy;
      switch (managedBy) {
        case 'AI_AGENT':
          return { text: 'AI-managed', type: 'info' as const };
        case 'ITSELF':
          return { text: 'Self-managed', type: 'default' as const };
        default:
          return { text: managedBy || 'Unknown', type: 'default' as const };
      }
    });

    const stationInitials = computed(() => {
      return props.brandName.substring(0, 2).toUpperCase();
    });

    const sendCommand = async (brandName: string, command: string) => {
      try {
        const success = await dashboardStore.triggerBroadcastAction(brandName, command);
        if (success) {
          message.success(`${command} command sent successfully`);
        } else {
          message.error(`Failed to send ${command} command`);
        }
      } catch (error) {
        console.error(`Error sending ${command} command:`, error);
        message.error(`Error sending ${command} command`);
      }
    };

    const handleStart = async () => {
      if (isStartingStation.value) return;
      isStartingStation.value = true;
      try {
        await sendCommand(props.brandName, 'start');
      } finally {
        isStartingStation.value = false;
      }
    };

    const handleStop = async () => {
      if (isStoppingStation.value) return;
      isStoppingStation.value = true;
      try {
        await sendCommand(props.brandName, 'stop');
      } finally {
        isStoppingStation.value = false;
      }
    };

    const cleanTitle = (title: string | undefined | null): string => {
      if (!title) return 'N/A';
      return title.replace(/^(#+|--+)\s*/, '').replace(/[#-]/g, '-').trim();
    };

    const hasHlsSongStats = (): boolean => {
      return !!(stationDetails.value?.songStatistics && Object.keys(stationDetails.value.songStatistics).length > 0);
    };

    const getHlsCurrentTrack = (): string => {
      const songStats = stationDetails.value?.songStatistics;
      if (!songStats) return 'N/A';
      return cleanTitle(songStats.title);
    };

    const getHlsTimestamp = (): string => {
      const songStats = stationDetails.value?.songStatistics;
      if (!songStats) return 'N/A';
      return formatHlsTimestamp(songStats.segmentTimestamp);
    };

    const formatHlsTimestamp = (timestampSeconds: number | undefined | null): string => {
      if (!timestampSeconds) return 'N/A';
      try {
        const date = new Date(timestampSeconds * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch (e) {
        return 'Invalid Date';
      }
    };

    const getHlsRequestCount = () => {
      if (stationDetails.value && typeof stationDetails.value.songStatistics === 'object' && stationDetails.value.songStatistics !== null) {
        return stationDetails.value.songStatistics.requestCount || 0;
      }
      return 0;
    };

    const getHlsListenersCount = (): number => {
      return currentListeners.value;
    };

    const isCurrentSong = (fragment: string): boolean => {
      const currentTrack = getHlsCurrentTrack();
      if (!currentTrack || currentTrack === 'N/A') return false;
      const cleanFragment = cleanTitle(fragment);
      return cleanFragment === currentTrack;
    };

    onMounted(() => {
      console.log('StationDetail mounted for brand:', props.brandName);

      // Connect to station WebSocket
      dashboardStore.ensureStationConnected(props.brandName);

      // Add polling as backup (same pattern as global dashboard)
      const intervalId = setInterval(() => {
        dashboardStore.fetchStation(props.brandName);
      }, 3000); // Same 3-second interval as global

      onUnmounted(() => {
        console.log('StationDetail unmounted for brand:', props.brandName);

        // Cleanup polling
        clearInterval(intervalId);

        // Disconnect station WebSocket
        dashboardStore.disconnectStation(props.brandName);
      });
    });

    onUnmounted(() => {
      console.log('StationDetail unmounted for brand:', props.brandName);
    });

    watch(() => stationDetails.value?.timeline, () => {
      // Timeline changed - no logging needed
    }, { deep: true });

    return {
      stationDetails,
      isOnline,
      currentListeners,
      lastUpdateTime,
      timelineDisplay,
      stationColor,
      getStatusInfo,
      managedByInfo,
      stationInitials,
      handleStart,
      handleStop,
      isStartingStation,
      isStoppingStation,
      cleanTitle,
      hasHlsSongStats,
      getHlsCurrentTrack,
      getHlsTimestamp,
      getHlsRequestCount,
      getHlsListenersCount,
      isCurrentSong
    };
  },
});
</script>

<style scoped>
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}
</style>