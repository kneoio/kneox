<template>
  <n-grid :cols="1" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Listeners for {{ brandName }}</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi>
        <n-button-group>
            <n-button type="primary" size="large" @click="navigateToCreateListener">New</n-button>
        </n-button-group>
    </n-gi>
    <n-gi>
        <n-data-table
          remote
          :columns="columns"
          :row-key="rowKey"
          :data="store.getEntries"
          :pagination="store.getPagination"
          :bordered="false"
          :loading="loading"
          :row-props="getRowProps"
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
import { defineComponent, h, onMounted, ref, watch } from 'vue';
import {
  DataTableColumns,
  NDataTable,
  NGi,
  NGrid,
  NPageHeader,
  NButton,
  NButtonGroup,
} from 'naive-ui';
import { useRouter } from 'vue-router';

import LoaderIcon from '../../helpers/LoaderWrapper.vue';

import { ListenerEntry } from "../../../types/kneoBroadcasterTypes";
import { useListenersStore } from '../../../stores/kneo/listenersStore';

export default defineComponent({
  name: 'Listeners',
  components: { NPageHeader, NDataTable, NGi, NGrid, LoaderIcon, NButton, NButtonGroup },
  props: {
    brandName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const store = useListenersStore();
    const router = useRouter();

    const loading = ref(false);
    const checkedRowKeys = ref<Array<string | number>>([]);

    const columns: DataTableColumns<ListenerEntry> = [
      { type: 'selection' },
      { title: 'Nickname', key: 'nickName.en' },
      { title: 'Country', key: 'country' },
      { title: 'Registered', key: 'regDate' },
      {
        title: 'Archived',
        key: 'archived',
        render: (row: ListenerEntry) => (row.archived ? 'Yes' : 'No'),
      },
      {
        title: 'Actions',
        key: 'actions',
        render(row: ListenerEntry) {
          return h(
            NButton,
            {
              size: 'small',
              onClick: () => navigateToEditListener(row.id),
            },
            { default: () => 'Edit' }
          );
        },
      },
    ];

    const rowKey = (row: ListenerEntry): string => row.id;

    const fetchData = async (page = 1, pageSize = 10) => {
      if (!props.brandName) return;
      try {
        loading.value = true;
        await store.fetchListeners(props.brandName, page, pageSize);
      } catch (error) {
        console.error('Failed to fetch listeners:', error);
      } finally {
        loading.value = false;
      }
    };

    const handlePageChange = (page: number) => {
      fetchData(page, store.getPagination.pageSize);
    };

    const handlePageSizeChange = (pageSize: number) => {
      fetchData(1, pageSize);
    };

    const navigateToCreateListener = () => {
      router.push({ name: 'NewListener', params: { brandName: props.brandName } });
    };

    const navigateToEditListener = (listenerId: string) => {
      router.push({ name: 'EditListener', params: { brandName: props.brandName, listenerId } });
    };

    const getRowProps = (row: ListenerEntry) => {
      return {
        style: 'cursor: pointer;',
        onClick: () => {
          navigateToEditListener(row.id);
        }
      };
    };

    watch(() => props.brandName, (newBrandName) => {
      if (newBrandName) {
        fetchData();
      }
    }, { immediate: true });

    onMounted(() => {
      fetchData();
    });

    return {
      store,
      columns,
      rowKey,
      loading,
      checkedRowKeys,
      handlePageChange,
      handlePageSizeChange,
      navigateToCreateListener,
      getRowProps, // Expose getRowProps
    };
  }
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>
