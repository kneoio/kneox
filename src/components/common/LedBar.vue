<template>
  <div class="led-bar" :style="{ height: `${segmentHeight}px` }">
    <span
      v-for="(_, index) in segments"
      :key="index"
      class="led"
      :class="{ active: index < activeSegments, pulse }"
      :style="{ backgroundColor: ledColor }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: number;          // 0–100
  segments?: number;      // amount of LEDs
  color?: string;         // hex color
  pulse?: boolean;
  height?: number;        // segment height
}>();

const totalSegments = computed(() => props.segments ?? 40);
const activeSegments = computed(() =>
  Math.round((props.value / 100) * totalSegments.value)
);

const ledColor = computed(() => props.color ?? '#ff3c00');
const segmentHeight = computed(() => props.height ?? 10);
</script>

<style scoped>
.led-bar {
  display: flex;
  align-items: center;
  gap: 2px;
}

.led {
  width: 8px;
  border-radius: 2px;
  opacity: 0.4;
  transition: opacity 0.25s, box-shadow 0.25s;
}

.active {
  opacity: 1;
  box-shadow:
    0 0 4px currentColor,
    0 0 10px currentColor,
    0 0 16px currentColor;
}

.pulse {
  animation: pulseAnim 0.9s ease-in-out infinite;
}

@keyframes pulseAnim {
  0%, 100% {
    opacity: 1;
    box-shadow:
      0 0 10px currentColor,
      0 0 20px currentColor;
  }
  40% {
    opacity: 0.2;
    box-shadow:
      0 0 4px currentColor,
      0 0 6px currentColor;
  }
}
</style>
