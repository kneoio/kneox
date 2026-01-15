<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Prompts</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-button-group>
        <n-button @click="handleNewClick" type="primary" :size="isMobile ? 'medium' : 'large'">New</n-button>
        <n-button type="error" :disabled="!hasSelection" @click="handleDelete" :size="isMobile ? 'medium' : 'large'">
          Delete ({{ checkedRowKeys.length }})
        </n-button>
        <n-button @click="toggleFilters" type="default" :size="isMobile ? 'medium' : 'large'" class="mr-4">
          <red-led :active="hasActiveFilters" style="margin-right: 8px;" />
          Filter
        </n-button>
      </n-button-group>

    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-collapse-transition :show="showFilters">
        <div :style="{ width: isMobile ? '100%' : '50%' }">
          <n-space size="small" align="center">
            <n-select v-model:value="filters.languageTag" :options="langOptions" filterable placeholder="Language"
              clearable style="width: 200px;" />
            <n-radio-group v-model:value="filters.promptType" name="prompt-type-filter-group" style="margin-left: 8px;">
              <n-radio-button value="SONG">Song</n-radio-button>
              <n-radio-button value="ADVERTISEMENT">Advertisement</n-radio-button>
              <n-radio-button value="REMINDER">Reminder</n-radio-button>
              <n-radio-button :value="null" :disabled="!filters.promptType" type="warning">All types</n-radio-button>
            </n-radio-group>
            <n-button-group>
              <n-button :type="filters.enabled ? 'primary' : 'default'" @click="filters.enabled = !filters.enabled">Enabled</n-button>
              <n-button :type="filters.master ? 'primary' : 'default'" @click="toggleMaster">Master</n-button>
              <n-button :type="filters.locked ? 'primary' : 'default'" @click="filters.locked = !filters.locked">Locked</n-button>
            </n-button-group>
          </n-space>
        </div>
      </n-collapse-transition>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-data-table remote :columns="columns" :row-key="rowKey" :data="store.getEntries"
        :pagination="store.getPagination" :bordered="false" :row-props="getRowProps" :loading="loading"
        v-model:checked-row-keys="checkedRowKeys" @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange">
        <template #loading>
          <loader-icon />
        </template>
      </n-data-table>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { DataTableColumns, NButton, NButtonGroup, NDataTable, NGi, NGrid, NPageHeader, NTag, NFormItem, NSelect, NSpace, NCollapseTransition, NRadioGroup, NRadioButton, useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import RedLed from '../../common/RedLed.vue';
import { BroadcastPrompt } from '../../../types/kneoBroadcasterTypes';
import { usePromptStore } from '../../../stores/kneo/promptStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';

export default defineComponent( {
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, RedLed, NTag, NFormItem, NSelect, NSpace, NCollapseTransition, NRadioGroup, NRadioButton },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const store = usePromptStore();
    const referencesStore = useReferencesStore();
    const isMobile = ref( window.innerWidth < 768 );
    const loading = ref( false );
    const intervalId = ref<number | null>( null );
    const checkedRowKeys = ref<( string | number )[]>( [] );
    const STORAGE_KEY = 'prompts.list.filters';
    const STORAGE_SHOW_KEY = 'prompts.list.showFilters';
    const showFilters = ref( false );
    const filters = ref( {
      languageTag: null as string | null,
      promptType: null as string | null,
      enabled: false,
      master: false,
      locked: false
    } );

    const hasActiveFilters = computed( () =>
      !!( filters.value.languageTag || filters.value.promptType || filters.value.enabled || filters.value.master || filters.value.locked )
    );

    const loadSavedFilters = () => {
      try {
        const s = localStorage.getItem( STORAGE_KEY );
        if ( s ) {
          const obj = JSON.parse( s );
          filters.value = {
            languageTag: obj.languageTag || null,
            promptType: obj.promptType || null,
            enabled: !!obj.enabled,
            master: !!obj.master,
            locked: !!obj.locked
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

    async function preFetch() {
      try {
        loading.value = true;
        loadSavedFilters();
        await ( referencesStore as any ).fetchLanguages?.();
        await fetchData( 1, store.getPagination.pageSize );
      } catch ( error ) {
        console.error( 'Failed to fetch initial Prompt data:', error );
        message.error( 'Failed to load Prompts.' );
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
            console.error( 'Periodic refresh of Prompts failed:', error );
          }
        }, 30000 );
      }
    };

    const fetchData = async ( page = 1, pageSize = 10 ) => {
      try {
        loading.value = true;
        let activeFilters: any = {};
        if ( showFilters.value ) {
          const hasFilters = filters.value.languageTag ||
            filters.value.promptType ||
            filters.value.enabled ||
            filters.value.master ||
            filters.value.locked;
          if ( hasFilters ) {
            activeFilters = {
              activated: true
            };
            if ( filters.value.languageTag ) {
              activeFilters.languageTag = filters.value.languageTag;
            }
            if ( filters.value.promptType ) {
              activeFilters.promptType = filters.value.promptType;
            }
            if ( filters.value.enabled ) {
              activeFilters.enabled = filters.value.enabled;
            }
            if ( filters.value.master ) {
              activeFilters.master = filters.value.master;
            }
            if ( filters.value.locked ) {
              activeFilters.locked = filters.value.locked;
            }
          }
        }
        await store.fetchAll( page, pageSize, activeFilters );
      } catch ( error ) {
        console.error( 'Failed to fetch Prompt data:', error );
        message.error( 'Failed to load Prompts.' );
      } finally {
        loading.value = false;
      }
    };

    const stopPeriodicRefresh = () => {
      if ( intervalId.value ) {
        clearInterval( intervalId.value );
        intervalId.value = null;
      }
    };

    preFetch();
    startPeriodicRefresh();

    onMounted( () => {
      window.addEventListener( 'resize', () => {
        isMobile.value = window.innerWidth < 768;
      } );
    } );

    onUnmounted( () => {
      stopPeriodicRefresh();
    } );

    watch( () => filters.value, () => {
      saveFilters();
      if ( showFilters.value ) {
        fetchData( 1, store.getPagination.pageSize );
      }
    }, { deep: true } );

    watch( () => filters.value.languageTag, (newValue) => {
      if (newValue) {
        filters.value.master = false;
      }
    } );

    watch( showFilters, () => {
      saveFilters();
    } );

    const toggleFilters = () => {
      showFilters.value = !showFilters.value;
      saveFilters();
      fetchData( 1, store.getPagination.pageSize );
    };

    const toggleMaster = () => {
      filters.value.master = !filters.value.master;
      filters.value.languageTag = null;
    };

    const clearFilters = () => {
      filters.value = {
        languageTag: null,
        promptType: null,
        enabled: false,
        master: false,
        locked: false
      };
      applyFilters();
    };

    const applyFilters = () => {
      fetchData( 1, store.getPagination.pageSize );
    };

    const langOptions = computed( () => ( referencesStore as any ).languageOptions || [] );

    const handlePageChange = async ( page: number ) => {
      await fetchData( page, store.getPagination.pageSize );
      checkedRowKeys.value = [];
    };

    const handlePageSizeChange = async ( pageSize: number ) => {
      await fetchData( 1, pageSize );
      checkedRowKeys.value = [];
    };

    const hasSelection = computed( () => checkedRowKeys.value.length > 0 );

    const rowKeyFn = ( row: BroadcastPrompt ) => row.id ?? `${row.promptType || 'type'}-${row.languageTag || 'lang'}-${( row.prompt || '' ).slice( 0, 20 )}`;

    const handleNewClick = () => {
      router.push( '/outline/prompts/new' );
    };

    const handleDelete = async () => {
      if ( checkedRowKeys.value.length === 0 ) {
        message.warning( 'Please select Prompts to delete.' );
        return;
      }
      try {
        loading.value = true;
        const deletePromises = checkedRowKeys.value.map( id => store.deletePrompt( id as string ) );
        await Promise.all( deletePromises );
        message.success( `${checkedRowKeys.value.length} Prompt(s) deleted successfully.` );
        checkedRowKeys.value = [];
        await fetchData( store.getPagination.page, store.getPagination.pageSize );
      } catch ( error ) {
        console.error( 'Failed to delete Prompts:', error );
        message.error( 'Failed to delete Prompts.' );
      } finally {
        loading.value = false;
      }
    };

    const getRowProps = ( row: BroadcastPrompt ) => {
      return {
        style: 'cursor: pointer;',
        onClick: ( e: MouseEvent ) => {
          const target = e.target as HTMLElement;
          if (
            target.closest( '.n-checkbox' ) ||
            target.closest( '[data-n-checkbox]' ) ||
            target.closest( '.n-data-table-expand-trigger' )
          ) {
            return;
          }
          const routeTo = { name: 'PromptForm', params: { id: row.id } };
          router.push( routeTo ).catch( ( err ) => {
            console.error( 'Navigation error:', err );
          } );
        },
      };
    };

    const columns = computed<DataTableColumns<BroadcastPrompt>>( () => {
      const baseColumns: DataTableColumns<BroadcastPrompt> = [
        { type: 'selection', fixed: 'left', width: 40 },
        { title: 'Lang', key: 'languageTag', width: 70 },
        { title: 'Ver', key: 'version', width: 70 },
        {
          title: 'Flags',
          key: 'flags',
          width: 180,
          render: ( r: BroadcastPrompt ) => {
            const line1: any[] = [];
            if ( r.enabled ) line1.push( h( NTag as any, { type: 'info', size: 'small' }, { default: () => 'ENABLED' } ) );
            if ( r.master ) line1.push( h( NTag as any, { type: 'success', size: 'small' }, { default: () => 'MASTER' } ) );
            if ( r.locked ) line1.push( h( NTag as any, { type: 'error', size: 'small' }, { default: () => 'LOCKED' } ) );
            const line2: any[] = [];
            if ( r.podcast ) line2.push( h( NTag as any, { type: 'warning', size: 'small' }, { default: () => 'MINIPODCAST' } ) );
            return h( 'div', { style: 'display: flex; flex-direction: column; gap: 4px; white-space: normal; max-width: 100%; overflow: hidden;' }, [
              h( 'div', { style: 'display: flex; align-items: center; flex-wrap: wrap; gap: 4px; max-width: 100%; overflow: hidden;' }, line1 ),
              h( 'div', { style: 'display: flex; align-items: center; flex-wrap: wrap; gap: 4px; max-width: 100%; overflow: hidden;' }, line2 )
            ] );
          }
        },
        { title: 'Title', key: 'title', width: 250, ellipsis: { tooltip: true } },
        {
          title: 'Prompt',
          key: 'prompt',
          ellipsis: { tooltip: true },
          render: ( row: BroadcastPrompt ) => {
            const maxLength = isMobile.value ? 60 : 140;
            const text = row.prompt || '';
            return text.length > maxLength ? text.substring( 0, maxLength ) + '...' : text;
          }
        },
      ];

      if ( isMobile.value ) {
        return [
          {
            type: 'selection',
            fixed: 'left',
            width: 50,
            renderHeader: () => h( NCheckbox, {
              indeterminate: checkedRowKeys.value.length > 0 && checkedRowKeys.value.length < store.getEntries.length,
              checked: checkedRowKeys.value.length === store.getEntries.length && store.getEntries.length > 0,
              onClick: ( e: MouseEvent ) => {
                e.stopPropagation();
                if ( checkedRowKeys.value.length === store.getEntries.length ) {
                  checkedRowKeys.value = [];
                } else {
                  checkedRowKeys.value = store.getEntries
                    .filter( ( item: BroadcastPrompt ) => !!item.id )
                    .map( ( item: BroadcastPrompt ) => item.id as string );
                }
              }
            } )
          },
          {
            title: 'Prompt',
            key: 'combined',
            render: ( row: BroadcastPrompt ) => {
              const maxLength = 100;
              const text = row.prompt || '';
              return h( 'div', { style: 'display: flex; flex-direction: column; gap: 4px;' }, [
                h( 'div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
                  h( 'div', { style: 'font-weight: bold;' }, row.languageTag || '' ),
                  h( 'div', { style: 'font-size: 0.9rem;' }, `v${row.version || '0.0'}` )
                ] ),
                h( 'div', { style: 'font-weight: 500;' }, row.title || 'Untitled' ),
                h( 'div', { style: 'font-size: 0.85rem; color: #666;' },
                  text.length > maxLength ? text.substring( 0, maxLength ) + '...' : text
                ),
                h( 'div', { style: 'display: flex; flex-direction: column; gap: 4px; margin-top: 4px;' }, [
                  h( 'div', { style: 'display: flex; flex-wrap: wrap; gap: 4px;' }, [
                    row.enabled ? h( NTag as any, { type: 'info', size: 'small' }, { default: () => 'ENABLED' } ) : null,
                    row.master ? h( NTag as any, { type: 'success', size: 'small' }, { default: () => 'MASTER' } ) : null,
                    row.locked ? h( NTag as any, { type: 'error', size: 'small' }, { default: () => 'LOCKED' } ) : null
                  ] ),
                  row.podcast ? h( NTag as any, {
                    type: 'warning',
                    size: 'small',
                    style: 'align-self: flex-start;'
                  }, { default: () => 'MINIPODCAST' } ) : null
                ] )
              ] );
            }
          }
        ];
      }

      return baseColumns;
    } );

    return {
      store,
      columns,
      rowKey: rowKeyFn,
      isMobile,
      handleNewClick,
      handleDelete,
      hasSelection,
      hasActiveFilters,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys,
      showFilters,
      filters,
      toggleFilters,
      toggleMaster,
      clearFilters,
      applyFilters,
      langOptions
    };
  },
} );
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>
