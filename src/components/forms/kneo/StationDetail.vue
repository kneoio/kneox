<template>
  <div class="station-dashboard p-6 bg-white min-h-screen">
    <!-- Header Section -->
    <div class="dashboard-header mb-6 max-w-4xl">
      <n-card>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="station-avatar w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" 
                 :style="{ backgroundColor: stationColor }">
              {{ stationInitials }}
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ brandName }}</h1>
              <div class="flex items-center gap-2 mt-1">
                <n-tag :type="isOnline ? 'success' : 'error'" size="small">
                  {{ isOnline ? 'ONLINE' : 'OFFLINE' }}
                </n-tag>
                <span class="text-gray-500 text-sm">{{ currentListeners }} listeners</span>
              </div>
            </div>
          </div>
          <div class="flex gap-3">
            <n-button 
              type="primary" 
              size="large" 
              :loading="isStartingStation" 
              :disabled="isOnline"
              @click="handleStart">
              <template #icon>
                <n-icon><Play /></n-icon>
              </template>
              Start Station
            </n-button>
            <n-button 
              type="error" 
              size="large" 
              :loading="isStoppingStation" 
              :disabled="!isOnline"
              @click="handleStop">
              <template #icon>
                <n-icon><Stop /></n-icon>
              </template>
              Stop Station
            </n-button>
          </div>
        </div>
      </n-card>
    </div>

    <!-- Dashboard Grid -->
    <div class="dashboard-grid grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      
      <!-- AI DJ Memory -->
      <div class="col-span-1">
        <n-card title="AI DJ Memory" class="h-full">
          <template #header-extra>
            <n-button size="small" @click="clearMemory">
              <template #icon>
                <n-icon><Trash /></n-icon>
              </template>
            </n-button>
          </template>
          <div class="memory-stats mb-4">
            <n-statistic label="Memory Usage" :value="aiMemory.usage" suffix="%" class="mb-3">
              <template #prefix>
                <n-icon color="#9333ea"><BrainIcon /></n-icon>
              </template>
            </n-statistic>
            <n-progress :percentage="aiMemory.usage" :color="aiMemory.usage > 80 ? '#ef4444' : '#10b981'" />
          </div>
          <div class="memory-entries max-h-64 overflow-y-auto">
            <div v-if="aiMemory.entries.length === 0" class="text-center text-gray-500 py-8">
              <n-icon size="48" class="mb-2"><BrainIcon /></n-icon>
              <p>No memory entries</p>
            </div>
            <div v-else class="space-y-2">
              <div v-for="(entry, index) in aiMemory.entries" :key="index" 
                   class="memory-entry p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-purple-900">{{ entry.type }}</p>
                    <p class="text-xs text-purple-600 mt-1">{{ entry.content }}</p>
                  </div>
                  <span class="text-xs text-purple-500">{{ entry.timestamp }}</span>
                </div>
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Current Playlist -->
      <div class="col-span-1">
        <n-card title="Current Playlist" class="h-full">
          <template #header-extra>
            <n-button size="small" @click="refreshPlaylist">
              <template #icon>
                <n-icon><Refresh /></n-icon>
              </template>
            </n-button>
          </template>
          <div class="playlist-container max-h-96 overflow-y-auto">
            <div v-if="currentPlaylist.length === 0" class="text-center text-gray-500 py-8">
              <n-icon size="48" class="mb-2"><Music /></n-icon>
              <p>No tracks in playlist</p>
            </div>
            <div v-else class="space-y-3">
              <div v-for="(track, index) in currentPlaylist" :key="index" 
                   class="playlist-item p-3 rounded-lg border" 
                   :class="{ 'bg-blue-50 border-blue-200': track.isPlaying, 'bg-white border-gray-200': !track.isPlaying }">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0">
                    <n-icon v-if="track.isPlaying" color="#2080f0"><Play /></n-icon>
                    <span v-else class="text-gray-400 text-sm font-mono">{{ String(index + 1).padStart(2, '0') }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 truncate">{{ track.title }}</p>
                    <p class="text-sm text-gray-500 truncate">{{ track.artist }}</p>
                    <p class="text-xs text-gray-400">{{ track.duration }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Schedule Section -->
      <div class="col-span-1 xl:col-span-2">
        <n-card title="Schedule" class="h-full">
          <template #header-extra>
            <n-button size="small" @click="openScheduleEditor">
              <template #icon>
                <n-icon><Edit /></n-icon>
              </template>
              Edit
            </n-button>
          </template>
          <div class="schedule-timeline">
            <div v-if="scheduleData.length === 0" class="text-center text-gray-500 py-8">
              <n-icon size="48" class="mb-2"><Calendar /></n-icon>
              <p>No scheduled tasks</p>
            </div>
            <div v-else class="space-y-3">
              <div v-for="(task, index) in scheduleData" :key="index" 
                   class="schedule-item p-4 rounded-lg border bg-white">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="schedule-time bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {{ task.startTime }} - {{ task.endTime }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ task.title }}</p>
                      <p class="text-sm text-gray-500">{{ task.weekdays.join(', ') }}</p>
                    </div>
                  </div>
                  <n-tag :type="task.isActive ? 'success' : 'default'" size="small">
                    {{ task.isActive ? 'ACTIVE' : 'SCHEDULED' }}
                  </n-tag>
                </div>
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Health Section -->
      <div class="col-span-1 xl:col-span-2">
        <n-card title="Health & Performance" class="h-full">
          <template #header-extra>
            <n-tag :type="healthStatus.type as 'success' | 'warning' | 'error'" size="small">{{ healthStatus.label }}</n-tag>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <n-statistic label="CPU Usage" :value="healthMetrics.cpu" suffix="%">
              <template #prefix>
                <n-icon color="#18a058"><Cpu /></n-icon>
              </template>
            </n-statistic>
            <n-statistic label="Memory Usage" :value="healthMetrics.memory" suffix="MB">
              <template #prefix>
                <n-icon color="#2080f0"><Memory /></n-icon>
              </template>
            </n-statistic>
            <n-statistic label="Uptime" :value="healthMetrics.uptime">
              <template #prefix>
                <n-icon color="#f0a020"><Clock /></n-icon>
              </template>
            </n-statistic>
            <n-statistic label="Listeners Peak" :value="healthMetrics.peakListeners">
              <template #prefix>
                <n-icon color="#d03050"><Users /></n-icon>
              </template>
            </n-statistic>
          </div>
          <div class="chart-container" style="height: 300px;">
            <canvas ref="healthChartRef"></canvas>
          </div>
        </n-card>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, nextTick } from 'vue';
import { useDashboardStore } from '../../../stores/kneo/dashboardStore';
import { 
  NButton, NCard, NIcon, NTag, NStatistic, NProgress,
  useMessage
} from 'naive-ui';
import {
  PlayerPlay as Play, PlayerStop as Stop, Refresh, Edit, Trash, Calendar,
  Music, Cpu, DeviceDesktop as Memory, Clock, Users, Bulb as BrainIcon
} from '@vicons/tabler';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface PlaylistTrack {
  title: string;
  artist: string;
  duration: string;
  isPlaying: boolean;
}

interface ScheduleTask {
  title: string;
  startTime: string;
  endTime: string;
  weekdays: string[];
  isActive: boolean;
}

interface MemoryEntry {
  type: string;
  content: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

export default defineComponent({
  name: 'StationDetail',
  components: {
    NButton, NCard, NIcon, NTag, NStatistic, NProgress,
    Play, Stop, Refresh, Edit, Trash, Calendar,
    Music, Cpu, Memory, Clock, Users, BrainIcon
  },
  props: {
    brandName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const dashboardStore = useDashboardStore();
    const message = useMessage();
    const healthChartRef = ref<HTMLCanvasElement>();

    // State
    const isStartingStation = ref(false);
    const isStoppingStation = ref(false);
    const isOnline = ref(false);
    const currentListeners = ref(0);
    const stationColor = ref('#2080f0');
    
    // Health metrics
    const healthMetrics = ref({
      cpu: 45,
      memory: 512,
      uptime: '2d 14h 32m',
      peakListeners: 1247
    });

    // Playlist data
    const currentPlaylist = ref<PlaylistTrack[]>([
      { title: 'Midnight City', artist: 'M83', duration: '4:03', isPlaying: true },
      { title: 'One More Time', artist: 'Daft Punk', duration: '5:20', isPlaying: false },
      { title: 'Strobe', artist: 'Deadmau5', duration: '10:36', isPlaying: false },
      { title: 'Levels', artist: 'Avicii', duration: '6:17', isPlaying: false },
      { title: 'Sandstorm', artist: 'Darude', duration: '3:54', isPlaying: false }
    ]);

    // Schedule data
    const scheduleData = ref<ScheduleTask[]>([
      {
        title: 'Start DJs shift',
        startTime: '09:00',
        endTime: '10:00',
        weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        isActive: true
      },
      {
        title: 'Start DJs shift',
        startTime: '23:00',
        endTime: '00:00',
        weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        isActive: false
      }
    ]);

    // AI Memory data
    const aiMemory = ref({
      usage: 67,
      entries: [
        {
          type: 'Listener Preference',
          content: 'High engagement with electronic music during evening hours',
          timestamp: '2 hours ago',
          priority: 'high' as const
        },
        {
          type: 'Track History',
          content: 'Avoided playing similar tracks within 30 minutes',
          timestamp: '45 minutes ago',
          priority: 'medium' as const
        },
        {
          type: 'Mood Analysis',
          content: 'Detected upbeat preference in current session',
          timestamp: '15 minutes ago',
          priority: 'low' as const
        }
      ] as MemoryEntry[]
    });

    // Computed
    const stationInitials = computed(() => {
      return props.brandName.substring(0, 2).toUpperCase();
    });

    const healthStatus = computed(() => {
      const cpu = healthMetrics.value.cpu;
      if (cpu > 80) return { type: 'error', label: 'Critical' };
      if (cpu > 60) return { type: 'warning', label: 'Warning' };
      return { type: 'success', label: 'Healthy' };
    });

    // Methods
    const handleStart = async () => {
      if (!props.brandName) return;
      isStartingStation.value = true;
      try {
        await dashboardStore.triggerBroadcastAction(props.brandName, 'start');
        isOnline.value = true;
        message.success('Station started successfully');
      } catch (error) {
        console.error(`Error starting station ${props.brandName}:`, error);
        message.error('Failed to start station');
      } finally {
        isStartingStation.value = false;
      }
    };

    const handleStop = async () => {
      if (!props.brandName) return;
      isStoppingStation.value = true;
      try {
        await dashboardStore.triggerBroadcastAction(props.brandName, 'stop');
        isOnline.value = false;
        message.success('Station stopped successfully');
      } catch (error) {
        console.error(`Error stopping station ${props.brandName}:`, error);
        message.error('Failed to stop station');
      } finally {
        isStoppingStation.value = false;
      }
    };

    const refreshPlaylist = () => {
      message.info('Refreshing playlist...');
      // TODO: Implement playlist refresh
    };

    const openScheduleEditor = () => {
      message.info('Opening schedule editor...');
      // TODO: Implement schedule editor
    };

    const clearMemory = () => {
      aiMemory.value.entries = [];
      aiMemory.value.usage = 0;
      message.success('AI memory cleared');
    };

    const initHealthChart = () => {
      if (!healthChartRef.value) return;

      const ctx = healthChartRef.value.getContext('2d');
      if (!ctx) return;

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['1h ago', '45m ago', '30m ago', '15m ago', 'Now'],
          datasets: [
            {
              label: 'Listeners',
              data: [850, 920, 1100, 1050, currentListeners.value],
              borderColor: '#2080f0',
              backgroundColor: 'rgba(32, 128, 240, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'CPU %',
              data: [35, 42, 55, 48, healthMetrics.value.cpu],
              borderColor: '#18a058',
              backgroundColor: 'rgba(24, 160, 88, 0.1)',
              tension: 0.4,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Listeners'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'CPU %'
              },
              grid: {
                drawOnChartArea: false,
              },
            }
          },
          plugins: {
            legend: {
              position: 'top'
            }
          }
        }
      });
    };

    // Lifecycle
    onMounted(async () => {
      await nextTick();
      initHealthChart();
      
      // Simulate real-time data updates
      setInterval(() => {
        currentListeners.value = Math.floor(Math.random() * 200) + 900;
        healthMetrics.value.cpu = Math.floor(Math.random() * 30) + 30;
      }, 5000);
    });

    watch(() => dashboardStore.stationsList, (newStations) => {
      newStations.forEach(station => dashboardStore.ensureStationConnected(station.brandName));
    }, { immediate: true });

    return {
      // State
      isStartingStation,
      isStoppingStation,
      isOnline,
      currentListeners,
      stationColor,
      healthMetrics,
      currentPlaylist,
      scheduleData,
      aiMemory,
      healthChartRef,
      
      // Computed
      stationInitials,
      healthStatus,
      
      // Methods
      handleStart,
      handleStop,
      refreshPlaylist,
      openScheduleEditor,
      clearMemory
    };
  },
});
</script>

<style scoped>
.station-dashboard {
  background: white;
}

.dashboard-header .n-card {
  border: none;
  background: white;
}

.dashboard-grid .n-card {
  border: 1px solid #e5e7eb;
  background: white;
}

.playlist-item {
  transition: all 0.2s ease;
}

.playlist-item:hover {
  transform: translateX(4px);
}

.schedule-item {
  transition: all 0.2s ease;
  border-left: 4px solid #2080f0;
}

.schedule-item:hover {
  box-shadow: 0 4px 12px rgba(32, 128, 240, 0.15);
}

.memory-entry {
  transition: all 0.2s ease;
}

.memory-entry:hover {
  transform: scale(1.02);
}

.chart-container {
  position: relative;
}
</style>
