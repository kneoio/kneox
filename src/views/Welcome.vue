<template>
  <n-config-provider>
    <n-layout>
      <n-layout-header bordered>
        <n-space align="center" justify="space-between" :wrap="false" :style="{ maxWidth: '720px', margin: '0 auto', padding: '12px 16px' }">
          <img src="/pwa-192x192.png" alt="Mixpla" style="width:32px;height:32px;" />
        </n-space>
      </n-layout-header>

      <n-layout-content :style="{ padding: '0 16px 24px' }">
        <n-space vertical class="root" :style="{ maxWidth: '720px', margin: '0 auto' }">
          <n-space vertical size="large">
            <n-space vertical size="small" align="center" justify="center">
              <n-thing>
                <template #header>
                  <n-h1 style="font-size:30px; font-weight:bold; font-family: 'Kaylon', sans-serif; margin-top: 0; margin-bottom: 0px;">MIXPLA</n-h1>
                </template>
                <template #description>
                  <span style="font-size:20px; opacity:.9;">Build your radio station. Let AI DJ handle the flow.</span>
                </template>
              </n-thing>
            </n-space>

            <n-card :segmented="{ content: true }" content-style="padding: 8px 12px;">
              <template #header>
                <n-space align="center" justify="space-between" :wrap="false" style="width:100%">
                  <strong>Featured Stations</strong>
                </n-space>
              </template>

              <template v-if="loading">
                <n-skeleton text :repeat="3" />
              </template>
              <template v-else-if="error">
                <n-text type="error" style="font-size:14px;">Failed to load stations</n-text>
              </template>
              <template v-else>
                <n-space vertical size="small">
                  <n-thing v-for="s in stations" :key="s.name" @click="openPlayer(s)"
                          style="cursor:pointer;">
                    <template #avatar>
                      <div :style="{ width:'6px', height:'100%', borderRadius:'9999px', background: s.color }"></div>
                    </template>
                    <template #header>
                      <n-grid :cols="24" :x-gap="8" :y-gap="0" style="width: 100%">
                        <n-gi :span="18">
                          <n-space align="center" :wrap="false" style="min-width: 0;">
                            <strong style="font-size:15px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ s.name }}</strong>
                            <span :class="{ online: ['ON_LINE','WARMING_UP'].includes(s.currentStatus as any) }"
                                   :style="(['ON_LINE','WARMING_UP'].includes(s.currentStatus as any))
                                   ? 'color: #84cc16 !important; text-shadow: 0 0 14px rgba(132, 204, 22, 1), 0 0 24px rgba(132, 204, 22, 0.75); font-weight: 400 !important; font-size: 12px;'
                                   : 'font-weight: 400; font-size: 12px;'"
                            >
                              {{ statusText(s.currentStatus) }}
                            </span>
                          </n-space>
                        </n-gi>
                        <n-gi :span="6" class="actions" style="display:flex; justify-content:flex-end; min-width: 0;">
                          <n-space size="small" :wrap="false" style="white-space: nowrap;">
                            <router-link v-if="s.submissionPolicy !== 'NOT_ALLOWED'" :to="{ name: 'SubmitSong', query: { brand: s.slugName } }" style="text-decoration:none;" @click.stop>
                              <n-button size="tiny" dashed :color="s.color">Submit song</n-button>
                            </router-link>
                            <router-link v-if="s.messagingPolicy !== 'NOT_ALLOWED'" :to="{ name: 'PostMessage', query: { brand: s.slugName } }" style="text-decoration:none;" @click.stop>
                              <n-button size="tiny" :color="s.color" dashed>Post message</n-button>
                            </router-link>
                          </n-space>
                        </n-gi>
                      </n-grid>
                    </template>
                    <template #description>
                      <div style="font-size:14px; opacity:.85;">{{ s.description }}</div>
                    </template>
                    <n-divider />
                  </n-thing>
                </n-space>
              </template>
            </n-card>

            <n-space vertical size="small" align="center">
              <a href="https://discord.com/channels/1395012925512613998/1395012926154346538" target="_blank" rel="noopener noreferrer" style="font-size:13px; text-decoration: underline;">Discord</a>
              <router-link to="/about" style="font-size:13px; text-decoration: underline;">About</router-link>
            </n-space>

            <n-space align="center" justify="center">
              <router-link to="/outline/radiostations" style="text-decoration:none;">
                <n-button size="large" style="width: 220px;">
                  Manage Radiostations
                  <template #icon><n-icon><ArrowRight /></n-icon></template>
                </n-button>
              </router-link>
            </n-space>
          </n-space>
        </n-space>
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {
  NButton,
  NCard,
  NConfigProvider,
  NDivider,
  NGi,
  NGrid,
  NH1,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NSkeleton,
  NSpace,
  NText,
  NThing
} from 'naive-ui'
import {ArrowRight} from '@vicons/tabler'
import {useReferencesStore} from '../stores/kneo/referencesStore'
import {MIXPLA_PLAYER_URL} from '../constants/config'

interface Station {
  name: string;
  slugName: string;
  color: string;
  description: string;
  currentStatus?: 'ON_LINE' | 'OFF_LINE' | 'WARMING_UP' | 'WAITING_FOR_CURATOR';
  submissionPolicy?: 'NO_RESTRICTIONS' | 'REVIEW_REQUIRED' | 'NOT_ALLOWED';
  messagingPolicy?: 'NO_RESTRICTIONS' | 'REVIEW_REQUIRED' | 'NOT_ALLOWED';
}

const referencesStore = useReferencesStore()
const stations = ref<Station[]>([])
const loading = ref(true)
const error = ref<unknown | null>(null)

const playerBase = computed(() => MIXPLA_PLAYER_URL)

function statusText(s?: Station['currentStatus']) {
  if (s === 'ON_LINE') return 'Online'
  if (s === 'WARMING_UP') return 'Online'
  if (s === 'WAITING_FOR_CURATOR') return 'Online'
  if (s === 'OFF_LINE') return 'Offline'
  return 'Unknown'
}

function openPlayer(s: Station) {
  const url = `${playerBase.value}?radio=${encodeURIComponent(s.slugName.toLowerCase())}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function fetchStations() {
  try {
    loading.value = true
    stations.value = await referencesStore.fetchRadioStations()
    error.value = null
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStations()
})
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
.online {
  color: #16a34a !important;
  text-shadow: 0 0 6px rgba(34, 197, 94, 0.6) !important;
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
