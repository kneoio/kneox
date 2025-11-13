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
  /* FIXED: Solid color center, only fade at edges */
  background: radial-gradient(circle at center, currentColor 0%, currentColor 45%, transparent 70%);
  opacity: 0.2; /* Dim when off */
  transition: opacity 0.3s ease, box-shadow 0.3s ease;
}

.variant-yellow { color: #f59e0b; }
.variant-red    { color: #ef4444; }
.variant-green  { color: #0bc511; }
.variant-blue   { color: #3b82f6; }
.variant-gray   { color: #9ca3af; }

/* FIXED: Simpler, more natural animation */
.active:not(.variant-gray) {
  opacity: 0.95;
  animation: ledGlow 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}

@keyframes ledGlow {
  0% {
    opacity: 0.2;
    box-shadow: 0 0 0 0 currentColor;
  }
  100% {
    opacity: 0.95;
    /* Realistic multi-layer glow */
    box-shadow: 
      0 0 4px 1px currentColor,
      0 0 8px 2px currentColor,
      0 0 16px 4px currentColor;
  }
}
</style>
