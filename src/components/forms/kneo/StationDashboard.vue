<template>
  <n-space vertical size="large" style="padding: 24px;">
    <n-card>
      <n-space vertical size="medium">
        <n-h2 style="margin: 0;">{{ brandName }} Dashboard</n-h2>
        <n-space align="center" size="small">
          <n-tag :type="getStatusInfo.type" size="large" :bordered="false">
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
              <n-icon>
                <PlayerPlay/>
              </n-icon>
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
              <n-icon>
                <PlayerStop/>
              </n-icon>
            </template>
            Stop Station
          </n-button>
          <n-space size="large" style="margin-left: 30px;">
            <a :href="mixplaUrl" target="_blank" rel="noopener noreferrer"
               class="mixpla-link">
              {{ mixplaUrl }}
              <n-icon style="margin-left: 4px; vertical-align: middle;" size="14">
                <ExternalLink/>
              </n-icon>
            </a>
          </n-space>
        </n-space>

        <n-space vertical size="large">
          <n-card title="Status History" size="small">
            <n-timeline horizontal v-if="statusHistoryTimeline.length > 0">
              <n-timeline-item
                v-for="(event, index) in statusHistoryTimeline"
                :key="index"
                :type="getStatusTimelineType(event.status)"
                :title="event.status.replace(/_/g, ' ')"
                :content="formatTimestamp(event.timestamp) + (event.timeDiff ? ' (' + event.timeDiff + ')' : '')"
              />
            </n-timeline>
            <n-text depth="3" v-else>No status history available</n-text>
          </n-card>

          <n-space size="medium">
            <n-card title="Live Playlist" size="small" style="flex: 1; min-width: 0;">
              <n-space vertical size="medium">
                <div>
                  <n-text depth="2" style="font-weight: 600; margin-bottom: 8px; display: block;">In Queue:</n-text>
                  <div
                      v-if="stationDetails?.playlistManagerStats?.obtainedByPlaylist && stationDetails.playlistManagerStats.obtainedByPlaylist.length > 0">
                    <n-space vertical size="small">
                      <div
                          v-for="(fragment, index) in stationDetails.playlistManagerStats.obtainedByPlaylist"
                          :key="index"
                          :style="{
                            paddingLeft: '8px',
                            borderLeft: '2px solid',
                            fontSize: '0.875rem',
                            backgroundColor: isCurrentSong(fragment) ? 'var(--n-color-target)' : 'transparent',
                            padding: isCurrentSong(fragment) ? '4px 8px' : '0 0 0 8px',
                            borderRadius: isCurrentSong(fragment) ? '4px' : '0',
                            fontWeight: isCurrentSong(fragment) ? '600' : 'normal'
                          }"
                      >
                        <n-text :depth="isCurrentSong(fragment) ? 1 : 3"
                                :style="{ color: isCurrentSong(fragment) ? 'white !important' : undefined }">
                          {{ index + 1 }}. {{ cleanTitle(fragment) }}
                        </n-text>
                      </div>
                    </n-space>
                  </div>
                  <n-text depth="3" v-else>No played fragments available.</n-text>
                </div>

                <div>
                  <n-text depth="2" style="font-weight: 600; margin-bottom: 8px; display: block;">Ready to be queued:
                  </n-text>
                  <div
                      v-if="stationDetails?.playlistManagerStats?.readyToBeConsumed && stationDetails.playlistManagerStats.readyToBeConsumed.length > 0">
                    <n-space vertical size="small">
                      <div
                          v-for="(fragment, index) in stationDetails.playlistManagerStats.readyToBeConsumed"
                          :key="index"
                          :style="{
                            paddingLeft: '8px',
                            borderLeft: '2px solid',
                            fontSize: '0.875rem',
                            backgroundColor: isCurrentSong(fragment) ? 'var(--n-color-target)' : 'transparent',
                            padding: isCurrentSong(fragment) ? '4px 8px' : '0 0 0 8px',
                            borderRadius: isCurrentSong(fragment) ? '4px' : '0',
                            fontWeight: isCurrentSong(fragment) ? '600' : 'normal'
                          }"
                      >
                        <n-text :depth="isCurrentSong(fragment) ? 1 : 3"
                                :style="{ color: isCurrentSong(fragment) ? 'white !important' : undefined }">
                          {{ index + 1 }}. {{ cleanTitle(fragment) }}
                        </n-text>
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
                    <n-space vertical size="small" class="current-track-info">
                      <n-space justify="space-between">
                        <n-text strong>Current Track:</n-text>
                        <span class="song-title" :title="cleanTitle(getHlsCurrentTrack())">{{
                            getHlsCurrentTrack()
                          }}</span>
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
                          <span v-if="getHlsRequestCount() > 0">
                            <n-icon size="18" color="green">
                              <Activity/>
                          </n-icon></span>
                        </n-space>
                      </n-space>
                      <n-space justify="space-between">
                        <n-text strong>Est. Listeners:</n-text>
                        <n-text v-if="getHlsListenersCount() === -1" depth="3"
                                title="Cannot determine listeners (check config/duration)">N/A
                        </n-text>
                        <n-text v-else>{{ getHlsListenersCount() }}</n-text>
                      </n-space>
                    </n-space>
                  </div>
                </n-space>
              </n-card>
            </div>

            <div style="flex-shrink: 0; width: auto;">
              <n-card size="small" title="Timeline">
                <n-timeline v-if="timelineItems.length > 0">
                  <n-timeline-item
                      v-for="(item, index) in timelineItems"
                      :key="index"
                      :type="item.type"
                      :title="item.title"
                      :content="item.content"
                  />
                </n-timeline>
                <n-text depth="3" v-else>Station offline - no timeline data</n-text>
              </n-card>
            </div>
          </n-space>
        </n-space>
      </n-space>
    </n-card>
  </n-space>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, onUnmounted, ref, watch} from 'vue';
import {useDashboardStore} from '../../../stores/kneo/dashboardStore';
import {
  NButton,
  NCard,
  NH2,
  NIcon,
  NProgress,
  NSpace,
  NStatistic,
  NTag,
  NText,
  NTimeline,
  NTimelineItem,
  useMessage
} from 'naive-ui';
import {ExternalLink, PlayerPlay, PlayerStop, Activity} from '@vicons/tabler';
import {MIXPLA_URL} from '../../../constants/config';


export default defineComponent({
  name: 'StationDashboard',
  components: {
    NButton, NCard, NIcon, NTag, NStatistic, NProgress, NSpace, NH2, NText,
    NTimeline, NTimelineItem,
    PlayerPlay, PlayerStop, ExternalLink, Activity
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

    const timelineItems = computed(() => {
      const timeline = stationDetails.value?.timeline;
      if (!timeline) return [];

      const items = [];

      if (timeline.pastSegmentSequences?.length > 0) {
        items.push({
          type: 'default' as const,
          title: 'Past Segments',
          content: timeline.pastSegmentSequences.join(', ')
        });
      }

      if (timeline.visibleSegmentSequences?.length > 0) {
        items.push({
          type: 'success' as const,
          title: 'Current Segments',
          content: timeline.visibleSegmentSequences.join(', ')
        });
      }

      if (timeline.upcomingSegmentSequences?.length > 0) {
        items.push({
          type: 'info' as const,
          title: 'Upcoming Segments',
          content: timeline.upcomingSegmentSequences.join(', ')
        });
      }

      return items;
    });

    const stationColor = computed(() => {
      const status = stationDetails.value?.status;
      switch (status) {
        case 'ON_LINE':
          return '#18a058';
        case 'WARMING_UP':
          return '#f0a020';
        case 'WAITING_FOR_CURATOR':
          return '#f0a020';
        case 'IDLE':
          return '#d03050';
        case 'SYSTEM_ERROR':
          return '#d03050';
        case 'OFF_LINE':
        default:
          return '#606266';
      }
    });

    const getStatusInfo = computed(() => {
      const status = stationDetails.value?.status;
      switch (status) {
        case 'ON_LINE':
          return {text: 'Online', type: 'success' as const};
        case 'WARMING_UP':
          return {text: 'Warming Up', type: 'warning' as const};
        case 'WAITING_FOR_CURATOR':
          return {text: 'Waiting for Curator', type: 'warning' as const};
        case 'IDLE':
          return {text: 'Idle', type: 'error' as const};
        case 'SYSTEM_ERROR':
          return {text: 'System Error', type: 'error' as const};
        case 'OFF_LINE':
        default:
          return {text: 'Offline', type: 'default' as const};
      }
    });

    const managedByInfo = computed(() => {
      const managedBy = stationDetails.value?.managedBy;
      switch (managedBy) {
        case 'AI_AGENT':
          return {text: 'AI-managed', type: 'info' as const};
        case 'ITSELF':
          return {text: 'Self-managed', type: 'default' as const};
        default:
          return {text: managedBy || 'Unknown', type: 'default' as const};
      }
    });

    const stationInitials = computed(() => {
      return props.brandName.substring(0, 2).toUpperCase();
    });

    const mixplaUrl = computed(() => {
      return `${MIXPLA_URL}?radio=${encodeURIComponent(props.brandName.toLowerCase())}`;
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

    const openMixpla = () => {
      const mixplaUrl = MIXPLA_URL;
      const url = `${mixplaUrl}?radio=${encodeURIComponent(props.brandName.toLowerCase())}`;
      window.open(url, '_blank', 'noopener,noreferrer');
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
      return formatTimestamp(songStats.segmentTimestamp.toString());
    };

    const formatTimestamp = (timestamp: string): string => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
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

    const getStatusTimelineType = (status: string): 'success' | 'warning' | 'error' | 'default' => {
      switch (status) {
        case 'ON_LINE':
          return 'success';
        case 'WARMING_UP':
        case 'WAITING_FOR_CURATOR':
        case 'IDLE':
          return 'warning';
        case 'SYSTEM_ERROR':
          return 'error';
        case 'OFF_LINE':
        default:
          return 'default';
      }
    };

    const statusHistoryTimeline = computed(() => {
      const history = stationDetails.value?.statusHistory || [];
      const recentHistory = history.slice(-5);

      return recentHistory.map((event, index) => {
        let timeDiff = '';
        if (index > 0) {
          const prevEvent = recentHistory[index - 1];
          const diffMs = new Date(event.timestamp).getTime() - new Date(prevEvent.timestamp).getTime();
          const diffMins = Math.round(diffMs / (1000 * 60));
          timeDiff = `+${diffMins}m`;
        }

        return {
          ...event,
          timeDiff
        };
      });
    });

    let intervalId: NodeJS.Timeout | null = null;

    onMounted(() => {
      console.log('StationDetail mounted for brand:', props.brandName);

      dashboardStore.ensureStationConnected(props.brandName);

      intervalId = setInterval(() => {
        console.log('Polling station data for:', props.brandName);
        dashboardStore.fetchStation(props.brandName);
      }, 3000);
    });

    onUnmounted(() => {
      console.log('StationDetail unmounted for brand:', props.brandName);
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      dashboardStore.disconnectStation(props.brandName);
    });

    watch(() => stationDetails.value?.timeline, () => {
    }, {deep: true});


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
      mixplaUrl,
      handleStart,
      handleStop,
      openMixpla,
      isStartingStation,
      isStoppingStation,
      cleanTitle,
      hasHlsSongStats,
      getHlsCurrentTrack,
      getHlsTimestamp,
      getHlsRequestCount,
      getHlsListenersCount,
      isCurrentSong,
      statusHistoryTimeline,
      getStatusTimelineType,
      timelineItems,
      formatTimestamp,

    };
  },
});
</script>

<style scoped>
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}


</style>