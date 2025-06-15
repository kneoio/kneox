<template>
  <div class="station-playlist-view p-4">
    <n-page-header>
      <template #title>
        <n-h1>Playlist for {{ brandName }}</n-h1>
      </template>
      <template #footer>
        <!-- Placeholder for total items, similar to SoundFragments -->
        <!-- Total: {{ store.getPagination.itemCount }} -->
      </template>
    </n-page-header>

    <!-- Placeholder for action buttons, if needed -->
    <!-- <n-button-group class="mb-4">
      <n-button @click="handleNewClick" type="primary" size="large">New Item</n-button>
      <n-button type="error" :disabled="!hasSelection" @click="handleDelete" size="large">
        Delete ({{ checkedRowKeys.length }})
      </n-button>
    </n-button-group> -->

    <n-data-table
        v-if="playlistItems.length > 0"
        remote
        :columns="columns"
        :row-key="rowKey"
        :data="playlistItems"
        :loading="loading"
        :pagination="pagination"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        @update:sorter="handleSorterChange"
        @update:filters="handleFiltersChange"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="handleCheckedRowKeysChange"
        class="mt-4"
    />
    <n-empty v-else description="No playlist items available for this station." class="mt-4" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { NPageHeader, NH1, NDataTable, NEmpty, useMessage, DataTableColumns } from 'naive-ui';
// import { usePlaylistStore } // Assuming a store for playlist data might be created

// Define a type for playlist items (example)
interface PlaylistItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  // Add other relevant fields
}

// Define columns outside setup to avoid potential reactivity/inference issues
const columns: DataTableColumns<PlaylistItem> = [
  { type: 'selection' },
  {
    title: 'Title',
    key: 'title',
    sorter: (a: PlaylistItem, b: PlaylistItem) => a.title.localeCompare(b.title),
  },
  {
    title: 'Artist',
    key: 'artist',
    sorter: (a: PlaylistItem, b: PlaylistItem) => a.artist.localeCompare(b.artist),
  },
  {
    title: 'Album',
    key: 'album',
    sorter: (a: PlaylistItem, b: PlaylistItem) => a.album.localeCompare(b.album),
  },
  { title: 'Duration', key: 'duration' },
  // Add more columns as needed
];

export default defineComponent({
  name: 'StationPlaylistView',
  components: {
    NPageHeader,
    NH1,
    NDataTable,
    NEmpty,
    // NButton,
    // NButtonGroup,
  },
  props: {
    brandName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const message = useMessage();
    // const store = usePlaylistStore(); // If using a Pinia store

    const loading = ref(false);
    const playlistItems = ref<PlaylistItem[]>([]);
    const checkedRowKeys = ref<Array<string | number>>([]);



    const rowKey = (row: PlaylistItem) => row.id;

    const pagination = ref({
      page: 1,
      pageSize: 10,
      itemCount: 0,
      showSizePicker: true,
      pageSizes: [10, 20, 50],
    });

    const fetchPlaylistData = async () => {
      if (!props.brandName) return;
      loading.value = true;
      try {
        // Replace with actual API call to fetch playlist for props.brandName
        // Example: const data = await apiClient.get(`/api/stations/${props.brandName}/playlist`, { params: { page: pagination.value.page, pageSize: pagination.value.pageSize } });
        // playlistItems.value = data.items;
        // pagination.value.itemCount = data.total;

        // Dummy data for now:
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        const exampleData: PlaylistItem[] = [
          { id: '1', title: 'Song A', artist: 'Artist X', album: 'Album One', duration: '3:45' },
          { id: '2', title: 'Song B', artist: 'Artist Y', album: 'Album Two', duration: '4:15' },
          { id: '3', title: 'Song C', artist: 'Artist Z', album: 'Album Three', duration: '2:50' },
        ];
        playlistItems.value = exampleData;
        pagination.value.itemCount = exampleData.length;
        message.success(`Fetched playlist for ${props.brandName}`);
      } catch (error) {
        console.error('Error fetching playlist data:', error);
        message.error('Failed to fetch playlist data.');
        playlistItems.value = [];
        pagination.value.itemCount = 0;
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchPlaylistData();
    });

    watch(() => props.brandName, (newBrandName) => {
      if (newBrandName) {
        pagination.value.page = 1; // Reset page on brandName change
        fetchPlaylistData();
      }
    });

    const handlePageChange = (page: number) => {
      pagination.value.page = page;
      fetchPlaylistData();
    };

    const handlePageSizeChange = (pageSize: number) => {
      pagination.value.pageSize = pageSize;
      pagination.value.page = 1; // Reset to first page when page size changes
      fetchPlaylistData();
    };

    const handleSorterChange = (sorter: any) => {
      // Implement sorting logic if backend supports it
      console.log('Sorter changed:', sorter);
      fetchPlaylistData(); // Refetch with new sorting params
    };

    const handleFiltersChange = (filters: any) => {
      // Implement filtering logic if backend supports it
      console.log('Filters changed:', filters);
      fetchPlaylistData(); // Refetch with new filter params
    };

    const handleCheckedRowKeysChange = (keys: Array<string | number>) => {
      checkedRowKeys.value = keys;
    };

    // const hasSelection = computed(() => checkedRowKeys.value.length > 0);

    // const handleNewClick = () => {
    //   console.log('New playlist item for:', props.brandName);
    //   // Navigate to a form or open a modal
    // };

    // const handleDelete = () => {
    //   if (checkedRowKeys.value.length > 0) {
    //     message.info(`Deleting ${checkedRowKeys.value.length} items for ${props.brandName}.`);
    //     // Call API to delete items
    //   }
    // };

    return {
      loading,
      playlistItems,
      columns,
      rowKey,
      pagination,
      checkedRowKeys,
      handlePageChange,
      handlePageSizeChange,
      handleSorterChange,
      handleFiltersChange,
      handleCheckedRowKeysChange,
      // hasSelection,
      // handleNewClick,
      // handleDelete,
    };
  },
});
</script>

<style scoped>
/* Add any specific styles for StationPlaylistView here if needed */
</style>
