<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Scenes</template>
        <template #footer>
          Total: {{ sceneStore.getPagination.itemCount }}
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
        :data="rows"
        :bordered="false"
        :row-props="getRowProps"
        :loading="loading"
        :pagination="sceneStore.getPagination"
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
import { ScriptScene } from '../../../types/kneoBroadcasterTypes';
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
          name: sc.title || sc.type || '',
          scriptId: scriptId || '',
          startTime: sc.startTime || '',
          talkativity: (sc as any).talkativity ?? 0,
          weekdays: weekdaysText,
          oneTimeRun: !!(sc as any).oneTimeRun
        };
      });
    });

    onMounted(() => {
      preFetch();
      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    const preFetch = async () => {
      try {
        loading.value = true;
        await sceneStore.fetchAll(1, sceneStore.getPagination.pageSize);
      } catch (error) {
        console.error('Failed to load Scenes:', error);
        message.error('Failed to load Scenes.');
      } finally {
        loading.value = false;
      }
    };

    const handlePageChange = async (newPage: number) => {
      await sceneStore.fetchAll(newPage, sceneStore.getPagination.pageSize);
      checkedRowKeys.value = [];
    };

    const handlePageSizeChange = async (newSize: number) => {
      await sceneStore.fetchAll(1, newSize);
      checkedRowKeys.value = [];
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
        await sceneStore.fetchAll(sceneStore.getPagination.page, sceneStore.getPagination.pageSize);
      } catch (error) {
        message.error('Failed to delete Scenes.');
      } finally {
        loading.value = false;
      }
    };

    const columns = computed<DataTableColumns<any>>(() => ([
      { type: 'selection' },
      { title: 'Name', key: 'name' },
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
      { title: 'Talkativity', key: 'talkativity' },
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
      getRowProps
    };
  }
});
</script>
