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
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; margin-top: 12px; overflow-x: auto;">
        <n-button-group>
          <n-button @click="handleNewClick" type="primary" size="large">New</n-button>
          <n-dropdown
              trigger="click"
              :disabled="!hasSelection"
              :options="accessLevelOptions"
              @select="handleSetAccessLevel"
          >
            <n-button
                type="default"
                :disabled="!hasSelection"
                size="large"
            >
              Set Access Level
            </n-button>
          </n-dropdown>
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
          <n-button
              type="error"
              :disabled="!hasSelection"
              @click="handleDelete"
              size="large"
          >
            Delete ({{ checkedRowKeys.length }})
          </n-button>
          <n-button @click="openFilterDialog" type="default" size="large">
            <red-led :active="hasActiveFilters" style="margin-right: 8px;" />
            Filter
          </n-button>
          <n-button @click="resetFilters" type="default" size="large" :disabled="!hasActiveFilters">
            Reset
          </n-button>
        </n-button-group>

        <n-input
          v-model:value="filters.searchTerm"
          placeholder="Search..."
          clearable
          @update:value="onSearchChange"
          style="width: 200px;"
          size="large"
        />
      </div>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <div v-if="filterSummary" class="filter-summary">
        {{ filterSummary }}
      </div>
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
      >
        <template #loading>
          <loader-icon/>
        </template>
      </n-data-table>
    </n-gi>
  </n-grid>

  <n-modal v-model:show="showFilterDialog" preset="dialog" title="Filter Options" :style="{ backgroundColor: dialogBackgroundColor }">
    <n-space vertical>
      <n-form-item label="Search" :show-feedback="false">
        <n-input v-model:value="dialogFilters.searchTerm" placeholder="Search..." clearable />
      </n-form-item>
      <n-form-item label="Language" :show-feedback="false">
        <n-select v-model:value="dialogFilters.languageTag" :options="langOptions" placeholder="Select language" clearable />
      </n-form-item>
      <n-form-item label="Timing Mode" :show-feedback="false">
        <n-select v-model:value="dialogFilters.timingMode" :options="timingModeOptions" placeholder="Select timing mode" clearable />
      </n-form-item>
      <n-form-item label="Labels" :show-feedback="false">
        <n-select v-model:value="dialogFilters.labels" :options="scriptLabelOptions" multiple filterable placeholder="Select labels" clearable />
      </n-form-item>
    </n-space>
    <template #action>
      <n-space>
        <n-button @click="clearDialogFilters">Clear</n-button>
        <n-button @click="showFilterDialog = false">Cancel</n-button>
        <n-button type="primary" @click="applyDialogFilters">OK</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts">
import {computed, defineComponent, h, onMounted, onUnmounted, ref} from 'vue';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NDataTable,
  NDropdown,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NModal,
  NPageHeader,
  NSelect,
  NSpace,
  NTag,
  useMessage
} from 'naive-ui';
import {useRouter} from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import RedLed from '../../common/RedLed.vue';
import { SceneTimingMode, Script } from "../../../types/kneoBroadcasterTypes";
import {useScriptStore} from "../../../stores/kneo/scriptStore";
import { useReferencesStore } from "../../../stores/kneo/referencesStore";
import { handleFormSaveError } from '../../../utils/errorHandling';
import apiClient from '../../../api/apiClient';
import { useDialogBackground } from '../../../composables/useDialogBackground';

export default defineComponent({
  components: {NPageHeader, NDataTable, NButtonGroup, NButton, NDropdown, NGi, NGrid, LoaderIcon, RedLed, NInput, NModal, NSpace, NFormItem, NSelect},
  setup() {
    const router = useRouter();
    const message = useMessage();
    const { dialogBackgroundColor } = useDialogBackground();
    const store = useScriptStore();
    const referencesStore = useReferencesStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const treeData = ref<any[]>([]);
    const scriptLabelOptions = ref<Array<{ label: string; value: string; color?: string; fontColor?: string }>>([]);

    const hasSelection = computed(() => {
      return checkedRowKeys.value.length > 0;
    });

    const showFilterDialog = ref(false);
    const dialogFilters = ref({
      searchTerm: '',
      labels: [] as string[],
      timingMode: '' as any,
      languageTag: '' as any
    });

    const filters = ref({
      searchTerm: '',
      labels: [] as string[],
      timingMode: '' as any,
      languageTag: '' as any
    });

    const hasActiveFilters = computed(() => {
      return !!(
        filters.value.searchTerm ||
        (filters.value.labels && filters.value.labels.length > 0) ||
        filters.value.timingMode ||
        filters.value.languageTag
      );
    });

    const STORAGE_KEY = 'scripts.list.filters';

    const loadSavedFilters = () => {
      try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) {
          const obj = JSON.parse(s);
          filters.value = {
            searchTerm: obj.searchTerm || '',
            labels: obj.labels || [],
            timingMode: obj.timingMode || '',
            languageTag: obj.languageTag || ''
          };
        }
      } catch {}
    };

    const saveFilters = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters.value));
      } catch {}
    };

    const resolveLabelNames = (labelUuids: string[]): string => {
      if (!Array.isArray(labelUuids) || labelUuids.length === 0) return '';
      const labelMap = new Map(scriptLabelOptions.value.map(opt => [opt.value, opt.label]));
      return labelUuids.map(uuid => labelMap.get(uuid) || uuid).join(', ');
    };

    const timingModeLabel = (mode: any): string | null => {
      if (mode === SceneTimingMode.ABSOLUTE_TIME) return 'Radio';
      if (mode === SceneTimingMode.RELATIVE_TO_STREAM_START) return 'One Time Stream';
      return null;
    };

    const timingModeOptions = [
      { label: 'Radio', value: SceneTimingMode.ABSOLUTE_TIME },
      { label: 'One Time Stream', value: SceneTimingMode.RELATIVE_TO_STREAM_START }
    ];

    const langOptions = computed(() => (referencesStore as any).languageOptions || []);

    const openFilterDialog = () => {
      dialogFilters.value = {
        searchTerm: filters.value.searchTerm,
        labels: [...filters.value.labels],
        timingMode: filters.value.timingMode,
        languageTag: filters.value.languageTag
      };
      showFilterDialog.value = true;
    };

    const applyDialogFilters = () => {
      filters.value = {
        searchTerm: dialogFilters.value.searchTerm,
        labels: [...dialogFilters.value.labels],
        timingMode: dialogFilters.value.timingMode,
        languageTag: dialogFilters.value.languageTag
      };
      showFilterDialog.value = false;
      saveFilters();
      fetchData();
    };

    const clearDialogFilters = () => {
      dialogFilters.value = {
        searchTerm: '',
        labels: [],
        timingMode: '',
        languageTag: ''
      };
    };

    const resetFilters = () => {
      filters.value = {
        searchTerm: '',
        labels: [],
        timingMode: '',
        languageTag: ''
      };
      saveFilters();
      fetchData();
    };

    const onSearchChange = () => {
      saveFilters();
      fetchData();
    };

    const filterSummary = computed(() => {
      const parts: string[] = [];
      if (filters.value.searchTerm) {
        parts.push(`Search: "${filters.value.searchTerm}"`);
      }
      if (filters.value.languageTag) {
        const lang = (langOptions.value || []).find((o: any) => o.value === filters.value.languageTag);
        parts.push(`Language: ${lang?.label || filters.value.languageTag}`);
      }
      if (filters.value.timingMode) {
        parts.push(`Mode: ${timingModeLabel(filters.value.timingMode) || filters.value.timingMode}`);
      }
      if (filters.value.labels?.length > 0) {
        const labelMap = new Map(scriptLabelOptions.value.map(opt => [opt.value, opt.label]));
        const names = filters.value.labels.map(id => labelMap.get(id) || id).join(', ');
        parts.push(`Labels: ${names}`);
      }
      return parts.join(' | ');
    });

    const fetchData = async () => {
      try {
        loading.value = true;

        const activeFilters: any = {};
        if (filters.value.labels?.length > 0) activeFilters.labels = filters.value.labels;
        if (filters.value.timingMode) activeFilters.timingMode = filters.value.timingMode;
        if (filters.value.languageTag) activeFilters.languageTag = filters.value.languageTag;
        if (filters.value.searchTerm) activeFilters.searchTerm = filters.value.searchTerm;

        await store.fetchAll(1, 100, activeFilters);
        const scripts = store.getEntries || [];
        treeData.value = scripts.map((s: Script) => ({
          id: s.id,
          name: s.name,
          tags: resolveLabelNames((s as any).labels || []),
          labelUuids: (s as any).labels || [],
          description: s.description || '',
          accessLevel: (s as any).accessLevel,
          timingMode: (s as any).timingMode
        }));
      } catch (error) {
        console.error('Failed to fetch Scripts:', error);
        message.error('Failed to load Scripts.');
      } finally {
        loading.value = false;
      }
    };

    async function preFetch() {
      try {
        loading.value = true;
        scriptLabelOptions.value = await referencesStore.fetchLabelsByCategory('script');
        loadSavedFilters();
        await fetchData();
      } finally {
        loading.value = false;
      }
    };

    const startPeriodicRefresh = () => {
      if (!intervalId.value) {
        intervalId.value = window.setInterval(async () => {
          try {
            await fetchData();
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

    (async () => {
      try {
        await preFetch();
      } catch (error) {
        console.error('Initial fetch failed:', error);
      }
    })();
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
          return;
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

    const accessLevelOptions = [
      { label: 'Set Public', key: 'PUBLIC' },
      { label: 'Set Private', key: 'PRIVATE' }
    ];

    const handleSetAccessLevel = async (key: string) => {
      if (checkedRowKeys.value.length === 0) {
        message.warning('Please select scripts to set access level.');
        return;
      }

      try {
        loading.value = true;
        const topLevelIds = new Set((treeData.value || []).map((r: any) => r.id));
        const scriptIds = checkedRowKeys.value.filter((id) => topLevelIds.has(id as string));
        
        if (scriptIds.length === 0) {
          message.warning('Please select scripts (not scenes) to set access level.');
          return;
        }

        const updatePromises = scriptIds.map((id) => 
          apiClient.patch(`/scripts/${id}/access-level`, { accessLevel: key })
        );
        await Promise.all(updatePromises);
        message.success(`${scriptIds.length} script(s) set to ${key.toLowerCase()}.`);
        checkedRowKeys.value = [];
        await preFetch();
      } catch (error) {
        console.error('Failed to set scripts access level:', error);
        handleFormSaveError(error, message);
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
          router.push({ name: 'ScriptForm', params: { id: row.id } }).catch((err) => {
            console.error('Navigation error:', err);
          });
        }
      };
    };

    const columns = computed<DataTableColumns<any>>(() => ([
      { type: 'selection' },
      { title: 'Name', key: 'name' },
      {
        title: 'Mode',
        key: 'timingMode',
        width: 200,
        render: (row: any) => {
          const modeLabel = timingModeLabel(row.timingMode);
          const isPublic = row.accessLevel === 1;
          const tags: any[] = [];
          
          if (modeLabel) {
            tags.push(h(NTag, { type: row.timingMode === SceneTimingMode.RELATIVE_TO_STREAM_START ? 'warning' : 'info', size: 'small' }, { default: () => modeLabel }));
          }
          if (isPublic) {
            tags.push(h(NTag, { type: 'success', size: 'small' }, { default: () => 'Public' }));
          }
          
          return tags.length
            ? h('div', { style: 'display:flex; gap:6px; flex-wrap:wrap;' }, tags)
            : null;
        }
      },
      { title: 'Description', key: 'description' }
    ]));

    return {
      store,
      columns,
      rowKey: (row: any) => row.id,
      isMobile,
      hasSelection,
      handleNewClick,
      handleNewSceneClick,
      handleDelete,
      handleImport,
      handleExport,
      handleExportExtended,
      accessLevelOptions,
      handleSetAccessLevel,
      openFilterDialog,
      applyDialogFilters,
      clearDialogFilters,
      resetFilters,
      onSearchChange,
      hasActiveFilters,
      showFilterDialog,
      dialogFilters,
      filters,
      filterSummary,
      timingModeOptions,
      langOptions,
      dialogBackgroundColor,
      scriptLabelOptions,
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

.filter-summary {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}
</style>
