<template>
  <div class="task-timeline">
    <div v-if="hasValidTimelines">
      <n-timeline>
        <n-timeline-item
            v-for="timeline in filteredTimelines"
            :key="timeline.task.id"
            :type="getTaskType(timeline.task)"
            :title="timeline.task.name"
            :content="getTaskDetails(timeline.task)"
            :time="formatDateTime(timeline.task.lastExecutionTime)"
        />
      </n-timeline>
    </div>
    <div v-else>
      <p>No task timelines available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NTimeline, NTimelineItem } from 'naive-ui';
import { computed } from 'vue';

// Define props
const props = defineProps({
  timelines: {
    type: Array,
    default: () => []
  },
  formatDateTime: {
    type: Function,
    required: true
  }
});

// Debug the incoming timelines
console.log('Timelines received:', props.timelines);

// Filter out timelines with null tasks
const filteredTimelines = computed(() => {
  if (!props.timelines || !Array.isArray(props.timelines)) return [];

  // Debug each timeline to see what's available
  props.timelines.forEach((timeline, index) => {
    console.log(`Timeline ${index}:`, timeline);
    console.log(`Timeline ${index} task:`, timeline?.task);
  });

  return props.timelines.filter(timeline => timeline && timeline.task);
});

// Check if we have any valid timelines
const hasValidTimelines = computed(() => {
  return filteredTimelines.value.length > 0;
});

// Utility function to get task status type for the timeline
const getTaskType = (task) => {
  try {
    if (!task) return 'default';

    const now = new Date();
    const nextExecution = new Date(task.nextExecutionTime);
    const timeDiff = (nextExecution.getTime() - now.getTime()) / 1000;

    if (timeDiff < 60) return 'warning';
    return 'success';
  } catch (error) {
    console.error('Error in getTaskType:', error);
    return 'default';
  }
};

// Utility function to get task details
const getTaskDetails = (task) => {
  try {
    if (!task) return '';

    const details = [
      `ID: ${task.id}`,
      `Next execution: ${formatDateTime(task.nextExecutionTime)}`,
      `Execution count: ${task.executionCount}`,
    ];

    return details.join('\n');
  } catch (error) {
    console.error('Error in getTaskDetails:', error);
    return '';
  }
};
</script>

<style scoped>
.task-timeline {
  padding: 10px;
}
</style>