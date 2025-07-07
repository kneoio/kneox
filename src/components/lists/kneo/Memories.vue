<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Memories</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6" class="flex items-center">
      <n-button-group class="mr-4">
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
import {computed, defineComponent, h, onMounted, onUnmounted, ref} from 'vue';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NDataTable,
  NGi,
  NGrid,
  NPageHeader,
  NTag,
  NCode,
  useMessage
} from 'naive-ui';
import {useRouter} from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import {Memory} from "../../../types/kneoBroadcasterTypes";
import {useMemoryStore} from "../../../stores/kneo/memoryStore";

export default defineComponent({
  components: {NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon},
  setup() {
    const router = useRouter();
    const store = useMemoryStore();
    const message = useMessage();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
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
    });

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



    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.info("No items selected for deletion.");
        return;
      }
      try {
        loading.value = true;
        await Promise.all(checkedRowKeys.value.map(id => store.delete(id.toString())));
        message.success(`Deleted ${checkedRowKeys.value.length} item(s) successfully`);
        checkedRowKeys.value = [];
        await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        message.error('Failed to delete items');
      } finally {
        loading.value = false;
      }
    };

    const getRowProps = (row: Memory) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
            return;
          }
          const routeTo = {name: 'MemoryForm', params: {id: row.id}}; 
          router.push(routeTo).catch((err) => {
            console.error('Navigation error:', err);
          });
        },
      };
    };

    const columns = computed<DataTableColumns<Memory>>(() => {
      const baseColumns: DataTableColumns<Memory> = [
        {
          type: 'selection',
          fixed: 'left',
          width: 50
        },
        {
          title: 'Brand',
          key: 'brand',
          render: (row: Memory) => h(NTag, { type: 'info', bordered: false }, { default: () => row.brand })
        },
        {
          title: 'Memory Type',
          key: 'memoryType',
          render: (row: Memory) => {
            let tagType: 'success' | 'warning' | 'default' = 'default';
            if (row.memoryType === 'LISTENERS') tagType = 'success';
            if (row.memoryType === 'AUDIENCE_CONTEXT') tagType = 'warning';
            return h(NTag, { type: tagType, bordered: false }, { default: () => row.memoryType });
          }
        },
        {
          title: 'Content',
          key: 'content',
          render: (row: Memory) => {
            return h(NCode, { code: JSON.stringify(row.content).substring(0, 100) + '...', language: 'json' });
          }
        },
        {
          title: 'Created Date',
          key: 'regDate',
          render: (row: Memory) => new Date(row.regDate).toLocaleString()
        },
        {
          title: 'Last  Updated Date',
          key: 'lastModDate',
          render: (row: Memory) => new Date(row.lastModifiedDate).toLocaleString()
        }
      ];

      if (isMobile.value) {
        return [
          {
            type: 'selection',
            fixed: 'left',
            width: 50,
          },
          {
            title: 'Memory',
            key: 'combined',
            render: (row: Memory) => {
              return h('div', {}, [
                h('div', { style: 'font-weight: bold;' }, `Brand: ${row.brand}`),
                h('div', {style: 'font-size: 0.9rem;'}, `Type: ${row.memoryType}`),
                h('div', {
                  style: 'font-size: 0.8rem; color: #888;'
                }, `Created: ${new Date(row.regDate).toLocaleDateString()}`)
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
      rowKey: (row: Memory) => row.id,
      isMobile,
      handleDelete,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys,
      hasSelection
    };
  },
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>