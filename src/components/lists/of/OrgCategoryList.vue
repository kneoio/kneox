<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Organization categories</template>
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
          v-if="!loading"
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
      <loader-icon v-else /> <!-- Show loader when loading -->
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
  NPageHeader,
  NTag,
  useMessage,
} from 'naive-ui';
import { useRouter } from 'vue-router';
import { OrgCategory } from '../../../types/officeFrameTypes';
import { useOrgCategoryStore } from '../../../stores/of/orgCategoryStore';
import LoaderIcon from '../../helpers/LoaderWrapper.vue'; // Import the LoaderIcon component

export default defineComponent({
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, NTag, LoaderIcon }, // Add LoaderIcon to components
  setup() {
    const router = useRouter();
    const msgPopup = useMessage();
    const store = useOrgCategoryStore();
    const isMobile = ref(window.innerWidth < 768);
    const selectedRows = ref<string[]>([]);
    const loading = ref(false); // Add loading state

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchAll();
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        loading.value = false;
      }
    }

    preFetch();

    onMounted(() => {
      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    const columns = computed<DataTableColumns<OrgCategory>>(() => [
      {
        type: 'selection',
        disabled: (row: OrgCategory) => !row.id,
        options: ['none', 'all'],
        onSelect: (value: string | number | boolean, row: OrgCategory) => {
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
        },
      },
      { title: 'Name', key: 'localizedName["ENG"]' },
      { title: 'Identifier', key: 'identifier' },
      { title: 'Registered', key: 'regDate' },
      { title: 'Author', key: 'author' },
    ]);

    const handlePageChange = async (page: number) => {
      loading.value = true;
      try {
        await store.fetchAll(page, store.getPagination.pageSize);
      } finally {
        loading.value = false;
      }
    };

    const handlePageSizeChange = async (pageSize: number) => {
      loading.value = true;
      try {
        await store.fetchAll(1, pageSize);
      } finally {
        loading.value = false;
      }
    };

    const handleNewClick = () => {
      router.push({ name: 'NewOrgCategoryForm' }).catch((err) => {
        console.error('Navigation error:', err);
      });
    };

    const handleArchive = async () => {
      msgPopup.info(`Mock archive action for rows: ${selectedRows.value.join(', ')}`);
      selectedRows.value = [];
    };

    const getRowProps = (row: OrgCategory) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          if (!(e.target as HTMLElement).closest('.n-checkbox')) {
            const routeTo = { name: 'OrgCategoryForm', params: { id: row.id } };
            router.push(routeTo).catch((err) => {
              console.error('Navigation error:', err);
            });
          }
        },
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
      loading, // Return loading state
    };
  },
});
</script>

<style scoped>
.cursor-pointer:hover {
  cursor: pointer;
}
</style>
