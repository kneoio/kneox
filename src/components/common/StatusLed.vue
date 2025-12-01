<template>
  <span class="led" :class="{ active, pulse }" :style="{ color: ledColor }">▬</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BrandStatus } from '../../types/kneoBroadcasterTypes';

const props = defineProps<{ 
  status: BrandStatus;
  active?: boolean;
  pulse?: boolean;
  size?: number;
}>();

const ledColor = computed(() => {
  switch (props.status) {
    case BrandStatus.ON_LINE:
      return '#00aa00';
    case BrandStatus.QUEUE_SATURATED:
      return '#00aa00';
    case BrandStatus.WARMING_UP:
      return '#ffa500';
    case BrandStatus.IDLE:
      return '#bd621c';
    case BrandStatus.SYSTEM_ERROR:
      return '#ff0000';
    case BrandStatus.OFF_LINE:
    default:
      return '#5a5a5a';
  }
});
</script>

<style scoped>
.led {
  font-family: 'Share Tech Mono', monospace;
  font-size: v-bind("`${size ?? 12}px`");
  display: inline-block;
  transform: translateY(1px);
  opacity: 0.2;
  transition: opacity .3s, text-shadow .3s;
}

.active {
  opacity: 1;
  text-shadow:
    0 0 5px currentColor,
    0 0 15px currentColor,
    0 0 30px currentColor;
}

.pulse {
  animation: pulse 0.8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 70%, 100% { opacity: 1; text-shadow: 0 0 18px currentColor; }
  40% { opacity: 0.25; text-shadow: 0 0 4px currentColor; }
}
</style>
