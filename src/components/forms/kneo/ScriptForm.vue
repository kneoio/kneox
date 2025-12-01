<template>
  <div>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.name || 'New Script' }}</template>
        <template #footer>
          Registered: {{ localFormData.regDate }}, Last Modified: {{ localFormData.lastModifiedDate }}
          <br>
          Author: {{ localFormData.author }}, Last Modifier: {{ localFormData.lastModifier }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" @click="openDryRunDialog" size="large">Dry run</n-button>
        <n-button type="default" disabled size="large">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Name">
                  <n-input v-model:value="localFormData.name" style="width: 50%; max-width: 600px;" placeholder=""/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Description">
                  <n-input
                    v-model:value="localFormData.description"
                    type="textarea"
                    :autosize="{ minRows: 3, maxRows: 6 }"
                    style="width: 50%; max-width: 600px;"
                    placeholder="Enter script description..."
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Labels">
                  <n-select
                    v-model:value="localFormData.labels"
                    :options="scriptLabelOptions"
                    multiple
                    filterable
                    style="width: 25%; max-width: 300px;"
                    placeholder="Select labels..."
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item>
                  <n-checkbox v-model:checked="isPublic">Public</n-checkbox>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="scenes" tab="Scenes">
          <n-data-table
            remote
            :columns="sceneColumns"
            :row-key="sceneRowKey"
            :data="sceneStore.getEntries"
            :pagination="false"
            :bordered="false"
            :loading="scenesLoading"
            :row-props="getSceneRowProps"
            size="small"
            :style="{ width: '800px' }"
            default-expand-all
          />
        </n-tab-pane>
        <n-tab-pane name="acl" tab="ACL">
          <acl-table :acl-data="aclData" :loading="aclLoading" />
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>

  <n-modal
    v-model:show="showDryRunDialog"
    preset="dialog"
    :closable="false"
    :mask-closable="false"
    :close-on-esc="false"
    :style="{ width: '800px', backgroundColor: dialogBackgroundColor }"
  >
    <template #header>
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
        <span>{{ dryRunDialogTitle }}</span>
        <button type="button" @click="closeDryRunDialog" aria-label="Close" style="background:none; border:none; font-size:18px; line-height:1; cursor:pointer;">×</button>
      </div>
    </template>
    <n-space vertical size="small">
      <n-form label-placement="left" label-width="auto">
        <n-grid :cols="1" x-gap="12" y-gap="8" class="m-1">
          <n-gi>
            <n-form-item label="Station">
              <n-select v-model:value="dryRunStationId" :options="stationOptions" filterable style="width: 50%; max-width: 600px;" />
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-form>
      <div>
        <n-text depth="3">Scenes</n-text>
        <div style="display:flex; flex-direction:column; gap:8px; width: 100%; margin-top: 8px;">
          <div v-for="(sc, idx) in sceneStore.getEntries" :key="sceneRowKey(sc)" style="display:flex; align-items:center; gap:8px;">
            <GlowDot :variant="getSceneDotVariant(idx)" :active="getSceneDotActive(idx)" :pulse="getSceneDotActive(idx)" />
            <span>{{ sc.startTime }} — {{ sc.title || sc.type }}</span>
          </div>
        </div>
      </div>
      <div v-if="dryRunWarnings.length || dryRunErrors.length" style="display:flex; flex-direction:column; gap:8px; margin-top: 8px;">
        <NAlert v-for="(w, i) in dryRunWarnings" :key="'w-' + i" type="warning" closable>
          {{ w }}
        </NAlert>
        <NAlert v-for="(er, i) in dryRunErrors" :key="'e-' + i" type="error" closable>
          {{ er }}
        </NAlert>
      </div>
    </n-space>
    <template #action>
      <n-space>
        <n-button v-if="!isDryRunning && !dryRunScenario" @click="closeDryRunDialog">Cancel</n-button>
        <n-button v-if="!isDryRunning && !dryRunScenario" type="primary" @click="runDryRun" :disabled="!dryRunStationId">Run</n-button>
        <n-button v-if="isDryRunning" disabled>Running...</n-button>
        <n-button v-if="dryRunScenario" @click="runDryRun" type="primary">Re-run</n-button>
        <n-button v-if="dryRunScenario" @click="showScenarioDialog = true">Show Scenario</n-button>
        <n-button v-if="dryRunScenario" @click="downloadScenario">Download</n-button>
        <n-button v-if="dryRunScenario" @click="closeDryRunDialog">Close</n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal
    v-model:show="showScenarioDialog"
    preset="dialog"
    :closable="false"
    :mask-closable="false"
    :close-on-esc="false"
    :style="{ width: '900px', backgroundColor: dialogBackgroundColor }"
  >
    <template #header>
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
        <span>Dry Run Scenario</span>
        <button type="button" @click="showScenarioDialog = false" aria-label="Close" style="background:none; border:none; font-size:18px; line-height:1; cursor:pointer;">×</button>
      </div>
    </template>
    <div style="max-height: 600px; overflow-y: auto; padding: 12px; border: 1px solid #ccc; border-radius: 4px; background-color: #f9f9f9;">
      <div v-html="dryRunScenarioHtml"></div>
    </div>
    <template #action>
      <n-space>
        <n-button @click="showScenarioDialog = false">Close</n-button>
      </n-space>
    </template>
  </n-modal>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import MarkdownIt from 'markdown-it';
import apiClient, { apiServer } from '../../../api/apiClient';
import {
  NButton,
  NButtonGroup,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NPageHeader,
  NTabs,
  NTabPane,
  NDataTable,
  NSelect,
  NText,
  NModal,
  NSpace,
  NAlert,
  NCheckbox,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import { useScriptStore } from '../../../stores/kneo/scriptStore';
import { useScriptSceneStore } from '../../../stores/kneo/scriptSceneStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { Script, ScriptSave, ScriptScene } from '../../../types/kneoBroadcasterTypes';
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';
import { EditorView } from "@codemirror/view";
import { json } from "@codemirror/lang-json";
import CodeMirror from 'vue-codemirror6';
import AclTable from '../../common/AclTable.vue';
import GlowDot from '../../common/GlowDot.vue';
import { useRadioStationStore } from '../../../stores/kneo/radioStationStore';
import { useDialogBackground } from '../../../composables/useDialogBackground';

export default defineComponent({
  name: "ScriptForm",
  inheritAttrs: false,
  components: {
    NPageHeader,
    NButtonGroup,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NTabs,
    NTabPane,
    NGrid,
    NGi,
    NSelect,
    NText,
    NDataTable,
    NCheckbox,
    CodeMirror,
    AclTable,
    NModal,
    NSpace,
    NAlert,
    GlowDot
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const { dialogBackgroundColor } = useDialogBackground();
    const router = useRouter();
    const store = useScriptStore();
    const referencesStore = useReferencesStore();
    const sceneStore = useScriptSceneStore();
    const radioStore = useRadioStationStore();
    const scenesLoading = ref(false);
    const scriptLabelOptions = ref<Array<{ label: string; value: string; color?: string; fontColor?: string }>>([]);
    const route = useRoute();

    const activeTab = ref("properties");
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);
    const showDryRunDialog = ref(false);
    const showScenarioDialog = ref(false);
    const dryRunStationId = ref<string | null>(null);
    const dryRunWarnings = ref<string[]>([]);
    const dryRunErrors = ref<string[]>([]);
    const isDryRunning = ref(false);
    const failedSceneIndexes = ref<Set<number>>(new Set());
    const dryRunScenario = ref<string | null>(null);
    const dryRunCompletedScenes = ref(0);
    const dryRunTotalScenes = ref(0);
    const dryRunCurrentSceneTitle = ref('');
    let dryRunEventSource: EventSource | null = null;
    const md = new MarkdownIt();

    const editorExtensions = computed(() => [
      json(),
      EditorView.lineWrapping
    ]);

    const formTitle = computed(() => localFormData.id ? 'Edit Script' : 'Create New Script');

    const localFormData = reactive<Script>({
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      name: "",
      description: "",
      labels: [],
      accessLevel: 0
    });

    const isPublic = ref(false);

    const sceneRowKey = (row: any) => row.id || `${row.type || 'scene'}-${row.startTime || ''}`;
    const sceneColumns = computed(() => [
      { title: 'Type', key: 'type', width: 140 },
      { title: 'Start', key: 'startTime', width: 140 },
      { title: 'Prompts', key: 'prompts', render: (r: any) => Array.isArray(r.prompts) ? r.prompts.length : 0 }
    ]);

    const stationOptions = computed(() => {
      const list = (radioStore as any).getEntries || [];
      return list.map((st: any) => ({ label: st.localizedName?.en || st.name || st.slugName || st.id, value: st.id }));
    });

    const fetchScenes = async () => {
      if (!localFormData.id) return;
      try {
        scenesLoading.value = true;
        await sceneStore.fetchForScript(localFormData.id, 1, 50);
      } finally {
        scenesLoading.value = false;
      }
    };

    const handleSave = async () => {
      try {
        loadingBar.start();

        const saveData: ScriptSave = {
          name: localFormData.name || '',
          description: localFormData.description || '',
          labels: localFormData.labels || [],
          accessLevel: isPublic.value ? 1 : 0
        };

        const id = localFormData.id ? localFormData.id : null;
        await store.save(saveData, id);
        message.success("Script saved successfully");
        await router.push("/outline/scripts");
      } catch (error: any) {
        console.error('Failed to save Script:', error);
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const openDryRunDialog = async () => {
      showDryRunDialog.value = true;
      try {
        loadingBar.start();
        dryRunWarnings.value = [];
        dryRunErrors.value = [];
        failedSceneIndexes.value.clear();
        if (localFormData.id) {
          await fetchScenes();
        }
        try { await radioStore.fetchAll(1, 100); } catch {}
      } finally {
        loadingBar.finish();
      }
    };

    const dryRunDialogTitle = computed(() => {
      if (dryRunScenario.value) {
        return 'Dry run completed';
      }
      if (isDryRunning.value && dryRunCurrentSceneTitle.value) {
        return `Dry run: ${dryRunCurrentSceneTitle.value} (${dryRunCompletedScenes.value}/${dryRunTotalScenes.value})`;
      }
      if (isDryRunning.value) {
        return `Dry run: Processing... (${dryRunCompletedScenes.value}/${dryRunTotalScenes.value})`;
      }
      return 'Dry run';
    });

    const closeDryRunDialog = () => {
      if (dryRunEventSource) {
        dryRunEventSource.close();
        dryRunEventSource = null;
      }
      showDryRunDialog.value = false;
      isDryRunning.value = false;
      dryRunScenario.value = null;
      dryRunCompletedScenes.value = 0;
      dryRunTotalScenes.value = 0;
      dryRunCurrentSceneTitle.value = '';
      dryRunWarnings.value = [];
      dryRunErrors.value = [];
      failedSceneIndexes.value.clear();
    };

    const runDryRun = async () => {
      try {
        loadingBar.start();
        isDryRunning.value = true;
        dryRunScenario.value = null;
        dryRunCompletedScenes.value = 0;
        dryRunTotalScenes.value = 0;
        dryRunCurrentSceneTitle.value = '';

        const jobId = crypto.randomUUID();
        const payload = {
          jobId,
          stationId: dryRunStationId.value
        };

        await apiClient.post(`/scripts/${localFormData.id}/dry-run`, payload);
        message.info('Dry run started...');

        if (dryRunEventSource) {
          dryRunEventSource.close();
        }

        dryRunEventSource = new EventSource(`${apiServer}/scripts/dry-run/stream?jobId=${jobId}`, { withCredentials: true } as any);

        dryRunEventSource.addEventListener('started', () => {});

        dryRunEventSource.addEventListener('total_scenes', (e: MessageEvent) => {
          const data = JSON.parse(e.data);
          dryRunTotalScenes.value = data.total || 0;
        });

        dryRunEventSource.addEventListener('scene_done', (e: MessageEvent) => {
          const data = JSON.parse(e.data);
          dryRunCompletedScenes.value = data.done || 0;
          dryRunCurrentSceneTitle.value = data.sceneTitle || '';
        });

        // New backend events: warning and prompt_error
        dryRunEventSource.addEventListener('warning', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data || '{}');
            const msgParts = [
              data.message,
              data.promptTitle ? `Prompt: ${data.promptTitle}` : null,
              data.draftTitle ? `Draft: ${data.draftTitle}` : null
            ].filter(Boolean);
            if (msgParts.length) message.warning(msgParts.join(' | '), { duration: 7000 });
            if (msgParts.length) dryRunWarnings.value.push(msgParts.join(' | '));
          } catch {
            message.warning('Warning received during dry run');
            dryRunWarnings.value.push('Warning received during dry run');
          }
        });

        dryRunEventSource.addEventListener('prompt_error', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data || '{}');
            const msgParts = [
              data.message,
              data.promptTitle ? `Prompt: ${data.promptTitle}` : null,
              data.draftTitle ? `Draft: ${data.draftTitle}` : null,
              data.llmType ? `LLM: ${data.llmType}` : null
            ].filter(Boolean);
            if (msgParts.length) message.error(msgParts.join(' | '), { duration: 8000 });
            if (msgParts.length) dryRunErrors.value.push(msgParts.join(' | '));
            // Mark current scene as failed (red) if in progress
            if (isDryRunning.value) {
              const currentIdx = dryRunCompletedScenes.value;
              failedSceneIndexes.value.add(currentIdx);
            }
          } catch {
            message.error('Prompt error during dry run');
            dryRunErrors.value.push('Prompt error during dry run');
            if (isDryRunning.value) {
              const currentIdx = dryRunCompletedScenes.value;
              failedSceneIndexes.value.add(currentIdx);
            }
          }
        });

        dryRunEventSource.addEventListener('done', (e: MessageEvent) => {
          const data = JSON.parse(e.data);
          isDryRunning.value = false;
          dryRunScenario.value = data.scenario || '';
          loadingBar.finish();
          message.success('Dry run completed');
          if (dryRunEventSource) {
            dryRunEventSource.close();
            dryRunEventSource = null;
          }
        });

        dryRunEventSource.addEventListener('error', () => {
          isDryRunning.value = false;
          loadingBar.finish();
          message.error('Dry run failed');
          if (dryRunEventSource) {
            dryRunEventSource.close();
            dryRunEventSource = null;
          }
        });

        loadingBar.finish();
      } catch (error: any) {
        console.error('Failed to start dry run:', error);
        isDryRunning.value = false;
        loadingBar.finish();
        const data = error?.response?.data;
        if (data?.message) {
          message.error(String(data.message));
        } else {
          message.error('Failed to start dry run');
        }
      }
    };

    const dryRunScenarioHtml = computed(() => {
      if (!dryRunScenario.value) return '';
      return md.render(dryRunScenario.value);
    });


    const getSceneDotVariant = (idx: number): 'yellow' | 'red' | 'green' | 'gray' => {
      if (!isDryRunning.value && !dryRunScenario.value) return 'gray';
      if (failedSceneIndexes.value.has(idx)) return 'red';
      if (idx < dryRunCompletedScenes.value) return 'green';
      if (idx === dryRunCompletedScenes.value && isDryRunning.value) return 'yellow';
      if (dryRunScenario.value && idx < dryRunCompletedScenes.value) return 'green';
      return 'gray';
    };

    const getSceneDotActive = (idx: number): boolean => {
      if (!isDryRunning.value) return false;
      return idx === dryRunCompletedScenes.value;
    };

    const downloadScenario = () => {
      if (!dryRunScenario.value) return;
      const blob = new Blob([dryRunScenario.value], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `script-dry-run-${localFormData.name || 'scenario'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const goBack = () => {
      closeDryRunDialog();
      showScenarioDialog.value = false;
      router.push("/outline/scripts");
    };

    onMounted(async () => {
      try {
        loadingBar.start();
        // Load category-specific label options for scripts
        scriptLabelOptions.value = await referencesStore.fetchLabelsByCategory('script');
        
        const id = route.params.id as string;
        if (id && id !== 'new') {
          await store.fetch(id);
          const scriptData = { ...store.getCurrent } as Script;
          Object.assign(localFormData, scriptData);
          isPublic.value = (scriptData.accessLevel === 1);
          if (activeTab.value === 'scenes') {
            await fetchScenes();
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        const data = error?.response?.data;
        if (data?.message) {
          message.error(String(data.message));
        } else {
          message.error(getErrorMessage(error));
        }
        if (route.params.id) {
          router.push("/outline/scripts");
        }
      } finally {
        loadingBar.finish();
      }
    });

    const fetchAclData = async () => {
      const id = route.params.id as string;
      if (!id || id === 'new') {
        aclData.value = [];
        return;
      }
      try {
        aclLoading.value = true;
        const response = await store.fetchAccessList(id);
        aclData.value = response.accessList || [];
      } catch (e: any) {
        const data = e?.response?.data;
        if (data?.message) message.error(String(data.message)); else message.error(getErrorMessage(e));
        aclData.value = [];
      } finally {
        aclLoading.value = false;
      }
    };

    watch(activeTab, async (tab) => {
      if (tab === 'acl') {
        await fetchAclData();
      }
      if (tab === 'scenes') {
        await fetchScenes();
      }
    });

    const getSceneRowProps = (row: ScriptScene) => {
      return {
        style: 'cursor: pointer;',
        onClick: () => {
          router.push({ name: 'SceneForm', params: { id: row.id } });
        }
      };
    };

    onUnmounted(() => {
      if (dryRunEventSource) {
        dryRunEventSource.close();
        dryRunEventSource = null;
      }
      showDryRunDialog.value = false;
      showScenarioDialog.value = false;
      isDryRunning.value = false;
      dryRunScenario.value = null;
      dryRunWarnings.value = [];
      dryRunErrors.value = [];
      failedSceneIndexes.value.clear();
    });

    return {
      localFormData,
      formTitle,
      handleSave,
      goBack,
      activeTab,
      isPublic,
      referencesStore,
      editorExtensions,
      aclData,
      aclLoading,
      scriptLabelOptions,
      sceneStore,
      scenesLoading,
      sceneColumns,
      sceneRowKey,
      getSceneRowProps,
      // dry run
      showDryRunDialog,
      showScenarioDialog,
      openDryRunDialog,
      runDryRun,
      closeDryRunDialog,
      dryRunStationId,
      isDryRunning,
      dryRunScenario,
      dryRunScenarioHtml,
      dryRunDialogTitle,
      downloadScenario,
      getSceneDotVariant,
      getSceneDotActive,
      stationOptions,
      dialogBackgroundColor,
      dryRunWarnings,
      dryRunErrors,
    };
  },
});
</script>
