<template>
  <div class="desktop-row">
    <!-- Recently Played Titles -->
    <div v-if="row.recentlyPlayedTitles && row.recentlyPlayedTitles.length > 0" class="recently-played">
      <div class="recently-played-label">Recently played:</div>
      <div v-for="(title, index) in row.recentlyPlayedTitles" :key="index" class="recently-played-item" :title="cleanTitle(title)">
        <span class="item-number">{{ index + 1 }}.</span> {{ cleanTitle(title) }}
      </div>
    </div>

    <!-- Played Fragments List (Desktop Only) -->
    <div class="fragment-list">
      <div class="fragment-list-label">Ready to consume:</div>
      <div v-if="row.playlistManagerStats?.playedFragmentsList && row.playlistManagerStats.playedFragmentsList.length > 0">
        <div
            v-for="(fragment, index) in row.playlistManagerStats.playedFragmentsList"
            :key="index"
            class="fragment-item"
            :class="{ 'currently-playing': isCurrentlyPlaying(fragment) }"
            :title="cleanTitle(fragment)"
        >
          <span class="item-number">{{ index + 1 }}.</span> {{ cleanTitle(fragment) }}
        </div>
      </div>
      <div v-else class="fragment-item">No played fragments available.</div>
    </div>

    <div class="fragment-list">
      <div class="fragment-list-label">Not processed:</div>
      <div v-if="row.playlistManagerStats?.readyToPlayList && row.playlistManagerStats.readyToPlayList.length > 0">
        <div v-for="(fragment, index) in row.playlistManagerStats.readyToPlayList" :key="index" class="fragment-item" :title="cleanTitle(fragment)">
          <span class="item-number">{{ index + 1 }}.</span> {{ cleanTitle(fragment) }}
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
    const cleanTitle = (title: string) => {
      // Remove ### prefix if present
      return title.replace(/^#+\s*/, '').trim();
    };

    const isCurrentlyPlaying = (fragment: string) => {
      const current = props.row.playlistManagerStats?.currentlyPlaying || '';
      // Compare cleaned versions of both strings
      return cleanTitle(fragment) === cleanTitle(current);
    };

    return {
      cleanTitle,
      isCurrentlyPlaying
    };
  }
});
</script>

<style scoped>
.desktop-row {
  font-size: 1rem; /* Base font size for desktop */
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
  display: flex;
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