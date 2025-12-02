<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Scripts</template>
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
        <n-button @click="handleImport" type="default" size="large">Import</n-button>
        <n-button
            type="default"
            :disabled="!hasSelection"
            @click="handleExport"
            size="large"
        >
          Export ({{ checkedRowKeys.length }})
        </n-button>
        <n-button
            type="default"
            :disabled="!hasSelection"
            @click="handleExportExtended"
            size="large"
        >
          Export Extended ({{ checkedRowKeys.length }})
        </n-button>
      </n-button-group>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-data-table
          :columns="columns"
          :row-key="rowKey"
          :data="treeData"
          :bordered="false"
          :row-props="getRowProps"
          :loading="loading"
          v-model:checked-row-keys="checkedRowKeys"
          default-expand-all
      >
        <template #loading>
          <loader-icon/>
        </template>
      </n-data-table>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {computed, defineComponent, h, onMounted, onUnmounted, ref} from 'vue';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NCheckbox,
  NDataTable,
  NGi,
  NGrid,
  NPageHeader,
  NTag,
  useMessage
} from 'naive-ui';
import {useRouter} from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import {Script, ScriptScene} from "../../../types/kneoBroadcasterTypes";
import {useScriptStore} from "../../../stores/kneo/scriptStore";
import { useScriptSceneStore } from "../../../stores/kneo/scriptSceneStore";
import { useReferencesStore } from "../../../stores/kneo/referencesStore";
import { handleFormSaveError } from '../../../utils/errorHandling';
import apiClient from '../../../api/apiClient';

export default defineComponent({
  components: {NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon},
  setup() {
    const router = useRouter();
    const message = useMessage();
    const store = useScriptStore();
    const sceneStore = useScriptSceneStore();
    const referencesStore = useReferencesStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const treeData = ref<any[]>([]);
    const scriptLabelOptions = ref<Array<{ label: string; value: string; color?: string; fontColor?: string }>>([]);

    const resolveLabelNames = (labelUuids: string[]): string => {
      if (!Array.isArray(labelUuids) || labelUuids.length === 0) return '';
      const labelMap = new Map(scriptLabelOptions.value.map(opt => [opt.value, opt.label]));
      return labelUuids.map(uuid => labelMap.get(uuid) || uuid).join(', ');
    };

    async function preFetch() {
      try {
        loading.value = true;
        scriptLabelOptions.value = await referencesStore.fetchLabelsByCategory('script');
        await store.fetchAll(1, 100);
        const scripts = store.getEntries || [];
        const childrenPromises = scripts.map(async (s: Script) => {
          try {
            await sceneStore.fetchForScript(s.id as string, 1, 50);
            const scenes = (sceneStore.apiViewResponse?.viewData?.entries || []) as ScriptScene[];
            const children = scenes.map(sc => {
              const map = ['','Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
              const w = (sc as any).weekdays || [];
              const weekdaysText = Array.isArray(w) && w.length > 0
                ? w.filter((n: any) => Number.isInteger(n) && n >= 1 && n <= 7).map((n: number) => map[n]).join(', ')
                : '';
              return {
                id: sc.id,
                name: sc.title || sc.type || '',
                tags: '',
                description: '',
                startTime: sc.startTime || '',
                weekdays: weekdaysText,
                oneTimeRun: !!(sc as any).oneTimeRun
              };
            });
            return {
              id: s.id,
              name: s.name,
              tags: resolveLabelNames((s as any).labels || []),
              labelUuids: (s as any).labels || [],
              description: s.description || '',
              accessLevel: (s as any).accessLevel,
              children
            };
          } catch {
            return {
              id: s.id,
              name: s.name,
              tags: resolveLabelNames((s as any).labels || []),
              labelUuids: (s as any).labels || [],
              description: s.description || '',
              accessLevel: (s as any).accessLevel
            };
          }
        });
        const rows = await Promise.all(childrenPromises);
        treeData.value = rows;
      } catch (error) {
        console.error('Failed to fetch initial Script data:', error);
        message.error('Failed to load Scripts.');
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
            console.error('Periodic refresh of Scripts failed:', error);
          }
        }, 30000); // Refresh every 30 seconds, adjust as needed
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
      stopPeriodicRefresh(); // Stop periodic refresh when component is unmounted
    });

    const handlePageChange = async (_page: number) => {};
    const handlePageSizeChange = async (_pageSize: number) => {};

    const hasSelection = computed(() => {
      return checkedRowKeys.value.length > 0;
    });

    const handleNewClick = () => {
      router.push('/outline/scripts/new');
    };

    const handleNewSceneClick = () => {
      router.push({ name: 'SceneForm', params: { id: 'new' } });
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.warning('Please select Scripts to delete.');
        return;
      }

      try {
        loading.value = true;
        const topLevelIds = new Set((treeData.value || []).map((r: any) => r.id));
        const deletePromises = checkedRowKeys.value.map((id) => {
          const key = id as string;
          if (topLevelIds.has(key)) {
            return store.deleteScript(key);
          }
          return sceneStore.remove(key);
        });
        await Promise.all(deletePromises);
        message.success(`${checkedRowKeys.value.length} item(s) deleted successfully.`);
        checkedRowKeys.value = [];
        await preFetch();
      } catch (error) {
        console.error('Failed to delete Scripts:', error);
        message.error('Failed to delete Scripts.');
      } finally {
        loading.value = false;
      }
    };

    const handleImport = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        
        try {
          loading.value = true;
          
          const fileContent = await file.text();
          const jsonData = JSON.parse(fileContent);
          
          await apiClient.post('/scripts/import', jsonData, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          message.success('Script imported successfully');
          await preFetch();
        } catch (error) {
          console.error('Failed to import script:', error);
          handleFormSaveError(error, message);
        } finally {
          loading.value = false;
        }
      };
      input.click();
    };

    const handleExport = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.warning('Please select scripts to export.');
        return;
      }

      try {
        loading.value = true;
        const topLevelIds = new Set((treeData.value || []).map((r: any) => r.id));
        const scriptIds = checkedRowKeys.value.filter((id) => topLevelIds.has(id as string));
        
        if (scriptIds.length === 0) {
          message.warning('Please select scripts (not scenes) to export.');
          return;
        }

        for (const scriptId of scriptIds) {
          const response = await apiClient.get(`/scripts/${scriptId}/export`, {
            responseType: 'blob'
          });
          
          const url = URL.createObjectURL(response.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = `script-${scriptId}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        
        message.success(`${scriptIds.length} script(s) exported successfully`);
      } catch (error) {
        console.error('Failed to export scripts:', error);
        message.error('Failed to export scripts');
      } finally {
        loading.value = false;
      }
    };

    const handleExportExtended = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.warning('Please select scripts to export.');
        return;
      }

      try {
        loading.value = true;
        const topLevelIds = new Set((treeData.value || []).map((r: any) => r.id));
        const scriptIds = checkedRowKeys.value.filter((id) => topLevelIds.has(id as string));
        
        if (scriptIds.length === 0) {
          message.warning('Please select scripts (not scenes) to export.');
          return;
        }

        for (const scriptId of scriptIds) {
          const response = await apiClient.get(`/scripts/${scriptId}/export?extended=true`, {
            responseType: 'blob'
          });
          
          const url = URL.createObjectURL(response.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = `script-${scriptId}-extended.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        
        message.success(`${scriptIds.length} script(s) exported (extended) successfully`);
      } catch (error) {
        console.error('Failed to export scripts (extended):', error);
        message.error('Failed to export scripts (extended)');
      } finally {
        loading.value = false;
      }
    };

    const getRowProps = (row: any) => {
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
          const routeTo = row.children 
            ? { name: 'ScriptForm', params: { id: row.id } }
            : { name: 'SceneForm', params: { id: row.id } };
          router.push(routeTo).catch((err) => {
            console.error('Navigation error:', err);
          });
        }
      };
    };

    const labelMap = computed(() => new Map(scriptLabelOptions.value.map(opt => [opt.value, opt])));

    const columns = computed<DataTableColumns<any>>(() => ([
      { type: 'selection' },
      { title: 'name', key: 'name' },
      {
        title: 'Start Time',
        key: 'startTime',
        render: (row: any) => {
          const content: any[] = [];
          if (row.startTime) content.push(h('span', row.startTime));
          if (!row.children && row.oneTimeRun) {
            content.push(h(NTag, { type: 'success', size: 'small', style: 'margin-left:8px;' }, { default: () => 'One-time' }));
          }
          return content.length > 0 ? h('div', { style: 'display:flex; align-items:center;' }, content) : null;
        }
      },
      {
        title: 'Flags',
        key: 'accessLevel',
        render: (row: any) => {
          if (row.children) {
            const isPublic = row.accessLevel === 1;
            return isPublic
              ? h(NTag, { type: 'success', size: 'small' }, { default: () => 'Public' })
              : null;
          }
          return null;
        }
      },
      { title: 'Weekdays', key: 'weekdays' },
      { title: 'Description', key: 'description' }
    ]));

    return {
      store,
      columns,
      rowKey: (row: any) => row.id,
      isMobile,
      handleNewClick,
      handleNewSceneClick,
      handleDelete,
      handleImport,
      handleExport,
      handleExportExtended,
      hasSelection,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys,
      treeData
    };
  },
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>
