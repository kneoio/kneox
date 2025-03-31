<template>
  <div class="home">
    <n-grid x-gap="12" y-gap="12" :cols="isMobile ? 1 : 24" class="grid-layout">
      <!-- Top section with connection status and stats -->
      <n-gi :span="24" class="top-section">
        <p v-if="userData?.profile?.username" class="username">
          Hello, {{ userData.profile.username }}
        </p>
        <n-card :bordered="false" class="stats-card mb-0">
          <div class="connection-status">
            <n-tag :type="dashboard.isConnected ? 'success' : 'error'" size="small">
              {{ dashboard.isConnected ? 'Connected' : 'Disconnected' }}
            </n-tag>
            <n-select
                v-model:value="selectedAction"
                :options="actionOptions"
                placeholder="Select action"
                filterable
                size="small"
                style="width: 120px; margin-left: 10px;"
                @update:value="(value) => triggerAction('pacheco-llc', value)"
            />
            <n-text v-if="dashboard.lastUpdate" class="update-time">
              Last update: {{ formatTime(dashboard.lastUpdate) }}
            </n-text>
            <n-text v-if="dashboard.version" class="version-text">
              Version: {{ dashboard.version }}
            </n-text>
          </div>

          <n-divider v-if="!isMobile" />

          <n-descriptions v-if="dashboard.stats.totalStations" label-placement="top" :column="isMobile ? 2 : 4" size="small">
            <n-descriptions-item label="Total Stations">{{ dashboard.stats.totalStations }}</n-descriptions-item>
            <n-descriptions-item label="Online Stations">{{ dashboard.stats.onlineStations }}</n-descriptions-item>
            <n-descriptions-item label="Min.segments">{{ dashboard.stats.minimumSegments }}</n-descriptions-item>
            <n-descriptions-item label="Max.segments">{{ dashboard.stats.slidingWindowSize }}</n-descriptions-item>
          </n-descriptions>

          <n-alert v-else type="warning">
            No stats data received from server
          </n-alert>
        </n-card>
      </n-gi>

      <!-- Full-width stations table -->
      <n-gi :span="24" class="stations-section">
        <n-card title="Active Stations" :bordered="false" class="station-list-card mt-0">
          <n-data-table
              :columns="stationColumns"
              :data="dashboard.stationsList"
              :pagination="{ pageSize: 5 }"
              :row-key="row => row.brandName"
          />
        </n-card>
      </n-gi>
    </n-grid>

    <n-grid x-gap="12" y-gap="12" cols="24" class="bottom-section">
      <n-gi span="12" class="language-select">
        <n-select v-model:value="selectedLanguage" :options="languageOptions"/>
      </n-gi>
      <n-gi span="12" class="links">
        <n-button text>License</n-button>&nbsp;&nbsp;&nbsp;
        <n-button text>About</n-button>
      </n-gi>
    </n-grid>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, inject, onMounted, onUnmounted } from 'vue';
import {
  NButton, NSelect, NText, NGrid, NGi, NCard, NStatistic, NDivider, NDataTable, NTag, NAlert,
  NCol, NRow, NDescriptions, NDescriptionsItem
} from 'naive-ui';
import { useDashboardStore } from "../stores/kneo/dashboardStore";
import DesktopRow from "../components/dashboard/DesktopRow.vue";
import MobileRow from "../components/dashboard/MobileRow.vue";
import {useStationColumns} from "../components/dashboard/stationColumns";

export default defineComponent({
  name: 'DashboardView',
  components: {
    NButton,
    NSelect,
    NText,
    NGrid,
    NGi,
    NCard,
    NStatistic,
    NDivider,
    NDataTable,
    NTag,
    NAlert,
    NCol,
    NRow,
    DesktopRow,
    MobileRow,  NDescriptions, NDescriptionsItem
  },
  setup() {
    const parentTitle = inject('parentTitle', ref(''));
    const selectedLanguage = ref('en');
    const languageOptions = [
      { label: 'English', value: 'en' },
      { label: 'Portuguese', value: 'pt' },
    ];
    const userData = inject('userData', ref({
      profile: {
        username: 'Guest'
      }
    }));
    const dashboard = useDashboardStore();
    const isMobile = ref(window.innerWidth < 768);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString();
    };

    const stationColumns = useStationColumns(dashboard, isMobile);

    const selectedAction = ref('');
    const actionOptions = [
      { label: 'Start', value: 'start' },
      { label: 'Stop', value: 'stop' },
      { label: 'Restart', value: 'restart' },
      { label: 'Pause', value: 'pause' }
    ];

    const triggerAction = async (brandName: string, action: string) => {
      try {
        const response = await fetch(`http://localhost:38707/api/${brandName}/queue/action`, {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIign3Uz8QkrHaPg',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action })
        });

        if (!response.ok) {
          throw new Error('Failed to trigger action');
        }

        console.log(`Action "${action}" triggered for ${brandName}`);
      } catch (error) {
        console.error('Error triggering action:', error);
      }
    };

    onMounted(() => {
      dashboard.connect();
      const cleanup = dashboard.setupPeriodicRefresh(10000);

      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });

      parentTitle.value = 'Dashboard';

      onUnmounted(() => {
        cleanup();
        dashboard.disconnect();
        window.removeEventListener('resize', () => {
          isMobile.value = window.innerWidth < 768;
        });
      });
    });

    return {
      selectedLanguage,
      languageOptions,
      userData,
      dashboard,
      stationColumns,
      triggerAction,
      formatTime,
      isMobile,
      selectedAction ,
       actionOptions
    };
  },
});
</script>

<style scoped>
.username {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 1.1rem;
}

.home {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
}

.grid-layout {
  width: 80%;
  margin: auto;
}

.top-section {
  margin-bottom: 20px;
}

.stats-card {
  width: 100%;
}

.connection-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.update-time {
  font-size: 12px;
  color: #666;
}

.version-text {
  font-size: 12px;
  color: #666;
}

.stations-section {
  margin-top: 20px;
}

.station-list-card {
  width: 100%;
}

.bottom-section {
  width: 80%;
  margin: auto;
  margin-top: 20px;
}

.language-select {
  display: flex;
  justify-content: flex-start;
  width: 150px;
  margin-bottom: 10px;
}

.links {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .grid-layout {
    width: 100%;
    margin: 0;
    padding: 10px;
  }

  .connection-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .stats-card,
  .station-list-card {
    border-radius: 8px;
  }

  .bottom-section {
    width: 100%;
    flex-direction: column;
    align-items: center;
  }

  .language-select {
    width: 100%;
    justify-content: center;
    margin-bottom: 20px;
  }

  .links {
    width: 100%;
    justify-content: center;
    margin-top: 10px;
  }
}

/* Chart specific styles */
.chart-line {
  stroke: #2080f0;
  stroke-width: 2;
  fill: none;
}

.current-point {
  fill: #18a058;
}
</style>