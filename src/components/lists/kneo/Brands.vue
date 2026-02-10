<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" :style="{ padding: isMobile ? '0' : '1rem' }">
    <n-gi :span="isMobile ? 1 : 6">
      <n-page-header :style="{ padding: isMobile ? '8px' : undefined, marginLeft: isMobile ? '60px' : '0' }">
        <template #title>
          <span :style="{ fontSize: isMobile ? '20px' : undefined }">Brands</span>
        </template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-button-group :style="{ width: isMobile ? '100%' : 'auto' }">
        <n-button @click="handleNewClick" type="primary" :size="isMobile ? 'medium' : 'large'" :style="{ flex: isMobile ? 1 : 'none' }">New</n-button>
        <n-button
            type="error"
            :disabled="!hasSelection"
            @click="handleDelete"
            :size="isMobile ? 'medium' : 'large'"
            :style="{ flex: isMobile ? 1 : 'none' }"
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

  <n-modal
    v-model:show="showOneTimeStreamDialog"
    preset="dialog"
    :title="selectedOneTimeStreamScript?.name || 'One-Time stream'"
    :close-on-esc="true"
    :style="{ width: isMobile ? '95vw' : '900px', backgroundColor: dialogBackgroundColor, maxHeight: isMobile ? '90vh' : '80vh' }"
  >
    <div :style="{ minHeight: isMobile ? '300px' : '420px', maxHeight: isMobile ? '60vh' : '62vh', overflow: 'auto', paddingRight: '8px' }">
      <n-space vertical>
        <n-form-item label="Script">
          <n-select
            v-model:value="selectedOneTimeStreamScriptId"
            :options="oneTimeStreamScriptOptions"
            :render-label="renderScriptLabel"
            filterable
            :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }"
            placeholder="Select script..."
          />
        </n-form-item>

        <n-form-item label="Description">
          <div :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px', minHeight: '90px' }">
            <n-anchor v-if="selectedOneTimeStreamScript" type="block" :show-background="false" :show-rail="true" style="width: 100%;">
              <n-anchor-link>
                {{ selectedOneTimeStreamScript.description }}
              </n-anchor-link>
            </n-anchor>
          </div>
        </n-form-item>

        <n-form-item label="Brand">
          <n-select
            v-model:value="selectedOneTimeStreamBrandId"
            :options="oneTimeStreamBrandOptions"
            filterable
            :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '450px' }"
            placeholder="Select brand..."
          />
        </n-form-item>

        <n-form-item v-if="selectedOneTimeStreamScript?.requiredVariables?.length" label="Variables">
          <div :style="{ width: '100%', maxWidth: isMobile ? '100%' : '900px' }">
            <div v-for="variable in selectedOneTimeStreamScript.requiredVariables" :key="variable.name" style="margin-bottom: 12px;">
              <div style="margin-bottom: 4px; font-size: 13px;">
                <strong>{{ formatVariableName(variable.name) }}</strong>
                <span v-if="variable.required" style="color: #e74c3c;">*</span>
                <span style="color: #666; font-size: 12px; margin-left: 8px;">{{ variable.description }}</span>
              </div>
              <n-switch v-if="variable.type === 'boolean'" v-model:value="oneTimeStreamUserVariables[variable.name]" />
              <n-input-number v-else-if="variable.type === 'number'" v-model:value="oneTimeStreamUserVariables[variable.name]" style="width: 100%;" />
              <n-input v-else v-model:value="oneTimeStreamUserVariables[variable.name]" placeholder="" style="width: 100%;" />
            </div>
          </div>
        </n-form-item>
      </n-space>
    </div>

    <template #action>
      <n-space>
        <n-button @click="handleOneTimeStreamCancel">Cancel</n-button>
        <n-button type="primary" @click="handleOneTimeStreamRun" :disabled="!canRunOneTimeStream" :loading="oneTimeStreamRunLoading">Run</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts">
import {computed, defineComponent, h, inject, onMounted, onUnmounted, onActivated, onDeactivated, ref, Ref, watch} from 'vue';
import {
  DataTableColumns,
  NAnchor,
  NAnchorLink,
  NButton,
  NButtonGroup,
  NCheckbox,
  NDataTable,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NInputNumber,
  NModal,
  NPageHeader,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  useMessage
} from 'naive-ui';
import {useRouter, onBeforeRouteLeave} from 'vue-router';
import {PlayerPlay, PlayerStop} from '@vicons/tabler';
import LoaderIcon from '../../helpers/LoaderWrapper.vue';
import { RadioStation, SceneTimingMode, Script } from "../../../types/kneoBroadcasterTypes";
import {useRadioStationStore} from "../../../stores/kneo/radioStationStore";
import apiClient from '../../../api/apiClient';
import { useDialogBackground } from '../../../composables/useDialogBackground';

export default defineComponent({
  components: {NPageHeader, NDataTable, NButtonGroup, NButton, NFormItem, NSelect, NInput, NInputNumber, NSwitch, NSpace, NAnchor, NAnchorLink, NGi, NGrid, NTag, NModal, LoaderIcon, PlayerPlay, PlayerStop},
  setup() {
    const router = useRouter();
    const message = useMessage();
    const { dialogBackgroundColor } = useDialogBackground();
    const store = useRadioStationStore();
    const isMobile = ref(window.innerWidth < 768);
    const loading = ref(false);
    const intervalId = ref<number | null>(null);
    const clockIntervalId = ref<number | null>(null);
    const currentTime = ref(new Date());
    const currentSongName = inject<Ref<string | null>>('parentTitle');
    const checkedRowKeys = ref<(string | number)[]>([]);
    const hasSelection = computed(() => checkedRowKeys.value.length > 0);

    const showOneTimeStreamDialog = ref(false);
    const selectedOneTimeStreamScriptId = ref<string | number | null>(null);
    const selectedOneTimeStreamScript = ref<Script | null>(null);
    const oneTimeStreamScripts = ref<Script[]>([]);
    const selectedOneTimeStreamBrandId = ref<string | null>(null);
    const oneTimeStreamUserVariables = ref<Record<string, any>>({});
    const oneTimeStreamRunLoading = ref(false);

    const oneTimeStreamBrandOptions = computed(() => {
      return (store.getEntries || []).map((b: any) => ({
        label: `${b.slugName || ''}${b.country ? ` (${b.country})` : ''}`,
        value: b.id
      }));
    });

    const canRunOneTimeStream = computed(() => {
      return !!selectedOneTimeStreamBrandId.value && !!selectedOneTimeStreamScript.value?.id;
    });

    const oneTimeStreamScriptOptions = computed(() => {
      return (oneTimeStreamScripts.value || []).map((s: any) => ({
        label: s.name,
        value: s.id,
        accessLevel: (s as any).accessLevel
      }));
    });

    const renderScriptLabel = (option: any) => {
      const isPublic = option.accessLevel === 1;
      return h('span', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        isPublic ? h(NTag, { type: 'success', size: 'small' }, { default: () => 'Public' }) : null,
        h('span', option.label)
      ]);
    };

    const fetchOneTimeStreamScripts = async () => {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('size', '100');
      params.set('filter', JSON.stringify({ timingMode: SceneTimingMode.RELATIVE_TO_STREAM_START }));
      const response = await apiClient.get(`/scripts?${params.toString()}`);
      const entries = response?.data?.payload?.viewData?.entries || [];
      oneTimeStreamScripts.value = entries;
    };

    const handleOpenOneTimeStreamDialog = async () => {
      selectedOneTimeStreamBrandId.value = null;
      selectedOneTimeStreamScriptId.value = null;
      selectedOneTimeStreamScript.value = null;
      oneTimeStreamUserVariables.value = {};
      showOneTimeStreamDialog.value = true;
      try {
        await fetchOneTimeStreamScripts();
      } catch (e) {
        message.error('Failed to load scripts');
      }
    };

    const resetOneTimeStreamUserVariables = (script: Script | null) => {
      oneTimeStreamUserVariables.value = {};
      if (script?.requiredVariables) {
        script.requiredVariables.forEach((v: any) => {
          if (v.type === 'boolean') oneTimeStreamUserVariables.value[v.name] = false;
          else if (v.type === 'number') oneTimeStreamUserVariables.value[v.name] = 0;
          else oneTimeStreamUserVariables.value[v.name] = '';
        });
      }
    };

    const toBool = (v: any): boolean => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v === 1;
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        return s === '1' || s === 'true' || s === 'yes';
      }
      return false;
    };

    const mergeVariablesWithDefaults = (script: Script, existing: Record<string, any>) => {
      const merged: Record<string, any> = {};
      (script.requiredVariables || []).forEach((v: any) => {
        if (v.type === 'boolean') merged[v.name] = false;
        else if (v.type === 'number') merged[v.name] = 0;
        else merged[v.name] = '';
      });

      Object.keys(existing || {}).forEach((k) => {
        const rv = (script.requiredVariables || []).find((x: any) => x.name === k);
        if (rv?.type === 'boolean') merged[k] = toBool(existing[k]);
        else if (rv?.type === 'number') {
          const n = typeof existing[k] === 'number' ? existing[k] : Number(existing[k]);
          merged[k] = Number.isFinite(n) ? n : 0;
        } else {
          merged[k] = existing[k];
        }
      });

      return merged;
    };

    const applyBrandPrefillVariables = async () => {
      if (!selectedOneTimeStreamBrandId.value) return;
      if (!selectedOneTimeStreamScript.value?.id) return;
      try {
        const brandId = selectedOneTimeStreamBrandId.value;
        const response = await apiClient.get(`radiostations/${brandId}`);
        const doc = response?.data?.payload?.docData;
        const scripts = (doc as any)?.scripts;
        if (!Array.isArray(scripts)) return;

        const match = scripts.find((s: any) => {
          if (s && typeof s === 'object' && s.scriptId) return s.scriptId === selectedOneTimeStreamScript.value!.id;
          return s === selectedOneTimeStreamScript.value!.id;
        });
        const existingVars = (match && typeof match === 'object') ? (match.userVariables || {}) : {};
        oneTimeStreamUserVariables.value = mergeVariablesWithDefaults(selectedOneTimeStreamScript.value!, existingVars);
      } catch {
        message.error('Failed to load brand variables');
      }
    };

    const fetchScriptDetails = async (id: string | number) => {
      const response = await apiClient.get(`/scripts/${id}`);
      const doc = response?.data?.payload?.docData;
      return (doc || null) as Script | null;
    };

    const formatVariableName = (name: string): string => {
      return name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
    };

    const handleOneTimeStreamCancel = () => {
      showOneTimeStreamDialog.value = false;
    };

    const handleOneTimeStreamRun = async () => {
      if (!canRunOneTimeStream.value) return;
      try {
        oneTimeStreamRunLoading.value = true;
        await apiClient.post('/radiostations/one-time-stream/run', {
          brandId: selectedOneTimeStreamBrandId.value,
          scriptId: selectedOneTimeStreamScript.value!.id,
          userVariables: oneTimeStreamUserVariables.value
        });

        showOneTimeStreamDialog.value = false;
      } catch (e) {
        message.error('Failed to run');
      } finally {
        oneTimeStreamRunLoading.value = false;
      }
    };

    async function preFetch() {
      try {
        loading.value = true;
        await store.fetchAll();
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
        }, 10000);
      }
    };

    const stopPeriodicRefresh = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
      }
    };

    const startClockUpdate = () => {
      if (!clockIntervalId.value) {
        clockIntervalId.value = window.setInterval(() => {
          currentTime.value = new Date();
        }, 60000); // Update every minute
      }
    };

    const stopClockUpdate = () => {
      if (clockIntervalId.value) {
        clearInterval(clockIntervalId.value);
        clockIntervalId.value = null;
      }
    };

    
    const getStatusStyle = (status: string) => {
      switch (status) {
        case 'ON_LINE':
          return { color: '#00aa00', text: '● ONLINE' };
        case 'QUEUE_SATURATED':
          return { color: '#00aa00', text: '● QUEUE SATURATED' };
        case 'WARMING_UP':
          return { color: '#ffa500', text: '● WARMING UP' };
        case 'IDLE':
          return { color: '#888888', text: '○ IDLE' };
        case 'SYSTEM_ERROR':
          return { color: '#ff0000', text: '⚠ SYSTEM ERROR' };
        case 'OFF_LINE':
        default:
          return { color: '#5a5a5a', text: '○ OFFLINE' };
      }
    };

    const renderFlags = (row: RadioStation) => {
      const tags: any[] = [];

      const statusInfo = getStatusStyle(row.status);
      tags.push(h(NTag, {
        bordered: true,
        size: 'small',
        color: { color: 'transparent', textColor: statusInfo.color, borderColor: statusInfo.color }
      }, { default: () => statusInfo.text }));

      return h('div', { style: 'display:flex; flex-wrap:wrap; gap:6px;' }, tags);
    };

    preFetch();
    startPeriodicRefresh();
    startClockUpdate();

    const handleResize = () => {
      isMobile.value = window.innerWidth < 768;
    };

    function onOneTimeStreamKeydown(e: KeyboardEvent) {
      if (!showOneTimeStreamDialog.value) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleOneTimeStreamCancel();
        return;
      }
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleOneTimeStreamRun();
      }
    }

    onMounted(() => {
      window.addEventListener('resize', handleResize);
      window.addEventListener('keydown', onOneTimeStreamKeydown);
    });

    onUnmounted(() => {
      stopPeriodicRefresh();
      stopClockUpdate();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onOneTimeStreamKeydown);
    });

    onBeforeRouteLeave(() => {
      stopPeriodicRefresh();
      stopClockUpdate();
      window.removeEventListener('keydown', onOneTimeStreamKeydown);
    });

    onDeactivated(() => {
      stopPeriodicRefresh();
      stopClockUpdate();
    });

    onActivated(() => {
      startPeriodicRefresh();
      startClockUpdate();
    });

    watch(showOneTimeStreamDialog, (v) => {
      if (v) return;
      selectedOneTimeStreamBrandId.value = null;
      selectedOneTimeStreamScriptId.value = null;
      selectedOneTimeStreamScript.value = null;
      oneTimeStreamUserVariables.value = {};
      oneTimeStreamRunLoading.value = false;
    });

    watch(selectedOneTimeStreamBrandId, () => {
      applyBrandPrefillVariables();
    });

    watch(selectedOneTimeStreamScriptId, async (id) => {
      if (!id) {
        selectedOneTimeStreamScript.value = null;
        oneTimeStreamUserVariables.value = {};
        return;
      }
      try {
        const detailedScript = await fetchScriptDetails(id);
        selectedOneTimeStreamScript.value = detailedScript;
        resetOneTimeStreamUserVariables(detailedScript);
        await applyBrandPrefillVariables();
      } catch (e) {
        message.error('Failed to load script');
      }
    });

    const handleCopyUrl = (url: string) => {
      navigator.clipboard.writeText(url)
          .then(() => message.success('URL copied to clipboard'))
          .catch(() => message.error('Failed to copy URL'));
    };

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

    const handleNewClick = () => {
      router.push('/outline/brands/new');
    };

    const getRowProps = (row: RadioStation) => {
      return {
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.n-checkbox') || target.closest('[data-n-checkbox]')) {
            return;
          }
          const routeTo = {name: 'Brand', params: {id: row.id}};
          router.push(routeTo).catch((err) => {
            console.error('Navigation error:', err);
          });
        },
      };
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.info("No items selected for deletion.");
        return;
      }
      try {
        loading.value = true;
        await Promise.all(checkedRowKeys.value.map(id => store.deleteRadioStation(id.toString())));
        message.success(`Deleted ${checkedRowKeys.value.length} item(s) successfully`);
        checkedRowKeys.value = [];
        await store.fetchAll(store.getPagination.page, store.getPagination.pageSize);
      } catch (error) {
        message.error('Failed to delete items');
      } finally {
        loading.value = false;
      }
    };

    const columns = computed<DataTableColumns<RadioStation>>(() => {
      const baseColumns: DataTableColumns<RadioStation> = [
        {
          type: 'selection',
          fixed: 'left',
          width: 50
        },
        {
          title: 'Flags',
          key: 'flags',
          width: 360,
          render: (row: RadioStation) => renderFlags(row)
        },
        {
          title: 'Slug name',
          key: 'slugName',
          render: (row: RadioStation) => {
            return h(NTag, { 
              bordered: true,
              color: row.color ? {  textColor: '#555', borderColor: row.color } : { textColor: '#555', borderColor: '#BBB' }
            }, { default: () => row.slugName });
          }
        },
        {title: 'Country', key: 'country'},
        {
          title: 'Timezone',
          key: 'timeZone',
          render: (row: RadioStation) => {
            const timeString = currentTime.value.toLocaleTimeString('en-US', {
              timeZone: row.timeZone,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
            return h('div', {}, [
              h('div', { style: 'font-weight: bold; font-size: 0.9rem;' }, timeString),
              h('div', { style: 'font-size: 0.75rem; color: #666;' }, row.timeZone)
            ]);
          }
        },
        {title: 'Managed By', key: 'managedBy'},
        {
          title: 'Bit Rate',
          key: 'bitRate',
          render: (row: RadioStation) => {
            return h('div', {}, row.bitRate ? `${(row.bitRate / 1000).toFixed(0)}k` : '-');
          }
        },
        {
          title: 'URL',
          key: 'mixplaUrl',
          render: (row: RadioStation) => {
            return h('div', {
              style: 'display: flex; align-items: center; cursor: pointer;',
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                if (row.mixplaUrl) {
                  handleCopyUrl(row.mixplaUrl);
                }
              },
              title: 'Click to copy URL'
            }, [
              h('span', {
                style: 'overflow: hidden; text-overflow: ellipsis;',
              }, row.mixplaUrl)
            ]);
          }
        }
      ];

      if (isMobile.value) {
        return [
          {
            type: 'selection',
            fixed: 'left',
            width: 50,
            renderHeader: () => h(NCheckbox, {
              indeterminate: checkedRowKeys.value.length > 0 && checkedRowKeys.value.length < store.getEntries.length,
              checked: checkedRowKeys.value.length === store.getEntries.length && store.getEntries.length > 0,
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                if (checkedRowKeys.value.length === store.getEntries.length) {
                  checkedRowKeys.value = [];
                } else {
                  checkedRowKeys.value = store.getEntries.map(item => item.id);
                }
              }
            })
          },
          {
            title: 'Station',
            key: 'combined',
            render: (row: RadioStation) => {
              return h('div', {}, [
                h('div', { style: 'font-weight: bold;' }, row.slugName),
                renderFlags(row),
                h('div', {
                  style: 'font-size: 0.8rem; color: #666;'
                }, `Managed by: ${row.managedBy}`),
                h('div', {
                  style: 'cursor: pointer; font-size: 0.8rem;',
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                    if (row.mixplaUrl) {
                      handleCopyUrl(row.mixplaUrl);
                    }
                  }
                }, 'Click to copy URL')
              ]);
            }
          }
        ];
      }

      return baseColumns;
    });

    return {
      store,
      columns,
      rowKey: (row: any) => row.id,
      isMobile,
      currentSongName,
      handleNewClick,
      oneTimeStreamScriptOptions,
      renderScriptLabel,
      oneTimeStreamBrandOptions,
      handleOpenOneTimeStreamDialog,
      showOneTimeStreamDialog,
      selectedOneTimeStreamScriptId,
      selectedOneTimeStreamScript,
      selectedOneTimeStreamBrandId,
      oneTimeStreamUserVariables,
      formatVariableName,
      handleOneTimeStreamCancel,
      handleOneTimeStreamRun,
      canRunOneTimeStream,
      oneTimeStreamRunLoading,
      dialogBackgroundColor,
      getRowProps,
      handlePageChange,
      handlePageSizeChange,
      loading,
      checkedRowKeys,
      hasSelection,
      handleDelete
    };
  },
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}

.p-2 {
  padding: 0.5rem;
}
</style>