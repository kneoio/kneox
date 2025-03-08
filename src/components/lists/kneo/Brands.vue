<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Brands</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-button-group>
        <n-button @click="handleNewClick" type="primary" size="large">New</n-button>
      </n-button-group>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-data-table
          remote
          :columns="columns"
          :row-key="rowKey"
          :data="store.getEntries"
          :pagination="store.getPagination"
          :bordered="false"
          :row-props="getRowProps"
          :loading="loading"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
      >
        <template #loading>
          <loader-icon/>
        </template>
      </n-data-table>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, ref, onUnmounted, h, inject, Ref} from 'vue';
import {DataTableColumns, NButton, NButtonGroup, NDataTable, NGi, NGrid, NIcon, NPageHeader} from 'naive-ui';
import {useRouter} from 'vue-router';
import {Ear, EarOff} from '@vicons/tabler';
import Hls from 'hls.js';

import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import {SoundFragment} from "../../../types/kneoBroadcasterTypes";
import {useBrandStore} from "../../../stores/kneo/brandsStore";

export default defineComponent({
  components: {NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, Ear, EarOff},
  setup() {
    const router = useRouter();
    const store = useBrandStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const audioRef = ref<HTMLAudioElement | null>(null);
    const hlsInstance = ref<Hls | null>(null);
    const currentlyPlayingId = ref<string | null>(null);
    const currentSongName = inject<Ref<string | null>>('parentTitle');
    const songNamesMap = ref<Map<string, string>>(new Map());

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchAll();
        // Fetch song names for all entries after loading data
        await fetchAllSongNames();
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        loading.value = false;
      }
    }

    const startPeriodicRefresh = () => {
      if (!intervalId.value) {
        // More frequent refresh (10 seconds) for better song tracking
        intervalId.value = window.setInterval(async () => {
          try {
            await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
            // Refresh song names on periodic updates
            await fetchAllSongNames();
          } catch (error) {
            console.error('Periodic refresh failed:', error);
          }
        }, 10000);
      }
    };

    const stopPeriodicRefresh = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
      }
    };

    async function fetchAllSongNames() {
      for (const entry of store.getEntries) {
        if (!songNamesMap.value.has(entry.id)) {
          const songName = await fetchAndParsePlaylist(entry.url);
          if (songName) {
            songNamesMap.value.set(entry.id, songName);
          }
        }
      }
    }

    preFetch();
    startPeriodicRefresh();

    onMounted(() => {
      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    onUnmounted(() => {
      stopPeriodicRefresh();
      if (audioRef.value) {
        audioRef.value.pause();
        audioRef.value = null;
      }
      if (hlsInstance.value) {
        hlsInstance.value.destroy();
      }
    });

    const handlePlayClick = async (row: SoundFragment) => {
      const rowId = row.id;

      if (currentlyPlayingId.value === rowId) {
        if (audioRef.value) {
          audioRef.value.pause();
          audioRef.value = null;
        }
        if (hlsInstance.value) {
          hlsInstance.value.destroy();
          hlsInstance.value = null;
        }
        currentlyPlayingId.value = null;
        return;
      }

      if (currentlyPlayingId.value) {
        if (audioRef.value) {
          audioRef.value.pause();
          audioRef.value = null;
        }
        if (hlsInstance.value) {
          hlsInstance.value.destroy();
          hlsInstance.value = null;
        }
      }

      audioRef.value = new Audio();

      if (Hls.isSupported()) {
        hlsInstance.value = new Hls();
        hlsInstance.value.loadSource(row.url);
        hlsInstance.value.attachMedia(audioRef.value);
        hlsInstance.value.on(Hls.Events.MANIFEST_PARSED, () => {
          audioRef.value?.play();
          currentlyPlayingId.value = rowId;
        });
      } else if (audioRef.value.canPlayType('application/vnd.apple.mpegurl')) {
        audioRef.value.src = row.url;
        audioRef.value.play();
        currentlyPlayingId.value = rowId;
      } else {
        console.error('HLS is not supported in this browser.');
      }
      const songName = await fetchAndParsePlaylist(row.url);
      if (songName) {
        songNamesMap.value.set(row.id, songName);
      }
      if (currentSongName) {
        currentSongName.value = songName || null;
      }
      await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
    };

    const columns = computed<DataTableColumns<SoundFragment>>(() => {
      const baseColumns: DataTableColumns<SoundFragment> = [
        {
          title: 'Status',
          key: 'status',
          render: (row: SoundFragment) => {
            return h('span', {
              style: row.status === 'ON_LINE' ? 'color: blue;' : 'color: #FF69B4;'
            }, row.status);
          }
        },
        {title: 'Name', key: 'slugName'},
        {
          title: 'Playing...',
          key: 'songName',
          render: (row: SoundFragment) => {
            const songName = songNamesMap.value.get(row.id);
            const isPlaying = currentlyPlayingId.value === row.id;

            return h('div', {}, [
              h('span', {
                style: isPlaying ? 'font-weight: bold; color: #4CAF50;' : ''
              }, songName || (isPlaying ? '♪ Loading... ♪' : 'Not playing')),
              isPlaying ? h('span', {
                class: 'animate-pulse',
                style: 'margin-left: 5px; color: #4CAF50;'
              }, ' ♫') : null
            ]);
          }
        },
        {title: 'Country', key: 'country'},
        {title: 'URL', key: 'url'},
        {
          title: 'You can hear it now',
          key: 'play',
          render: (row: SoundFragment) => {
            const isPlaying = currentlyPlayingId.value === row.id;
            return h(
                NButton,
                {
                  size: 'small',
                  onClick: () => handlePlayClick(row),
                  color: isPlaying ? '#98FB98' : undefined,
                  textColor: isPlaying ? 'black' : undefined
                },
                {
                  default: () => h(NIcon, null, {
                    default: () => isPlaying ? h(Ear) : h(EarOff)
                  })
                }
            );
          },
        },
      ];

      if (isMobile.value) {
        return [
          {
            title: 'Station',
            key: 'combined',
            render: (row: SoundFragment) => {
              const isOnline = row.status === 'ON_LINE';
              return h('div', {}, [
                h('div', { style: 'font-weight: bold;' }, row.slugName),
                h('div', {
                  style: isOnline ? 'color: blue; font-size: 0.8rem;' : 'color: #FF69B4; font-size: 0.8rem;'
                }, isOnline ? '● ONLINE' : '○ OFFLINE')
              ]);
            }
          },
          {
            title: 'Playing...',
            key: 'songName',
            render: (row: SoundFragment) => {
              const songName = songNamesMap.value.get(row.id);
              const isPlaying = currentlyPlayingId.value === row.id;

              return h('div', {}, [
                h('span', {
                  style: isPlaying ? 'font-weight: bold; color: #4CAF50;' : ''
                }, songName || (isPlaying ? '♪ Loading... ♪' : 'Not playing')),
                isPlaying ? h('span', {
                  class: 'animate-pulse',
                  style: 'margin-left: 5px; color: #4CAF50;'
                }, ' ♫') : null
              ]);
            }
          },
          {
            title: 'Listen',
            key: 'play',
            render: (row: SoundFragment) => {
              const isPlaying = currentlyPlayingId.value === row.id;
              return h(
                  NButton,
                  {
                    size: 'small',
                    onClick: () => handlePlayClick(row),
                    color: isPlaying ? '#98FB98' : undefined,
                    textColor: isPlaying ? 'black' : undefined
                  },
                  {
                    default: () => h(NIcon, null, {
                      default: () => isPlaying ? h(Ear) : h(EarOff)
                    })
                  }
              );
            },
          },
        ];
      }

      return baseColumns;
    });

    const handlePageChange = async (page: number) => {
      try {
        loading.value = true;
        await store.fetchAll(page, store.getPagination.pageSize);
        await fetchAllSongNames();
      } finally {
        loading.value = false;
      }
    };

    const handlePageSizeChange = async (pageSize: number) => {
      try {
        loading.value = true;
        await store.fetchAll(1, pageSize);
        await fetchAllSongNames();
      } finally {
        loading.value = false;
      }
    };

    const handleNewClick = () => {
      router.push({name: 'NewSoundFragment'}).catch((err) => {
        console.error('Navigation error:', err);
      });
    };

    const getRowProps = (row: SoundFragment) => {
      return {
        style: 'cursor: pointer;',
        onClick: () => {
          const routeTo = {name: 'SoundFragment', params: {id: row.id}};
          router.push(routeTo).catch((err) => {
            console.error('Navigation error:', err);
          });
        },
      };
    };

    async function fetchAndParsePlaylist(url: string): Promise<string | null> {
      try {
        const response = await fetch(url);
        const playlistText = await response.text();
        const lines = playlistText.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('#EXTINF:')) {
            const parts = lines[i].split(',');
            if (parts.length > 1) {
              return parts[1].trim(); // Return the song name
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch or parse playlist:', error);
      }
      return null;
    }

    return {
      store,
      columns,
      rowKey: (row: any) => row.id,
      isMobile,
      currentSongName,
      handleNewClick,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
    };
  },
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}

.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>