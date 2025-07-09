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
        
        <!-- Left Panel -->
        <div class="md:col-span-1 flex flex-col items-center justify-center space-y-6 text-center">
          <div class="w-48 h-48">
            <img src="/pwa-512x512.png" alt="Mixpla Logo" class="w-full h-full object-contain">
          </div>
          <router-link
             to="/outline/dashboard"
             class="group relative inline-flex items-center px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl border-2 border-transparent hover:border-blue-600 hover:bg-gradient-to-r hover:from-transparent hover:to-transparent hover:text-blue-600 transition-all duration-500 ease-out transform hover:scale-105"
          >
            <span class="relative z-10">Launch Your Radio</span>
            <n-icon class="ml-3 group-hover:translate-x-2 transition-transform duration-300" size="24">
              <ArrowRight />
            </n-icon>
          </router-link>
        </div>

        <!-- Right Panel -->
        <div class="md:col-span-2 space-y-8">
          <div>
            <h1 class="text-4xl font-extrabold text-gray-800 mb-4">Every Story Needs to Stream</h1>
            <p class="text-lg text-gray-600">
              Build your radio station. Your AI DJ handles the beats while you craft the vibe. Because the best stories are told through music.
            </p>
          </div>

          <div class="bg-slate-100 p-6 rounded-lg">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div class="space-y-2 border-l-2 border-gray-300 pl-4">
                <h2 class="text-xl font-bold text-gray-800">Personal DJ</h2>
                <p class="text-gray-600">Let our system curate the perfect music mix just for you, or take control yourself.</p>
              </div>
              <div class="space-y-2 border-l-2 border-gray-300 pl-4">
                <h2 class="text-xl font-bold text-gray-800">Create Unique Tracks</h2>
                <p class="text-gray-600">Generate personalized songs and audio experiences on demand.</p>
              </div>
              <div class="space-y-2 border-l-2 border-gray-300 pl-4">
                <h2 class="text-xl font-bold text-gray-800">Share with Friends</h2>
                <p class="text-gray-600">Broadcast your station or share favorite tracks and playlists with your network.</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-800 border-b pb-2">Featured Stations</h2>
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
               :href="`${radioPlayerHost}?radio=${station.name.toLowerCase()}`" 
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
import { ref, onMounted, onUnmounted } from 'vue';
import { NIcon, NSkeleton } from 'naive-ui';
import { ArrowRight, ArrowLeft } from '@vicons/tabler';
import { getRadioStations } from '../api/apiClient';

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
});

onUnmounted(() => {
  document.body.style.fontFamily = '';
  document.body.style.backgroundColor = '';
});

const stationsData = ref<Array<Station>>([]);
const isLoading = ref(true);
const error = ref<Error | null>(null);

const radioPlayerHost = ref('https://mixpla246.windsurf.build');

const fetchStations = async () => {
  try {
    isLoading.value = true;
    const data = await getRadioStations();
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
/* Removed individual feature border styles as they're now handled by Tailwind classes */
</style>
