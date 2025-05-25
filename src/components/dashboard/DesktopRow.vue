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

      <div v-if="row.timeline" class="hls-provider-section segment-timeline-display">
        <div class="sub-label timeline-main-label">Segment Timeline:</div>

        <div v-if="row.hlsSongStats" class="hls-song-info">
          <div class="song-title-container">
            <span class="info-label">Current Track:</span>
            <span class="song-title" :title="cleanTitle(row.hlsSongStats.title)">
              {{ cleanTitle(row.hlsSongStats.title) }}
            </span>
          </div>
          <div class="song-timestamp-container">
            <span class="info-label">Est. Time:</span>
            <span class="song-timestamp">
              {{ formatHlsTimestamp(row.hlsSongStats.segmentTimestamp) }}
            </span>
          </div>
          <div class="activity-info-container">
            <span class="info-label">Recent Requests:</span>
            <span class="request-count-display">
              {{ row.hlsSongStats.requestCount }}
              <span class="request-count-unit">/ 5min</span>
              <span class="live-dot" v-if="row.hlsSongStats.requestCount > 0">●</span>
            </span>
          </div>
          <div class="estimated-listeners-container">
            <span class="info-label">Est. Listeners:</span>
            <span class="listeners-count-value">
              <template v-if="row.listenersCount === -1">
                <span title="Cannot determine listeners (check config/duration)">N/A</span>
              </template>
              <template v-else>
                {{ row.listenersCount }}
              </template>
            </span>
          </div>
        </div>

        <div class="timeline-string-container">
          <span v-if="row.timeline.pastSegmentSequences && row.timeline.pastSegmentSequences.length > 0" class="timeline-part timeline-past">
            {{ row.timeline.pastSegmentSequences.join('-') }}
          </span>
          <span v-if="row.timeline.pastSegmentSequences && row.timeline.pastSegmentSequences.length > 0" class="timeline-part-separator">-</span>

          <span class="timeline-delimiter">||></span>

          <span v-if="row.timeline.visibleSegmentSequences && row.timeline.visibleSegmentSequences.length > 0" class="timeline-part timeline-visible">
            {{ row.timeline.visibleSegmentSequences.join('-') }}
          </span>
          <span v-else class="timeline-part timeline-visible-empty">(empty)</span>

          <span class="timeline-delimiter"><||</span>

          <span v-if="row.timeline.upcomingSegmentSequences && row.timeline.upcomingSegmentSequences.length > 0" class="timeline-part-separator">-</span>
          <span v-if="row.timeline.upcomingSegmentSequences && row.timeline.upcomingSegmentSequences.length > 0" class="timeline-part timeline-upcoming">
            {{ row.timeline.upcomingSegmentSequences.join('-') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    row: {
      type: Object,
      required: true
    }
  },
  setup() {
    const cleanTitle = (title: string | undefined | null): string => {
      if (!title) return 'N/A';
      return title.replace(/^#+\s*/, '').trim();
    };

    const formatHlsTimestamp = (timestampSeconds: number | undefined | null): string => {
      if (!timestampSeconds) return 'N/A';
      try {
        const date = new Date(timestampSeconds * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch (e) {
        return 'Invalid Date';
      }
    };

    return {
      cleanTitle,
      formatHlsTimestamp,
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
  min-width: 500px;
}

.segment-timeline-display .timeline-main-label {
  margin-bottom: 8px;
}

.hls-song-info {
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 0.85rem;
}

.song-title-container,
.song-timestamp-container,
.activity-info-container,
.estimated-listeners-container {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.info-label {
  font-weight: 600;
  color: #555;
  margin-right: 8px;
  min-width: 110px; /* Adjusted for new label */
}

.song-title {
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 350px;
}

.song-timestamp {
  color: #333;
}

.request-count-display {
  display: flex;
  align-items: center;
  color: #333;
}

.request-count-unit {
  font-size: 0.9em;
  color: #6c757d;
  margin-left: 3px;
  margin-right: 5px;
}

.listeners-count-value {
  color: #333;
  font-weight: bold;
}

.listeners-count-value span[title] {
  font-weight: normal;
  color: #757575;
  cursor: help;
}

.live-dot {
  color: #28a745;
  font-size: 1.2em;
  margin-left: 4px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.timeline-string-container {
  font-family: monospace;
  font-size: 0.9rem;
  background-color: #f0f0f0;
  padding: 10px 15px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid #dcdcdc;
  white-space: nowrap;
  overflow-x: auto;
  max-width: 100%;
}

.timeline-part {
  /* Base style for segment sequence number groups */
}

.timeline-past {
  color: #5a5a5a;
}

.timeline-visible {
  color: #1a73e8;
  font-weight: bold;
}

.timeline-visible-empty {
  color: #d93025;
  font-style: italic;
}

.timeline-upcoming {
  color: #188038;
}

.timeline-delimiter {
  color: #ff6f00;
  font-weight: bold;
  margin-left: 3px;
  margin-right: 3px;
}

.timeline-part-separator {
  color: #757575;
  margin-left: 1px;
  margin-right: 1px;
}
</style>