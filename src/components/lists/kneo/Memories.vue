<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Memories</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6" class="flex items-center">
      <n-button-group class="mr-4">
        <n-button
            type="primary"
            @click="showTriggerEventModal = true"
            size="large"
        >
          Create Memory
        </n-button>
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

    <n-gi :span="isMobile ? 1 : 6">
      <n-data-table
          remote
          :columns="columns"
          :row-key="rowKey"
          :data="store.getEntries"
          :pagination="store.getPagination"
          :bordered="false"
          :row-props="getRowProps"
          :loading="loading"
          v-model:checked-row-keys="checkedRowKeys"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
      >
        <template #loading>
          <loader-icon/>
        </template>
      </n-data-table>
    </n-gi>
  </n-grid>

  <n-modal v-model:show="showTriggerEventModal" preset="dialog" title="Create Memory" :style="{ backgroundColor: dialogBackgroundColor }">
    <n-form ref="formRef" :model="eventForm" :rules="eventRules">
      <n-form-item path="brand" label="Brand">
        <n-select 
          v-model:value="eventForm.brand" 
          :options="brandOptions" 
          placeholder="Select brand"
          filterable
          tag
        />
      </n-form-item>
      <n-form-item path="memoryType" label="Memory Type">
        <n-select 
          v-model:value="eventForm.memoryType" 
          :options="memoryTypeOptions" 
          placeholder="Select memory type"
          @update:value="updateContentForMemoryType"
        />
      </n-form-item>
      <n-form-item path="content" label="Content">
        <CodeMirror
          v-model="eventForm.content"
          basic
          :style="{
            width: '100%',
            height: '120px',
            border: '1px solid #d9d9d9',
            borderRadius: '3px',
            overflow: 'auto'
          }"
          :extensions="editorExtensions"
        />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showTriggerEventModal = false">Cancel</n-button>
      <n-button type="primary" @click="handleTriggerEvent" :loading="triggerEventLoading">
        Create Memory
      </n-button>
    </template>
  </n-modal>
</template>

<script lang="ts">
import {computed, defineComponent, h, onMounted, onUnmounted, ref, watch} from 'vue';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NDataTable,
  NGi,
  NGrid,
  NPageHeader,
  NTag,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  useMessage
} from 'naive-ui';
import {json} from "@codemirror/lang-json";
import {EditorView} from "@codemirror/view";
import CodeMirror from 'vue-codemirror6';
import { useRouter } from 'vue-router';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import {Memory} from "../../../types/kneoBroadcasterTypes";
import {useMemoryStore} from "../../../stores/kneo/memoryStore";
import {useRadioStationStore} from "../../../stores/kneo/radioStationStore";
import { useDialogBackground } from '../../../composables/useDialogBackground';

export default defineComponent({
  components: { NPageHeader, NDataTable, NButtonGroup, NButton, NGi, NGrid, LoaderIcon, NModal, NForm, NFormItem, NInput, NSelect, CodeMirror },
  setup() {
    const router = useRouter();
    const store = useMemoryStore();
    const radioStationStore = useRadioStationStore();
    const message = useMessage();
    const { dialogBackgroundColor } = useDialogBackground();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const checkedRowKeys = ref<(string | number)[]>([]);
    const hasSelection = computed(() => checkedRowKeys.value.length > 0);

    const brandOptions = computed(() => {
      const radioStations = radioStationStore.getEntries || [];
      const brands = radioStations.map(station => station.slugName).filter(name => name && name.trim() !== '');
      const uniqueBrands = [...new Set(brands)];
      return uniqueBrands.map(brand => ({ label: brand, value: brand }));
    });

    const memoryTypeOptions = [
      { label: 'EVENT', value: 'EVENT' },
      { label: 'MESSAGE', value: 'MESSAGE' }
    ];

    const showTriggerEventModal = ref(false);
    const creatingMemoryLoading = ref(false);
    const formRef = ref();
    const eventForm = ref({
      brand: '',
      content: '[\n  {\n    "type": "birthday",\n    "timestamp": "2024-09-17T10:00:00Z",\n    "description": "Congratulate Mark with her birthday",\n    "priority": "high"\n  }\n] ',
      memoryType: 'EVENT'
    });

    const editorExtensions = computed(() => [
      json(),
      EditorView.lineWrapping
    ]);

    const updateContentForMemoryType = (memoryType: string) => {
      if (memoryType === 'MESSAGE') {
        eventForm.value.content = '[\n  {\n    "from": "John",\n    "content": "Congratulate Mark with her birthday"\n  }\n]';
      } else if (memoryType === 'EVENT') {
        eventForm.value.content = '[\n  {\n    "type": "birthday",\n    "timestamp": "2024-09-17T10:00:00Z",\n    "description": "Congratulate Mark with her birthday",\n    "priority": "high"\n  }\n]';
      }
    };

    watch(() => eventForm.value.memoryType, updateContentForMemoryType);
    const eventRules = {
      brand: { required: true, message: 'Brand is required', trigger: 'blur' },
      content: { required: true, message: 'Content is required', trigger: 'blur' }
    };

    async function preFetch() {
      try {
        loading.value = true;
        await Promise.all([
          store.fetchAll(),
          radioStationStore.fetchAll()
        ]);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        loading.value = false;
      }
    }

    const startPeriodicRefresh = () => {
      if (!intervalId.value) {
        intervalId.value = window.setInterval(async () => {
          try {
            await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
          } catch (error) {
            console.error('Periodic refresh failed:', error);
          }
        }, 30000);
      }
    };

    const stopPeriodicRefresh = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
      }
    };

    preFetch();
    startPeriodicRefresh();

    onMounted(() => {
      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    onUnmounted(() => {
      stopPeriodicRefresh();
    });

    const handlePageChange = async (page: number) => {
      try {
        loading.value = true;
        await store.fetchAll(page, store.getPagination.pageSize);
        checkedRowKeys.value = [];
      } finally {
        loading.value = false;
      }
    };

    const handlePageSizeChange = async (pageSize: number) => {
      try {
        loading.value = true;
        await store.fetchAll(1, pageSize);
        checkedRowKeys.value = [];
      } finally {
        loading.value = false;
      }
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.info('No items selected for deletion.');
        return;
      }
      try {
        loading.value = true;
        await Promise.all(checkedRowKeys.value.map(id => store.deleteMemory(id.toString())));
        message.success(`Deleted ${checkedRowKeys.value.length} item(s) successfully`);
        checkedRowKeys.value = [];
        await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        message.error('Failed to delete items');
      } finally {
        loading.value = false;
      }
    };

    const handleTriggerEvent = async () => {
      try {
        await formRef.value?.validate();
      } catch {
        message.error('Please fill in all required fields');
        return;
      }
      try {
        creatingMemoryLoading.value = true;
        let content: any = null;
        try {
          content = JSON.parse(eventForm.value.content);
        } catch {
          const text = String(eventForm.value.content || '').trim();
          content = text ? [{ content: text }] : [];
        }
        if (!Array.isArray(content)) {
          if (typeof content === 'string') {
            content = [{ content }];
          } else if (content && typeof content === 'object') {
            content = [content];
          } else {
            content = [];
          }
        }

        await store.createMemory(eventForm.value.brand, content, eventForm.value.memoryType);
        message.success('Event triggered successfully');
        showTriggerEventModal.value = false;
        eventForm.value.brand = '';
        eventForm.value.memoryType = 'EVENT';
        updateContentForMemoryType('EVENT');
        await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        message.error('Failed to create memory');
      } finally {
        creatingMemoryLoading.value = false;
      }
    };

    const getRowProps = (row: Memory) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) return;
          const routeTo = { name: 'MemoryForm', params: { id: row.id } };
          router.push(routeTo).catch(err => console.error('Navigation error:', err));
        },
      };
    };

    const columns = computed<DataTableColumns<Memory>>(() => {
      const baseColumns: DataTableColumns<Memory> = [
        { type: 'selection', fixed: 'left', width: 50 },
        { title: 'Brand', key: 'brand', minWidth: 140, render: (row: Memory) => row.brand },
        {
          title: 'Memory Type',
          key: 'memoryType',
          minWidth: 140,
          render: (row: Memory) => {
            let tagType: 'success' | 'warning' | 'info' | 'default' = 'default';
            if (row.memoryType === 'LISTENERS') tagType = 'success';
            if (row.memoryType === 'AUDIENCE_CONTEXT') tagType = 'warning';
            if (row.memoryType === 'MESSAGE') tagType = 'warning';
            if (row.memoryType === 'EVENT') tagType = 'success';
            return h(NTag, { type: tagType, bordered: false }, { default: () => row.memoryType });
          }
        },
        {
          title: 'Content',
          key: 'content',
          minWidth: 300,
          render: (row: Memory) => {
            let str = '';
            try {
              if (row && typeof row.content !== 'undefined' && row.content !== null) {
                str = typeof row.content === 'string' ? row.content : JSON.stringify(row.content);
              }
            } catch {
              str = '';
            }
            return h('div', { class: 'ellipsis-cell', title: str }, str);
          }
        },
        { title: 'Created Date', key: 'regDate', minWidth: 180, render: (row: Memory) => new Date(row.regDate).toLocaleString() }
      ];

      if (isMobile.value) {
        return [
          { type: 'selection', fixed: 'left', width: 50 },
          {
            title: 'Memory',
            key: 'combined',
            render: (row: Memory) => h('div', {}, [
              h('div', { style: 'font-weight: bold;' }, `Brand: ${row.brand}`),
              h('div', { style: 'font-size: 0.9rem;' }, `Type: ${row.memoryType}`),
              h('div', { style: 'font-size: 0.8rem; color: #888;' }, `Created: ${new Date(row.regDate).toLocaleDateString()}`)
            ])
          }
        ];
      }
      return baseColumns;
    });

    return {
      store,
      columns,
      rowKey: (row: Memory) => row.id,
      isMobile,
      handleDelete,
      handleTriggerEvent,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys,
      hasSelection,
      showTriggerEventModal,
      triggerEventLoading: creatingMemoryLoading,
      eventForm,
      eventRules,
      brandOptions,
      memoryTypeOptions,
      editorExtensions,
      updateContentForMemoryType,
      formRef,
      dialogBackgroundColor
    };
  }
});

</script>

<style scoped>
.p-4 { padding: 1rem; }
.ellipsis-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>