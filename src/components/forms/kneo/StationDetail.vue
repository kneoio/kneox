<template>
  <div class="offline-container p-4">
    <n-button @click="handleStart" :loading="isStartingStation" :disabled="!isButtonEnabled" type="primary">Start</n-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useDashboardStore } from '../../../stores/kneo/dashboardStore'; // Adjusted import path
import { NButton } from 'naive-ui';

export default defineComponent({
  name: 'StationDetail', 
  components: {
    NButton
  },
  props: {
    brandName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const dashboardStore = useDashboardStore();
    const isStartingStation = ref(false);

    const isButtonEnabled = computed(() => {
      const stationInfo = dashboardStore.stationsList.find(s => s.brandName === props.brandName);
      if (!stationInfo) {
        return true; 
      } else {
        return false; 
      } 
    });

    


    const handleStart = async () => {
      if (!props.brandName) return;
      isStartingStation.value = true;
      try {
        await dashboardStore.triggerBroadcastAction(props.brandName, 'start');
      } catch (error) {
        console.error(`Error starting station ${props.brandName}:`, error);
      } finally {
        isStartingStation.value = false;
      }
    };

    return {
      handleStart,
      isStartingStation,
      isButtonEnabled
    };
  },
});
</script>

<style scoped>
.loading-container,
.offline-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 10px;
}
</style>
