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
              <n-icon><Play /></n-icon>
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
              <n-icon><Stop /></n-icon>
            </template>
            Stop Station
          </n-button>
        </n-space>
        
        <n-space vertical size="large">
          <n-space size="large">
            <n-card title="Live Playlist" style="flex: 1;">
              <n-space vertical size="medium">
                <div>
                  <n-text depth="2" style="font-weight: 600; margin-bottom: 8px; display: block;">In Queue:</n-text>
                  <div v-if="stationDetails?.playlistManagerStats?.obtainedByPlaylist && stationDetails.playlistManagerStats.obtainedByPlaylist.length > 0">
                    <n-space vertical size="small">
                      <div
                        v-for="(fragment, index) in stationDetails.playlistManagerStats.obtainedByPlaylist"
                        :key="index"
                        style="padding-left: 8px; border-left: 2px solid #e8e8e8; font-size: 0.875rem;"
                      >
                        <n-text depth="3">{{ index + 1 }}. {{ cleanTitle(fragment) }}</n-text>
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
                        style="padding-left: 8px; border-left: 2px solid #e8e8e8; font-size: 0.875rem;"
                      >
                        <n-text depth="3">{{ index + 1 }}. {{ cleanTitle(fragment) }}</n-text>
                      </div>
                    </n-space>
                  </div>
                  <n-text depth="3" v-else>No ready to play fragments available.</n-text>
                </div>
              </n-space>
            </n-card>
            
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
                
                <div v-if="timelineDisplay" style="font-family: monospace; font-size: 0.9rem; background-color: #f0f0f0; padding: 10px 15px; border-radius: 4px; border: 1px solid #dcdcdc; white-space: nowrap; overflow-x: auto;">
                  {{ timelineDisplay }}
                </div>
              </n-space>
            </n-card>
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
import {
  PlayerPlay as Play, PlayerStop as Stop, Refresh, Edit, Trash, Calendar,
  Music, Cpu, DeviceDesktop as Memory, Clock, Users, Bulb as BrainIcon
} from '@vicons/tabler';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default defineComponent({
  name: 'StationDetail',
  components: {
    NButton, NCard, NIcon, NTag, NStatistic, NProgress, NSpace, NH2, NText,
    Play, Stop, Refresh, Edit, Trash, Calendar,
    Music, Cpu, Memory, Clock, Users, BrainIcon
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
      const lastUpdate = dashboardStore.getLastUpdate();
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
      return title.replace(/^#+\s*/, '').trim();
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

    const getCurrentTrackTitle = (): string => {
      const songStats = stationDetails.value?.songStatistics;
      if (!songStats) return 'N/A';
      const songKeys = Object.keys(songStats);
      if (songKeys.length === 0) return 'N/A';
      return cleanTitle(songKeys[0]);
    };

    const getCurrentTrackTimestamp = (): number | null => {
      return Date.now() / 1000;
    };

    const getCurrentRequestCount = (): number => {
      const songStats = stationDetails.value?.songStatistics;
      if (!songStats || typeof songStats !== 'object') return 0;
      return songStats.requestCount || 0;
    };

    const getTimelineString = (): string => {
      const timeline = stationDetails.value?.timeline;
      if (!timeline) return 'No timeline data';
      
      const segments = timeline.visibleSegmentSequences || [];
      if (segments.length === 0) return 'No visible segments';
      
      return `Segments: ${segments.join(', ')}`;
    };

    // Timeline helper functions
    const hasTimelineData = (): boolean => {
      return !!(stationDetails.value?.timeline && (
        stationDetails.value.timeline.pastSegmentSequences.length > 0 ||
        stationDetails.value.timeline.visibleSegmentSequences.length > 0 ||
        stationDetails.value.timeline.upcomingSegmentSequences.length > 0
      ));
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

    const getHlsRequestCount = () => {
      const rowData = getRowData()
      if (rowData && typeof rowData.songStatistics === 'object' && rowData.songStatistics !== null) {
        return rowData.songStatistics.requestCount || 0
      }
      return 0
    };

    const getHlsListenersCount = (): number => {
      return currentListeners.value;
    };

    const getPastSegments = (): string[] => {
      // Try to extract segment data from segmentSizeHistory or generate based on current state
      const history = stationDetails.value?.segmentSizeHistory;
      if (history && history.length > 0) {
        // Generate segment numbers based on history length
        const segmentCount = Math.min(history.length, 5); // Show last 5 segments
        const segments = [];
        for (let i = segmentCount; i > 0; i--) {
          segments.push((Date.now() - i * 10000).toString().slice(-4)); // Mock segment IDs
        }
        return segments;
      }
      return [];
    };

    const getVisibleSegments = (): string[] => {
      const queueSize = stationDetails.value?.queueSize || 0;
      if (queueSize > 0) {
        const currentSegment = Date.now().toString().slice(-4);
        return [currentSegment];
      }
      return [];
    };

    const getUpcomingSegments = (): string[] => {
      const queueSize = stationDetails.value?.queueSize || 0;
      if (queueSize > 0) {
        const segments = [];
        for (let i = 1; i <= Math.min(queueSize, 3); i++) {
          segments.push((Date.now() + i * 10000).toString().slice(-4));
        }
        return segments;
      }
      return [];
    };

    const getRowData = () => {
      if (!stationDetails.value) return null;
      
      //console.log('StationDetail getRowData - stationDetails:', stationDetails.value);
      //console.log('StationDetail getRowData - timeline:', stationDetails.value.timeline);
      //console.log('StationDetail getRowData - songStatistics:', stationDetails.value.songStatistics);
      //console.log('StationDetail getRowData - currentListeners:', stationDetails.value.currentListeners);
      
      if (stationDetails.value.timeline) {
        //console.log('StationDetail - timeline pastSegmentSequences:', stationDetails.value.timeline.pastSegmentSequences);
        //console.log('StationDetail - timeline visibleSegmentSequences:', stationDetails.value.timeline.visibleSegmentSequences);
        //console.log('StationDetail - timeline upcomingSegmentSequences:', stationDetails.value.timeline.upcomingSegmentSequences);
      }
      
      const rowData = {
        ...stationDetails.value,
        brandName: props.brandName,
        status: stationDetails.value.status,
        managedBy: stationDetails.value.managedBy,
        timeline: stationDetails.value.timeline || null,
        hlsSongStats: stationDetails.value.songStatistics || null,
        listenersCount: stationDetails.value.currentListeners
      };
      
      console.log('StationDetail getRowData - result:', rowData);
      return rowData;
    };

    onMounted(() => {
      console.log('StationDetail mounted for brand:', props.brandName);
      dashboardStore.ensureStationConnected(props.brandName);
    });

    onUnmounted(() => {
      console.log('StationDetail unmounted for brand:', props.brandName);
    });

    watch(() => stationDetails.value?.timeline, (newTimeline, oldTimeline) => {
      console.log('StationDetail timeline changed:', {
        brand: props.brandName,
        old: oldTimeline,
        new: newTimeline
      });
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
      formatHlsTimestamp,
      getCurrentTrackTitle,
      getCurrentTrackTimestamp,
      getCurrentRequestCount,
      getTimelineString,
      hasTimelineData,
      hasHlsSongStats,
      getHlsCurrentTrack,
      getHlsTimestamp,
      getHlsRequestCount,
      getHlsListenersCount,
      getPastSegments,
      getVisibleSegments,
      getUpcomingSegments,
      getRowData
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
