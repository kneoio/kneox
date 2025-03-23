<!-- Updated template with Task Timeline section -->
<template>
  <div class="home">
    <n-grid x-gap="12" y-gap="12" :cols="isMobile ? 1 : 24" class="grid-layout">
      <n-gi :span="isMobile ? 1 : 8" class="left-section">
        <p v-if="userData.profile && userData.profile.username" class="username">
          Hello, {{ userData.profile.username }}
        </p>
        <div class="dashboard-section">
          <n-card title="Dashboard" :bordered="false" class="dashboard-card">
            <!-- Mobile compact view -->
            <div v-if="isMobile" class="mobile-dashboard">
              <div class="connection-status">
                <n-tag :type="dashboard.isConnected ? 'success' : 'error'" size="small">
                  {{ dashboard.isConnected ? 'Connected' : 'Disconnected' }}
                </n-tag>
              </div>

              <div v-if="!dashboard.stats.totalStations" class="debug-info">
                <n-alert type="warning" size="small">
                  No stats data received
                </n-alert>
              </div>

              <div v-else class="mobile-stats">
                <div class="mobile-stat-row">
                  <span>Total: {{ dashboard.stats.totalStations }}</span>
                  <span>Online: {{ dashboard.stats.onlineStations }}</span>
                  <span>Min Segments: {{ dashboard.stats.minimumSegments }}</span>
                </div>
                <div class="mobile-stat-row" v-if="dashboard.stats.slidingWindowSize">
                  <span>Sliding Window: {{ dashboard.stats.slidingWindowSize }}</span>
                </div>
              </div>
            </div>


            <div v-else>
              <div class="connection-status">
                <n-tag :type="dashboard.isConnected ? 'success' : 'error'" size="small">
                  {{ dashboard.isConnected ? 'Connected' : 'Disconnected' }}
                </n-tag>
                <n-text v-if="dashboard.lastUpdate" class="update-time">
                  Last update: {{ formatTime(dashboard.lastUpdate) }}
                </n-text>
              </div>

              <div v-if="!dashboard.stats.totalStations" class="debug-info">
                <n-alert type="warning">
                  No stats data received from server
                </n-alert>
                <pre v-if="dashboard.response" class="debug-data">{{
                    JSON.stringify(dashboard.response, null, 2)
                  }}</pre>
              </div>

              <n-card title="Periodic tasks" class="task-timeline-section">
                <div class="task-list">
                  <div
                      v-for="(task, id) in dashboard.stats.timelines"
                      :key="id"
                      class="task-item"
                      :class="getTaskTimelineType(task)"
                  >
                    <div class="task-header">
                      <div class="task-title">{{ task.name }}</div>
                      <div class="task-scheduler">{{ task.schedulerName }}</div>
                      <div class="task-time">{{ formatDateTime(task.lastExecutionTime) }}</div>
                    </div>
                    <div class="task-details">
                      <n-space>
                        <div>Next execution: {{ formatDateTime(task.nextExecutionTime) }}</div>
                        <div>Time remaining: {{ formatRemainingTime(task.timeRemaining) }}</div>
                      </n-space>
                      <n-progress
                          type="line"
                          :percentage="task.currentProgress"
                          :indicator-placement="'inside'"
                          :status="getTaskProgressStatus(task)"
                          :show-indicator="true"
                      />
                    </div>
                  </div>
                </div>
              </n-card>
              <n-card title="Overall stats">
                <n-row>
                  <n-col :span="12">
                    <n-statistic label="Total Stations" :value="dashboard.stats.totalStations"/>
                    <n-statistic label="Online Stations" :value="dashboard.stats.onlineStations"/>
                  </n-col>
                  <n-col :span="12">
                    <n-statistic label="Min.segments(to start ask more from PlaylistManager)" :value="dashboard.stats.minimumSegments"/>
                    <n-statistic label="Sliding Window Size" :value="dashboard.stats.slidingWindowSize"/>
                  </n-col>
                </n-row>
              </n-card>
              <n-divider/>
              <n-text v-if="dashboard.version" class="version-text">
                Version: {{ dashboard.version }}
              </n-text>
            </div>
          </n-card>
        </div>
      </n-gi>
      <n-gi :span="isMobile ? 1 : 14" class="right-section">
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
import {defineComponent, ref, inject, onMounted, onUnmounted, h, computed} from 'vue';
import {
  NButton, NSelect, NText, NGrid, NGi, NCard, NStatistic, NDivider, NDataTable, NTag, NAlert,
  NTimeline, NTimelineItem, NProgress, NIcon, NCol, NRow, NSpace
} from 'naive-ui';
import {ClockCircleOutlined} from '@vicons/antd';
import {useDashboardStore} from "../stores/kneo/dashboardStore";
import DesktopRow from "../components/dashboard/DesktopRow.vue";
import MobileRow from "../components/dashboard/MobileRow.vue";


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
    NTag,
    NAlert,
    NTimeline,
    NTimelineItem,
    NProgress,
    NIcon,
    ClockCircleOutlined,
    NCol,
    NRow, NSpace
  },
  setup() {
    const parentTitle = inject('parentTitle', ref(''));
    const selectedLanguage = ref('en');
    const languageOptions = [
      {label: 'English', value: 'en'},
      {label: 'Portuguese', value: 'pt'},
    ];
    const userData = inject<any>('userData');
    const dashboard = useDashboardStore();
    const isMobile = ref(window.innerWidth < 768);

    const stationColumns = computed(() => {
      const baseColumns = [
        {
          title: 'Name',
          key: 'brandName',
          width: 150,
          render(row: any) {
            return row.brandName; // Directly render the brandName
          }
        },
        {
          title: 'Status',
          key: 'status',
          width: 120,
          render(row: any) {
            const statusText = row.status === 'ON_LINE' ? 'Online' : row.status === 'WARMING_UP' ? 'Warming up' : row.status;
            return h(
                NTag,
                {
                  type: row.status === 'ON_LINE' ? 'success' : 'warning',
                  style: 'margin: 0 auto;'
                },
                { default: () => statusText }
            );
          }

        },
        {
          title: 'Segments',
          key: 'segmentsSize',
          width: 100,
          render(row: any) {
            return row.segmentsSize || '-';
          }
        },
        {
          title: 'Bitrate',
          key: 'bitrate',
          width: 100,
          render(row: any) {
            return row.bitrate ? `${row.bitrate} kbps` : '-';
          }
        },
        {
          title: 'Current Fragment / Recently Played',
          key: 'currentFragment',
          render(row: any) {
            return h(DesktopRow, { row }); // Pass the entire row to DesktopRow
          }
        }
      ];

      // For mobile view, show simplified columns with Current Fragment
      if (isMobile.value) {
        return [
          {
            title: 'Station',
            key: 'combined',
            render: (row: any) => {
              return h(MobileRow, { row }); // Pass the entire row to MobileRow
            }
          }
        ];
      }

      return baseColumns;
    });

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString();
    };

    const formatDateTime = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString();
    };

    const formatRemainingTime = (seconds: number) => {
      if (!seconds && seconds !== 0) return '';

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    };

    const getTaskTimelineType = (task: any) => {
      // Return different types based on task status or progress
      if (task.timeRemaining < 30) return 'warning'; // Warning if less than 30 seconds remaining
      return 'success';  // Default to success
    };

    const getTaskProgressStatus = (task: any) => {
      if (task.currentProgress < 30) return 'error';
      if (task.currentProgress < 70) return 'warning';
      return 'success';
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

      // Add resize event listener for responsive layout
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
      formatTime,
      formatDateTime,
      formatRemainingTime,
      getTaskTimelineType,
      getTaskProgressStatus,
      getCurrentFragment,
      isMobile
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

.stats-container {
  padding: 8px 0;
}

.stat-item {
  padding: 8px 0;
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

.left-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
  padding: 5px;
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
  padding: 5px;
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

/* Task Timeline specific styles */
.task-timeline-section {
  margin-top: 16px;
}

.task-details {
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
}

/* Mobile dashboard specific styles */
.mobile-dashboard {
  padding: 0;
}

.mobile-stats {
  margin: 8px 0;
}

.mobile-stat-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  font-size: 0.85rem;
}

.mobile-stat-row span {
  margin: 4px 0;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

@media (max-width: 768px) {
  .grid-layout {
    width: 100%;
    margin: 0;
    padding: 10px;
  }

  .left-section {
    margin-left: 0;
    margin-bottom: 20px;
    padding: 10px;
  }

  .right-section {
    padding: 10px;
  }

  .dashboard-card,
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

  /* Fix for mobile table display */
  :deep(.n-data-table .n-data-table-td) {
    padding: 8px 4px;
    text-align: left;
  }

  :deep(.n-data-table-th) {
    padding: 8px 4px;
    text-align: left;
  }

  /* Mobile task timeline */
  .task-timeline-section :deep(.n-timeline) {
    padding-left: 12px;
  }

  .task-timeline-section :deep(.n-timeline-item-content) {
    margin-left: 12px;
  }
}
</style>