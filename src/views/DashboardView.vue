<template>
  <div class="home">
    <!-- Main Grid Layout -->
    <n-grid x-gap="12" y-gap="12" cols="24" class="grid-layout">
      <!-- Spacer Section -->
      <n-gi span="2" class="spacer-section"></n-gi>

      <!-- Left Section for Dashboard -->
      <n-gi span="10" class="left-section">
        <p v-if="userData.profile && userData.profile.username">
          Hello, {{ userData.profile.username }}
        </p>
        <div class="dashboard-section">
          <n-card title="Broadcasting Dashboard" :bordered="false" class="dashboard-card">
            <div class="connection-status">
              <n-tag :type="dashboard.isConnected ? 'success' : 'error'" size="small">
                {{ dashboard.isConnected ? 'Connected' : 'Disconnected' }}
              </n-tag>
              <n-text v-if="dashboard.lastUpdate" class="update-time">
                Last update: {{ formatTime(dashboard.lastUpdate) }}
              </n-text>
            </div>
            <n-divider />

            <div v-if="!dashboard.stats.totalStations" class="debug-info">
              <n-alert type="warning">
                No stats data received from server
              </n-alert>
              <pre v-if="dashboard.response" class="debug-data">{{ JSON.stringify(dashboard.response, null, 2) }}</pre>
            </div>

            <div v-else>
              <n-statistic label="Total Stations" :value="dashboard.stats.totalStations" />
              <n-divider />
              <n-statistic label="Online Stations" :value="dashboard.stats.onlineStations" />
              <n-divider />
              <n-statistic label="Minimum Segments" :value="dashboard.stats.minimumSegments" />
            </div>

            <n-divider />
            <n-text v-if="dashboard.version" class="version-text">
              Version: {{ dashboard.version }}
            </n-text>
          </n-card>
        </div>
      </n-gi>

      <!-- Right Section (Station List) -->
      <n-gi span="12" class="right-section">
        <n-card title="Active Stations" :bordered="false" class="station-list-card">
          <n-data-table
              :columns="stationColumns"
              :data="dashboard.stationsList"
              :pagination="{ pageSize: 5 }"
              :row-key="row => row.brandName"
          />
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Bottom Grid Layout for Language Selection and Links -->
    <n-grid x-gap="12" y-gap="12" cols="24" class="bottom-section">
      <!-- Language Selection Section -->
      <n-gi span="12" class="language-select">
        <n-select v-model:value="selectedLanguage" :options="languageOptions" />
      </n-gi>

      <!-- Links Section -->
      <n-gi span="12" class="links">
        <n-button text>License</n-button>&nbsp;&nbsp;&nbsp;
        <n-button text>About</n-button>
      </n-gi>
    </n-grid>
  </div>
</template>

<script lang="ts">
import {defineComponent, ref, inject, onMounted, onUnmounted, h} from 'vue';
import { NButton, NSelect, NText, NGrid, NGi, NCard, NStatistic, NDivider, NDataTable, NTag } from 'naive-ui';
import {useDashboardStore} from "../stores/kneo/dashboardStore";

export default defineComponent({
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
    NTag
  },
  setup() {
    const selectedLanguage = ref('en');
    const languageOptions = [
      { label: 'English', value: 'en' },
      { label: 'Portuguese', value: 'pt' },
    ];
    const userData = inject<any>('userData');
    const dashboard = useDashboardStore();

    const stationColumns = [
      {
        title: 'Name',
        key: 'brandName'
      },
      {
        title: 'Status',
        key: 'status',
        render(row: any) {
          return h(
              NTag,
              { type: row.status === 'ON_LINE' ? 'success' : 'warning' },
              { default: () => row.status }
          )
        }
      },
      {
        title: 'Segments',
        key: 'segmentsSize'
      },
      {
        title: 'Last Segment',
        key: 'lastSegmentKey'
      }
    ];

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString();
    };

    const getCurrentFragment = () => {
      if (!dashboard.stationsList || dashboard.stationsList.length === 0) {
        return null;
      }

      // Get the first online station's current fragment
      const onlineStation = dashboard.stationsList.find(station => station.status === 'ON_LINE');
      return onlineStation?.currentFragment || null;
    };

    onMounted(() => {
      dashboard.connect();
      const cleanup = dashboard.setupPeriodicRefresh(10000);

      onUnmounted(() => {
        cleanup();
        dashboard.disconnect();
      });
    });

    return {
      selectedLanguage,
      languageOptions,
      userData,
      dashboard,
      stationColumns,
      formatTime,
      getCurrentFragment
    };
  },
});
</script>

<style scoped>
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

.left-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
  padding: 20px;
  margin-left: 20px;
}

.dashboard-section {
  width: 100%;
  margin-top: 20px;
}

.dashboard-card {
  width: 100%;
}

.connection-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.update-time {
  font-size: 12px;
  color: #666;
}

.version-text {
  font-size: 12px;
  color: #666;
  text-align: right;
}

.current-fragment {
  margin: 10px 0;
}

.fragment-name {
  font-weight: bold;
  font-size: 16px;
  margin-top: 5px;
  color: #18a058;
}

.right-section {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
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

@media (max-width: 600px) {
  .grid-layout {
    flex-direction: column;
    width: 100%;
  }

  .left-section {
    margin-left: 0;
    margin-bottom: 20px;
    padding: 15px;
  }

  .right-section {
    padding: 15px;
    justify-content: center;
    text-align: center;
  }

  .bottom-section {
    flex-direction: column;
    align-items: center;
  }

  .language-select {
    justify-content: center;
    margin-bottom: 20px;
  }

  .links {
    justify-content: center;
  }
}
</style>