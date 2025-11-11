<template>
  <span class="glow-dot" :class="[variantClass, { active }]" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'yellow' | 'red' | 'green' | 'gray' | 'blue'
  active?: boolean
  size?: number
}>();

const variantClass = computed(() => `variant-${props.variant ?? 'gray'}`);
const sizePx = computed(() => `${props.size ?? 8}px`);
</script>

<style scoped>
.glow-dot {
  display: inline-block;
  width: v-bind(sizePx);
  height: v-bind(sizePx);
  border-radius: 50%;
  background: radial-gradient(circle at center, currentColor 25%, rgba(255,255,255,0.05) 45%, transparent 100%);
  opacity: 0.65;
  transition: box-shadow 0.4s ease-in-out, opacity 0.4s ease-in-out, background 0.4s ease-in-out;
}

.variant-yellow { color: #f59e0b; }
.variant-red    { color: #ef4444; }
.variant-green  { color: #0bc511; }
.variant-blue   { color: #3b82f6; }
.variant-gray   { color: #9ca3af; }

.active.variant-yellow,
.active.variant-red,
.active.variant-green,
.active.variant-blue {
  opacity: 0.95;
  animation: ledGlow 0.7s ease-out forwards;
}

@keyframes ledGlow {
  0% {
    box-shadow: 0 0 0 0 currentColor;
    background: radial-gradient(circle at center, rgba(255,255,255,0.1) 20%, currentColor 50%, transparent 100%);
    opacity: 0.6;
  }
  40% {
    box-shadow: 0 0 3px 1px currentColor, 0 0 6px 1.5px currentColor;
    background: radial-gradient(circle at center, rgba(255,255,255,0.12) 15%, currentColor 50%, transparent 100%);
    opacity: 0.8;
  }
  100% {
    box-shadow: 0 0 5px 1px currentColor, 0 0 8px 2px currentColor, inset 0 0 1px 1px rgba(255,255,255,0.15);
    background: radial-gradient(circle at center, rgba(255,255,255,0.1) 12%, currentColor 50%, transparent 100%);
    opacity: 0.9;
  }
}
</style>
