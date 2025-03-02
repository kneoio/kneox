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
import {computed, defineComponent, onMounted, ref, onUnmounted, h} from 'vue';
import {DataTableColumns, NButton, NButtonGroup, NDataTable, NGi, NGrid, NIcon, NPageHeader} from 'naive-ui';
import {useRouter} from 'vue-router';
import {PlayerPlay, PlayerStop} from '@vicons/tabler';
import Hls from 'hls.js';

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
    const audioRef = ref<HTMLAudioElement | null>(null);
    const hlsInstance = ref<Hls | null>(null);
    const currentlyPlayingId = ref<string | null>(null);

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchAll("kneo");
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
            await store.fetchAll("kneo", store.getPagination.page, store.getPagination.pageSize);
          } catch (error) {
            console.error('Periodic refresh failed:', error);
          }
        }, 30000);
      }
    };

    const stopPeriodicRefresh = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
      }
    };

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
      await store.fetchAll("kneo", store.getPagination.page, store.getPagination.pageSize);
    };

    const columns = computed<DataTableColumns<SoundFragment>>(() => {
      const baseColumns: DataTableColumns<SoundFragment> = [
        {title: 'Status', key: 'status'},
        {title: 'Name', key: 'slugName'},
        {title: 'Country', key: 'country'},
        {title: 'URL', key: 'url'},
        {
          title: 'Play',
          key: 'play',
          render: (row: SoundFragment) => {
            return h(
                NButton,
                {
                  size: 'small',
                  onClick: () => handlePlayClick(row),
                },
                {
                  default: () => h(NIcon, null, {
                    default: () => currentlyPlayingId.value === row.id ? h(PlayerStop) : h(PlayerPlay)
                  })
                }
            );
          },
        },
      ];

      if (isMobile.value) {
        return baseColumns.filter(column => ['status', 'slugName', 'play'].includes(column.key as string));
      }

      return baseColumns;
    });

    const handlePageChange = async (page: number) => {
      try {
        loading.value = true;
        await store.fetchAll("kneo", page, store.getPagination.pageSize);
      } finally {
        loading.value = false;
      }
    };

    const handlePageSizeChange = async (pageSize: number) => {
      try {
        loading.value = true;
        await store.fetchAll("kneo",1, pageSize);
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

    return {
      store,
      columns,
      rowKey: (row: any) => row.id,
      isMobile,
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