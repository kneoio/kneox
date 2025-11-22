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
        <n-tab-pane name="tts" tab="TTS">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Primary Voice">
                  <n-select 
                    v-model:value="localFormData.primaryVoiceId" 
                    :options="voiceOptions" 
                    filterable
                    style="width: 30%; max-width: 300px;"
                  />
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
  useLoadingBar,
  useMessage
} from 'naive-ui';
import { useAiAgentStore } from '../../../stores/kneo/aiAgentStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import AclTable from '../../common/AclTable.vue';
import { AiAgentSave, AiAgentForm } from '../../../types/kneoBroadcasterTypes';
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';

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
    NInputNumber,
    AclTable
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useAiAgentStore();
    const referencesStore = useReferencesStore();
    const route = useRoute();

    const activeTab = ref("properties");
    const aclData = ref([]);
    const aclLoading = ref(false);

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
      preferredLang: [],
      llmType: "",
      primaryVoice: [],
      primaryVoiceId: "",
      copilotId: ""
    });

    const createVoiceItem = () => ({
      id: "",
      name: ""
    });

    const createToolItem = () => ({
      name: "",
      variableName: null,
      description: ""
    });

    const createLangPrefItem = () => ({ code: 'en', weight: 1 });

    const handleSave = async () => {
      try {
        loadingBar.start();

        const saveData: AiAgentSave = {
          name: localFormData.name || '',
          preferredLang: localFormData.preferredLang || [],
          llmType: localFormData.llmType || '',
          searchEngineType: (localFormData as any).searchEngineType || undefined,
          primaryVoice: [],
          talkativity: (localFormData as any).talkativity || 0,
          podcastMode: (localFormData as any).podcastMode || 0
        };

        if (localFormData.primaryVoiceId) {
          const selectedVoice = voiceOptions.value.find(
            (v: { label: string; value: string }) => v.value === localFormData.primaryVoiceId
          );
          if (selectedVoice) {
            saveData.primaryVoice = [{ id: selectedVoice.value, name: selectedVoice.label }];
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
          if (agentData.primaryVoice && agentData.primaryVoice.length > 0) {
            agentData.primaryVoiceId = agentData.primaryVoice[0]?.id || '';
          }
          if (agentData.copilot) {
            agentData.copilotId = agentData.copilot;
          }
          Object.assign(localFormData, agentData);
        } else {
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
      createLangPrefItem,
      handleSave,
      goBack,
      activeTab,
      aclData,
      aclLoading,
      
    };
  }
});
</script>