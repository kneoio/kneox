<template>
  <n-space vertical size="large" style="padding: 24px;">
    <n-card>
      <n-space vertical size="medium">
        <n-h2 style="margin: 0;">System Dashboard</n-h2>
        <n-tag :type="dashboard.isGlobalConnected ? 'success' : 'error'" size="large" :bordered="false">
          {{ dashboard.isGlobalConnected ? 'Connected' : 'Disconnected' }}
        </n-tag>

        <n-space size="medium">
          <n-select
              v-model:value="selectedBrand"
              :options="brandOptions"
              placeholder="Select brand"
              filterable
              size="medium"
              style="width: 200px"
          />
          <n-button
              type="primary"
              size="medium"
              @click="sendCommand(selectedBrand, 'start')"
              :disabled="!selectedBrand"
              :loading="isStartingBroadcast"
          >
            Start Station
          </n-button>
        </n-space>

        <n-space align="center" size="small" v-if="dashboard.globalLastUpdate || dashboard.globalVersion">
          <n-text v-if="dashboard.globalLastUpdate" depth="3" style="font-size: 12px;">
            Updated: {{ formatTime(dashboard.globalLastUpdate) }}
          </n-text>
          <n-text v-if="dashboard.globalVersion" depth="3" style="font-size: 12px;">
            KneoBroadcaster: v{{ dashboard.globalVersion }}
          </n-text>
        </n-space>

        <n-space vertical size="large" v-if="dashboard.globalStats">
          <n-space size="large">
            <n-card title="Station Status" size="small" style="flex: 1; min-width: 0;">
              <n-space vertical size="medium">
                <n-space align="center" size="small">
                  <n-tag :type="dashboard.globalStats.totalStations > 0 ? 'info' : 'warning'" size="medium">
                    Total: {{ dashboard.globalStats.totalStations }}
                  </n-tag>
                </n-space>
                <n-space size="small">
                  <n-tag type="success" size="small">Online: {{ dashboard.globalStats.onlineStations }}</n-tag>
                  <n-tag type="warning" size="small">Warming: {{ dashboard.globalStats.warmingStations }}</n-tag>
                  <n-tag type="error" size="small">Offline: {{ dashboard.globalStats.offlineStations }}</n-tag>
                </n-space>
              </n-space>
            </n-card>

            <n-card title="Storage" size="small" style="flex: 1; min-width: 0;" v-if="dashboard?.globalStats?.fileMaintenanceStats">
              <n-space vertical size="small">
                <div style="font-size: 0.875rem;">
                  <n-text depth="2">Total: {{ (dashboard.globalStats.fileMaintenanceStats.totalSpaceBytes / (1024 * 1024 * 1024)).toFixed(2) }} GB</n-text>
                </div>
                <div style="font-size: 0.875rem;">
                  <n-text depth="2">Available: {{ (dashboard.globalStats.fileMaintenanceStats.availableSpaceBytes / (1024 * 1024 * 1024)).toFixed(2) }} GB</n-text>
                </div>
                <div style="font-size: 0.875rem;">
                  <n-text depth="3">Freed: {{ (dashboard.globalStats.fileMaintenanceStats.spaceFreedBytes / (1024 * 1024)).toFixed(2) }} MB</n-text>
                </div>
                <div style="font-size: 0.875rem;">
                  <n-text depth="3">Files/Dirs: {{ dashboard.globalStats.fileMaintenanceStats.filesDeleted }}/{{ dashboard.globalStats.fileMaintenanceStats.directoriesDeleted }}</n-text>
                </div>
              </n-space>
            </n-card>

            <n-card title="Scheduler" size="small" style="flex: 1; min-width: 0;" v-if="dashboard?.globalStats?.schedulerStats">
              <n-space vertical size="small">
                <div style="font-size: 0.875rem;">
                  <n-tag :type="dashboard.globalStats.schedulerStats.schedulerRunning ? 'success' : 'error'" size="small">
                    {{ dashboard.globalStats.schedulerStats.schedulerRunning ? 'Running' : 'Stopped' }}
                  </n-tag>
                </div>
                <div style="font-size: 0.875rem;">
                  <n-text depth="2">Tasks: {{ dashboard.globalStats.schedulerStats.totalScheduledTasks }}</n-text>
                </div>
                <div style="font-size: 0.875rem;">
                  <n-text depth="2">Active: {{ dashboard.globalStats.schedulerStats.activeJobs }}</n-text>
                </div>
                <div style="font-size: 0.875rem;">
                  <n-text depth="3">Paused: {{ dashboard.globalStats.schedulerStats.pausedJobs }}</n-text>
                </div>
                <div style="font-size: 0.875rem;">
                  <n-text depth="3">Errors: {{ dashboard.globalStats.schedulerStats.errorJobs }}</n-text>
                </div>
              </n-space>
            </n-card>
          </n-space>

          <n-card title="Scheduler Tasks" size="small" v-if="dashboard?.globalStats?.schedulerStats?.tasks && dashboard.globalStats.schedulerStats.tasks.length > 0">
            <n-data-table
                :columns="schedulerTaskColumns"
                :data="dashboard.globalStats.schedulerStats.tasks"
                :pagination="false"
                size="small"
                :max-height="300"
            />
          </n-card>

          <n-card title="Configuration" size="small" v-if="dashboard.globalStats.configurationStats?.configDetails">
            <n-space size="large">
              <n-card size="small" style="flex: 1; min-width: 0;">
                <n-space vertical size="medium">
                  <div v-for="(section, sectionName) in getFirstHalfConfig" :key="sectionName">
                    <n-text depth="2" style="font-weight: 600; margin-bottom: 8px; display: block;">{{ sectionName }}:</n-text>
                    <n-space vertical size="small">
                      <div
                          v-for="(value, key) in section"
                          :key="key"
                          style="padding-left: 8px; border-left: 2px solid var(--n-border-color); font-size: 0.875rem;"
                      >
                        <n-text depth="3">{{ key }}: {{ value }}</n-text>
                      </div>
                    </n-space>
                  </div>
                </n-space>
              </n-card>

              <n-card size="small" style="flex: 1; min-width: 0;">
                <n-space vertical size="medium">
                  <div v-for="(section, sectionName) in getSecondHalfConfig" :key="sectionName">
                    <n-text depth="2" style="font-weight: 600; margin-bottom: 8px; display: block;">{{ sectionName }}:</n-text>
                    <n-space vertical size="small">
                      <div
                          v-for="(value, key) in section"
                          :key="key"
                          style="padding-left: 8px; border-left: 2px solid var(--n-border-color); font-size: 0.875rem;"
                      >
                        <n-text depth="3">{{ key }}: {{ value }}</n-text>
                      </div>
                    </n-space>
                  </div>
                </n-space>
              </n-card>
            </n-space>
          </n-card>
        </n-space>

        <n-alert v-else type="warning">No stats available</n-alert>
      </n-space>
    </n-card>


  </n-space>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onMounted, onUnmounted, ref, watch, h } from 'vue';
import {
  NAlert, NButton, NDataTable, NDescriptions, NDescriptionsItem, NDivider, NGi, NGrid, NSelect, NTag, NText,
  NSpace, NCard, NH2
} from 'naive-ui';
import { useDashboardStore } from "../stores/kneo/dashboardStore";
import { useRadioStationStore } from "../stores/kneo/radioStationStore";
import { useStationColumns } from "../components/dashboard/stationColumns";
import type { SchedulerTask } from '../types/dashboard';

export default defineComponent({
  name: 'DashboardView',
  components: {
    NButton, NSelect, NText, NSpace, NCard, NH2, NGrid, NGi, NDivider, NDataTable, NTag, NAlert, NDescriptions, NDescriptionsItem
  },
  setup() {
    const parentTitle = inject('parentTitle', ref(''));
    const selectedLanguage = ref('en');
    const languageOptions = [
      { label: 'English', value: 'en' },
      { label: 'Portuguese', value: 'pt' },
    ];
    const userData = inject('userData', ref({ profile: { username: 'Guest' } }));
    const dashboard = useDashboardStore();
    const brandStore = useRadioStationStore();
    const isMobile = ref(window.innerWidth < 768);
    const isStartingBroadcast = ref(false);

    const formatTime = (date: Date) => date.toLocaleTimeString();

    const formatDateTimeWithToday = (dateString: string) => {
      if (!dateString) return 'Not scheduled';
      const date = new Date(dateString);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      const timeString = date.toLocaleString('en-GB', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      if (isToday) {
        return `Today ${timeString}`;
      } else {
        return date.toLocaleString('en-GB', {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        });
      }
    };

    const selectedBrand = ref('');
    const sendCommand = async (brandName: string, command: string) => {
      if (!brandName) return;
      isStartingBroadcast.value = true;
      try {
        await dashboard.triggerBroadcastAction(brandName, command);
      } finally {
        isStartingBroadcast.value = false;
      }
    };

    const stationColumns = useStationColumns(dashboard, isMobile, sendCommand);

    const schedulerTaskColumns = [
      {
        title: 'Entity Name',
        key: 'entityName',
        width: 120
      },
      {
        title: 'Task Type',
        key: 'taskType',
        width: 150
      },
      {
        title: 'Status',
        key: 'status',
        width: 120,
        render: (row: SchedulerTask) => {
          const type = row.status === 'NOT_SCHEDULED' ? 'warning' : 
                      row.status === 'SCHEDULED' ? 'info' : 'default';
          return h(NTag, { type, size: 'small' }, { default: () => row.status });
        }
      },
      {
        title: 'Trigger Type',
        key: 'triggerType',
        width: 120
      },
      {
        title: 'Enabled',
        key: 'enabled',
        width: 80,
        render: (row: SchedulerTask) => {
          return h(NTag, { 
            type: row.enabled ? 'success' : 'error', 
            size: 'small' 
          }, { 
            default: () => row.enabled ? 'Yes' : 'No' 
          });
        }
      },
      {
        title: 'Time Zone',
        key: 'timeZone',
        width: 120
      },
      {
        title: 'Next Execution (Local Time)',
        key: 'nextExecution',
        width: 180,
        render: (row: SchedulerTask) => {
          return formatDateTimeWithToday(row.nextExecution || '');
        }
      },
      {
        title: 'Cron Expression',
        key: 'cronExpression',
        width: 120,
        render: (row: SchedulerTask) => {
          return row.cronExpression || 'None';
        }
      },
      {
        title: 'Upcoming Runs',
        key: 'upcomingExecutions',
        width: 200,
        render: (row: SchedulerTask) => {
          if (!row.upcomingExecutions || row.upcomingExecutions.length === 0) {
            return h('span', { style: 'color: #999;' }, 'None');
          }
          
          return h('div', { style: 'font-size: 11px; line-height: 1.3;' }, 
            row.upcomingExecutions.slice(0, 3).map((execution, index) => {
              const date = new Date(execution.scheduledTime);
              const today = new Date();
              const isToday = date.toDateString() === today.toDateString();
              
              const timeString = date.toLocaleString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              });
              
              const displayTime = isToday ? `Today ${timeString}` : date.toLocaleString('en-GB', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              return h('div', {
                key: index,
                style: {
                  padding: '1px 0',
                  color: isToday ? '#18a058' : '#666',
                  fontWeight: isToday ? 'bold' : 'normal'
                }
              }, `${execution.action}: ${displayTime}`);
            })
          );
        }
      }
    ];

    const brandOptions = computed(() => brandStore.getEntries.map(brand => ({
      label: brand.slugName,
      value: brand.slugName
    })));

    watch(() => dashboard.globalStationsList, (newStations) => {
      if (newStations && newStations.length > 0) {
        newStations.forEach(station => dashboard.ensureStationConnected(station.brandName));
      }
    }, { immediate: true });

    onMounted(() => {
      dashboard.startGlobalPolling();
      brandStore.fetchAll();
      window.addEventListener('resize', () => isMobile.value = window.innerWidth < 768);
      parentTitle.value = 'Dashboard';

      onUnmounted(() => {
        dashboard.stopGlobalPolling();
        dashboard.globalStationsList.forEach(station => dashboard.disconnectStation(station.brandName));
        window.removeEventListener('resize', () => isMobile.value = window.innerWidth < 768);
      });
    });

    const detailedStationsList = computed(() => {
      return dashboard.globalStationsList.map(station => {
        const details = dashboard.getStationDetails(station.brandName);
        return details ? { ...details } : {};
      });
    });

    const getFirstHalfConfig = computed(() => {
      const configDetails = dashboard.globalStats?.configurationStats?.configDetails;
      if (!configDetails) return {};
      const entries = Object.entries(configDetails);
      const halfLength = Math.ceil(entries.length / 2);
      return Object.fromEntries(entries.slice(0, halfLength));
    });

    const getSecondHalfConfig = computed(() => {
      const configDetails = dashboard.globalStats?.configurationStats?.configDetails;
      if (!configDetails) return {};
      const entries = Object.entries(configDetails);
      const halfLength = Math.ceil(entries.length / 2);
      return Object.fromEntries(entries.slice(halfLength));
    });

    return {
      selectedLanguage,
      languageOptions,
      userData,
      dashboard,
      stationColumns,
      schedulerTaskColumns,
      sendCommand,
      formatTime,
      isMobile,
      selectedBrand,
      brandOptions,
      isStartingBroadcast,
      detailedStationsList,
      getFirstHalfConfig,
      getSecondHalfConfig
    };
  },
});
</script>

<style scoped>
.dashboard {
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 600;
  margin: 0;
  font-size: 1rem;
}

.controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.text-sm {
  font-size: 0.85rem;
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.footer {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stations-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.segments-info {
  font-size: 0.85rem;
  color: var(--n-text-color-3);
}

.storage-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
}

.config-stats {
  max-height: 600px;
  overflow-y: auto;
  font-size: 0.8rem;
}

.config-section-title {
  font-weight: 600;
  margin: 4px 0 2px 0;
  color: var(--n-text-color-1);
}

.config-item {
  display: flex;
  margin-bottom: 2px;
  line-height: 1.3;
}

.config-key {
  color: var(--n-text-color-3);
  margin-right: 4px;
  min-width: 120px;
}

.config-value {
  color: var(--n-text-color-2);
  word-break: break-all;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .controls {
    width: 100%;
    flex-wrap: wrap;
  }

  .meta {
    width: 100%;
    justify-content: space-between;
  }

  .footer {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .status-tags {
    flex-direction: column;
    gap: 4px;
  }

  .config-key {
    min-width: 100px;
  }
}
</style>