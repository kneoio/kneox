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

    <n-gi :span="isMobile ? 1 : 6" class="flex items-center flex-wrap gap-2">
      <n-button-group class="mr-4">
        <n-button @click="handleNewClick" type="primary" :size="isMobile ? 'medium' : 'large'">New</n-button>
        <n-button
          type="error"
          :disabled="!hasSelection"
          @click="handleDelete"
          :size="isMobile ? 'medium' : 'large'"
        >
          Delete ({{ checkedRowKeys.length }})
        </n-button>
      </n-button-group>

      <n-button @click="toggleFilters" type="default" :size="isMobile ? 'medium' : 'large'" class="mr-4">
        Filter
      </n-button>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-collapse-transition :show="showFilters">
        <div :style="{ width: isMobile ? '100%' : '50%' }">
          <n-space size="small" align="center">
            <n-select v-model:value="filters.languageCode" :options="langOptions" filterable
              placeholder="Language" clearable style="width: 200px;" />
            <n-checkbox v-model:checked="filters.enabled">Enabled</n-checkbox>
            <n-checkbox v-model:checked="filters.isMaster">Master</n-checkbox>
            <n-checkbox v-model:checked="filters.locked">Locked</n-checkbox>
            <n-checkbox v-model:checked="filters.archived">Archived</n-checkbox>
          </n-space>
        </div>
      </n-collapse-transition>
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
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { DataTableColumns, NButton, NButtonGroup, NCheckbox, NDataTable, NGi, NGrid, NPageHeader, NTag, NFormItem, NSelect, NSpace, NCollapseTransition, useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import { Draft } from '../../../types/kneoBroadcasterTypes';
import { useDraftStore } from '../../../stores/kneo/draftStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';

export default defineComponent({
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, NTag, NFormItem, NSelect, NSpace, NCollapseTransition, NCheckbox },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const store = useDraftStore();
    const referencesStore = useReferencesStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const STORAGE_KEY = 'drafts.list.filters';
    const STORAGE_SHOW_KEY = 'drafts.list.showFilters';
    const showFilters = ref(false);
    const filters = ref({
      languageCode: undefined as string | undefined,
      archived: false,
      enabled: false,
      isMaster: false,
      locked: false
    });

    const loadSavedFilters = () => {
      try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) {
          const obj = JSON.parse(s);
          filters.value = {
            languageCode: obj.languageCode,
            archived: !!obj.archived,
            enabled: !!obj.enabled,
            isMaster: !!obj.isMaster,
            locked: !!obj.locked
          };
        }
        const sh = localStorage.getItem(STORAGE_SHOW_KEY);
        if (sh === 'true') showFilters.value = true;
      } catch {}
    };

    const saveFilters = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters.value));
        localStorage.setItem(STORAGE_SHOW_KEY, String(showFilters.value));
      } catch {}
    };

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

    const langOptions = computed(() => (referencesStore as any).languageOptions || []);

    const fetchData = async (page = 1, pageSize = 10) => {
      try {
        loading.value = true;
        let activeFilters: any = {};
        if (showFilters.value) {
          const hasFilters = filters.value.languageCode || 
                            filters.value.archived || 
                            filters.value.enabled || 
                            filters.value.isMaster || 
                            filters.value.locked;
          if (hasFilters) {
            activeFilters = {
              languageCode: filters.value.languageCode || undefined,
              archived: filters.value.archived ? 1 : undefined,
              enabled: filters.value.enabled || undefined,
              master: filters.value.isMaster || undefined,
              locked: filters.value.locked || undefined,
              activated: true
            };
            // Remove undefined values
            Object.keys(activeFilters).forEach(key => {
              if (activeFilters[key] === undefined) {
                delete activeFilters[key];
              }
            });
          }
        }
        await store.fetchAll(page, pageSize, activeFilters);
      } catch (error) {
        console.error('Failed to fetch Draft data:', error);
        message.error('Failed to load Drafts.');
      } finally {
        loading.value = false;
      }
    };

    async function preFetch() {
      try {
        loading.value = true;
        loadSavedFilters();
        await (referencesStore as any).fetchLanguages?.();
        await fetchData(1, store.getPagination.pageSize);
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
            await fetchData(store.getPagination.page, store.getPagination.pageSize);
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

    const toggleFilters = () => {
      showFilters.value = !showFilters.value;
      saveFilters();
      fetchData(1, store.getPagination.pageSize);
    };

    const clearFilters = () => {
      filters.value = {
        languageCode: undefined,
        archived: false,
        enabled: false,
        isMaster: false,
        locked: false
      };
      applyFilters();
    };

    const applyFilters = () => {
      fetchData(1, store.getPagination.pageSize);
    };

    watch(() => filters.value, () => {
      saveFilters();
      if (showFilters.value) {
        fetchData(1, store.getPagination.pageSize);
      }
    }, { deep: true });

    watch(showFilters, () => {
      saveFilters();
    });

    const handlePageChange = async (page: number) => {
      await fetchData(page, store.getPagination.pageSize);
      checkedRowKeys.value = [];
    };

    const handlePageSizeChange = async (pageSize: number) => {
      await fetchData(1, pageSize);
      checkedRowKeys.value = [];
    };

    const hasSelection = computed(() => checkedRowKeys.value.length > 0);

    const rowKeyFn = (row: Draft) => row.id ?? `${row.draftType || 'type'}-${row.languageCode || 'lang'}-${(row.title || '').slice(0,20)}`;

    const handleNewClick = () => {
      router.push({ name: 'DraftForm', params: { id: 'new' } });
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.warning('Please select Drafts to delete.');
        return;
      }
      try {
        loading.value = true;
        const deletePromises = checkedRowKeys.value.map(id => store.deleteDraft(id as string));
        await Promise.all(deletePromises);
        message.success(`${checkedRowKeys.value.length} Draft(s) deleted successfully.`);
        checkedRowKeys.value = [];
      } catch (error: any) {
        const data = error?.response?.data;
        if (data) {
          message.error(typeof data === 'string' ? data : JSON.stringify(data));
        } else {
          message.error(String(error));
        }
      } finally {
        loading.value = false;
      }
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
        { title: 'Ver', key: 'version', width: 90 },
        { title: 'Title', key: 'title', width: 300 },
        {
          title: 'Flags', key: 'flags', width: 220,
          render: (row: Draft) => {
            const tags: any[] = [];
            if (row.enabled) tags.push(h(NTag as any, { type: 'info', size: 'small', style: 'margin-right: 6px;' }, { default: () => 'ENABLED' }));
            if ((row as any).isMaster || (row as any).master) tags.push(h(NTag as any, { type: 'success', size: 'small', style: 'margin-right: 6px;' }, { default: () => 'MASTER' }));
            if (row.locked) tags.push(h(NTag as any, { type: 'error', size: 'small' }, { default: () => 'LOCKED' }));
            return h('div', { style: 'display: flex; align-items: center;' }, tags);
          }
        },
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
      handleNewClick,
      handleDelete,
      hasSelection,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys,
      showFilters,
      filters,
      toggleFilters,
      clearFilters,
      applyFilters,
      langOptions
    };
  },
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>
