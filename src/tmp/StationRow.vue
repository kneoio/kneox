<template>
  <n-space v-if="isMobile" vertical :size="8">
    <n-text strong>{{ station.brandName }}</n-text>
    <n-tag :type="statusType" size="small">{{ statusText }}</n-tag>
    <n-text depth="3" style="font-size: 0.8rem;">Segments: {{ station.segmentsSize || 0 }}</n-text>
    <n-text v-if="station.bitrate" depth="3" style="font-size: 0.8rem;">Bitrate: {{ station.bitrate }} kbps</n-text>
    <n-text strong style="font-size: 0.75rem; margin-top: 4px;">
      Current: {{ currentFragment }}
    </n-text>
    <n-space v-if="recentlyPlayed.length > 0" vertical :size="4" style="margin-top: 5px;">
      <n-text depth="3" style="font-size: 0.7rem;">Recently played:</n-text>
      <n-space v-for="(title, index) in recentlyPlayed" :key="index" vertical :size="2" style="padding-left: 5px; border-left: 2px solid #e8e8e8;">
        <n-text depth="3" style="font-size: 0.7rem;">{{ title }}</n-text>
      </n-space>
    </n-space>
    <n-button size="tiny" type="primary" @click="handleAction" :render-icon="RotateClockwise">
      Refresh
    </n-button>
  </n-space>

  <n-space v-else vertical :size="8">
    <n-text strong style="margin-bottom: 4px;">
      {{ currentFragment || '-' }}
    </n-text>
    <n-space v-if="recentlyPlayed.length > 0" vertical :size="4">
      <n-text depth="3" style="font-size: 0.75rem;">Recently played:</n-text>
      <n-space v-for="(title, index) in recentlyPlayed" :key="index" vertical :size="2" style="padding-left: 8px; border-left: 2px solid #e8e8e8;">
        <n-text depth="3" style="font-size: 0.75rem;">{{ title }}</n-text>
      </n-space>
    </n-space>
  </n-space>

</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NSpace, NText, NTag } from 'naive-ui';
import { RotateClockwise } from '@vicons/tabler';

const props = defineProps({
  station: {
    type: Object,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  handleStationAction: {
    type: Function,
    required: true
  }
});

console.log('Station Data:', props.station);

const currentFragment = computed(() => {
  return props.station.playlistManagerStats?.currentlyPlaying || null;
});

const recentlyPlayed = computed(() => {
  const playedFragments = props.station.playlistManagerStats?.playedFragmentsList || [];
  const readyToPlay = props.station.playlistManagerStats?.readyToPlayList || [];
  return playedFragments.length > 0 ? playedFragments : readyToPlay;
});

const statusText = computed(() => {
  if (props.station.status === 'ON_LINE') return 'ONLINE';
  if (props.station.status === 'WARMING_UP') return 'WARMING UP';
  return 'OFFLINE';
});

const statusType = computed(() => {
  if (props.station.status === 'ON_LINE') return 'success';
  if (props.station.status === 'WARMING_UP') return 'info';
  return 'warning';
});

const handleAction = () => {
  props.handleStationAction(props.station);
};
</script>