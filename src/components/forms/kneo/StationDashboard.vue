<template>
  <n-space vertical size="large" style="padding: 24px;">
    <n-card>
      <n-space vertical size="medium">
        <n-space align="center" size="medium">
          <n-h2 style="margin: 0;">{{ brandName }} Dashboard</n-h2>
          <span
            class="live-status"
            :class="{ 'live-on-air': isHeartbeatActive }"
            :style="isHeartbeatActive
              ? 'color: #ef4444 !important; text-shadow: 0 0 10px rgba(239, 68, 68, 1), 0 0 18px rgba(239, 68, 68, 0.6); font-weight: 600 !important; font-size: 18px; animation: subtle-pulse 2s ease-in-out infinite;'
              : 'font-weight: 400; font-size: 18px; color: inherit;'"
          >
            On Air
          </span>
        </n-space>
        <n-space align="center" size="small">
          <n-tag :type="getStatusInfo.type" size="large" :bordered="false">
            {{ getStatusInfo.text }}
          </n-tag>
          <n-text depth="3" style="font-size: 14px;">
            {{ currentListeners }} listeners
          </n-text>
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
            <n-button type="error" :loading="isStoppingStation" :disabled="!isOnline" @click="handleStop">
              <template #icon>
                <n-icon>
                  <PlayerStop />
                </n-icon>
              </template>
              Stop Station
            </n-button>
          </n-button-group>
          <n-button type="primary" tertiary style="margin-left: 8px;" @click="showBroadcastModal = true">
            Broadcast message
          </n-button>
          <n-space size="large" style="margin-left: 30px;">
            <a :href="mixplaUrl" target="_blank" rel="noopener noreferrer" class="mixpla-link">
              {{ mixplaUrl }}
              <n-icon style="margin-left: 4px; vertical-align: middle;" size="14">
                <ExternalLink />
              </n-icon>
            </a>
          </n-space>
          
        </n-space>

        <n-space vertical size="large">
          <n-card title="Status History" size="small">
            <n-timeline horizontal v-if=" statusHistoryTimeline.length > 0 ">
              <n-timeline-item v-for=" ( event, index ) in statusHistoryTimeline " :key="index"
                :type="getStatusTimelineType( event.newStatus )" :title="formatStatus( event.newStatus )"
                :content="formatTimestamp( event.timestamp ) + ( event.timeDiff ? ' (' + event.timeDiff + ')' : '' )" />
            </n-timeline>
            <n-text depth="3" v-else>No status history available</n-text>
          </n-card>

          <n-space size="medium">
            <n-card title="Live Playlist" size="small" style="flex: 1; min-width: 0;">
              <n-space vertical size="medium">
                <div>
                  <n-text depth="2" style="font-weight: 600; margin-bottom: 8px; display: block;">In Queue:</n-text>
                  <div
                    v-if=" stationDetails?.playlistManagerStats?.obtainedByPlaylist && stationDetails.playlistManagerStats.obtainedByPlaylist.length > 0 ">
                    <n-space vertical size="small">
                      <div v-for=" ( fragment, index ) in stationDetails.playlistManagerStats.obtainedByPlaylist "
                        :key="index" :style="{
                          paddingLeft: '8px',
                          borderLeft: '2px solid',
                          fontSize: '0.875rem',
                          backgroundColor: isCurrentSong( fragment ) ? 'var(--n-color-target)' : 'transparent',
                          padding: isCurrentSong( fragment ) ? '4px 8px' : '0 0 0 8px',
                          borderRadius: isCurrentSong( fragment ) ? '4px' : '0',
                          fontWeight: isCurrentSong( fragment ) ? '600' : 'normal'
                        }">
                        <n-text :depth="isCurrentSong( fragment ) ? 1 : 3"
                          :style="{ color: isCurrentSong( fragment ) ? 'white !important' : undefined }">
                          {{ index + 1 }}.
                          <span v-for="(c, i) in getMergingTypeColors(fragment)" :key="i" class="merge-box" :style="{ backgroundColor: c }"></span>
                          {{ formatArtistTitle(fragment) }}
                        </n-text>
                      </div>
                    </n-space>
                  </div>
                  <n-text depth="3" v-else>No played fragments available.</n-text>
                </div>

                <div>
                  <n-text depth="2" style="font-weight: 600; margin-bottom: 8px; display: block;">Ready to be queued:</n-text>
                  <div
                    v-if=" stationDetails?.playlistManagerStats?.readyToBeConsumed && stationDetails.playlistManagerStats.readyToBeConsumed.length > 0 ">
                    <n-space vertical size="small">
                      <div v-for=" ( fragment, index ) in stationDetails.playlistManagerStats.readyToBeConsumed "
                        :key="index" :style="{
                          paddingLeft: '8px',
                          borderLeft: '2px solid',
                          fontSize: '0.875rem',
                          backgroundColor: isCurrentSong( fragment ) ? 'var(--n-color-target)' : 'transparent',
                          padding: isCurrentSong( fragment ) ? '4px 8px' : '0 0 0 8px',
                          borderRadius: isCurrentSong( fragment ) ? '4px' : '0',
                          fontWeight: isCurrentSong( fragment ) ? '600' : 'normal'
                        }">
                        <n-text :depth="isCurrentSong( fragment ) ? 1 : 3"
                          :style="{ color: isCurrentSong( fragment ) ? 'white !important' : undefined }">
                          {{ index + 1 }}.
                          <span v-for="(c, i) in getMergingTypeColors(fragment)" :key="i" class="merge-box" :style="{ backgroundColor: c }"></span>
                          {{ formatArtistTitle(fragment) }}
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
                  <div v-if=" hasHlsSongStats() ">
                    <n-space vertical size="small" class="current-track-info">
                      <n-space justify="space-between">
                        <n-text strong>Current Track:</n-text>
                        <span class="song-title" :title="getHlsCurrentTrackDisplay()">{{
                          getHlsCurrentTrackDisplay()
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
                          <span v-if=" getHlsRequestCount() > 0 ">
                            <n-icon size="18" color="green">
                              <Activity />
                            </n-icon></span>
                        </n-space>
                      </n-space>
                      <n-space justify="space-between">
                        <n-text strong>Est. Listeners:</n-text>
                        <n-text v-if=" getHlsListenersCount() === -1 " depth="3"
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
          </n-space>
        </n-space>
      </n-space>
    </n-card>
  </n-space>

  <n-modal v-model:show="showBroadcastModal" preset="dialog" title="Broadcast message">
    <n-form :model="broadcastForm" ref="broadcastFormRef">
      <n-form-item label="From" path="from">
        <n-input v-model:value="broadcastForm.from" placeholder="e.g. John" />
      </n-form-item>
      <n-form-item label="Message" path="content">
        <n-input v-model:value="broadcastForm.content" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" placeholder="Your message to listeners" />
      </n-form-item>
      <n-text depth="3" style="display:block; margin-top: 4px;">
        Note: Your message will be processed by the DJ if the radio station supports it.
      </n-text>
    </n-form>
    <template #action>
      <n-button @click="showBroadcastModal = false">Cancel</n-button>
      <n-button type="primary" :loading="creatingBroadcast" @click="handleBroadcast">Send</n-button>
    </template>
  </n-modal>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { useDashboardStore } from '../../../stores/kneo/dashboardStore';
import { useMemoryStore } from '../../../stores/kneo/memoryStore';
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
  useMessage,
  NButtonGroup,
  NModal,
  NForm,
  NFormItem,
  NInput
} from 'naive-ui';
import { ExternalLink, PlayerPlay, PlayerStop, Activity } from '@vicons/tabler';
import { MIXPLA_PLAYER_URL } from '../../../constants/config';



export default defineComponent( {
  name: 'StationDashboard',
  components: {
    NButton, NCard, NIcon, NTag, NStatistic, NProgress, NSpace, NH2, NText,
    NTimeline, NTimelineItem, NButtonGroup, NModal, NForm, NFormItem, NInput,
    PlayerPlay, PlayerStop, ExternalLink, Activity
  },
  props: {
    brandName: {
      type: String,
      required: true
    }
  },
  setup( props: { brandName: string } ) {
    const dashboardStore = useDashboardStore();
    const memoryStore = useMemoryStore();
    const message = useMessage();
    const isStartingStation = ref( false );
    const isStoppingStation = ref( false );

    const stationDetails = computed( () => {
      return dashboardStore.getStationDetails( props.brandName );
    } );

    const isOnline = computed( () => {
      return stationDetails.value?.status === 'ON_LINE' || stationDetails.value?.status === 'WARMING_UP' || stationDetails.value?.status === 'QUEUE_SATURATED' || stationDetails.value?.status === 'WAITING_FOR_CURATOR';
    } );

    const currentListeners = computed( () => {
      return stationDetails.value?.currentListeners || 0;
    } );

    const lastUpdateTime = computed( () => {
      const lastUpdate = dashboardStore.getStationLastUpdate( props.brandName );
      if ( !lastUpdate ) return 'N/A';
      return lastUpdate.toLocaleTimeString( [], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      } );
    } );

    const timelineDisplay = computed( () => {
      const timeline = stationDetails.value?.timeline;
      if ( !timeline ) return null;

      const parts = [];

      if ( timeline.pastSegmentSequences?.length > 0 ) {
        parts.push( timeline.pastSegmentSequences.join( '-' ) );
        parts.push( '-' );
      }

      parts.push( '||>' );

      if ( timeline.visibleSegmentSequences?.length > 0 ) {
        parts.push( timeline.visibleSegmentSequences.join( '-' ) );
      } else {
        parts.push( '(empty)' );
      }

      parts.push( '<||' );

      if ( timeline.upcomingSegmentSequences?.length > 0 ) {
        parts.push( '-' );
        parts.push( timeline.upcomingSegmentSequences.join( '-' ) );
      }

      return parts.join( ' ' );
    } );

    const timelineItems = computed( () => {
      const timeline = stationDetails.value?.timeline;
      if ( !timeline ) return [];

      const items = [];

      if ( timeline.pastSegmentSequences?.length > 0 ) {
        items.push( {
          type: 'default' as const,
          title: 'Past Segments',
          content: timeline.pastSegmentSequences.join( ', ' )
        } );
      }

      if ( timeline.visibleSegmentSequences?.length > 0 ) {
        items.push( {
          type: 'success' as const,
          title: 'Current Segments',
          content: timeline.visibleSegmentSequences.join( ', ' )
        } );
      }

      if ( timeline.upcomingSegmentSequences?.length > 0 ) {
        items.push( {
          type: 'info' as const,
          title: 'Upcoming Segments',
          content: timeline.upcomingSegmentSequences.join( ', ' )
        } );
      }

      return items;
    } );

    const stationColor = computed( () => {
      const status = stationDetails.value?.status;
      switch ( status ) {
        case 'ON_LINE':
          return '#18a058';
        case 'QUEUE_SATURATED':
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
    } );

    const getStatusInfo = computed( () => {
      const status = stationDetails.value?.status;
      switch ( status ) {
        case 'ON_LINE':
          return { text: 'Online', type: 'success' as const };
        case 'QUEUE_SATURATED':
          return { text: 'Queue Saturated', type: 'success' as const };
        case 'WARMING_UP':
          return { text: 'Warming Up', type: 'warning' as const };
        case 'WAITING_FOR_CURATOR':
          return { text: 'Waiting for listener', type: 'warning' as const };
        case 'IDLE':
          return { text: 'Idle', type: 'warning' as const };
        case 'SYSTEM_ERROR':
          return { text: 'System Error', type: 'error' as const };
        case 'OFF_LINE':
        default:
          return { text: 'Offline', type: 'default' as const };
      }
    } );

    const managedByInfo = computed( () => {
      const managedBy = stationDetails.value?.managedBy;
      switch ( managedBy ) {
        case 'AI_AGENT':
          return { text: 'AI-managed', type: 'info' as const };
        case 'ITSELF':
          return { text: 'Self-managed', type: 'default' as const };
        default:
          return { text: managedBy || 'Unknown', type: 'default' as const };
      }
    } );

    const stationInitials = computed( () => {
      return props.brandName.substring( 0, 2 ).toUpperCase();
    } );

    const mixplaUrl = computed( () => {
      return `${MIXPLA_PLAYER_URL}?radio=${encodeURIComponent( props.brandName.toLowerCase() )}`;
    } );

    const isHeartbeatActive = computed( () => {
      return stationDetails.value?.heartbeat === true;
    } );

    

    const sendCommand = async ( brandName: string, command: string ) => {
      try {
        const success = await dashboardStore.triggerBroadcastAction( brandName, command );
        if ( success ) {
          message.success( `${command} command sent successfully` );
        } else {
          message.error( `Failed to send ${command} command` );
        }
      } catch ( error ) {
        console.error( `Error sending ${command} command:`, error );
        message.error( `Error sending ${command} command` );
      }
    };

    

    const handleStart = async () => {
      if ( isStartingStation.value ) return;
      isStartingStation.value = true;
      try {
        await sendCommand( props.brandName, 'start' );
      } finally {
        isStartingStation.value = false;
      }
    };

    const handleStop = async () => {
      if ( isStoppingStation.value ) return;
      isStoppingStation.value = true;
      try {
        await sendCommand( props.brandName, 'stop' );
      } finally {
        isStoppingStation.value = false;
      }
    };

    const openMixpla = () => {
      window.open( mixplaUrl.value, '_blank', 'noopener,noreferrer' );
    };

    

    const cleanTitle = ( title: string | undefined | null ): string => {
      if ( !title || typeof title !== 'string' ) return 'N/A';
      return title.replace( /^(#+|--+)\s*/, '' ).replace( /[#-]/g, '|' ).trim();
    };

    const getMergingTypeSymbol = ( fragment: any ): string => {
      if ( fragment?.mergingType === 'FILLER_SONG' ) {
        return '■ ';
      }
      if ( fragment?.mergingType === 'INTRO_SONG' ) {
        return '■■ ';
      }
      if ( fragment?.mergingType === 'SONG_INTRO_SONG' ) {
        return '■■■ ';
      }
      return '';
    };

    const getMergingTypeColors = (fragment: any): string[] => {
      switch (fragment?.mergingType) {
        case 'FILLER_SONG':
          return ['#18a058']; // green
        case 'INTRO_SONG':
          return ['#f0a020', '#f0a020']; // orange x2
        case 'SONG_INTRO_SONG':
          return ['#722ed1', '#722ed1', '#722ed1']; // purple x3
        default:
          return [];
      }
    };

    const hasHlsSongStats = (): boolean => {
      return !!( stationDetails.value?.songStatistics && Object.keys( stationDetails.value.songStatistics ).length > 0 );
    };

    const getHlsCurrentTrack = (): string => {
      const songStats = stationDetails.value?.songStatistics;
      if ( !songStats ) return 'N/A';
      const title = (songStats as any)?.songMetadata?.title ?? (songStats as any)?.title;
      if (!title) return 'N/A';
      return cleanTitle( title );
    };

    const formatArtistTitle = (fragment: any): string => {
      const title = fragment?.title ? cleanTitle(fragment.title) : 'N/A';
      const artist = fragment?.artist ? String(fragment.artist).trim() : '';
      return artist ? `${artist} — ${title}` : title;
    };

    const getHlsCurrentTrackDisplay = (): string => {
      const songStats = stationDetails.value?.songStatistics as any;
      if (!songStats) return 'N/A';
      const title = songStats?.songMetadata?.title ?? songStats?.title;
      const artist = songStats?.songMetadata?.artist ?? songStats?.artist;
      if (!title) return 'N/A';
      const clean = cleanTitle(title);
      return artist ? `${String(artist).trim()} — ${clean}` : clean;
    };

    const getHlsTimestamp = (): string => {
      const songStats = stationDetails.value?.songStatistics;
      if ( !songStats ) return 'N/A';
      return formatTimestamp( songStats.segmentTimestamp.toString() );
    };

    const formatTimestamp = ( timestamp: string ): string => {
      const date = new Date( timestamp );
      return date.toLocaleTimeString( [], { hour: '2-digit', minute: '2-digit', second: '2-digit' } );
    };

    const formatTaskType = ( taskType: string ): string => {
      return taskType.replace( /_/g, ' ' ).replace( /\b\w/g, l => l.toUpperCase() );
    };

    const getTaskDuration = ( startTime: string ): string => {
      const start = new Date( startTime );
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const hours = Math.floor( diffMs / ( 1000 * 60 * 60 ) );
      const minutes = Math.floor( ( diffMs % ( 1000 * 60 * 60 ) ) / ( 1000 * 60 ) );
      const seconds = Math.floor( ( diffMs % ( 1000 * 60 ) ) / 1000 );

      if ( hours > 0 ) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else if ( minutes > 0 ) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    };

    const formatStatus = ( status: string | null | undefined ): string => {
      if ( !status ) return 'Unknown';

      const statusMap: Record<string, string> = {
        'ON_LINE': 'Online',
        'OFF_LINE': 'Offline',
        'IDLE': 'Idle',
        'WARMING_UP': 'Warming Up',
        'QUEUE_SATURATED': 'Queue Saturated',
        'WAITING_FOR_CURATOR': 'Waiting for listener',
        'SYSTEM_ERROR': 'System Error',
        'STARTING': 'Starting',
        'STOPPING': 'Stopping',
        'ERROR': 'Error',
        'UNKNOWN': 'Unknown',
        'CONNECTED': 'Connected',
        'DISCONNECTED': 'Disconnected'
      };

      return statusMap[status.toUpperCase()] || status.replace( /_/g, ' ' );
    };

    const getHlsRequestCount = () => {
      if ( stationDetails.value && typeof stationDetails.value.songStatistics === 'object' && stationDetails.value.songStatistics !== null ) {
        return stationDetails.value.songStatistics.requestCount || 0;
      }
      return 0;
    };

    const getHlsListenersCount = (): number => {
      return currentListeners.value;
    };

    const isCurrentSong = ( fragment: any ): boolean => {
      const currentTrack = getHlsCurrentTrack();
      if ( !currentTrack || currentTrack === 'N/A' ) return false;
      const fragmentTitle = typeof fragment === 'string' ? fragment : fragment?.title;
      if ( !fragmentTitle ) return false;
      const cleanFragment = cleanTitle( fragmentTitle );
      return cleanFragment === currentTrack;
    };

    const getStatusTimelineType = ( status: string | null | undefined ): 'success' | 'warning' | 'error' | 'default' => {
      if ( !status ) return 'default';
      switch ( status.toUpperCase() ) {
        case 'ON_LINE':
        case 'QUEUE_SATURATED':
          return 'success';
        case 'WARMING_UP':
        case 'WAITING_FOR_CURATOR':
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

    const statusHistoryTimeline = computed( () => {
      const history = stationDetails.value?.statusHistory || [];
      const recentHistory = history.slice( -5 );

      return recentHistory.map( ( event, index ) => {
        let timeDiff = '';
        if ( index > 0 ) {
          const prevEvent = recentHistory[index - 1];
          const diffMs = new Date( event.timestamp ).getTime() - new Date( prevEvent.timestamp ).getTime();
          const diffMins = Math.round( diffMs / ( 1000 * 60 ) );
          timeDiff = `+${diffMins}m`;
        }

        return {
          ...event,
          timeDiff
        };
      } );
    } );

    const isDestroyed = ref( false );

    const showBroadcastModal = ref(false);
    const creatingBroadcast = ref(false);
    const broadcastFormRef = ref();
    const broadcastForm = ref({ from: '', content: '' });

    const handleBroadcast = async () => {
      const from = (broadcastForm.value.from || '').trim();
      const content = (broadcastForm.value.content || '').trim();
      if (!from || !content) {
        message.error('Enter both From and Message');
        return;
      }
      try {
        creatingBroadcast.value = true;
        await memoryStore.createMemory(props.brandName, [{ from, content }], 'MESSAGE');
        message.success('Broadcast sent');
        showBroadcastModal.value = false;
        broadcastForm.value = { from: '', content: '' };
      } catch (e) {
        message.error('Failed to send broadcast');
      } finally {
        creatingBroadcast.value = false;
      }
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

    watch( () => stationDetails.value?.timeline, () => {
    }, { deep: true } );


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
      isHeartbeatActive,
      // test player
      
      handleStart,
      handleStop,
      openMixpla,
      isStartingStation,
      isStoppingStation,
      cleanTitle,
      getMergingTypeSymbol,
      getMergingTypeColors,
      hasHlsSongStats,
      getHlsCurrentTrack,
      getHlsTimestamp,
      getHlsCurrentTrackDisplay,
      getHlsRequestCount,
      getHlsListenersCount,
      formatArtistTitle,
      isCurrentSong,
      statusHistoryTimeline,
      getStatusTimelineType,
      timelineItems,
      formatTimestamp,
      formatStatus,
      formatTaskType,
      getTaskDuration,
      showBroadcastModal,
      broadcastForm,
      broadcastFormRef,
      creatingBroadcast,
      handleBroadcast,
    };
  },
} );
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
</style>