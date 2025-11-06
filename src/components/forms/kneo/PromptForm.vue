<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5" v-bind="$attrs">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>
          <span>{{ localFormData.id ? 'Prompt' : 'New Prompt' }}</span>
          <n-tag v-if="localFormData.master" type="success" size="small" class="ml-2">MASTER</n-tag>
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
        <n-button type="default" @click="openTestDialog" size="large">Test</n-button>
        <n-button type="default" :disabled="!localFormData.master" @click="handleReplicateClick" size="large">Replicate</n-button>
      </n-button-group>
    </n-gi>

    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Title">
                  <n-input v-model:value="localFormData.title" style="width: 50%; max-width: 600px;" placeholder=""/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Language">
                  <n-select v-model:value="localFormData.languageCode" :options="langOptions" style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Draft">
                  <n-select v-model:value="selectedDraftId" :options="draftOptions" style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Options">
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <n-checkbox v-model:checked="localFormData.enabled">Enabled</n-checkbox>
                    <n-checkbox v-model:checked="localFormData.master">Master</n-checkbox>
                    <n-checkbox v-model:checked="localFormData.locked">Locked</n-checkbox>
                    <n-checkbox v-model:checked="localFormData.podcast">Podcast</n-checkbox>
                  </div>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item>
                  <template #label>
                    <div>
                      Prompt<br>
                      <n-text depth="3" style="font-size: 12px;">Handlebars</n-text>
                    </div>
                  </template>
                  <CodeMirror
                    :model-value="localFormData.prompt"
                    @update:model-value="(val) => (localFormData.prompt = typeof val === 'string' ? val : (((val as any)?.data) ?? ''))"
                    basic
                    :disabled="localFormData.locked"
                    :style="{
                      width: '1200px',
                      height: '600px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '3px',
                      overflow: 'auto'
                    }"
                    :extensions="editorExtensions"
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

  <n-modal
    v-model:show="showTestDialog"
    preset="dialog"
    :closable="false"
    :mask-closable="false"
    :close-on-esc="false"
    :style="{ width: isWideScreen ? '1000px' : '90vw', backgroundColor: dialogBackgroundColor }"
  >
    <template #header>
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
        <span>Test Prompt</span>
        <button type="button" @click="showTestDialog = false" aria-label="Close" style="background:none; border:none; font-size:18px; line-height:1; cursor:pointer;">×</button>
      </div>
    </template>
    <n-space vertical size="small">
      <n-form label-placement="left" label-width="auto">
        <n-grid :cols="1" x-gap="12" y-gap="8">
          <n-gi>
            <n-form-item label="Song">
              <n-select v-model:value="testSongId" :options="songOptions" filterable style="width: 100%; max-width: 480px;" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Agent">
              <n-select v-model:value="testAgentId" :options="agentOptions" filterable style="width: 100%; max-width: 480px;" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Station">
              <n-select v-model:value="testStationId" :options="stationOptions" filterable style="width: 100%; max-width: 480px;" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="LLM Type">
              <n-radio-group v-model:value="testLlmType" name="llm-type-group">
                <n-radio-button
                  v-for="opt in llmTypeOptions"
                  :key="opt.value"
                  :value="opt.value"
                  :label="opt.label"
                />
              </n-radio-group>
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-form>
      <n-space>
        <n-button type="primary" :loading="testLoading" @click="runPromptTest">Run</n-button>
      </n-space>
      <n-text depth="3">Draft Result</n-text>
      <n-input type="textarea" placeholder="" :value="testDraftResult" :autosize="{ minRows: 6, maxRows: 12 }" style="width: 100%;" readonly />
      <n-text depth="3">Prompt Result</n-text>
      <n-input type="textarea" placeholder="" :value="testPromptFixed" :autosize="{ minRows: 4, maxRows: 10 }" style="width: 100%;" readonly />
      <n-space align="center" size="small">
        <n-checkbox v-model:checked="showReasoning">Show Reasoning</n-checkbox>
      </n-space>
      <n-collapse-transition :show="showReasoning">
        <div style="width: 100%; max-height: 300px; overflow: auto;">
          <n-code :code="testPromptReasoning" language="markdown" word-wrap />
        </div>
      </n-collapse-transition>
    </n-space>
  </n-modal>

  <n-modal v-model:show="showReplicateDialog" preset="dialog" title="Replicate Prompt" :style="{ backgroundColor: dialogBackgroundColor }">
    <n-space vertical>
      <n-text>Select languages to replicate this prompt:</n-text>
      <n-grid :cols="3" x-gap="12" y-gap="8">
        <n-gi v-for="lang in langOptions" :key="lang.value">
          <n-checkbox 
            :checked="selectedLanguages.includes(lang.value)" 
            @update:checked="(checked) => toggleLanguage(lang.value, checked)"
          >
            {{ lang.label }}
          </n-checkbox>
        </n-gi>
      </n-grid>
    </n-space>
    <template #action>
      <n-space>
        <n-button @click="showReplicateDialog = false">Cancel</n-button>
        <n-button type="primary" @click="handleReplicate" :disabled="selectedLanguages.length === 0">Replicate</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
  NSelect,
  NRadioGroup,
  NRadioButton,
  NSwitch,
  NTag,
  NModal,
  NSpace,
  NText,
  NCode,
  NCheckbox,
  NIcon,
  NCollapseTransition,
  useLoadingBar,
  useMessage,
  useThemeVars
} from 'naive-ui';
import { EditorView } from '@codemirror/view';
import { handlebarsLanguage } from '@xiechao/codemirror-lang-handlebars';
import CodeMirror from 'vue-codemirror6';
import { BroadcastPrompt, BroadcastPromptSave } from '../../../types/kneoBroadcasterTypes';
import { usePromptStore } from '../../../stores/kneo/promptStore';
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { useDraftStore } from '../../../stores/kneo/draftStore';
import { useSoundFragmentStore } from '../../../stores/kneo/soundFragmentStore';
import { useAiAgentStore } from '../../../stores/kneo/aiAgentStore';
import { useRadioStationStore } from '../../../stores/kneo/radioStationStore';
import apiClient from '../../../api/apiClient';
import AclTable from '../../common/AclTable.vue';
import { InfoCircle } from '@vicons/tabler';
import { useDialogBackground } from '../../../composables/useDialogBackground';

export default defineComponent({
  name: 'PromptForm',
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
    NSwitch,
    NTag,
    NModal,
    NSpace,
    NText,
    NCode,
    NCheckbox,
    NIcon,
    InfoCircle,
    NRadioGroup,
    NRadioButton,
    NCollapseTransition,
    CodeMirror,
    AclTable
  },
  setup() {
    const loadingBar = useLoadingBar();
    const themeVars = useThemeVars();
    const message = useMessage();
    const { dialogBackgroundColor } = useDialogBackground();
    const router = useRouter();
    const store = usePromptStore();
    const referencesStore = useReferencesStore();
    const draftStore = useDraftStore();
    const soundStore = useSoundFragmentStore();
    const aiAgentStore = useAiAgentStore();
    const radioStore = useRadioStationStore();
    const route = useRoute();

    const isWideScreen = ref(window.innerWidth >= 1200);
    const handleResize = () => {
      isWideScreen.value = window.innerWidth >= 1200;
    };
    onMounted(() => window.addEventListener('resize', handleResize));
    onUnmounted(() => window.removeEventListener('resize', handleResize));

    const activeTab = ref('properties');
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);
    const showReplicateDialog = ref(false);
    const selectedLanguages = ref<string[]>([]);
    const showTestDialog = ref(false);
    const testSongId = ref<string | null>(null);
    const testAgentId = ref<string | null>(null);
    const testStationId = ref<string | null>(null);
    const testLlmType = ref<string | null>(null);
    const testDraftResult = ref('');
    const testPromptResult = ref('');
    const testPromptFixed = ref('');
    const testPromptReasoning = ref('');
    const STORAGE_KEY_SHOW_REASONING = 'promptForm.showReasoning';
    const getSavedShowReasoning = () => {
      const saved = localStorage.getItem(STORAGE_KEY_SHOW_REASONING);
      return saved === 'true';
    };
    const showReasoning = ref(getSavedShowReasoning());
    const testLoading = ref(false);

    const editorExtensions = computed(() => [handlebarsLanguage, EditorView.lineWrapping]);

    const formTitle = computed(() => (localFormData.id ? 'Edit Prompt' : 'Create New Prompt'));
    const selectedDraftId = ref<string | null>(null);
    const draftOptions = computed(() =>
      (draftStore.getEntries || []).map((d: any) => ({ label: d.title || d.id, value: d.id }))
    );
    const songOptions = computed(() => {
      const list = (soundStore as any).getEntries || [];
      return list.slice(0, 10).map((s: any) => ({ label: s.title || s.id, value: s.id }));
    });
    const agentOptions = computed(() => {
      const list = (aiAgentStore as any).getEntries || [];
      return list.slice(0, 10).map((a: any) => ({ label: a.name || a.id, value: a.id }));
    });
    const stationOptions = computed(() => {
      const list = (radioStore as any).getEntries || [];
      return list.map((st: any) => ({ label: st.localizedName?.en || st.name || st.slugName || st.id, value: st.id }));
    });

    const localFormData = reactive<BroadcastPrompt>({
      id: '',
      author: '',
      regDate: '',
      lastModifier: '',
      lastModifiedDate: '',
      title: '',
      enabled: false,
      prompt: '',
      promptType: '',
      languageCode: '',
      master: false,
      locked: false,
      podcast: false
    });

    const handleSave = async () => {
      try {
        loadingBar.start();
        const lang = localFormData.languageCode || '';
        const hasLangInTitle = lang && (localFormData.title || '').includes(lang);
        const titleToSave = hasLangInTitle || !lang
          ? (localFormData.title || '')
          : `${(localFormData.title || '').trim()} (${lang})`;
        const saveData: BroadcastPromptSave = {
          title: titleToSave,
          enabled: localFormData.enabled,
          prompt: localFormData.prompt,
          promptType: localFormData.promptType,
          languageCode: localFormData.languageCode,
          master: localFormData.master,
          locked: localFormData.locked,
          podcast: localFormData.podcast,
        };
        (saveData as any).draftId = selectedDraftId.value || null;
        const id = localFormData.id ? localFormData.id : null;
        await store.save(saveData, id);
        message.success('Prompt saved successfully');
        await router.push('/outline/prompts');
      } catch (error: any) {
        console.error('Failed to save Prompt:', error);
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const goBack = () => {
      router.push('/outline/prompts');
    };

    const handleReplicateClick = () => {
      selectedLanguages.value = (referencesStore as any).languageOptions.map((lang: any) => lang.value);
      showReplicateDialog.value = true;
    };

    const handleReplicate = async () => {
      try {
        loadingBar.start();
        message.info(`Replicating prompt to ${selectedLanguages.value.length} language(s)...`);
        showReplicateDialog.value = false;
      } catch (error: any) {
        console.error('Failed to replicate prompt:', error);
        message.error('Failed to replicate prompt.');
      } finally {
        loadingBar.finish();
      }
    };

    const toggleLanguage = (langValue: string, checked: boolean) => {
      if (checked) {
        if (!selectedLanguages.value.includes(langValue)) {
          selectedLanguages.value.push(langValue);
        }
      } else {
        selectedLanguages.value = selectedLanguages.value.filter(l => l !== langValue);
      }
    };

    const openTestDialog = async () => {
      try {
        loadingBar.start();
        try { await soundStore.fetchAll(1, 10); } catch {}
        try { await aiAgentStore.fetchAllUnsecured?.(1, 10); } catch {}
        try { await radioStore.fetchAll(1, 100); } catch {}
      } finally {
        loadingBar.finish();
      }
      testDraftResult.value = '';
      testPromptResult.value = '';
      testPromptFixed.value = '';
      testPromptReasoning.value = '';
      showTestDialog.value = true;
    };

    const runPromptTest = async () => {
      try {
        testLoading.value = true;
        testDraftResult.value = '';
        testPromptResult.value = '';
        testPromptFixed.value = '';
        testPromptReasoning.value = '';

        // 1) Execute draft first (if a draft is selected and content available)
        let executedDraft: string | null = null;
        try {
          const draftId = selectedDraftId.value;
          const allDrafts = (draftStore.getEntries || []) as any[];
          const selectedDraft = allDrafts.find((d: any) => d.id === draftId);
          const draftContent = selectedDraft?.content || null;
          if (draftContent) {
            const draftPayload = {
              languageCode: localFormData.languageCode,
              songId: testSongId.value,
              agentId: testAgentId.value,
              stationId: testStationId.value,
              code: draftContent
            };
            const draftResp = await apiClient.post('/drafts/test', draftPayload, { responseType: 'text' });
            executedDraft = typeof draftResp.data === 'string' ? draftResp.data : String(draftResp.data ?? '');
            testDraftResult.value = executedDraft;
          }
        } catch (e) {
          // Surface draft errors but continue to prompt test with null draft
          const data = (e as any)?.response?.data;
          const msg = typeof data === 'string' ? data : (data?.message || getErrorMessage(e));
          message.warning(`Draft test failed: ${msg}`, { duration: 5000 });
        }

        // 2) Execute prompt using executed draft and chosen llmType
        const promptPayload: any = {
          prompt: localFormData.prompt,
          draft: executedDraft,
          llmType: testLlmType.value || null
        };
        const promptResp = await apiClient.post('/prompts/test', promptPayload, { responseType: 'text' as any });
        const raw = typeof promptResp.data === 'string' ? promptResp.data : String(promptResp.data ?? '');
        testPromptResult.value = raw;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            testPromptFixed.value = String(parsed.result ?? '');
            testPromptReasoning.value = parsed.reasoning ? String(parsed.reasoning) : '';
          } else {
            testPromptFixed.value = raw;
            testPromptReasoning.value = '';
          }
        } catch {
          // Not JSON; fall back to raw
          testPromptFixed.value = raw;
          testPromptReasoning.value = '';
        }
      } catch (error: any) {
        const data = error?.response?.data;
        const opts = { duration: 0, closable: true } as const;
        if (typeof data === 'string') {
          message.error(data, opts);
        } else if (data) {
          message.error(JSON.stringify(data), opts);
        } else {
          message.error(getErrorMessage(error), opts);
        }
      } finally {
        testLoading.value = false;
      }
    };

    onMounted(async () => {
      try {
        loadingBar.start();
        try { await (referencesStore as any).fetchLanguages?.(); } catch {}
        try { await draftStore.fetchAll(1, 100); } catch {}
        const id = route.params.id as string;
        if (id) {
          await store.fetch(id);
          const data = { ...store.getCurrent } as BroadcastPrompt;
          Object.assign(localFormData, data);
          selectedDraftId.value = (data as any).draftId || null;
        }
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        const data = error?.response?.data;
        if (data?.message) {
          message.error(String(data.message));
        } else {
          message.error(getErrorMessage(error));
        }
        if (route.params.id) {
          router.push('/outline/prompts');
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
      } catch (error: any) {
        const data = error?.response?.data;
        if (data?.message) {
          message.error(String(data.message));
        } else {
          message.error(getErrorMessage(error));
        }
        aclData.value = [];
      } finally {
        aclLoading.value = false;
      }
    };

    watch(activeTab, (newTab) => {
      if (newTab === 'acl') {
        fetchAclData();
      }
    });

    watch(showReasoning, (value) => {
      localStorage.setItem(STORAGE_KEY_SHOW_REASONING, String(value));
    });

    return {
      localFormData,
      formTitle,
      handleSave,
      goBack,
      activeTab,
      editorExtensions,
      langOptions: (referencesStore as any).languageOptions,
      promptTypeOptions: (referencesStore as any).promptTypeOptions,
      selectedDraftId,
      draftOptions,
      aclData,
      aclLoading,
      showReplicateDialog,
      selectedLanguages,
      handleReplicateClick,
      handleReplicate,
      toggleLanguage,
      showTestDialog,
      testSongId,
      testAgentId,
      testStationId,
      testLlmType,
      testDraftResult,
      testPromptResult,
      testLoading,
      songOptions,
      agentOptions,
      stationOptions,
      openTestDialog,
      runPromptTest,
      llmTypeOptions: (referencesStore as any).llmTypeOptions,
      themeVars,
      isWideScreen,
      testPromptFixed,
      testPromptReasoning,
      showReasoning,
      dialogBackgroundColor
    };
  }
});
</script>
