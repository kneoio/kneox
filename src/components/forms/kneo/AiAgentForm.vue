<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.name || 'New AI Agent' }}</template>
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
                <n-form-item label="Copilot">
                  <n-select
                    v-model:value="localFormData.copilotId"
                    :options="copilotOptions"
                    filterable
                    clearable
                    style="width: 25%; max-width: 300px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Preferred Languages">
                  <n-dynamic-input
                    v-model:value="localFormData.preferredLang"
                    :on-create="createLangPrefItem"
                    style="width: 40%;"
                  >
                    <template #default="{ value }">
                      <n-grid cols="2" x-gap="8">
                        <n-gi>
                          <n-select
                            v-model:value="value.code"
                            :options="langOptions"
                            style="width: 100%; max-width: 300px;"
                          />
                        </n-gi>
                        <n-gi>
                          <n-input-number
                            v-model:value="value.weight"
                            :min="0"
                            :max="1"
                            :step="0.05"
                            style="width: 100%; max-width: 100px;"
                          />
                        </n-gi>
                      </n-grid>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="LLM Type">
                  <n-select v-model:value="localFormData.llmType" :options="llmTypeOptions"
                    style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="prompts" tab="Prompts">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Prompts">
                  <n-dynamic-input v-model:value="promptItems" :on-create="createPromptItem"
                    style="width: 90%;">
                    <template #default="{ value, index }">
                      <n-space vertical size="small" :key="value.id">
                        <n-space align="center" style="margin-bottom: 12px;">
                          <strong>{{ index + 1 }}</strong>
                          <n-switch v-model:value="value.enabled" :round="false">
                            <template #checked>Enabled</template>
                            <template #unchecked>Disabled</template>
                          </n-switch>
                        </n-space>                       
                        <CodeMirror
                          :key="value.id"
                          :model-value="value.text"
                          @update:model-value="(val) => updatePrompt(index, (typeof val === 'string' ? val : (((val as any)?.data) ?? '')) )"
                          basic
                          @ready="(payload: any) => onEditorReady(index, payload?.view)"
                          :style="{
                            width: '800px',
                            height: '500px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '3px',
                            overflow: 'auto'
                          }"
                          :extensions="editorExtensions"

                        />
                      </n-space>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="message-prompts" tab="Message Prompts">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Message Prompts">
                  <n-dynamic-input v-model:value="messagePromptItems" :on-create="createPromptItem"
                    style="width: 90%;">
                    <template #default="{ value, index }">
                      <n-space vertical size="small" :key="value.id">
                        <strong>{{ index + 1 }}</strong>
                        <n-space size="small" wrap>
                          <n-button
                            v-for="opt in referencesStore.variableOptions"
                            :key="opt.value"
                            size="small"
                            type="primary"
                            @click="insertMessageVariable(index, opt.value)"
                          >{{ opt.label }}</n-button>
                        </n-space>
                        <CodeMirror
                          :key="value.id"
                          :model-value="value.text"
                          @update:model-value="(val) => updateMessagePrompt(index, (typeof val === 'string' ? val : (((val as any)?.data) ?? '')) )"
                          basic
                          @ready="(payload: any) => onMessageEditorReady(index, payload?.view)"
                          :style="{
                            width: '800px',
                            height: '500px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '3px',
                            overflow: 'auto'
                          }"
                          :extensions="editorExtensions"
                        />
                      </n-space>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="mini-podcast-prompts" tab="Mini Podcast Prompts">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Mini Podcast Prompts">
                  <n-dynamic-input v-model:value="miniPodcastPromptItems" :on-create="createPromptItem"
                    style="width: 90%;">
                    <template #default="{ value, index }">
                      <n-space vertical size="small" :key="value.id">
                        <strong>{{ index + 1 }}</strong>
                        <n-space size="small" wrap>
                          <n-button
                            v-for="opt in referencesStore.variableOptions"
                            :key="opt.value"
                            size="small"
                            type="primary"
                            @click="insertMiniPodcastVariable(index, opt.value)"
                          >{{ opt.label }}</n-button>
                        </n-space>
                        <CodeMirror
                          :key="value.id"
                          :model-value="value.text"
                          @update:model-value="(val) => updateMiniPodcastPrompt(index, (typeof val === 'string' ? val : (((val as any)?.data) ?? '')) )"
                          basic
                          @ready="(payload: any) => onMiniPodcastEditorReady(index, payload?.view)"
                          :style="{
                            width: '800px',
                            height: '500px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '3px',
                            overflow: 'auto'
                          }"
                          :extensions="editorExtensions"
                        />
                      </n-space>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="playground" tab="Playground">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Variables">
                  <n-space vertical size="small" style="width: 800px;">
                    <div style="width: 800px; display: flex; align-items: center; gap: 12px;">
                      <n-dynamic-input
                        v-model:value="playgroundVars"
                        :on-create="createVariableItem"
                        style="flex: 1 1 auto;"
                        class="playground-vars-di"
                      >
                        <template #default="{ value, index }">
                          <n-grid cols="24" x-gap="12" style="width: 100%;">
                            <n-gi :span="9">
                              <n-select
                                v-model:value="value.name"
                                :options="referencesStore.variableOptions"
                                @update:value="() => refillVariable(index)"
                              />
                            </n-gi>
                            <n-gi :span="9">
                              <n-input v-model:value="value.value" placeholder=""/>
                            </n-gi>
                            <n-gi :span="6" style="display: flex; align-items: center;">
                              <n-button size="small" @click="refillVariable(index)">Refill</n-button>
                            </n-gi>
                          </n-grid>
                        </template>
                      </n-dynamic-input>
                    </div>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Prompt">
                  <CodeMirror
                    :model-value="playgroundPrompt"
                    @update:model-value="(val) => (playgroundPrompt = typeof val === 'string' ? val : (((val as any)?.data) ?? ''))"
                    basic
                    :style="{
                      width: '800px',
                      height: '300px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '3px',
                      overflow: 'auto'
                    }"
                    :extensions="editorExtensions"
                  />
                </n-form-item>
                <n-form-item  label="Actions">     
                  <n-space>
                    <n-select
                      v-model:value="localFormData.llmType"
                      :options="llmTypeOptions"
                      placeholder="LLM Type"
                      clearable
                      size="small"
                      style="width: 180px;"
                    />
                    <template v-for="(p, idx) in (promptItems || []).slice(0, 3)" :key="p.id">
                      <n-button size="small" @click="usePrompt(idx)">Get Prompt{{ idx + 1 }}</n-button>
                    </template>
                    <n-button @click="refillAllVariables">Refill all</n-button>
                    <n-button type="primary" :loading="playgroundLoading" @click="sendPlaygroundRequest">Send Request</n-button>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Result">
                  <template #label>
                    <span>Result</span>
                  </template>
                  <div v-if="playgroundResult" style="display: flex; align-items: flex-start; gap: 12px;">
                    <n-text strong style="display: inline-block; width: 800px; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere;">
                      {{ playgroundResult }}
                    </n-text>
                    <n-button size="small" @click="showResultModal = true">Open</n-button>
                  </div>
                </n-form-item>
                <n-modal v-model:show="showResultModal" preset="card" title="Result" :bordered="false" :style="{ maxWidth: '900px', width: '90vw', backgroundColor: dialogBackgroundColor }">
                  <n-scrollbar style="max-height: 70vh;">
                    <div style="white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere;">
                      {{ playgroundResult }}
                    </div>
                  </n-scrollbar>
                </n-modal>
                <n-form-item v-if="playgroundReasoning" label="Reasoning">
                  <n-text style="display: inline-block; width: 800px; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere;">
                    {{ playgroundReasoning }}
                  </n-text>
                </n-form-item>
                <n-form-item v-if="playgroundThinking" label="Thinking">
                  <n-text style="display: inline-block; width: 800px; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere;">
                    {{ playgroundThinking }}
                  </n-text>
                </n-form-item>
                <n-form-item v-if="playgroundSearchQuality" label="Search Quality">
                  <n-text>
                    {{ playgroundSearchQuality }}
                  </n-text>
                </n-form-item>
                <n-form-item v-if="playgroundLlmType" label="LLM Type">
                  <n-text>
                    {{ playgroundLlmType }}
                  </n-text>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="tts" tab="TTS">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Preferred Voice">
                  <n-select 
                    v-model:value="localFormData.preferredVoiceId" 
                    :options="voiceOptions" 
                    filterable

                    style="width: 30%; max-width: 300px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
              </n-gi>
              <n-gi>
                <n-form-item label="Talkativity">
                  <n-slider v-model:value="localFormData.talkativity" :min="0" :max="1" :step="0.05" :tooltip="false"
                    style="width: 50%; max-width: 600px;" />
                  <span style="margin-left: 12px;">{{ localFormData.talkativity }}</span>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Podcast Mode">
                  <n-slider v-model:value="localFormData.podcastMode" :min="0" :max="1" :step="0.05" :tooltip="false"
                    style="width: 50%; max-width: 600px;" />
                  <span style="margin-left: 12px;">{{ localFormData.podcastMode }}</span>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Merger Method">
                  <n-select 
                    v-model:value="localFormData.merger!.method" 
                    :options="referencesStore.mergerMethodOptions" 

                    style="width: 30%; max-width: 300px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Gain Intro">
                  <n-slider v-model:value="localFormData.merger!.gainIntro" :min="-5" :max="5" :step="0.1" :tooltip="false"
                    style="width: 50%; max-width: 600px;" />
                  <span style="margin-left: 12px;">{{ localFormData.merger!.gainIntro }}</span>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="acl" tab="ACL">
          <acl-table :acl-data="aclData" :loading="aclLoading" />
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NButton,
  NButtonGroup,
  NCard,
  NCollapseTransition,
  NDynamicInput,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NInputNumber,
  NPageHeader,
  NSelect,
  NSlider,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  NText,
  NModal,
  NScrollbar,
  NSwitch,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import { EditorView } from "@codemirror/view";

import { handlebarsLanguage } from "@xiechao/codemirror-lang-handlebars";
import CodeMirror from 'vue-codemirror6';
import { useAiAgentStore } from '../../../stores/kneo/aiAgentStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import AclTable from '../../common/AclTable.vue';
import { AiAgentSave, AiAgentForm } from '../../../types/kneoBroadcasterTypes';
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';
import { useDialogBackground } from '../../../composables/useDialogBackground';

export default defineComponent({
  name: "AiAgentForm",
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
    NSlider,
    NDynamicInput,
    NSpace,
    NCard,
    NTag,
    NText,
    NCollapseTransition,
    NModal,
    NScrollbar,
    NSwitch,
    NInputNumber,
    CodeMirror,
    AclTable
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useAiAgentStore();
    const referencesStore = useReferencesStore();
    const route = useRoute();
    const { dialogBackgroundColor } = useDialogBackground();
    const editorExtensions = computed(() => [
      handlebarsLanguage,
      EditorView.lineWrapping
    ]);

    const activeTab = ref("properties");
    const showVariables = ref(false);
    const aclData = ref([]);
    const aclLoading = ref(false);
    const showResultModal = ref(false);

    const formTitle = computed(() => localFormData.id ? 'Edit AI Agent' : 'Create New AI Agent');

    const voiceOptions = computed(() => 
      (referencesStore.voiceOptions || []).map(voice => ({
        label: voice.label,
        value: voice.value
      }))
    );

    const copilotOptions = computed(() => {
      const list = store.getEntries || [];
      return (list as any[]).map((a: any) => ({
        label: a?.name || a?.id || '',
        value: a?.id || ''
      })).filter(opt => !!opt.value);
    });

    const localFormData = reactive<AiAgentForm>({
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      name: "",
      prompts: [],
      preferredLang: [],
      llmType: "",
      fillerPrompt: [],
      preferredVoice: [],
      preferredVoiceId: "",
      copilotId: "",
      enabledTools: [],
      talkativity: 0.3,
      podcastMode: 0,
      merger: {
        method: "INTRO_SONG",
        gainIntro: 0
      }
    });

    // Stable prompt items with IDs to prevent index-based reuse issues
    const promptItems = ref<Array<{ id: string; text: string; enabled: boolean }>>([]);
    const messagePromptItems = ref<Array<{ id: string; text: string }>>([]);
    const miniPodcastPromptItems = ref<Array<{ id: string; text: string }>>([]);

    // Playground state
    const playgroundVars = ref<Array<{ name: string; value: string }>>([]);
    const playgroundPrompt = ref<string>('');
    const playgroundLoading = ref<boolean>(false);
    const playgroundResult = ref<string>('');
    const playgroundReasoning = ref<string>('');
    const playgroundThinking = ref<string>('');
    const playgroundSearchQuality = ref<string>('');
    const playgroundLlmType = ref<string>('');

    const createVoiceItem = () => ({
      id: "",
      name: ""
    });

    const createToolItem = () => ({
      name: "",
      variableName: null,
      description: ""
    });

    const createPromptItem = () => ({ id: crypto.randomUUID(), text: "", enabled: true });

    const createLangPrefItem = () => ({ code: 'en', weight: 1 });

    const updatePrompt = (index: number, text: string) => {
      const item = promptItems.value[index];
      if (item) item.text = text || '';
    };
    const updateMessagePrompt = (index: number, text: string) => {
      const item = messagePromptItems.value[index];
      if (item) item.text = text || '';
    };
    const updateMiniPodcastPrompt = (index: number, text: string) => {
      const item = miniPodcastPromptItems.value[index];
      if (item) item.text = text || '';
    };

    const createVariableItem = () => ({ name: '', value: '' });
    const refillVariable = (index: number) => {
      const item = playgroundVars.value[index];
      if (!item || !item.name) return;
      const samples: Record<string, string[]> = (referencesStore as any).variableSampleData || {};
      const arr = samples[item.name];
      if (!Array.isArray(arr) || arr.length === 0) return;
      item.value = arr[Math.floor(Math.random() * arr.length)];
    };

    const editorViews = ref<Record<number, EditorView | null>>({});
    const onEditorReady = (index: number, view?: EditorView) => {
      if (view) editorViews.value[index] = view;
    };
    const insertVariable = (index: number, variableName: string) => {
      const view = editorViews.value[index];
      if (!view) return;
      const insertText = `{${variableName}}`;
      const sel = view.state.selection.main;
      const from = sel.from;
      const to = sel.to;
      view.dispatch({
        changes: { from, to, insert: insertText },
        selection: { anchor: from + insertText.length }
      });
      const newText = view.state.doc.toString();
      if (Array.isArray(promptItems.value) && promptItems.value[index]) {
        promptItems.value[index].text = newText;
      }
      view.focus();
    };

    const messageEditorViews = ref<Record<number, EditorView | null>>({});
    const onMessageEditorReady = (index: number, view?: EditorView) => {
      if (view) messageEditorViews.value[index] = view;
    };
    const insertMessageVariable = (index: number, variableName: string) => {
      const view = messageEditorViews.value[index];
      if (!view) return;
      const insertText = `{${variableName}}`;
      const sel = view.state.selection.main;
      const from = sel.from;
      const to = sel.to;
      view.dispatch({
        changes: { from, to, insert: insertText },
        selection: { anchor: from + insertText.length }
      });
      const newText = view.state.doc.toString();
      if (Array.isArray(messagePromptItems.value) && messagePromptItems.value[index]) {
        messagePromptItems.value[index].text = newText;
      }
      view.focus();
    };

    const miniPodcastEditorViews = ref<Record<number, EditorView | null>>({});
    const onMiniPodcastEditorReady = (index: number, view?: EditorView) => {
      if (view) miniPodcastEditorViews.value[index] = view;
    };
    const insertMiniPodcastVariable = (index: number, variableName: string) => {
      const view = miniPodcastEditorViews.value[index];
      if (!view) return;
      const insertText = `{${variableName}}`;
      const sel = view.state.selection.main;
      const from = sel.from;
      const to = sel.to;
      view.dispatch({
        changes: { from, to, insert: insertText },
        selection: { anchor: from + insertText.length }
      });
      const newText = view.state.doc.toString();
      if (Array.isArray(miniPodcastPromptItems.value) && miniPodcastPromptItems.value[index]) {
        miniPodcastPromptItems.value[index].text = newText;
      }
      view.focus();
    };

    const usePrompt = (index: number) => {
      const item = promptItems.value[index];
      if (item) playgroundPrompt.value = item.text || '';
    };

    const refillAllVariables = () => {
      const options = referencesStore.variableOptions || [];
      const samples: Record<string, string[]> = (referencesStore as any).variableSampleData || {};
      const byName = new Map<string, { name: string; value: string }>();
      playgroundVars.value.forEach((v) => {
        if (v?.name) byName.set(v.name, v);
      });
      options.forEach((opt: { value: string }) => {
        const key = opt.value;
        if (key === 'history' || key === 'events' || key === 'messages') {
          const existing = byName.get(key);
          if (existing) existing.value = '';
          return;
        }
        const arr = samples[key];
        if (!Array.isArray(arr) || arr.length === 0) return;
        const val = arr[Math.floor(Math.random() * arr.length)];
        const existing = byName.get(key);
        if (existing) {
          existing.value = val;
        } else {
          playgroundVars.value.push({ name: key, value: val });
        }
      });
    };

    const sendPlaygroundRequest = async () => {
      try {
        playgroundLoading.value = true;
        playgroundResult.value = '';
        const variables: Record<string, string> = {};
        for (const item of playgroundVars.value) {
          if (item?.name) variables[item.name] = item.value || '';
        }
        const resp = await store.testPrompt({
          prompt: playgroundPrompt.value || '',
          llmType: localFormData.llmType || undefined,
          variables
        });
        if (resp?.actual_result) {
          playgroundResult.value = String(resp.actual_result);
        } else if (typeof resp === 'string') {
          playgroundResult.value = resp;
        } else if (resp?.result) {
          playgroundResult.value = String(resp.result);
        } else if (resp?.data?.result) {
          playgroundResult.value = String(resp.data.result);
        } else if (resp?.payload?.result) {
          playgroundResult.value = String(resp.payload.result);
        } else {
          playgroundResult.value = typeof resp === 'object' ? JSON.stringify(resp, null, 2) : String(resp ?? '');
        }
        playgroundReasoning.value = resp?.reasoning ? String(resp.reasoning) : '';
        playgroundThinking.value = resp?.thinking ? String(resp.thinking) : '';
        playgroundSearchQuality.value =
          typeof resp?.search_quality !== 'undefined' && resp?.search_quality !== null
            ? String(resp.search_quality)
            : '';
        playgroundLlmType.value = resp?.llm_type ? String(resp.llm_type) : '';
      } catch (e: any) {
        console.error('Playground request failed', e);
        const data = e?.response?.data;
        if (data && Array.isArray(data.errors) && data.errors.length > 0) {
          const msg = data.errors
            .map((err: { field?: string; message?: string }) => `${err.field || 'field'}: ${err.message || ''}`)
            .join('; ');
          message.error(msg);
        } else if (data?.message) {
          message.error(String(data.message));
        } else {
          message.error(getErrorMessage(e));
        }
        playgroundResult.value = '';
        playgroundReasoning.value = '';
        playgroundThinking.value = '';
        playgroundSearchQuality.value = '';
        playgroundLlmType.value = '';
      } finally {
        playgroundLoading.value = false;
      }
    };

    const handleSave = async () => {
      try {
        loadingBar.start();

        const saveData: AiAgentSave = {
          name: localFormData.name || '',
          preferredLang: localFormData.preferredLang || [],
          llmType: localFormData.llmType || '',
          searchEngineType: (localFormData as any).searchEngineType || undefined,
          talkativity: localFormData.talkativity || 0.3,
          podcastMode: localFormData.podcastMode || 0,
          preferredVoice: [],
          merger: localFormData.merger ? {
            method: localFormData.merger.method,
            gainIntro: localFormData.merger.gainIntro
          } : undefined
        };

        if (localFormData.preferredVoiceId) {
          const selectedVoice = voiceOptions.value.find(
            (v: { label: string; value: string }) => v.value === localFormData.preferredVoiceId
          );
          if (selectedVoice) {
            saveData.preferredVoice = [{ id: selectedVoice.value, name: selectedVoice.label }];
          }
        }

        if (localFormData.copilotId) {
          saveData.copilot = localFormData.copilotId;
        }

        const id = localFormData.id ? localFormData.id : null;
        await store.save(saveData, id);
        message.success("AI Agent saved successfully");
        await router.push("/outline/ai_agents");
      } catch (error: any) {
        console.error('Failed to save AI Agent:', error);
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const goBack = () => {
      router.push("/outline/ai_agents");
    };

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
      } catch (error) {
        console.error('Failed to fetch ACL data:', error);
        message.error('Failed to fetch access control list');
        aclData.value = [];
      } finally {
        aclLoading.value = false;
      }
    };

    watch(activeTab, (newTab) => {
      if (newTab === 'acl' && localFormData.id) {
        fetchAclData();
      }
    });

    onMounted(async () => {
      try {
        loadingBar.start();
        await referencesStore.fetchVoices();
        try { await store.fetchAllUnsecured(1, 1000); } catch {}
        const id = route.params.id as string;
        if (id) {
          await store.fetch(id);
          const agentData = { ...store.getCurrent } as AiAgentForm;
          if (agentData.preferredVoice && agentData.preferredVoice.length > 0) {
            agentData.preferredVoiceId = agentData.preferredVoice[0]?.id || '';
          }
          if (!agentData.merger) {
            agentData.merger = { method: "INTRO_SONG", gainIntro: 0 } as any;
          }
          if (agentData.copilot) {
            agentData.copilotId = agentData.copilot;
          }
          Object.assign(localFormData, agentData);
          promptItems.value = (agentData.prompts || []).map((p: { enabled: boolean; prompt: string }) => ({
            id: crypto.randomUUID(),
            text: p.prompt || '',
            enabled: p.enabled
          }));
          messagePromptItems.value = (agentData.messagePrompts || []).map((t: string) => ({ id: crypto.randomUUID(), text: t || '' }));
          miniPodcastPromptItems.value = (agentData.miniPodcastPrompts || []).map((t: string) => ({ id: crypto.randomUUID(), text: t || '' }));
        } else {
          promptItems.value = (localFormData.prompts || []).map((p: { enabled: boolean; prompt: string }) => ({
            id: crypto.randomUUID(),
            text: p.prompt || '',
            enabled: p.enabled
          }));
          messagePromptItems.value = [];
          miniPodcastPromptItems.value = [];
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
          router.push("/outline/ai_agents");
        }
      } finally {
        loadingBar.finish();
      }
    });

    return {
      localFormData,
      langOptions: referencesStore.languageOptions,
      llmTypeOptions: referencesStore.llmTypeOptions,
      voiceOptions,
      copilotOptions,
      referencesStore,
      formTitle,
      createVoiceItem,
      createToolItem,
      createPromptItem,
      createLangPrefItem,
      playgroundPrompt,
      playgroundLoading,
      playgroundResult,
      playgroundReasoning,
      playgroundThinking,
      playgroundSearchQuality,
      playgroundLlmType,
      createVariableItem,
      refillVariable,
      refillAllVariables,
      playgroundVars,
      usePrompt,
      sendPlaygroundRequest,
      handleSave,
      goBack,
      editorExtensions,
      activeTab,
      showVariables,
      aclData,
      aclLoading,
      showResultModal,
      onEditorReady,
      insertVariable,
      // message prompts
      messagePromptItems,
      updateMessagePrompt,
      onMessageEditorReady,
      insertMessageVariable,
      // mini podcast prompts
      miniPodcastPromptItems,
      updateMiniPodcastPrompt,
      onMiniPodcastEditorReady,
      insertMiniPodcastVariable,
      // prompts
      promptItems,
      updatePrompt,
      dialogBackgroundColor
    };
  }
});
</script>