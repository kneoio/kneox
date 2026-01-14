<template>
  <n-config-provider :theme="darkTheme">
    <n-layout>
      <n-layout-header class="neon-header">
        <div
          :style="{ maxWidth: '720px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '24px' }">
          <n-icon size="32">
            <Alien />
          </n-icon>
          <n-text v-if=" playingStation || previousPlayingStation "
            :style="{ fontSize: '14px', opacity: 0.8, flex: 1, fontFamily: 'Goldman' as any }">
            {{stations.find( s => s.slugName === ( playingStation || previousPlayingStation ) )?.name || ( playingStation ||
            previousPlayingStation) }} - {{ currentSong || 'Loading...' }}
          </n-text>
        </div>
        <GlowLine :color="hoveredColor" />
      </n-layout-header>

      <n-layout-content :style="{ padding: '16px 16px 24px' }">
        <n-space vertical class="root" :style="{ maxWidth: '720px', margin: '0 auto' }">
          <n-space vertical size="large">
            <n-thing style="margin-bottom: 8px;">
              <template #header>
                <n-h1
                  style="font-size:32px; font-weight:bold; font-family: 'Kaylon', sans-serif; margin-top: 0; margin-bottom: 0px;">MIXPLA</n-h1>
              </template>
              <template #description>
                <span style="font-size:20px; opacity:.9;">You choose the vibe. AI keeps it live.</span>
              </template>
            </n-thing>

            <n-space vertical size="small">
              <n-space align="center">
                <strong style="font-size: 16px;">Featured Stations</strong>
                <n-checkbox v-model:checked="onlineOnly" @update:checked="handleOnlineOnlyUpdate">
                  Online Only
                </n-checkbox>
              </n-space>

              <template v-if=" loading ">
                <n-grid cols="1 s:2 m:3" responsive="screen" x-gap="12" y-gap="12">
                  <n-grid-item v-for=" i in 6 " :key="i">
                    <n-card :segmented="{ content: true }" content-style="padding: 16px;">
                      <n-space vertical size="small">
                        <n-skeleton text />
                        <n-skeleton text width="60%" />
                        <n-divider style="margin: 4px 0;" />
                        <n-skeleton height="28px" />
                      </n-space>
                    </n-card>
                  </n-grid-item>
                </n-grid>
              </template>
              <template v-else-if=" error ">
                <n-text type="error" style="font-size:14px;">Failed to load stations</n-text>
              </template>
              <template v-else>
                <n-grid cols="1 s:2 m:3" responsive="screen" x-gap="12" y-gap="12">
                  <n-grid-item v-for=" s in stations " :key="s.name">
                    <n-card class="station-card" :class="{ 'is-dimmed': hoveredStation && hoveredStation !== s.name }"
                      :segmented="{ content: true }" content-style="padding: 16px;" @click="goToStation( s )"
                      @mouseenter="hoveredColor = s.color; hoveredStation = s.name"
                      @mouseleave="hoveredColor = '#2196F3'; hoveredStation = null" :style="{
                        cursor: 'pointer',
                        height: '100%',
                        '--station-color': s.color
                      }">
                      <n-space vertical size="small">
                        <n-ellipsis :style="{ fontSize: '16px', fontWeight: 'bold' }">{{ s.name }}</n-ellipsis>
                        <n-space align="center" justify="space-between">
                          <n-space vertical size="small" style="min-width: 0; flex: 1;">
                            <n-ellipsis style="font-size:14px; opacity: 0.7;">{{ s.djName }}</n-ellipsis>
                            <span style="font-size:14px; opacity: 0.7;">{{ s.countryCode }}</span>
                          </n-space>
                          <!--<span :class="{ 'status-online': ['ON_LINE','WARMING_UP','IDLE'].includes(s.currentStatus as any) }"
                                 style="font-weight: 400; font-size: 12px; white-space: nowrap;"
                          >
                            {{ statusText(s.currentStatus) }}
                          </span>-->
                          <GlowingStatus :online="['ON_LINE', 'WARMING_UP', 'IDLE'].includes( s.currentStatus as any )"
                            :name="statusText( s.currentStatus )" :status="s.currentStatus" />

                        </n-space>
                        <n-divider style="margin: 4px 0;" />
                        <n-space align="center">
                          <router-link :to="`/${s.slugName}`" style="text-decoration:none;" @click.stop>
                            <n-button ghost color="#666">
                              <n-icon size="20">
                                <InfoSquare />
                              </n-icon>
                            </n-button>
                          </router-link>
                          <n-button ghost color="#666" @click.stop="togglePlay( s.slugName, s.currentStatus )" :class="{
                            'playing-glow': playingStation === s.slugName,
                            'error-pulse': errorStation === s.slugName
                          }">
                            <n-icon size="20">
                              <PlayerPlay />
                            </n-icon>
                          </n-button>
                        </n-space>
                      </n-space>
                    </n-card>
                  </n-grid-item>

                  <n-grid-item>
                    <router-link to="/outline/brands" style="text-decoration:none;">
                      <n-card :segmented="{ content: true }" content-style="padding: 16px;" hoverable
                        style="cursor: pointer; height: 100%; display: flex; align-items: center; justify-content: center; min-height: 120px;">
                        <n-space vertical align="center" justify="center" size="small">
                          <n-icon size="48" style="opacity: 0.5;">
                            <Plus />
                          </n-icon>
                          <n-text depth="3" style="font-size: 13px;">Add Your Vibe...</n-text>
                        </n-space>
                      </n-card>
                    </router-link>
                  </n-grid-item>
                </n-grid>
              </template>
            </n-space>

            <n-space vertical size="small" align="center">
              <a href="https://discord.com/channels/1395012925512613998/1395012926154346538" target="_blank"
                rel="noopener noreferrer" style="font-size:13px; text-decoration: underline;">Discord</a>
              <router-link to="/about" style="font-size:13px; text-decoration: underline;">About</router-link>
            </n-space>

          </n-space>
        </n-space>
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, watch } from 'vue'
import {
  NButton,
  NCard,
  NConfigProvider,
  NDivider,
  NEllipsis,
  NGrid,
  NGridItem,
  NH1,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NSkeleton,
  NSpace,
  NCheckbox,
  NText,
  NThing,
  darkTheme
} from 'naive-ui'
import { Plus, Alien, InfoSquare, PlayerPlay } from '@vicons/tabler'
import { useReferencesStore } from '../stores/kneo/referencesStore'
import GlowLine from '../components/common/GlowLine.vue'
import Hls from 'hls.js'
import GlowingStatus from '../components/common/GlowingStatus.vue'


interface Station {
  name: string;
  slugName: string;
  color: string;
  description: string;
  djName?: string;
  countryCode?: string;
  currentStatus?: 'ON_LINE' | 'OFF_LINE' | 'WARMING_UP' | 'IDLE';
  submissionPolicy?: 'NO_RESTRICTIONS' | 'REVIEW_REQUIRED' | 'NOT_ALLOWED';
  messagingPolicy?: 'NO_RESTRICTIONS' | 'REVIEW_REQUIRED' | 'NOT_ALLOWED';
}

const referencesStore = useReferencesStore()
const stations = ref<Station[]>( [] )
const loading = ref( true )
const error = ref<unknown | null>( null )
const hoveredColor = ref( '#2196F3' )
const onlineOnly = ref( localStorage.getItem( 'mixplaOnlineOnly' ) === 'true' )
const hoveredStation = ref<string | null>( null )
const playingStation = ref<string | null>( null )
const errorStation = ref<string | null>( null )
const currentSong = ref<string>( '' )
const previousPlayingStation = ref<string | null>( null )
const waitingForOfflineStation = ref<string | null>( null )
let hls: Hls | null = null
let audio: HTMLAudioElement | null = null
let songRefreshInterval: NodeJS.Timeout | null = null
let offlineWaitTimeout: NodeJS.Timeout | null = null
let stationRefreshInterval: NodeJS.Timeout | null = null


function statusText( s?: Station['currentStatus'] ) {
  if ( s === 'ON_LINE' ) return 'Online'
  if ( s === 'WARMING_UP' ) return 'Online'
  if ( s === 'IDLE' ) return 'Online'
  if ( s === 'OFF_LINE' ) return 'Offline'
  return 'Unknown'
}

function goToStation( s: Station ) {
  window.location.href = `/${s.slugName}`
}

function togglePlay( slugName: string, currentStatus?: string ) {
  if ( playingStation.value === slugName ) {
    stopPlayback()
  } else if ( errorStation.value === slugName ) {
    errorStation.value = null
  } else {
    if ( currentStatus === 'OFF_LINE' ) {
      // Stop current playback and keep previous station info
      if ( playingStation.value ) {
        previousPlayingStation.value = playingStation.value
        waitingForOfflineStation.value = slugName
        errorStation.value = slugName

        // Stop audio but keep playingStation for display
        if ( songRefreshInterval ) {
          clearInterval( songRefreshInterval )
          songRefreshInterval = null
        }
        if ( hls ) {
          hls.destroy()
          hls = null
        }
        if ( audio ) {
          audio.pause()
          audio = null
        }
        playingStation.value = null

        // Set timeout to automatically unpress after 3 minutes
        if ( offlineWaitTimeout ) {
          clearTimeout( offlineWaitTimeout )
        }
        offlineWaitTimeout = setTimeout( () => {
          if ( waitingForOfflineStation.value === slugName ) {
            waitingForOfflineStation.value = null
            errorStation.value = null
            previousPlayingStation.value = null
            offlineWaitTimeout = null
          }
        }, 3 * 60 * 1000 ) // 3 minutes
      } else {
        errorStation.value = slugName
      }
    } else {
      startPlayback( slugName )
    }
  }
}

function startPlayback( slugName: string ) {
  stopPlayback()
  errorStation.value = null

  const streamServer = import.meta.env.VITE_STREAM_SERVER
  const playlistUrl = `${streamServer}/${slugName}/radio/stream.m3u8`

  // Fetch and parse playlist to get current song
  fetchCurrentSong( playlistUrl )

  // Refresh song info every 5 seconds
  songRefreshInterval = setInterval( () => {
    fetchCurrentSong( playlistUrl )
  }, 5000 )

  audio = new Audio()
  hls = new Hls()

  hls.loadSource( playlistUrl )
  hls.attachMedia( audio )

  hls.on( Hls.Events.MANIFEST_PARSED, () => {
    audio?.play()
    playingStation.value = slugName
  } )

  hls.on( Hls.Events.FRAG_PARSING_METADATA, ( _, data ) => {
    for ( let i = 0; i < data.samples.length; i++ ) {
      const sample = data.samples[i]
      if ( sample.data ) {
        const decoder = new TextDecoder( 'utf-8' )
        const text = decoder.decode( sample.data )

        // Parse ID3 tags
        if ( text.includes( 'TIT2' ) ) {
          // Song title
          const match = text.match( /TIT2[^\0]*\0([^\0]*)/ )
          if ( match && match[1] ) {
            currentSong.value = match[1]
          }
        } else if ( text.includes( 'TPE1' ) ) {
          // Artist
          const match = text.match( /TPE1[^\0]*\0([^\0]*)/ )
          if ( match && match[1] ) {
            currentSong.value = `${match[1]} - ${currentSong.value}`
          }
        }
      }
    }
  } )

  hls.on( Hls.Events.ERROR, ( _, data ) => {
    if ( data.fatal ) {
      switch ( data.type ) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          hls?.startLoad()
          break
        case Hls.ErrorTypes.MEDIA_ERROR:
          hls?.recoverMediaError()
          break
        default:
          stopPlayback()
          break
      }
    }
  } )
}

async function fetchCurrentSong( playlistUrl: string ) {
  try {
    const response = await fetch( playlistUrl )
    const text = await response.text()
    const lines = text.split( '\n' )

    // Find the last EXTINF line
    for ( let i = lines.length - 1; i >= 0; i-- ) {
      const line = lines[i]
      if ( line.startsWith( '#EXTINF:' ) ) {
        // Extract song info after the comma
        const match = line.match( /#EXTINF:[^,]+,(.+)/ )
        if ( match && match[1] ) {
          currentSong.value = match[1]
          break
        }
      }
    }
  } catch ( error ) {
    console.error( 'Failed to fetch current song:', error )
  }
}

function stopPlayback() {
  if ( songRefreshInterval ) {
    clearInterval( songRefreshInterval )
    songRefreshInterval = null
  }
  if ( offlineWaitTimeout ) {
    clearTimeout( offlineWaitTimeout )
    offlineWaitTimeout = null
  }
  if ( hls ) {
    hls.destroy()
    hls = null
  }
  if ( audio ) {
    audio.pause()
    audio = null
  }
  playingStation.value = null
  errorStation.value = null
  previousPlayingStation.value = null
  waitingForOfflineStation.value = null
  currentSong.value = ''
}

function handleOnlineOnlyUpdate( value: boolean ) {
  onlineOnly.value = value
  localStorage.setItem( 'mixplaOnlineOnly', value ? 'true' : 'false' )
  fetchStations()
}

async function fetchStations( silent: boolean = false ) {
  try {
    if ( !silent ) {
      loading.value = true
    }
    const result = await referencesStore.fetchRadioStations( onlineOnly.value )
    stations.value = result || []
  } catch ( e ) {
    error.value = e
  } finally {
    if ( !silent ) {
      loading.value = false
    }
  }
}

onMounted( () => {
  fetchStations()
  
  // Start silent station refresh every 30 seconds
  stationRefreshInterval = setInterval( () => {
    fetchStations( true )
  }, 30000 )
} )

// Watch for station status changes
watch( stations, ( newStations ) => {
  if ( waitingForOfflineStation.value && offlineWaitTimeout ) {
    const waitingStation = newStations.find( s => s.slugName === waitingForOfflineStation.value )
    if ( waitingStation && waitingStation.currentStatus !== 'OFF_LINE' ) {
      // Station came online, start playing it
      clearTimeout( offlineWaitTimeout )
      offlineWaitTimeout = null
      startPlayback( waitingForOfflineStation.value )
      waitingForOfflineStation.value = null
      previousPlayingStation.value = null
    }
  }
}, { deep: true } )

onUnmounted( () => {
  stopPlayback()
  
  // Clear station refresh interval
  if ( stationRefreshInterval ) {
    clearInterval( stationRefreshInterval )
    stationRefreshInterval = null
  }
} )
</script>

<style scoped>
@font-face {
  font-family: 'ConthraxSB';
  src: url('/src/assets/fonts/conthrax-sb.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Kaylon';
  src: url('/src/assets/fonts/kaylonbold.otf') format('opentype');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}
</style>
<style scoped>
.neon-header {
  position: relative;
  overflow: visible;
  z-index: 1;
}

.station-card {
  border: 1px solid var(--station-color);
  transition: box-shadow 0.3s ease, filter 0.3s ease, border-color 0.3s ease;
}

.station-card.is-dimmed {
  border-color: #9ca3af !important;
}

.station-card:hover {
  box-shadow: inset 0 0 4px color-mix(in srgb, var(--station-color) 50%, transparent), 0 0 4px color-mix(in srgb, var(--station-color) 80%, transparent), 0 0 8px color-mix(in srgb, var(--station-color) 60%, transparent) !important;
  filter: brightness(125%) saturate(150%);
}

.playing-glow {
  color: #00FF3C !important;
  text-shadow:
    0 0 10px currentColor,
    0 0 25px currentColor,
    0 0 50px currentColor;
}

.error-pulse {
  color: #ff0000 !important;
  animation: error-pulse 0.8s ease-in-out infinite;
}

@keyframes error-pulse {

  0%,
  70%,
  100% {
    opacity: 1;
    text-shadow: 0 0 18px currentColor;
  }

  40% {
    opacity: 0.25;
    text-shadow: 0 0 4px currentColor;
  }
}

.status-online {
  color: #84cc16 !important;
  text-shadow:
    0 0 5px currentColor,
    0 0 15px currentColor,
    0 0 30px currentColor;
}

@media (max-width: 640px) {
  .actions {
    grid-column: 1 / -1 !important;
    justify-content: flex-start !important;
    margin-top: 6px;
  }
}

/*
.mixpla-title {
  font-size: 30px;
  font-weight: bold;
  font-family: 'Kaylon', sans-serif;
  margin: 0;
  background: linear-gradient(90deg, #0095ff, #0fb8ed, #020ef8, #5b899e, #2196f3, #9c27b0);
  background-size: 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: glow-move 12s linear infinite;
}

@keyframes glow-move {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}*/
</style>
