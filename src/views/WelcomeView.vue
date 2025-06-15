<template>
  <div class="min-h-screen flex items-center justify-center body-bg">
    <div class="max-w-6xl mx-auto px-8 py-12">
      <div class="flex flex-col items-center space-y-8 mb-12">
        <div class="w-32 h-32 mb-4">
          <img src="/iomix.jpg" alt="IOMIX Logo" class="w-full h-full object-contain">
        </div>
        <h1 class="text-5xl font-extrabold text-gray-800">IOMIX</h1>
        <p class="max-w-3xl text-center text-lg text-gray-600">
          Welcome to IOMIX, your all-in-one platform for creating, managing, and broadcasting internet radio stations with ease. Dive in and let your voice be heard.
        </p>
      </div>

      <div id="stations-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div v-for="(station, index) in stationsData" :key="station.slug_name" :class="`vivid-border-${(index % 3) + 1}`" class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-bold mb-2 text-gray-800">{{ station.slug_name }} ({{ station.country }})</h3>
          <p class="text-gray-600">{{ station.description }}</p>
        </div>
      </div>

      <div class="text-center mt-12">
        <router-link
           to="/outline/dashboard"
           class="group relative inline-flex items-center px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl border-2 border-transparent hover:border-blue-600 hover:bg-gradient-to-r hover:from-transparent hover:to-transparent hover:text-blue-600 transition-all duration-500 ease-out transform hover:scale-105"
        >
          <span class="relative z-10">Launch Your Radio</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 0 110-2h7.586l-2.293-2.293a1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const stationsData = ref([
  { country: 'KZ', description: 'Deep house, funk, disco, and electronic dance music with groovy basslines. Features underground house beats, classic funk rhythms, and modern disco-influenced tracks that keep the dance floor moving.', slug_name: 'bratan' },
  { country: 'GB', description: 'Nostalgic chiptune and 8-bit music celebrating retro gaming culture. From classic arcade soundtracks to modern chip music artists, perfect for gamers and digital nostalgia enthusiasts.', slug_name: 'bit2bit' },
  { country: 'PT', description: 'Ambient electronic and downtempo music for focus and relaxation. Features atmospheric soundscapes, chillout beats, and modern instrumental compositions perfect for work or study sessions.', slug_name: 'sexta' },
  { country: 'LV', description: 'Dark industrial, experimental electronic, and intelligent dance music (IDM). Features harsh mechanical beats, complex rhythmic patterns, and avant-garde electronic compositions for discerning listeners.', slug_name: 'labirints' },
  { country: 'JP', description: 'Cutting-edge J-pop, electronic dance music, and experimental beats. Showcasing the latest trends in Japanese music culture with high-energy tracks and innovative sound design.', slug_name: 'aizoo' },
  { country: 'DE', description: 'High-octane rock, metal, and punk music that hits hard. From classic heavy metal anthems to modern hardcore punk, delivering explosive energy 24/7.', slug_name: 'nitroglycerin' }
]);
</script>

<style scoped>
.body-bg {
  background-color: #f9fafb; /* Tailwind bg-gray-50 */
}
.vivid-border-1 {
  border-left: 4px solid #ff6b6b;
}
.vivid-border-2 {
  border-left: 4px solid #48dbfb;
}
.vivid-border-3 {
  border-left: 4px solid #feca57;
}
/* Assuming 'Inter' font is loaded globally, e.g., in index.html */
body {
  font-family: 'Inter', sans-serif;
}
</style>
