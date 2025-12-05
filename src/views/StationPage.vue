<template>
  <n-config-provider :theme="darkTheme">
    <n-layout>
      <n-layout-header :style="{ 
        borderBottom: `3px solid ${station?.color || '#00ffff'}`,
        boxShadow: `inset 0 0 8px rgba(0,255,255,0.5), 0 0 8px rgba(0,255,255,0.8), 0 0 16px rgba(0,255,255,0.6)`,
        filter: 'brightness(125%) saturate(150%)'
      }">
        <n-space align="center" justify="space-between" :wrap="false" :style="{ maxWidth: '720px', margin: '0 auto', padding: '12px 16px' }">
          <n-button quaternary size="small" @click="goHome" :focusable="false">
            <n-icon size="16"><ArrowLeft /></n-icon>
            Home
          </n-button>
          <img src="/pwa-192x192.png" alt="Mixpla" style="width:32px;height:32px;" />
        </n-space>
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
                    <span :class="{ online: ['ON_LINE','WARMING_UP','IDLE'].includes(station.currentStatus as any) }"
                           :style="(['ON_LINE','WARMING_UP','IDLE'].includes(station.currentStatus as any))
                           ? 'color: #84cc16 !important; text-shadow: 0 0 14px rgba(132, 204, 22, 1), 0 0 24px rgba(132, 204, 22, 0.75); font-weight: 400 !important; font-size: 14px;'
                           : 'font-weight: 400; font-size: 14px;'"
                    >
                      {{ statusText(station.currentStatus) }}
                    </span>
                  </n-space>
                </n-space>
              </n-card>

              <n-grid cols="1 s:2" responsive="screen" x-gap="12" y-gap="12">
                <n-grid-item>
                  <n-card 
                    :segmented="{ content: true }" 
                    content-style="padding: 16px;"
                    hoverable
                    @click="openPlayer"
                    style="cursor: pointer; height: 100%;"
                  >
                    <n-space vertical align="center" justify="center" size="small">
                      <n-icon size="32" :color="station.color">
                        <PlayerPlay />
                      </n-icon>
                      <n-text strong>Open Player</n-text>
                    </n-space>
                  </n-card>
                </n-grid-item>

                <n-grid-item v-if="station.messagingPolicy !== 'NOT_ALLOWED'">
                  <n-card 
                    :segmented="{ content: true }" 
                    content-style="padding: 16px;"
                    hoverable
                    @click="goToChat"
                    style="cursor: pointer; height: 100%;"
                  >
                    <n-space vertical align="center" justify="center" size="small">
                      <n-icon size="32" :color="station.color">
                        <MessageCircle />
                      </n-icon>
                      <n-text strong>Chat with DJ</n-text>
                    </n-space>
                  </n-card>
                </n-grid-item>

                <n-grid-item v-if="station.submissionPolicy !== 'NOT_ALLOWED'">
                  <n-card 
                    :segmented="{ content: true }" 
                    content-style="padding: 16px;"
                    hoverable
                    @click="goToSubmitSong"
                    style="cursor: pointer; height: 100%;"
                  >
                    <n-space vertical align="center" justify="center" size="small">
                      <n-icon size="32" :color="station.color">
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
import { ArrowLeft, MessageCircle, Music, PlayerPlay } from '@vicons/tabler'
import { useReferencesStore } from '../stores/kneo/referencesStore'
import { MIXPLA_PLAYER_URL } from '../constants/config'

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
</style>
