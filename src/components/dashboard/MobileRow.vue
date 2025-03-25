<template>
  <div class="mobile-row">
    <!-- Station Name -->
    <div class="station-name">{{ row.brandName }}</div>

    <!-- Status Indicator -->
    <div :class="['status-indicator', { online: isOnline }]">
      {{ isOnline ? '● ONLINE' : '○ OFFLINE' }}
    </div>

    <!-- Segments and Bitrate -->
    <div class="station-details">
      <div>Segments: {{ row.segmentsSize || 0 }}</div>
      <div v-if="row.bitrate">Bitrate: {{ row.bitrate }} kbps</div>
    </div>

    <!-- Recently Played Titles -->
    <div v-if="row.recentlyPlayedTitles && row.recentlyPlayedTitles.length > 0" class="recently-played">
      <div class="recently-played-label">Recently played:</div>
      <div v-for="(title, index) in row.recentlyPlayedTitles" :key="index" class="recently-played-item" :title="title">
        <span class="item-number">{{ index + 1 }}.</span> {{ title }}
      </div>
    </div>

    <div v-if="row.playlistManagerStats?.playedFragmentsList && row.playlistManagerStats.playedFragmentsList.length > 0" class="fragment-list">
      <div class="fragment-list-label">Ready to consume:</div>
      <div
          v-for="(fragment, index) in row.playlistManagerStats.playedFragmentsList"
          :key="index"
          class="fragment-item"
          :class="{ 'currently-playing': fragment === row.playlistManagerStats?.currentlyPlaying }"
          :title="fragment"
      >
        <span class="item-number">{{ index + 1 }}.</span> {{ fragment }}
      </div>
    </div>

    <div v-if="row.playlistManagerStats?.readyToPlayList && row.playlistManagerStats.readyToPlayList.length > 0" class="fragment-list">
      <div class="fragment-list-label">Not processed:</div>
      <div v-for="(fragment, index) in row.playlistManagerStats.readyToPlayList" :key="index" class="fragment-item" :title="fragment">
        <span class="item-number">{{ index + 1 }}.</span> {{ fragment }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  props: {
    row: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const isOnline = computed(() => props.row.status === 'ON_LINE');

    return {
      isOnline
    };
  }
});
</script>

<style scoped>
.mobile-row {
  font-size: 0.875rem; /* Slightly smaller font size for mobile */
}

.station-name {
  font-weight: bold;
  margin-bottom: 4px; /* Spacing below station name */
}

.status-indicator {
  font-size: 0.8rem;
  margin-bottom: 4px; /* Spacing below status indicator */
}

.status-indicator.online {
  color: green;
}

.status-indicator:not(.online) {
  color: orange;
}

.station-details {
  margin-bottom: 4px; /* Spacing below station details */
}

.recently-played {
  font-size: 0.75rem; /* Smaller font size for recently played */
  color: #666; /* Subtle text color */
  margin-top: 4px; /* Spacing above recently played */
}

.recently-played-label {
  margin-bottom: 2px; /* Spacing below label */
}

.recently-played-item {
  padding-left: 5px;
  margin-top: 2px;
  border-left: 2px solid #e8e8e8; /* Visual separation */
  display: flex;
}

.fragment-list {
  margin-top: 8px;
  font-size: 0.75rem;
  color: #666;
}

.fragment-list-label {
  font-weight: bold;
  margin-bottom: 4px;
}

.fragment-item {
  padding-left: 8px;
  margin-bottom: 2px;
  border-left: 2px solid #e8e8e8;
  display: flex;
}

.item-number {
  min-width: 20px;
  color: #999;
  margin-right: 4px;
}

.currently-playing {
  font-weight: bold;
  color: #2c3e50;
  background-color: #f0f8ff;
  border-left: 2px solid #3498db;
}

.currently-playing .item-number {
  color: #3498db;
  font-weight: bold;
}
</style>