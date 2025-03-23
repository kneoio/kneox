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

    <!-- Current Fragment -->
    <div v-if="row.playlistManagerStats?.currentlyPlaying" class="current-fragment" :title="row.playlistManagerStats.currentlyPlaying">
      Current: {{ row.playlistManagerStats.currentlyPlaying }}
    </div>

    <!-- Recently Played Titles -->
    <div v-if="row.recentlyPlayedTitles && row.recentlyPlayedTitles.length > 0" class="recently-played">
      <div class="recently-played-label">Recently played:</div>
      <div v-for="(title, index) in row.recentlyPlayedTitles" :key="index" class="recently-played-item" :title="title">
        {{ title }}
      </div>
    </div>

    <!-- Played Fragments List -->
    <div v-if="row.playlistManagerStats?.playedFragmentsList && row.playlistManagerStats.playedFragmentsList.length > 0" class="fragment-list">
      <div class="fragment-list-label">Played:</div>
      <div v-for="(fragment, index) in row.playlistManagerStats.playedFragmentsList" :key="index" class="fragment-item" :title="fragment">
        {{ fragment }}
      </div>
    </div>

    <!-- Ready to Play List -->
    <div v-if="row.playlistManagerStats?.readyToPlayList && row.playlistManagerStats.readyToPlayList.length > 0" class="fragment-list">
      <div class="fragment-list-label">Ready:</div>
      <div v-for="(fragment, index) in row.playlistManagerStats.readyToPlayList" :key="index" class="fragment-item" :title="fragment">
        {{ fragment }}
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

.current-fragment {
  font-weight: bold;
  margin-top: 4px; /* Spacing above current fragment */
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
}
</style>