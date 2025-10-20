<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Prompts</template>
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
import { computed, defineComponent, h, onMounted, onUnmounted, ref } from 'vue';
import { DataTableColumns, NButton, NButtonGroup, NCheckbox, NDataTable, NGi, NGrid, NPageHeader, useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import { BroadcastPrompt } from '../../../types/kneoBroadcasterTypes';
import { usePromptStore } from '../../../stores/kneo/promptStore';

export default defineComponent({
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const store = usePromptStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchAll();
      } catch (error) {
        console.error('Failed to fetch initial Prompt data:', error);
        message.error('Failed to load Prompts.');
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
            console.error('Periodic refresh of Prompts failed:', error);
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

    const hasSelection = computed(() => checkedRowKeys.value.length > 0);

    const handleNewClick = () => {
      router.push('/outline/prompts/new');
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.warning('Please select Prompts to delete.');
        return;
      }
      try {
        loading.value = true;
        const deletePromises = checkedRowKeys.value.map(id => store.deletePrompt(id as string));
        await Promise.all(deletePromises);
        message.success(`${checkedRowKeys.value.length} Prompt(s) deleted successfully.`);
        checkedRowKeys.value = [];
        await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        console.error('Failed to delete Prompts:', error);
        message.error('Failed to delete Prompts.');
      } finally {
        loading.value = false;
      }
    };

    const getRowProps = (row: BroadcastPrompt) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) return;
          const routeTo = { name: 'PromptForm', params: { id: row.id } };
          router.push(routeTo).catch((err) => {
            console.error('Navigation error:', err);
          });
        },
      };
    };

    const columns = computed<DataTableColumns<BroadcastPrompt>>(() => {
      const baseColumns: DataTableColumns<BroadcastPrompt> = [
        { type: 'selection', fixed: 'left', width: 50 },
        {
          title: 'Prompt',
          key: 'prompt',
          ellipsis: { tooltip: true },
          render: (row: BroadcastPrompt) => {
            const maxLength = isMobile.value ? 60 : 140;
            const text = row.prompt || '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
          }
        },
        { title: 'Type', key: 'promptType', width: 120 },
        { title: 'Lang', key: 'languageCode', width: 100 },
        { title: 'Enabled', key: 'enabled', width: 100, render: (r) => r.enabled ? 'Yes' : 'No' },
        { title: 'Master', key: 'isMaster', width: 100, render: (r) => r.isMaster ? 'Yes' : 'No' },
        { title: 'Locked', key: 'locked', width: 100, render: (r) => r.locked ? 'Yes' : 'No' },
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
                  checkedRowKeys.value = store.getEntries.map((item: BroadcastPrompt) => item.id);
                }
              }
            })
          },
          {
            title: 'Prompt',
            key: 'combined',
            render: (row: BroadcastPrompt) => {
              const maxLength = 100;
              const text = row.prompt || '';
              return h('div', {}, [
                h('div', { style: 'font-weight: bold;' }, `${row.languageCode || ''} ${row.promptType || ''}`.trim()),
                h('div', { style: 'font-size: 0.8rem;' }, text.length > maxLength ? text.substring(0, maxLength) + '...' : text),
                h('div', { style: 'font-size: 0.8rem;' }, `Enabled: ${row.enabled ? 'Yes' : 'No'}, Master: ${row.isMaster ? 'Yes' : 'No'}`)
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
      rowKey: (row: BroadcastPrompt) => row.id,
      isMobile,
      handleNewClick,
      handleDelete,
      hasSelection,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys
    };
  },
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>
