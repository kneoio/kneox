<template>
  <n-config-provider>
    <n-layout>
      <n-layout-header bordered>
        <n-space align="center" justify="space-between" :wrap="false" :style="{ maxWidth: '720px', margin: '0 auto', padding: '12px 16px' }">
          <n-button quaternary size="small" @click="goHome" :focusable="false">
            <n-icon size="16"><ArrowLeft /></n-icon>
            Home
          </n-button>
          <img src="/pwa-192x192.png" alt="Mixpla" style="width:32px;height:32px;" />
        </n-space>
      </n-layout-header>

      <n-layout-content :style="{ padding: '0 16px 24px' }">
        <n-space vertical class="root" :style="{ maxWidth: '720px', margin: '0 auto' }">
          <template v-if="loading">
            <n-skeleton text :repeat="5" />
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
                <n-space vertical size="large">
                  <n-space vertical size="small">
                    <n-text strong>Station Info</n-text>
                    <n-space align="center">
                      <n-text depth="3">Songs:</n-text>
                      <n-text :style="`color: ${station.color}; font-weight: 600;`">{{ station.availableSongs ?? 0 }}</n-text>
                    </n-space>
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

                  <n-divider style="margin: 8px 0;" />

                  <n-space vertical size="small">
                    <n-button v-if="station.messagingPolicy !== 'NOT_ALLOWED'" type="primary" :color="station.color" @click="goToChat" block>
                      <template #icon><n-icon><MessageCircle /></n-icon></template>
                      Jump to Chat
                    </n-button>
                    <n-button v-if="station.submissionPolicy !== 'NOT_ALLOWED'" :color="station.color" @click="showSubmitSong = true" block>
                      <template #icon><n-icon><Music /></n-icon></template>
                      Submit Song
                    </n-button>
                  </n-space>
                </n-space>
              </n-card>
            </n-space>
          </template>
        </n-space>
      </n-layout-content>
    </n-layout>

    <n-modal v-model:show="showSubmitSong" preset="card" title="Submit Song" :style="{ maxWidth: '720px' }" :segmented="{ content: true }">
      <SubmitSongForm :brand-slug="brandSlug" @close="showSubmitSong = false" />
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NConfigProvider,
  NDivider,
  NH1,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NModal,
  NSkeleton,
  NSpace,
  NText,
  NThing
} from 'naive-ui'
import { ArrowLeft, MessageCircle, Music } from '@vicons/tabler'
import { useReferencesStore } from '../stores/kneo/referencesStore'
import SubmitSongForm from '../components/public/SubmitSongForm.vue'

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
const showSubmitSong = ref(false)

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
