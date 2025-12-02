<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Available Scripts for {{ brandName }}</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6" class="flex items-center">
      <n-button-group class="mr-4">
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
          :loading="loading"
          :row-props="getRowProps"
          v-model:checked-row-keys="checkedRowKeys"
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
import { computed, defineComponent, h, onMounted, ref, onUnmounted, watch } from 'vue';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NDataTable,
  NGi,
  NGrid,
  NPageHeader,
  NTag,
  useMessage
} from 'naive-ui';
import { useRouter } from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import { useScriptStore } from '../../../stores/kneo/scriptStore';

export default defineComponent({
  name: 'AvailableScripts',
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, NTag },
  props: {
    brandName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const store = useScriptStore();
    const router = useRouter();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const hasSelection = computed(() => checkedRowKeys.value.length > 0);
    const message = useMessage();

    const columns: DataTableColumns<any> = [
      { type: 'selection' },
      { 
        title: 'Name', 
        key: 'script.name',
        render: (row: any) => row.script?.name || 'N/A'
      },
      {
        title: 'Flags',
        key: 'script.accessLevel',
        render: (row: any) => {
          const isPublic = row.script?.accessLevel === 1;
          return isPublic
            ? h(NTag, { type: 'success', size: 'small' }, { default: () => 'Public' })
            : null;
        }
      },
      { 
        title: 'Description', 
        key: 'script.description',
        render: (row: any) => row.script?.description || ''
      },
      { 
        title: 'Registered', 
        key: 'script.regDate',
        render: (row: any) => row.script?.regDate || 'N/A'
      }
    ];

    const rowKey = (row: any): string => {
      return row.id || Math.random().toString();
    };

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchAvailableScripts(props.brandName);
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
            await fetchData(store.getPagination.page, store.getPagination.pageSize);
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

    const handleResize = () => {
      isMobile.value = window.innerWidth < 768;
    };

    const fetchData = async (page = store.getPagination.page, pageSize = store.getPagination.pageSize) => {
      try {
        loading.value = true;
        await store.fetchAvailableScripts(props.brandName, page, pageSize);
      } catch (error) {
        console.error('Failed to fetch available scripts:', error);
        message.error('Failed to load available scripts');
      } finally {
        loading.value = false;
      }
    };

    preFetch();
    startPeriodicRefresh();

    const handlePageChange = async (page: number) => {
      await fetchData(page, store.getPagination.pageSize);
      checkedRowKeys.value = [];
    };

    const handlePageSizeChange = async (pageSize: number) => {
      await fetchData(1, pageSize);
      checkedRowKeys.value = [];
    };

    const handleNewClick = () => {
      router.push('/outline/scripts/new');
    };

    const getRowProps = (row: any) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
            return;
          }
          const scriptId = row.script?.id || row.id;
          
          if (!scriptId) {
            console.error('No script ID found in row data');
            return;
          }
          
          router.push({ 
            name: 'ScriptForm', 
            params: { 
              id: scriptId 
            } 
          });
        }
      };
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.info("No items selected for deletion.");
        return;
      }
      try {
        loading.value = true;
        await Promise.all(checkedRowKeys.value.map(id => store.deleteScript(id.toString())));
        message.success(`Deleted ${checkedRowKeys.value.length} item(s) successfully`);
        checkedRowKeys.value = [];
        await fetchData(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        message.error('Failed to delete items');
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      stopPeriodicRefresh();
      window.removeEventListener('resize', handleResize);
    });

    watch(() => props.brandName, () => {
      fetchData();
    }, { immediate: true });

    return {
      store,
      columns,
      rowKey,
      isMobile,
      handleNewClick,
      handleDelete,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys,
      hasSelection
    };
  }
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>
