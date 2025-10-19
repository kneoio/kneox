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
                    :options="referencesStore.labelOptions"
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
          <n-form label-placement="left" label-width="150px">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item>
                  <n-dynamic-input
                    v-model:value="sceneItems"
                    :on-create="createSceneItem"
                    :item-style="{ alignItems: 'flex-start', marginBottom: '16px' }"
                    style="width: 820px;"
                  >
                    <template #default="{ value }">
                      <n-grid cols="24" x-gap="12" y-gap="8" style="width: 100%;">
                        <n-gi :span="24">
                          <n-form-item label="Type" style="margin-bottom: 8px;">
                            <n-input v-model:value="value.type" placeholder="Type" style="width: 25%; max-width: 300px;" />
                          </n-form-item>
                        </n-gi>
                        <n-gi :span="24">
                          <n-form-item label="Start time" style="margin-bottom: 8px;">
                            <n-date-picker
                              v-model:value="value.startTime"
                              type="datetime"
                              placeholder="Start time"
                              style="width: 25%; max-width: 300px;"
                            />
                          </n-form-item>
                        </n-gi>
                        <n-gi :span="24">
                          <n-form-item label="Prompt">
                            <CodeMirror
                              :model-value="value.prompt"
                              @update:model-value="(val) => (value.prompt = typeof val === 'string' ? val : (((val as any)?.data) ?? ''))"
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
                        </n-gi>
                      </n-grid>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
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
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NPageHeader,
  NTabs,
  NTabPane,
  NSelect,
  NDynamicInput,
  NDatePicker,
  NText,
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
    NDynamicInput,
    NDatePicker,
    NText,
    CodeMirror
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useScriptStore();
    const sceneStore = useScriptSceneStore();
    const referencesStore = useReferencesStore();
    const route = useRoute();

    const activeTab = ref("properties");
    const sceneItems = ref<Array<{ id?: string; type?: string; startTime?: number | null; prompt: string }>>([]);

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

    const createSceneItem = () => ({ type: '', startTime: null as number | null, prompt: '' });

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

    const goBack = () => {
      router.push("/outline/scripts");
    };

    onMounted(async () => {
      try {
        loadingBar.start();
        // Load label options first
        await referencesStore.fetchLabels();
        
        const id = route.params.id as string;
        if (id && id !== 'new') {
          await store.fetch(id);
          const scriptData = { ...store.getCurrent } as Script;
          Object.assign(localFormData, scriptData);
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

    const loadScenes = async () => {
      const id = route.params.id as string;
      if (!id || id === 'new') {
        sceneItems.value = [];
        return;
      }
      await sceneStore.fetchForScript(id, 1, 100);
      const entries = (sceneStore.getEntries as unknown as ScriptScene[]) || [];
      sceneItems.value = entries.map((s) => ({
        id: s.id,
        type: s.type || '',
        startTime: s.startTime ? Date.parse(s.startTime) : null,
        prompt: Array.isArray((s as any).prompts) && (s as any).prompts.length > 0
          ? (typeof (s as any).prompts[0] === 'string' ? (s as any).prompts[0] : ((s as any).prompts[0]?.prompt || ''))
          : ''
      }));
    };

    watch(activeTab, async (tab) => {
      if (tab === 'scenes') {
        try {
          loadingBar.start();
          await loadScenes();
        } catch (e: any) {
          const data = e?.response?.data;
          if (data?.message) message.error(String(data.message)); else message.error(getErrorMessage(e));
        } finally {
          loadingBar.finish();
        }
      }
    });

    return {
      localFormData,
      formTitle,
      handleSave,
      goBack,
      activeTab,
      referencesStore,
      sceneItems,
      createSceneItem,
      editorExtensions
    };
  }
});
</script>
