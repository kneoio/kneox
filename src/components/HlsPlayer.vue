<template>
  <div class="hls-player-container">
    <n-card :bordered="false" class="player-card">
      <!-- Controls in one line -->
      <div class="controls-row">
        <n-space>
          <n-button @click="refreshStream" size="small" type="primary">
            Refresh Stream
          </n-button>
          <n-button @click="toggleMuted" size="small">
            {{ isMuted ? 'Unmute' : 'Mute' }}
          </n-button>
          <n-select
              v-if="levels.length > 0"
              v-model:value="currentLevel"
              :options="qualityOptions"
              placeholder="Quality"
              size="small"
              style="min-width: 120px"
          />
          <n-tag type="info" v-if="playerState">{{ playerState }}</n-tag>
          <n-tag type="success" v-if="currentLevel !== null">
            {{ currentQuality }}
          </n-tag>
        </n-space>
      </div>

      <!-- Video element hidden but still functional in the background -->
      <div class="video-container" style="display: none;">
        <video
            ref="videoElement"
            controls
            class="video-player"
            @playing="handlePlaying"
            @waiting="handleWaiting"
            @error="handleError"
        ></video>
      </div>

      <!-- Stats panel - more compact -->
      <div class="stats-panel">
        <n-card size="small" class="compact-stats-card">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Buffer:</div>
              <div class="stat-value">{{ stats.buffered.toFixed(2) }}s</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Dropped:</div>
              <div class="stat-value">{{ stats.dropped }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Level:</div>
              <div class="stat-value">{{ currentLevelName }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">BW:</div>
              <div class="stat-value">{{ Math.round(stats.bandwidth / 1000) }}kbps</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Loaded:</div>
              <div class="stat-value">{{ Math.round(stats.loaded / (1024 * 1024)) }}MB</div>
            </div>
          </div>

          <template v-if="playerEvents.length > 0">
            <n-divider />
            <n-collapse arrow-placement="right" :default-expanded-names="['events']">
              <n-collapse-item title="Events" name="events">
                <n-scrollbar style="max-height: 200px">
                  <div v-for="(event, index) in playerEvents" :key="index" class="event-item">
                    <span class="event-time">{{ event.time }}</span>
                    <span :class="['event-type', `event-${event.type}`]">{{ event.type }}</span>
                    <span class="event-details">{{ event.details }}</span>
                  </div>
                </n-scrollbar>
              </n-collapse-item>
            </n-collapse>
          </template>
        </n-card>
      </div>
    </n-card>
  </div>
</template>

<script>
import Hls from 'hls.js';
import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { NCard, NSpace, NTag, NButton, NSelect, NDivider, NCollapse, NCollapseItem, NScrollbar } from 'naive-ui';

export default defineComponent({
  name: 'HlsPlayer',
  components: {
    NCard,
    NSpace,
    NTag,
    NButton,
    NSelect,
    NDivider,
    NCollapse,
    NCollapseItem,
    NScrollbar
  },
  props: {
    source: {
      type: String,
      required: true,
      default: 'http://localhost:38707/mitchell-inc/radio/stream.m3u8'
    },
    autoplay: {
      type: Boolean,
      default: true
    },
    debug: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const videoElement = ref(null);
    const hls = ref(null);
    const playerState = ref('Initializing');
    const levels = ref([]);
    const currentLevel = ref(null);
    const isMuted = ref(true);
    const playerEvents = ref([]);
    const stats = ref({
      buffered: 0,
      dropped: 0,
      loaded: 0,
      bandwidth: 0
    });
    let statsInterval = null;

    const qualityOptions = computed(() => {
      const options = levels.value.map((level, index) => {
        return {
          label: `${level.height}p${level.attrs?.FRAME_RATE ? ` (${Math.round(level.attrs.FRAME_RATE)}fps)` : ''}`,
          value: index
        };
      });

      options.unshift({
        label: 'Auto',
        value: -1
      });

      return options;
    });

    const currentLevelName = computed(() => {
      if (currentLevel.value === -1) return 'Auto';
      if (currentLevel.value === null) return 'N/A';
      const level = levels.value[currentLevel.value];
      return level ? `${level.height}p` : 'Unknown';
    });

    const currentQuality = computed(() => {
      if (currentLevel.value === -1) return 'Auto';
      if (currentLevel.value === null || levels.value.length === 0) return 'N/A';
      return `${levels.value[currentLevel.value]?.height || ''}p`;
    });

    const initPlayer = () => {
      if (!videoElement.value) return;

      if (Hls.isSupported()) {
        const hlsInstance = new Hls({
          debug: props.debug,
          startLevel: -1,
          enableWorker: true,
          lowLatencyMode: true
        });

        hls.value = hlsInstance;

        hls.value.on(Hls.Events.MEDIA_ATTACHED, onMediaAttached);
        hls.value.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
        hls.value.on(Hls.Events.LEVEL_SWITCHED, onLevelSwitched);
        hls.value.on(Hls.Events.ERROR, onHlsError);
        hls.value.on(Hls.Events.BUFFER_APPENDING, () => addEvent('buffer', 'Buffer appending'));
        hls.value.on(Hls.Events.FRAG_LOADING, (_, data) => addEvent('fragment', `Loading fragment ${data.frag.sn}`));
        hls.value.on(Hls.Events.LEVEL_LOADING, (_, data) => addEvent('level', `Loading level ${data.level}`));

        hls.value.on(Hls.Events.FRAG_LOADED, (_, data) => {
          const frag = data.frag;
          const fragStats = data.stats;
          let loadingTime = 'unknown';
          if (fragStats && fragStats.loading &&
              fragStats.loading.end !== undefined &&
              fragStats.loading.start !== undefined) {
            loadingTime = `${fragStats.loading.end - fragStats.loading.start}ms`;
          }
          const totalKB = fragStats && fragStats.total ?
              Math.round(fragStats.total / 1024) : 'unknown';
          addEvent('network', `Fragment ${frag.sn} loaded in ${loadingTime} (${totalKB} KB)`);
        });

        hls.value.on(Hls.Events.FRAG_CHANGED, (_, data) => {
          addEvent('playback', `Playing fragment ${data.frag.sn}`);
        });

        hls.value.attachMedia(videoElement.value);
        hls.value.loadSource(props.source);
        statsInterval = window.setInterval(updateStats, 500);
        videoElement.value.muted = isMuted.value;
      } else if (videoElement.value.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.value.src = props.source;
        videoElement.value.addEventListener('loadedmetadata', () => {
          if (props.autoplay && videoElement.value) {
            videoElement.value.play();
          }
        });
        playerState.value = 'Using Native HLS';
      } else {
        playerState.value = 'HLS Not Supported';
        addEvent('error', 'HLS is not supported in this browser');
      }
    };

    const onMediaAttached = () => {
      playerState.value = 'Media Attached';
      addEvent('media', 'Media element attached');
    };

    const onManifestParsed = (_, data) => {
      levels.value = data.levels;
      playerState.value = 'Manifest Loaded';
      addEvent('manifest', `Manifest parsed with ${data.levels.length} quality levels`);

      if (props.autoplay && videoElement.value) {
        videoElement.value.play()
            .catch(e => {
              addEvent('error', `Autoplay failed: ${e.message}`);
              playerState.value = 'Autoplay Blocked';
            });
      }
    };

    const onLevelSwitched = (_, data) => {
      currentLevel.value = data.level;
      const level = levels.value[data.level];
      addEvent('quality', `Switched to ${level ? `${level.height}p` : 'unknown'} quality`);
    };

    const onHlsError = (_, data) => {
      addEvent('error', `HLS error: ${data.details}`);

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            playerState.value = 'Network Error';
            if (hls.value) hls.value.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            playerState.value = 'Media Error';
            if (hls.value) hls.value.recoverMediaError();
            break;
          default:
            playerState.value = 'Fatal Error';
            destroyPlayer();
            break;
        }
      }
    };

    const handlePlaying = () => {
      playerState.value = 'Playing';
    };

    const handleWaiting = () => {
      playerState.value = 'Buffering';
    };

    const handleError = () => {
      playerState.value = 'Video Error';
      addEvent('error', 'Video element error');
    };

    const refreshStream = () => {
      destroyPlayer();
      nextTick(() => {
        initPlayer();
      });
    };

    const toggleMuted = () => {
      if (videoElement.value) {
        videoElement.value.muted = !videoElement.value.muted;
        isMuted.value = videoElement.value.muted;
      }
    };

    const updateStats = () => {
      if (!hls.value || !videoElement.value) return;

      const video = videoElement.value;
      let buffered = 0;
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) {
          buffered = video.buffered.end(i) - video.currentTime;
          break;
        }
      }

      stats.value.buffered = buffered;
      stats.value.dropped = hls.value.stats?.droppedFrames || 0;
      stats.value.loaded = hls.value.stats?.loaded || 0;
      stats.value.bandwidth = hls.value.stats?.bw || 0;
    };

    const addEvent = (type, details) => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });

      playerEvents.value.unshift({
        time: timeString,
        type,
        details
      });

      if (playerEvents.value.length > 200) {
        playerEvents.value.pop();
      }
    };

    const destroyPlayer = () => {
      if (hls.value) {
        hls.value.destroy();
        hls.value = null;
      }
    };

    onMounted(() => {
      initPlayer();
    });

    onUnmounted(() => {
      destroyPlayer();
      if (statsInterval !== null) {
        clearInterval(statsInterval);
      }
    });

    return {
      videoElement,
      playerState,
      levels,
      currentLevel,
      isMuted,
      playerEvents,
      stats,
      qualityOptions,
      currentLevelName,
      currentQuality,
      handlePlaying,
      handleWaiting,
      handleError,
      refreshStream,
      toggleMuted
    };
  }
});
</script>

<style scoped>
.hls-player-container {
  width: 100%;
  margin: 0 auto;
}

.player-card {
  margin-bottom: 1rem;
}

.controls-row {
  margin-bottom: 8px;
}

.stats-panel {
  margin-top: 8px;
}

.compact-stats-card :deep(.n-card__content) {
  padding: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 2px 4px;
  font-size: 13px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.stat-label {
  font-weight: bold;
  margin-right: 4px;
  color: #666;
}

.stat-value {
  color: #333;
}

.event-item {
  padding: 2px 0;
  font-size: 15px;
  line-height: 1.2;
  border-bottom: 1px solid #f0f0f0;
}

.event-time {
  color: #999;
  margin-right: 4px;
  font-size: 12px;
}

.event-type {
  font-weight: bold;
  padding: 0px 2px;
  margin-right: 4px;
  border-radius: 2px;
  font-size: 12px;
}

.event-error {
  background-color: #ffebee;
  color: #d32f2f;
}

.event-media {
  background-color: #e8f5e9;
  color: #388e3c;
}

.event-manifest {
  background-color: #e3f2fd;
  color: #1976d2;
}

.event-quality {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.event-buffer {
  background-color: #fff3e0;
  color: #e65100;
}

.event-fragment {
  background-color: #f1f8e9;
  color: #558b2f;
}

.event-level {
  background-color: #e0f7fa;
  color: #00838f;
}

.event-network {
  background-color: #eceff1;
  color: #546e7a;
}

.event-playback {
  background-color: #e0f2f1;
  color: #00796b;
}

.event-details {
  color: #333;
}
</style>