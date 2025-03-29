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
  font-size: 0.875rem;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.station-name {
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 6px;
  color: #333;
}

.status-indicator {
  font-size: 0.8rem;
  margin-bottom: 6px;
}

.status-indicator.online {
  color: #52c41a;
}

.status-indicator:not(.online) {
  color: #faad14;
}

.station-details {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 0.8rem;
  color: #666;
}

.recently-played {
  font-size: 0.75rem;
  color: #666;
  margin-top: 8px;
}

.recently-played-label {
  font-weight: 500;
  margin-bottom: 4px;
}

.recently-played-item {
  padding-left: 8px;
  margin-bottom: 2px;
  border-left: 2px solid #e8e8e8;
  display: flex;
  line-height: 1.4;
}

.fragment-list {
  margin-top: 8px;
  font-size: 0.75rem;
  color: #666;
}

.fragment-list-label {
  font-weight: 500;
  margin-bottom: 4px;
}

.fragment-item {
  padding-left: 8px;
  margin-bottom: 2px;
  border-left: 2px solid #e8e8e8;
  display: flex;
  line-height: 1.4;
}

.item-number {
  min-width: 20px;
  color: #999;
  margin-right: 4px;
}

.currently-playing {
  font-weight: bold;
  color: #1890ff;
  background-color: #e6f7ff;
  border-left: 2px solid #1890ff;
}

.currently-playing .item-number {
  color: #1890ff;
}
</style>