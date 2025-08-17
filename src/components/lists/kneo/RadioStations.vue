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
        <n-button
            type="error"
            :disabled="!hasSelection"
            @click="handleDelete"
            size="large"
        >
          Delete ({{ checkedRowKeys.length }})
        </n-button>
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
          :row-class-name="rowClassName"
          :loading="loading"
          v-model:checked-row-keys="checkedRowKeys"
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
  NTag,
  useMessage
} from 'naive-ui';
import {useRouter} from 'vue-router';
import {PlayerPlay, PlayerStop} from '@vicons/tabler';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import {RadioStation} from "../../../types/kneoBroadcasterTypes";
import {useRadioStationStore} from "../../../stores/kneo/radioStationStore";

export default defineComponent({
  components: {NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, NTag, LoaderIcon, PlayerPlay, PlayerStop},
  setup() {
    const router = useRouter();
    const message = useMessage();
    const store = useRadioStationStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const clockIntervalId = ref<number | null>(null);
    const currentTime = ref(new Date());
    const currentSongName = inject<Ref<string | null>>('parentTitle');
    const checkedRowKeys = ref<(string | number)[]>([]);
    const hasSelection = computed(() => checkedRowKeys.value.length > 0);

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

    const startClockUpdate = () => {
      if (!clockIntervalId.value) {
        clockIntervalId.value = window.setInterval(() => {
          currentTime.value = new Date();
        }, 60000); // Update every minute
      }
    };

    const stopClockUpdate = () => {
      if (clockIntervalId.value) {
        clearInterval(clockIntervalId.value);
        clockIntervalId.value = null;
      }
    };

    const getStatusStyle = (status: string) => {
      switch (status) {
        case 'ON_LINE':
          return { color: '#00aa00', text: '● ONLINE' };
        case 'QUEUE_SATURATED':
          return { color: '#00aa00', text: '● QUEUE SATURATED' };
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
    startClockUpdate();

    onMounted(() => {
      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    onUnmounted(() => {
      stopPeriodicRefresh();
      stopClockUpdate();
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
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
            return;
          }
          const routeTo = {name: 'RadioStation', params: {id: row.id}};
          router.push(routeTo).catch((err) => {
            console.error('Navigation error:', err);
          });
        },
      };
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.info("No items selected for deletion.");
        return;
      }
      try {
        loading.value = true;
        await Promise.all(checkedRowKeys.value.map(id => store.deleteRadioStation(id.toString())));
        message.success(`Deleted ${checkedRowKeys.value.length} item(s) successfully`);
        checkedRowKeys.value = [];
        await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        message.error('Failed to delete items');
      } finally {
        loading.value = false;
      }
    };

    const columns = computed<DataTableColumns<RadioStation>>(() => {
      const baseColumns: DataTableColumns<RadioStation> = [
        {
          type: 'selection',
          fixed: 'left',
          width: 50
        },
        {
          title: 'Status',
          key: 'status',
          render: (row: RadioStation) => {
            const statusInfo = getStatusStyle(row.status);
            return h(NTag, {
              bordered: true,
              color: { textColor: statusInfo.color, borderColor: statusInfo.color }
            }, { default: () => statusInfo.text });
          }
        },
        {
          title: 'AI Control',
          key: 'aiControlAllowed',
          render: (row: RadioStation) => {
            return h('div', {
              style: `color: ${row.aiControlAllowed ? '#00aa00' : '#888888'}; font-weight: ${row.aiControlAllowed ? 'bold' : 'normal'};`
            }, row.aiControlAllowed ? 'Accepting' : 'Doesn\'t allow');
          }
        },
        {
          title: 'Schedule',
          key: 'scheduleEnabled',
          render: (row: RadioStation) => {
            return h('div', {
              style: `color: ${row.schedule?.enabled ? '#033b81' : '#888888'}; font-weight: ${row.schedule?.enabled ? 'bold' : 'normal'};`
            }, row.schedule?.enabled ? 'Enabled' : 'Disabled');
          }
        },
        {
          title: 'Slug name',
          key: 'slugName',
          render: (row: RadioStation) => {
            return h(NTag, { 
              bordered: true,
              color: row.color ? {  textColor: '#555', borderColor: row.color } : { textColor: '#555', borderColor: '#BBB' }
            }, { default: () => row.slugName });
          }
        },
        {title: 'Country', key: 'country'},
        {
          title: 'Timezone',
          key: 'timeZone',
          render: (row: RadioStation) => {
            const timeString = currentTime.value.toLocaleTimeString('en-US', {
              timeZone: row.timeZone,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
            return h('div', {}, [
              h('div', { style: 'font-weight: bold; font-size: 0.9rem;' }, timeString),
              h('div', { style: 'font-size: 0.75rem; color: #666;' }, row.timeZone)
            ]);
          }
        },
        {title: 'Managed By', key: 'managedBy'},
        {
          title: 'Bit Rate',
          key: 'bitRate',
          render: (row: RadioStation) => {
            return h('div', {}, row.bitRate ? `${(parseInt(row.bitRate) / 1000).toFixed(0)}k` : '-');
          }
        },
        {
          title: 'URL',
          key: 'mixplaUrl',
          render: (row: RadioStation) => {
            return h('div', {
              style: 'display: flex; align-items: center; cursor: pointer;',
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                if (row.mixplaUrl) {
                  handleCopyUrl(row.mixplaUrl);
                }
              },
              title: 'Click to copy URL'
            }, [
              h('span', {
                style: 'overflow: hidden; text-overflow: ellipsis;',
              }, row.mixplaUrl)
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
                  style: `color: ${row.aiControlAllowed ? '#df9710' : '#888888'}; font-size: 0.8rem;`
                }, `AI Control: ${row.aiControlAllowed ? 'Accepting' : 'Doesn\'t allow'}`),
                h('div', {
                  style: `color: ${row.schedule?.enabled ? '#033b81' : '#888888'}; font-size: 0.8rem;`
                }, `Schedule: ${row.schedule?.enabled ? 'Enabled' : 'Disabled'}`),
                h('div', {
                  style: 'font-size: 0.8rem; color: #666;'
                }, `Managed by: ${row.managedBy}`),
                h('div', {
                  style: 'cursor: pointer; font-size: 0.8rem;',
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                    if (row.mixplaUrl) {
                      handleCopyUrl(row.mixplaUrl);
                    }
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
      rowClassName: (row: RadioStation) => {
        if (row.aiControlAllowed) {
          return 'ai-accepting';
        }
        return 'ai-not-allowed';
      },
      isMobile,
      currentSongName,
      handleNewClick,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys,
      hasSelection,
      handleDelete
    };
  },
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}

:deep(.ai-accepting) {
  color: rgba(255, 140, 0, 1) !important;
}

:deep(.ai-not-allowed) {
  color: #888888 !important;
}
</style>