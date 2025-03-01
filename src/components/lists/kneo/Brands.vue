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
          <loader-icon />
        </template>
      </n-data-table>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, onUnmounted, h } from 'vue';
import {DataTableColumns, NButton, NButtonGroup, NDataTable, NGi, NGrid, NIcon, NPageHeader} from 'naive-ui';
import { useRouter } from 'vue-router';
import { PlayerPlay } from '@vicons/tabler'; // Import the icon

import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import { SoundFragment } from "../../../types/kneoBroadcasterTypes";
import { useBrandStore } from "../../../stores/kneo/brandsStore";
import {LockOutlined} from "@vicons/antd";

export default defineComponent({
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, PlayerPlay },
  setup() {
    const router = useRouter();
    const store = useBrandStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const audioRef = ref<HTMLAudioElement | null>(null);

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchAll();
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
    });

    const handlePlayClick = (url: string) => {
      if (audioRef.value) {
        audioRef.value.pause();
        audioRef.value = null;
      }
      audioRef.value = new Audio(url);
      audioRef.value.play();
    };

    const columns = computed<DataTableColumns<SoundFragment>>(() => {
      const baseColumns: DataTableColumns<SoundFragment> = [
        { title: 'Status', key: 'status' },
        { title: 'Name', key: 'slugName' },
        { title: 'Country', key: 'country' },
        { title: 'URL', key: 'url' },
        {
          title: 'Play',
          key: 'play',
          render: (row: SoundFragment) => {
            return h(
                NButton,
                {
                  size: 'small',
                  onClick: () => handlePlayClick(row.url),
                },
                {
                  default: () => h(NIcon, null, { default: () => h(PlayerPlay) })
                }
            );
          },
        },
      ];
      return baseColumns;
    });

    const handlePageChange = async (page: number) => {
      try {
        loading.value = true;
        await store.fetchAll(page, store.getPagination.pageSize);
      } finally {
        loading.value = false;
      }
    };

    const handlePageSizeChange = async (pageSize: number) => {
      try {
        loading.value = true;
        await store.fetchAll(1, pageSize);
      } finally {
        loading.value = false;
      }
    };

    const handleNewClick = () => {
      router.push({ name: 'NewSoundFragment' }).catch((err) => {
        console.error('Navigation error:', err);
      });
    };

    const getRowProps = (row: SoundFragment) => {
      return {
        style: 'cursor: pointer;',
        onClick: () => {
          const routeTo = { name: 'SoundFragment', params: { id: row.id } };
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