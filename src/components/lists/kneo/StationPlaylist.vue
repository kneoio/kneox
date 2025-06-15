<template>
  <div class="station-playlist-view p-4">
    <n-page-header>
      <template #title>
        <n-h1>Playlist for {{ brandName }}</n-h1>
      </template>
      <template #footer>
        <span v-if="getAvailablePagination">Total: {{ getAvailablePagination.itemCount }}</span>
      </template>
    </n-page-header>

    <n-data-table
        v-if="loading || getAvailableSoundFragments.length > 0"
        :columns="columns"
        :row-key="rowKey"
        :data="getAvailableSoundFragments"
        :loading="loading"
        :remote="true"
        :pagination="false"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="handleCheckedRowKeysChange"
        class="mt-4"
    />
    <n-empty v-else description="No available sound fragments for this station." class="mt-4" />

    <n-pagination
        v-if="getAvailablePagination && getAvailablePagination.itemCount > 0"
        class="mt-4 justify-end"
        :page="getAvailablePagination.page"
        :page-size="getAvailablePagination.pageSize"
        :item-count="getAvailablePagination.itemCount"
        :page-sizes="getAvailablePagination.pageSizes"
        show-size-picker
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { NPageHeader, NH1, NDataTable, NEmpty, useMessage, DataTableColumns, NPagination } from 'naive-ui';
import { useSoundFragmentStore } from '../../../stores/kneo/soundFragmentStore';
import { SoundFragment } from '../../../types/kneoBroadcasterTypes';

const columns: DataTableColumns<SoundFragment> = [
  { type: 'selection' },
  {
    title: 'Title',
    key: 'title',
    sorter: (a: SoundFragment, b: SoundFragment) => a.title.localeCompare(b.title),
  },
  {
    title: 'Artist',
    key: 'artist',
    sorter: (a: SoundFragment, b: SoundFragment) => (a.artist || '').localeCompare(b.artist || ''),
  },
  {
    title: 'Album',
    key: 'album',
    sorter: (a: SoundFragment, b: SoundFragment) => (a.album || '').localeCompare(b.album || ''),
  }
];

export default defineComponent({
  name: 'StationPlaylistView',
  components: {
    NPageHeader,
    NH1,
    NDataTable,
    NEmpty,
    NPagination,
  },
  props: {
    brandName: {
      type: String,
      required: true,
    },
  },
  setup(props: { brandName: string }) { 
    const message = useMessage();
    const store = useSoundFragmentStore();
    const { getAvailableSoundFragments, getAvailablePagination } = storeToRefs(store);

    const loading = ref(false);
    const checkedRowKeys = ref<Array<string | number>>([]);

    const rowKey = (row: SoundFragment) => row.id ?? row.slugName;

    const fetchAvailableFragments = async (page?: number, pageSize?: number) => {
      if (!props.brandName) return;
      loading.value = true;
      try {
        const currentPage = page || getAvailablePagination.value?.page || 1;
        const currentPageSize = pageSize || getAvailablePagination.value?.pageSize || 10;
        await store.fetchAvailable(props.brandName, currentPage, currentPageSize);
      } catch (error) {
        console.error('Error fetching available sound fragments:', error);
        message.error('Failed to fetch available sound fragments.');
      } finally {
        loading.value = false;
      }
    };

    const handlePageChange = (newPage: number) => {
      fetchAvailableFragments(newPage, getAvailablePagination.value?.pageSize);
    };

    const handlePageSizeChange = (newPageSize: number) => {
      fetchAvailableFragments(1, newPageSize); // Reset to page 1
    };

    onMounted(() => {
      fetchAvailableFragments();
    });

    watch(() => props.brandName, (newBrandName) => {
      if (newBrandName) {
        fetchAvailableFragments(1); // Reset to page 1 for new brand
      }
    }, { immediate: true });

    const handleCheckedRowKeysChange = (keys: Array<string | number>) => {
      checkedRowKeys.value = keys;
    };

    return {
      loading,
      getAvailableSoundFragments,
      getAvailablePagination,
      columns,
      rowKey,
      checkedRowKeys,
      handleCheckedRowKeysChange,
      handlePageChange,
      handlePageSizeChange,
    };
  },
});
</script>

<style scoped>
</style>
