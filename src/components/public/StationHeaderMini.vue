<template>
  <n-space align="center" :wrap="false" :style="{ gap: '12px', marginBottom: '8px' }">
    <n-ellipsis style="max-width: 32%; min-width: 120px;">
      <n-h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; line-height: 1.2;">{{ brand }}</n-h2>
    </n-ellipsis>
    <n-divider vertical />
    <div v-if="availableSongs !== null" style="display:flex; flex-direction: column; line-height: 1.1; align-items: center;">
      <n-text depth="3">songs</n-text>
      <n-text
        depth="3"
        :class="flashSongs ? 'flash-pulse' : ''"
        :style="`margin-top: 10px; text-align: center; font-family: Goldman, sans-serif; color: ${colorCss || 'inherit'} !important;`"
      >
        <n-number-animation :from="0" :to="availableSongs || 0" @finish="onSongsAnimationFinish" />
      </n-text>
    </div>
    <n-divider v-if="description" vertical />
    <n-ellipsis v-if="description" :line-clamp="2" style="max-width: 58%;">
      <n-text depth="3" style="font-size: 12px;">{{ description }}</n-text>
    </n-ellipsis>
  </n-space>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NDivider, NEllipsis, NH2, NText, NNumberAnimation, NSpace } from 'naive-ui'

const props = defineProps<{
  brand: string
  description?: string
  availableSongs: number | null
  color?: string | null
}>()

const flashSongs = ref(false)

function onSongsAnimationFinish() {
  flashSongs.value = false
}

watch(() => props.availableSongs, async (newVal, oldVal) => {
  if (newVal != null && oldVal != null && newVal !== oldVal) {
    flashSongs.value = false
    await Promise.resolve()
    flashSongs.value = true
  }
})

const colorCss = computed(() => {
  const c = props.color || ''
  const m = /^#([0-9a-fA-F]{8})$/.exec(c)
  if (m) {
    const hex = m[1]
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const a = parseInt(hex.slice(6, 8), 16) / 255
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  return c
})
</script>

<style scoped>
.flash-pulse {
  animation: pulseFlash 1.2s ease infinite;
}

@keyframes pulseFlash {
  0% { transform: scale(1); text-shadow: 0 0 0px currentColor; filter: brightness(1); }
  50% { transform: scale(1.06); text-shadow: 0 0 12px currentColor; filter: brightness(1.15); }
  100% { transform: scale(1); text-shadow: 0 0 0px currentColor; filter: brightness(1); }
}
</style>
