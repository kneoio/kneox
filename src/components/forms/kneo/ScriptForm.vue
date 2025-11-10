<template>
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
        <span>Dry run</span>
        <button type="button" @click="showDryRunDialog = false" aria-label="Close" style="background:none; border:none; font-size:18px; line-height:1; cursor:pointer;">×</button>
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
          <n-gi>
            <n-form-item label="DJ">
              <n-select v-model:value="dryRunDjId" :options="agentOptions" filterable style="width: 50%; max-width: 600px;" />
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-form>
      <n-text depth="3">Scenes</n-text>
      <div style="display:flex; flex-direction:column; gap:8px; width: 100%;">
        <div v-for="sc in sceneStore.getEntries" :key="sceneRowKey(sc)" style="display:flex; align-items:center; gap:8px;">
          <GlowDot variant="gray" :active="true" />
          <span>{{ sc.type }} — {{ sc.startTime }} (prompts: {{ Array.isArray(sc.prompts) ? sc.prompts.length : 0 }})</span>
        </div>
      </div>
    </n-space>
    <template #action>
      <n-space>
        <n-button @click="showDryRunDialog = false">Cancel</n-button>
        <n-button type="primary" @click="runDryRun" :disabled="!dryRunStationId || !dryRunDjId">Run</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
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
import { useAiAgentStore } from '../../../stores/kneo/aiAgentStore';
import { useRadioStationStore } from '../../../stores/kneo/radioStationStore';
import { useDialogBackground } from '../../../composables/useDialogBackground';

export default defineComponent({
  name: "ScriptForm",
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
    CodeMirror,
    AclTable,
    NModal,
    NSpace,
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
    const aiAgentStore = useAiAgentStore();
    const radioStore = useRadioStationStore();
    const scenesLoading = ref(false);
    const scriptLabelOptions = ref<Array<{ label: string; value: string; color?: string; fontColor?: string }>>([]);
    const route = useRoute();

    const activeTab = ref("properties");
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);
    const showDryRunDialog = ref(false);
    const dryRunStationId = ref<string | null>(null);
    const dryRunDjId = ref<string | null>(null);

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
      labels: []
    });

    const sceneRowKey = (row: any) => row.id || `${row.type || 'scene'}-${row.startTime || ''}`;
    const sceneColumns = computed(() => [
      { title: 'Type', key: 'type', width: 140 },
      { title: 'Start', key: 'startTime', width: 140 },
      { title: 'Prompts', key: 'prompts', render: (r: any) => Array.isArray(r.prompts) ? r.prompts.length : 0 }
    ]);

    const agentOptions = computed(() => {
      const list = (aiAgentStore as any).getEntries || [];
      return list.map((a: any) => ({ label: a.name || a.id, value: a.id }));
    });
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
          labels: localFormData.labels || []
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
      try {
        loadingBar.start();
        try { await aiAgentStore.fetchAllUnsecured?.(1, 100); } catch {}
        try { await radioStore.fetchAll(1, 100); } catch {}
        if (localFormData.id && (!sceneStore.getEntries || sceneStore.getEntries.length === 0)) {
          await fetchScenes();
        }
      } finally {
        loadingBar.finish();
      }
      showDryRunDialog.value = true;
    };

    const runDryRun = async () => {
      // Placeholder: execute dry run when API is defined
      showDryRunDialog.value = false;
    };

    const goBack = () => {
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

    return {
      localFormData,
      formTitle,
      handleSave,
      goBack,
      activeTab,
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
      openDryRunDialog,
      runDryRun,
      dryRunStationId,
      dryRunDjId,
      agentOptions,
      stationOptions,
      dialogBackgroundColor,
    };
  },
});
</script>
