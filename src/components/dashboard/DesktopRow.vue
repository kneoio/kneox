<template>
  <div class="desktop-row">

    <div class="current-fragment" :title="row.playlistManagerStats?.currentlyPlaying || 'N/A'">
      {{ row.playlistManagerStats?.currentlyPlaying || '-' }}
    </div>

    <!-- Recently Played Titles -->
    <div v-if="row.recentlyPlayedTitles && row.recentlyPlayedTitles.length > 0" class="recently-played">
      <div class="recently-played-label">Recently played:</div>
      <div v-for="(title, index) in row.recentlyPlayedTitles" :key="index" class="recently-played-item" :title="title">
        {{ title }}
      </div>
    </div>

    <!-- Played Fragments List (Desktop Only) -->
    <div class="fragment-list">
      <div class="fragment-list-label">Played Fragments:</div>
      <div v-if="row.playlistManagerStats?.playedFragmentsList && row.playlistManagerStats.playedFragmentsList.length > 0">
        <div v-for="(fragment, index) in row.playlistManagerStats.playedFragmentsList" :key="index" class="fragment-item" :title="fragment">
          {{ fragment }}
        </div>
      </div>
      <div v-else class="fragment-item">No played fragments available.</div>
    </div>

    <!-- Ready to Play List (Desktop Only) -->
    <div class="fragment-list">
      <div class="fragment-list-label">Ready to Play:</div>
      <div v-if="row.playlistManagerStats?.readyToPlayList && row.playlistManagerStats.readyToPlayList.length > 0">
        <div v-for="(fragment, index) in row.playlistManagerStats.readyToPlayList" :key="index" class="fragment-item" :title="fragment">
          {{ fragment }}
        </div>
      </div>
      <div v-else class="fragment-item">No ready to play fragments available.</div>
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
  setup(props) {
    console.log(props.row); // Debug: Log the row object
    return {};
  }
});
</script>

<style scoped>
.desktop-row {
  font-size: 1rem; /* Base font size for desktop */
}

.station-name {
  font-weight: bold;
  margin-bottom: 8px; /* Spacing below station name */
}

.current-fragment {
  font-weight: bold;
  margin-bottom: 8px; /* Spacing below current fragment */
}

.recently-played {
  font-size: 0.875rem; /* Smaller font size for recently played */
  color: #666; /* Subtle text color */
}

.recently-played-label {
  margin-bottom: 4px; /* Spacing below label */
}

.recently-played-item {
  padding-left: 8px;
  margin-bottom: 2px;
  border-left: 2px solid #e8e8e8; /* Visual separation */
}

.fragment-list {
  margin-top: 8px;
  font-size: 0.875rem;
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