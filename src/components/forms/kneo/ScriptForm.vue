<template>
  <div>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>
          <div style="display:flex; align-items:center; gap:8px;">
            <span>{{ localFormData.name || 'New Script' }}</span>
            <n-tag size="small" type="warning" v-if="isPublic">Public</n-tag>
            <n-tag size="small" type="default" v-else>Private</n-tag>
          </div>
        </template>
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
        <n-button type="default" @click="handleClone" size="large" :disabled="!localFormData.id">Clone</n-button>
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
                <n-form-item label="Language" v-if="false">
                  <n-select v-model:value="localFormData.languageTag" :options="langOptions" style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Default Profile">
                  <n-select v-model:value="localFormData.defaultProfileId" :options="profileOptions" filterable style="width: 25%; max-width: 300px;" />
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
                <n-form-item label="Mode">
                  <n-radio-group v-model:value="localFormData.timingMode" name="timing-mode-group">
                    <n-radio-button :value="SceneTimingMode.ABSOLUTE_TIME">Radio</n-radio-button>
                    <n-radio-button :value="SceneTimingMode.RELATIVE_TO_STREAM_START">One Time Stream</n-radio-button>
                  </n-radio-group>
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
              <n-gi v-if="localFormData.requiredVariables && localFormData.requiredVariables.length">
                <n-form-item label="Required Variables">
                  <div style="font-size: 12px; color: #666;">
                    <div v-for="(variable, index) in localFormData.requiredVariables" :key="index" style="margin-bottom: 4px;">
                      <strong>{{ variable.name }}</strong> ({{ variable.type }}) - {{ variable.description }}
                      <span v-if="variable.required" style="color: #e74c3c;">*</span>
                    </div>
                  </div>
                </n-form-item>
              </n-gi>
              
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="scenes" tab="Scenes">
          <div style="margin-bottom: 12px;">
            <n-button type="primary" @click="addNewScene" size="small">New Scene</n-button>
          </div>
          <n-data-table
            :columns="sceneColumns"
            :row-key="sceneRowKey"
            :data="localScenes"
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
        <div style="display:flex; flex-direction:column; gap:2px; width: 100%; margin-top: 8px;">
          <div v-for="(sc, idx) in localScenes" :key="sceneRowKey(sc)" style="display:flex; align-items:center; gap:8px;">
            <GreenLed :active="getSceneDotActive(idx)" :pulse="getSceneDotActive(idx)" />
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

  <n-modal
    v-model:show="showSceneDialog"
    preset="dialog"
    :closable="false"
    :mask-closable="false"
    :close-on-esc="false"
    :style="{ width: '800px', backgroundColor: dialogBackgroundColor }"
  >
    <template #header>
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
        <span>{{ selectedScene?.title || 'Scene' }}</span>
        <button type="button" @click="closeSceneDialog" aria-label="Close" style="background:none; border:none; font-size:18px; line-height:1; cursor:pointer;">×</button>
      </div>
    </template>
    <n-form v-if="selectedScene" label-placement="left" label-width="140">
      <n-form-item label="Title">
        <n-input v-model:value="selectedScene.title" placeholder="" />
      </n-form-item>
      <n-form-item label="Start time">
        <div style="display: flex; align-items: center; gap: 24px;">
          <n-time-picker v-model:value="sceneStartTimeMs" format="HH:mm:ss" style="width: 200px;" />
          <n-checkbox v-model:checked="selectedScene.oneTimeRun">One-time run</n-checkbox>
        </div>
      </n-form-item>
      <n-form-item label="Talkativity">
        <n-slider v-model:value="selectedScene.talkativity" :min="0" :max="1" :step="0.05" :tooltip="false" style="flex: 1; max-width: 400px;" />
        <span style="margin-left: 12px; min-width: 40px;">{{ selectedScene.talkativity || 0 }}</span>
      </n-form-item>
    
      <n-form-item label="Weekdays">
        <n-checkbox-group v-model:value="selectedWeekdays">
          <n-checkbox :value="1" label="Mon" />
          <n-checkbox :value="2" label="Tue" />
          <n-checkbox :value="3" label="Wed" />
          <n-checkbox :value="4" label="Thu" />
          <n-checkbox :value="5" label="Fri" />
          <n-checkbox :value="6" label="Sat" />
          <n-checkbox :value="7" label="Sun" />
        </n-checkbox-group>
      </n-form-item>
      <n-form-item label="Actions">
        <div style="width: 100%; max-height: 260px; overflow-y: auto; padding-right: 4px;">
          <n-dynamic-input
            v-model:value="scenePrompts"
            :on-create="createScenePrompt"
            placeholder=""              
          >
            <template #default="{ index }">
              <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                <n-select
                  v-model:value="scenePrompts[index].promptId"
                  :options="promptOptions"
                  placeholder=""
                />
              </div>
            </template>
          </n-dynamic-input>
        </div>
      </n-form-item>
    </n-form>
    <template #action>
      <n-space justify="space-between" style="width: 100%;">
        <n-button v-if="selectedScene?.id" type="error" @click="deleteSceneFromDialog">Delete</n-button>
        <n-space>
          <n-button @click="closeSceneDialog">Cancel</n-button>
          <n-button type="primary" @click="saveSceneDialog">OK</n-button>
        </n-space>
      </n-space>
    </template>
  </n-modal>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, reactive, ref, watch } from "vue";
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
  NInputNumber,
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
  NSwitch,
  NTimePicker,
  NDynamicInput,
  NCheckboxGroup,
  NSlider,
  NTag,
  NRadioGroup,
  NRadioButton,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import { useScriptStore } from '../../../stores/kneo/scriptStore';
import { useScriptSceneStore } from '../../../stores/kneo/scriptSceneStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { usePromptStore } from '../../../stores/kneo/promptStore';
import { SceneTimingMode, Script, ScriptSave, ScriptScene, ScenePromptDTO } from '../../../types/kneoBroadcasterTypes';
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';
import { EditorView } from "@codemirror/view";
import { json } from "@codemirror/lang-json";
import CodeMirror from 'vue-codemirror6';
import AclTable from '../../common/AclTable.vue';
import GreenLed from '../../common/GreenLed.vue';
import { useRadioStationStore } from '../../../stores/kneo/radioStationStore';
import { useProfileStore } from '../../../stores/kneo/profileStore';
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
    NInputNumber,
    NButton,
    NTabs,
    NTabPane,
    NGrid,
    NGi,
    NSelect,
    NText,
    NDataTable,
    NCheckbox,
    NSwitch,
    NTimePicker,
    NDynamicInput,
    NCheckboxGroup,
    NSlider,
    NTag,
    NRadioGroup,
    NRadioButton,
    CodeMirror,
    AclTable,
    NModal,
    NSpace,
    NAlert,
    GreenLed,
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
    const profileStore = useProfileStore();
    const promptStore = usePromptStore();
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
      defaultProfileId: undefined,
      languageTag: "",
      labels: [],
      accessLevel: 0,
      timingMode: SceneTimingMode.RELATIVE_TO_STREAM_START,
      scenes: []
    });

    const isPublic = ref(false);

    const sceneRowKey = (row: any) => row.id || `temp-${row.startTime || Math.random()}`;
    const sceneColumns = computed(() => [
      { title: 'Title', key: 'title', width: 200 },
      {
        title: 'Start',
        key: 'startTime',
        width: 200,
        render: (row: any) => {
          const content: any[] = [];
          if (row.startTime) content.push(h('span', row.startTime));
          if (row.oneTimeRun) {
            content.push(
              h(
                NTag,
                { type: 'success', size: 'small', style: 'margin-left:8px;' },
                { default: () => 'One-time' }
              )
            );
          }
          return content.length > 0
            ? h('div', { style: 'display:flex; align-items:center;' }, content)
            : null;
        }
      },
      { title: 'Prompts', key: 'prompts', render: (r: any) => Array.isArray(r.prompts) ? r.prompts.length : 0 }
    ]);

    const stationOptions = computed(() => {
      const list = (radioStore as any).getEntries || [];
      return list.map((st: any) => ({ label: st.localizedName?.en || st.name || st.slugName || st.id, value: st.id }));
    });

    const profileOptions = computed(() => {
      const list = (profileStore as any).getEntries || [];
      return list.map((p: any) => ({ label: p.name, value: p.id }));
    });

    const localScenes = computed(() => localFormData.scenes || []);

    const handleSave = async () => {
      try {
        loadingBar.start();

        const cleanedScenes = (localFormData.scenes || []).map(scene => ({
          id: scene.id,
          title: scene.title,
          talkativity: scene.talkativity,
          podcastMode: scene.podcastMode,
          prompts: scene.prompts,
          startTime: scene.startTime,
          oneTimeRun: scene.oneTimeRun,
          weekdays: scene.weekdays,
          durationSeconds: scene.durationSeconds,
          seqNum: scene.seqNum,
          stagePlaylist: scene.stagePlaylist ? {
            sourcing: scene.stagePlaylist.sourcing,
            searchTerm: scene.stagePlaylist.searchTerm,
            genres: scene.stagePlaylist.genres,
            labels: scene.stagePlaylist.labels,
            type: scene.stagePlaylist.type,
            source: scene.stagePlaylist.source,
            soundFragments: (scene.stagePlaylist as any).staticList
          } : undefined
        }));

        const saveData: ScriptSave = {
          name: localFormData.name || '',
          description: localFormData.description || '',
          defaultProfileId: localFormData.defaultProfileId,
          languageTag: localFormData.languageTag,
          labels: localFormData.labels || [],
          accessLevel: isPublic.value ? 1 : 0,
          timingMode: localFormData.timingMode,
          scenes: cleanedScenes
        };

        const id = localFormData.id ? localFormData.id : null;
        await store.save(saveData, id);
        message.success("Script saved successfully");
        await navigateBack();
      } catch (error: any) {
        console.error('Failed to save Script:', error);
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const handleClone = async () => {
      try {
        loadingBar.start();
        const response = await apiClient.post(`/scripts/${localFormData.id}/clone`, {
          title: `${localFormData.name} (Copy)`
        });
        message.success("Script cloned successfully");
        await router.push(`/outline/scripts/${response.data.id}`);
      } catch (error: any) {
        console.error('Failed to clone Script:', error);
        const data = error?.response?.data;
        if (data?.message) {
          message.error(String(data.message));
        } else {
          message.error('Failed to clone script');
        }
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
        try { await radioStore.fetchAll(1, 100); } catch {}
        
        // Pre-select station from query parameter or brandName route param
        const slugName = route.query.stationId || route.params.brandName;
        if (slugName && typeof slugName === 'string') {
          const list = (radioStore as any).getEntries || [];
          const station = list.find((st: any) => st.slugName === slugName);
          if (station) {
            dryRunStationId.value = station.id;
          }
        }
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


    const getSceneDotVariant = (idx: number): 'red' | 'green' | 'gray' => {
      if (!isDryRunning.value && !dryRunScenario.value) return 'gray';
      if (failedSceneIndexes.value.has(idx)) return 'red';
      if (idx < dryRunCompletedScenes.value) return 'green';
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

    const navigateBack = async () => {
      if (route.query.returnTo) {
        await router.push({ name: route.query.returnTo as string });
      } else if (route.params.brandName) {
        await router.push(`/outline/station/${route.params.brandName}/scripts`);
      } else {
        const previousRoute = router.options.history.state.back;
        if (previousRoute && previousRoute.toString().includes('/outline/document-tree')) {
          await router.push('/outline/document-tree');
        } else {
          await router.push("/outline/scripts");
        }
      }
    };

    const goBack = () => {
      closeDryRunDialog();
      showScenarioDialog.value = false;
      navigateBack();
    };

    onMounted(async () => {
      try {
        loadingBar.start();
        scriptLabelOptions.value = await referencesStore.fetchLabelsByCategory('script');
        await profileStore.fetchAllUnsecured(1, 100);
        await promptStore.fetchAll(1, 100, { master: true });
        try { await radioStore.fetchAll(1, 100); } catch {}
        
        const id = route.params.id as string;
        if (id && id !== 'new') {
          await store.fetch(id);
          const scriptData = { ...store.getCurrent } as Script;
          Object.assign(localFormData, scriptData);
          isPublic.value = (scriptData.accessLevel === 1);
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
    });

    const showSceneDialog = ref(false);
    const selectedScene = ref<ScriptScene | null>(null);
    const scenePrompts = ref<ScenePromptDTO[]>([]);
    const selectedWeekdays = ref<number[]>([]);
    const sceneStartTimeMs = ref<number | null>(null);

    const parseTimeToMs = (timeStr: string | undefined | null): number | null => {
      if (!timeStr) return null;
      const timeOnly = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
      const parts = timeOnly.split(':');
      const hh = Number(parts[0] || 0);
      const mm = Number(parts[1] || 0);
      const ss = Number(parts[2] || 0);
      const d = new Date(1970, 0, 1, hh, mm, ss);
      const ms = d.getTime();
      return Number.isNaN(ms) ? null : ms;
    };

    const formatTimeFromMs = (ms: number): string => {
      const d = new Date(ms);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    };

    const promptOptions = computed(() =>
      (promptStore.getEntries || [])
        .filter((p: any) => typeof p.id === 'string' && p.id)
        .filter((p: any) => p?.master === true)
        .map((p: any) => ({
          label: p.title || p.id,
          value: p.id as string
        }))
    );

    const createScenePrompt = (): ScenePromptDTO => ({
      promptId: '',
      active: true,
      rank: 0,
      weight: 0.5
    });

    const openSceneDialog = (scene: ScriptScene) => {
      selectedScene.value = { ...scene };
      scenePrompts.value = scene.prompts ? [...scene.prompts] : [];
      selectedWeekdays.value = scene.weekdays ? [...scene.weekdays] : [];
      sceneStartTimeMs.value = parseTimeToMs(scene.startTime);
      showSceneDialog.value = true;
    };

    const closeSceneDialog = () => {
      showSceneDialog.value = false;
      selectedScene.value = null;
      scenePrompts.value = [];
      selectedWeekdays.value = [];
      sceneStartTimeMs.value = null;
    };

    const addNewScene = () => {
      const newScene: ScriptScene = {
        id: null as any,
        title: '',
        talkativity: 0.5,
        podcastMode: 0,
        prompts: [],
        startTime: '09:00:00',
        oneTimeRun: false,
        weekdays: [1, 2, 3, 4, 5, 6, 7]
      };
      if (!localFormData.scenes) localFormData.scenes = [];
      localFormData.scenes.push(newScene);
      openSceneDialog(newScene);
    };

    const deleteScene = (scene: ScriptScene) => {
      if (!localFormData.scenes) return;
      const index = localFormData.scenes.findIndex(s => 
        s.id ? s.id === scene.id : s === scene
      );
      if (index !== -1) {
        localFormData.scenes.splice(index, 1);
      }
    };

    const deleteSceneFromDialog = () => {
      if (!selectedScene.value) return;
      deleteScene(selectedScene.value);
      closeSceneDialog();
    };

    const saveSceneDialog = () => {
      if (!selectedScene.value) return;
      const sceneIndex = localFormData.scenes?.findIndex(s => 
        s.id ? s.id === selectedScene.value?.id : s === selectedScene.value
      );
      if (sceneIndex !== undefined && sceneIndex !== -1 && localFormData.scenes) {
        localFormData.scenes[sceneIndex] = {
          ...selectedScene.value,
          prompts: scenePrompts.value,
          weekdays: selectedWeekdays.value,
          startTime: sceneStartTimeMs.value != null ? formatTimeFromMs(sceneStartTimeMs.value) : selectedScene.value.startTime
        };
      }
      closeSceneDialog();
    };

    const getSceneRowProps = (row: ScriptScene) => {
      return {
        style: 'cursor: pointer;',
        onClick: () => {
          openSceneDialog(row);
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
      SceneTimingMode,
      handleSave,
      handleClone,
      goBack,
      activeTab,
      isPublic,
      referencesStore,
      langOptions: (referencesStore as any).languageOptions,
      profileOptions,
      editorExtensions,
      aclData,
      aclLoading,
      scriptLabelOptions,
      sceneStore,
      scenesLoading,
      sceneColumns,
      sceneRowKey,
      getSceneRowProps,
      localScenes,
      showSceneDialog,
      selectedScene,
      closeSceneDialog,
      saveSceneDialog,
      addNewScene,
      deleteScene,
      deleteSceneFromDialog,
      scenePrompts,
      selectedWeekdays,
      sceneStartTimeMs,
      promptOptions,
      createScenePrompt,
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
