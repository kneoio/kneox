<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="max-w-7xl mx-auto px-8 py-12 w-full">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        
        <!-- Left Panel -->
        <div class="md:col-span-1 flex flex-col items-center justify-center space-y-8 text-center">
          <div class="w-48 h-48">
            <img src="/iomix.jpg" alt="IOMIX Logo" class="w-full h-full object-contain">
          </div>
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
              <div class="space-y-2 feature-border-1 pl-4">
                <h2 class="text-xl font-bold text-gray-800">Personal DJ</h2>
                <p class="text-gray-600">Let our system curate the perfect music mix just for you, or take control yourself.</p>
              </div>
              <div class="space-y-2 feature-border-2 pl-4">
                <h2 class="text-xl font-bold text-gray-800">Create Unique Tracks</h2>
                <p class="text-gray-600">Generate personalized songs and audio experiences on demand.</p>
              </div>
              <div class="space-y-2 feature-border-3 pl-4">
                <h2 class="text-xl font-bold text-gray-800">Share with Friends</h2>
                <p class="text-gray-600">Broadcast your station or share favorite tracks and playlists with your network.</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-800 border-b pb-2">Featured Stations</h2>
            <a v-for="station in stationsData" 
               :key="station.slug_name" 
               :href="`https://bratan.online/index.html?radio=${station.slug_name.toLowerCase()}`" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="block pt-2 group">
              <h3 class="text-xl font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{{ station.slug_name }}</h3>
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

onMounted(() => {
  document.body.style.fontFamily = `'Inter', sans-serif`;
  document.body.style.backgroundColor = '#f9fafb';
});

onUnmounted(() => {
  document.body.style.fontFamily = '';
  document.body.style.backgroundColor = '';
});

const stationsData = ref([
  { slug_name: 'Bratan', description: 'Deep house, funk, disco, and electronic dance music with groovy basslines. Features underground house beats, classic funk rhythms, and modern disco-influenced tracks that keep the dance floor moving.' },
  { slug_name: 'Bit2bit', description: 'Nostalgic chiptune and 8-bit music celebrating retro gaming culture. From classic arcade soundtracks to modern chip music artists, perfect for gamers and digital nostalgia enthusiasts.' },
  { slug_name: 'Sexta', description: 'Ambient electronic and downtempo music for focus and relaxation. Features atmospheric soundscapes, chillout beats, and modern instrumental compositions perfect for work or study sessions.' },
  { slug_name: 'Labirints', description: 'Dark industrial, experimental electronic, and intelligent dance music (IDM). Features harsh mechanical beats, complex rhythmic patterns, and avant-garde electronic compositions for discerning listeners.' },
  { slug_name: 'Aizoo', description: 'Cutting-edge J-pop, electronic dance music, and experimental beats. Showcasing the latest trends in Japanese music culture with high-energy tracks and innovative sound design.' },
  { slug_name: 'Nitroglycerin', description: 'High-octane rock, metal, and punk music that hits hard. From classic heavy metal anthems to modern hardcore punk, delivering explosive energy 24/7.' }
]);
</script>

<style scoped>
.feature-border-1 {
  border-left: 4px solid #48dbfb;
}
.feature-border-2 {
  border-left: 4px solid #feca57;
}
.feature-border-3 {
  border-left: 4px solid #ff6b6b;
}
</style>
