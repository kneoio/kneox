<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div class="max-w-4xl mx-auto px-6 py-14">
      <div class="mb-10">
        <router-link to="/" class="inline-block mb-3 text-sm font-semibold text-blue-600 hover:underline">
          ← Back
        </router-link>
        <h1 class="text-4xl font-extrabold text-gray-900">About Me</h1>
        <p class="mt-3 text-gray-600">A short introduction and information for supporters and potential investors.</p>
      </div>

      <div class="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-3">Who I Am</h2>
        <p class="text-gray-700 leading-relaxed">
          This page shares a bit about me, the vision behind my work, and how you can support or get involved.
        </p>
      </div>

      <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow p-6 text-white mb-8">
        <h2 class="text-2xl font-bold mb-3" style="color: white !important;">Support on Patreon</h2>
        <p class="mb-5" style="color: white !important;">
          If you'd like to support the journey and get updates, you can join via Patreon.
        </p>
        <a
          href="https://www.patreon.com/posts/new-chapter-137017251?utm_medium=clipboard_copy&utm_source=copyLink&utm_campaign=postshare_creator&utm_content=join_link"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow"
        >
          Visit Patreon
        </a>
      </div>

      <div class="bg-white rounded-2xl shadow p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-3">For Potential Investors</h2>
        <p class="text-gray-700 leading-relaxed">
          High-level overview of the vision, product direction, and opportunities. Replace this text with your message, metrics, or a brief deck link.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Public info page
</script>

<style scoped>
</style>
