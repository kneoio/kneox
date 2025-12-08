<template>
  <div class="glow-line" :style="lineStyle"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  color: string;
}>();

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const lineStyle = computed(() => ({
  background: hexToRgba(props.color, 0.5),
  boxShadow: `0px 1px 2px rgba(255,255,255,0.3), 0px 4px 4px ${props.color}, 0px 8px 8px ${props.color}, 0px 16px 16px ${props.color}`
}));
</script>

<style scoped>
.glow-line {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 1px;
  border-radius: 1px;
  z-index: 10;
}
</style>
