<template>
  <div class="p-4">
    <n-page-header v-if="station" :title="station.brandName || 'Station Details'">
      <n-grid :cols="1" responsive="screen" x-gap="12">
        <n-gi>
          <n-card title="Status">
            <p>Status: {{ station.status }}</p>
            <p>Managed By: {{ station.managedBy }}</p>
            <!-- Add more details here -->
          </n-card>
        </n-gi>
        <n-gi>
          <n-card title="Actions">
            <n-space>
              <n-button @click="handleFeed" :loading="isActionLoading.feed">Feed</n-button>
              <n-button @click="handleStop" :loading="isActionLoading.stop" type="error">Stop</n-button>
            </n-space>
          </n-card>
        </n-gi>
        <!-- Add more cards for playlist manager, HLS player, etc. -->
      </n-grid>
    </n-page-header>
    <div v-else>
      <n-spin size="large" />
      <p>Loading station details for {{ brandName }}...</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, watch } from 'vue';
import { useDashboardStore } from '../../../stores/kneo/dashboardStore'; // Adjusted import path
import { NPageHeader, NCard, NGrid, NGi, NButton, NSpace, NSpin } from 'naive-ui';
import type { StationDetails } from '../../../types/dashboard'; // Adjusted import path

export default defineComponent({
  name: 'StationDetail', // Renamed component
  components: {
    NPageHeader,
    NCard,
    NGrid,
    NGi,
    NButton,
    NSpace,
    NSpin
  },
  props: {
    brandName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const dashboardStore = useDashboardStore();
    const station = ref<StationDetails | null>(null);
    const isActionLoading = ref({ feed: false, stop: false });

    const fetchStationData = () => {
      dashboardStore.ensureStationConnected(props.brandName);
      // Data will be updated via WebSocket, so we watch the store's stationResponse
    };

    watch(() => dashboardStore.stationResponse[props.brandName], (newDetails) => {
      if (newDetails && newDetails.payload && newDetails.payload.station) {
        station.value = newDetails.payload.station;
      } else {
        // Potentially fetch if not found or connection was lost
        // dashboardStore.fetchStation(props.brandName); 
      }
    }, { immediate: true, deep: true });

    onMounted(() => {
      dashboardStore.connect(); // Ensure main dashboard connection is active
      fetchStationData();
      // Initialize station.value if data is already in store from a previous connection
      const initialDetails = dashboardStore.getStationDetails(props.brandName);
      if (initialDetails) {
        station.value = initialDetails;
      }
    });

    onUnmounted(() => {
      // Decide if we disconnect the specific station or keep it connected
      // dashboardStore.disconnectStation(props.brandName);
    });

    const handleFeed = async () => {
      isActionLoading.value.feed = true;
      try {
        await dashboardStore.triggerBroadcastAction(props.brandName, 'feed');
      } catch (error) {
        console.error('Error feeding station:', error);
      }
      isActionLoading.value.feed = false;
    };

    const handleStop = async () => {
      isActionLoading.value.stop = true;
      try {
        await dashboardStore.triggerBroadcastAction(props.brandName, 'stop');
      } catch (error) {
        console.error('Error stopping station:', error);
      }
      isActionLoading.value.stop = false;
    };

    return {
      station,
      isActionLoading,
      handleFeed,
      handleStop,
    };
  },
});
</script>

<style scoped>
/* Add any specific styles here */
</style>
