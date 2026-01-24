<style scoped>
  .time-fixed {
    display: inline-block;
    width: 8ch;
    text-align: center;
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1;
  }
</style>

<template>
  <n-space vertical size="large" style="padding: 24px;">
    <n-card>
      <n-space vertical size="medium">
        <n-space align="center" size="medium">
          <n-h2 style="margin: 0; cursor: pointer;" @click="copyBrandNameToClipboard">{{ brandName }}</n-h2>
        </n-space>

        <n-space align="center" size="small">
          <GlowingStatus 
            :online="['ON_LINE', 'QUEUE_SATURATED', 'WARMING_UP', 'IDLE'].includes(stationDetails?.status || '')" 
            :name="getStatusInfo.text" 
            :status="stationDetails?.status" 
          />
          <GlowingStatus 
            :online="isHeartbeatActive" 
            :name="'On Air'" 
            :status="isHeartbeatActive ? 'on_air' : 'off_air'"
          />
          <n-text depth="3" style="font-size: 14px;">
            {{ currentListeners }} listeners
          </n-text>
          <n-text
            strong
            depth="3"
            style="font-size: 16px; margin-left: 8px; font-family: 'Digital Play Italic St', sans-serif; color: #3FB424; text-shadow: 0 0 10px rgba(70, 193, 40, 1), 0 0 18px rgba(70, 193, 40, 0.6); display: inline-block; width: 9ch; white-space: nowrap;"
          >
            <span class="time-fixed">{{ timeWithDot }}</span>
          </n-text>
          <n-text depth="3" style="font-size: 12px; margin-left: 8px;">
            {{ stationDetails?.zoneId }}
          </n-text>
          <n-text depth="3" style="font-size: 12px; margin-left: 8px;">Updated: {{ lastUpdateTime }}</n-text>
        </n-space>
        <n-space >
          <n-button-group>
            <n-button type="primary"  :loading="isStartingStation" :disabled="isOnline"
              @click="handleStart">
              <template #icon>
                <n-icon>
                  <PlayerPlay />
                </n-icon>
              </template>
              Start Station
            </n-button>
            <n-button type="error" :loading="isStoppingStation" :disabled="!(isOnline || stationDetails?.status === 'IDLE')" @click="handleStop">
              <template #icon>
                <n-icon>
                  <PlayerStop />
                </n-icon>
              </template>
              Stop Station
            </n-button>
            <n-button :loading="isRebuildingSchedule" @click="handleRebuildSchedule">
              Rebuild Schedule
            </n-button>
          </n-button-group>
          <n-space size="large" style="margin-left: 30px;">
            <a :href="mixplaUrl" target="_blank" rel="noopener noreferrer" class="mixpla-link">
              {{ mixplaUrl }}
              <n-icon style="margin-left: 4px; vertical-align: middle;" size="14">
                <ExternalLink />
              </n-icon>
            </a>
          </n-space>
          
        </n-space>

        <!-- Day percentage visualization -->
        <n-card size="small" style="margin-top: 16px;">
          <n-text depth="3" style="font-size: 12px; margin-bottom: 8px; display: block;">Day Time Distribution</n-text>
          <div style="display: flex; height: 32px; border-radius: 4px; overflow: hidden; background: #f5f5f5;">
            <div
              v-for="(s, index) in sortedSchedule"
              :key="index"
              :style="{
                width: Math.max(s.dayPercentage * 100, 2) + '%',
                backgroundColor: s.status === 'ACTIVE' ? '#18a058' : (pastSchedule.includes(s) ? '#8b5cf6' : '#2080f0'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: index < sortedSchedule.length - 1 ? '1px solid #fff' : 'none'
              }"
              :title="`${s.sceneTitle}: ${(s.dayPercentage * 100).toFixed(1)}%`"
            >
              <n-space align="center" justify="center" size="small">
                <n-icon v-if="getSceneIcon(s.sceneTitle)" size="14" color="white">
                  <component :is="getSceneIcon(s.sceneTitle)" />
                </n-icon>
                <n-text
                  v-if="s.dayPercentage * 100 > 5"
                  style="color: white; font-size: 11px; font-weight: 500;"
                >
                  {{ (s.dayPercentage * 100).toFixed(0) }}%
                </n-text>
              </n-space>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <n-text depth="3" style="font-size: 11px;">00:00</n-text>
            <n-text depth="3" style="font-size: 11px;">06:00</n-text>
            <n-text depth="3" style="font-size: 11px;">12:00</n-text>
            <n-text depth="3" style="font-size: 11px;">18:00</n-text>
            <n-text depth="3" style="font-size: 11px;">24:00</n-text>
          </div>
        </n-card>

            <n-space vertical size="large">
              <n-card title="Status History" size="small">
                <n-timeline horizontal v-if=" statusHistoryTimeline.length > 0 ">
                  <n-timeline-item v-for=" ( event, index ) in statusHistoryTimeline " :key="index"
                    :type="getStatusTimelineType( event.status )" :title="formatStatus( event.status )"
                    :content="formatTimestamp( event.timestamp ) + ( event.timeDiff ? ' (' + event.timeDiff + ')' : '' )">
                    <template #icon>
                      <GreenLed v-if="getStatusTimelineType(event.status) === 'success' && index === statusHistoryTimeline.length - 1" :active="true" :size="14" />
                      <YellowLed v-else-if="getStatusTimelineType(event.status) === 'warning' && index === statusHistoryTimeline.length - 1" :active="true" :size="14" />
                      <YellowLed v-else-if="getStatusTimelineType(event.status) === 'error' && index === statusHistoryTimeline.length - 1" :active="true" :size="14" />
                      <GreenLed v-else :active="false" :size="14" />
                    </template>
                  </n-timeline-item>
                </n-timeline>
                <n-text depth="3" v-else>No status history available</n-text>
              </n-card>

              <n-space size="medium" style="align-items: flex-start;">
                <n-card title="Live Playlist" size="small" style="width: 400px; flex-shrink: 0;">
                  <n-timeline v-if="combinedPlaylist.length > 0">
                    <n-timeline-item
                      v-for="(fragment, index) in combinedPlaylist"
                      :key="index"
                    >
                      <template #icon>
                        <GreenLed v-if="fragment.isPlayingNow" :active="true" :pulse="true" :size="14" />
                        <YellowLed v-else-if="!fragment.isQueued" :active="true" :size="14" />
                        <GreenLed v-else-if="fragment.isQueued" :active="true" :size="14" />
                        <GreenLed v-else :active="false" :size="14" />
                      </template>
                      <template #default>
                        <div style="max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">
                          {{ formatArtistTitle(fragment) }}
                        </div>
                        <n-space size="small" align="center">
                          <span v-if="fragment.isPlayingNow" class="playing-indicator" aria-label="Playing now">
                            <svg viewBox="0 0 24 14" width="24" height="14" role="img">
                              <rect class="bar b1" x="1" y="2" width="4" height="10" rx="1" />
                              <rect class="bar b2" x="9" y="2" width="4" height="10" rx="1" />
                              <rect class="bar b3" x="17" y="2" width="4" height="10" rx="1" />
                            </svg>
                          </span>
                          <n-tag v-if="!fragment.isQueued" type="warning" size="small">
                            Pending
                          </n-tag>
                          <n-tag v-if="fragment.isQueued" type="info" size="small">
                            Queued
                          </n-tag>
                          <n-text v-if="fragment.duration" depth="3" style="font-size: 0.75rem;">
                            {{ formatDuration(fragment.duration) }}
                          </n-text>
                          <n-tag v-if="getMergingTypeText(fragment).text" size="small" :type="getMergingTypeText(fragment).color">
                            {{ getMergingTypeText(fragment).text }}
                          </n-tag>
                        </n-space>
                      </template>
                    </n-timeline-item>
                  </n-timeline>
                  <n-text depth="3" v-else>No playlist items available.</n-text>
                </n-card>

                <n-card title="Listeners Today" size="small" style="flex: 1; min-width: 0;">
                  <n-space vertical v-if="stationDetails?.listenersByCountry && stationDetails.listenersByCountry.length > 0" size="small">
                    <n-space v-for="(c, idx) in stationDetails.listenersByCountry" :key="idx" justify="space-between" align="center">
                      <n-text strong>{{ c.countryCode }}</n-text>
                      <n-badge :value="c.accessCount" type="info" />
                    </n-space>
                  </n-space>
                  <n-text depth="3" v-else>No listener country stats</n-text>
                </n-card>

                <div style="flex-shrink: 0; width: auto;">
                  <n-card size="small">
                    <template #header>
                      <n-space justify="space-between" align="center">
                        <span>
                          DJ
                          <span v-if="stationDetails?.aiDjStats?.djName"> - {{ stationDetails.aiDjStats.djName }}</span>
                        </span>
                        <n-tag v-if="isDjActive" type="info" size="small">Active</n-tag>
                        <n-tag v-else-if="isDjOffline" type="error" size="small">DJ is offline</n-tag>
                      </n-space>
                    </template>
                    <n-space vertical size="small" v-if="stationDetails?.aiDjStats">
                      <n-space vertical size="small">
                        <n-space justify="space-between">
                          <n-text strong>Current Scene:</n-text>
                          <n-text strong style="font-size: 18px;">{{ currentSchedule?.sceneTitle }}</n-text>
                        </n-space>
                        <n-space justify="space-between" v-if="isDjActive">
                          <n-text depth="3">Time:</n-text>
                          <n-text>{{ formatTime(currentSchedule?.startTime) }} - {{ formatTime(currentSchedule?.endTime) }}</n-text>
                        </n-space>
                        <n-space justify="space-between">
                          <n-text depth="3">Duration:</n-text>
                          <n-text>{{ formatSceneDuration(currentSchedule?.startTime, currentSchedule?.endTime, futureSchedule[0]?.sceneTitle, currentSchedule?.sceneTitle) }}</n-text>
                        </n-space>
                        <n-space justify="space-between">
                          <n-text depth="3">Prompts:</n-text>
                          <n-text>{{ currentSchedule?.songs?.length || 0 }}</n-text>
                        </n-space>
                        <n-space justify="space-between" v-if="isDjActive">
                          <n-text depth="3">Next Scene:</n-text>
                          <n-text>{{ futureSchedule[0]?.sceneTitle }}</n-text>
                        </n-space>
                        <n-space vertical v-if="stationDetails.aiDjStats.messages && stationDetails.aiDjStats.messages.length" size="small">
                          <n-text strong>Messages:</n-text>
                          <n-space vertical size="small">
                            <n-space v-for="(m, idx) in stationDetails.aiDjStats.messages" :key="idx" align="center" justify="space-between">
                              <n-tag :type="mapMessageType(m.type)" size="small" :bordered="false">{{ m.type }}</n-tag>
                              <n-text>{{ m.message }}</n-text>
                            </n-space>
                          </n-space>
                        </n-space>
                      </n-space>
                    </n-space>
                    <n-text v-else depth="3">No DJ information available</n-text>
                  </n-card>
                </div>

                <div style="flex-shrink: 0; width: auto;">
                  <n-card size="small" title="Scheduled Tasks">
                    <n-space vertical size="small">
                      <div v-if=" stationDetails?.runningTasks && stationDetails.runningTasks.length > 0 ">
                        <n-space vertical size="small">
                          <div v-for=" ( task, index ) in stationDetails.runningTasks " :key="index"
                            style="padding: 8px; border: 1px solid var(--n-border-color); border-radius: 4px; font-size: 0.875rem;">
                            <n-space vertical size="small">
                              <n-space justify="space-between">
                                <n-text strong>{{ formatTaskType( task.taskType ) }}</n-text>
                                <n-tag size="small" type="info">{{ task.target }}</n-tag>
                              </n-space>
                              <n-space justify="space-between">
                                <n-text depth="3">Started:</n-text>
                                <n-text>{{ formatTimestamp( task.startTime ) }}</n-text>
                              </n-space>
                              <n-space justify="space-between">
                                <n-text depth="3">Duration:</n-text>
                                <n-text>{{ getTaskDuration( task.startTime ) }}</n-text>
                              </n-space>
                            </n-space>
                          </div>
                        </n-space>
                      </div>
                      <n-text depth="3" v-else>No running tasks</n-text>
                    </n-space>
                  </n-card>
                </div>

                <n-card title="Schedule" size="small" style="width: 100%;">
                  <n-text depth="3" style="font-size: 12px; margin-bottom: 8px; display: block;">Created: {{ formatTimestamp(stationDetails?.schedule?.createdAt) }}</n-text>
                  
                  <div v-if="stationDetails?.schedule?.entries && stationDetails.schedule.entries.length">
                    <n-timeline>
                      <n-timeline-item
                        v-for="(s, index) in sortedSchedule"
                        :key="index"
                      >
                        <template #icon>
                          <YellowLed v-if="s.status === 'ACTIVE'" :active="true" :pulse="true" :size="16" />
                          <YellowLed v-else-if="pastSchedule.includes(s)" :active="false" :size="14" />
                          <GreenLed v-else :active="false" :size="14" />
                        </template>

                        <template #default>
                          <n-text style="font-weight: 500;">{{ s.sceneTitle }}</n-text>
                          <div style="margin-top: 4px; color: #9ca3af; font-size: 12px;">
                            {{ formatScheduleStart(s.startTime) }} - {{ formatScheduleStart(s.endTime) }}
                          </div>
                          <div style="margin-top: 4px; color: #9ca3af; font-size: 12px;">
                            {{ (s as any).searchInfo ?? (s as any).sourcing }} ({{ s.songsCount }} songs)
                          </div>
                          <div style="margin-top: 6px; display: flex; align-items: center; gap: 8px;">
                            <div style="display: flex; gap: 2px;">
                              <BlueLed
                                v-for="i in (s as any).songsCount"
                                :key="i"
                                :active="i <= (s as any).fetchedSongsCount"
                                :size="12"
                              />
                            </div>
                            <span style="font-size: 11px; color: #6b7280;">
                              {{ (s as any).fetchedSongsCount }}/{{ (s as any).songsCount }} queued
                            </span>
                          </div>
                          <div v-if="(s as any).songs && (s as any).songs.length" style="margin-top: 6px; color: #9ca3af; font-size: 12px;">
                            <div style="font-weight: 500; margin-bottom: 2px;">Songs:</div>
                            <div v-for="song in (s as any).songs" :key="song.songId">
                              {{ formatTimestamp(song.scheduledStartTime) }} - {{ song.title }}{{ song.artist ? ' — ' + song.artist : '' }}
                            </div>
                          </div>
                          <div v-if="(s as any).generatedContentTimestamp !== null" style="margin-top: 4px; color: #9ca3af; font-size: 12px;">
                            Generated: {{ formatTimestamp((s as any).generatedContentTimestamp) }}
                          </div>
                          <div v-if="(s as any).actualStartTime || (s as any).actualEndTime" style="margin-top: 4px; color: #9ca3af; font-size: 12px;">
                            Actual: {{ (s as any).actualStartTime ? formatTimestamp((s as any).actualStartTime) : '' }}{{ ((s as any).actualStartTime && (s as any).actualEndTime) ? ' - ' : '' }}{{ (s as any).actualEndTime ? formatTimestamp((s as any).actualEndTime) : '' }}, Offset: {{ (s as any).timingOffsetSeconds }}
                          </div>
                          <div v-if="((s as any).searchInfo || (s as any).sourcing).includes('GENERATED')" style="margin-top: 8px;">
                            <n-button type="primary" size="tiny" :loading="generatingScenes[s.sceneId]" @click="handleGenerateContent(s.sceneId)">
                              Generate
                            </n-button>
                            <div v-if="generateErrors[s.sceneId]" style="margin-top: 6px; color: #d03050; font-size: 12px;">
                              {{ generateErrors[s.sceneId] }}
                            </div>
                          </div>
                          <div v-if="(s as any).generatedSoundFragmentId !== null" style="margin-top: 8px;">
                            <n-button size="tiny" @click="openGeneratedSoundFragment((s as any).generatedSoundFragmentId)">
                              Open Sound Fragment
                            </n-button>
                          </div>
                        </template>
                      </n-timeline-item>
                    </n-timeline>
                  </div>
                </n-card>
              </n-space>
            </n-space>
          </n-space>
        </n-card>
      </n-space>

</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDashboardStore } from '../../../stores/kneo/dashboardStore';
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
  NMarquee,
  useMessage,
  NButtonGroup,
  NTabs,
  NTabPane,
  NSelect,
  NScrollbar,
  NInput,
  NBadge
} from 'naive-ui';
import { ExternalLink, PlayerPlay, PlayerStop, Activity, News, Cloud, Sun, Moon, Coffee, Tool, Music, Wind, MessageCircle, Home } from '@vicons/tabler';
import { MIXPLA_PLAYER_URL } from '../../../constants/config';
import GreenLed from '../../common/GreenLed.vue';
import YellowLed from '../../common/YellowLed.vue';
import BlueLed from '../../common/BlueLed.vue';
import GlowingStatus from '../../common/GlowingStatus.vue';

export default defineComponent({
  name: 'StationDashboard',
  components: {
    NButton, NCard, NIcon, NTag, NStatistic, NProgress, NSpace, NH2, NText,
    NTimeline, NTimelineItem, NButtonGroup,
    NMarquee, NTabs, NTabPane, NSelect, NScrollbar, NInput, NBadge, PlayerPlay, PlayerStop, ExternalLink, Activity,
    News, Cloud, Sun, Moon, Coffee, Tool, Music, Wind, MessageCircle, Home,
    GreenLed,
    YellowLed,
    BlueLed,
    GlowingStatus
  },
  props: {
    brandName: {
      type: String,
      required: true
    }
  },
  setup(props: { brandName: string }) {
    const dashboardStore = useDashboardStore();
    const router = useRouter();
    const message = useMessage();
    const isStartingStation = ref(false);
    const isStoppingStation = ref(false);
    const isRebuildingSchedule = ref(false);
    const generatingScenes = ref<Record<string, boolean>>({});
    const generateErrors = ref<Record<string, any>>({});
    const now = ref(new Date());

    const copyBrandNameToClipboard = async () => {
      await navigator.clipboard.writeText(props.brandName);
      message.success('Copied');
    };

    const openGeneratedSoundFragment = (id: string) => {
      router.push({ name: 'EditSoundFragment', params: { brandName: props.brandName, id } });
    };

    const activeTab = ref<'dashboard'>('dashboard');

    const stationDetails = computed(() => {
      return dashboardStore.getStationDetails(props.brandName);
    });

    const isDjActive = computed(() => {
      const stats = stationDetails.value?.aiDjStats;
      if (!stats?.lastRequestTime) return false;
      const last = new Date(stats.lastRequestTime);
      if (isNaN(last.getTime())) return false;
      return (Date.now() - last.getTime()) < 5 * 60 * 1000;
    });

    const isDjOffline = computed(() => {
      const stats = stationDetails.value?.aiDjStats;
      return !stats?.djName && !stats?.lastRequestTime;
    });

    const isOnline = computed(() => {
      return stationDetails.value?.status === 'ON_LINE' || stationDetails.value?.status === 'WARMING_UP' || stationDetails.value?.status === 'QUEUE_SATURATED';
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

    const combinedPlaylist = computed(() => {
      const livePlaylist = (stationDetails.value?.playlistManagerStats?.livePlaylist || []) as any[];
      const queued = ((stationDetails.value?.playlistManagerStats as any)?.queued || []) as any[];

      const combined = [
        ...livePlaylist.map((item: any) => ({ ...item, isQueued: false, isPlayingNow: isCurrentSong(item) })),
        ...queued.slice().reverse().map((item: any) => ({ ...item, isQueued: true, isPlayingNow: isCurrentSong(item) }))
      ];

      return combined;
    });

    const formattedTime = computed(() => {
      return now.value.toLocaleTimeString('en-GB', {
        timeZone: (stationDetails.value?.zoneId || undefined) as any,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    });

    const timeWithDot = computed(() => formattedTime.value.split(':').join('_'));

    onMounted(() => {
      const id = window.setInterval(() => {
        now.value = new Date();
      }, 1000);
      onUnmounted(() => clearInterval(id));
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
        case 'QUEUE_SATURATED':
          return '#18a058';
        case 'WARMING_UP':
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
          return { text: 'Online', type: 'success' as const };
        case 'QUEUE_SATURATED':
          return { text: 'Queue Saturated', type: 'success' as const };
        case 'WARMING_UP':
          return { text: 'Warming Up', type: 'warning' as const };
        case 'IDLE':
          return { text: 'Idle', type: 'warning' as const };
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

    const mixplaUrl = computed(() => {
      return `${MIXPLA_PLAYER_URL}?radio=${encodeURIComponent(props.brandName.toLowerCase())}`;
    });

    const formatTime = (timeString: string) => {
      if (!timeString) return '';
      // If it's already in HH:mm format, return as is
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) {
        return timeString;
      }
      // If it's a full ISO string, extract time part
      try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return timeString; // Invalid date
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return timeString; // Return original if parsing fails
      }
    };

    const formatScheduleStart = (timeString: string) => {
      const t = formatTime(timeString);
      if (!t) return t;
      if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t.slice(0, 5);
      return t;
    };

    const parseTimeToMinutes = (timeStr: string): number => {
      if (!timeStr) return 0;

      // Handle HH:mm format
      const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        return hours * 60 + minutes;
      }

      // Handle ISO date string
      try {
        const date = new Date(timeStr);
        if (!isNaN(date.getTime())) {
          return date.getHours() * 60 + date.getMinutes();
        }
      } catch (e) {
        // Continue to return 0
      }

      return 0;
    };

    const calculateDuration = (startTime: string, endTime: string): string => {
      if (!startTime || !endTime) return '--:--';

      const startMinutes = parseTimeToMinutes(startTime);
      let endMinutes = parseTimeToMinutes(endTime);

      // Handle overnight case (end time is next day)
      if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60; // Add 24 hours in minutes
      }

      const totalMinutes = endMinutes - startMinutes;

      // Handle full 24-hour case
      if (totalMinutes >= 24 * 60) return '24:00';

      // Format as HH:MM
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const formatSceneDuration = (startTime: string, endTime: string, nextSceneTitle?: string, currentSceneTitle?: string): string => {
      if (!nextSceneTitle || nextSceneTitle === currentSceneTitle) {
        return '24 hours rolling';
      }

      const duration = calculateDuration(startTime, endTime);
      if (duration === '24:00') return 'Full 24-hours';

      // If duration is less than 1 hour, show in minutes
      if (duration.startsWith('00:')) {
        const minutes = parseInt(duration.substring(3), 10);
        return `${minutes} min`;
      }

      // If minutes is 00, show just hours
      if (duration.endsWith(':00')) {
        const hours = parseInt(duration.split(':')[0], 10);
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }

      // Otherwise show full HH:MM
      return duration;
    };

    const calculatePreviousSceneEnd = (currentStartTime: string): string => {
      if (!currentStartTime) return '';

      // For demo purposes, assume previous scene ended 1 hour before current scene
      // In a real implementation, you'd get this from the actual scene data
      const currentMinutes = parseTimeToMinutes(currentStartTime);
      const prevEndMinutes = (currentMinutes - 60 + (24 * 60)) % (24 * 60);

      const hours = Math.floor(prevEndMinutes / 60);
      const minutes = prevEndMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const isHeartbeatActive = computed(() => {
      return stationDetails.value?.heartbeat === true;
    });

    const sendCommand = async (brandName: string, command: string) => {
      try {
        await dashboardStore.triggerBroadcastAction(brandName, command);
        message.success(`${command} command sent successfully`);
      } catch (error) {
        console.error(`Error sending ${command} command:`, error);
        message.error((error as any)?.response?.data ?? error);
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

    const handleRebuildSchedule = async () => {
      if (isRebuildingSchedule.value) return;
      isRebuildingSchedule.value = true;
      try {
        await sendCommand(props.brandName, 'rebuild_schedule');
      } finally {
        isRebuildingSchedule.value = false;
      }
    };

    const handleGenerateContent = async (sceneId: string) => {
      if (generatingScenes.value[sceneId]) return;
      generatingScenes.value = {
        ...generatingScenes.value,
        [sceneId]: true
      };
      generateErrors.value = {
        ...generateErrors.value,
        [sceneId]: null
      };
      try {
        await dashboardStore.generateSceneContent(props.brandName, sceneId);
        generateErrors.value = {
          ...generateErrors.value,
          [sceneId]: null
        };
        message.success('generate_content command sent successfully');
      } catch (error) {
        console.error('Error sending generate_content command:', error);
        const payload = (error as any)?.response?.data ?? error;
        generateErrors.value = {
          ...generateErrors.value,
          [sceneId]: payload
        };
        message.error(payload);
      } finally {
        generatingScenes.value = {
          ...generatingScenes.value,
          [sceneId]: false
        };
      }
    };

    const cleanTitle = (title: string | undefined | null): string => {
      if (!title || typeof title !== 'string') return 'N/A';
      return title.replace(/^(#+|--+)\s*/, '').replace(/[#-]/g, '|').trim();
    };

    const getMergingTypeText = (fragment: any): { text: string; color: 'default' | 'success' | 'error' | 'warning' | 'primary' | 'info' } => {
      if (!fragment) return { text: '', color: 'default' };
      switch (fragment.mergingType) {
        case 'FILLER_JINGLE':
          return { text: 'Jingle + Song', color: 'success' };
        case 'INTRO_SONG':
          return { text: 'Intro + Song', color: 'warning' };
        case 'SONG_INTRO_SONG':
          return { text: 'Song + Intro + Song', color: 'info' };
        case 'INTRO_SONG_INTRO_SONG':
          return { text: 'Intro + Song + Intro + Song', color: 'error' };
        case 'SONG_CROSSFADE_SONG':
          return { text: 'Song + Crossfade + Song', color: 'success' };
        case 'SONG_ONLY':
          return { text: 'Song Solely', color: 'success' };
        default:
          return { text: fragment.mergingType || '', color: 'default' };
      }
    };

    const getHlsCurrentTrack = (): string => {
      const songStats = stationDetails.value?.songStatistics;
      if (!songStats) return 'N/A';
      const title = (songStats as any)?.songMetadata?.title ?? (songStats as any)?.title;
      if (!title) return 'N/A';
      return cleanTitle(title);
    };

    const formatArtistTitle = (fragment: any): string => {
      const title = fragment?.title ? cleanTitle(fragment.title) : 'N/A';
      const artist = fragment?.artist ? String(fragment.artist).trim() : '';
      return artist ? `${artist} — ${title}` : title;
    };

    const formatDuration = (seconds: number): string => {
      if (!seconds || seconds <= 0) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getSceneIcon = (title: string): any => {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('news')) return News;
      if (lowerTitle.includes('weather') || lowerTitle.includes('climat')) return Cloud;
      if (lowerTitle.includes('morning') && lowerTitle.includes('greeting')) return Sun;
      if (lowerTitle.includes('evening') && lowerTitle.includes('greeting')) return Moon;
      if (lowerTitle.includes('greeting') || lowerTitle.includes('salut')) return MessageCircle;
      if (lowerTitle.includes('night') || lowerTitle.includes('late')) return Moon;
      return null;
    };

    const formatTimestamp = (timestamp: string): string => {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatTaskType = (taskType: string): string => {
      return taskType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getTaskDuration = (startTime: string): string => {
      const start = new Date(startTime);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    };

    const formatStatus = (status: string | null | undefined): string => {
      if (!status) return 'Unknown';

      const statusMap: Record<string, string> = {
        'ON_LINE': 'Online',
        'OFF_LINE': 'Offline',
        'IDLE': 'Idle',
        'WARMING_UP': 'Warming Up',
        'QUEUE_SATURATED': 'Queue Saturated',
        'SYSTEM_ERROR': 'System Error',
        'STARTING': 'Starting',
        'STOPPING': 'Stopping',
        'ERROR': 'Error',
        'UNKNOWN': 'Unknown',
        'CONNECTED': 'Connected',
        'DISCONNECTED': 'Disconnected'
      };

      return statusMap[status.toUpperCase()] || status;
    };

    const isCurrentSong = (fragment: any): boolean => {
      const currentTrack = getHlsCurrentTrack();
      if (!currentTrack || currentTrack === 'N/A') return false;
      const fragmentTitle = typeof fragment === 'string' ? fragment : fragment?.title;
      if (!fragmentTitle) return false;
      const cleanFragment = cleanTitle(fragmentTitle);
      return cleanFragment === currentTrack;
    };

    const getPlaylistItemType = (fragment: any): 'success' | 'warning' | 'error' | 'info' | 'default' => {
      if (isCurrentSong(fragment)) return 'success';
      if (!fragment.obtained) return 'error';
      if (fragment.source === 'PRIORITIZED') return 'warning';
      return 'default';
    };

    const getPlaylistItemColor = (fragment: any): string | undefined => {
      const t = getPlaylistItemType(fragment);
      if (t !== 'default') return undefined as any;
      return fragment?.isQueued ? '#2080f0' : '#f0a020';
    };

    const mapMessageType = (t: any): 'info' | 'warning' | 'error' | 'default' => {
      const v = String(t || '').toUpperCase();
      if (v === 'INFO') return 'info';
      if (v === 'WARNING') return 'warning';
      if (v === 'ERROR') return 'error';
      return 'default';
    };

    const getStatusTimelineType = (status: string | null | undefined): 'success' | 'warning' | 'error' | 'default' => {
      if (!status) return 'default';
      switch (status.toUpperCase()) {
        case 'ON_LINE':
        case 'QUEUE_SATURATED':
          return 'success';
        case 'WARMING_UP':
        case 'IDLE':
          return 'warning';
        case 'SYSTEM_ERROR':
        case 'ERROR':
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
          status: (event as any).newStatus,
          timeDiff
        };
      });
    });

    const isDestroyed = ref(false);

    const sortedSchedule = computed(() => {
      const schedule = stationDetails.value?.schedule?.entries || [];
      return schedule.slice();
    });

    const currentSchedule = computed(() => {
      return sortedSchedule.value.find((s: any) => s.status === 'ACTIVE');
    });

    const pastSchedule = computed(() => {
      const currentIdx = sortedSchedule.value.findIndex((s: any) => s.status === 'ACTIVE');
      return sortedSchedule.value.slice(0, currentIdx);
    });

    const futureSchedule = computed(() => {
      const currentIdx = sortedSchedule.value.findIndex((s: any) => s.status === 'ACTIVE');
      return sortedSchedule.value.slice(currentIdx + 1);
    });

    const scheduleItemId = (s: any) => {
      return `${s.startTime}|${s.endTime}|${s.sceneTitle}`;
    };

    onMounted(() => {
      console.log('StationDetail mounted for brand:', props.brandName);
      dashboardStore.startStationPolling(props.brandName);
    });

    watch(() => props.brandName, (newBrandName, oldBrandName) => {
      if (newBrandName !== oldBrandName) {
        console.log('Brand changed from', oldBrandName, 'to', newBrandName);
        if (oldBrandName) {
          dashboardStore.stopStationPolling(oldBrandName);
          dashboardStore.disconnectStation(oldBrandName);
        }
        dashboardStore.startStationPolling(newBrandName);
      }
    });

    onUnmounted(() => {
      console.log('StationDetail unmounted for brand:', props.brandName);
      isDestroyed.value = true;
      dashboardStore.stopStationPolling(props.brandName);
      dashboardStore.disconnectStation(props.brandName);
    });

    return {
      dashboardStore,
      isStartingStation,
      isStoppingStation,
      isRebuildingSchedule,
      generatingScenes,
      generateErrors,
      isOnline,
      isDjActive,
      isDjOffline,
      currentListeners,
      lastUpdateTime,
      combinedPlaylist,
      timelineDisplay,
      timelineItems,
      stationColor,
      getStatusInfo,
      managedByInfo,
      stationInitials,
      mixplaUrl,
      isHeartbeatActive,
      statusHistoryTimeline,
      getStatusTimelineType,
      formatStatus,
      formatTimestamp,
      formatTaskType,
      getTaskDuration,
      getPlaylistItemType,
      getPlaylistItemColor,
      formatArtistTitle,
      getSceneIcon,
      stationDetails,
      handleStart,
      handleStop,
      handleRebuildSchedule,
      handleGenerateContent,
      openGeneratedSoundFragment,
      formatDuration,
      formatTime,
      formatScheduleStart,
      formatSceneDuration,
      mapMessageType,
      calculatePreviousSceneEnd,
      getMergingTypeText,
      formattedTime,
      timeWithDot,
      activeTab,
      copyBrandNameToClipboard,
      sortedSchedule,
      scheduleItemId,
      currentSchedule,
      pastSchedule,
      futureSchedule
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

.merge-box {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin: 0 4px 0 2px;
  border-radius: 2px;
  vertical-align: middle;
}

@keyframes subtle-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

.playing-indicator {
  display: inline-flex;
  align-items: center;
  margin-right: 6px;
}
.playing-indicator svg .bar {
  fill: #ef4444;
  animation: equalize 1s ease-in-out infinite;
  transform-origin: center bottom;
}
.playing-indicator svg .bar.b1 { animation-delay: 0s; }
.playing-indicator svg .bar.b2 { animation-delay: 0.15s; }
.playing-indicator svg .bar.b3 { animation-delay: 0.3s; }

@keyframes equalize {
  0%, 100% { transform: scaleY(0.3); }
  20% { transform: scaleY(0.9); }
  40% { transform: scaleY(0.5); }
  60% { transform: scaleY(1.0); }
  80% { transform: scaleY(0.6); }
}

.schedule-groups {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.schedule-group {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--n-border-color);
  border-radius: 10px;
  padding: 10px;
}

.schedule-group--current {
  flex: 0.8;
  max-width: 300px;
  border-color: rgba(128, 128, 128, 0.6);
}

.schedule-group__title {
  display: block;
  margin-bottom: 8px;
}

.schedule-compact-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.schedule-compact-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border: 1px solid var(--n-border-color);
  border-radius: 999px;
}

.schedule-current {
  border: 1px solid var(--n-border-color);
  border-radius: 10px;
  padding: 10px 12px;
}

.schedule-current__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.schedule-current__details {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.schedule-current__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
</style>