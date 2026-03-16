<template>
  <n-config-provider :theme="darkTheme">
    <n-layout>
      <n-layout-header class="neon-header">
        <div
          :style="{ maxWidth: '720px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '24px' }">
          <n-icon size="32">
            <Alien />
          </n-icon>
        </div>
        <GlowLine :color="hoveredColor" />
      </n-layout-header>

      <n-layout-content :style="{ padding: '16px 16px 24px' }">
        <n-space vertical class="root" :style="{ maxWidth: '720px', margin: '0 auto' }">
          <n-space vertical size="large">
            <n-thing style="margin-bottom: 8px;">
              <template #header>
                <n-h1
                  style="font-size:32px; font-weight:bold; font-family: 'Kaylon', sans-serif; margin-top: 0; margin-bottom: 0px;">MIXPLA</n-h1>
              </template>
              <template #description>
                <span style="font-size:20px; opacity:.9;">You choose the vibe. AI keeps it live.</span>
              </template>
            </n-thing>

            <n-space vertical size="large" align="center">
              <n-p style="font-size: 16px; text-align: center; max-width: 500px;">
                Welcome to MIXPLA, where artificial intelligence creates and curates live radio stations 24/7. 
                Our AI DJs analyze music patterns, audience preferences, and cultural trends to deliver unique, 
                ever-evolving audio experiences that adapt to your vibe.
              </n-p>
              
              <n-p style="font-size: 16px; text-align: center; max-width: 500px;">
                Each station is powered by advanced AI that generates content, selects tracks, and maintains 
                the perfect atmosphere. From ambient chill to high-energy beats, there's always something 
                new to discover.
              </n-p>

              <n-button size="large" type="primary" @click="goToMixpla">
                <template #icon>
                  <n-icon>
                    <ExternalLink />
                  </n-icon>
                </template>
                Listen Live on mixpla.online
              </n-button>

              <n-button size="large" @click="goToBrands">
                <template #icon>
                  <n-icon>
                    <Settings />
                  </n-icon>
                </template>
                Manage Stations
              </n-button>

              <n-divider />

              <n-space vertical size="small" align="center">
                <a href="https://discord.com/channels/1395012925512613998/1395012926154346538" target="_blank"
                  rel="noopener noreferrer" style="font-size:13px; text-decoration: underline;">Discord</a>
                <router-link to="/about" style="font-size:13px; text-decoration: underline;">About</router-link>
              </n-space>
            </n-space>
          </n-space>
        </n-space>
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
  NP,
  NSpace,
  NText,
  NThing,
  darkTheme
} from 'naive-ui'
import { Alien, ExternalLink, Settings } from '@vicons/tabler'
import GlowLine from '../components/common/GlowLine.vue'

const hoveredColor = ref('#2196F3')

function goToMixpla() {
  window.open('https://mixpla.online', '_blank', 'noopener,noreferrer')
}

function goToBrands() {
  window.location.href = '/outline/brands'
}
</script>

<style scoped>
@font-face {
  font-family: 'ConthraxSB';
  src: url('/src/assets/fonts/conthrax-sb.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Kaylon';
  src: url('/src/assets/fonts/kaylonbold.otf') format('opentype');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}

.neon-header {
  position: relative;
  overflow: visible;
  z-index: 1;
}
</style>
