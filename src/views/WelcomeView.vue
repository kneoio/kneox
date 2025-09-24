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
            <router-link to="/outline/radiostations" style="display: inline-block; max-width: 360px; width: 100%; text-decoration: none;">
              <n-button size="large" style="width: 100%; display: inline-flex; align-items: center; justify-content: center; column-gap: 8px;">
                <span>Manage Radiostations</span>
                <n-icon><ArrowRight /></n-icon>
              </n-button>
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
              <div v-else v-for="station in stationsData" 
                 :key="station.name" 
                 :style="{ display: 'block', paddingTop: '8px', position: 'relative', paddingLeft: '20px', textDecoration: 'none', color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">
                 <div 
                  style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 9999px;"
                  :style="{ backgroundColor: station.color }"
                 ></div>
                <h3 :style="{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }">
                  <span style="display:flex; align-items:center; gap:8px;">
                    <a
                      :href="`${mixplaBaseUrl}?radio=${encodeURIComponent(station.name.toLowerCase())}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="text-decoration: none; color: inherit;"
                    >
                      <span>{{ station.name }}</span>
                    </a>
                    <span
                      class="status-text"
                      :class="{ 'status-online': ['ON_LINE','WARMING_UP'].includes(station.currentStatus as any) }"
                      :style="(['ON_LINE','WARMING_UP'].includes(station.currentStatus as any))
                        ? 'color: #84cc16 !important; text-shadow: 0 0 10px rgba(132, 204, 22, 1), 0 0 18px rgba(132, 204, 22, 0.6); font-weight: 400 !important;'
                        : 'font-weight: 400;'"
                      @click="openPlayer(station)"
                      style="cursor: pointer;"
                    >
                      {{ getStatusText(station.currentStatus) }}
                    </span>
                  </span>
                  <span
                    v-if="station.submissionPolicy !== 'NOT_ALLOWED' || station.messagingPolicy !== 'NOT_ALLOWED'"
                    style="display: inline-flex; align-items: center; gap: 6px;"
                  >
                    <span
                      v-if="station.submissionPolicy !== 'NOT_ALLOWED'"
                      class="accepting-gradient"
                      :style="{ '--station-color': station.color }"
                      style="font-size: 14px; white-space: nowrap; font-family: 'Goldman', sans-serif;"
                    >
                      Submissions is open!
                    </span>
                    
                      <router-link
                        v-if="station.submissionPolicy !== 'NOT_ALLOWED'"
                        :to="{ name: 'SubmitSong', query: { brand: station.slugName } }"
                        style="display: inline-flex; text-decoration: none;"
                      >
                        <n-button
                          small
                          class="subtle-shake-x"
                          :style="{ animationDelay: shakeDelayX(station.slugName), animationDuration: shakeDurationX(station.slugName), animationTimingFunction: shakeTimingX(station.slugName) }"
                        >Submit song</n-button>
                      </router-link>
                      <span
                      v-if="station.submissionPolicy !== 'NOT_ALLOWED'"
                      class="accepting-gradient"
                      :style="{ '--station-color': station.color }"
                      style="font-size: 14px; white-space: nowrap; font-family: 'Goldman', sans-serif;"
                    >
                      or
                    </span>
                      <router-link
                        v-if="station.messagingPolicy !== 'NOT_ALLOWED'"
                        :to="{ name: 'PostMessage', query: { brand: station.slugName } }"
                        style="display: inline-flex; text-decoration: none;"
                      >
                        <n-button
                          small
                          class="subtle-shake-y"
                          :style="{ animationDelay: shakeDelayY(station.slugName), animationDuration: shakeDurationY(station.slugName), animationTimingFunction: shakeTimingY(station.slugName), animationDirection: 'alternate' }"
                        >Post a message</n-button>
                      </router-link>
                    
                  </span>
                </h3>
                <p
                  :style="{ color: isDarkTheme ? '#e0e0e0 !important' : '#333 !important' }"
                  @click="openPlayer(station)"
                  style="cursor: pointer;"
                >
                  {{ station.description }}
                </p>
                
              </div>
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
import { NIcon, NSkeleton, NButton, NButtonGroup, NSwitch, NConfigProvider, NGrid, NGridItem, NAlert, darkTheme } from 'naive-ui';
import { ArrowRight, Sun, Moon } from '@vicons/tabler';
import { useReferencesStore } from '../stores/kneo/referencesStore';
import { MIXPLA_PLAYER_URL } from '../constants/config';

interface Station {
  name: string;
  slugName: string;
  countryCode: string;
  color: string;
  description: string;
  currentStatus?: 'ON_LINE' | 'OFF_LINE' | 'WARMING_UP';
  submissionPolicy?: 'NO_RESTRICTIONS' | 'REVIEW_REQUIRED' | 'NOT_ALLOWED';
  messagingPolicy?: 'NO_RESTRICTIONS' | 'REVIEW_REQUIRED' | 'NOT_ALLOWED';
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

// Track initial load to avoid flicker on interval refreshes
const hasLoaded = ref(false);

const referencesStore = useReferencesStore();

const mixplaBaseUrl = computed(() => {
  return MIXPLA_PLAYER_URL;
});

const openPlayer = (station: Station) => {
  const url = `${mixplaBaseUrl.value}?radio=${encodeURIComponent(station.name.toLowerCase())}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const fetchStations = async () => {
  try {
    if (!hasLoaded.value) {
      isLoading.value = true;
    }
    const data = await referencesStore.fetchRadioStations();
    stationsData.value = data;
    error.value = null;
  } catch (err) {
    console.error('Failed to fetch stations:', err);
    error.value = err instanceof Error ? err : new Error('Failed to load stations');
  } finally {
    if (!hasLoaded.value) {
      isLoading.value = false;
      hasLoaded.value = true;
    }
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

function hashInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) >>> 0, h = Math.imul(h, 16777619) >>> 0;
  return h >>> 0;
}
function rand01(seed: number): number {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) % 1000) / 1000;
}
function shakeDelayX(slug: string): string {
  const r = rand01(hashInt(slug + 'x'));
  const val = (r * 8) - 4; // -4s .. +4s
  return `${val.toFixed(2)}s`;
}
function shakeDelayY(slug: string): string {
  const r = rand01(hashInt(slug + 'y'));
  const val = (r * 8) - 4; // -4s .. +4s
  return `${val.toFixed(2)}s`;
}
function shakeDurationX(slug: string): string {
  const r = rand01(hashInt(slug + 'dx'));
  return `${(5 + r * 4).toFixed(2)}s`; // 5s .. 9s
}
function shakeDurationY(slug: string): string {
  const r = rand01(hashInt(slug + 'dy'));
  return `${(5 + r * 4).toFixed(2)}s`; // 5s .. 9s
}
function shakeTimingX(slug: string): string {
  const r = Math.floor(rand01(hashInt(slug + 'tx')) * 4);
  return ['ease-in-out', 'ease', 'linear', 'cubic-bezier(0.4, 0.0, 0.2, 1)'][r] as string;
}
function shakeTimingY(slug: string): string {
  const r = Math.floor(rand01(hashInt(slug + 'ty')) * 4);
  return ['ease-in-out', 'ease', 'linear', 'cubic-bezier(0.2, 0.8, 0.2, 1)'][r] as string;
}
</script>

<script lang="ts">
export default {
  components: { NConfigProvider }
}
</script>

<style scoped>
 .fancy-btn {
  background: linear-gradient(135deg, #1f2937 0%, #334155 55%, #475569 110%) !important; /* muted slate gradient */
  color: #f5f5f5 !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  font-weight: 400 !important;
  letter-spacing: 0.2px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
 }

 .fancy-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.02);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.22);
 }

 .fancy-btn:active {
  transform: translateY(0);
  filter: brightness(0.98);
 }

 .status-text {
  font-size: 12px;
  opacity: 0.85;
 }

 .status-online {
  color: #16a34a !important; /* green-600 */
  text-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
 }

/* Subtle shake for CTA buttons */
.subtle-shake-x { animation: subtleShakeX 6s ease-in-out infinite; }
.subtle-shake-y { animation: subtleShakeY 6s ease-in-out infinite; }

@keyframes subtleShakeX {
  0%, 96%, 100% { transform: translateX(0); }
  97% { transform: translateX(0.6px); }
  98% { transform: translateX(-0.6px); }
  99% { transform: translateX(0.3px); }
}

@keyframes subtleShakeY {
  0%, 96%, 100% { transform: translateY(0); }
  97% { transform: translateY(0.6px); }
  98% { transform: translateY(-0.6px); }
  99% { transform: translateY(0.3px); }
}

@media (prefers-reduced-motion: reduce) {
  .subtle-shake-x, .subtle-shake-y { animation: none !important; }
}

/* Make all text in Welcome follow the local theme, even under App.vue's global provider */
.welcome-dark :deep(.welcome-root),
.welcome-dark :deep(.welcome-root *:not(.n-tag):not(.n-tag *):not(.n-button):not(.n-button *):not(.n-upload *):not(.n-upload-file-list *)) {
  color: #e0e0e0 !important;
}

/* Ensure light mode inherits normally */
:deep(.welcome-root),
:deep(.welcome-root *:not(.n-tag):not(.n-tag *):not(.n-button):not(.n-button *):not(.n-upload *):not(.n-upload-file-list *)) {
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

 /* Animated gradient text for the acceptance note */
 .accepting-gradient {
  background: linear-gradient(45deg, var(--station-color), #ff6ec7, #39ff14, #00ffff, var(--station-color));
  background-size: 300% 300%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: acceptGradientShift 6s ease-in-out infinite;
 }

 @keyframes acceptGradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
 }

 @media (prefers-reduced-motion: reduce) {
  .accepting-gradient { animation: none !important; }
 }
</style>
