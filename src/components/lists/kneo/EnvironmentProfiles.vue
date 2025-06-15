<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Environment Profiles</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-button-group>
        <n-button @click="handleNewClick" type="primary" size="large">New</n-button>
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
  NDataTable,
  NGi,
  NGrid,
  NPageHeader,
  useMessage
} from 'naive-ui';
import {useRouter} from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import {Profile} from "../../../types/kneoBroadcasterTypes";
import {useEnvironmentProfileStore} from "../../../stores/kneo/environmentProfileStore";

export default defineComponent({
  name: 'EnvironmentProfiles', 
  components: {NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon},
  setup() {
    const router = useRouter();
    const message = useMessage();
    const store = useEnvironmentProfileStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchAll();
      } catch (error) {
        console.error('Failed to fetch initial Profile data:', error);
        message.error('Failed to load Environment Profiles.'); // Updated error message
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
            console.error('Periodic refresh of Environment Profiles failed:', error); // Updated console error
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

    const handleNewClick = () => {
      router.push('/outline/environment-profiles/new'); // Updated route path
    };

    const getRowProps = (row: Profile) => {
      return {
        style: 'cursor: pointer;',
        onClick: () => {
          const routeTo = {name: 'ProfileForm', params: {id: row.id}};
          router.push(routeTo).catch((err) => {
            console.error('Navigation error:', err);
          });
        },
      };
    };

    const columns = computed<DataTableColumns<Profile>>(() => {
      const baseColumns: DataTableColumns<Profile> = [
        {
          type: 'selection',
          fixed: 'left',
          width: 50
        },
        {title: 'Name', key: 'name'},
        {
            title: 'Description',
            key: 'description',
            ellipsis: {tooltip: true}
        },
        {
            title: 'Explicit Content',
            key: 'explicitContent',
            render: (row: Profile) => {
                return h('span', {}, row.explicitContent ? 'Yes' : 'No');
            }
        }
      ];

      if (isMobile.value) {
        return [
          {
            type: 'selection',
            fixed: 'left',
            width: 50
          },
          {
            title: 'Profile', // This title might also need an update if it's too generic now
            key: 'combined',
            render: (row: Profile) => {
              return h('div', {}, [
                h('div', { style: 'font-weight: bold;' }, row.name),
                h('div', { style: 'font-size: 0.8rem;' }, `Explicit: ${row.explicitContent ? 'Yes' : 'No'}`),
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
      rowKey: (row: Profile) => row.id,
      isMobile,
      handleNewClick,
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
