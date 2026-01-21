<template>
  <span
    class="led"
    :class="{ active, pulse }"
    :style="{ color: color ?? ((active || pulse) ? '#4B5CFF' : '#9ca3af') }"
  >
    ▬
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ active?: boolean; pulse?: boolean; size?: number; color?: string }>();
</script>

<style scoped>
.led {
  font-family: 'Share Tech Mono', monospace;
  text-shadow: none;
}

.active {
  filter: saturate(220%) brightness(170%);
  text-shadow:
    0 0 2px #4B5CFF,
    0 0 8px rgba(75,92,255,0.9),
    0 0 20px rgba(110,130,255,0.7),
    0 0 45px rgba(150,170,255,0.5);
}

@keyframes pulse {
  0%, 100% {
    filter: saturate(220%) brightness(170%);
    text-shadow:
      0 0 2px #4B5CFF,
      0 0 10px rgba(75,92,255,0.9),
      0 0 28px rgba(110,130,255,0.7),
      0 0 60px rgba(150,170,255,0.5);
  }
  45% {
    filter: saturate(140%) brightness(85%);
    text-shadow:
      0 0 2px rgba(75,92,255,0.6),
      0 0 6px rgba(110,130,255,0.4);
  }
}
</style>
