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
import {DataTableColumns, NButton, NButtonGroup, NDataTable, NGi, NGrid, NPageHeader} from 'naive-ui';
import {useRouter} from 'vue-router';

import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import {SoundFragment} from "../../../types/kneoBroadcasterTypes";
import {useBrandStore} from "../../../stores/kneo/brandsStore";

export default defineComponent({
  components: {NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon},
  setup() {
    const router = useRouter();
    const store = useBrandStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);

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
        // Less frequent refresh (60 seconds)
        intervalId.value = window.setInterval(async () => {
          try {
            await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
          } catch (error) {
            console.error('Periodic refresh failed:', error);
          }
        }, 60000);
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
    });

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
        {title: 'Country', key: 'country'},
        {title: 'URL', key: 'url'},
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
            title: 'Country',
            key: 'country'
          }
        ];
      }

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
      router.push({name: 'RadioStation'}).catch((err) => {
        console.error('Navigation error:', err);
      });
    };

    const getRowProps = (row: SoundFragment) => {
      return {
        style: 'cursor: pointer;',
        onClick: () => {
          const routeTo = {name: 'RadioStation', params: {id: row.id}};
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