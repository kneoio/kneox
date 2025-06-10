<template>
  <div class="dashboard">
    <n-grid x-gap="12" y-gap="12" :cols="isMobile ? 1 : 24">
      <n-gi :span="24">
        <div class="header">
          <p v-if="userData?.profile?.username" class="username">Hello, {{ userData.profile.username }}</p>
          <div class="controls">
            <n-tag :type="dashboard.isConnected ? 'success' : 'error'" size="small">
              {{ dashboard.isConnected ? 'Connected' : 'Disconnected' }}
            </n-tag>
            <n-select
                v-model:value="selectedBrand"
                :options="brandOptions"
                placeholder="Select brand"
                filterable
                size="small"
                style="width: 150px"
            />
            <n-button
                size="small"
                type="primary"
                @click="sendCommand(selectedBrand, 'start')"
                :disabled="!selectedBrand"
                :loading="isStartingBroadcast"
            >
              Start
            </n-button>
            <n-button
                size="small"
                type="warning"
                @click="sendCommand(selectedBrand, 'feed')"
                :disabled="!selectedBrand"
                :loading="isStartingBroadcast"
            >
              Feed
            </n-button>
          </div>
          <div class="meta">
            <n-text v-if="dashboard.lastUpdate" depth="3" class="text-sm">
              Updated: {{ formatTime(dashboard.lastUpdate) }}
            </n-text>
            <n-text v-if="dashboard.version" depth="3" class="text-sm">
              v{{ dashboard.version }}
            </n-text>
          </div>
        </div>

        <n-divider />

        <n-descriptions
            v-if="dashboard.stats"
            label-placement="top"
            :column="isMobile ? 2 : 3"
            size="small"
            bordered
        >
          <n-descriptions-item label="Stations">
            <div class="stations-info">
              <n-tag :type="dashboard.stats.totalStations > 0 ? 'info' : 'warning'" size="small">
                Total: {{ dashboard.stats.totalStations }}
              </n-tag>
              <div class="status-tags">
                <n-tag type="success" size="small">Online: {{ dashboard.stats.onlineStations }}</n-tag>
                <n-tag type="warning" size="small">Warming: {{ dashboard.stats.warmingStations }}</n-tag>
                <n-tag type="error" size="small">Offline: {{ dashboard.stats.offlineStations }}</n-tag>
              </div>
              <div class="segments-info">
                Segments: {{ dashboard.stats.minimumSegments }}-{{ dashboard.stats.slidingWindowSize }}
              </div>
            </div>
          </n-descriptions-item>

          <n-descriptions-item label="Storage" v-if="dashboard?.stats?.fileMaintenanceStats">
            <div class="storage-stats">
              <div>Total: {{ (dashboard.stats.fileMaintenanceStats.totalSpaceBytes / (1024 * 1024 * 1024)).toFixed(2) }} GB</div>
              <div>Available: {{ (dashboard.stats.fileMaintenanceStats.availableSpaceBytes / (1024 * 1024 * 1024)).toFixed(2) }} GB</div>
              <div>Freed: {{ (dashboard.stats.fileMaintenanceStats.spaceFreedBytes / (1024 * 1024)).toFixed(2) }} MB</div>
              <div>Files/Dirs: {{ dashboard.stats.fileMaintenanceStats.filesDeleted }}/{{ dashboard.stats.fileMaintenanceStats.directoriesDeleted }}</div>
            </div>
          </n-descriptions-item>

          <n-descriptions-item label="Configuration">
            <div class="config-stats">
              <div v-for="(section, sectionName) in dashboard.stats.configurationStats?.configDetails" :key="sectionName">
                <div class="config-section-title">{{ sectionName }}</div>
                <div v-for="(value, key) in section" :key="key" class="config-item">
                  <span class="config-key">{{ key }}:</span>
                  <span class="config-value">{{ value }}</span>
                </div>
              </div>
            </div>
          </n-descriptions-item>
        </n-descriptions>
        <n-alert v-else type="warning" class="mt-2">No stats available</n-alert>
      </n-gi>

      <n-gi :span="24" class="mt-4">
        <n-data-table
            :columns="stationColumns"
            :data="detailedStationsList"
            :pagination="{ pageSize: 5 }"
            :row-key="(row: StationEntry) => row.brandName"
            size="small"
        />
      </n-gi>
    </n-grid>

    <div class="footer">
      <n-select v-model:value="selectedLanguage" :options="languageOptions" size="small" style="width: 120px" />
      <div>
        <n-button text size="small">License</n-button>
        <n-button text size="small">About</n-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  NAlert, NButton, NDataTable, NDescriptions, NDescriptionsItem, NDivider, NGi, NGrid, NSelect, NTag, NText
} from 'naive-ui';
import { useDashboardStore } from "../stores/kneo/dashboardStore";
import { useRadioStationStore } from "../stores/kneo/radioStationStore";
import { useStationColumns } from "../components/dashboard/stationColumns";

export default defineComponent({
  name: 'DashboardView',
  components: {
    NButton, NSelect, NText, NGrid, NGi, NDivider, NDataTable, NTag, NAlert, NDescriptions, NDescriptionsItem
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

    const stationColumns = useStationColumns(dashboard, isMobile);
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

    const brandOptions = computed(() => brandStore.getEntries.map(brand => ({
      label: brand.slugName,
      value: brand.slugName
    })));

    watch(() => dashboard.stationsList, (newStations) => {
      newStations.forEach(station => dashboard.ensureStationConnected(station.brandName));
    }, { immediate: true });

    onMounted(() => {
      dashboard.connect();
      const cleanup = dashboard.setupPeriodicRefresh(3000);
      brandStore.fetchAll();
      window.addEventListener('resize', () => isMobile.value = window.innerWidth < 768);
      parentTitle.value = 'Dashboard';
      onUnmounted(() => {
        cleanup();
        dashboard.disconnect();
        dashboard.stationsList.forEach(station => dashboard.disconnectStation(station.brandName));
        window.removeEventListener('resize', () => isMobile.value = window.innerWidth < 768);
      });
    });

    const detailedStationsList = computed(() => {
      return dashboard.stationsList.map(station => {
        const details = dashboard.getStationDetails(station.brandName);
        return details ? { ...details } : {};
      });
    });

    return {
      selectedLanguage,
      languageOptions,
      userData,
      dashboard,
      stationColumns,
      sendCommand,
      formatTime,
      isMobile,
      selectedBrand,
      brandOptions,
      isStartingBroadcast,
      detailedStationsList
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
  max-height: 100px;
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