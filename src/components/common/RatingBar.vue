<template>
  <div class="rating-bar" :style="{ height: `${height}px` }">
    <span
      v-for="index in totalSegments"
      :key="index"
      class="led"
      :class="{ active: isSegmentActive(index) }"
      :style="getSegmentStyle(index)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: number;
  segments?: number;
  height?: number;
}>();

const totalSegments = computed(() => props.segments ?? 10);
const midpoint = computed(() => Math.ceil(totalSegments.value / 2));

const isSegmentActive = (index: number): boolean => {
  if (props.value === 0) return false;
  
  if (props.value < 0) {
    const percentage = Math.abs(props.value) / 100;
    const activeCount = Math.ceil(percentage * midpoint.value);
    return index <= midpoint.value && index > midpoint.value - activeCount;
  } else {
    const percentage = props.value / 100;
    const activeCount = Math.ceil(percentage * midpoint.value);
    return index > midpoint.value && index <= midpoint.value + activeCount;
  }
};

const getSegmentStyle = (index: number) => {
  const color = index <= midpoint.value ? '#ff3c00' : '#00ff00';
  return {
    backgroundColor: color,
    height: `${props.height ?? 8}px`,
    '--led-color': color
  };
};
</script>

<style scoped>
.rating-bar {
  display: flex;
  align-items: center;
  gap: 2px;
}

.led {
  width: 4px;
  border-radius: 1px;
  opacity: 0.5;
  transition: opacity 0.25s, box-shadow 0.25s;
}

.active {
  opacity: 1;
  box-shadow:
    0 0 1px var(--led-color),
    0 0 3px var(--led-color),
    0 0 5px var(--led-color);
}
</style>
