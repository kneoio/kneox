<template>
  <span
    class="led"
    :class="{ active, pulse }"
    :style="{ color: color ?? ((active || pulse) ? '#5b63ff' : '#9ca3af') }"
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
  font-size: v-bind("`${size ?? 25}px`");
  opacity: 0.75;
  filter: saturate(140%);
  text-shadow: 0 0 2px rgba(120,140,255,0.6);
  transition: opacity .25s ease, text-shadow .25s ease, filter .25s ease;
}

.active {
  opacity: 1;
  filter: saturate(180%) brightness(160%);
  text-shadow:
    0 0 3px currentColor,
    0 0 10px currentColor,
    0 0 22px currentColor,
    0 0 40px currentColor;
}

.pulse {
  animation: pulse 0.9s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    filter: saturate(180%) brightness(160%);
    text-shadow:
      0 0 4px currentColor,
      0 0 14px currentColor,
      0 0 30px currentColor,
      0 0 55px currentColor;
  }
  45% {
    opacity: 0.35;
    filter: saturate(120%) brightness(90%);
    text-shadow:
      0 0 2px currentColor,
      0 0 5px currentColor;
  }
}
</style>
