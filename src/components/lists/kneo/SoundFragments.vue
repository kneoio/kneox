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

    <n-gi :span="isMobile ? 1 : 6">
      <n-button-group>
        <n-button @click="handleNewClick" type="primary" size="large">New</n-button>
        <n-button
            type="error"
            :disabled="!hasSelection"
            @click="handleDelete"
            size="large"
        >
          Delete
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
  NCheckbox,
  NDataTable,
  NGi,
  NGrid,
  NPageHeader,
  useMessage
} from 'naive-ui';
import { useRouter } from 'vue-router';

import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import { useSoundFragmentStore } from "../../../stores/kneo/soundFragmentsStore";
import { SoundFragment } from "../../../types/kneoBroadcasterTypes";

export default defineComponent({
  name: 'SoundFragments',
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon },
  setup() {
    const router = useRouter();
    const store = useSoundFragmentStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const hasSelection = ref(false);
    const message = useMessage();

    watch(checkedRowKeys, (newVal) => {
      hasSelection.value = newVal ? newVal.length > 0 : false;
    }, { immediate: true, deep: true });

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
        }, 30000); // Refresh every 30 seconds
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
          width: 50,
          renderHeader: () => h(NCheckbox, {
            indeterminate: checkedRowKeys.value.length > 0 && checkedRowKeys.value.length < store.getEntries.length,
            checked: store.getEntries.length > 0 && checkedRowKeys.value.length === store.getEntries.length,
            onUpdateChecked: (checked: boolean) => {
              checkedRowKeys.value = checked ? store.getEntries.map(item => item.id) : [];
            }
          }),
          render: (rowData: SoundFragment) => {
            const key = rowData.id;

            if (key === undefined || key === null) {
              return h(NCheckbox, { disabled: true });
            }

            return h('div', {
              style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', pointerEvents: 'none' }
            }, [
              h(NCheckbox, {
                checked: checkedRowKeys.value.includes(key),
                onUpdateChecked: (newCheckedStatus: boolean) => {
                  const currentKeys = checkedRowKeys.value;
                  let newKeysArray;
                  if (newCheckedStatus) {
                    if (!currentKeys.includes(key)) {
                      newKeysArray = [...currentKeys, key];
                    } else {
                      newKeysArray = [...currentKeys];
                    }
                  } else {
                    newKeysArray = currentKeys.filter(k => k !== key);
                  }
                  checkedRowKeys.value = newKeysArray;
                },
                onClick: (e: MouseEvent) => {
                  e.stopPropagation();
                },
                style: { pointerEvents: 'auto' }
              })
            ]);
          }
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
          if (target.closest('.n-checkbox')) {
            return;
          }
          router.push({ name: 'SoundFragment', params: { id: row.id } });
        }
      };
    };

    const rowKey = (row: SoundFragment): string | number => {
      return row.id;
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