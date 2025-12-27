<template>
  <span
    class="led"
    :class="{ active, pulse }"
    :style="{ color: color ?? ((active || pulse) ? '#2932f6' : '#9ca3af') }"
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
  
  
  /*transition: opacity .3s, text-shadow .3s;*/

  /*filter: saturate(160%) brightness(105%);*/
  text-shadow: none;
}


.active {
  filter: saturate(220%) brightness(180%);
  text-shadow:
    0 0 2px #2f3cff,
    0 0 8px rgba(90,140,255,0.9),
    0 0 20px rgba(120,180,255,0.7),
    0 0 45px rgba(150,200,255,0.5);
}

@keyframes pulse {
  0%, 100% {
    filter: saturate(220%) brightness(180%);
    text-shadow:
      0 0 2px #2f3cff,
      0 0 10px rgba(90,140,255,0.9),
      0 0 28px rgba(120,180,255,0.7),
      0 0 60px rgba(150,200,255,0.5);
  }
  45% {
    filter: saturate(140%) brightness(85%);
    text-shadow:
      0 0 2px rgba(90,140,255,0.6),
      0 0 6px rgba(120,180,255,0.4);
  }
}

</style>
