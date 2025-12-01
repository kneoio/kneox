<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5" v-bind="$attrs">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>
          <span>{{ localFormData.id ? 'Prompt' : 'New Prompt' }}</span>
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
                <n-form-item label="Version">
                  <n-input-number
                    v-model:value="localFormData.version"
                    :step="0.1"
                    :precision="1"
                    style="width: 15%; max-width: 180px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi v-if="!localFormData.master">
                <n-form-item label="Master prompt">
                  <n-select
                    v-model:value="selectedMasterId"
                    :options="masterPromptOptions"
                    filterable
                    style="width: 25%; max-width: 300px;"
                  />
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
        <n-button type="default" :disabled="testLoading" @click="showTestDialog = false">Close</n-button>
      </n-space>
      <n-text depth="3">Draft Result</n-text>
      <n-input type="textarea" placeholder="" :value="testDraftResult" :autosize="{ minRows: 6, maxRows: 12 }" style="width: 100%;" readonly />
      <n-text depth="3">Prompt Result</n-text>
      <n-input type="textarea" placeholder="" :value="testPromptFixed" :autosize="{ minRows: 4, maxRows: 10 }" style="width: 100%;" readonly />
      <n-space align="center" size="small">
        <n-checkbox v-model:checked="showReasoning">Show Reasoning</n-checkbox>
        <n-text depth="3" style="margin-left: 8px;">Characters:</n-text>
        <n-number-animation :from="0" :to="promptCharCount" :show-separator="true" />
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
          <div class="lang-row">
            <GreenLed
              class="lang-dot"
              :active="selectedLanguages.includes(lang.value) && (isReplicating || hasReplicateError || hasReplicateSuccess)"
              :pulse="getDotVariant(lang.value) === 'yellow'"
            />
            <n-checkbox 
              :checked="selectedLanguages.includes(lang.value)" 
              :disabled="lang.value === 'en'"
              @update:checked="(checked) => toggleLanguage(lang.value, checked)"
            >
              {{ lang.label }}
            </n-checkbox>
          </div>
        </n-gi>
      </n-grid>
    </n-space>
    <template #action>
      <n-space>
        <n-button v-if="!allDone" @click="showReplicateDialog = false">Cancel</n-button>
        <n-button v-if="!allDone" type="primary" @click="handleReplicate" :disabled="selectedLanguages.length === 0 || isReplicating">Replicate</n-button>
        <n-button v-if="allDone" type="primary" @click="showReplicateDialog = false">Close</n-button>
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
  NInputNumber,
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
  NNumberAnimation,
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
import GreenLed from '../../common/GreenLed.vue';
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
    NInputNumber,
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
    NNumberAnimation,
    CodeMirror,
    AclTable,
    GreenLed
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
    const isReplicating = ref(false);
    const hasReplicateError = ref(false);
    const hasReplicateSuccess = ref(false);
    const completedLanguages = ref<Set<string>>(new Set());
    const allDone = ref(false);
    let eventSource: EventSource | null = null;
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

    const promptCharCount = computed(() => testPromptFixed.value.length);

    const editorExtensions = computed(() => [handlebarsLanguage, EditorView.lineWrapping]);

    const formTitle = computed(() => (localFormData.id ? 'Edit Prompt' : 'Create New Prompt'));
    const selectedDraftId = ref<string | null>(null);
    const selectedMasterId = ref<string | null>(null);
    const draftOptions = computed(() => {
      const lang = String(localFormData.languageCode || '').trim().toLowerCase();
      const list = (draftStore as any).getEntries || [];
      const items = list.map((d: any) => {
        const label = d?.title || d?.name || d?.id;
        const value = d?.id;
        const entryLang = String(d?.languageCode || '').trim().toLowerCase();
        const hasSuffix = lang
          ? new RegExp(`\\(\\s*${lang}\\s*\\)$`, 'i').test(String(label))
          : false;
        const match = !!lang && (entryLang === lang || hasSuffix);
        return { label, value, match };
      });
      items.sort((a: any, b: any) => {
        if (a.match !== b.match) return a.match ? -1 : 1;
        return String(a.label).localeCompare(String(b.label));
      });
      return items.map(({ label, value, match }: any) => ({
        label,
        value,
        style: match ? { fontWeight: '600', color: '#3b82f6' } : undefined
      }));
    });

    const masterPromptOptions = computed(() =>
      (store.getEntries || [])
        .filter((p: any) => typeof p.id === 'string' && p.id)
        .filter((p: any) => p?.master === true)
        .map((p: any) => ({ label: p.title || p.id, value: p.id as string }))
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
      podcast: false,
      version: undefined as unknown as number | undefined
    });

    watch(() => localFormData.master, (isMaster) => {
      if (isMaster) {
        selectedMasterId.value = null;
      }
    });

    const handleSave = async () => {
      try {
        loadingBar.start();
        const lang = localFormData.languageCode || '';
        const suffix = localFormData.master ? '' : lang;
        const hasSuffixInTitle = suffix && (localFormData.title || '').includes(suffix);
        const titleToSave = hasSuffixInTitle || !suffix
          ? (localFormData.title || '')
          : `${(localFormData.title || '').trim()} (${suffix})`;
        const saveData: BroadcastPromptSave = {
          title: titleToSave,
          enabled: localFormData.enabled,
          prompt: localFormData.prompt,
          promptType: localFormData.promptType,
          languageCode: localFormData.languageCode,
          master: localFormData.master,
          locked: localFormData.locked,
          podcast: localFormData.podcast,
          version: localFormData.version,
        };
        (saveData as any).draftId = selectedDraftId.value || null;
        (saveData as any).masterId = localFormData.master ? null : (selectedMasterId.value || null);
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
      selectedLanguages.value = ['en'];
      hasReplicateError.value = false;
      hasReplicateSuccess.value = false;
      completedLanguages.value.clear();
      allDone.value = false;
      showReplicateDialog.value = true;
    };

    const handleReplicate = async () => {
      try {
        loadingBar.start();
        isReplicating.value = true;
        hasReplicateError.value = false;
        completedLanguages.value.clear();
        allDone.value = false;
        message.info(`Replicating prompt to ${selectedLanguages.value.length} language(s)...`);
        const payload = selectedLanguages.value.map((lang) => ({
          toTranslate: localFormData.prompt || '',
          masterId: localFormData.id,
          translationType: 'PROMPT',
          languageCode: lang,
          version: localFormData.version
        }));
        const jobId = crypto.randomUUID();
        await apiClient.post(`/prompts/translate/start?jobId=${jobId}`, payload);
        if (eventSource) {
          eventSource.close();
        }
        const apiServer = import.meta.env.VITE_API_SERVER;
        eventSource = new EventSource(`${apiServer}/prompts/translate/stream?jobId=${jobId}`, { withCredentials: true } as any);
        eventSource.addEventListener('language_done', (e: MessageEvent) => {
          const data = JSON.parse((e as any).data);
          if (data.success) {
            completedLanguages.value.add(data.language);
          }
        });
        eventSource.addEventListener('done', (e: MessageEvent) => {
          const data = JSON.parse((e as any).data);
          allDone.value = true;
          hasReplicateSuccess.value = true;
          isReplicating.value = false;
          loadingBar.finish();
          message.success(`Prompt replicated: ${data.success}/${data.total} succeeded`);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        });
        eventSource.addEventListener('error', () => {
          hasReplicateError.value = true;
          isReplicating.value = false;
          loadingBar.finish();
          message.error('Failed to replicate prompt.');
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        });
      } catch (error: any) {
        console.error('Failed to replicate prompt:', error);
        hasReplicateError.value = true;
        isReplicating.value = false;
        loadingBar.finish();
        message.error('Failed to replicate prompt.');
      }
    };

    const getDotVariant = (langValue: string): 'yellow' | 'red' | 'green' | 'gray' => {
      const isSelected = selectedLanguages.value.includes(langValue);
      if (!isSelected) return 'gray';
      if (completedLanguages.value.has(langValue)) return 'green';
      if (hasReplicateError.value) return 'red';
      if (isReplicating.value) return 'yellow';
      return 'gray';
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
      testDraftResult.value = '';
      testPromptResult.value = '';
      testPromptFixed.value = '';
      testPromptReasoning.value = '';
      showTestDialog.value = true;
      try {
        loadingBar.start();
        try { await soundStore.fetchAll(1, 10); } catch {}
        try { await aiAgentStore.fetchAllUnsecured?.(1, 10); } catch {}
        try { await radioStore.fetchAll(1, 100); } catch {}
      } finally {
        loadingBar.finish();
      }
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
          const allDrafts = (draftStore as any).getEntries || [];
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
        handleFormSaveError(error, message);
      } finally {
        testLoading.value = false;
      }
    };

    onMounted(async () => {
      try {
        loadingBar.start();
        try { await (referencesStore as any).fetchLanguages?.(); } catch {}
        try { await draftStore.fetchAll(1, 100); } catch {}
        try { await store.fetchAll(1, 100, { master: true }); } catch {}
        const id = route.params.id as string;
        if (id) {
          await store.fetch(id);
          const data = { ...store.getCurrent } as BroadcastPrompt;
          Object.assign(localFormData, data);
          selectedDraftId.value = (data as any).draftId || null;
          selectedMasterId.value = (data as any).masterId || null;
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
      selectedMasterId,
      draftOptions,
      masterPromptOptions,
      aclData,
      aclLoading,
      showReplicateDialog,
      selectedLanguages,
      handleReplicateClick,
      handleReplicate,
      isReplicating,
      hasReplicateError,
      hasReplicateSuccess,
      allDone,
      getDotVariant,
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
      promptCharCount,
      dialogBackgroundColor
    };
  }
});
</script>

<style scoped>
.lang-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.lang-dot {
  margin-left: 2px;
}
</style>
