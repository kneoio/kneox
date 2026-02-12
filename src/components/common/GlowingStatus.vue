<template>
  <span class="badge" :class="{ on: online }" :style="statusStyle">
    {{ name }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  online: boolean
  name: string
  status?: string
}>()

const statusStyle = computed(() => {
  const status = props.status?.toLowerCase();
  
  if (!props.online) {
    return {
      color: '#6b7280', // darker gray for offline
      textShadow: 'none'
    }
  }
  
  if (status === 'on_air') {
    return {
      color: '#ef4444', // red for on air
      textShadow: `
        0 0 4px #ef4444,
        0 0 10px #ef444499,
        0 0 18px #ef444455
      `
    }
  }
  
  if (status === 'idle' || status === 'warming_up') {
    return {
      color: '#f59e0b', // yellow for idle/warming up
      textShadow: `
        0 0 4px #f59e0b,
        0 0 10px #f59e0b99,
        0 0 18px #f59e0b55
      `
    }
  }
  
  if (status === 'system_error') {
    return {
      color: '#ef4444', // red for error
      textShadow: `
        0 0 4px #ef4444,
        0 0 10px #ef444499,
        0 0 18px #ef444455
      `
    }
  }
  
  // Online states (ON_LINE, QUEUE_SATURATED) with green glow
  return {
    color: '#84cc16',
    textShadow: `
      0 0 4px #84cc16,
      0 0 10px #84cc1699,
      0 0 18px #84cc1655
    `
  }
})
</script>

<style scoped>
.badge{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:2px 10px;
  height:22px;
  border-radius:3px;
  border:1px dotted #6b7280; /* dots */
  background: transparent;
  font-size:12px;
  font-weight:400;
  white-space:nowrap;
  letter-spacing:.6px;
  color:#9ca3af;
}
</style>
