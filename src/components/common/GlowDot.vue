<template>
  <span class="glow-dot" :class="[variantClass, { active }]" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'yellow' | 'red' | 'green' | 'gray'
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
  background-color: currentColor;
  opacity: 0.75;
}

/***** Colors *****/
.variant-yellow { color: #f59e0b; }
.variant-red    { color: #ef4444; }
.variant-green  { color: #10b981; }
.variant-gray   { color: #9ca3af; }

/***** Glow *****/
.active.variant-yellow { box-shadow: 0 0 4px 1px currentColor, 0 0 8px 3px currentColor; }
.active.variant-red    { box-shadow: 0 0 4px 1px currentColor, 0 0 8px 3px currentColor; }
.active.variant-green  { box-shadow: 0 0 4px 1px currentColor, 0 0 8px 3px currentColor; }
</style>
