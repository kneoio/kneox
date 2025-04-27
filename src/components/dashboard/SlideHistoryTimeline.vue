<template>
  <div class="timeline-section" v-if="slideHistory && slideHistory.length > 0">
    <h3 class="section-title">Slide Events</h3>

    <div class="timeline-container">
      <n-timeline horizontal item-placement="right">
        <n-timeline-item
            item-placement="right"
            v-for="(slide, index) in latestFiveEvents"
            :key="`slide-${index}-${slide.timestamp}`"
            :type="getTimelineItemType(slide)"
        >
          <div class="slide-content">
            <div class="slide-top">
              <span class="event-type">{{slide.type }}</span>
              <span class="error-value">{{ formatError(slide.timingError) }}</span>
            </div>
            <div class="event-time">{{ formatTime(slide.timestamp) }}</div>
          </div>
        </n-timeline-item>
      </n-timeline>
    </div>

    <div class="timeline-stats">
      <span>Last: {{ formatLastSlideTime(lastSlide) }}</span>
      <span>Total (only last 5 shown): {{ slideHistory.length }}</span>
      <span>Avg: {{ calculatedAvgError.toFixed(2) }}ms</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { NTimeline, NTimelineItem } from 'naive-ui';

export default defineComponent({
  components: {
    NTimeline,
    NTimelineItem
  },
  props: {
    slideHistory: {
      type: Array as () => Array<{
        type: string;
        timestamp: string;
        timingError?: number;
      }>,
      required: true
    },
    lastSlide: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const latestFiveEvents = computed(() => {
      return [...props.slideHistory]
          .slice(-5)
          .reverse();
    });

    // Format error with fixed width
    const formatError = (error?: number) => {
      return ` - ${(error ?? 0).toFixed(1)}ms`.padStart(7, ' ');
    };

    // Format time to HHMMSS (no separators)
    const formatTime = (timestamp: string) => {
      try {
        const date = new Date(timestamp);
        return [
          date.getHours().toString().padStart(2, '0'),
          date.getMinutes().toString().padStart(2, '0'),
          date.getSeconds().toString().padStart(2, '0')
        ].join(':');
      } catch {
        return timestamp.substring(11, 19) || '------';
      }
    };

    const formatLastSlideTime = (timestamp: string) => {
      if (!timestamp) return '--';
      return timestamp.length > 19 ? timestamp.substring(0, 19) : timestamp;
    };

    const getTimelineItemType = (slide: any) => {
      const error = slide.timingError ?? 0;
      if (error > 100) return 'error';
      if (error > 50) return 'warning';
      return 'info';
    };

    const calculatedAvgError = computed(() => {
      const validEntries = props.slideHistory
          .filter(s => typeof s.timingError === 'number');
      return validEntries.length
          ? validEntries.reduce((sum, s) => sum + (s.timingError ?? 0), 0) / validEntries.length
          : 0;
    });

    return {
      latestFiveEvents,
      formatError,
      formatTime,
      formatLastSlideTime,
      getTimelineItemType,
      calculatedAvgError
    };
  }
});
</script>

<style scoped>
.timeline-section {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.section-title {
  margin: 0 0 8px 0;
  font-weight: 600;
}

.timeline-container {
  overflow-x: auto;
  padding: 5px 0;
  margin-bottom: 8px;
}

.slide-content {
  min-width: 80px;
  text-align: center;
}

.slide-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.event-type {
  font-weight: bold;
}

.error-value {
  color: #666;
}

.event-time {
  color: #555;
  letter-spacing: 0.5px;
}

.timeline-stats {
  display: flex;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid #e0e0e0;
}


</style>