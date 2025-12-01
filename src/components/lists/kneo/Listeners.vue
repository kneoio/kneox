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

      <n-button @click="toggleFilters" type="default" size="large" class="mr-4">
        <red-led :active="hasActiveFilters" style="margin-right: 8px;" />
        Filter
      </n-button>

      <n-input
          v-model:value="searchQuery"
          placeholder="Search..."
          clearable
          size="large"
          style="width: 250px"
          @keydown.enter="handleSearch"
          @clear="handleSearch"
      />
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-collapse-transition :show="showFilters">
        <div style="width: 50%;">
          <n-grid :cols="1" x-gap="12" y-gap="0">
            <n-gi>
              <n-form-item label="Country" size="small" :show-feedback="false">
                <n-select
                    v-model:value="filters.country"
                    :options="referencesStore.countryOptions"
                    placeholder="Select country"
                    clearable
                />
              </n-form-item>
            </n-gi>
          </n-grid>
        </div>
      </n-collapse-transition>
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
  NCollapseTransition,
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
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, RedLed, NIcon, NInput, NCollapseTransition, NFormItem, NSelect },
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
    const message = useMessage();
    const searchQuery = ref('');
    const debounceTimer = ref<number | null>(null);
    const showFilters = ref(false);
    const filters = ref({
      country: undefined
    });

    const hasActiveFilters = computed(() => !!(filters.value.country || searchQuery.value));

    const columns: DataTableColumns<ListenerEntry> = [
      { type: 'selection' },
      { title: 'Name', key: 'localizedName.en' },
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

    const fetchData = async (page = listenersStore.getPagination.page, pageSize = listenersStore.getPagination.pageSize) => {
      try {
        loading.value = true;
        let activeFilters = {};
        if (showFilters.value) {
          const hasFilters = filters.value.country;
          if (hasFilters) {
            activeFilters = filters.value;
          } else {
            return;
          }
        }
        if (props.brandName) {
          await listenersStore.fetchListeners(props.brandName, page, pageSize);
        } else {
          await listenersStore.fetchAllListeners(page, pageSize, searchQuery.value, activeFilters);
        }
      } catch (error) {
        console.error('Failed to fetch listeners:', error);
        message.error('Failed to load listeners');
      } finally {
        loading.value = false;
      }
    };

    const handleSearch = () => {
      fetchData(1, listenersStore.getPagination.pageSize);
    };

    const toggleFilters = () => {
      showFilters.value = !showFilters.value;
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

    watch(() => filters.value.country, () => {
      if (showFilters.value) {
        fetchData(1, listenersStore.getPagination.pageSize);
      }
    });

    watch(() => props.brandName, () => {
      fetchData();
    }, { immediate: true });

    return {
      listenersStore,
      referencesStore,
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
      hasSelection,
      hasActiveFilters,
      toggleFilters,
      showFilters,
      filters
    };
  }
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>