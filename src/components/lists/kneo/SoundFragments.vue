<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Sound Fragments</template>
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
          :row-props="getRowProps"
          :loading="loading"
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

import { SoundFragment } from "../../../types/kneoBroadcasterTypes";
import { useSoundFragmentStore } from '../../../stores/kneo/soundFragmentStore';

export default defineComponent({
  name: 'SoundFragments',
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, NIcon, NInput },
  setup() {
    const router = useRouter();
    const store = useSoundFragmentStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const hasSelection = computed(() => checkedRowKeys.value.length > 0);
    const message = useMessage();
    const searchQuery = ref('');
    const debounceTimer = ref<number | null>(null);

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

    preFetch();
    startPeriodicRefresh();

    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      stopPeriodicRefresh();
      window.removeEventListener('resize', handleResize);
    });

    const columns = computed<DataTableColumns<SoundFragment>>(() => {
      const baseColumns: DataTableColumns<SoundFragment> = [
        {
          type: 'selection',
          fixed: 'left',
          width: 50
        },
        { title: 'Title', key: 'title' },
        { title: 'Artist', key: 'artist' },
        { title: 'Genre', key: 'genre' },
        { title: 'Source', key: 'source' }
      ];

      if (!isMobile.value) {
        baseColumns.push({ title: 'Type', key: 'type' });
      }
      return baseColumns;
    });

    const getRowProps = (row: SoundFragment) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
            return;
          }
          router.push({ name: 'SoundFragment', params: { id: row.id } });
        }
      };
    };

    const rowKey = (row: SoundFragment): string | number => {
      return row.id;
    };

    const fetchData = async (page = store.getPagination.page, pageSize = store.getPagination.pageSize) => {
      try {
        loading.value = true;
        await store.fetchAll(page, pageSize, searchQuery.value);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        message.error('Failed to load sound fragments');
      } finally {
        loading.value = false;
      }
    };

    const handleSearch = () => {
      // Reset to first page when searching
      fetchData(1, store.getPagination.pageSize);
    };

    // Debounce search input
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

    const handlePageChange = async (page: number) => {
      await fetchData(page, store.getPagination.pageSize);
      checkedRowKeys.value = [];
    };

    const handlePageSizeChange = async (pageSize: number) => {
      await fetchData(1, pageSize);
      checkedRowKeys.value = [];
    };

    const handleNewClick = () => {
      router.push('/outline/soundfragments/new');
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
        await fetchData(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        message.error('Failed to delete items');
        // console.error('Delete error:', error);
      } finally {
        loading.value = false;
      }
    };

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

:deep(.n-base-selection) {
  min-width: 200px;
}
</style>