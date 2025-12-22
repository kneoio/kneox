<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header subtitle="Stream" @back="goBack">
        <template #title>
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <span style="cursor: pointer;" @click="copyStreamHeaderTitleToClipboard">{{ localFormData.country || localFormData.slugName }}</span>
          </span>
          <span v-if=" localFormData.timeZone && getCurrentTimeInTimezone "
            style="margin-left: 16px; font-weight: normal; color: #666;">
            {{ getCurrentTimeInTimezone }}
          </span>
        </template>
        <template #footer>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{ store.getCurrent.lastModifiedDate }}
          <br>
          Author: {{ store.getCurrent.author }}, Last Modifier: {{ store.getCurrent.lastModifier }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button type="default" @click="handleBuildPlan" :loading="planBuildLoading" size="large">{{ planSchedule ? 'Re-build plan' : 'Build plan' }}</n-button>
        <n-button type="warning" @click="handleRunPlan" :disabled="!canRunPlan" :loading="planRunLoading" size="large">Run</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="plan" tab="Properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Source brand">
                  <n-select v-model:value="planStationId" :options="stationOptions" filterable style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="DJ">
                  <n-select v-model:value="localFormData.aiAgentId" :options="agentOptions"
                    :disabled="aiOverrideEnabled"
                    style="width: 50%; max-width: 600px;" />
                  <n-text v-if="aiOverrideEnabled" depth="3" style="font-size: 12px; margin-top: 4px; display: block;">
                    ⚠️ AI agent values are overridden
                  </n-text>
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="Script">
                  <n-select v-model:value="localFormData.scriptId" :options="scriptOptions" :render-label="renderScriptLabel"
                    style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="Audience Type">
                  <n-select v-model:value="localFormData.profileId" :options="profileOptions"
                    style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>

              <n-gi v-if="selectedScript?.requiredVariables?.length">
                <n-form-item label="Variables">
                  <div style="width: 50%; max-width: 600px;">
                    <div v-for="variable in selectedScript.requiredVariables" :key="variable.name" style="margin-bottom: 12px;">
                      <div style="margin-bottom: 4px; font-size: 13px;">
                        <strong>{{ formatVariableName(variable.name) }}</strong>
                        <span v-if="variable.required" style="color: #e74c3c;">*</span>
                        <span style="color: #666; font-size: 12px; margin-left: 8px;">{{ variable.description }}</span>
                      </div>
                      <n-switch v-if="variable.type === 'boolean'" v-model:value="userVariables[variable.name]" />
                      <n-input-number v-else-if="variable.type === 'number'" v-model:value="userVariables[variable.name]" style="width: 100%;" />
                      <n-input v-else v-model:value="userVariables[variable.name]" placeholder="" style="width: 100%;" />
                    </div>
                  </div>
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="Plan">
                  <n-anchor type="block" :show-background="false" :show-rail="true" style="width: 100%;">
                    <n-anchor-link>
                      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; white-space: pre-wrap;">
                        {{ planHeaderText }}
                        <div v-for="stage in planStages" :key="stage.key" style="margin-top: 10px;">
                          <div style="font-weight: 600; margin-bottom: 6px;">
                            {{ stage.title }}
                          </div>
                          <div v-for="(songLine, idx) in stage.songs" :key="idx" style="white-space: pre-wrap;">
                            {{ songLine }}
                          </div>
                        </div>
                      </div>
                    </n-anchor-link>
                  </n-anchor>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="properties" tab="Parameters">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Localized Names">
                  <n-dynamic-input v-model:value="localizedNameArray" :on-create="createLocalizedName"
                    style="width: 50%; max-width: 600px;">
                    <template #default="{ value }">
                      <n-space align="center" style="width: 100%;">
                        <n-select v-model:value="value.language" :options="languageOptions"
                          style="width: 120px;" />
                        <n-input v-model:value="value.name" style="flex: 1;" placeholder="" />
                      </n-space>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Bit Rate">
                  <n-slider v-model:value="localFormData.bitRate" 
                    :marks="{ 128000: '128 kbps', 192000: '192 kbps', 256000: '256 kbps', 320000: '320 kbps' }"
                    :min="128000" :max="320000" :step="64000"
                    style="width: 50%; max-width: 400px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="HLS URL">
                  <n-text style="width: 50%; max-width: 600px; font-family: monospace; cursor: pointer; color: #1890ff;"
                    @click="openUrl( localFormData.hlsUrl )">
                    {{ localFormData.hlsUrl }}
                  </n-text>
                  <n-button type="primary" text @click="copyToClipboard( localFormData.hlsUrl )"
                    style="margin-left: 8px;">
                    <template #icon>
                      <n-icon>
                        <Copy />
                      </n-icon>
                    </template>
                  </n-button>
                </n-form-item>
              </n-gi>
              
              <n-gi>
                <n-form-item label="MP3 URL">
                  <n-text style="width: 50%; max-width: 600px; font-family: monospace; cursor: pointer; color: #1890ff;"
                    @click="openUrl( localFormData.mp3Url )">
                    {{ localFormData.mp3Url }}
                  </n-text>
                  <n-button type="primary" text @click="copyToClipboard( localFormData.mp3Url || '' )"
                    style="margin-left: 8px;">
                    <template #icon>
                      <n-icon>
                        <Copy />
                      </n-icon>
                    </template>
                  </n-button>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Mixpla URL">
                  <n-text style="width: 50%; max-width: 600px; font-family: monospace; cursor: pointer; color: #1890ff;"
                    @click="openUrl( localFormData.mixplaUrl )">
                    {{ localFormData.mixplaUrl }}
                  </n-text>
                  <n-button type="primary" text @click="copyToClipboard( localFormData.mixplaUrl || '' )"
                    style="margin-left: 8px;">
                    <template #icon>
                      <n-icon>
                        <Copy />
                      </n-icon>
                    </template>
                  </n-button>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="emceeing" tab="Emceeing">
          <div style="padding: 12px; width: 50%; max-width: 600px;">
            <div v-if="planSchedule">
              <div style="color: #9ca3af; font-size: 12px; margin-bottom: 12px;">
                Created: {{ fmtIsoMin(planSchedule.createdAt) }}
                <span style="margin-left: 12px;">Estimated end: {{ fmtIsoMin(planSchedule.estimatedEndTime) }}</span>
                <span style="margin-left: 12px;">Scenes: {{ planSchedule.totalScenes }}</span>
                <span style="margin-left: 12px;">Songs: {{ planSchedule.totalSongs }}</span>
              </div>

              <div v-for="scene in planSchedule.scenes" :key="scene.sceneId"
                style="border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; padding: 12px; margin-bottom: 12px; background: rgba(255, 255, 255, 0.04);">
                <div style="display: flex; justify-content: space-between; gap: 12px; align-items: baseline;">
                  <div style="font-weight: 600; color: #e5e7eb;">
                    {{ scene.sceneTitle }}
                  </div>
                  <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color: #9ca3af; font-size: 12px;">
                    {{ fmtHm(scene.scheduledStartTime) }} - {{ fmtHm(scene.scheduledEndTime) }} ({{ fmtMin(scene.durationSeconds) }})
                  </div>
                </div>

                <div style="margin-top: 6px; color: #9ca3af; font-size: 12px;">
                  Sourcing: {{ scene.playlistRequest?.sourcing }}
                  <span style="margin-left: 12px;">Playlist: {{ scene.playlistRequest?.playlistTitle }}</span>
                  <span style="margin-left: 12px;">Artist: {{ scene.playlistRequest?.artist }}</span>
                  <span style="margin-left: 12px;">Search: {{ scene.playlistRequest?.searchTerm }}</span>
                </div>

                <div style="margin-top: 10px;">
                  <div v-for="song in scene.songs" :key="song.id"
                    style="display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
                      <div style="color: #9ca3af; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
                        {{ fmtHm(song.scheduledStartTime) }} ({{ fmtMin(song.estimatedDurationSeconds) }})
                      </div>
                      <div style="color: #e5e7eb; font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ song.title }}
                      </div>
                      <div style="color: #9ca3af; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ song.artist }}
                      </div>
                    </div>
                    <div style="color: #9ca3af; font-size: 12px; white-space: nowrap;">
                      Played: {{ song.played }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <n-text v-else depth="3">Build plan to see emceeing schedule</n-text>
          </div>
        </n-tab-pane>

        <n-tab-pane name="dashboard" tab="Dashboard">
          <StreamDashboard v-if="localFormData.slugName" :brand-name="localFormData.slugName" />
        </n-tab-pane>

        <n-tab-pane name="acl" tab="ACL">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <acl-table :acl-data="aclData" :loading="aclLoading" />
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>

      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {computed, defineComponent, h, nextTick, onMounted, onUnmounted, reactive, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {
  NAnchor,
  NAnchorLink,
  NButton,
  NButtonGroup,
  NCheckbox,
  NCheckboxGroup,
  NDynamicInput,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NIcon,
  NInput,
  NInputNumber,
  NPageHeader,
  NSelect,
  NSlider,
  NSpace,
  NSwitch,
  NTabPane,
  NTabs,
  NTag,
  NText,
  NUpload,
  UploadFileInfo,
  useLoadingBar,
  useMessage
} from "naive-ui";
import { Copy } from '@vicons/tabler';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import CodeMirror from 'vue-codemirror6';
import apiClient from '../../../api/apiClient';
import StreamDashboard from './StreamDashboard.vue';
import {
  RadioStation,
  BrandStatus,
  RadioStationSave,
  ManagedBy,
  AiAgentMode
} from "../../../types/kneoBroadcasterTypes";
import { useStreamStore } from "../../../stores/kneo/streamStore";
import { useRadioStationStore } from '../../../stores/kneo/radioStationStore';
import { useAiAgentStore } from "../../../stores/kneo/aiAgentStore";
import { useProfileStore } from "../../../stores/kneo/profileStore";
import { useScriptStore } from "../../../stores/kneo/scriptStore";
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { handleFormSaveError, getErrorMessage } from '../../../utils/errorHandling';
import AclTable from '../../common/AclTable.vue';

export default defineComponent( {
  name: "StreamForm",
  components: {
    NPageHeader,
    NButtonGroup,
    NCheckbox,
    NCheckboxGroup,
    NAnchor,
    NAnchorLink,
    NDynamicInput,
    NForm,
    NFormItem,
    NInput,
    NInputNumber,
    NButton,
    NSlider,
    NSpace,
    NText,
    NUpload,
    NTabs,
    NTabPane,
    NGrid,
    NGi,
    NSelect,
    NSwitch,
    NTag,
    NIcon,
    Copy,
    CodeMirror,
    AclTable,
    StreamDashboard,
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useStreamStore();
    const radioStore = useRadioStationStore();
    const aiAgentStore = useAiAgentStore();
    const profileStore = useProfileStore();
    const scriptStore = useScriptStore();
    const referencesStore = useReferencesStore();
    const route = useRoute();
    const skipNextRouteLoad = ref( false );
    const activeTab = ref( "plan" );
    const fileList = ref<UploadFileInfo[]>( [] );
    const lang = ref( html() );
    const profileOverrideEnabled = ref( false );
    const aiOverrideEnabled = ref( false );
    const userVariables = ref<Record<string, any>>( {} );

    const localPlanSchedule = ref<any | null>(null);
    const planSchedule = computed(() => localPlanSchedule.value || (store.getCurrent as any)?.streamSchedule || null);
    const planBuildLoading = ref(false);
    const planRunLoading = ref(false);
    const planStationId = ref<string | null>(null);
    const isInitialLoad = ref(true);

    const toBool = (v: any): boolean => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v === 1;
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        return s === '1' || s === 'true' || s === 'yes';
      }
      return false;
    };

    const editorExtensions = computed( () => [
      EditorView.lineWrapping
    ] );

    const aclData = ref( [] );
    const aclLoading = ref( false );

    const managedByOptions = [
      { value: ManagedBy.ITSELF, label: "Itself" },
      { value: ManagedBy.MIX, label: "AI DJ" }
    ];

    const stationOptions = computed(() => {
      const list = (radioStore as any).getEntries || [];
      return list.map((st: any) => ({ label: st.localizedName?.en || st.name || st.id, value: st.id }));
    });

    const localFormData = reactive<Partial<RadioStation>>( {
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      status: BrandStatus.OFF_LINE,
      slugName: "",
      localizedName: {
        en: "",
        pt: "",
        kk: ""
      },
      country: "",
      description: "",
      titleFont: "",
      color: "#FFFFFF",
      hlsUrl: "",
      iceCastUrl: "",
      mp3Url: "",
      mixplaUrl: "",
      aiAgentId: undefined,
      profileId: undefined,
      scriptId: undefined,
      timeZone: "",
      managedBy: ManagedBy.MIX,
      bitRate: 128000,
      oneTimeStreamPolicy: undefined,
      submissionPolicy: undefined,
      messagingPolicy: undefined,
      aiOverriding: { name: "", prompt: "", talkativity: 0, primaryVoice: "" },
      profileOverriding: { name: "", description: "" }
    } );

    const localizedNameArray = ref<{ language: string; name: string }[]>( [] );

    watch( localizedNameArray, ( newValue ) => {
      localFormData.localizedName = {};
      newValue.forEach( item => {
        if ( item.language && item.language.trim() !== '' ) {
          ( localFormData.localizedName ??= {} )[item.language] = item.name || "";
        }
      } );
    }, { deep: true } );

    const createLocalizedName = () => ( {
      language: "",
      name: ""
    } );

    const selectedAgent = computed( () => {
      if ( !localFormData.aiAgentId ) return null;
      return aiAgentStore.getEntries.find( a => a.id === localFormData.aiAgentId );
    } );

    watch( selectedAgent, ( newAgent ) => {
      if ( newAgent && localFormData.aiOverriding && !aiOverrideEnabled.value ) {
        localFormData.aiOverriding.name = newAgent.name || "";
        localFormData.aiOverriding.primaryVoice = newAgent.primaryVoice[0]?.id || "";
      }
    } );

    const selectedProfile = computed( () => {
      if ( !localFormData.profileId ) return null;
      return profileStore.getEntries.find( p => p.id === localFormData.profileId );
    } );

    const selectedScript = computed( () => {
      if ( !localFormData.scriptId ) return null;
      return scriptStore.getEntries.find( s => s.id === localFormData.scriptId );
    } );

    const ensureUserVariableDefaults = (script: any, vars: Record<string, any>) => {
      const nextVars: Record<string, any> = { ...(vars || {}) };
      const req = script?.requiredVariables;
      if (Array.isArray(req)) {
        req.forEach((v: any) => {
          if (nextVars[v.name] !== undefined) return;
          if (v.type === 'boolean') nextVars[v.name] = false;
          else if (v.type === 'number') nextVars[v.name] = 0;
          else nextVars[v.name] = '';
        });
      }
      return nextVars;
    };

    const hydrateUserVariablesFromDoc = (doc: any) => {
      const docUserVariables = doc?.userVariables;
      let scriptUserVariables: any = undefined;
      let scriptId: any = undefined;

      if (doc?.scripts && Array.isArray(doc.scripts) && doc.scripts.length > 0) {
        const firstScript = doc.scripts[0];
        if (typeof firstScript === 'object' && firstScript.scriptId) {
          scriptId = firstScript.scriptId;
          scriptUserVariables = firstScript.userVariables;
        } else {
          scriptId = firstScript;
        }
      }

      const mergedUserVariables: Record<string, any> = {
        ...(docUserVariables && typeof docUserVariables === 'object' ? docUserVariables : {}),
        ...(scriptUserVariables && typeof scriptUserVariables === 'object' ? scriptUserVariables : {})
      };

      if (scriptId) {
        (localFormData as any).scriptId = scriptId;
      }
      userVariables.value = ensureUserVariableDefaults(selectedScript.value, mergedUserVariables);
    };

    watch( selectedScript, ( newScript, oldScript ) => {
      if (isInitialLoad.value) return;
      userVariables.value = {};
      localPlanSchedule.value = null;
      if (newScript?.defaultProfileId) {
        localFormData.profileId = newScript.defaultProfileId;
      }
      if ( newScript?.requiredVariables ) {
        newScript.requiredVariables.forEach( v => {
          if ( v.type === 'boolean' ) userVariables.value[v.name] = false;
          else if ( v.type === 'number' ) userVariables.value[v.name] = 0;
          else userVariables.value[v.name] = '';
        } );
      }
    } );

    const formatVariableName = ( name: string ): string => {
      return name.replace( /([A-Z])/g, ' $1' ).replace( /^./, s => s.toUpperCase() ).trim();
    };

    const fmtHm = (v: any) => {
      const s = String(v);
      const m = s.match(/T(\d{2}:\d{2})/);
      return m ? m[1] : s;
    };

    const fmtIsoMin = (v: any) => {
      const s = String(v);
      return s.length >= 16 ? s.slice(0, 16) : s;
    };

    const fmtMin = (v: any) => {
      const n = Number(v);
      const m = Math.floor(n / 60);
      const ss = n % 60;
      return `${m}.${String(ss).padStart(2, '0')}`;
    };

    const planHeaderText = computed(() => {
      const p = planSchedule.value;
      if (!p) return '';
      return `Created: ${fmtHm(p.createdAt)}\nEstimated end: ${fmtHm(p.estimatedEndTime)}\nScenes: ${p.totalScenes}, Songs: ${p.totalSongs}`;
    });

    const planStages = computed(() => {
      const p = planSchedule.value;
      if (!p) return [] as any[];
      const scenes = Array.isArray(p.scenes) ? p.scenes : [];

      return scenes.map((scene: any, i: number) => {
        const title = `Stage ${i + 1}: ${scene.sceneTitle} (${fmtHm(scene.scheduledStartTime)} - ${fmtHm(scene.scheduledEndTime)}) - Sourcing: ${scene.playlistRequest?.sourcing || 'N/A'}`;
        const songs = Array.isArray(scene.songs) ? scene.songs : [];
        return {
          key: `${i}-${scene.sceneTitle}`,
          title,
          songs: songs.map((song: any) => `- ${song.title} — ${song.artist} (${fmtHm(song.scheduledStartTime)}, ${fmtMin(song.estimatedDurationSeconds)})`)
        };
      });
    });

    const canBuildPlan = computed(() => {
      return !!planStationId.value && !!localFormData.scriptId;
    });

    const canRunPlan = computed(() => {
      return !!planStationId.value && !!localFormData.scriptId && !!planSchedule.value;
    });

    const validatePlanInputs = (): boolean => {
      if (!planStationId.value) {
        message.error('Source brand is required');
        return false;
      }
      if (!localFormData.scriptId) {
        message.error('Script is required');
        return false;
      }

      const vars = selectedScript.value?.requiredVariables || [];
      for (const v of vars) {
        if (!v.required) continue;
        const val = userVariables.value[v.name];
        if (v.type === 'boolean') {
          if (val !== true) {
            message.error(`${formatVariableName(v.name)} is required`);
            return false;
          }
        } else if (v.type === 'number') {
          if (val === null || val === undefined || Number.isNaN(Number(val))) {
            message.error(`${formatVariableName(v.name)} is required`);
            return false;
          }
        } else {
          if (String(val ?? '').trim() === '') {
            message.error(`${formatVariableName(v.name)} is required`);
            return false;
          }
        }
      }

      return true;
    };

    const handleBuildPlan = async () => {
      if (!validatePlanInputs()) return;
      try {
        planBuildLoading.value = true;
        const response = await apiClient.post('/streams/schedule', { baseBrandId: planStationId.value, scriptId: localFormData.scriptId });
        localPlanSchedule.value = response.data.payload.docData;
      } catch (e) {
        message.error('Failed to build plan');
      } finally {
        planBuildLoading.value = false;
      }
    };

    const handleRunPlan = async () => {
      if (!validatePlanInputs()) return;
      if (!planSchedule.value) {
        message.error('Plan is required');
        return;
      }
      try {
        planRunLoading.value = true;
        const response = await apiClient.post('/streams/run', {
          baseBrandId: planStationId.value,
          scriptId: localFormData.scriptId,
          aiAgentId: localFormData.aiAgentId,
          profileId: localFormData.profileId,
          userVariables: userVariables.value,
          schedule: planSchedule.value
        });
        const returned = response.data.payload.docData;
        if (returned.streamSchedule) {
          localPlanSchedule.value = returned.streamSchedule;
        }
        store.updateCurrent(returned);

        await nextTick();

        if ( returned.id && returned.id !== route.params.id ) {
          skipNextRouteLoad.value = true;
          await router.replace( { name: 'Stream', params: { id: returned.id } } );
        } else {
          await loadFormData();
        }
      } catch (e) {
        message.error('Failed to run');
      } finally {
        planRunLoading.value = false;
      }
    };

    watch(planStationId, (newStationId, oldStationId) => {
      if (isInitialLoad.value) return;
      if (oldStationId) {
        localPlanSchedule.value = null;
      }
      if (newStationId) {
        const selectedStation = radioStore.getEntries.find(station => station.id === newStationId);
        if (selectedStation) {
          localFormData.aiAgentId = selectedStation.aiAgentId;
        }
      }
    });

    const voiceOptions = computed(() => 
      (referencesStore.voiceOptions || []).map(voice => ({
        label: voice.label,
        value: voice.value
      }))
    );

    const agentOptions = computed( () => {
      return aiAgentStore.getEntries.map( agent => ( {
        label: agent.name,
        value: agent.id
      } ) );
    } );

    const profileOptions = computed( () => {
      return profileStore.getEntries.map( profile => ( {
        label: profile.name,
        value: profile.id
      } ) );
    } );

    const scriptOptions = computed( () => {
      return scriptStore.getEntries.map( script => ( {
        label: script.name,
        value: script.id,
        accessLevel: (script as any).accessLevel
      } ) );
    } );

    const renderScriptLabel = (option: any) => {
      const isPublic = option.accessLevel === 1;
      return h('span', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        isPublic ? h(NTag, { type: 'success', size: 'small' }, { default: () => 'Public' }) : null,
        h('span', option.label)
      ]);
    };

    const clockIntervalId = ref<number | null>(null);
    const currentTime = ref(new Date());

    const startClockUpdate = () => {
      if ( !clockIntervalId.value ) {
        clockIntervalId.value = window.setInterval( () => {
          currentTime.value = new Date();
        }, 1000 );
      }
    };

    const stopClockUpdate = () => {
      if ( clockIntervalId.value ) {
        clearInterval( clockIntervalId.value );
        clockIntervalId.value = null;
      }
    };

    const getCurrentTimeInTimezone = computed( () => {
      if ( !localFormData.timeZone ) return '';
      try {
        return `Local Time: ${currentTime.value.toLocaleString( 'en-GB', {
          timeZone: localFormData.timeZone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        } )}`;
      } catch (error) {
        return 'Invalid timezone';
      }
    } );

    const copyStreamHeaderTitleToClipboard = async () => {
      const text = localFormData.country || localFormData.slugName;
      if (!text) {
        message.error('Nothing to copy');
        return;
      }
      await navigator.clipboard.writeText(text);
      message.success('Copied');
    };

    const copyToClipboard = ( text: string | undefined ) => {
      if ( !text ) {
        message.error( 'Nothing to copy' );
        return;
      }
      navigator.clipboard.writeText( text )
        .then( () => message.success( 'Copied to clipboard!' ) )
        .catch( () => message.error( 'Failed to copy' ) );
    };

    const openUrl = ( url: string | undefined ) => {
      if ( !url ) {
        message.error( 'No URL to open' );
        return;
      }
      window.open( url, '_blank' );
    };

    const handleSave = async () => {
      if (!localFormData.aiAgentId) {
        message.error('DJ (AI Agent) is required');
        return;
      }
      if (!localFormData.profileId) {
        message.error('Audience Type (Profile) is required');
        return;
      }
      try {
        loadingBar.start();
        const saveDTO: RadioStationSave = {
          localizedName: localFormData.localizedName ? JSON.parse( JSON.stringify( localFormData.localizedName ) ) : {},
          country: localFormData.country || "",
          description: localFormData.description || "",
          titleFont: localFormData.titleFont,
          color: localFormData.color || "",
          aiAgentId: localFormData.aiAgentId,
          profileId: localFormData.profileId,
          timeZone: localFormData.timeZone,
          managedBy: localFormData.managedBy,
          bitRate: localFormData.bitRate,
          nRate: localFormData.nRate,
          oneTimeStreamPolicy: localFormData.oneTimeStreamPolicy,
          submissionPolicy: localFormData.submissionPolicy,
          messagingPolicy: localFormData.messagingPolicy,
          aiOverriding: aiOverrideEnabled.value ? localFormData.aiOverriding : undefined,
          profileOverriding: profileOverrideEnabled.value ? localFormData.profileOverriding : undefined,
          scripts: localFormData.scriptId ? [{ scriptId: localFormData.scriptId, userVariables: userVariables.value }] : undefined
        };

        await store.save( saveDTO, localFormData.id as string );
        message.success( "Stream saved successfully" );

        await router.push( "/outline/streams" );
      } catch ( error ) {
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const goBack = () => {
      router.push( "/outline/streams" );
    };

    const loadFormData = async () => {
      const id = route.params.id as string;
      try {
        loadingBar.start();
        await radioStore.fetchAll( 1, 100 );
        await aiAgentStore.fetchAllUnsecured( 1, 100 );
        await profileStore.fetchAllUnsecured( 1, 100 );
        await scriptStore.fetchAllShared(1, 100, { timingMode: 'RELATIVE_TO_STREAM_START' });
        await referencesStore.fetchVoices();
        await store.fetch( id );
        await nextTick();
        const currentData = store.getCurrent;
        Object.assign(localFormData, currentData);
        if ((currentData as any).baseBrandId) {
          planStationId.value = (currentData as any).baseBrandId;
        }

        // Ensure aiAgentId and profileId are preserved from server data
        if ((currentData as any).aiAgentId) {
          localFormData.aiAgentId = (currentData as any).aiAgentId;
        }
        if ((currentData as any).profileId) {
          localFormData.profileId = (currentData as any).profileId;
        }
        (localFormData as any).managedBy = ManagedBy.MIX;

        aiOverrideEnabled.value = toBool((currentData as any).aiOverridingEnabled);
        profileOverrideEnabled.value = true;

        if (aiOverrideEnabled.value && !localFormData.aiOverriding) {
          (localFormData as any).aiOverriding = { name: '', prompt: '', talkativity: 0, primaryVoice: '' };
        }
        if (profileOverrideEnabled.value && !localFormData.profileOverriding) {
          (localFormData as any).profileOverriding = { name: '', description: '' };
        }

        const normalizeNumericFields = () => {
          const br = (localFormData as any).bitRate;
          (localFormData as any).bitRate = typeof br === 'string' ? Number(br) || 128000 : (typeof br === 'number' ? br : 128000);
          (localFormData as any).nRate = (currentData as any).popularityRate / 2;
        }
        normalizeNumericFields();

        hydrateUserVariablesFromDoc(currentData);

        if ( localFormData.localizedName ) {
          localizedNameArray.value = Object.entries( localFormData.localizedName ).map( ( [language, name] ) => ( {
            language,
            name: name as string
          } ) );
        }

        isInitialLoad.value = false;
      } catch ( error ) {
        console.error( "Failed to fetch data:", error );
        message.error( getErrorMessage(error) );
      } finally {
        loadingBar.finish();
      }
    };

    watch(() => route.params.id, async (newId, oldId) => {
      if (newId && newId !== oldId) {
        if ( skipNextRouteLoad.value ) {
          skipNextRouteLoad.value = false;
          return;
        }
        isInitialLoad.value = true;
        await loadFormData();
      }
    });

    onMounted( async () => {
      startClockUpdate();
      await loadFormData();
    } );

    onUnmounted( () => {
      stopClockUpdate();
    } );

    return {
      store,
      radioStore,
      localFormData,
      handleBuildPlan,
      handleRunPlan,
      canBuildPlan,
      canRunPlan,
      planBuildLoading,
      planRunLoading,
      planSchedule,
      planStationId,
      stationOptions,
      planHeaderText,
      planStages,
      handleSave,
      activeTab,
      fileList,
      lang,
      editorExtensions,
      localizedNameArray,
      createLocalizedName,
      countryOptions: referencesStore.countryOptions,
      languageOptions: referencesStore.languageOptions,
      bitRateOptions: referencesStore.bitRateOptions,
      agentOptions,
      profileOptions,
      scriptOptions,
      renderScriptLabel,
      selectedAgent,
      selectedProfile,
      selectedScript,
      copyToClipboard,
      copyStreamHeaderTitleToClipboard,
      openUrl,
      goBack,
      aclData,
      aclLoading,
      timezones: referencesStore.timezones,
      managedByOptions,
      referencesStore,
      getCurrentTimeInTimezone,
      startClockUpdate,
      stopClockUpdate,
      profileOverrideEnabled,
      aiOverrideEnabled,
      voiceOptions,
      userVariables,
      formatVariableName,
      fmtHm,
      fmtIsoMin,
      fmtMin
    };
  }
} );
</script>
<style scoped>
</style>
