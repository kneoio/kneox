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
                  <n-input v-model:value="localFormData.name" style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Preferred Language">
                  <n-select v-model:value="localFormData.preferredLang" :options="langOptions"
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
                          <n-input v-model:value="value.name" placeholder="Tool Name" />
                        </n-gi>
                        <n-gi>
                          <n-input v-model:value="value.variableName" placeholder="Variable Name" />
                        </n-gi>
                        <n-gi>
                          <n-input v-model:value="value.description" placeholder="Description" />
                        </n-gi>
                      </n-grid>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Available Variables">
                  <div style="width: 60%;">
                    <n-card size="small" style="margin-bottom: 16px;">
                      <n-space vertical size="small">
                        <div><n-tag type="info" size="small"><strong>ai_dj_name</strong></n-tag> - The current DJ's name
                        </div>
                        <div><n-tag type="info" size="small"><strong>brand</strong></n-tag> - Radio station
                          name/identity
                          for consistent branding</div>
                        <div><n-tag type="info" size="small"><strong>song_title</strong></n-tag> - Name of the song
                          being
                          introduced to listeners</div>
                        <div><n-tag type="info" size="small"><strong>artist</strong></n-tag> - Performer/band name for
                          proper attribution</div>
                        <div><n-tag type="info" size="small"><strong>listeners</strong></n-tag> - Target audience
                          description to tailor messaging appropriately</div>
                        <div><n-tag type="info" size="small"><strong>context</strong></n-tag> - Current situational
                          context
                          like time of day, events, or show theme</div>
                        <div><n-tag type="info" size="small"><strong>history</strong></n-tag> - Previous show
                          interactions
                          to maintain conversational flow</div>
                        <div><n-tag type="info" size="small"><strong>instant_message</strong></n-tag> - Priority user
                          message content that takes precedence in introduction</div>
                        <div><n-tag type="info" size="small"><strong>events</strong></n-tag> - Various events that may
                          affect the introduction (DJ shifts, station events, etc.)</div>

                      </n-space>
                    </n-card>
                  </div>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Prompts">
                  <n-dynamic-input v-model:value="localFormData.prompts" :on-create="createPromptItem"
                    style="width: 60%;">
                    <template #default="{ value, index }">
                      <n-space vertical size="small">
                        <strong>{{ index + 1 }}</strong>
                        <n-input :value="value" type="textarea" :autosize="{
                          minRows: 3,
                          maxRows: 6
                        }" placeholder="Enter prompt text..." @input="(val) => localFormData.prompts[index] = val" />
                      </n-space>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Filler Prompt">
                  <n-dynamic-tags v-model:value="localFormData.fillerPrompt" style="width: 60%;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Preferred Voice">
                  <n-select 
                    v-model:value="localFormData.preferredVoiceId" 
                    :options="voiceOptions" 
                    filterable
                    placeholder="Select a voice"
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
import { AiAgent, AiAgentForm, LanguageCode } from '../../../types/kneoBroadcasterTypes';
import { NButton, NButtonGroup, NForm, NFormItem, NGi, NGrid, NInput, NPageHeader, NSlider, NSelect, NTabs, NTabPane, NDynamicInput, NTag, NSpace, NCard, NDynamicTags } from 'naive-ui';
import { useLoadingBar, useMessage } from 'naive-ui';
import { useAiAgentStore } from '../../../stores/kneo/aiAgentStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import CodeMirror from 'vue-codemirror6';
import AclTable from '../../common/AclTable.vue';

export default defineComponent({
  name: "AiAgentForm",
  components: {
    NButton,
    NButtonGroup,
    NForm,
    NFormItem,
    NGi,
    NGrid,
    NInput,
    NPageHeader,
    NSlider,
    NSelect,
    NTabs,
    NTabPane,
    NDynamicInput,
    NTag,
    NSpace,
    NCard,
    NDynamicTags,
    AclTable,
    CodeMirror
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useAiAgentStore();
    const referencesStore = useReferencesStore();
    const route = useRoute();
    const lang = ref(json());
    const editorExtensions = computed(() => [
      EditorView.lineWrapping
    ]);

    const activeTab = ref('properties');
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
      fillerPrompt: [],
      preferredVoice: [],
      preferredVoiceId: "",
      enabledTools: [],
      talkativity: 0.3
    });

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

    const handleSave = async () => {
      try {
        loadingBar.start();

        const saveData: Partial<AiAgent> = {
          name: localFormData.name || '',
          preferredLang: localFormData.preferredLang as LanguageCode,
          prompts: localFormData.prompts || [],
          fillerPrompt: localFormData.fillerPrompt || [],
          enabledTools: localFormData.enabledTools || [],
          talkativity: localFormData.talkativity || 0.3,
          preferredVoice: []
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
      voiceOptions,
      formTitle,
      createFillerItem,
      createVoiceItem,
      createToolItem,
      createPromptItem,
      handleSave,
      goBack,
      editorExtensions,
      lang,
      activeTab,
      aclData,
      aclLoading
    };
  }
} );
</script>