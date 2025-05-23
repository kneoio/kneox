<template>
  <div class="dashboard-container">
    <div class="desktop-row">
      <div class="playlist-manager-section">
        <div class="fragment-list">
          <div class="sub-label">Consumed by HLS player:</div>
          <div v-if="row.playlistManagerStats?.obtainedByPlaylist && row.playlistManagerStats.obtainedByPlaylist.length > 0">
            <div
                v-for="(fragment, index) in row.playlistManagerStats.obtainedByPlaylist"
                :key="index"
                class="playlist-item"
                :title="cleanTitle(fragment)"
            >
              <span class="item-number">{{ index + 1 }}.</span> {{ cleanTitle(fragment) }}
            </div>
          </div>
          <div v-else class="playlist-item">No played fragments available.</div>
        </div>

        <div class="fragment-list">
          <div class="sub-label">Ready to be consumed by HLS player:</div>
          <div v-if="row.playlistManagerStats?.readyToBeConsumed && row.playlistManagerStats.readyToBeConsumed.length > 0">
            <div
                v-for="(fragment, index) in row.playlistManagerStats.readyToBeConsumed"
                :key="index"
                class="playlist-item"
                :title="cleanTitle(fragment)"
            >
              <span class="item-number">{{ index + 1 }}.</span> {{ cleanTitle(fragment) }}
            </div>
          </div>
          <div v-else class="playlist-item">No ready to play fragments available.</div>
        </div>
      </div>

      <div v-if="row.songStatistics" class="hls-provider-section">
        <div class="songs-table">
          <div class="table-header">
            <div class="header-cell song-name">Title</div>
            <div class="header-cell duration-cell">Duration</div>
            <div class="header-cell bitrate-cell">Bitrate</div>
            <div class="header-cell requests-cell">Requests</div>
            <div class="header-cell segment-range-cell">Segment Range</div>
          </div>
          <div class="table-body">
            <div v-for="(stats, start) in row.songStatistics" :key="start" class="table-row">
              <div class="table-cell song-name" :title="cleanTitle(stats.title)">
                {{ cleanTitle(stats.title) }}
              </div>
              <div class="table-cell duration-cell">{{ formatDuration(stats.totalDuration) }}</div>
              <div class="table-cell bitrate-cell">{{ stats.averageBitrate }} kbps</div>
              <div class="table-cell requests-cell">{{ stats.requestCount }}</div>
              <div
                  class="table-cell segment-range-cell"
                  :class="{
                  'in-current-window': isInCurrentWindow(stats.start, stats.end),
                  'stale-segment': stats.stale
                }"
              >
                <div class="range-display">
                  {{ stats.start }}
                  <span v-if="!isLatestSegment(stats.start, stats.end)" class="range-separator">→</span>
                  <span
                      v-else
                      class="latest-segment flash"
                  >
                    {{ latestRequestedSeg }}
                  </span>
                  {{ stats.end }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SlideHistoryTimeline
        v-if="row.slideHistory && row.slideHistory.length > 0"
        :slide-history="row.slideHistory"
        :last-slide="row.lastSlide"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import SlideHistoryTimeline from './SlideHistoryTimeline.vue';

export default defineComponent({
  components: {
    SlideHistoryTimeline
  },
  props: {
    row: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const cleanTitle = (title: string) => {
      return title.replace(/^#+\s*/, '').trim();
    };

    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const latestRequestedSeg = computed(() => props.row.latestRequestedSeg);
    const currentWindow = computed(() => props.row.currentWindow || []);

    const isLatestSegment = (start: number, end: number): boolean => {
      return latestRequestedSeg.value !== undefined &&
          latestRequestedSeg.value >= start &&
          latestRequestedSeg.value <= end;
    };

    const isInCurrentWindow = (start: number, end: number): boolean => {
      return currentWindow.value.some(window =>
          start >= window[0] && end <= window[1]
      );
    };

    return {
      cleanTitle,
      formatDuration,
      latestRequestedSeg,
      isLatestSegment,
      isInCurrentWindow
    };
  }
});
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.desktop-row {
  display: flex;
  gap: 50px;
  font-size: 1rem;
}

.playlist-manager-section,
.hls-provider-section {
  flex: 1;
  font-size: 0.8rem;
}

.sub-label {
  font-weight: 600;
  margin-bottom: 4px;
  color: #666;
}

.playlist-item {
  padding-left: 8px;
  margin-bottom: 2px;
  border-left: 2px solid #e8e8e8;
  display: flex;
  font-size: 0.875rem;
  color: #666;
}

.item-number {
  min-width: 20px;
  color: #999;
  margin-right: 4px;
}

.hls-provider-section {
  min-width: 800px;
}

.songs-table {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: flex;
  color: #444;
  border-bottom: 1px solid #e0e0e0;
}

.header-cell {
  padding: 8px 12px;
  flex: 1;
  text-align: center;
}

.header-cell.song-name {
  flex: 2;
  text-align: left;
}

.header-cell.duration-cell {
  flex: 1.5;
}

.header-cell.bitrate-cell {
  flex: 1.5;
}

.header-cell.requests-cell {
  flex: 1.5;
}

.header-cell.segment-range-cell {
  flex: 2;
}

.table-body {
  max-height: 300px;
  overflow-y: auto;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  padding: 8px 12px;
  flex: 1;
  text-align: center;
  font-size: 0.875rem;
  color: #555;
}

.table-cell.song-name {
  flex: 3;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-cell.duration-cell {
  flex: 1.5;
}

.table-cell.bitrate-cell {
  flex: 1.5;
}

.table-cell.requests-cell {
  flex: 1.5;
}

.table-cell.segment-range-cell {
  flex: 2;
}

.segment-range-cell {
  position: relative;
}

.range-display {
  font-family: monospace;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.range-separator {
  font-size: 1.2em;
  color: #777;
}

.latest-segment {
  background-color: #2664b3;
  color: white;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 0.75rem;
  z-index: 10;
}

.flash {
  animation: flash-animation 0.2s infinite alternate;
}

@keyframes flash-animation {
  from { opacity: 1; }
  to { opacity: 0.4; }
}

.table-row:hover {
  background-color: #f0f0f0;
}

.in-current-window {
  color: #28a745 !important;
  font-weight: bold;
}

.stale-segment {
  color: #c62828 !important;
}
</style>