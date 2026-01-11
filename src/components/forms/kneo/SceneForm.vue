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
            <n-form-item label="Duration (minutes)">
              <n-radio-group v-model:value="durationMinutes" name="duration-group">
                <n-radio-button :value="2">2</n-radio-button>
                <n-radio-button :value="3">3</n-radio-button>
                <n-radio-button :value="4">4</n-radio-button>
                <n-radio-button :value="5">5</n-radio-button>
                <n-radio-button :value="6">6</n-radio-button>
                <n-radio-button :value="7">7</n-radio-button>
                <n-radio-button :value="8">8</n-radio-button>
                <n-radio-button :value="10">10</n-radio-button>
                <n-radio-button :value="15">15</n-radio-button>
                <n-radio-button :value="20">20</n-radio-button>
                <n-radio-button :value="30">30</n-radio-button>
                <n-radio-button :value="45">45</n-radio-button>
                <n-radio-button :value="60">60</n-radio-button>
                <n-radio-button :value="90">90</n-radio-button>
                <n-radio-button :value="120">120</n-radio-button>
              </n-radio-group>
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Sequence Number">
              <n-radio-group v-model:value="localFormData.seqNum" name="seq-num-group">
                <n-radio-button v-for="i in 10" :key="i" :value="i">{{ i }}</n-radio-button>
              </n-radio-group>
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="One-time run">
              <n-checkbox v-model:checked="localFormData.oneTimeRun">Activated</n-checkbox>
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Talkativity">
              <n-slider v-model:value="localFormData.talkativity" :min="0" :max="1" :step="0.05" :tooltip="false"
                style="width: 50%; max-width: 600px;" />
              <span style="margin-left: 12px;">{{ localFormData.talkativity || 0 }}</span>
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
            <n-form-item label="Actions">
              <n-dynamic-input
                v-model:value="scenePrompts"
                :on-create="createScenePrompt"
                placeholder=""
                style="width: 50%; max-width: 600px;"
              >
                <template #default="{ index }">
                  <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                    <n-select
                      v-model:value="scenePrompts[index].promptId"
                      :options="promptOptions"
                      :render-label="renderPromptLabel"
                      placeholder=""
                      style="min-width: 600px;"
                    />
                  </div>
                </template>
              </n-dynamic-input>
            </n-form-item>
          </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="playlist" tab="Playlist">
          <PlaylistFields
              :model-value="localFormData.stagePlaylist as any"
              @update:model-value="(val) => Object.assign(localFormData.stagePlaylist!, val)"
              :genre-options="referencesStore.genreOptions"
              :label-options="referencesStore.labelOptions"
              :hide-static-list="true"
          />
        </n-tab-pane>
        <n-tab-pane name="acl" tab="ACL">
          <AclTable :acl-data="aclData" :loading="aclLoading" />
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue';
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
  NSlider,
  NInputNumber,
  NRadioGroup,
  NRadioButton,
  NTag,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import { ChevronRight } from '@vicons/tabler';
import { SceneTimingMode, ScriptScene, ScriptSceneSave, ScenePromptDTO } from '../../../types/kneoBroadcasterTypes';
import { useScriptSceneStore } from '../../../stores/kneo/scriptSceneStore';
import { useScriptStore } from '../../../stores/kneo/scriptStore';
import { usePromptStore } from '../../../stores/kneo/promptStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';
import AclTable from '../../common/AclTable.vue';
import PlaylistFields from '../../common/PlaylistFields.vue';

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
    NSlider,
    NIcon,
    NInputNumber,
    NRadioGroup,
    NRadioButton,
    NTag,
    ChevronRight,
    AclTable,
    PlaylistFields
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const route = useRoute();
    const store = useScriptSceneStore();
    const scriptsStore = useScriptStore();
    const promptStore = usePromptStore();
    const referencesStore = useReferencesStore();
    const selectedScriptId = ref<string | null>(null);
    const activeTab = ref('properties');
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);
    const scenePrompts = ref<ScenePromptDTO[]>([]);
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
          value: p.id as string,
          master: p.master,
          podcast: p.podcast,
          promptType: p.promptType
        }))
    );

    const renderPromptLabel = (option: any) => {
      return h('span', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        option.master ? h(NTag, { type: 'info', size: 'small' }, { default: () => 'Master' }) : null,
        option.podcast ? h(NTag, { type: 'warning', size: 'small' }, { default: () => 'Podcast' }) : null,
        option.promptType ? h(NTag, { type: 'success', size: 'small' }, { default: () => option.promptType }) : null,
        h('span', option.label)
      ]);
    };
    
    const timingModeOptions = [
      { label: 'Absolute Time', value: SceneTimingMode.RELATIVE_TO_STREAM_START },
      { label: 'Relative to Stream Start', value: SceneTimingMode.ABSOLUTE_TIME }
    ];
    
    const formTitle = computed(() => (localFormData.id ? 'Edit Scene' : 'Create New Scene'));

    const localFormData = reactive<Partial<ScriptScene>>({
      id: '',
      scriptId: '',
      prompts: [],
      startTime: '',
      talkativity: 0.5,
      timingMode: SceneTimingMode.RELATIVE_TO_STREAM_START,
      durationSeconds: 0,
      seqNum: 0,
      stagePlaylist: {
        sourcing: 'RANDOM',
        searchTerm: '',
        genres: [],
        labels: [],
        type: [],
        source: [],
        staticList: []
      }
    });

    const startTimeMs = ref<number | null>(null);
    const durationMinutes = ref<number>(0);
    
    watch(durationMinutes, (minutes) => {
      localFormData.durationSeconds = Math.round(minutes * 60);
    });
    
    watch(() => localFormData.durationSeconds, (seconds) => {
      durationMinutes.value = (seconds ?? 0) / 60;
    });

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
          scenePrompts.value = Array.isArray(arr)
            ? (arr as ScenePromptDTO[])
            : [];
          const w = (data as any).weekdays || [];
          selectedWeekdays.value = Array.isArray(w) ? (w.filter((n: any) => Number.isInteger(n)) as number[]) : [];
          localFormData.talkativity = typeof data.talkativity === 'number' ? data.talkativity : 0.5;
          const duration = typeof (data as any).durationSeconds === 'number' ? (data as any).durationSeconds : 0;
          localFormData.durationSeconds = duration;
          durationMinutes.value = duration / 60;
          localFormData.seqNum = typeof (data as any).seqNum === 'number' ? (data as any).seqNum : 0;
          
          // Initialize stagePlaylist
          if (data.stagePlaylist) {
            localFormData.stagePlaylist = {
              sourcing: data.stagePlaylist.sourcing || 'RANDOM',
              searchTerm: (data.stagePlaylist as any).searchTerm || '',
              genres: data.stagePlaylist.genres || [],
              labels: data.stagePlaylist.labels || [],
              type: (data.stagePlaylist as any).type || [],
              source: (data.stagePlaylist as any).source || [],
              staticList: (data.stagePlaylist as any).staticList || []
            };
          } else {
            localFormData.stagePlaylist = {
              sourcing: 'RANDOM',
              searchTerm: '',
              genres: [],
              labels: [],
              type: [],
              source: [],
              staticList: []
            };
          }
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
          prompts: scenePrompts.value,
          startTime: startTimeMs.value != null ? formatTimeFromMs(startTimeMs.value) : undefined,
          durationSeconds: localFormData.durationSeconds as any,
          seqNum: localFormData.seqNum as any,
          oneTimeRun: localFormData.oneTimeRun as any,
          weekdays: selectedWeekdays.value,
          talkativity: localFormData.talkativity as any,
          stagePlaylist: localFormData.stagePlaylist ? {
            sourcing: localFormData.stagePlaylist.sourcing,
            searchTerm: (localFormData.stagePlaylist as any).searchTerm,
            genres: localFormData.stagePlaylist.genres,
            labels: localFormData.stagePlaylist.labels,
            type: (localFormData.stagePlaylist as any).type,
            source: (localFormData.stagePlaylist as any).source,
            staticList: (localFormData.stagePlaylist as any).staticList
          } : undefined,
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
        const previousRoute = router.options.history.state.back;
        if (previousRoute && previousRoute.toString().includes('/outline/document-tree')) {
          await router.push('/outline/document-tree');
        } else {
          await router.push({ name: 'Scripts' });
        }
      } catch (error: any) {
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const goToPrompt = (promptId: string) => {
      if (promptId) router.push({ name: 'PromptForm', params: { id: promptId } });
    };

    const createScenePrompt = (): ScenePromptDTO => ({
      promptId: '',
      active: true,
      rank: 0,
      weight: 0.5
    });

    const goBack = () => {
      const previousRoute = router.options.history.state.back;
      if (previousRoute && previousRoute.toString().includes('/outline/document-tree')) {
        router.push('/outline/document-tree');
      } else {
        router.push({ name: 'Scripts' });
      }
    };

    onMounted(async () => {
      try {
        loadingBar.start();
        await promptStore.fetchAll(1, 100, { master: true });
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
      durationMinutes,
      scenePrompts,
      selectedWeekdays,
      promptOptions,
      scriptOptions,
      renderPromptLabel,
      goToPrompt,
      createScenePrompt,
      activeTab,
      aclData,
      aclLoading,
      referencesStore,
      timingModeOptions
    };
  }
});
</script>
