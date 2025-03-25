<template>
  <n-card title="Dashboardssssssss" :bordered="false" class="dashboard-card">
    <h3>System Tasks</h3>
    <TaskTimeline
        :timelines="dashboard.stats.timelines"
        :format-date-time="formatDateTime"
    />
  </n-card>
    <n-card title="Dashboarddddddddddddddd" :bordered="false" class="dashboard-card">
    <div class="dashboard-stats">
      <div class="stat-item">
        <div class="stat-label">Total Stations</div>
        <div class="stat-value">{{ dashboard.stats.totalStations }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Online Stations</div>
        <div class="stat-value">{{ dashboard.stats.onlineStations }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Min.segments(to start ask more from PlaylistManager)</div>
        <div class="stat-value">{{ dashboard.stats.minimumSegments }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Max.segments to start clean</div>
        <div class="stat-value">{{ dashboard.stats.slidingWindowSize }}</div>
      </div>
    </div>
    </n-card>
  <n-card>
    <div v-if="dashboard.lastUpdate" class="last-updated">
      Last Updated: {{ formatTime(dashboard.lastUpdate) }}
    </div>
  </n-card>
</template>

<script setup lang="ts">
import {NCard} from 'naive-ui';
import {computed} from 'vue';
import TaskTimeline from '../components/TaskTimeline.vue';

// Define props
const props = defineProps({
  dashboard: {
    type: Object,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  formatTime: {
    type: Function,
    required: true
  },
  formatDateTime: {
    type: Function,
    required: true
  },
  formatRemainingTime: {
    type: Function,
    required: true
  },
  getTaskTimelineType: {
    type: Function,
    required: true
  },
  getTaskProgressStatus: {
    type: Function,
    required: true
  }
});

// Check if timelines exist
const hasTimelines = computed(() => {
  return props.dashboard.stats.timelines &&
      Array.isArray(props.dashboard.stats.timelines) &&
      props.dashboard.stats.timelines.length > 0;
});
</script>

<style scoped>
.dashboard-card {
  height: 100%;
  width: 100%;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  padding: 12px;
  border-radius: 8px;
  background-color: rgba(240, 240, 240, 0.6);
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.timeline-section {
  margin-top: 24px;
}

.timeline-section h3 {
  margin-bottom: 16px;
  font-size: 1.2rem;
  color: #333;
}

.last-updated {
  margin-top: 20px;
  text-align: right;
  font-size: 0.8rem;
  color: #888;
}

@media (max-width: 768px) {
  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>