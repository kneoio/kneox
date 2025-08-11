<template>
  <div class="min-h-screen flex items-center justify-center relative">
    <router-link 
      to="/" 
      class="absolute top-4 left-4 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
    >
      <n-icon><ArrowLeft /></n-icon>
      <span class="ml-1">Back to Home</span>
    </router-link>
    <div class="max-w-7xl mx-auto px-8 py-12 w-full">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        
        <div class="md:col-span-1 flex flex-col items-center justify-center space-y-6 text-center">
          <div class="w-48 h-48">
            <img src="/pwa-512x512.png" alt="Mixpla Logo" class="w-full h-full object-contain">
          </div>
          <router-link
             to="/outline/radiostations"
             class="group relative inline-flex items-center px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl border-2 border-transparent transition-all duration-500 ease-out transform hover:scale-105"
          >
            <span class="relative z-10" style="color: white !important;">Launch Your Radio</span>
            <n-icon class="ml-3 group-hover:translate-x-2 transition-transform duration-300" size="24" style="color: white !important;">
              <ArrowRight />
            </n-icon>
          </router-link>
          <a href="https://discord.gg/EqQry4Vg" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 block">
            Join our Discord community
          </a>
          <a href="https://t.me/project_mixpla" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 block mt-2">
            Join our Telegram community
          </a>
        </div>
        <div class="md:col-span-2 space-y-8">
          <div>
            <h1 class="text-4xl font-extrabold text-gray-800 mb-4">Every Story Needs to Stream</h1>
            <p class="text-lg text-gray-600">
              Build your radio station. Your AI DJ handles the beats while you craft the vibe. Because the best stories are told through music.
            </p>
          </div>

<div class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-800 border-b pb-2">Featured Stations(Demo)</h2>
            <div v-if="isLoading" class="space-y-4">
              <n-skeleton text style="width: 60%" />
              <n-skeleton text :repeat="2" />
              <n-skeleton text style="width: 80%" />
            </div>
            <div v-else-if="error" class="text-red-500">
              Error loading stations. Please try again later.
            </div>
            <a v-else v-for="station in stationsData" 
               :key="station.name" 
               :href="`${mixplaBaseUrl}?radio=${encodeURIComponent(station.name.toLowerCase())}`" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="block pt-2 group relative pl-5">
              <div 
                class="absolute left-0 top-0 bottom-0 w-1 rounded-full" 
                :style="{ backgroundColor: station.color }"
              ></div>
              <h3 class="text-xl font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{{ station.name }}</h3>
              <p class="text-gray-600 group-hover:text-gray-700 transition-colors">{{ station.description }}</p>
            </a>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { NIcon, NSkeleton } from 'naive-ui';
import { ArrowRight, ArrowLeft } from '@vicons/tabler';
import { useReferencesStore } from '../stores/kneo/referencesStore';
import { MIXPLA_URL } from '../constants/config';

interface Station {
  name: string;
  countryCode: string;
  color: string;
  description: string;
}

onMounted(() => {
  document.body.style.fontFamily = `'Inter', sans-serif`;
  document.body.style.backgroundColor = '#f9fafb';
  fetchStations();
  
  refreshInterval = setInterval(() => {
    fetchStations();
  }, 60000);
});

onUnmounted(() => {
  document.body.style.fontFamily = '';
  document.body.style.backgroundColor = '';
  
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
  return MIXPLA_URL;
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
</script>

<style scoped>
</style>
