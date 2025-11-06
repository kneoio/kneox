<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>{{ brandName ? `${brandName} Sound Fragments` : 'Sound Fragments' }}</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6" class="flex items-center flex-wrap gap-2">
      <n-button-group class="mr-4">
        <n-button @click="handleNewClick" type="primary" :size="isMobile ? 'medium' : 'large'">New</n-button>
        <n-button type="error" :disabled="!hasSelection" @click="handleDelete" :size="isMobile ? 'medium' : 'large'">
          Delete ({{ checkedRowKeys.length }})
        </n-button>
        <n-button type="primary" :disabled="!hasSelection" @click="handleBulkBrandUpdate" :size="isMobile ? 'medium' : 'large'">
          Update Brands ({{ checkedRowKeys.length }})
        </n-button>
      </n-button-group>

      <n-button @click="toggleFilters" type="default" :size="isMobile ? 'medium' : 'large'" class="mr-4">
        Filter
      </n-button>

      <n-input v-model:value="searchQuery" placeholder="Search..." clearable :size="isMobile ? 'medium' : 'large'" :style="{ width: isMobile ? '100%' : '250px' }"
        @keydown.enter="handleSearch" @clear="handleSearch" />
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-collapse-transition :show="showFilters">
        <div :style="{ width: isMobile ? '100%' : '50%' }">
          <n-grid :cols="isMobile ? 1 : 3" x-gap="12" y-gap="0">
            <n-gi>
              <n-form-item label="Genre" size="small" :show-feedback="false">
                <n-select v-model:value="filters.genre" :options="referencesStore.genreOptions" multiple filterable
                  placeholder="Select genres" clearable />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="Type" size="small" :show-feedback="false">
                <n-select v-model:value="filters.type" :options="typeOptions" placeholder="Select type" clearable />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="Source" size="small" :show-feedback="false">
                <n-select v-model:value="filters.source" :options="sourceOptions" placeholder="Select source"
                  clearable />
              </n-form-item>
            </n-gi>
          </n-grid>

        </div>
      </n-collapse-transition>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-data-table remote :columns="columns" :row-key="rowKey" :data="store.getEntries"
        :pagination="store.getPagination" :bordered="false" :row-props="getRowProps" :loading="loading" :size="isMobile ? 'small' : 'large'"
        v-model:checked-row-keys="checkedRowKeys" @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange">
        <template #loading>
          <loader-icon />
        </template>
      </n-data-table>
    </n-gi>
  </n-grid>

  <!-- Bulk Brand Update Dialog -->
  <n-modal v-model:show="showBrandUpdateDialog" preset="dialog" title="Bulk Brand Update" :style="{ backgroundColor: dialogBackgroundColor }">
    <n-space vertical>
      <n-form-item label="Operation">
        <n-radio-group v-model:value="brandUpdateOperation">
          <n-radio value="SET">Set Brands</n-radio>
          <n-radio value="UNSET">Remove All Brands</n-radio>
        </n-radio-group>
      </n-form-item>
      
      <n-form-item v-if="brandUpdateOperation === 'SET'" label="Select Brands">
        <n-select 
          v-model:value="selectedBrands" 
          :options="brandOptions" 
          multiple 
          filterable 
          placeholder="Select brands to assign" 
          clearable 
        />
      </n-form-item>
      
      <n-text depth="3">
        This will update {{ checkedRowKeys.length }} sound fragment(s).
      </n-text>
    </n-space>
    
    <template #action>
      <n-space>
        <n-button @click="showBrandUpdateDialog = false">Cancel</n-button>
        <n-button 
          type="primary" 
          @click="confirmBrandUpdate" 
          :disabled="brandUpdateOperation === 'SET' && (!selectedBrands || selectedBrands.length === 0)"
        >
          Update
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts">
import { computed, defineComponent, h, onMounted, ref, onUnmounted, watch } from 'vue';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NCard,
  NCollapseTransition,
  NDataTable,
  NFormItem,
  NGi,
  NGrid,
  NIcon,
  NInput,
  NModal,
  NPageHeader,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NText,
  useMessage
} from 'naive-ui';
import { useRouter } from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import { SoundFragment, FragmentType } from "../../../types/kneoBroadcasterTypes";
import { useSoundFragmentStore } from '../../../stores/kneo/soundFragmentStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { useRadioStationStore } from '../../../stores/kneo/radioStationStore';
import { useDialogBackground } from '../../../composables/useDialogBackground';

export default defineComponent( {
  name: 'SoundFragments',
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, NIcon, NInput, NCard, NFormItem, NSelect, NCollapseTransition, NSpace, NModal, NRadio, NRadioGroup, NText },
  props: {
    brandName: {
      type: String,
      required: false
    }
  },
  setup( props ) {
    const router = useRouter();
    const store = useSoundFragmentStore();
    const referencesStore = useReferencesStore();
    const radioStationStore = useRadioStationStore();
    const { dialogBackgroundColor } = useDialogBackground();
    const isMobile = ref( window.innerWidth < 768 );
    const loading = ref( false );
    const intervalId = ref<number | null>( null );
    const checkedRowKeys = ref<( string | number )[]>( [] );
    const hasSelection = computed( () => checkedRowKeys.value.length > 0 );
    const message = useMessage();
    const searchQuery = ref( '' );
    const debounceTimer = ref<number | null>( null );
    const showFilters = ref( false );
    const filters = ref( {
      genre: [],
      type: undefined,
      source: undefined
    } );

    const showBrandUpdateDialog = ref(false);
    const brandUpdateOperation = ref<'SET' | 'UNSET'>('SET');
    const selectedBrands = ref<string[]>([]);

    const typeOptions = [
      { label: 'Song', value: FragmentType.SONG }
    ];

    const sourceOptions = [
      { label: 'Users Upload', value: 'USER_UPLOAD' },
      { label: 'Recovered', value: 'RECOVERED_FROM_SPACES' },
      { label: 'Recovered', value: 'ORPHAN_RECOVERY' },
      { label: 'Generative prompt', value: 'SUNO_PROMPT' },
      { label: 'Text to Speach', value: 'TEXT_FOR_TTS' }
    ];

    const brandOptions = computed(() => radioStationStore.getEntries.map(brand => ({
      label: brand.slugName,
      value: brand.slugName
    })));

    const handleBulkBrandUpdate = () => {
      if (checkedRowKeys.value.length === 0) {
        message.info("No items selected for brand update.");
        return;
      }
      showBrandUpdateDialog.value = true;
      brandUpdateOperation.value = 'SET';
      selectedBrands.value = [];
    };

    const confirmBrandUpdate = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.info("No items selected for brand update.");
        return;
      }
      
      try {
        loading.value = true;
        const documentIds = checkedRowKeys.value.map(id => id.toString());
        const brands = brandUpdateOperation.value === 'SET' ? selectedBrands.value : [];
        
        const result = await store.bulkBrandUpdate(documentIds, brands, brandUpdateOperation.value);
        
        message.success(`Updated ${result.updatedCount} sound fragment(s) successfully`);
        showBrandUpdateDialog.value = false;
        checkedRowKeys.value = [];
        await fetchData(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        message.error('Failed to update brands');
      } finally {
        loading.value = false;
      }
    };

    async function preFetch() {
      try {
        loading.value = true;
        await Promise.all( [
          store.fetchAll(),
          referencesStore.fetchGenres(),
          radioStationStore.fetchAll()
        ] );
      } catch ( error ) {
        console.error( 'Failed to fetch initial data:', error );
      } finally {
        loading.value = false;
      }
    }

    const startPeriodicRefresh = () => {
      if ( !intervalId.value ) {
        intervalId.value = window.setInterval( async () => {
          try {
            await fetchData( store.getPagination.page, store.getPagination.pageSize );
          } catch ( error ) {
            console.error( 'Periodic refresh failed:', error );
          }
        }, 30000 );
      }
    };

    const stopPeriodicRefresh = () => {
      if ( intervalId.value ) {
        clearInterval( intervalId.value );
        intervalId.value = null;
      }
    };

    const handleResize = () => {
      isMobile.value = window.innerWidth < 768;
    };

    preFetch();
    startPeriodicRefresh();

    onMounted( () => {
      window.addEventListener( 'resize', handleResize );
    } );

    onUnmounted( () => {
      stopPeriodicRefresh();
      window.removeEventListener( 'resize', handleResize );
    } );

    const columns = computed<DataTableColumns<SoundFragment>>( () => {
      // Mobile: selection + combined stacked column
      if (isMobile.value) {
        return [
          { type: 'selection', fixed: 'left', width: 50 },
          {
            title: 'Fragment',
            key: 'combined',
            minWidth: 260,
            render: (row: SoundFragment) => {
              const lines: any[] = [];
              lines.push(h('div', { style: 'font-weight: 600;' }, row.title || '—'));
              if (row.artist) lines.push(h('div', { style: 'font-size: 12px; color: #888;' }, row.artist));
              if (row.description) lines.push(h('div', { class: 'ellipsis-cell', title: String(row.description) }, String(row.description)));
              return h('div', {}, lines);
            }
          }
        ];
      }

      // Desktop: multi-column with minWidth + ellipsis
      const cols: DataTableColumns<SoundFragment> = [
        { type: 'selection', fixed: 'left', width: 50 },
        { title: 'Title', key: 'title', minWidth: 200, ellipsis: { tooltip: true } },
        { title: 'Artist', key: 'artist', minWidth: 160, ellipsis: { tooltip: true } },
        { title: 'Source', key: 'source', minWidth: 120, render: (row: SoundFragment) => store.formatSource(row.source as any) },
        { title: 'Type', key: 'type', minWidth: 120 },
        { title: 'Description', key: 'description', ellipsis: { tooltip: true }, minWidth: 280 }
      ];
      return cols;
    } );

    const getRowProps = ( row: SoundFragment ) => {
      return {
        style: 'cursor: pointer;',
        onClick: ( e: MouseEvent ) => {
          const target = e.target as HTMLElement;
          if ( target.closest( '.n-checkbox' ) || target.closest( '[data-n-checkbox]' ) ) {
            return;
          }
          if ( props.brandName ) {
            router.push( { name: 'EditSoundFragment', params: { brandName: props.brandName, id: row.id } } );
          } else {
            router.push( { name: 'SoundFragment', params: { id: row.id } } );
          }
        }
      };
    };

    const rowKey = ( row: SoundFragment ): string | number => {
      return row.id ?? row.slugName;
    };

    const fetchData = async ( page = 1, pageSize = 10 ) => {
      try {
        loading.value = true;
        let activeFilters = {};
        if ( showFilters.value ) {
          const hasFilters = filters.value.genre?.length > 0 || filters.value.type || filters.value.source;
          if ( hasFilters ) {
            activeFilters = filters.value;
          } else {
            return;
          }
        }
        await store.fetchAll( page, pageSize, searchQuery.value, activeFilters );
      } catch ( error ) {
        console.error( 'Failed to fetch data:', error );
      } finally {
        loading.value = false;
      }
    };

    const handleSearch = () => {
      fetchData( 1, store.getPagination.pageSize );
    };

    const toggleFilters = () => {
      showFilters.value = !showFilters.value;
      fetchData( 1, store.getPagination.pageSize );
    };

    const clearFilters = () => {
      filters.value = {
        genre: [],
        type: undefined,
        source: undefined
      };
      applyFilters();
    };

    const applyFilters = () => {
      fetchData( 1, store.getPagination.pageSize );
    };

    watch( searchQuery, ( newVal, oldVal ) => {
      if ( newVal !== oldVal ) {
        if ( debounceTimer.value ) {
          clearTimeout( debounceTimer.value );
        }
        debounceTimer.value = window.setTimeout( () => {
          handleSearch();
        }, 500 );
      }
    } );

    watch( () => filters.value, () => {
      fetchData( 1, store.getPagination.pageSize );
    }, { deep: true } );

    const handlePageChange = async ( page: number ) => {
      await fetchData( page, store.getPagination.pageSize );
      checkedRowKeys.value = [];
    };

    const handlePageSizeChange = async ( pageSize: number ) => {
      await fetchData( 1, pageSize );
      checkedRowKeys.value = [];
    };

    const handleNewClick = () => {
      if ( props.brandName ) {
        router.push( { name: 'EditSoundFragment', params: { brandName: props.brandName, id: 'new' } } );
      } else {
        router.push( '/outline/soundfragments/new' );
      }
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
        await fetchData( store.getPagination.page, store.getPagination.pageSize );
      } catch ( error ) {
        message.error( 'Failed to delete items' );
      } finally {
        loading.value = false;
      }
    };

    return {
      store,
      referencesStore,
      columns,
      rowKey,
      fetchData,
      isMobile,
      searchQuery,
      handleSearch,
      handleNewClick,
      handleDelete,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys,
      hasSelection,
      brandName: props.brandName,
      showFilters,
      filters,
      typeOptions,
      sourceOptions,
      toggleFilters,
      clearFilters,
      applyFilters,
      brandOptions,
      handleBulkBrandUpdate,
      confirmBrandUpdate,
      showBrandUpdateDialog,
      brandUpdateOperation,
      selectedBrands,
      dialogBackgroundColor
    };
  }
} );
</script>

<style scoped>
.p-4 { padding: 1rem; }
:deep(.n-base-selection) { min-width: 200px; }
.ellipsis-cell {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>