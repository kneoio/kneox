<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.id ? 'Scene' : 'New Scene' }}</template>
      </n-page-header>
    </n-gi>

    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
      </n-button-group>
    </n-gi>

    <n-gi span="6">
      <n-form label-placement="left" label-width="auto">
        <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
          <n-gi>
            <n-form-item label="Script">
              <n-select
                v-model:value="selectedScriptId"
                :options="scriptOptions"
                style="width: 25%; max-width: 300px;"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Type">
              <n-input v-model:value="localFormData.type" style="width: 25%; max-width: 300px;" placeholder="" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Start time">
              <n-time-picker v-model:value="startTimeMs" format="HH:mm:ss" style="width: 25%; max-width: 300px;" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Prompts">
              <n-transfer
                v-model:value="selectedPromptIds"
                :options="promptOptions"
                style="width: 50%; max-width: 600px;"
              />
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-form>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NButton,
  NButtonGroup,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NSelect,
  NPageHeader,
  NTimePicker,
  NTransfer,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import { ScriptScene, ScriptSceneSave } from '../../../types/kneoBroadcasterTypes';
import { useScriptSceneStore } from '../../../stores/kneo/scriptSceneStore';
import { useScriptStore } from '../../../stores/kneo/scriptStore';
import { usePromptStore } from '../../../stores/kneo/promptStore';
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';

export default defineComponent({
  name: 'SceneForm',
  components: {
    NPageHeader,
    NButtonGroup,
    NForm,
    NFormItem,
    NInput,
    NSelect,
    NButton,
    NGrid,
    NGi,
    NTimePicker,
    NTransfer
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const route = useRoute();
    const store = useScriptSceneStore();
    const scriptsStore = useScriptStore();
    const promptStore = usePromptStore();
    const selectedScriptId = ref<string | null>(null);
    const selectedPromptIds = ref<string[]>([]);
    const scriptOptions = computed(() =>
      (scriptsStore.getEntries || [])
        .filter((s: any) => typeof s.id === 'string' && s.id)
        .map((s: any) => ({ label: s.name || s.id, value: s.id as string }))
    );
    const promptOptions = computed(() =>
      (promptStore.getEntries || [])
        .filter((p: any) => typeof p.id === 'string' && p.id)
        .map((p: any) => ({
          label: `${p.languageCode || ''} ${p.promptType || ''}`.trim() || p.id,
          value: p.id as string
        }))
    );

    const formTitle = computed(() => (localFormData.id ? 'Edit Scene' : 'Create New Scene'));

    const localFormData = reactive<Partial<ScriptScene>>({
      id: '',
      scriptId: '',
      type: '',
      prompts: [],
      startTime: ''
    });

    const startTimeMs = ref<number | null>(null);

    const parseTimeToMs = (timeStr: string | undefined | null): number | null => {
      if (!timeStr) return null;
      // Accept 'HH:mm' or 'HH:mm:ss' or ISO; default to time-part
      const iso = timeStr.includes('T') ? timeStr : `1970-01-01T${timeStr.length === 5 ? timeStr + ':00' : timeStr}Z`;
      const ms = Date.parse(iso);
      return Number.isNaN(ms) ? null : ms;
    };

    const formatTimeFromMs = (ms: number): string => {
      const d = new Date(ms);
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      const ss = String(d.getUTCSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    };

    const load = async () => {
      const id = route.params.id as string;
      const qsScript = (route.query.scriptId as string) || null;
      if (qsScript) selectedScriptId.value = qsScript;
      await scriptsStore.fetchAll(1, 100);
      if (id && id !== 'new') {
        await store.fetch(id);
        const data = (store as any).apiFormResponse?.docData as ScriptScene;
        if (data) {
          Object.assign(localFormData, data);
          selectedScriptId.value = data.scriptId || selectedScriptId.value;
          startTimeMs.value = parseTimeToMs(data.startTime);
          const arr = (data as any).prompts || [];
          selectedPromptIds.value = Array.isArray(arr)
            ? (arr.filter((v: any) => typeof v === 'string' && v) as string[])
            : [];
        }
      }
    };

    const handleSave = async () => {
      try {
        loadingBar.start();
        const saveData: ScriptSceneSave = {
          type: localFormData.type || '',
          prompts: selectedPromptIds.value,
          startTime: startTimeMs.value != null ? formatTimeFromMs(startTimeMs.value) : undefined,
        };
        const id = route.params.id as string;
        if (!id || id === 'new') {
          if (!selectedScriptId.value) {
            message.error('Script is required');
            loadingBar.error();
            return;
          }
          await store.upsertForScript(selectedScriptId.value, saveData);
        } else {
          await store.upsert(id, saveData);
        }
        message.success('Scene saved successfully');
        await router.push('/outline/scenes');
      } catch (error: any) {
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const goBack = () => {
      router.push('/outline/scenes');
    };

    onMounted(async () => {
      try {
        loadingBar.start();
        await promptStore.fetchAll(1, 100);
        await load();
      } catch (e) {
        message.error(getErrorMessage(e));
      } finally {
        loadingBar.finish();
      }
    });

    return {
      localFormData,
      formTitle,
      handleSave,
      goBack,
      selectedScriptId,
      startTimeMs,
      selectedPromptIds,
      promptOptions,
      scriptOptions,
    };
  }
});
</script>
