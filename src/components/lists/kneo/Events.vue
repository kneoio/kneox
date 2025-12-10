<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>All Events</template>
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
          :data="store.getEntries"
          :loading="loading"
          :pagination="paginationReactive"
          :row-key="rowKey"
          :row-props="getRowProps"
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

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import {
  NGrid, NGi, NPageHeader, NButton, NButtonGroup, NInput, NIcon,
  NDataTable, NTag, type DataTableColumns
} from 'naive-ui';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import { useEventsStore } from '../../../stores/kneo/eventsStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import type { Event } from "../../../types/kneoBroadcasterTypes";

const router = useRouter();
const message = useMessage();
const store = useEventsStore();
const referencesStore = useReferencesStore();

const loading = ref(false);
const searchQuery = ref('');
const checkedRowKeys = ref<string[]>([]);
const isMobile = ref(window.innerWidth < 768);

const hasSelection = computed(() => checkedRowKeys.value.length > 0);

const labelMap = computed(() => new Map(referencesStore.labelOptions.map(opt => [opt.value, opt.label])));

const resolveLabelNames = (labelUuids: string[]): string => {
  if (!Array.isArray(labelUuids) || labelUuids.length === 0) return '';
  return labelUuids.map(uuid => labelMap.value.get(uuid) || uuid).join(', ');
};

const getRowProps = (row: Event) => {
  return {
    style: 'cursor: pointer;',
    onClick: (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
        return;
      }
      router.push({ name: 'EventForm', params: { id: row.id } });
    }
  };
};

const columns: DataTableColumns<Event> = [
  {
    type: 'selection'
  },
  {
    title: 'Brand',
    key: 'brand',
    width: 200
  },
  {
    title: 'Type',
    key: 'type',
    width: 120,
    render: (row: Event) => {
      const typeOption = referencesStore.eventTypeOptions.find(opt => opt.value === row.type);
      return typeOption ? typeOption.label : row.type;
    }
  },


  {
    title: 'Priority',
    key: 'priority',
    width: 120,
    render: (row: Event) => {
      return h(NTag, { 
        bordered: true,
        color: { textColor: '#555', borderColor: '#BBB' }
      }, { default: () => row.priority });
    }
  },
  {
    title: 'Description',
    key: 'description',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Source',
    key: 'sourcing',
    width: 100,
    render: (row: Event) => {
      const sourcing = row.stagePlaylist?.sourcing;
      if (!sourcing) return '';
      const labels: Record<string, string> = {
        'RANDOM': 'Random',
        'STATIC_LIST': 'Static List',
        'QUERY': 'Query'
      };
      return labels[sourcing] || sourcing;
    }
  },
  {
    title: 'Labels',
    key: 'labels',
    width: 200,
    render: (row: Event) => {
      return resolveLabelNames(row.stagePlaylist?.labels || []);
    }
  },

];

const paginationReactive = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageCount: 1,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 40],
  onChange: (page: number) => {
    paginationReactive.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    paginationReactive.pageSize = pageSize;
    paginationReactive.page = 1;
  }
});

const rowKey = (row: Event) => row.id;

const loadData = async () => {
  loading.value = true;
  try {
    await store.fetchEvents(paginationReactive.page, paginationReactive.pageSize);
    const pagination = store.getPagination;
    paginationReactive.page = pagination.page;
    paginationReactive.pageSize = pagination.pageSize;
    paginationReactive.itemCount = pagination.itemCount;
    paginationReactive.pageCount = pagination.pageCount;
  } catch (error) {
    console.error('Error loading events:', error);
    message.error('Failed to load events');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  paginationReactive.page = page;
  loadData();
};

const handlePageSizeChange = (pageSize: number) => {
  paginationReactive.pageSize = pageSize;
  paginationReactive.page = 1;
  loadData();
};

const handleNewClick = () => {
  router.push({ name: 'EventForm', params: { id: 'new' } });
};

const handleSearch = () => {
  loadData();
};

const handleDelete = async () => {
  if (checkedRowKeys.value.length === 0) {
    message.info("No items selected for deletion.");
    return;
  }
  try {
    loading.value = true;
    await Promise.all(checkedRowKeys.value.map(id => store.deleteEvent(id.toString())));
    message.success(`Deleted ${checkedRowKeys.value.length} item(s) successfully`);
    checkedRowKeys.value = [];
    await loadData();
  } catch (error) {
    message.error('Failed to delete items');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await referencesStore.fetchLabels();
  loadData();
});

</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>
