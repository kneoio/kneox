<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Scenes</template>
        <template #footer>
          Total: {{ pagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-button-group>
        <n-button @click="handleNewClick" type="primary" :size="isMobile ? 'medium' : 'large'">New</n-button>
        <n-button type="error" :disabled="!hasSelection" @click="handleDelete" :size="isMobile ? 'medium' : 'large'">
          Delete ({{ checkedRowKeys.length }})
        </n-button>
      </n-button-group>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-data-table
        :columns="columns"
        :row-key="rowKey"
        :data="pagedRows"
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
import { Script, ScriptScene } from '../../../types/kneoBroadcasterTypes';
import { useScriptStore } from '../../../stores/kneo/scriptStore';
import { useScriptSceneStore } from '../../../stores/kneo/scriptSceneStore';

export default defineComponent({
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const scriptStore = useScriptStore();
    const sceneStore = useScriptSceneStore();

    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);

    const rows = ref<any[]>([]);
    const page = ref(1);
    const pageSize = ref(10);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const hasSelection = computed(() => checkedRowKeys.value.length > 0);
    const pagination = computed(() => ({
      page: page.value,
      pageSize: pageSize.value,
      itemCount: rows.value.length,
      pageCount: Math.max(1, Math.ceil(rows.value.length / pageSize.value)),
      showSizePicker: true,
      pageSizes: [10, 20, 30, 40]
    }));
    const pagedRows = computed(() => {
      const start = (page.value - 1) * pageSize.value;
      return rows.value.slice(start, start + pageSize.value);
    });

    const fetchAllScenes = async () => {
      try {
        loading.value = true;
        await scriptStore.fetchAll(1, 100);
        const scripts = scriptStore.getEntries || [];
        const all: any[] = [];
        for (const s of scripts as Script[]) {
          try {
            await sceneStore.fetchForScript(s.id as string, 1, 100);
            const scenes = (sceneStore.apiViewResponse?.viewData?.entries || []) as ScriptScene[];
            scenes.forEach((sc: ScriptScene) => {
              const map = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const w = (sc as any).weekdays || [];
              const weekdaysText = Array.isArray(w) && w.length > 0
                ? w.filter((n: any) => Number.isInteger(n) && n >= 1 && n <= 7).map((n: number) => map[n]).join(', ')
                : '';
              all.push({
                id: sc.id,
                name: sc.title || sc.type || '',
                scriptName: (s as any).name || s.id,
                startTime: sc.startTime || '',
                weekdays: weekdaysText,
                oneTimeRun: !!(sc as any).oneTimeRun
              });
            });
          } catch {
            // ignore individual script failures
          }
        }
        rows.value = all;
      } catch (error) {
        console.error('Failed to fetch scenes list:', error);
        message.error('Failed to load Scenes.');
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchAllScenes();
      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    const handlePageChange = (newPage: number) => {
      page.value = newPage;
    };

    const handlePageSizeChange = (newSize: number) => {
      pageSize.value = newSize;
      page.value = 1;
    };

    const handleNewClick = () => {
      router.push({ name: 'SceneForm', params: { id: 'new' } });
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
        await fetchAllScenes();
      } catch (error) {
        message.error('Failed to delete Scenes.');
      } finally {
        loading.value = false;
      }
    };

    const columns = computed<DataTableColumns<any>>(() => ([
      { type: 'selection' },
      { title: 'Name', key: 'name' },
      { title: 'Script', key: 'scriptName' },
      {
        title: 'Start Time',
        key: 'startTime',
        render: (row: any) => {
          const content: any[] = [];
          if (row.startTime) content.push(h('span', row.startTime));
          if (row.oneTimeRun) content.push(h(NTag, { type: 'success', size: 'small', style: 'margin-left:8px;' }, { default: () => 'One-time' }));
          return content.length > 0 ? h('div', { style: 'display:flex; align-items:center;' }, content) : null;
        }
      },
      { title: 'Weekdays', key: 'weekdays' }
    ]));

    const getRowProps = (row: any) => ({
      style: 'cursor: pointer;',
      onClick: (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
          return;
        }
        router.push({ name: 'SceneForm', params: { id: row.id } });
      }
    });

    return {
      columns,
      rows,
      pagedRows,
      rowKey: (row: any) => row.id,
      isMobile,
      loading,
      pagination,
      handlePageChange,
      handlePageSizeChange,
      handleNewClick,
      handleDelete,
      checkedRowKeys,
      hasSelection,
      getRowProps
    };
  }
});
</script>
