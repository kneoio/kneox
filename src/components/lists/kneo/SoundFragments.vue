<template>
  <n-grid :cols="1" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>{{ brandName ? `${brandName} Sound Fragments` : 'Sound Fragments' }}</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; margin-top: 12px; overflow-x: auto;">
        <n-button-group>
          <n-button @click="handleNewClick" type="primary" :size="isMobile ? 'medium' : 'large'">New</n-button>
          <n-button type="error" :disabled="!hasSelection" @click="handleDelete" :size="isMobile ? 'medium' : 'large'">
            Del ({{ checkedRowKeys.length }})
          </n-button>
          <n-button type="primary" :disabled="!hasSelection" @click="handleBulkBrandUpdate" :size="isMobile ? 'medium' : 'large'">
            Brands ({{ checkedRowKeys.length }})
          </n-button>
          <n-button @click="openFilterDialog" type="default" :size="isMobile ? 'medium' : 'large'">
            <red-led :active="hasActiveFilters" style="margin-right: 8px;" />
            Filter
          </n-button>
          <n-button @click="resetFilters" type="default" :size="isMobile ? 'medium' : 'large'" :disabled="!hasActiveFilters">
            Reset
          </n-button>
        </n-button-group>
        <n-input 
          v-model:value="filters.searchTerm" 
          placeholder="Search..." 
          clearable
          @update:value="onSearchChange"
          style="width: 200px;"
          :size="isMobile ? 'medium' : 'large'"
        />
      </div>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 4">
      <div v-if="filterSummary" class="filter-summary">
        {{ filterSummary }}
      </div>
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
import { computed, defineComponent, h, onMounted, ref, onUnmounted } from 'vue';
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
import RedLed from '../../common/RedLed.vue';
import { SoundFragment } from "../../../types/kneoBroadcasterTypes";
import { useSoundFragmentStore } from '../../../stores/kneo/soundFragmentStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { useRadioStationStore } from '../../../stores/kneo/radioStationStore';
import { useDialogBackground } from '../../../composables/useDialogBackground';

export default defineComponent( {
  name: 'SoundFragments',
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, RedLed, NIcon, NInput, NCard, NFormItem, NSelect, NCollapseTransition, NSpace, NModal, NRadio, NRadioGroup, NText },
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
    const hasActiveFilters = computed( () => !!(filters.value.searchTerm || filters.value.genre?.length > 0 || filters.value.labels?.length > 0 || filters.value.type?.length > 0 || filters.value.source?.length > 0) );
    const showFilterDialog = ref(false);
    const dialogFilters = ref({
      searchTerm: '',
      genre: [] as string[],
      labels: [] as string[],
      type: [] as string[],
      source: [] as string[]
    });
    const message = useMessage();
    const STORAGE_KEY = 'soundfragments.list.filters';
    const STORAGE_SHOW_KEY = 'soundfragments.list.showFilters';
    const showFilters = ref( false );
    const filters = ref( {
      searchTerm: '',
      genre: [] as string[],
      labels: [] as string[],
      type: [] as string[],
      source: [] as string[]
    } );

    const loadSavedFilters = () => {
      try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) {
          const obj = JSON.parse(s);
          filters.value = {
            searchTerm: obj.searchTerm || '',
            genre: obj.genre || [],
            labels: obj.labels || [],
            type: obj.type || [],
            source: obj.source || []
          };
        }
        const sh = localStorage.getItem(STORAGE_SHOW_KEY);
        if (sh === 'true') showFilters.value = true;
      } catch {}
    };

    const saveFilters = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters.value));
        localStorage.setItem(STORAGE_SHOW_KEY, String(showFilters.value));
      } catch {}
    };

    const showBrandUpdateDialog = ref(false);
    const brandUpdateOperation = ref<'SET' | 'UNSET'>('SET');
    const selectedBrands = ref<string[]>([]);

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
        loadSavedFilters();
        await Promise.all( [
          store.fetchAll(),
          referencesStore.fetchGenres(),
          referencesStore.fetchLabels(),
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
          const hasFilters = filters.value.searchTerm || filters.value.genre?.length > 0 || filters.value.labels?.length > 0 || filters.value.type?.length > 0 || filters.value.source?.length > 0;
          if ( hasFilters ) {
            activeFilters = filters.value;
          }
        }
        await store.fetchAll( page, pageSize, activeFilters );
      } catch ( error ) {
        console.error( 'Failed to fetch data:', error );
      } finally {
        loading.value = false;
      }
    };

    const toggleFilters = () => {
      showFilters.value = !showFilters.value;
      if (!showFilters.value) {
        filters.value = {
          searchTerm: '',
          genre: [],
          labels: [],
          type: [],
          source: []
        };
      }
      saveFilters();
      fetchData( 1, store.getPagination.pageSize );
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
      fetchData(1, store.getPagination.pageSize);
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

    const clearFilters = () => {
      filters.value = {
        searchTerm: '',
        genre: [],
        labels: [],
        type: [],
        source: []
      };
      applyFilters();
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
      fetchData(1, store.getPagination.pageSize);
    };

    const onSearchChange = () => {
      saveFilters();
      fetchData(1, store.getPagination.pageSize);
    };

    const applyFilters = () => {
      fetchData( 1, store.getPagination.pageSize );
    };

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
      hasActiveFilters,
      toggleFilters,
      clearFilters,
      resetFilters,
      applyFilters,
      showFilterDialog,
      dialogFilters,
      openFilterDialog,
      applyDialogFilters,
      clearDialogFilters,
      filterSummary,
      brandOptions,
      handleBulkBrandUpdate,
      confirmBrandUpdate,
      showBrandUpdateDialog,
      brandUpdateOperation,
      selectedBrands,
      dialogBackgroundColor,
      onSearchChange
    };
  }
} );
</script>

<style scoped>
.p-4 { padding: 1rem; }
.ellipsis-cell {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.filter-summary {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}
</style>