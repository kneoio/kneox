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
            return { id: s.id, name: s.name, tags: resolveLabelNames((s as any).labels || []), labelUuids: (s as any).labels || [], description: s.description || '', children };
          } catch {
            return { id: s.id, name: s.name, tags: resolveLabelNames((s as any).labels || []), labelUuids: (s as any).labels || [], description: s.description || '' };
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
        await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        console.error('Failed to delete Scripts:', error);
        message.error('Failed to delete Scripts.');
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
        title: 'Tags', 
        key: 'tags',
        render: (row: any) => {
          const labelUuids = (row as any).labelUuids || [];
          if (!Array.isArray(labelUuids) || labelUuids.length === 0) return null;
          return labelUuids.map((uuid: string) => {
            const labelOption = labelMap.value.get(uuid);
            return h(NTag, {
              style: labelOption?.color ? {
                backgroundColor: labelOption.color,
                color: labelOption.fontColor || '#ffffff'
              } : undefined
            }, { default: () => labelOption?.label || uuid });
          });
        }
      },
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
