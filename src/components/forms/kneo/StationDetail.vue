<template>
  <div class="offline-container p-4">
    <n-button @click="handleStart" :loading="isStartingStation" :disabled="isOnline" type="primary">Start</n-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
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
    const isOnline = ref(false);
     
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

    watch(() => dashboardStore.stationsList, (newStations) => {
      newStations.forEach(station => dashboardStore.ensureStationConnected(station.brandName));
    }, { immediate: true });

    return {
      handleStart,
      isStartingStation,
      isOnline
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
