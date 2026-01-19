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
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; margin-top: 12px;">
        <n-button-group>
          <n-button @click="handleNewClick" type="primary" :size="isMobile ? 'medium' : 'large'">New</n-button>
          <n-button type="error" :disabled="!hasSelection" @click="handleDelete" :size="isMobile ? 'medium' : 'large'">
            Delete ({{ checkedRowKeys.length }})
          </n-button>
        </n-button-group>
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
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NDataTable,
  NGi,
  NGrid,
  NPageHeader,
  NTag,
  useMessage
} from 'naive-ui';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import { SceneTimingMode, ScriptScene } from '../../../types/kneoBroadcasterTypes';
import { useScriptSceneStore } from '../../../stores/kneo/scriptSceneStore';

export default defineComponent({
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const sceneStore = useScriptSceneStore();

    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const hasSelection = computed(() => checkedRowKeys.value.length > 0);

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
        const activeFilters = {
          activated: true,
          timingMode: 'ABSOLUTE_TIME'
        };
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
          if (row.oneTimeRun) content.push(h(NTag, { type: 'success', size: 'small', style: 'margin-left:8px;' }, { default: () => 'One-time' }));
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
      getRowProps
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
