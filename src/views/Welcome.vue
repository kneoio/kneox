<template>
  <n-config-provider>
    <n-layout :native-scrollbar="true"
              :style="{ minHeight: '100vh', backgroundColor: '#f8f8f8' }"
              class="welcome-layout">
      <n-layout-header bordered :style="{ background: 'transparent' }">
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
                  <n-h1 style="font-size:30px; font-weight:bold; font-family: 'Kaylon', sans-serif;">MIXPLA</n-h1>
                </template>
                <template #description>
                  <span style="font-size:19px; opacity:.9; font-family: 'ConthraxSB', sans-serif;">Build your radio station. Let AI DJ handle the flow.</span>
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
                  <n-thing v-for="s in stations" :key="s.slugName" @click="openPlayer(s)"
                          style="cursor:pointer;">
                    <template #avatar>
                      <div :style="{ width:'6px', height:'100%', borderRadius:'9999px', background: s.color }"></div>
                    </template>
                    <template #header>
                      <n-space align="center" justify="space-between" :wrap="false">
                        <strong style="font-size:15px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ s.name }}</strong>
                        <span :class="{ online: ['ON_LINE','WARMING_UP'].includes(s.currentStatus as any) }"
                              :style="(['ON_LINE','WARMING_UP'].includes(s.currentStatus as any))
                              ? 'color: #84cc16 !important; text-shadow: 0 0 10px rgba(132, 204, 22, 1), 0 0 14px rgba(132, 204, 22, 0.6); font-weight: 400 !important;'
                              : 'font-weight: 400;'"
                        >
                          {{ statusText(s.currentStatus) }}
                        </span>
                      </n-space>
                    </template>
                    <template #description>
                      <div style="font-size:14px; opacity:.85;">{{ s.description }}</div>
                    </template>
                    <template #footer>
                      <n-space size="small" wrap>
                        <router-link v-if="s.submissionPolicy !== 'NOT_ALLOWED'" :to="{ name: 'SubmitSong', query: { brand: s.slugName } }" style="text-decoration:none;" @click.stop>
                          <n-button size="small" secondary>Submit song</n-button>
                        </router-link>
                        <router-link v-if="s.messagingPolicy !== 'NOT_ALLOWED'" :to="{ name: 'PostMessage', query: { brand: s.slugName } }" style="text-decoration:none;" @click.stop>
                          <n-button size="small" tertiary>Post message</n-button>
                        </router-link>
                      </n-space>
                    </template>
                  </n-thing>
                </n-space>
              </template>
            </n-card>

            <n-space vertical size="small" align="center">
              <a href="https://discord.com/channels/1395012925512613998/1395012926154346538" target="_blank" rel="noopener noreferrer" style="font-size:13px; text-decoration: underline;">Discord</a>
              <router-link to="/m/about" style="font-size:13px; text-decoration: underline;">About</router-link>
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
import { computed, onMounted, ref } from 'vue'
import { NConfigProvider, NLayout, NLayoutHeader, NLayoutContent, NSpace, NCard, NThing, NH1, NButton, NIcon, NText, NSkeleton } from 'naive-ui'
import { ArrowRight } from '@vicons/tabler'
import { useReferencesStore } from '../stores/kneo/referencesStore'
import { MIXPLA_PLAYER_URL } from '../constants/config'

interface Station {
  name: string;
  slugName: string;
  color: string;
  description: string;
  currentStatus?: 'ON_LINE' | 'OFF_LINE' | 'WARMING_UP';
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
  if (s === 'OFF_LINE') return 'Offline'
  return 'Unknown'
}

function openPlayer(s: Station) {
  const url = `${playerBase.value}?radio=${encodeURIComponent(s.name.toLowerCase())}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function fetchStations() {
  try {
    loading.value = true
    const data = await referencesStore.fetchRadioStations()
    stations.value = data
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

/* Force green in dark mode where we globally set text color via :deep */
.welcome-dark :deep(.root),
.welcome-dark :deep(.root *) {
  color: #e0e0e0 !important;
}

/* Re-apply green for status after global dark text color */
.welcome-dark :deep(.root .online) {
  color: #16a34a !important;
  text-shadow: 0 0 6px rgba(34, 197, 94, 0.6) !important;
}
</style>
