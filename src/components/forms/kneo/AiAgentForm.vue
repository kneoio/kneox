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
                <n-form-item label="Preferred Language">
                  <n-select v-model:value="localFormData.preferredLang" :options="langOptions"
                    style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="LLM Type">
                  <n-select v-model:value="localFormData.llmType" :options="llmTypeOptions"
                    style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Enabled Tools">
                  <n-dynamic-input v-model:value="localFormData.enabledTools" :on-create="createToolItem"
                    style="width: 60%;">
                    <template #default=" { value, index } ">
                      <n-grid cols="3" x-gap="12">
                        <n-gi>
                          <n-input v-model:value="value.name" />
                        </n-gi>
                        <n-gi>
                          <n-input v-model:value="value.variableName" />
                        </n-gi>
                        <n-gi>
                          <n-input v-model:value="value.description" />
                        </n-gi>
                      </n-grid>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>


              <n-gi>
                <n-form-item label="Filler Prompt">
                  <n-dynamic-tags v-model:value="localFormData.fillerPrompt" style="width: 60%;" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="prompts" tab="Prompts">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-button @click="showVariables = !showVariables" type="default" size="small" class="mb-3">
                  {{ showVariables ? 'Hide' : 'Show' }} Available Variables
                </n-button>
                <n-collapse-transition :show="showVariables">
                  <n-card size="small" style="margin-bottom: 16px; width: 90%;">
                    <n-space vertical size="small">
                      <div><strong>Variables:</strong></div>
                      <n-space size="small" wrap>
                        <n-tag v-for="opt in referencesStore.variableOptions" :key="opt.value" type="info" size="small">
                          <strong>{{ opt.label }}</strong>
                        </n-tag>
                      </n-space>

                      <div style="margin-top: 16px;"><strong>Voice Emotions & Effects:</strong></div>
                      <div>You can suggest to use: <code>[sad]</code>,<code>[angry]</code>,<code>[curious]</code>,<code>[happily]</code>,<code>[whispers]</code>,<code>[shouts]</code>,<code>[laughs]</code>,<code>[clears throat]</code></div>
                    </n-space>
                  </n-card>
                </n-collapse-transition>
              </n-gi>
              <n-gi>
                <n-form-item label="Prompts">
                  <n-dynamic-input v-model:value="localFormData.prompts" :on-create="createPromptItem"
                    style="width: 90%;">
                    <template #default="{ value, index }">
                      <n-space vertical size="small">
                        <strong>{{ index + 1 }}</strong>
                        <CodeMirror
                          :model-value="value"
                          @update:model-value="(val) => localFormData.prompts[index] = val || ''"
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
                              <n-select v-model:value="value.name" :options="referencesStore.variableOptions" />
                            </n-gi>
                            <n-gi :span="9">
                              <n-input v-model:value="value.value" placeholder=""/>
                            </n-gi>
                            <n-gi :span="6" v-if="index === 0" style="display: flex; align-items: center;">
                              <n-button size="small" @click="randomFillVariables">Random Fill</n-button>
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
                    @update:model-value="(val) => (playgroundPrompt = typeof val === 'string' ? val : (val?.data ?? ''))"
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
                    <n-button type="primary" :loading="playgroundLoading" @click="sendPlaygroundRequest">Send Request</n-button>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Result">
                  <n-text v-if="playgroundResult" style="display: inline-block; width: 800px; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere;">
                    {{ playgroundResult }}
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
                <n-form-item label="Talkativity">
                  <n-slider v-model:value="localFormData.talkativity" :min="0" :max="1" :step="0.05" :tooltip="false"
                    style="width: 50%; max-width: 600px;" />
                  <span style="margin-left: 12px;">{{ localFormData.talkativity }}</span>
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
  NDynamicTags,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NPageHeader,
  NSelect,
  NSlider,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  NText,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import { EditorView } from "@codemirror/view";

import { json } from "@codemirror/lang-json";
import CodeMirror from 'vue-codemirror6';
import { useAiAgentStore } from '../../../stores/kneo/aiAgentStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import AclTable from '../../common/AclTable.vue';
import { AiAgentSave, AiAgentForm, LanguageCode } from '../../../types/kneoBroadcasterTypes';

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
    NDynamicTags,
    NSpace,
    NCard,
    NTag,
    NText,
    NCollapseTransition,
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
    const editorExtensions = computed(() => [
      json(),
      EditorView.lineWrapping
    ]);

    const activeTab = ref("properties");
    const showVariables = ref(false);
    const aclData = ref([]);
    const aclLoading = ref(false);

    const formTitle = computed(() => localFormData.id ? 'Edit AI Agent' : 'Create New AI Agent');

    const voiceOptions = computed(() => 
      (referencesStore.voiceOptions || []).map(voice => ({
        label: voice.label,
        value: voice.value
      }))
    );



    const localFormData = reactive<AiAgentForm>({
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      name: "",
      prompts: [],
      preferredLang: "en" as LanguageCode,
      llmType: "",
      fillerPrompt: [],
      preferredVoice: [],
      preferredVoiceId: "",
      enabledTools: [],
      talkativity: 0.3,
      merger: {
        method: "INTRO_SONG",
        gainIntro: 0
      }
    });

    // Playground state
    const playgroundVars = ref<Array<{ name: string; value: string }>>([]);
    const playgroundPrompt = ref<string>('');
    const playgroundLoading = ref<boolean>(false);
    const playgroundResult = ref<string>('');

    const createFillerItem = () => "";

    const createVoiceItem = () => ({
      id: "",
      name: ""
    });

    const createToolItem = () => ({
      name: "",
      variableName: null,
      description: ""
    });

    const createPromptItem = () => "";

    // Playground helpers (minimal implementations)
    const createVariableItem = () => ({ name: '', value: '' });
    const randomFillVariables = () => {
      // no-op placeholder to satisfy UI; adjust if needed later
      if (playgroundVars.value.length === 0) playgroundVars.value.push({ name: '', value: '' });
    };
    const sendPlaygroundRequest = async () => {
      try {
        playgroundLoading.value = true;
        // placeholder implementation
        playgroundResult.value = '';
      } finally {
        playgroundLoading.value = false;
      }
    };

    const handleSave = async () => {
      try {
        loadingBar.start();

        const saveData: AiAgentSave = {
          name: localFormData.name || '',
          preferredLang: localFormData.preferredLang as LanguageCode,
          llmType: localFormData.llmType || '',
          prompts: localFormData.prompts || [],
          fillerPrompt: localFormData.fillerPrompt || [],
          enabledTools: localFormData.enabledTools || [],
          talkativity: localFormData.talkativity || 0.3,
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
            saveData.preferredVoice = [{
              id: selectedVoice.value,
              name: selectedVoice.label
            }];
          }
        }

        const id = localFormData.id ? localFormData.id : null;
        await store.save(saveData, id);

        message.success("AI Agent saved successfully");
        await router.push("/outline/ai_agents");
      } catch (error) {
        console.error('Failed to save AI Agent:', error);
        message.error('Failed to save AI Agent');
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
        const id = route.params.id as string;
        if (id) {
          await store.fetch(id);
          const agentData = { ...store.getCurrent } as AiAgentForm;

          if (agentData.preferredVoice && agentData.preferredVoice.length > 0) {
            agentData.preferredVoiceId = agentData.preferredVoice[0]?.id || '';
          }

          if (!agentData.merger) {
            agentData.merger = {
              method: "INTRO_SONG",
              gainIntro: 0
            };
          }

          Object.assign(localFormData, agentData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        message.error('Failed to fetch data');
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
      referencesStore,
      formTitle,
      createFillerItem,
      createVoiceItem,
      createToolItem,
      createPromptItem,
      // playground
      playgroundVars,
      playgroundPrompt,
      playgroundLoading,
      playgroundResult,
      createVariableItem,
      randomFillVariables,
      sendPlaygroundRequest,
      handleSave,
      goBack,
      editorExtensions,
      activeTab,
      showVariables,
      aclData,
      aclLoading
    };
  }
});
</script>