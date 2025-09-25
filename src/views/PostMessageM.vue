<template>
  <n-config-provider :theme="isDarkTheme ? darkTheme : null">
    <n-layout :style="{ minHeight: '100vh', backgroundColor: isDarkTheme ? '#1a1a1a' : '#f8f8f8' }">
      <n-layout-header bordered :style="{ background: 'transparent' }">
        <n-space align="center" justify="space-between" :wrap="false" :style="{ maxWidth: '720px', margin: '0 auto', padding: '12px 16px' }">
          <router-link to="/m" class="inline-block">
            <n-button quaternary>← Back</n-button>
          </router-link>
        </n-space>
      </n-layout-header>
      <n-layout-content :style="{ padding: '0 16px 24px' }">
        <div :style="{ maxWidth: '720px', margin: '0 auto' }">
          <PostMessageView />
        </div>
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'
import { NConfigProvider, NLayout, NLayoutHeader, NLayoutContent, NSpace, NButton, darkTheme } from 'naive-ui'
import PostMessageView from './PostMessageView.vue'
const isDarkTheme = inject<Ref<boolean>>('isDarkTheme', ref(false))
</script>

<style scoped>
</style>
