<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div class="max-w-6xl mx-auto px-8 py-16">
      
      <!-- Header -->
      <div class="text-center mb-16">
        <div class="w-32 h-32 mx-auto mb-8">
          <img src="/logo.png" alt="Kneo.io Logo" class="w-full h-full object-contain">
        </div>

        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Pioneering the future of digital experiences through innovative technology solutions
        </p>
      </div>

      <!-- About Section -->
      <div class="bg-white rounded-2xl shadow-lg p-8 mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-6 text-center">Who We Are</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p class="text-gray-700 leading-relaxed mb-4">
              At kneo.io, we transform ideas into cutting-edge digital solutions. Our team of experts specializes in creating innovative platforms that bridge the gap between technology and human experience.
            </p>
            <p class="text-gray-700 leading-relaxed">
              We believe in the power of seamless integration, intelligent automation, and user-centric design to drive meaningful change across industries.
            </p>
          </div>
          <div class="space-y-4">
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span class="text-gray-700">Innovation-driven development</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span class="text-gray-700">Scalable enterprise solutions</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span class="text-gray-700">AI-powered experiences</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Featured Project -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 class="text-3xl font-bold mb-4">Introducing Mixpla</h2>
            <p class="text-blue-100 mb-6 leading-relaxed">
              Our flagship project revolutionizing the audio streaming landscape. Experience personalized radio stations powered by AI, where every beat tells your story.
            </p>
            <router-link
              to="/mixpla"
              class="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span>Explore Mixpla</span>
              <n-icon class="ml-3" size="20">
                <ArrowRight />
              </n-icon>
            </router-link>
          </div>
          <div class="text-center">
            <div class="w-48 h-48 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <div class="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                <n-icon size="48" class="text-white">
                  <ArrowRight />
                </n-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { NIcon } from 'naive-ui';
import { ArrowRight } from '@vicons/tabler';

onMounted(() => {
  document.body.style.fontFamily = `'Inter', sans-serif`;
  document.body.style.backgroundColor = '#f8fafc';
});

onUnmounted(() => {
  document.body.style.fontFamily = '';
  document.body.style.backgroundColor = '';
});
</script>

<style scoped>
/* Corporate landing page styles */
</style>
