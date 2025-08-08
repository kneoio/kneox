<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>AI DJs</template>
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
  useMessage
} from 'naive-ui';
import {useRouter} from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import {AiAgent} from "../../../types/kneoBroadcasterTypes";
import {useAiAgentStore} from "../../../stores/kneo/aiAgentStore";

export default defineComponent({
  components: {NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon},
  setup() {
    const router = useRouter();
    const message = useMessage();
    const store = useAiAgentStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchAll();
      } catch (error) {
        console.error('Failed to fetch initial AI Agent data:', error);
        message.error('Failed to load AI Agents.');
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
            console.error('Periodic refresh of AI Agents failed:', error);
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

    const hasSelection = computed(() => {
      return checkedRowKeys.value.length > 0;
    });

    const handleNewClick = () => {
      router.push('/outline/ai_agents/new');
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.warning('Please select AI Agents to delete.');
        return;
      }

      try {
        loading.value = true;
        const deletePromises = checkedRowKeys.value.map(id => store.deleteAiAgent(id as string));
        await Promise.all(deletePromises);
        message.success(`${checkedRowKeys.value.length} AI Agent(s) deleted successfully.`);
        checkedRowKeys.value = [];
        await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        console.error('Failed to delete AI Agents:', error);
        message.error('Failed to delete AI Agents.');
      } finally {
        loading.value = false;
      }
    };

    const getRowProps = (row: AiAgent) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
            return;
          }
          const routeTo = {name: 'AiAgentForm', params: {id: row.id}};
          router.push(routeTo).catch((err) => {
            console.error('Navigation error:', err);
          });
        },
      };
    };

    const columns = computed<DataTableColumns<AiAgent>>(() => {
      const baseColumns: DataTableColumns<AiAgent> = [
        {
          type: 'selection',
          fixed: 'left',
          width: 50
        },
        {title: 'Name', key: 'name', width: 150},
        {title: 'Preferred Language', key: 'preferredLang', width: 120},
        {
          title: 'Talkativity',
          key: 'talkativity',
          width: 100,
          render: (row) => `${Math.round(row.talkativity * 100)}%`
        },
        {
          title: 'Preferred Voice',
          key: 'preferredVoice',
          width: 165,
          render: (row: AiAgent) => {
            return h('span', {}, row.preferredVoice?.map(voice => voice.name).join(', ') || 'N/A');
          }
        },
        {
          title: 'Prompts',
          key: 'prompts',
          ellipsis: {tooltip: true},
          render: (row: AiAgent) => {
            if (!row.prompts || row.prompts.length === 0) return 'N/A';
            const maxLength = isMobile.value ? 40 : 80;
            return row.prompts.map(prompt => prompt.substring(0, maxLength) + (prompt.length > maxLength ? '...' : '')).join('; ');
          }
        }
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
                  checkedRowKeys.value = store.getEntries.map(item => item.id);
                }
              }
            })
          },
          {
            title: 'Agent',
            key: 'combined',
            render: (row: AiAgent) => {
              return h('div', {}, [
                h('div', { style: 'font-weight: bold;' }, row.name),
                h('div', { style: 'font-size: 0.8rem;' }, `Lang: ${row.preferredLang}`),
                h('div', { style: 'font-size: 0.8rem;' }, `Tools: ${row.enabledTools?.map(tool => tool.name).join(', ') || 'None'}`)
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
      rowKey: (row: AiAgent) => row.id,
      isMobile,
      handleNewClick,
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