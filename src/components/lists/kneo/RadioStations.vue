<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Radio Stations</template>
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
import {computed, defineComponent, h, inject, onMounted, onUnmounted, ref, Ref} from 'vue';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NCheckbox,
  NDataTable,
  NGi,
  NGrid,
  NPageHeader,
  useMessage
} from 'naive-ui';
import {useRouter} from 'vue-router';
import {PlayerPlay, PlayerStop} from '@vicons/tabler';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import {RadioStation} from "../../../types/kneoBroadcasterTypes";
import {useRadioStationStore} from "../../../stores/kneo/radioStationStore";

export default defineComponent({
  components: {NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, PlayerPlay, PlayerStop},
  setup() {
    const router = useRouter();
    const message = useMessage();
    const store = useRadioStationStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const currentSongName = inject<Ref<string | null>>('parentTitle');
    const checkedRowKeys = ref<(string | number)[]>([]);

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
        }, 10000);
      }
    };

    const stopPeriodicRefresh = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
      }
    };

    const getStatusStyle = (status: string) => {
      switch (status) {
        case 'ON_LINE':
          return { color: '#00aa00', text: '● ONLINE' };
        case 'ON_LINE_WELL':
          return { color: '#00ff00', text: '● ONLINE (WELL)' };
        case 'WARMING_UP':
          return { color: '#ffa500', text: '● WARMING UP' };
        case 'WAITING_FOR_CURATOR':
          return { color: '#ff69b4', text: '● WAITING FOR CURATOR' };
        case 'IDLE':
          return { color: '#888888', text: '○ IDLE' };
        case 'SYSTEM_ERROR':
          return { color: '#ff0000', text: '⚠ SYSTEM ERROR' };
        case 'OFF_LINE':
        default:
          return { color: '#5a5a5a', text: '○ OFFLINE' };
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

    const handleCopyUrl = (url: string) => {
      navigator.clipboard.writeText(url)
          .then(() => message.success('URL copied to clipboard'))
          .catch(() => message.error('Failed to copy URL'));
    };

    const handlePageChange = async (page: number) => {
      try {
        loading.value = true;
        await store.fetchAll(page, store.getPagination.pageSize);
        checkedRowKeys.value = [];
      } finally {
        loading.value = false;
      }
    };

    const handlePageSizeChange = async (pageSize: number) => {
      try {
        loading.value = true;
        await store.fetchAll(1, pageSize);
        checkedRowKeys.value = [];
      } finally {
        loading.value = false;
      }
    };

    const handleNewClick = () => {
      router.push('/outline/radiostations/new');
    };

    const getRowProps = (row: RadioStation) => {
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

    const columns = computed<DataTableColumns<RadioStation>>(() => {
      const baseColumns: DataTableColumns<RadioStation> = [
        {
          type: 'selection',
          fixed: 'left',
          width: 50,
          renderHeader: () => h(NCheckbox, {
            indeterminate: checkedRowKeys.value.length > 0 && checkedRowKeys.value.length < store.getEntries.length,
            checked: checkedRowKeys.value.length === store.getEntries.length && store.getEntries.length > 0,
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              if (checkedRowKeys.value.length === store.getEntries.length) {
                checkedRowKeys.value = [];
              } else {
                checkedRowKeys.value = store.getEntries.map(item => item.id);
              }
            }
          })
        },
        {
          title: 'Status',
          key: 'status',
          render: (row: RadioStation) => {
            const statusInfo = getStatusStyle(row.status);
            return h('div', {
              style: `color: ${statusInfo.color};`
            }, statusInfo.text);
          }
        },
        {title: 'Name', key: 'slugName'},
        {title: 'Country', key: 'country'},
        {
          title: 'URL',
          key: 'url',
          render: (row: RadioStation) => {
            return h('div', {
              style: 'display: flex; align-items: center; cursor: pointer;',
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                handleCopyUrl(row.url);
              },
              title: 'Click to copy URL'
            }, [
              h('span', {
                style: 'overflow: hidden; text-overflow: ellipsis;',
              }, row.url)
            ]);
          }
        }
      ];

      if (isMobile.value) {
        return [
          {
            type: 'selection',
            fixed: 'left',
            width: 50,
            renderHeader: () => h(NCheckbox, {
              indeterminate: checkedRowKeys.value.length > 0 && checkedRowKeys.value.length < store.getEntries.length,
              checked: checkedRowKeys.value.length === store.getEntries.length && store.getEntries.length > 0,
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                if (checkedRowKeys.value.length === store.getEntries.length) {
                  checkedRowKeys.value = [];
                } else {
                  checkedRowKeys.value = store.getEntries.map(item => item.id);
                }
              }
            })
          },
          {
            title: 'Station',
            key: 'combined',
            render: (row: RadioStation) => {
              const statusInfo = getStatusStyle(row.status);
              return h('div', {}, [
                h('div', { style: 'font-weight: bold;' }, row.slugName),
                h('div', {
                  style: `color: ${statusInfo.color}; font-size: 0.8rem;`
                }, statusInfo.text),
                h('div', {
                  style: 'cursor: pointer; font-size: 0.8rem;',
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                    handleCopyUrl(row.url);
                  }
                }, 'Click to copy URL')
              ]);
            }
          }
        ];
      }

      return baseColumns;
    });

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
      checkedRowKeys
    };
  },
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>