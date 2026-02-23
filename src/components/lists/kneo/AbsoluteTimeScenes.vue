<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Absolute Time Scenes</template>
        <template #footer>
          Total: {{ sceneStore.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; margin-top: 12px; overflow-x: auto;">
        <n-button-group>
          <n-button @click="handleNewClick" type="primary" :size="isMobile ? 'medium' : 'large'">New</n-button>
          <n-button type="error" :disabled="!hasSelection" @click="handleDelete" :size="isMobile ? 'medium' : 'large'">
            Delete ({{ checkedRowKeys.length }})
          </n-button>
          <n-button
            @click="handleFilterClick"
            type="default"
            :size="isMobile ? 'medium' : 'large'"
            :disabled="!hasActiveFilters"
          >
            <red-led :active="hasActiveFilters" style="margin-right: 8px;" />
            Filter
          </n-button>
        </n-button-group>

        <n-select
          v-model:value="filters.scriptId"
          :options="scriptOptions"
          filterable
          clearable
          placeholder="Select Script"
          style="width: 250px;"
          :size="isMobile ? 'medium' : 'large'"
        />
      </div>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-data-table
        remote
        :columns="columns"
        :row-key="rowKey"
        :data="rows"
        :bordered="false"
        :row-props="getRowProps"
        :loading="loading"
        :pagination="pagination"
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
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NDataTable,
  NGi,
  NGrid,
  NPageHeader,
  NSelect,
  useMessage
} from 'naive-ui';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import RedLed from '../../common/RedLed.vue';
import { SceneTimingMode, ScriptScene } from '../../../types/kneoBroadcasterTypes';
import { useScriptSceneStore } from '../../../stores/kneo/scriptSceneStore';
import { useScriptStore } from '../../../stores/kneo/scriptStore';

export default defineComponent({
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, RedLed, NSelect },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const sceneStore = useScriptSceneStore();
    const scriptStore = useScriptStore();

    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const hasSelection = computed(() => checkedRowKeys.value.length > 0);
    const STORAGE_KEY = 'absoluteTimeScenes.list.filters';
    const STORAGE_SHOW_KEY = 'absoluteTimeScenes.list.showFilters';
    const showFilters = ref(false);
    const filters = ref({
      scriptId: null as string | null
    });

    const hasActiveFilters = computed(() => !!filters.value.scriptId);

    const loadSavedFilters = () => {
      try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) {
          const obj = JSON.parse(s);
          filters.value = {
            scriptId: obj.scriptId || null
          };
        }
        const sh = localStorage.getItem(STORAGE_SHOW_KEY);
        if (sh === 'true') showFilters.value = true;
      } catch { }
    };

    const saveFilters = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters.value));
        localStorage.setItem(STORAGE_SHOW_KEY, String(showFilters.value));
      } catch { }
    };

    const handleFilterClick = () => {
      filters.value.scriptId = null;
    };

    const scriptOptions = computed(() =>
      (scriptStore.getEntries || [])
        .filter((s: any) => typeof s.id === 'string' && s.id)
        .map((s: any) => ({ label: s.name || s.id, value: s.id as string }))
    );

    const rows = computed<any[]>(() => {
      const entries = (sceneStore.getEntries || []) as ScriptScene[];
      const map = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return entries.map((sc: ScriptScene) => {
        const w = (sc as any).weekdays || [];
        const weekdaysText = Array.isArray(w) && w.length > 0
          ? w.filter((n: any) => Number.isInteger(n) && n >= 1 && n <= 7).map((n: number) => map[n]).join(', ')
          : '';
        const scriptId = (sc as any).scriptId as string | undefined;
        return {
          id: sc.id,
          title: sc.title || sc.type || '',
          name: sc.title || sc.type || '',
          scriptTitle: (sc as any).scriptTitle || '',
          scriptId: scriptId || '',
          startTime: sc.startTime || '',
          timingMode: (sc as any).timingMode || SceneTimingMode.ABSOLUTE_TIME,
          durationSeconds: (sc as any).durationSeconds || 0,
          seqNum: (sc as any).seqNum || 0,
          talkativity: (sc as any).talkativity ?? 0,
          weekdays: weekdaysText,
          oneTimeRun: !!(sc as any).oneTimeRun,
          sourcing: sc.stagePlaylist?.sourcing || ''
        };
      });
    });

    onMounted(() => {
      preFetch();
      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    const fetchData = async (page = 1, pageSize = 10) => {
      try {
        loading.value = true;
        const activeFilters: any = {
          timingMode: 'ABSOLUTE_TIME'
        };
        if (filters.value.scriptId) {
          activeFilters.activated = true;
          activeFilters.scriptId = filters.value.scriptId;
        }
        await sceneStore.fetchAll(page, pageSize, activeFilters);
        pagination.value = sceneStore.getPagination;
      } catch (error) {
        console.error('Failed to load Scenes:', error);
        message.error('Failed to load Scenes.');
      } finally {
        loading.value = false;
      }
    };

    const preFetch = async () => {
      try {
        loading.value = true;
        loadSavedFilters();
        await scriptStore.fetchAll(1, 100, {});
        await fetchData(1, 10);
      } catch (error) {
        console.error('Failed to load Scenes:', error);
        message.error('Failed to load Scenes.');
      } finally {
        loading.value = false;
      }
    };

    const handlePageChange = async (newPage: number) => {
      await fetchData(newPage, sceneStore.getPagination.pageSize);
      checkedRowKeys.value = [];
    };

    const handlePageSizeChange = async (newSize: number) => {
      await fetchData(1, newSize);
      checkedRowKeys.value = [];
    };

    const handleNewClick = () => {
      router.push({ name: 'AbsoluteTimeSceneForm', params: { id: 'new' } });
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.info('No items selected for deletion.');
        return;
      }
      try {
        loading.value = true;
        await Promise.all(checkedRowKeys.value.map((id) => sceneStore.remove(String(id))));
        message.success(`Deleted ${checkedRowKeys.value.length} item(s) successfully`);
        checkedRowKeys.value = [];
        await fetchData(sceneStore.getPagination.page, sceneStore.getPagination.pageSize);
      } catch (error) {
        message.error('Failed to delete Scenes.');
      } finally {
        loading.value = false;
      }
    };

    const columns = computed<DataTableColumns<any>>(() => [
      { type: 'selection' },
      { title: 'Script Title', key: 'scriptTitle', width: 200 },
      { title: 'Name', key: 'name' },
      { title: 'Start Time', key: 'startTime', width: 100 },
      {
        title: 'Timing',
        key: 'timing',
        render: (row: any) => {
          const content: any[] = [];
          if (row.timingMode === SceneTimingMode.RELATIVE_TO_STREAM_START) {
            if (row.startTime) content.push(h('span', row.startTime));
          } else {
            const minutes = Math.floor(row.durationSeconds / 60);
            const seconds = row.durationSeconds % 60;
            content.push(h('span', seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`));
          }
          return content.length > 0 ? h('div', { style: 'display:flex; align-items:center;' }, content) : null;
        }
      },
      {
        title: 'Sequence Number',
        key: 'seqNum',
        width: 140,
        render: (row: any) => row.seqNum ?? '-'
      },
      {
        title: 'Source',
        key: 'sourcing',
        width: 100,
        render: (row: any) => {
          if (!row.sourcing) return '';
          const labels: Record<string, string> = {
            'RANDOM': 'Random',
            'STATIC_LIST': 'Static List',
            'QUERY': 'Query',
            'GENERATED': 'Generated'
          };
          return labels[row.sourcing] || row.sourcing;
        }
      },
      { title: 'Talkativity', key: 'talkativity' },
      { title: 'Weekdays', key: 'weekdays' }
    ]);

    const pagination = ref({ page: 1, pageSize: 10, itemCount: 0, pageCount: 1, showSizePicker: true, pageSizes: [10, 20, 30, 40] });

    const scriptTitleIndexMap = computed(() => {
      const map = new Map<string, number>();
      const scriptTitles = Array.from(new Set(rows.value.map(r => r.scriptTitle).filter(Boolean)));
      scriptTitles.forEach((title, index) => {
        map.set(title, index);
      });
      return map;
    });

    const getRowProps = (row: any) => {
      const classList = [];
      if (row.scriptTitle && scriptTitleIndexMap.value.has(row.scriptTitle)) {
        const index = scriptTitleIndexMap.value.get(row.scriptTitle)!;
        classList.push(`script-stripe-${index % 2}`);
      }
      
      return {
        style: 'cursor: pointer;',
        'data-script-title': row.scriptTitle,
        class: classList.join(' '),
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
            return;
          }
          router.push({ name: 'AbsoluteTimeSceneForm', params: { id: row.id } });
        }
      };
    };

    watch(() => filters.value, () => {
      saveFilters();
      fetchData(1, sceneStore.getPagination.pageSize);
    }, { deep: true });

    return {
      columns,
      rows,
      rowKey: (row: any) => row.id,
      isMobile,
      loading,
      sceneStore,
      handlePageChange,
      handlePageSizeChange,
      handleNewClick,
      handleDelete,
      checkedRowKeys,
      hasSelection,
      pagination,
      getRowProps,
      showFilters,
      filters,
      hasActiveFilters,
      handleFilterClick,
      scriptOptions
    };
  }
});
</script>

<style>
.script-stripe-0 td {
  background-color: rgba(24, 160, 88, 0.08) !important;
}

.script-stripe-1 td {
  background-color: rgba(51, 54, 179, 0.08) !important;
}

.script-stripe-0:hover td,
.script-stripe-1:hover td {
  background-color: var(--n-td-color-hover) !important;
}
</style>
