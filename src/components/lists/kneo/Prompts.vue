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
import { DataTableColumns, NButton, NButtonGroup, NCheckbox, NDataTable, NGi, NGrid, NPageHeader, NTag, useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import { BroadcastPrompt } from '../../../types/kneoBroadcasterTypes';
import { usePromptStore } from '../../../stores/kneo/promptStore';

export default defineComponent({
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, NTag },
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

    const rowKeyFn = (row: BroadcastPrompt) => row.id ?? `${row.promptType || 'type'}-${row.languageCode || 'lang'}-${(row.prompt || '').slice(0,20)}`;

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
          if (
            target.closest('.n-checkbox') ||
            target.closest('[data-n-checkbox]') ||
            target.closest('.n-data-table-expand-trigger')
          ) {
            return;
          }
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
        { title: 'Type', key: 'promptType', width: 120, render: (r) => h(NTag as any, { size: 'small' }, { default: () => r.promptType || '' }) },
        { title: 'Lang', key: 'languageCode', width: 100 },
        {
          title: 'Flags',
          key: 'flags',
          width: 220,
          render: (r: BroadcastPrompt) => {
            const tags: any[] = [];
            if (r.enabled) tags.push(h(NTag as any, { type: 'info', size: 'small', style: 'margin-right: 6px;' }, { default: () => 'ENABLED' }));
            if (r.master) tags.push(h(NTag as any, { type: 'success', size: 'small', style: 'margin-right: 6px;' }, { default: () => 'MASTER' }));
            if (r.locked) tags.push(h(NTag as any, { type: 'error', size: 'small' }, { default: () => 'LOCKED' }));
            return h('div', { style: 'display: flex; align-items: center;' }, tags);
          }
        },
        { title: 'Title', key: 'title', width: 300 },
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
                  checkedRowKeys.value = store.getEntries
                    .filter((item: BroadcastPrompt) => !!item.id)
                    .map((item: BroadcastPrompt) => item.id as string);
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
                h('div', { style: 'font-weight: bold; display: flex; align-items: center;' }, [
                  `${row.languageCode || ''}`,
                  row.promptType ? h(NTag as any, { size: 'small', style: 'margin-left: 6px;' }, { default: () => row.promptType }) : null
                ]),
                h('div', { style: 'font-size: 0.8rem; margin: 4px 0;' }, text.length > maxLength ? text.substring(0, maxLength) + '...' : text),
                h('div', { style: 'display: flex; align-items: center;' }, [
                  row.enabled ? h(NTag as any, { type: 'info', size: 'small', style: 'margin-right: 6px;' }, { default: () => 'ENABLED' }) : null,
                  row.master ? h(NTag as any, { type: 'success', size: 'small', style: 'margin-right: 6px;' }, { default: () => 'MASTER' }) : null,
                  row.locked ? h(NTag as any, { type: 'error', size: 'small' }, { default: () => 'LOCKED' }) : null,
                ])
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
      rowKey: rowKeyFn,
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
