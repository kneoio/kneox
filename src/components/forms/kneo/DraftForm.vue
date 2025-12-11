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
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" @click="openTestDialog" size="large">Test</n-button>
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
                <n-form-item label="Description">
                  <n-input
                    v-model:value="localFormData.description"
                    type="textarea"
                    :autosize="{ minRows: 3, maxRows: 6 }"
                    style="width: 50%; max-width: 600px;"
                    placeholder=""
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Language">
                  <n-select v-model:value="localFormData.languageCode" :options="langOptions"
                            style="width: 25%; max-width: 300px;"/>
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
    :close-on-esc="true"
    :style="{ width: isWideScreen ? '1000px' : '90vw', backgroundColor: dialogBackgroundColor }"
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
          <n-gi v-for="variable in extractedVariables" :key="variable.name">
            <n-form-item :label="variable.name">
              <n-input v-model:value="userVariables[variable.name]" style="width: 100%; max-width: 480px;" placeholder="" />
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-form>
      <n-space>
        <n-button type="primary" :loading="testLoading" :disabled="!canRunTest" @click="runDraftTest">Run (Ctrl+Enter)</n-button>
        <n-button type="default" :disabled="testLoading" @click="showTestDialog = false">Close</n-button>
      </n-space>
      <n-text depth="3">Result</n-text>
      <CodeMirror
        :model-value="testResult"
        basic
        :disabled="true"
        :style="{
          width: '100%',
          maxWidth: '1000px',
          height: '360px',
          border: '1px solid #d9d9d9',
          borderRadius: '3px',
          overflow: 'auto'
        }"
        :extensions="editorExtensions"
      />
    </n-space>
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
  NInputNumber,
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
    NInputNumber,
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
    AclTable
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
    const isWideScreen = ref(window.innerWidth >= 1200);
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
      description: '',
      languageCode: '',
      archived: 0,
      enabled: false,
      isMaster: false,
      locked: false,
      version: undefined as unknown as number | undefined
    });

    const showTestDialog = ref(false);
    const testSongId = ref<string | null>(null);
    const testAgentId = ref<string | null>(null);
    const testStationId = ref<string | null>(null);
    const testResult = ref('');
    const testLoading = ref(false);
    const extractedVariables = ref<Array<{name: string, description: string | null, type: string}>>([]);
    const userVariables = ref<Record<string, any>>({});
    const canRunTest = computed(() => !!(testSongId.value && testAgentId.value && testStationId.value) && !testLoading.value);


    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        if (showTestDialog.value) {
          runDraftTest();
        }
      }
    };

    const handleResize = () => {
      isWideScreen.value = window.innerWidth >= 1200;
    };

    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
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
      testResult.value = '';
      extractedVariables.value = [];
      userVariables.value = {};
      showTestDialog.value = true;
      try {
        loadingBar.start();
        try { await soundStore.fetchAll(1, 100); } catch {}
        try { await aiAgentStore.fetchAllUnsecured?.(1, 100); } catch {}
        try { await radioStore.fetchAll(1, 100); } catch {}
        
        if (localFormData.content) {
          try {
            const extractResponse = await apiClient.post('/drafts/extract-variables', { code: localFormData.content });
            extractedVariables.value = extractResponse.data || [];
            extractedVariables.value.forEach(v => {
              userVariables.value[v.name] = '';
            });
          } catch {}
        }

        const songs = (soundStore as any).getEntries || [];
        if (songs.length > 0) {
          const randomSong = songs[Math.floor(Math.random() * songs.length)];
          testSongId.value = randomSong.id;
        }

        const agents = (aiAgentStore as any).getEntries || [];
        if (agents.length > 0) {
          const randomAgent = agents[Math.floor(Math.random() * agents.length)];
          testAgentId.value = randomAgent.id;
        }

        const stations = (radioStore as any).getEntries || [];
        if (stations.length > 0) {
          const randomStation = stations[Math.floor(Math.random() * stations.length)];
          testStationId.value = randomStation.id;
        }
      } finally {
        loadingBar.finish();
      }
    };

    const runDraftTest = async () => {
      try {
        testLoading.value = true;
        const payload = {
          languageCode: localFormData.languageCode,
          songId: testSongId.value,
          agentId: testAgentId.value,
          stationId: testStationId.value,
          code: localFormData.content,
          userVariables: Object.keys(userVariables.value).length > 0 ? userVariables.value : undefined
        };
        const response = await apiClient.post('/drafts/test', payload, { responseType: 'text' });
        const raw = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        try {
          const parsed = JSON.parse(raw);
          testResult.value = JSON.stringify(parsed, null, 2);
        } catch {
          testResult.value = raw;
        }
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


    const handleSave = async () => {
      try {
        loadingBar.start();
        const saveData: DraftSave = {
          title: localFormData.title,
          description: localFormData.description,
          content: localFormData.content,
          languageCode: localFormData.languageCode,
          archived: localFormData.archived,
          enabled: localFormData.enabled,
          locked: localFormData.locked,
          version: localFormData.version,
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
      extractedVariables,
      userVariables,
      goBack,
      activeTab,
      editorExtensions,
      langOptions: (referencesStore as any).languageOptions,
      aclData,
      aclLoading,
      themeVars,
      dialogBackgroundColor,
      isWideScreen,
      canRunTest
    };
  }
});
</script>

