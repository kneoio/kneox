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

    <n-gi class="flex items-center flex-wrap gap-2">
      <n-button-group>
        <n-button @click="handleNewClick" type="primary" size="large">New</n-button>
        <n-button @click="handleBulkUploadClick" type="info" size="large">Bulk Upload</n-button>
        <n-button type="error" :disabled="!hasSelection" @click="handleDelete" size="large">
          Delete ({{ checkedRowKeys.length }})
        </n-button>
        <n-button @click="toggleFilters" type="default" size="large">
          <red-led :active="hasActiveFilters" style="margin-right: 8px;" />
          Filter
        </n-button>
      </n-button-group>

    </n-gi>

    <n-gi>
      <n-collapse-transition :show="showFilters">
        <div style="width: 50%;">
          <n-grid :cols="3" x-gap="12" y-gap="0">
            <n-gi :span="3">
              <n-form-item label="Search" :show-feedback="false">
                <n-input v-model:value="filters.searchTerm" placeholder="Search..." clearable />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="Genre" :show-feedback="false">
                <n-select v-model:value="filters.genre" :options="referencesStore.genreOptions" multiple filterable
                  placeholder="Select genres" clearable />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="Type" :show-feedback="false">
                <n-select v-model:value="filters.type" :options="referencesStore.fragmentTypeOptions"
                  placeholder="Select type" clearable />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="Source" :show-feedback="false">
                <n-select v-model:value="filters.source" :options="referencesStore.fragmentSourceOptions"
                  placeholder="Select source" clearable />
              </n-form-item>
            </n-gi>
          </n-grid>
        </div>
      </n-collapse-transition>
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

  <bulk-upload-dialog v-model:show="showBulkUploadDialog" :slugName="brandName"
    @upload-complete="handleUploadComplete" />
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, h } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { NPageHeader, NPagination, NInput, NDataTable, NEmpty, NButton, NButtonGroup, NFormItem, NSelect, NGrid, NGi, NCollapseTransition, useMessage } from 'naive-ui';
import { useSoundFragmentStore } from '../../../stores/kneo/soundFragmentStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { SoundFragment } from '../../../types/kneoBroadcasterTypes';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import RedLed from '../../common/RedLed.vue';
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
    BulkUploadDialog,
    NCollapseTransition,
    NFormItem,
    NSelect,
    NInput,
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

    const loading = ref( true );
    const checkedRowKeys = ref<Array<string | number>>( [] );
    const hasSelection = computed( () => checkedRowKeys.value.length > 0 );
    const hasActiveFilters = computed( () =>
      !!( filters.value.searchTerm || filters.value.genre?.length > 0 || filters.value.type || filters.value.source )
    );
    const showBulkUploadDialog = ref( false );
    const STORAGE_KEY = `stationplaylist.${props.brandName}.filters`;
    const STORAGE_SHOW_KEY = `stationplaylist.${props.brandName}.showFilters`;

    const showFilters = ref( false );
    const filters = ref<{ searchTerm: string; genre: string[]; type?: string; source?: string }>( {
      searchTerm: '',
      genre: [],
      type: undefined,
      source: undefined,
    } );

    const loadSavedFilters = () => {
      try {
        const s = localStorage.getItem( STORAGE_KEY );
        if ( s ) {
          const obj = JSON.parse( s );
          filters.value = {
            searchTerm: obj.searchTerm || '',
            genre: obj.genre || [],
            type: obj.type,
            source: obj.source
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
        if ( showFilters.value ) {
          const hasFilters = filters.value.searchTerm || ( filters.value.genre && filters.value.genre.length > 0 ) || filters.value.type || filters.value.source;
          if ( hasFilters ) {
            activeFilters = filters.value;
          } else {
            return;
          }
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
        await referencesStore.fetchGenres();
      } catch ( error ) {
        console.error( 'Failed to fetch genres:', error );
      }
    };

    initializeData();

    watch( () => props.brandName, ( newBrandName ) => {
      if ( newBrandName ) {
        loadSavedFilters();
        fetchAvailableFragments( 1 );
      }
    }, { immediate: true } );

    watch( () => filters.value, () => {
      saveFilters();
      fetchAvailableFragments( 1, getAvailablePagination.value?.pageSize );
    }, { deep: true } );

    watch( showFilters, () => {
      saveFilters();
    } );


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

    const toggleFilters = () => {
      showFilters.value = !showFilters.value;
      if ( !showFilters.value ) {
        filters.value = {
          searchTerm: '',
          genre: [],
          type: undefined,
          source: undefined
        };
      }
      saveFilters();
      fetchAvailableFragments( 1, getAvailablePagination.value?.pageSize );
    };

    const columns = computed<DataTableColumns<any>>( () => [
      { type: 'selection' },
      { title: 'Title', key: 'soundfragment.title', width: 300 },
      { title: 'Artist', key: 'soundfragment.artist', width: 300 },
      { title: 'Album', key: 'soundfragment.album', width: 300 },
      { title: 'Source', key: 'soundfragment.source', width: 140, render: ( row: any ) => store.formatSource( row.soundfragment?.source ) },
      { title: 'Played Count', key: 'playedByBrandCount', width: 120, render: ( row: any ) => row.playedByBrandCount ?? 0 },
      { title: 'Description', key: 'soundfragment.description', ellipsis: { tooltip: true }, minWidth: 200 }
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
      toggleFilters,
    };
  },
} );
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>