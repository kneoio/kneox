<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Available Listeners for {{ brandName }}</template>
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
import { computed, defineComponent, onMounted, ref, onUnmounted, watch } from 'vue';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NDataTable,
  NGi,
  NGrid,
  NIcon,
  NInput,
  NPageHeader,
  useMessage
} from 'naive-ui';
import { useRouter } from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import { useListenersStore } from '../../../stores/kneo/listenersStore';

export default defineComponent({
  name: 'AvailableListeners',
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, NIcon, NInput },
  props: {
    brandName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const store = useListenersStore();
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
        title: 'Localized Name', 
        key: 'listener.localizedName',
        render: (row: any) => {
          return row.listener?.localizedName?.en || 'N/A';
        }
      },
      { 
        title: 'Nickname', 
        key: 'listener.nickName',
        render: (row: any) => row.listener?.nickName?.en || 'N/A'
      },
      { 
        title: 'Country', 
        key: 'listener.country',
        render: (row: any) => row.listener?.country || 'N/A'
      },
      { 
        title: 'Registered', 
        key: 'listener.regDate',
        render: (row: any) => row.listener?.regDate || 'N/A'
      }
    ];



    const rowKey = (row: any): string => {
      return row.id || Math.random().toString();
    };

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchListeners(props.brandName);
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
        await store.fetchListeners(props.brandName, page, pageSize);
      } catch (error) {
        console.error('Failed to fetch available listeners:', error);
        message.error('Failed to load available listeners');
      } finally {
        loading.value = false;
      }
    };

    const handleSearch = () => {
      fetchData(1, store.getPagination.pageSize);
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
      router.push(`/outline/station/${props.brandName}/listeners/new`);
    };

    const getRowProps = (row: any) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
            return;
          }
          // Navigate to the EditListener route for brand-specific listeners
          const listenerId = row.listener?.id || row.id;
          
          if (!listenerId) {
            console.error('No listener ID found in row data');
            return;
          }
          
          router.push({ 
            name: 'EditListener', 
            params: { 
              brandName: props.brandName, 
              id: listenerId 
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
        await Promise.all(checkedRowKeys.value.map(id => store.deleteListener(id.toString())));
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
