<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Tasks by Project</template>
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

      />
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue';
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
import { useRouter } from 'vue-router';
import { useLabelStore } from '../../../stores/of/labelStore';
import { Label } from '../../../types/officeFrameTypes';

export default defineComponent({
  components: { NPageHeader, NDataTable, NPagination, NButtonGroup, NButton, NGi, NGrid, NTag },
  setup() {
    const router = useRouter();
    const msgPopup = useMessage();
    const store = useLabelStore();
    const isMobile = ref(window.innerWidth < 768);
    const selectedRows = ref<string[]>([]);

    async function preFetch() {
      try {
        await store.fetchAll();
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    }

    preFetch();

    onMounted(async () => {
      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    const columns = computed<DataTableColumns<Label>>(() => [
      {
        type: 'selection',
        disabled: (row: Label) => !row.id,
        options: ['none', 'all'],
        onSelect: (value: string | number | boolean, row: Label) => {
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
      { title: 'Name', key: 'localizedName["ENG"]' },
      { title: 'Identifier', key: 'identifier' },
      {
        title: 'Color',
        key: 'color',
        render(row: Label) {
          return h(NTag, { style: { backgroundColor: row.color, color: '#fff' } }, () => row.color);
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
      router.push({ name: 'NewLabelForm' }).catch(err => {
        console.error('Navigation error:', err);
      });
    };

    const handleArchive = async () => {
      msgPopup.info(`Mock archive action for rows: ${selectedRows.value.join(', ')}`);
      selectedRows.value = [];
    };

    const getRowProps = (row: Label) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          if (!(e.target as HTMLElement).closest('.n-checkbox')) {
            const routeTo = { name: 'LabelForm', params: { id: row.id } };
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
