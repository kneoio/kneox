<template>
  <n-grid cols="24" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Employees</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi span="24">
      <n-button-group>
        <n-button @click="handleNewClick" type="primary" size="large">New</n-button>
        <n-button @click="handleDelete" size="large" :disabled="!selectedRows.length">Delete</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="24">
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
import { computed, defineComponent, onMounted, ref } from 'vue';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NDataTable,
  NGi,
  NGrid,
  NH2,
  NPageHeader,
  NPagination,
  NSpace,
  useMessage
} from 'naive-ui';
import { useRouter } from 'vue-router';
import { useEmployeeStore } from "../../stores/of/employeeStore";
import { Employee } from "../../types/officeFrameTypes";

export default defineComponent({
  components: { NPageHeader, NSpace, NH2, NDataTable, NPagination, NButtonGroup, NButton, NGi, NGrid },
  setup() {
    const router = useRouter();
    const msgPopup = useMessage();
    const store = useEmployeeStore();
    const isMobile = ref(window.innerWidth < 768);
    const selectedRows = ref<string[]>([]);

    async function preFetch() {
      try {
        await store.fetchEmployees();
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

    const columns = computed<DataTableColumns<Employee>>(() => [
      {
        type: 'selection',
        disabled: (row: Employee) => !row.id,
        options: ['none', 'all'],
        onSelect: (value: string | number | boolean, row: Employee) => {
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
      { title: 'Name', key: 'identifier' },
      { title: 'Registered', key: 'regDate' }
    ]);

    const handlePageChange = (page: number) => {
      store.fetchEmployees(page, store.getPagination.pageSize);
    };

    const handlePageSizeChange = (pageSize: number) => {
      store.fetchEmployees(1, pageSize);
    };

    const handleNewClick = () => {
      router.push({ name: 'NewEmployeeForm' }).catch(err => {
        console.error('Navigation error:', err);
      });
    };

    const handleDelete = async () => {
      msgPopup.info(`Mock delete action for employees: ${selectedRows.value.join(', ')}`);
      selectedRows.value = [];
    }

    const getRowProps = (row: Employee) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          if (!(e.target as HTMLElement).closest('.n-checkbox')) {
            const routeTo = { name: 'EmployeeForm', params: { id: row.id } };
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
      handleDelete,
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

</style>