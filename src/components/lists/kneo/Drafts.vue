<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Drafts</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-button-group>
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
import { Draft } from '../../../types/kneoBroadcasterTypes';
import { useDraftStore } from '../../../stores/kneo/draftStore';

export default defineComponent({
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, NTag },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const store = useDraftStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);

    const typeToTagType: Record<string, 'primary' | 'info' | 'success' | 'warning' | 'error' | undefined> = {
      INTRO_DRAFT: 'primary',
      MESSAGE_DRAFT: 'info',
      OUTRO_DRAFT: 'success',
      AD_DRAFT: 'warning',
      NEWS_DRAFT: 'error',
      EVENT_DRAFT: 'warning',
      // fallback synonyms
      NEWS: 'error',
      EVENT: 'warning'
    };
    const getTypeType = (t?: string) => (t ? (typeToTagType as any)[t] : undefined);

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchAll();
      } catch (error) {
        console.error('Failed to fetch initial Draft data:', error);
        message.error('Failed to load Drafts.');
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
            console.error('Periodic refresh of Drafts failed:', error);
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

    const rowKeyFn = (row: Draft) => row.id ?? `${row.draftType || 'type'}-${row.languageCode || 'lang'}-${(row.title || '').slice(0,20)}`;

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.warning('Please select Drafts to delete.');
        return;
      }
      message.error("Drafts can't be deleted.");
      return;
    };

    const getRowProps = (row: Draft) => {
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
          const routeTo = { name: 'DraftForm', params: { id: row.id } };
          router.push(routeTo).catch((err) => {
            console.error('Navigation error:', err);
          });
        },
      };
    };

    const columns = computed<DataTableColumns<Draft>>(() => {
      const baseColumns: DataTableColumns<Draft> = [
        { type: 'selection', fixed: 'left', width: 50 },
        { title: 'Lang', key: 'languageCode', width: 100 },
        { title: 'Title', key: 'title', width: 300 },
        {
          title: 'Content',
          key: 'content',
          ellipsis: { tooltip: true },
          render: (row: Draft) => {
            const maxLength = isMobile.value ? 60 : 140;
            const text = row.content || '';
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
                    .filter((item: Draft) => !!item.id)
                    .map((item: Draft) => item.id as string);
                }
              }
            })
          },
          {
            title: 'Draft',
            key: 'combined',
            render: (row: Draft) => {
              const maxLength = 100;
              const text = row.content || '';
              return h('div', {}, [
                h('div', { style: 'font-weight: bold; display: flex; align-items: center;' }, [
                  `${row.title || ''}`,
                  row.draftType ? h(NTag as any, { size: 'small', style: 'margin-left: 6px;', type: getTypeType(row.draftType) }, { default: () => row.draftType }) : null
                ]),
                h('div', { style: 'font-size: 0.8rem; margin: 4px 0;' }, text.length > maxLength ? text.substring(0, maxLength) + '...' : text),
                h('div', { style: 'font-size: 0.75rem; color: #666;' }, row.languageCode || '')
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
