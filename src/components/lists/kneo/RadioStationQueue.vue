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
import {PlayerPlay, PlayerStop} from '@vicons/tabler';

import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import {SoundFragment} from "../../../types/kneoBroadcasterTypes";
import {useBrandStore} from "../../../stores/kneo/brandsStore";

export default defineComponent({
  components: {NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, PlayerPlay, PlayerStop},
  setup() {
    const router = useRouter();
    const store = useBrandStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const currentSongName = inject<Ref<string | null>>('parentTitle');
    const songNamesMap = ref<Map<string, string>>(new Map());

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchAll();
        await fetchAllSongNames();
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        loading.value = false;
      }
    }

    const startPeriodicRefresh = () => {
      if (!intervalId.value) {
        intervalId.value = window.setInterval(async () => {
          try {
            await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
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
      // Fetch current song names for all online stations
      for (const station of store.getEntries) {
        if (station.status === 'ON_LINE') {
          try {
            const songName = await fetchAndParsePlaylist(station.url);
            if (songName) {
              songNamesMap.value.set(station.id, songName);
            }
          } catch (error) {
            console.error('Error fetching song name for station:', station.id, error);
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
    });

    const startBroadcasting = async (row: SoundFragment) => {
      try {
        loading.value = true;

        // Use correct endpoint for PUT request
        const response = await fetch(row.actionUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'start' })
        });

        if (!response.ok) {
          throw new Error(`Failed to start broadcasting: ${response.statusText}`);
        }

        await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);

        const songName = await fetchAndParsePlaylist(row.url);
        if (songName) {
          songNamesMap.value.set(row.id, songName);
        }
      } catch (error) {
        console.error('Failed to start broadcasting:', error);
      } finally {
        loading.value = false;
      }
    };

    const columns = computed<DataTableColumns<SoundFragment>>(() => {
      const baseColumns: DataTableColumns<SoundFragment> = [
        {title: 'Name', key: 'slugName'},
        {title: 'Country', key: 'country'},
        {
          title: 'URL',
          key: 'url',
          render: (row: SoundFragment) => {
            return h('div', { style: 'display: flex; align-items: center;' }, [
              h('span', { style: 'margin-right: 8px; overflow: hidden; text-overflow: ellipsis;' }, row.url),
              h(NButton, {
                size: 'small',
                onClick: (e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(row.url);
                }
              }, { default: () => 'Copy URL' })
            ]);
          }
        },
        {
          title: 'Status',
          key: 'broadcast',
          render: (row: SoundFragment) => {
            const isOnline = row.status === 'ON_LINE';
            return h(
                NButton,
                {
                  size: 'small',
                  onClick: (e) => {
                    e.stopPropagation();
                    startBroadcasting(row);
                  },
                  color: isOnline ? '#829ff3' : undefined,
                  textColor: isOnline ? 'black' : undefined,
                  disabled: isOnline
                },
                {
                  default: () => [
                    h(NIcon, null, {
                      default: () => isOnline ? h(PlayerStop) : h(PlayerPlay)
                    }),
                    h('span', { style: 'margin-left: 5px' }, isOnline ? 'Broadcasting' : 'Broadcast')
                  ]
                }
            );
          },
        }
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
            title: 'Actions',
            key: 'actions',
            render: (row: SoundFragment) => {
              const isOnline = row.status === 'ON_LINE';

              return h('div', { style: 'display: flex; gap: 8px;' }, [
                h(
                    NButton,
                    {
                      size: 'small',
                      onClick: (e) => {
                        e.stopPropagation();
                        startBroadcasting(row);
                      },
                      color: isOnline ? '#98FB98' : undefined,
                      textColor: isOnline ? 'black' : undefined,
                      disabled: isOnline
                    },
                    {
                      default: () => h(NIcon, null, {
                        default: () => isOnline ? h(PlayerStop) : h(PlayerPlay)
                      })
                    }
                )
              ]);
            }
          }
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

        // Find the last #EXTINF entry in the playlist
        let lastSongName = null;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('#EXTINF:')) {
            const parts = lines[i].split(',');
            if (parts.length > 1) {
              lastSongName = parts[1].trim();
            }
          }
        }

        return lastSongName;
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
</style>