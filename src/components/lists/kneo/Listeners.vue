<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>All Listeners</template>
        <template #footer>
          Total: {{ listenersStore.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; margin-top: 12px; overflow-x: auto;">
        <n-button-group>
          <n-button @click="handleNewClick" type="primary" :size="isMobile ? 'medium' : 'large'">New</n-button>
          <n-button type="error" :disabled="!hasSelection" @click="handleDelete" :size="isMobile ? 'medium' : 'large'">
            Delete ({{ checkedRowKeys.length }})
          </n-button>
          <n-button @click="resetFilters" type="default" :size="isMobile ? 'medium' : 'large'" :disabled="!hasActiveFilters">
            <red-led :active="hasActiveFilters" style="margin-right: 8px;" />
            Reset
          </n-button>
        </n-button-group>
        
        <n-input 
          v-model:value="filters.searchTerm" 
          placeholder="Search..." 
          clearable
          @update:value="onSearchChange"
          style="width: 200px;"
          :size="isMobile ? 'medium' : 'large'"
        />
      </div>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 4">
      <div v-if="filterSummary" class="filter-summary">
        {{ filterSummary }}
      </div>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-data-table
          remote
          :columns="columns"
          :row-key="rowKey"
          :data="listenersStore.getEntries"
          :pagination="listenersStore.getPagination"
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
  NFormItem,
  NSelect,
  useMessage
} from 'naive-ui';
import { useRouter } from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import RedLed from '../../common/RedLed.vue';
import { ListenerEntry } from "../../../types/kneoBroadcasterTypes";
import { useListenersStore } from '../../../stores/kneo/listenersStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';

export default defineComponent({
  name: 'Listeners',
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, RedLed, NIcon, NInput, NFormItem, NSelect },
  props: {
    brandName: {
      type: String,
      required: false,
    },
  },
  setup(props) {
    const listenersStore = useListenersStore();
    const referencesStore = useReferencesStore();
    const router = useRouter();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const hasSelection = computed(() => checkedRowKeys.value.length > 0);
    const hasActiveFilters = computed(() => !!(filters.value.searchTerm));
    const message = useMessage();
    const STORAGE_KEY = 'listeners.list.filters';
    const filters = ref({
      searchTerm: ''
    });

    const columns: DataTableColumns<ListenerEntry> = [
      { type: 'selection' },
      { title: 'Name', key: 'localizedName.en' },
      { 
        title: 'Nickname', 
        key: 'nickName',
        render: (row) => {
          const nicknames = row.nickName || {};
          const allNicknames = Object.values(nicknames).flat();
          return allNicknames.length > 0 ? allNicknames.join(', ') : 'N/A';
        }
      },
      { title: 'User ID', key: 'userId' },
      { 
        title: 'User Data', 
        key: 'userData',
        width: 300,
        render: (row: any) => {
          const userData = row.userData;
          if (!userData || typeof userData !== 'object') return 'N/A';
          
          const entries = Object.entries(userData);
          if (entries.length === 0) return 'N/A';
          
          const limitedEntries = entries.slice(0, 5);
          const pairs = limitedEntries.map(([key, value]) => `${key}: ${value}`);
          
          if (entries.length > 5) {
            pairs.push('...');
          }
          
          return pairs.join(', ');
        }
      },
      { title: 'Registered', key: 'regDate' }
    ];

    const rowKey = (row: ListenerEntry): string => {
      return row.id;
    };

    const loadSavedFilters = () => {
      try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) {
          const obj = JSON.parse(s);
          filters.value = {
            searchTerm: obj.searchTerm || ''
          };
        }
      } catch {}
    };

    const saveFilters = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters.value));
      } catch {}
    };

    async function preFetch() {
      try {
        loading.value = true;
        loadSavedFilters();
        if (props.brandName) {
          await listenersStore.fetchListeners(props.brandName);
        } else {
          await listenersStore.fetchAllListeners();
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
            await fetchData(listenersStore.getPagination.page, listenersStore.getPagination.pageSize);
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

    const fetchData = async (page = 1, pageSize = 10) => {
      try {
        loading.value = true;
        let activeFilters = {};
        const hasSearchTerm = filters.value.searchTerm;
        if (hasSearchTerm) {
          activeFilters = filters.value;
        }
        if (props.brandName) {
          await listenersStore.fetchListeners(props.brandName, page, pageSize);
        } else {
          await listenersStore.fetchAllListeners(page, pageSize, filters.value.searchTerm, activeFilters);
        }
      } catch (error) {
        console.error('Failed to fetch listeners:', error);
        message.error('Failed to load listeners');
      } finally {
        loading.value = false;
      }
    };

    const filterSummary = computed(() => {
      const parts: string[] = [];
      if (filters.value.searchTerm) {
        parts.push(`Search: "${filters.value.searchTerm}"`);
      }
      return parts.join(' | ');
    });

    const resetFilters = () => {
      filters.value = {
        searchTerm: ''
      };
      saveFilters();
      fetchData(1, listenersStore.getPagination.pageSize);
    };

    const onSearchChange = () => {
      saveFilters();
      fetchData(1, listenersStore.getPagination.pageSize);
    };

    preFetch();
    startPeriodicRefresh();

    const handlePageChange = async (page: number) => {
      await fetchData(page, listenersStore.getPagination.pageSize);
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
        await Promise.all(checkedRowKeys.value.map(id => listenersStore.deleteListener(id.toString())));
        message.success(`Deleted ${checkedRowKeys.value.length} item(s) successfully`);
        checkedRowKeys.value = [];
        await fetchData(listenersStore.getPagination.page, listenersStore.getPagination.pageSize);
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
      listenersStore,
      referencesStore,
      columns,
      rowKey,
      fetchData,
      isMobile,
      handleNewClick,
      handleDelete,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys,
      hasSelection,
      hasActiveFilters,
      filters,
      filterSummary,
      resetFilters,
      onSearchChange
    };
  }
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
.filter-summary {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}
</style>