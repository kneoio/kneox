<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Scenes</template>
        <template #footer>
          <div style="display:flex; gap:12px; align-items:center;">
            <span>Total: {{ store.getPagination.itemCount }}</span>
          </div>
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-button-group>
        <n-button @click="handleNewClick" type="primary" size="large" :disabled="!selectedScriptId">New</n-button>
        <n-button type="error" :disabled="!hasSelection" @click="handleDelete" size="large">
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
          <loader-icon />
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
import { ScriptScene } from '../../../types/kneoBroadcasterTypes';
import { useScriptSceneStore } from '../../../stores/kneo/scriptSceneStore';
import { useScriptStore } from '../../../stores/kneo/scriptStore';

export default defineComponent({
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const store = useScriptSceneStore();
    const scriptsStore = useScriptStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const selectedScriptId = ref<string | null>(null);

    const scriptOptions = computed(() => (scriptsStore.getEntries || []).map((s: any) => ({ label: s.name || s.id, value: s.id })));

    async function preFetch() {
      try {
        loading.value = true;
        await scriptsStore.fetchAll(1, 100);
        const opts = scriptOptions.value;
        if (!selectedScriptId.value && Array.isArray(opts) && opts.length > 0) {
          selectedScriptId.value = opts[0].value as string;
          await fetchScenes(1, store.getPagination.pageSize);
        }
      } catch (error) {
        console.error('Failed to fetch scripts:', error);
        message.error('Failed to load Scripts.');
      } finally {
        loading.value = false;
      }
    }

    const fetchScenes = async (page?: number, pageSize?: number) => {
      if (!selectedScriptId.value) return;
      try {
        loading.value = true;
        await store.fetchForScript(selectedScriptId.value, page || 1, pageSize || store.getPagination.pageSize);
      } catch (e) {
        console.error('Failed to fetch Scenes:', e);
        message.error('Failed to load Scenes.');
      } finally {
        loading.value = false;
      }
    };

    const startPeriodicRefresh = () => {
      if (!intervalId.value) {
        intervalId.value = window.setInterval(async () => {
          try {
            await fetchScenes(store.getPagination.page, store.getPagination.pageSize);
          } catch {}
        }, 30000);
      }
    };

    const stopPeriodicRefresh = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
      }
    };

    onMounted(() => {
      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    onUnmounted(() => {
      stopPeriodicRefresh();
    });

    preFetch();
    startPeriodicRefresh();

    const handlePageChange = async (page: number) => {
      await fetchScenes(page, store.getPagination.pageSize);
      checkedRowKeys.value = [];
    };

    const handlePageSizeChange = async (pageSize: number) => {
      await fetchScenes(1, pageSize);
      checkedRowKeys.value = [];
    };

    const hasSelection = computed(() => checkedRowKeys.value.length > 0);

    const handleNewClick = () => {
      if (!selectedScriptId.value) return;
      router.push({ name: 'SceneForm', params: { id: 'new' }, query: { scriptId: selectedScriptId.value } });
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.warning('Please select Scenes to delete.');
        return;
      }
      try {
        loading.value = true;
        const deletePromises = checkedRowKeys.value.map(id => store.remove(id as string));
        await Promise.all(deletePromises);
        message.success(`${checkedRowKeys.value.length} Scene(s) deleted successfully.`);
        checkedRowKeys.value = [];
        await fetchScenes(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        console.error('Failed to delete Scenes:', error);
        message.error('Failed to delete Scenes.');
      } finally {
        loading.value = false;
      }
    };

    const getRowProps = (row: ScriptScene) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) return;
          router.push({ name: 'SceneForm', params: { id: row.id } });
        },
      };
    };

    // no script combobox; scenes load based on auto-selected script

    const columns = computed<DataTableColumns<ScriptScene>>(() => {
      const baseColumns: DataTableColumns<ScriptScene> = [
        { type: 'selection', fixed: 'left', width: 50 },
        { title: 'Type', key: 'type', width: 140 },
        { title: 'Start Time', key: 'startTime', width: 200 },
        {
          title: 'Prompt',
          key: 'prompts',
          ellipsis: { tooltip: true },
          render: (row: ScriptScene) => {
            const textArr = (row as any).prompts || [];
            const text = Array.isArray(textArr) && textArr.length > 0 ? (typeof textArr[0] === 'string' ? textArr[0] : (textArr[0]?.prompt || '')) : '';
            const maxLength = isMobile.value ? 60 : 140;
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
                  checkedRowKeys.value = store.getEntries.map((item: ScriptScene) => item.id as string);
                }
              }
            })
          },
          {
            title: 'Scene',
            key: 'combined',
            render: (row: ScriptScene) => {
              const textArr = (row as any).prompts || [];
              const text = Array.isArray(textArr) && textArr.length > 0 ? (typeof textArr[0] === 'string' ? textArr[0] : (textArr[0]?.prompt || '')) : '';
              const maxLength = 100;
              return h('div', {}, [
                h('div', { style: 'font-weight: bold;' }, `${row.type || ''}`.trim()),
                h('div', { style: 'font-size: 0.8rem;' }, text.length > maxLength ? text.substring(0, maxLength) + '...' : text),
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
      rowKey: (row: ScriptScene) => row.id as string,
      isMobile,
      handleNewClick,
      handleDelete,
      hasSelection,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys,
      selectedScriptId,
      scriptOptions,
    };
  },
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>
