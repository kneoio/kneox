<template>
  <div :class="{ 'welcome-dark': isDarkTheme }" :style="{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: isDarkTheme ? '#1a1a1a' : '#f8f8f8', color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">
    <n-config-provider :theme="isDarkTheme ? darkTheme : null">
    <div class="welcome-root" :style="{ maxWidth: '1200px', width: '100%', padding: '48px 32px', margin: '0 auto', color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
        <n-switch :value="isDarkTheme" size="small" :round="false" @update:value="toggleTheme">
          <template #checked-icon>
            <n-icon>
              <Moon />
            </n-icon>
          </template>
          <template #unchecked-icon>
            <n-icon>
              <Sun />
            </n-icon>
          </template>
        </n-switch>
      </div>
      <n-alert type="warning" title="Beta test mode" :closable="true" style="margin-bottom: 16px;">
        This project is in beta test mode, so some features may not work properly. Any feedback is appreciated at
        <a href="mailto:stinazimas@gmail.com">stinazimas@gmail.com</a> or on
        <a href="https://discord.com/channels/1395012925512613998/1395012926154346538" target="_blank" rel="noopener noreferrer">Discord</a>.
      </n-alert>
      <!-- Centered intro section -->
      <div style="max-width: 768px; margin: 0 auto 40px; text-align: center;">
        <h1 :style="{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px', color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">Every Story Needs to Stream</h1>
        <p :style="{ fontSize: '1.125rem', color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">
          Build your radio station. Your AI DJ handles the beats while you craft the vibe. Because the best stories are told through music.
        </p>
      </div>

      <n-grid cols="24" x-gap="24" y-gap="48">
        <n-grid-item :span="8">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; text-align: center;">
            <div style="width: 192px; height: 192px;">
              <img src="/pwa-512x512.png" alt="Mixpla Logo" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <router-link to="/outline/radiostations" style="display: inline-block; max-width: 360px; width: 100%;">
              <n-tag type="info" size="large" style="width: 100%; display: inline-flex; align-items: center; justify-content: center; column-gap: 8px;">
                Launch Your Radio
                <n-icon><ArrowRight /></n-icon>
              </n-tag>
            </router-link>
            <a href="https://discord.com/channels/1395012925512613998/1395012926154346538" target="_blank" rel="noopener noreferrer" :style="{ fontSize: '0.875rem', display: 'block', color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">
              Join our Discord community
            </a>
            <router-link to="/about" :style="{ marginTop: '8px', display: 'inline-block', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'underline', color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">
              About the project
            </router-link>
          </div>
        </n-grid-item>
        <n-grid-item :span="16">
          <div style="display: flex; flex-direction: column; gap: 32px;">
            <div>
              <h2 :style="{ fontSize: '1.5rem', fontWeight: '700', borderBottom: '1px solid', borderBottomColor: isDarkTheme ? '#333' : '#e5e7eb', paddingBottom: '8px', color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">Featured Stations(Demo)</h2>
              <div v-if="isLoading">
                <n-skeleton text style="width: 60%" />
                <n-skeleton text :repeat="2" />
                <n-skeleton text style="width: 80%" />
              </div>
              <div v-else-if="error" :style="{ color: isDarkTheme ? '#ff7371' : '#ef4444' }">
                Error loading stations. Please try again later.
              </div>
              <a v-else v-for="station in stationsData" 
                 :key="station.name" 
                 :href="`${mixplaBaseUrl}?radio=${encodeURIComponent(station.name.toLowerCase())}`" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 :style="{ display: 'block', paddingTop: '8px', position: 'relative', paddingLeft: '20px', textDecoration: 'none', color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">
                 <div 
                  style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 9999px;"
                  :style="{ backgroundColor: station.color }"
                 ></div>
                <h3 :style="{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', columnGap: '8px', color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">
                  <n-space align="center" size="small">
                    <span>{{ station.name }}</span>
                    <n-tag size="small" :type="(['ON_LINE','WARMING_UP'].includes(station.currentStatus as string)) ? 'success' : 'default'">
                      {{ getStatusText(station.currentStatus) }}
                    </n-tag>
                  </n-space>
                </h3>
                <p :style="{ color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">{{ station.description }}</p>
              </a>
            </div>
          </div>
        </n-grid-item>
      </n-grid>
    </div>
    </n-config-provider>
  </div>
  </template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject, type Ref } from 'vue';
import { NIcon, NSkeleton, NTag, NSpace, NSwitch, NConfigProvider, NGrid, NGridItem, NAlert, darkTheme } from 'naive-ui';
import { ArrowRight, Sun, Moon } from '@vicons/tabler';
import { useReferencesStore } from '../stores/kneo/referencesStore';
import { MIXPLA_PLAYER_URL } from '../constants/config';

interface Station {
  name: string;
  countryCode: string;
  color: string;
  description: string;
  currentStatus?: 'ON_LINE' | 'OFF_LINE' | 'WARMING_UP';
}

onMounted(() => {
  document.body.style.fontFamily = `'Inter', sans-serif`;
  fetchStations();
  
  refreshInterval = setInterval(() => {
    fetchStations();
  }, 60000);
});

onUnmounted(() => {
  document.body.style.fontFamily = '';
  
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
});

const stationsData = ref<Array<Station>>([]);
const isLoading = ref(true);
const error = ref<Error | null>(null);
let refreshInterval: NodeJS.Timeout | null = null;

const referencesStore = useReferencesStore();

const mixplaBaseUrl = computed(() => {
  return MIXPLA_PLAYER_URL;
});

const fetchStations = async () => {
  try {
    isLoading.value = true;
    const data = await referencesStore.fetchRadioStations();
    stationsData.value = data;
  } catch (err) {
    console.error('Failed to fetch stations:', err);
    error.value = err instanceof Error ? err : new Error('Failed to load stations');
  } finally {
    isLoading.value = false;
  }
};

const getStatusText = (status?: 'ON_LINE' | 'OFF_LINE' | 'WARMING_UP'): string => {
  switch (status) {
    case 'ON_LINE':
      return 'Online';
    case 'OFF_LINE':
      return 'Offline';
    case 'WARMING_UP':
      return 'Online';
    default:
      return 'Unknown';
  }
};

// Theme injection from App.vue
const isDarkTheme = inject<Ref<boolean>>('isDarkTheme', ref(false));
const toggleTheme = inject<(value: boolean) => void>('toggleTheme', () => {});
</script>

<script lang="ts">
export default {
  components: { NConfigProvider }
}
</script>

<style scoped>
/* Make all text in Welcome follow the local theme, even under App.vue's global provider */
.welcome-dark :deep(.welcome-root),
.welcome-dark :deep(.welcome-root *:not(.n-tag):not(.n-tag *):not(.n-upload *):not(.n-upload-file-list *)) {
  color: #e0e0e0 !important;
}

/* Ensure light mode inherits normally */
:deep(.welcome-root),
:deep(.welcome-root *:not(.n-tag):not(.n-tag *):not(.n-upload *):not(.n-upload-file-list *)) {
  color: inherit !important;
}

/* Extra safety for common elements and visited links */
.welcome-dark :deep(a),
.welcome-dark :deep(a:visited),
.welcome-dark :deep(h1),
.welcome-dark :deep(h2),
.welcome-dark :deep(h3),
.welcome-dark :deep(p),
.welcome-dark :deep(span),
.welcome-dark :deep(li),
.welcome-dark :deep(label) {
  color: #e0e0e0 !important;
}
</style>
