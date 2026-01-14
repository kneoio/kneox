<template>
  <n-grid :cols="1" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Playlist for {{ brandName }}</template>
        <template #footer>
          <span v-if=" getAvailablePagination ">Total: {{ getAvailablePagination.itemCount }}</span>
        </template>
      </n-page-header>
    </n-gi>

    <n-gi>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
        <n-button-group>
          <n-button @click="handleNewClick" type="primary" size="large">New</n-button>
          <n-button @click="handleBulkUploadClick" type="info" size="large">Bulk Upload</n-button>
          <n-button type="error" :disabled="!hasSelection" @click="handleDelete" size="large">
            Delete ({{ checkedRowKeys.length }})
          </n-button>
          <n-button @click="openFilterDialog" type="default" size="large">
            <red-led :active="hasActiveFilters" style="margin-right: 8px;" />
            Filter
          </n-button>
          <n-button @click="resetFilters" type="default" size="large" :disabled="!hasActiveFilters">
            Reset
          </n-button>
        </n-button-group>
        <n-input 
          v-model:value="filters.searchTerm" 
          placeholder="Search..." 
          clearable
          @update:value="onSearchChange"
          style="width: 200px;"
          size="large"
        />
      </div>
    </n-gi>

    <n-gi>
      <div v-if="filterSummary" class="filter-summary">
        {{ filterSummary }}
      </div>
    </n-gi>

    <n-gi>
      <n-data-table :columns="columns" :row-key="rowKey" :data="getAvailableSoundFragments" :loading="loading"
        :remote="true" :pagination="getAvailablePagination" :row-props="getRowProps" :bordered="false"
        v-model:checked-row-keys="checkedRowKeys" @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange">
        <template #loading>
          <loader-icon />
        </template>
      </n-data-table>
    </n-gi>
  </n-grid>

  <!-- Filter Dialog -->
  <n-modal v-model:show="showFilterDialog" preset="dialog" title="Filter Options" :style="{ backgroundColor: dialogBackgroundColor }">
    <n-space vertical>
      <n-form-item label="Search" :show-feedback="false">
        <n-input v-model:value="dialogFilters.searchTerm" placeholder="Search..." clearable />
      </n-form-item>
      <n-form-item label="Genre" :show-feedback="false">
        <n-select v-model:value="dialogFilters.genre" :options="referencesStore.genreOptions" multiple filterable
          placeholder="Select genres" clearable />
      </n-form-item>
      <n-form-item label="Labels" :show-feedback="false">
        <n-select v-model:value="dialogFilters.labels" :options="referencesStore.labelOptions" multiple filterable
          placeholder="Select labels" clearable />
      </n-form-item>
      <n-form-item label="Type" :show-feedback="false">
        <n-select v-model:value="dialogFilters.type" :options="referencesStore.fragmentTypeOptions" multiple
          placeholder="Select types" clearable />
      </n-form-item>
      <n-form-item label="Source" :show-feedback="false">
        <n-select v-model:value="dialogFilters.source" :options="referencesStore.fragmentSourceOptions" multiple
          placeholder="Select sources" clearable />
      </n-form-item>
    </n-space>
    <template #action>
      <n-space>
        <n-button @click="clearDialogFilters">Clear</n-button>
        <n-button @click="showFilterDialog = false">Cancel</n-button>
        <n-button type="primary" @click="applyDialogFilters">OK</n-button>
      </n-space>
    </template>
  </n-modal>

  <bulk-upload-dialog v-model:show="showBulkUploadDialog" :slugName="brandName"
    @upload-complete="handleUploadComplete" />
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, h } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { NPageHeader, NPagination, NInput, NDataTable, NEmpty, NButton, NButtonGroup, NFormItem, NSelect, NGrid, NGi, NCollapseTransition, NModal, NSpace, useMessage } from 'naive-ui';
import { useDialogBackground } from '../../../composables/useDialogBackground';
import { useSoundFragmentStore } from '../../../stores/kneo/soundFragmentStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { SoundFragment } from '../../../types/kneoBroadcasterTypes';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import RedLed from '../../common/RedLed.vue';
import RatingBar from '../../common/RatingBar.vue';
import BulkUploadDialog from '../../dialogs/BulkUploadDialog.vue';

// columns moved into setup to access store for formatting

export default defineComponent( {
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
    RedLed,
    RatingBar,
    BulkUploadDialog,
    NCollapseTransition,
    NFormItem,
    NSelect,
    NInput,
    NModal,
    NSpace,
  },
  props: {
    brandName: {
      type: String,
      required: true,
    },
  },
  setup( props: { brandName: string } ) {
    const router = useRouter();
    const message = useMessage();
    const store = useSoundFragmentStore();
    const { getAvailableSoundFragments, getAvailablePagination } = storeToRefs( store );
    const referencesStore = useReferencesStore();
    const { dialogBackgroundColor } = useDialogBackground();

    const loading = ref( true );
    const checkedRowKeys = ref<Array<string | number>>( [] );
    const hasSelection = computed( () => checkedRowKeys.value.length > 0 );
    const hasActiveFilters = computed( () =>
      !!( filters.value.searchTerm || filters.value.genre?.length > 0 || filters.value.labels?.length > 0 || filters.value.type?.length > 0 || filters.value.source?.length > 0 )
    );
    const showFilterDialog = ref(false);
    const dialogFilters = ref({
      searchTerm: '',
      genre: [] as string[],
      labels: [] as string[],
      type: [] as string[],
      source: [] as string[]
    });
    const showBulkUploadDialog = ref( false );
    const STORAGE_KEY = `stationplaylist.${props.brandName}.filters`;
    const STORAGE_SHOW_KEY = `stationplaylist.${props.brandName}.showFilters`;

    const showFilters = ref( false );
    const filters = ref({
      searchTerm: '',
      genre: [] as string[],
      labels: [] as string[],
      type: [] as string[],
      source: [] as string[]
    });

    const loadSavedFilters = () => {
      try {
        const s = localStorage.getItem( STORAGE_KEY );
        if ( s ) {
          const obj = JSON.parse( s );
          filters.value = {
            searchTerm: obj.searchTerm || '',
            genre: obj.genre || [],
            labels: obj.labels || [],
            type: obj.type || [],
            source: obj.source || []
          };
        }
        const sh = localStorage.getItem( STORAGE_SHOW_KEY );
        if ( sh === 'true' ) showFilters.value = true;
      } catch { }
    };

    const saveFilters = () => {
      try {
        localStorage.setItem( STORAGE_KEY, JSON.stringify( filters.value ) );
        localStorage.setItem( STORAGE_SHOW_KEY, String( showFilters.value ) );
      } catch { }
    };


    const rowKey = ( row: SoundFragment ) => row.id ?? row.slugName;

    const getRowProps = ( row: SoundFragment ) => {
      return {
        style: 'cursor: pointer;',
        onClick: ( e: MouseEvent ) => {
          const target = e.target as HTMLElement;
          if ( target.closest( '.n-checkbox' ) || target.closest( '[data-n-checkbox]' ) ) {
            return;
          }
          router.push( { name: 'EditSoundFragment', params: { brandName: props.brandName, id: row.id }, query: { returnTo: 'StationPlaylist' } } );
        }
      };
    };

    const fetchAvailableFragments = async ( page?: number, pageSize?: number ) => {
      if ( !props.brandName ) {
        return;
      }
      loading.value = true;
      try {
        let activeFilters: any = {};
        const hasFilters = filters.value.searchTerm || filters.value.genre?.length > 0 || filters.value.labels?.length > 0 || filters.value.type?.length > 0 || filters.value.source?.length > 0;
        if ( hasFilters ) {
          activeFilters = filters.value;
        }
        const currentPage = page || getAvailablePagination.value?.page || 1;
        const currentPageSize = pageSize || getAvailablePagination.value?.pageSize || 10;
        await store.fetchAvailableSoundFragments( props.brandName, currentPage, currentPageSize, activeFilters );
      } catch ( error ) {
        message.error( 'Failed to fetch available sound fragments.' );
      } finally {
        loading.value = false;
      }
    };

    const handlePageChange = ( newPage: number ) => {
      fetchAvailableFragments( newPage, getAvailablePagination.value?.pageSize );
    };

    const handlePageSizeChange = ( newPageSize: number ) => {
      fetchAvailableFragments( 1, newPageSize );
    };

    const initializeData = async () => {
      try {
        await Promise.all([
          referencesStore.fetchGenres(),
          referencesStore.fetchLabels()
        ]);
      } catch ( error ) {
        console.error( 'Failed to fetch references:', error );
      }
    };

    initializeData();

    watch( () => props.brandName, ( newBrandName ) => {
      if ( newBrandName ) {
        loadSavedFilters();
        fetchAvailableFragments( 1 );
      }
    }, { immediate: true } );



    const handleCheckedRowKeysChange = ( keys: Array<string | number> ) => {
      checkedRowKeys.value = keys;
    };

    const handleNewClick = () => {
      router.push( { name: 'EditSoundFragment', params: { brandName: props.brandName, id: 'new' }, query: { returnTo: 'StationPlaylist' } } );
    };

    const handleDelete = async () => {
      if ( checkedRowKeys.value.length === 0 ) {
        message.info( "No items selected for deletion." );
        return;
      }
      try {
        loading.value = true;
        await Promise.all( checkedRowKeys.value.map( id => store.delete( id.toString() ) ) );
        message.success( `Deleted ${checkedRowKeys.value.length} item(s) successfully` );
        checkedRowKeys.value = [];
        await fetchAvailableFragments( getAvailablePagination.value?.page, getAvailablePagination.value?.pageSize );
      } catch ( error ) {
        message.error( 'Failed to delete items' );
      } finally {
        loading.value = false;
      }
    };

    const handleBulkUploadClick = () => {
      showBulkUploadDialog.value = true;
    };

    const handleUploadComplete = () => {
      fetchAvailableFragments( getAvailablePagination.value?.page, getAvailablePagination.value?.pageSize );
    };

    const openFilterDialog = () => {
      dialogFilters.value = {
        searchTerm: filters.value.searchTerm,
        genre: [...filters.value.genre],
        labels: [...filters.value.labels],
        type: [...filters.value.type],
        source: [...filters.value.source]
      };
      showFilterDialog.value = true;
    };

    const applyDialogFilters = () => {
      filters.value = {
        searchTerm: dialogFilters.value.searchTerm,
        genre: [...dialogFilters.value.genre],
        labels: [...dialogFilters.value.labels],
        type: [...dialogFilters.value.type],
        source: [...dialogFilters.value.source]
      };
      showFilterDialog.value = false;
      saveFilters();
      fetchAvailableFragments(1, getAvailablePagination.value?.pageSize);
    };

    const clearDialogFilters = () => {
      dialogFilters.value = {
        searchTerm: '',
        genre: [],
        labels: [],
        type: [],
        source: []
      };
    };

    const resetFilters = () => {
      filters.value = {
        searchTerm: '',
        genre: [],
        labels: [],
        type: [],
        source: []
      };
      saveFilters();
      fetchAvailableFragments(1, getAvailablePagination.value?.pageSize);
    };

    const onSearchChange = () => {
      saveFilters();
      fetchAvailableFragments(1, getAvailablePagination.value?.pageSize);
    };

    const filterSummary = computed(() => {
      const parts: string[] = [];
      if (filters.value.searchTerm) {
        parts.push(`Search: "${filters.value.searchTerm}"`);
      }
      if (filters.value.genre?.length > 0) {
        const names = filters.value.genre.map(id => referencesStore.genreOptions.find(o => o.value === id)?.label || id).join(', ');
        parts.push(`Genre: ${names}`);
      }
      if (filters.value.labels?.length > 0) {
        const names = filters.value.labels.map(id => referencesStore.labelOptions.find(o => o.value === id)?.label || id).join(', ');
        parts.push(`Labels: ${names}`);
      }
      if (filters.value.type?.length > 0) {
        const names = filters.value.type.map(id => referencesStore.fragmentTypeOptions.find(o => o.value === id)?.label || id).join(', ');
        parts.push(`Type: ${names}`);
      }
      if (filters.value.source?.length > 0) {
        const names = filters.value.source.map(id => referencesStore.fragmentSourceOptions.find(o => o.value === id)?.label || id).join(', ');
        parts.push(`Source: ${names}`);
      }
      return parts.join(' | ');
    });

    const rateSoundFragment = async ( row: any, action: 'LIKE' | 'DISLIKE' ) => {
      const id = row.id;
      try {
        await store.rateSoundFragment( id, props.brandName, action );
        await fetchAvailableFragments( getAvailablePagination.value?.page, getAvailablePagination.value?.pageSize );
      } catch ( error: any ) {
        const errorData = error?.response?.data;
        if ( errorData ) {
          message.error( typeof errorData === 'string' ? errorData : JSON.stringify( errorData ) );
        } else {
          message.error( error?.message || 'Request failed' );
        }
      }
    };

    const columns = computed<DataTableColumns<any>>( () => [
      { type: 'selection' },
      { title: 'Title', key: 'title', width: 300 },
      { title: 'Artist', key: 'artist', width: 300 },
      { title: 'Genres', key: 'genres', width: 200, render: ( row: any ) => {
        if (!row.genres || row.genres.length === 0) return '';
        return h('div', { style: 'display: flex; flex-wrap: wrap; gap: 4px;' }, 
          row.genres.map((genre: any) => 
            h('span', { 
              style: `background-color: ${genre.color}; color: ${genre.fontColor}; padding: 2px 8px; border-radius: 2px; font-size: 12px; white-space: nowrap;` 
            }, genre.identifier)
          )
        );
      }},
      { title: 'Labels', key: 'labels', width: 200, render: ( row: any ) => {
        if (!row.labels || row.labels.length === 0) return '';
        return h('div', { style: 'display: flex; flex-wrap: wrap; gap: 4px;' }, 
          row.labels.map((label: any) => 
            h('span', { 
              style: `background-color: ${label.color}; color: ${label.fontColor}; padding: 2px 8px; border-radius: 2px; font-size: 12px; white-space: nowrap;` 
            }, label.identifier)
          )
        );
      }},
      { title: 'Source', key: 'source', width: 140, render: ( row: any ) => store.formatSource( row?.source ) },
      { title: 'Played Count', key: 'playedByBrandCount', width: 120, render: ( row: any ) => row.playedByBrandCount ?? 0 },
      { 
        title: 'Rating', 
        key: 'ratedByBrandCount', 
        width: 280, 
        render: ( row: any ) => {
          const ratedByBrandCount = row.ratedByBrandCount ?? 100;
          const rating = ratedByBrandCount;
          const displayValue = rating - 100;
          const ratingText = displayValue > 0 ? `+${displayValue}` : `${displayValue}`;
          return h( 'div', { style: 'display: flex; align-items: center; gap: 4px;', title: ratingText }, [
            h( NButton, {
              size: 'tiny',
              tertiary: true,
              onClick: ( e: MouseEvent ) => {
                e.stopPropagation();
                rateSoundFragment( row, 'DISLIKE' );
              }
            }, { default: () => '-' } ),
            h( RatingBar, { value: rating, segments: 10, height: 8 } ),
            h( 'span', { style: 'font-size: 11px; color: #999; margin-left: 4px;' }, displayValue ),
            h( NButton, {
              size: 'tiny',
              tertiary: true,
              onClick: ( e: MouseEvent ) => {
                e.stopPropagation();
                rateSoundFragment( row, 'LIKE' );
              }
            }, { default: () => '+' } )
          ] );
        }
      },
      { title: 'Description', key: 'description', ellipsis: { tooltip: true }, minWidth: 200 }
    ] );

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
      showBulkUploadDialog,
      handleBulkUploadClick,
      handleUploadComplete,
      referencesStore,
      showFilters,
      filters,
      hasActiveFilters,
      showFilterDialog,
      dialogFilters,
      openFilterDialog,
      applyDialogFilters,
      clearDialogFilters,
      resetFilters,
      onSearchChange,
      filterSummary,
      dialogBackgroundColor,
    };
  },
} );
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
.filter-summary {
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}
</style>