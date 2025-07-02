<template>
  <n-grid :cols="1" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>{{ brandName ? `Listeners for ${brandName}` : 'All Listeners' }}</template>
        <template #footer>
          Total: {{ totalCount }}
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
          :data="tableData"
          :pagination="paginationConfig"
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
import { defineComponent, onMounted, ref, watch, computed } from 'vue';
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
      required: false,
    },
  },
  setup(props) {
    const store = useListenersStore();
    const router = useRouter();

    const loading = ref(false);
    const checkedRowKeys = ref<Array<string | number>>([]);

    const tableData = computed(() => {
      const storeData = store.getEntries;
      if (Array.isArray(storeData)) {
        return storeData;
      }
      if (storeData?.payload?.viewData?.entries) {
        return storeData.payload.viewData.entries;
      }
      if (storeData?.viewData?.entries) {
        return storeData.viewData.entries;
      }
      if (storeData?.entries) {
        return storeData.entries;
      }
      return [];
    });

    const totalCount = computed(() => {
      const storeData = store.getEntries;
      if (storeData?.payload?.viewData?.count !== undefined) {
        return storeData.payload.viewData.count;
      }
      if (storeData?.viewData?.count !== undefined) {
        return storeData.viewData.count;
      }
      if (storeData?.count !== undefined) {
        return storeData.count;
      }
      return store.getPagination?.itemCount || 0;
    });

    const paginationConfig = computed(() => {
      const storeData = store.getEntries;
      let pageInfo = {};

      if (storeData?.payload?.viewData) {
        const viewData = storeData.payload.viewData;
        pageInfo = {
          page: viewData.pageNum || 1,
          pageSize: viewData.pageSize || 10,
          itemCount: viewData.count || 0,
          pageCount: viewData.maxPage || 1,
        };
      } else if (storeData?.viewData) {
        const viewData = storeData.viewData;
        pageInfo = {
          page: viewData.pageNum || 1,
          pageSize: viewData.pageSize || 10,
          itemCount: viewData.count || 0,
          pageCount: viewData.maxPage || 1,
        };
      } else {
        pageInfo = store.getPagination || {
          page: 1,
          pageSize: 10,
          itemCount: 0,
          pageCount: 1,
        };
      }

      return {
        ...pageInfo,
        showSizePicker: true,
        pageSizes: [10, 20, 50, 100],
      };
    });

    const columns: DataTableColumns<ListenerEntry> = [
      { type: 'selection' },
      {
        title: 'Nickname',
        key: 'listener.nickName.en',
        render: (row: ListenerEntry) => {
          return row.listener?.nickName?.en ||
              row.nickName?.en ||
              'N/A';
        }
      },
      {
        title: 'Country',
        key: 'listener.country',
        render: (row: ListenerEntry) => {
          return row.listener?.country ||
              row.country ||
              'N/A';
        }
      },
      {
        title: 'Registered',
        key: 'brandListener.regDate',
        render: (row: ListenerEntry) => {
          return row.listener?.regDate ||
              row.regDate ||
              'N/A';
        }
      }
    ];

    const rowKey = (row: ListenerEntry): string => {
      return row.listener?.id || row.id;
    };

    const fetchData = async (page = 1, pageSize = 10) => {
      try {
        loading.value = true;
        if (props.brandName) {
          await store.fetchListeners(props.brandName, page, pageSize);
        } else {
          await store.fetchAllListeners(page, pageSize);
        }
      } catch (error) {
        console.error('Failed to fetch listeners:', error);
      } finally {
        loading.value = false;
      }
    };

    const handlePageChange = (page: number) => {
      fetchData(page, paginationConfig.value.pageSize);
    };

    const handlePageSizeChange = (pageSize: number) => {
      fetchData(1, pageSize);
    };

    const navigateToCreateListener = () => {
      if (props.brandName) {
        router.push({ name: 'NewListener', params: { brandName: props.brandName } });
      } else {
        router.push({ name: 'NewListenerCommon' });
      }
    };

    const navigateToEditListener = (listenerId: string) => {
      if (props.brandName) {
        router.push({ name: 'EditListener', params: { brandName: props.brandName, listenerId } });
      } else {
        router.push({ name: 'EditListenerCommon', params: { listenerId } });
      }
    };

    const getRowProps = (row: ListenerEntry) => {
      return {
        style: 'cursor: pointer;',
        onClick: () => {
          const id = row.brandListener?.id || row.id;
          navigateToEditListener(id);
        }
      };
    };

    watch(() => props.brandName, () => {
      fetchData();
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
      tableData,
      totalCount,
      paginationConfig,
      handlePageChange,
      handlePageSizeChange,
      navigateToCreateListener,
      getRowProps,
    };
  }
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>