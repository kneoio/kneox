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
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties">
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
            <n-form-item label="Title">
              <n-input v-model:value="localFormData.title" style="width: 50%; max-width: 600px;" placeholder="" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Start time">
              <n-time-picker v-model:value="startTimeMs" format="HH:mm:ss" style="width: 12.5%; max-width: 150px;" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="One-time run">
              <n-checkbox v-model:checked="localFormData.oneTimeRun">Activated</n-checkbox>
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Weekdays">
              <n-checkbox-group v-model:value="selectedWeekdays" style="width: 50%; max-width: 600px;">
                <n-checkbox :value="1" label="Mon" />
                <n-checkbox :value="2" label="Tue" />
                <n-checkbox :value="3" label="Wed" />
                <n-checkbox :value="4" label="Thu" />
                <n-checkbox :value="5" label="Fri" />
                <n-checkbox :value="6" label="Sat" />
                <n-checkbox :value="7" label="Sun" />
              </n-checkbox-group>
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Prompts">
              <n-dynamic-input
                v-model:value="selectedPromptIds"
                placeholder=""
                style="width: 50%; max-width: 600px;"
              >
                <template #default="{ index }">
                  <div style="display: flex;">
                    <n-select
                      v-model:value="selectedPromptIds[index]"
                      :options="promptOptions"
                      placeholder=""
                      style="margin-right: 10px; min-width: 450px;"
                    />
                    <n-button
                      :disabled="!selectedPromptIds[index]"
                      @click="detachPrompt(index)"
                      style="margin-right: 10px;"
                    >
                      <n-icon>
                        <TagOff />
                      </n-icon>
                    </n-button>
                    <n-button
                      :disabled="!selectedPromptIds[index]"
                      @click="goToPrompt(selectedPromptIds[index])"
                    >
                      <n-icon>
                        <ChevronRight />
                      </n-icon>
                    </n-button>
                  </div>
                </template>
              </n-dynamic-input>
            </n-form-item>
          </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="acl" tab="ACL">
          <AclTable :acl-data="aclData" :loading="aclLoading" />
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue';
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
  NDynamicInput,
  NCheckbox,
  NCheckboxGroup,
  NTabs,
  NTabPane,
  NIcon,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import { ChevronRight, TagOff } from '@vicons/tabler';
import { ScriptScene, ScriptSceneSave } from '../../../types/kneoBroadcasterTypes';
import { useScriptSceneStore } from '../../../stores/kneo/scriptSceneStore';
import { useScriptStore } from '../../../stores/kneo/scriptStore';
import { usePromptStore } from '../../../stores/kneo/promptStore';
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';
import AclTable from '../../common/AclTable.vue';

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
    NDynamicInput,
    NCheckbox,
    NCheckboxGroup,
    NTabs,
    NTabPane,
    NIcon,
    ChevronRight,
    TagOff,
    AclTable
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
    const activeTab = ref('properties');
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);
    const selectedPromptIds = ref<string[]>([]);
    const selectedWeekdays = ref<number[]>([]);
    const scriptOptions = computed(() =>
      (scriptsStore.getEntries || [])
        .filter((s: any) => typeof s.id === 'string' && s.id)
        .map((s: any) => ({ label: s.name || s.id, value: s.id as string }))
    );
    const promptOptions = computed(() =>
      (promptStore.getEntries || [])
        .filter((p: any) => typeof p.id === 'string' && p.id)
        .map((p: any) => ({
          label: p.title || p.id,
          value: p.id as string
        }))
    );

    const formTitle = computed(() => (localFormData.id ? 'Edit Scene' : 'Create New Scene'));

    const localFormData = reactive<Partial<ScriptScene>>({
      id: '',
      scriptId: '',
      prompts: [],
      startTime: ''
    });

    const startTimeMs = ref<number | null>(null);

    const parseTimeToMs = (timeStr: string | undefined | null): number | null => {
      if (!timeStr) return null;
      const timeOnly = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
      const parts = timeOnly.split(':');
      const hh = Number(parts[0] || 0);
      const mm = Number(parts[1] || 0);
      const ss = Number(parts[2] || 0);
      const d = new Date(1970, 0, 1, hh, mm, ss);
      const ms = d.getTime();
      return Number.isNaN(ms) ? null : ms;
    };

    const formatTimeFromMs = (ms: number): string => {
      const d = new Date(ms);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
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
          const w = (data as any).weekdays || [];
          selectedWeekdays.value = Array.isArray(w) ? (w.filter((n: any) => Number.isInteger(n)) as number[]) : [];
        }
      }
    };

    const fetchAclData = async () => {
      const id = route.params.id as string;
      if (!id || id === 'new') {
        aclData.value = [];
        return;
      }
      try {
        aclLoading.value = true;
        const response = await (store as any).fetchAccessList?.(id);
        aclData.value = response?.accessList || [];
      } catch (error: any) {
        message.error(getErrorMessage(error));
        aclData.value = [];
      } finally {
        aclLoading.value = false;
      }
    };

    const handleSave = async () => {
      try {
        loadingBar.start();
        const saveData: ScriptSceneSave = {
          title: localFormData.title as any,
          prompts: selectedPromptIds.value,
          startTime: startTimeMs.value != null ? formatTimeFromMs(startTimeMs.value) : undefined,
          oneTimeRun: localFormData.oneTimeRun as any,
          weekdays: selectedWeekdays.value,
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
        await router.push({ name: 'Scripts' });
      } catch (error: any) {
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const goToPrompt = (promptId: string) => {
      if (promptId) router.push({ name: 'PromptForm', params: { id: promptId } });
    };

    const detachPrompt = (index: number) => {
      selectedPromptIds.value[index] = '';
    };

    const goBack = () => {
      router.push({ name: 'Scripts' });
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

    watch(activeTab, (val) => {
      if (val === 'acl') fetchAclData();
    });

    return {
      localFormData,
      formTitle,
      handleSave,
      goBack,
      selectedScriptId,
      startTimeMs,
      selectedPromptIds,
      selectedWeekdays,
      promptOptions,
      scriptOptions,
      goToPrompt,
      detachPrompt,
      activeTab,
      aclData,
      aclLoading
    };
  }
});
</script>
