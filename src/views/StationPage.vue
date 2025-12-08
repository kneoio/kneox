<template>
  <n-config-provider :theme="darkTheme">
    <n-layout>
      <n-layout-header class="neon-header">
        <n-space align="center" justify="space-between" :wrap="false" :style="{ maxWidth: '720px', margin: '0 auto', padding: '12px 16px' }">
          <n-button quaternary size="small" @click="goHome" :focusable="false">
            <n-icon size="16"><ArrowLeft /></n-icon>
            Home
          </n-button>
          <n-icon size="32"><Alien /></n-icon>
        </n-space>
        <GlowLine :color="station?.color || '#2196F3'" />
      </n-layout-header>

      <n-layout-content :style="{ padding: '16px 16px 24px' }">
        <n-space vertical class="root" :style="{ maxWidth: '720px', margin: '0 auto' }">
          <template v-if="loading">
            <n-space vertical size="large">
              <n-space vertical size="small">
                <n-skeleton text width="200px" style="height: 30px;" />
                <n-skeleton text :repeat="3" />
              </n-space>

              <n-card :segmented="{ content: true }" content-style="padding: 16px;">
                <n-space vertical size="small">
                  <n-skeleton text width="100px" />
                  <n-skeleton text width="150px" />
                </n-space>
              </n-card>

              <n-grid cols="1 s:2" responsive="screen" x-gap="12" y-gap="12">
                <n-grid-item>
                  <n-card :segmented="{ content: true }" content-style="padding: 16px;">
                    <n-space vertical align="center" justify="center" size="small">
                      <n-skeleton circle width="32px" height="32px" />
                      <n-skeleton text width="100px" />
                    </n-space>
                  </n-card>
                </n-grid-item>
              </n-grid>
            </n-space>
          </template>
          <template v-else-if="error">
            <n-text type="error" style="font-size:14px;">Failed to load station</n-text>
          </template>
          <template v-else-if="station">
            <n-space vertical size="large">
              <n-space vertical size="small" align="center" justify="center">
                <n-thing>
                  <template #header>
                    <n-h1 style="font-size:30px; font-weight:bold; margin-top: 0; margin-bottom: 0px;">{{ station.name }}</n-h1>
                  </template>
                  <template #description>
                    <span style="font-size:16px; opacity:.9;">{{ station.description }}</span>
                  </template>
                </n-thing>
              </n-space>

              <n-card :segmented="{ content: true }" content-style="padding: 16px;">
                <n-space vertical size="small">
                  <n-text strong>Station Info</n-text>
                  <n-space align="center">
                    <n-text depth="3">Status:</n-text>
                    <span
                      :class="{ 'status-online': ['ON_LINE','WARMING_UP','IDLE'].includes(station.currentStatus as any) }"
                      style="font-weight: 400; font-size: 14px;"
                    >
                      {{ statusText(station.currentStatus) }}
                    </span>
                  </n-space>
                </n-space>
              </n-card>

              <n-grid cols="1 s:2" responsive="screen" x-gap="12" y-gap="12">
                <n-grid-item>
                  <n-card 
                    class="station-action-card"
                    :class="{ 'is-dimmed': hoveredAction && hoveredAction !== 'player' }"
                    :segmented="{ content: true }" 
                    content-style="padding: 16px;"
                    @click="openPlayer"
                    @mouseenter="hoveredAction = 'player'"
                    @mouseleave="hoveredAction = null"
                    :style="{
                      cursor: 'pointer',
                      height: '100%',
                      '--station-color': station.color
                    }"
                  >
                    <n-space vertical align="center" justify="center" size="small">
                      <n-icon size="32" color="#666666">
                        <PlayerPlay />
                      </n-icon>
                      <n-text strong>Open Player</n-text>
                    </n-space>
                  </n-card>
                </n-grid-item>

                <n-grid-item v-if="station.messagingPolicy !== 'NOT_ALLOWED'">
                  <n-card 
                    class="station-action-card"
                    :class="{ 'is-dimmed': hoveredAction && hoveredAction !== 'chat' }"
                    :segmented="{ content: true }" 
                    content-style="padding: 16px;"
                    @click="goToChat"
                    @mouseenter="hoveredAction = 'chat'"
                    @mouseleave="hoveredAction = null"
                    :style="{
                      cursor: 'pointer',
                      height: '100%',
                      '--station-color': station.color
                    }"
                  >
                    <n-space vertical align="center" justify="center" size="small">
                      <n-icon size="32" color="#666666">
                        <MessageCircle />
                      </n-icon>
                      <n-text strong>Chat with DJ</n-text>
                    </n-space>
                  </n-card>
                </n-grid-item>

                <n-grid-item v-if="station.submissionPolicy !== 'NOT_ALLOWED'">
                  <n-card 
                    class="station-action-card"
                    :class="{ 'is-dimmed': hoveredAction && hoveredAction !== 'submit' }"
                    :segmented="{ content: true }" 
                    content-style="padding: 16px;"
                    @click="goToSubmitSong"
                    @mouseenter="hoveredAction = 'submit'"
                    @mouseleave="hoveredAction = null"
                    :style="{
                      cursor: 'pointer',
                      height: '100%',
                      '--station-color': station.color
                    }"
                  >
                    <n-space vertical align="center" justify="center" size="small">
                      <n-icon size="32" color="#666666">
                        <Music />
                      </n-icon>
                      <n-text strong>Submit Song</n-text>
                    </n-space>
                  </n-card>
                </n-grid-item>
              </n-grid>
            </n-space>
          </template>
        </n-space>
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NConfigProvider,
  NGrid,
  NGridItem,
  NH1,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NSkeleton,
  NSpace,
  NText,
  NThing,
  darkTheme
} from 'naive-ui'
import { ArrowLeft, Alien, MessageCircle, Music, PlayerPlay } from '@vicons/tabler'
import { useReferencesStore } from '../stores/kneo/referencesStore'
import { MIXPLA_PLAYER_URL } from '../constants/config'
import GlowLine from '../components/common/GlowLine.vue'

interface Station {
  name: string;
  slugName: string;
  color: string;
  description: string;
  currentStatus?: 'ON_LINE' | 'OFF_LINE' | 'WARMING_UP' | 'IDLE';
  submissionPolicy?: 'NO_RESTRICTIONS' | 'REVIEW_REQUIRED' | 'NOT_ALLOWED';
  messagingPolicy?: 'NO_RESTRICTIONS' | 'REVIEW_REQUIRED' | 'NOT_ALLOWED';
  availableSongs?: number | null;
}

const route = useRoute()
const router = useRouter()
const referencesStore = useReferencesStore()
const brandSlug = ref(route.params.brand as string)
const station = ref<Station | null>(null)
const loading = ref(true)
const error = ref<unknown | null>(null)
const hoveredAction = ref<string | null>(null)


function statusText(s?: Station['currentStatus']) {
  if (s === 'ON_LINE') return 'Online'
  if (s === 'WARMING_UP') return 'Online'
  if (s === 'IDLE') return 'Online'
  if (s === 'OFF_LINE') return 'Offline'
  return 'Unknown'
}

function goHome() {
  router.push('/')
}

function goToChat() {
  router.push({ name: 'PostMessage', query: { brand: brandSlug.value } })
}

function goToSubmitSong() {
  router.push({ name: 'SubmitSong', query: { brand: brandSlug.value } })
}

function openPlayer() {
  const url = `${MIXPLA_PLAYER_URL}?radio=${encodeURIComponent(brandSlug.value.toLowerCase())}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function fetchStation() {
  try {
    loading.value = true
    const stations = await referencesStore.fetchRadioStations()
    station.value = stations.find((s: Station) => s.slugName.toLowerCase() === brandSlug.value.toLowerCase()) || null
    error.value = null
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStation()
})
</script>

<style scoped>
.online {
  color: #16a34a !important;
  text-shadow: 0 0 6px rgba(34, 197, 94, 0.6) !important;
}

.status-online {
  color: #84cc16 !important;
  text-shadow:
    0 0 5px currentColor,
    0 0 15px currentColor,
    0 0 30px currentColor;
}

.station-action-card {
  border: 1px solid var(--station-color);
  transition: box-shadow 0.3s ease, filter 0.3s ease, border-color 0.3s ease;
}

.station-action-card.is-dimmed {
  border-color: #9ca3af !important;
}

.station-action-card:hover {
  box-shadow: inset 0 0 4px color-mix(in srgb, var(--station-color) 50%, transparent), 0 0 4px color-mix(in srgb, var(--station-color) 80%, transparent), 0 0 8px color-mix(in srgb, var(--station-color) 60%, transparent) !important;
  filter: brightness(125%) saturate(150%);
}

.neon-header {
  position: relative;
  overflow: visible;
  z-index: 1;
}
</style>
