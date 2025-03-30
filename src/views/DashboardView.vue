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
            <n-text v-if="dashboard.lastUpdate" class="update-time">
              Last update: {{ formatTime(dashboard.lastUpdate) }}
            </n-text>
            <n-text v-if="dashboard.version" class="version-text">
              Version: {{ dashboard.version }}
            </n-text>
          </div>

          <n-divider v-if="!isMobile" />

          <n-row v-if="dashboard.stats.totalStations">
            <n-col :span="6">
              <n-statistic label="Total Stations" :value="dashboard.stats.totalStations" />
            </n-col>
            <n-col :span="6">
              <n-statistic label="Online Stations" :value="dashboard.stats.onlineStations" />
            </n-col>
            <n-col :span="6">
              <n-statistic label="Min Segments" :value="dashboard.stats.minimumSegments" />
            </n-col>
            <n-col :span="6">
              <n-statistic label="Sliding Window" :value="dashboard.stats.slidingWindowSize" />
            </n-col>
          </n-row>

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
import { defineComponent, ref, inject, onMounted, onUnmounted, h, computed } from 'vue';
import {
  NButton, NSelect, NText, NGrid, NGi, NCard, NStatistic, NDivider, NDataTable, NTag, NAlert,
  NCol, NRow
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
    MobileRow
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

    const stationColumns1 = computed(() => {
      const baseColumns = [
        {
          title: 'Name',
          key: 'brandName',
          width: 150,
          render(row: any) {
            return h('div', {
              style: {
                'font-weight': 'bold',
                'font-size': '1.1rem'
              }
            }, row.brandName);
          }
        },
        {
          title: 'Status',
          key: 'status',
          width: 120,
          render(row: any) {
            const statusText = row.status === 'ON_LINE' ? 'Online' :
                row.status === 'WARMING_UP' ? 'Warming up' :
                    row.status;
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
          width: 220,
          render(row: any) {
            const history = row.segmentSizeHistory || [];
            const minSegments = dashboard.stats.minimumSegments || 280;
            const currentValue = row.segmentsSize || 0;
            const last30Items = history.slice(-30); // Now represents 150 seconds (30 * 5s)

            return h('div', {
              style: {
                display: 'flex',
                'flex-direction': 'column',
                gap: '4px'
              }
            }, [
              h('div', {
                style: {
                  'font-weight': 'bold',
                  'text-align': 'center',
                  color: currentValue >= minSegments ? '#18a058' : '#2080f0'
                }
              }, `${currentValue}/${minSegments}`),

              h('div', {
                style: {
                  height: '80px',
                  display: 'flex',
                  'flex-direction': 'column',
                  position: 'relative'
                }
              }, [
                h('div', {
                  style: {
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    bottom: '0',
                    width: '24px',
                    'border-right': '1px solid #e0e0e0',
                    display: 'flex',
                    'flex-direction': 'column',
                    'justify-content': 'space-between',
                    'font-size': '0.7rem',
                    color: '#666'
                  }
                }, [
                  h('span', { style: { 'text-align': 'right', 'padding-right': '4px' } }, minSegments),
                  h('span', { style: { 'text-align': 'right', 'padding-right': '4px' } }, Math.floor(minSegments/2)),
                  h('span', { style: { 'text-align': 'right', 'padding-right': '4px' } }, '0')
                ]),

                h('div', {
                  style: {
                    'margin-left': '24px',
                    height: '100%',
                    position: 'relative'
                  }
                }, [
                  h('div', {
                    style: {
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      bottom: '0',
                      display: 'flex',
                      'flex-direction': 'column',
                      'justify-content': 'space-between'
                    }
                  }, [
                    h('div', { style: { 'border-top': '1px dashed #e0e0e0' } }),
                    h('div', { style: { 'border-top': '1px dashed #e0e0e0' } }),
                    h('div', { style: { 'border-top': '1px solid #e0e0e0' } })
                  ]),

                  h('svg', {
                    style: {
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      width: '100%',
                      height: '100%'
                    },
                    viewBox: `0 0 ${last30Items.length * 10} 100`,
                    preserveAspectRatio: 'none'
                  }, [
                    h('polyline', {
                      points: last30Items.map((value, index) => {
                        const x = index * 10;
                        const y = 100 - (value / minSegments * 100);
                        return `${x},${y}`;
                      }).join(' '),
                      style: {
                        fill: 'none',
                        stroke: '#2080f0',
                        'stroke-width': '2',
                        'stroke-linejoin': 'round'
                      }
                    }),

                    h('circle', {
                      cx: (last30Items.length - 1) * 10,
                      cy: 100 - (currentValue / minSegments * 100),
                      r: '3',
                      fill: '#18a058'
                    })
                  ]),

                  h('div', {
                    style: {
                      position: 'absolute',
                      bottom: '-20px',
                      left: '0',
                      right: '0',
                      display: 'flex',
                      'justify-content': 'space-between',
                      'font-size': '0.6rem',
                      color: '#666'
                    }
                  }, [
                    h('span', {}, '150s ago'),
                    h('span', {}, 'now')
                  ])
                ])
              ])
            ]);
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
            return h(DesktopRow, { row });
          }
        }
      ];

      if (isMobile.value) {
        return [
          {
            title: 'Station',
            key: 'combined',
            render: (row: any) => {
              return h(MobileRow, { row });
            }
          }
        ];
      }

      return baseColumns;
    });

    const triggerAction = async (brandName: string, action: string) => {
      try {
        const response = await fetch(`http://localhost:38707/${brandName}/queue/action`, {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer eyJhbGciOn3Uz8QkrHaPg',
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