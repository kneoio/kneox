<template>
  <div class="desktop-row">
    <!-- Playlist Manager Section -->
    <div class="playlist-manager-section">
      <div class="section-label">Playlist Manager Stats</div>

      <!-- Recently Played Titles -->
      <div v-if="row.recentlyPlayedTitles && row.recentlyPlayedTitles.length > 0" class="recently-played">
        <div class="sub-label">Recently played:</div>
        <div v-for="(title, index) in row.recentlyPlayedTitles" :key="index" class="playlist-item" :title="cleanTitle(title)">
          <span class="item-number">{{ index + 1 }}.</span> {{ cleanTitle(title) }}
        </div>
      </div>

      <!-- Ready to consume -->
      <div class="fragment-list">
        <div class="sub-label">Ready to consume:</div>
        <div v-if="row.playlistManagerStats?.playedFragmentsList && row.playlistManagerStats.playedFragmentsList.length > 0">
          <div
              v-for="(fragment, index) in row.playlistManagerStats.playedFragmentsList"
              :key="index"
              class="playlist-item"
              :title="cleanTitle(fragment)"
          >
            <span class="item-number">{{ index + 1 }}.</span> {{ cleanTitle(fragment) }}
          </div>
        </div>
        <div v-else class="playlist-item">No played fragments available.</div>
      </div>

      <!-- Not processed -->
      <div class="fragment-list">
        <div class="sub-label">Not processed:</div>
        <div v-if="row.playlistManagerStats?.readyToPlayList && row.playlistManagerStats.readyToPlayList.length > 0">
          <div v-for="(fragment, index) in row.playlistManagerStats.readyToPlayList" :key="index" class="playlist-item" :title="cleanTitle(fragment)">
            <span class="item-number">{{ index + 1 }}.</span> {{ cleanTitle(fragment) }}
          </div>
        </div>
        <div v-else class="playlist-item">No ready to play fragments available.</div>
      </div>
    </div>

    <!-- HLS Provider Section -->
    <div v-if="row.songStatistics" class="hls-provider-section">
      <div class="section-label">HLS Provider Stats</div>

      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-label">Total Fragments:</span>
          <span class="stat-value">{{ Object.keys(row.songStatistics).length }}</span>
        </div>
      </div>

      <div class="songs-table">
        <div class="table-header">
          <div class="header-cell song-name">Title</div>
          <div class="header-cell">Segments</div>
          <div class="header-cell">Duration</div>
          <div class="header-cell">Bitrate</div>
          <div class="header-cell">Requests</div>
        </div>

        <div class="table-body">
          <div v-for="(stats, songName) in row.songStatistics" :key="songName" class="table-row">
            <div class="table-cell song-name" :title="cleanTitle(songName)">
              {{ cleanTitle(songName) }}
            </div>
            <div class="table-cell">{{ stats.segmentCount }}</div>
            <div class="table-cell">{{ stats.totalDuration }}s</div>
            <div class="table-cell">{{ stats.averageBitrate }} kbps</div>
            <div class="table-cell">{{ stats.requestCount }}</div>
          </div>

          <!-- Summary Row (only for Segments and Duration) -->
          <div class="table-row summary-row">
            <div class="table-cell song-name">Total</div>
            <div class="table-cell">{{ totalSegments }}</div>
            <div class="table-cell">{{ totalDuration }}s</div>
            <div class="table-cell"></div>
            <div class="table-cell"></div>
          </div>
        </div>
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
    const cleanTitle = (title: string) => {
      return title.replace(/^#+\s*/, '').trim();
    };

    const totalSegments = computed(() => {
      return Object.values(props.row.songStatistics || {})
          .reduce((sum: number, stats: any) => sum + (stats.segmentCount || 0), 0);
    });

    const totalDuration = computed(() => {
      return Object.values(props.row.songStatistics || {})
          .reduce((sum: number, stats: any) => sum + (stats.totalDuration || 0), 0)
          .toFixed(2);
    });

    return {
      cleanTitle,
      totalSegments,
      totalDuration
    };
  }
});
</script>

<style scoped>
.desktop-row {
  display: flex;
  gap: 20px;
  font-size: 1rem;
}

.playlist-manager-section,
.hls-provider-section {
  flex: 1;
}

.section-label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #2c3e50;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 4px;
}

.sub-label {
  font-weight: 600;
  margin-bottom: 4px;
  color: #666;
}

.recently-played {
  margin-bottom: 12px;
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
  min-width: 400px;
}

.stats-summary {
  margin-bottom: 12px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.stat-label {
  font-weight: 600;
  color: #555;
}

.stat-value {
  font-weight: 500;
  color: #2c3e50;
}

.songs-table {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: flex;
  background-color: #f0f0f0;
  font-weight: 600;
  color: #444;
  border-bottom: 1px solid #e0e0e0;
}

.header-cell {
  padding: 8px 12px;
  flex: 1;
  text-align: center;
}

.header-cell.song-name {
  flex: 3;
  text-align: left;
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

.table-row:nth-child(even) {
  background-color: #f9f9f9;
}

.table-row:hover {
  background-color: #f0f0f0;
}

.summary-row {
  font-weight: bold;
  background-color: #f0f0f0 !important;
  border-top: 2px solid #ddd;
}

.summary-row .table-cell {
  color: #2c3e50;
}
</style>