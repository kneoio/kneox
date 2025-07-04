<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>{{ brandName ? `Listeners for ${brandName}` : 'All Listeners' }}</template>
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

      <n-input
          v-model:value="searchQuery"
          placeholder="Search..."
          clearable
          size="large"
          style="width: 250px"
          @keydown.enter="handleSearch"
          @clear="handleSearch"
      >
        <template #suffix>
          <n-button text @click="handleSearch">
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </n-icon>
          </n-button>
        </template>
      </n-input>
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
import { ListenerEntry } from "../../../types/kneoBroadcasterTypes";
import { useListenersStore } from '../../../stores/kneo/listenersStore';

export default defineComponent({
  name: 'Listeners',
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, NIcon, NInput },
  props: {
    brandName: {
      type: String,
      required: false,
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
    const searchQuery = ref('');
    const debounceTimer = ref<number | null>(null);

    const columns: DataTableColumns<ListenerEntry> = [
      { type: 'selection' },
      { title: 'Localized Name', key: 'localizedName.en' },
      { title: 'Nickname', key: 'nickName.en' },
      { title: 'Country', key: 'country' },
      { title: 'Registered', key: 'regDate' }
    ];

    const rowKey = (row: ListenerEntry): string => {
      return row.id;
    };

    async function preFetch() {
      try {
        loading.value = true;
        if (props.brandName) {
          await store.fetchListeners(props.brandName);
        } else {
          await store.fetchAllListeners();
        }
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
        if (props.brandName) {
          await store.fetchListeners(props.brandName, page, pageSize);
        } else {
          await store.fetchAllListeners(page, pageSize);
        }
      } catch (error) {
        console.error('Failed to fetch listeners:', error);
        message.error('Failed to load listeners');
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
      router.push('/outline/listeners/new');
    };

    const getRowProps = (row: ListenerEntry) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
            return;
          }
          router.push({ name: 'Listener', params: { id: row.id } });
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

    watch(searchQuery, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        if (debounceTimer.value) {
          clearTimeout(debounceTimer.value);
        }
        debounceTimer.value = window.setTimeout(() => {
          handleSearch();
        }, 500);
      }
    });

    watch(() => props.brandName, () => {
      fetchData();
    }, { immediate: true });

    return {
      store,
      columns,
      rowKey,
      isMobile,
      searchQuery,
      handleSearch,
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