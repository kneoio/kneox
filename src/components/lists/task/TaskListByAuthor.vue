<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Tasks by Author</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi span="6">
      <n-button-group>
        <n-button @click="handleNewClick" type="primary" size="large">New</n-button>
        <n-button @click="handleArchive" size="large" :disabled="!selectedRows.length">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-data-table
          remote
          :columns="columns"
          :row-key="rowKey"
          :data="store.getEntries"
          :pagination="store.getPagination"
          :bordered="false"
          :row-props="getRowProps"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
          @update:checked-row-keys="handleCheckedRowKeysChange"
      />
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {computed, defineComponent, h, onMounted, ref} from 'vue';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NDataTable,
  NGi,
  NGrid,
  NPageHeader,
  NPagination,
  NTag,
  useMessage
} from 'naive-ui';
import {useRouter} from 'vue-router';
import {useTaskStore} from "../../../stores/project/taskStore";
import {Task} from "../../../types/projectTypes";

export default defineComponent({
  components: { NPageHeader, NDataTable, NPagination, NButtonGroup, NButton, NGi, NGrid, NTag },
  setup() {
    const router = useRouter();
    const msgPopup = useMessage();
    const store = useTaskStore();
    const isMobile = ref(window.innerWidth < 768);
    const selectedRows = ref<string[]>([]);

    const statusMap: Record<number, string> = {
      0: 'UNKNOWN',
      100: 'DRAFT',
      101: 'WAITING_FOR_START',
      102: 'ACTIVE',
      103: 'COMPLETED',
      104: 'MERGED',
      105: 'PAUSED'
    };
    const priorityMap: Record<number, string> = {
      0: 'Low',
      1: 'Below Normal',
      2: 'Normal',
      3: 'Above Normal',
      4: 'High',
      5: 'Critical'
    };

    const statusTypeMap: Record<number, string> = {
      0: 'default',
      100: 'info',
      101: 'warning',
      102: 'success',
      103: 'success',
      104: 'default',
      105: 'error'
    };
    const priorityTypeMap: Record<number, string> = {
      0: 'default',
      1: 'info',
      2: 'success',
      3: 'warning',
      4: 'error',
      5: 'error'
    };

    async function preFetch() {
      try {
        await store.fetchAll();
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    }

    preFetch();

    onMounted(() => {
      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    const columns = computed<DataTableColumns<Task>>(() => [
      {
        type: 'selection',
        disabled: (row: Task) => !row.id,
        options: ['none', 'all'],
        onSelect: (value: string | number | boolean, row: Task) => {
          const checked = !!value;
          if (row.id) {
            const index = selectedRows.value.indexOf(row.id);
            if (checked && index === -1) {
              selectedRows.value.push(row.id);
            } else if (!checked && index > -1) {
              selectedRows.value.splice(index, 1);
            }
          }
          return false;
        }
      },
      { title: 'Assignee', key: 'assignee.localizedName.ENG' },
      {
        title: 'Status',
        key: 'status',
        render(row: Task) {
          return h(NTag, { type: statusTypeMap[row.status] }, { default: () => statusMap[row.status] });
        }
      },
      {
        title: 'Priority',
        key: 'priority',
        render(row: Task) {
          return h(NTag, { type: priorityTypeMap[row.priority] }, { default: () => priorityMap[row.priority] });
        }
      },
      { title: 'Registered', key: 'regDate' },
      { title: 'Author', key: 'author' }
    ]);

    const handlePageChange = (page: number) => {
      store.fetchAll(page, store.getPagination.pageSize);
    };

    const handlePageSizeChange = (pageSize: number) => {
      store.fetchAll(1, pageSize);
    };

    const handleNewClick = () => {
      router.push({ name: 'NewTaskForm' }).catch(err => {
        console.error('Navigation error:', err);
      });
    };

    const handleArchive = async () => {
      msgPopup.info(`Mock archive action for rows: ${selectedRows.value.join(', ')}`);
      selectedRows.value = [];
    };

    const getRowProps = (row: Task) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          if (!(e.target as HTMLElement).closest('.n-checkbox')) {
            const routeTo = { name: 'TaskForm', params: { id: row.id } };
            router.push(routeTo).catch(err => {
              console.error('Navigation error:', err);
            });
          }
        }
      };
    };

    const handleCheckedRowKeysChange = (keys: string[]) => {
      selectedRows.value = keys;
    };

    return {
      store,
      columns,
      rowKey: (row: any) => row.id,
      isMobile,
      handleNewClick,
      handleArchive,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      handleCheckedRowKeysChange,
      selectedRows,
    };
  }
});
</script>

<style scoped>
.cursor-pointer:hover {
  cursor: pointer;
}
</style>
