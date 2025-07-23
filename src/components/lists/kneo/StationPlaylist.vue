<template>
  <n-grid :cols="1" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Playlist for {{ brandName }}</template>
        <template #footer>
          <span v-if="getAvailablePagination">Total: {{ getAvailablePagination.itemCount }}</span>
        </template>
      </n-page-header>
    </n-gi>

    <n-gi>
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

    <n-gi>
      <n-data-table
          :columns="columns"
          :row-key="rowKey"
          :data="getAvailableSoundFragments"
          :loading="loading"
          :remote="true"
          :pagination="false"
          :row-props="getRowProps"
          :checked-row-keys="checkedRowKeys"
          @update:checked-row-keys="handleCheckedRowKeysChange"
      >
        <template #loading>
          <loader-icon />
        </template>
      </n-data-table>

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
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { NPageHeader, NDataTable, NEmpty, useMessage, DataTableColumns, NPagination, NButtonGroup, NButton, NGi, NGrid } from 'naive-ui';
import { useSoundFragmentStore } from '../../../stores/kneo/soundFragmentStore';
import { SoundFragment } from '../../../types/kneoBroadcasterTypes';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';

const columns: DataTableColumns<SoundFragment> = [
  { type: 'selection' },
  {
    title: 'Title',
    key: 'soundfragment.title'
  },
  {
    title: 'Artist',
    key: 'soundfragment.artist'
  },
  {
    title: 'Album',
    key: 'soundfragment.album'
  },
  {
    title: 'Played Count',
    key: 'playedByBrandCount',
    width: 120,
    render: (row: any) => row.playedByBrandCount ?? 0
  }
];

export default defineComponent({
  name: 'StationPlaylist',
  components: {
    NPageHeader,
    NDataTable,
    NEmpty,
    NPagination,
    NButtonGroup,
    NButton,
    NGi,
    NGrid,
    LoaderIcon,
  },
  props: {
    brandName: {
      type: String,
      required: true,
    },
  },
  setup(props: { brandName: string }) {
    const router = useRouter();
    const message = useMessage();
    const store = useSoundFragmentStore();
    const { getAvailableSoundFragments, getAvailablePagination } = storeToRefs(store);

    const loading = ref(true);
    const checkedRowKeys = ref<Array<string | number>>([]);
    const hasSelection = computed(() => checkedRowKeys.value.length > 0);

    const rowKey = (row: SoundFragment) => row.id ?? row.slugName;

    const getRowProps = (row: SoundFragment) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
            return;
          }
          router.push({ name: 'EditSoundFragment', params: { brandName: props.brandName, id: row.id } });
        }
      };
    };

    const fetchAvailableFragments = async (page?: number, pageSize?: number) => {
      if (!props.brandName) {
        return;
      }
      loading.value = true;
      try {
        const currentPage = page || getAvailablePagination.value?.page || 1;
        const currentPageSize = pageSize || getAvailablePagination.value?.pageSize || 10;
        await store.fetchAvailable(props.brandName, currentPage, currentPageSize);
      } catch (error) {
        message.error('Failed to fetch available sound fragments.');
      } finally {
        loading.value = false;
      }
    };

    const handlePageChange = (newPage: number) => {
      fetchAvailableFragments(newPage, getAvailablePagination.value?.pageSize);
    };

    const handlePageSizeChange = (newPageSize: number) => {
      fetchAvailableFragments(1, newPageSize);
    };

    onMounted(() => {
    });

    watch(() => props.brandName, (newBrandName) => {
      if (newBrandName) {
        fetchAvailableFragments(1);
      }
    }, { immediate: true });

    const handleCheckedRowKeysChange = (keys: Array<string | number>) => {
      checkedRowKeys.value = keys;
    };

    const handleNewClick = () => {
      router.push({ name: 'EditSoundFragment', params: { brandName: props.brandName, id: 'new' } });
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.info("No items selected for deletion.");
        return;
      }
      try {
        loading.value = true;
        await Promise.all(checkedRowKeys.value.map(id => store.delete(id.toString())));
        message.success(`Deleted ${checkedRowKeys.value.length} item(s) successfully`);
        checkedRowKeys.value = [];
        await fetchAvailableFragments(getAvailablePagination.value?.page, getAvailablePagination.value?.pageSize);
      } catch (error) {
        message.error('Failed to delete items');
      } finally {
        loading.value = false;
      }
    };

    return {
      loading,
      getAvailableSoundFragments,
      getAvailablePagination,
      columns,
      rowKey,
      getRowProps,
      checkedRowKeys,
      hasSelection,
      handleCheckedRowKeysChange,
      handlePageChange,
      handlePageSizeChange,
      handleNewClick,
      handleDelete,
    };
  },
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>