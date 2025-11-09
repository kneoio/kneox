<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5" v-bind="$attrs">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>
          <span>{{ localFormData.id ? 'Draft' : 'New Draft' }}</span>
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
        <n-button type="primary" @click="handleSave" size="large" :disabled="localFormData.locked">Save</n-button>
        <n-button type="default" @click="openTestDialog" size="large">Test</n-button>
        <n-button type="default" @click="handleReplicateClick" size="large" :disabled="!localFormData.isMaster">Replicate</n-button>
      </n-button-group>
    </n-gi>

    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Title">
                  <n-input v-model:value="localFormData.title" style="width: 50%; max-width: 600px;"
                           placeholder=""/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Language">
                  <n-select v-model:value="localFormData.languageCode" :options="langOptions"
                            style="width: 25%; max-width: 300px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Options">
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <n-checkbox v-model:checked="localFormData.enabled">Enabled</n-checkbox>
                    <n-checkbox v-model:checked="localFormData.isMaster">Master</n-checkbox>
                    <n-checkbox v-model:checked="localFormData.locked">Locked</n-checkbox>
                  </div>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item>
                   <template #label>
                    <div>
                      Code<br>
                      <n-text depth="3" style="font-size: 12px;">Groovy</n-text>
                    </div>
                  </template>
                  <CodeMirror
                      :model-value="localFormData.content"
                      @update:model-value="(val) => (localFormData.content = typeof val === 'string' ? val : (((val as any)?.data) ?? ''))"
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
          <acl-table :acl-data="aclData" :loading="aclLoading"/>
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
    :style="{ backgroundColor: dialogBackgroundColor }"
  >
    <template #header>
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
        <span>Test Draft</span>
        <button type="button" @click="showTestDialog = false" aria-label="Close" style="background:none; border:none; font-size:18px; line-height:1; cursor:pointer;">×</button>
      </div>
    </template>
    <n-space vertical size="small">
      <n-form label-placement="left" label-width="auto">
        <n-grid :cols="1" x-gap="12" y-gap="8">
          <n-gi>
            <n-form-item label="Song">
              <n-select v-model:value="testSongId" :options="songOptions" filterable style="width: 100%; max-width: 100%;" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Agent">
              <n-select v-model:value="testAgentId" :options="agentOptions" filterable style="width: 100%; max-width: 100%;" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Station">
              <n-select v-model:value="testStationId" :options="stationOptions" filterable style="width: 100%; max-width: 100%;" />
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-form>
      <n-space>
        <n-button type="primary" :loading="testLoading" @click="runDraftTest">Run (Ctrl+Enter)</n-button>
      </n-space>
      <n-text depth="3">Result</n-text>
      <n-input type="textarea" :value="testResult" :autosize="{ minRows: 6, maxRows: 12 }" style="width: 100%;" readonly />
    </n-space>
  </n-modal>

  <n-modal v-model:show="showReplicateDialog" preset="dialog" title="Replicate Draft" :style="{ backgroundColor: dialogBackgroundColor }">
    <n-space vertical>
      <n-text>Select languages to replicate this draft:</n-text>
      <n-grid :cols="3" x-gap="12" y-gap="8">
        <n-gi v-for="lang in langOptions" :key="lang.value">
          <div class="lang-row">
            <GlowDot
              class="lang-dot"
              :variant="getDotVariant(lang.value)"
              :active="selectedLanguages.includes(lang.value) && (isReplicating || hasReplicateError || hasReplicateSuccess)"
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
        <n-button v-if="!allDone" @click="showReplicateDialog = false">Cancel (Esc)</n-button>
        <n-button v-if="!allDone" type="primary" @click="handleReplicate" :disabled="selectedLanguages.length === 0 || isReplicating">Replicate (Ctrl+Enter)</n-button>
        <n-button v-if="allDone" type="primary" @click="showReplicateDialog = false">Close</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, onUnmounted, reactive, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
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
  NModal,
  NSpace,
  NText,
  NCheckbox,
  useLoadingBar,
  useMessage,
  useThemeVars
} from 'naive-ui';
import {EditorView} from '@codemirror/view';
import {StreamLanguage} from '@codemirror/language';
import {groovy} from '@codemirror/legacy-modes/mode/groovy';
import CodeMirror from 'vue-codemirror6';
import {Draft, DraftSave} from '../../../types/kneoBroadcasterTypes';
import {useDraftStore} from '../../../stores/kneo/draftStore';
import {getErrorMessage, handleFormSaveError} from '../../../utils/errorHandling';
import {useReferencesStore} from '../../../stores/kneo/referencesStore';
import { useSoundFragmentStore } from '../../../stores/kneo/soundFragmentStore';
import { useAiAgentStore } from '../../../stores/kneo/aiAgentStore';
import { useRadioStationStore } from '../../../stores/kneo/radioStationStore';
import apiClient from '../../../api/apiClient';
import AclTable from '../../common/AclTable.vue';
import GlowDot from '../../common/GlowDot.vue';
import { useDialogBackground } from '../../../composables/useDialogBackground';

export default defineComponent({
  name: 'DraftForm',
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
    NModal,
    NSpace,
    NText,
    NCheckbox,
    CodeMirror,
    AclTable,
    GlowDot
  },
  setup() {
    const loadingBar = useLoadingBar();
    const themeVars = useThemeVars();
    const message = useMessage();    
    const router = useRouter();
    const store = useDraftStore();
    const referencesStore = useReferencesStore();
    const soundStore = useSoundFragmentStore();
    const aiAgentStore = useAiAgentStore();
    const radioStore = useRadioStationStore();
    const route = useRoute();
    const activeTab = ref('properties');
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);
    const editorExtensions = computed(() => [StreamLanguage.define(groovy), EditorView.lineWrapping]);
    const formTitle = computed(() => (localFormData.id ? 'Edit Draft' : 'Create New Draft'));
    const localFormData = reactive<Draft>({
      id: '',
      author: '',
      regDate: '',
      lastModifier: '',
      lastModifiedDate: '',
      title: '',
      content: '',
      languageCode: '',
      archived: 0,
      enabled: false,
      isMaster: false,
      locked: false
    });

    const showTestDialog = ref(false);
    const testSongId = ref<string | null>(null);
    const testAgentId = ref<string | null>(null);
    const testStationId = ref<string | null>(null);
    const testResult = ref('');
    const testLoading = ref(false);

    const showReplicateDialog = ref(false);
    const selectedLanguages = ref<string[]>([]);
    const isReplicating = ref(false);
    const hasReplicateError = ref(false);
    const hasReplicateSuccess = ref(false);
    const completedLanguages = ref<Set<string>>(new Set());
    const allDone = ref(false);
    let eventSource: EventSource | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        if (showTestDialog.value) {
          runDraftTest();
        } else if (showReplicateDialog.value && selectedLanguages.value.length > 0) {
          handleReplicate();
        }
      }
    };

    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });

    const promptTypeOptions = (referencesStore as any).promptTypeOptions;
    const songOptions = computed(() => {
      const list = (soundStore as any).getEntries || [];
      return list.map((s: any) => ({ label: s.title || s.id, value: s.id }));
    });
    const agentOptions = computed(() => {
      const list = (aiAgentStore as any).getEntries || [];
      return list.map((a: any) => ({ label: a.name || a.id, value: a.id }));
    });
    const stationOptions = computed(() => {
      const list = (radioStore as any).getEntries || [];
      return list.map((st: any) => ({ label: st.localizedName?.en || st.name || st.slugName || st.id, value: st.id }));
    });

    const openTestDialog = async () => {
      try {
        loadingBar.start();
        try { await soundStore.fetchAll(1, 100); } catch {}
        try { await aiAgentStore.fetchAllUnsecured?.(1, 100); } catch {}
        try { await radioStore.fetchAll(1, 100); } catch {}
      } finally {
        loadingBar.finish();
      }
      testResult.value = '';
      showTestDialog.value = true;
    };

    const runDraftTest = async () => {
      try {
        testLoading.value = true;
        const payload = {
          languageCode: localFormData.languageCode,
          songId: testSongId.value,
          agentId: testAgentId.value,
          stationId: testStationId.value,
          code: localFormData.content
        };
        const response = await apiClient.post('/drafts/test', payload, { responseType: 'text' });
        testResult.value = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      } catch (error: any) {
        const data = error?.response?.data;
        const opts = { duration: 0, closable: true } as const;
        if (data?.error) {
          message.error(String(data.error), opts);
        } else if (data?.message) {
          message.error(String(data.message), opts);
        } else if (data) {
          message.error(typeof data === 'string' ? data : JSON.stringify(data), opts);
        } else {
          message.error(getErrorMessage(error), opts);
        }
      } finally {
        testLoading.value = false;
      }
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
        message.info(`Replicating draft to ${selectedLanguages.value.length} language(s)...`);
        const payload = selectedLanguages.value.map((lang) => ({
          toTranslate: localFormData.content || '',
          masterId: localFormData.id,
          translationType: 'CODE',
          languageCode: lang
        }));
        const jobId = crypto.randomUUID();
        await apiClient.post(`/drafts/translate/start?jobId=${jobId}`, payload);
        if (eventSource) {
          eventSource.close();
        }
        const apiServer = import.meta.env.VITE_API_SERVER;
        eventSource = new EventSource(`${apiServer}/drafts/translate/stream?jobId=${jobId}`, { withCredentials: true });
        eventSource.addEventListener('language_done', (e: MessageEvent) => {
          const data = JSON.parse(e.data);
          if (data.success) {
            completedLanguages.value.add(data.language);
          }
        });
        eventSource.addEventListener('done', (e: MessageEvent) => {
          const data = JSON.parse(e.data);
          allDone.value = true;
          hasReplicateSuccess.value = true;
          isReplicating.value = false;
          loadingBar.finish();
          message.success(`Draft replicated: ${data.success}/${data.total} succeeded`);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        });
        eventSource.addEventListener('error', () => {
          hasReplicateError.value = true;
          isReplicating.value = false;
          loadingBar.finish();
          message.error('Failed to replicate draft.');
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        });
      } catch (error: any) {
        console.error('Failed to replicate draft:', error);
        hasReplicateError.value = true;
        isReplicating.value = false;
        loadingBar.finish();
        message.error('Failed to replicate draft.');
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

    const getDotVariant = (langValue: string): 'yellow' | 'red' | 'green' | 'gray' => {
      const isSelected = selectedLanguages.value.includes(langValue);
      if (!isSelected) return 'gray';
      if (completedLanguages.value.has(langValue)) return 'green';
      if (hasReplicateError.value) return 'red';
      if (isReplicating.value) return 'yellow';
      return 'gray';
    };

    const handleSave = async () => {
      try {
        loadingBar.start();
        const lang = localFormData.languageCode;
        const hasLangInTitle = lang && (localFormData.title || '').includes(lang);
        const titleToSave = hasLangInTitle || !lang
          ? (localFormData.title || '')
          : `${(localFormData.title || '').trim()} (${lang})`;
        const saveData: DraftSave = {
          title: titleToSave,
          content: localFormData.content,
          languageCode: localFormData.languageCode,
          archived: localFormData.archived,
          enabled: localFormData.enabled,
          locked: localFormData.locked,
          localizedName: {
            en: localFormData.title || 'Default Title'
          }
        };
        (saveData as any).master = localFormData.isMaster;
        const id = localFormData.id ? localFormData.id : null;
        await store.save(saveData, id);
        message.success('Draft saved successfully');
        await router.push('/outline/drafts');
      } catch (error: any) {
        console.error('Failed to save Draft:', error);
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const goBack = () => {
      router.push('/outline/drafts');
    };

    onMounted(async () => {
      try {
        loadingBar.start();
        try {
          await (referencesStore as any).fetchLanguages?.();
        } catch {
        }
        const id = route.params.id as string;
        if (id) {
          await store.fetch(id);
          const data = {...store.getCurrent} as Draft;
          Object.assign(localFormData, data);
          if ((data as any).master !== undefined) {
            localFormData.isMaster = Boolean((data as any).master);
          }
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
          router.push('/outline/drafts');
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

    const { dialogBackgroundColor } = useDialogBackground();

    return {
      localFormData,
      formTitle,
      handleSave,
      openTestDialog,
      showTestDialog,
      testSongId,
      testAgentId,
      testStationId,
      testResult,
      testLoading,
      promptTypeOptions,
      songOptions,
      agentOptions,
      stationOptions,
      runDraftTest,
      showReplicateDialog,
      selectedLanguages,
      handleReplicateClick,
      handleReplicate,
      toggleLanguage,
      goBack,
      activeTab,
      editorExtensions,
      langOptions: (referencesStore as any).languageOptions,
      aclData,
      aclLoading,
      themeVars,
      isReplicating,
      hasReplicateError,
      hasReplicateSuccess,
      getDotVariant,
      dialogBackgroundColor,
      allDone
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
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 2px;
  background-color: currentColor;
  opacity: 0.6;
}
.lang-label {
  display: inline-grid;
  grid-template-columns: 1fr 10px;
  align-items: center;
  width: 160px;
  column-gap: 8px;
}
.lang-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.glow-yellow {
  color: #f59e0b !important;
  box-shadow: 0 0 8px 2px currentColor, 0 0 14px 6px currentColor;
}
.glow-red {
  color: #ef4444 !important;
  box-shadow: 0 0 8px 2px currentColor, 0 0 14px 6px currentColor;
}
.glow-green {
  color: #10b981 !important;
  box-shadow: 0 0 8px 2px currentColor, 0 0 14px 6px currentColor;
}
</style>
