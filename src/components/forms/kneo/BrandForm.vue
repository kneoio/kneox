<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" :style="{ padding: isMobile ? '0' : undefined }" :class="isMobile ? '' : 'm-5'">
    <n-gi :span="isMobile ? 1 : 6">
      <n-page-header subtitle="Stream" @back="goBack" :style="{ marginLeft: isMobile ? '60px' : '0', padding: isMobile ? '8px' : undefined }">
        <template #title>
          {{ store.getCurrent.country || store.getCurrent.slugName }}
          <span v-if=" localFormData.timeZone && getCurrentTimeInTimezone "
            style="margin-left: 16px; font-weight: normal; color: #666;">
            {{ getCurrentTimeInTimezone }}
          </span>
          <span style="margin-left: 16px; display: inline-flex; align-items: center;">
            <n-rate
              v-model:value="localFormData.nRate"
              :count="5"
              allow-half
            >
              <template #character>
                <n-icon>
                  <HandRock />
                </n-icon>
              </template>
            </n-rate>
          </span>
        </template>
        <template #footer>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{ store.getCurrent.lastModifiedDate }}
          <br>
          Author: {{ store.getCurrent.author }}, Last Modifier: {{ store.getCurrent.lastModifier }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi :span="isMobile ? 1 : 6" class="mt-2">
      <n-button-group :style="{ width: isMobile ? '100%' : 'auto' }">
        <n-button type="primary" @click="handleSave" :size="isMobile ? 'medium' : 'large'" :style="{ flex: isMobile ? 1 : 'none' }">Save</n-button>
        <n-button type="default" disabled @click="handleArchive" :size="isMobile ? 'medium' : 'large'" :style="{ flex: isMobile ? 1 : 'none' }">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi :span="isMobile ? 1 : 6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Localized Names">
                  <n-dynamic-input v-model:value="localizedNameArray" :on-create="createLocalizedName"
                    :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }">
                    <template #default=" { value, index } ">
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
                <n-form-item label="Country">
                  <n-select v-model:value="localFormData.country" :options="countryOptions"
                    :style="{ width: isMobile ? '100%' : '25%', maxWidth: isMobile ? '100%' : '300px' }" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Description">
                  <n-input v-model:value="localFormData.description" type="textarea" placeholder=""
                    :autosize="{ minRows: 3, maxRows: 6 }" :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Time Zone">
                  <n-select v-model:value="localFormData.timeZone" :options="timezones"
                    :style="{ width: isMobile ? '100%' : '25%', maxWidth: isMobile ? '100%' : '300px' }" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Bit Rate">
                  <n-slider v-model:value="localFormData.bitRate" 
                    :marks="{ 128000: '128 kbps', 192000: '192 kbps', 256000: '256 kbps', 320000: '320 kbps' }"
                    :min="128000" :max="320000" :step="64000"
                    :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '400px' }" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="HLS URL">
                  <n-text :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px', fontFamily: 'monospace', cursor: 'pointer', color: '#1890ff', wordBreak: isMobile ? 'break-all' : 'normal' }"
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
                  <n-text :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px', fontFamily: 'monospace', cursor: 'pointer', color: '#1890ff', wordBreak: isMobile ? 'break-all' : 'normal' }"
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
                  <n-text :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px', fontFamily: 'monospace', cursor: 'pointer', color: '#1890ff', wordBreak: isMobile ? 'break-all' : 'normal' }"
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

        <n-tab-pane name="aiAgent" tab="DJ">
          <n-form label-placement="left" label-width="150px">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Name">
                  <n-select v-model:value="localFormData.aiAgentId" :options="agentOptions"
                    :disabled="aiOverrideEnabled"
                    :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }" />
                  <n-text v-if="aiOverrideEnabled" depth="3" style="font-size: 12px; margin-top: 4px; display: block;">
                    ⚠️ AI agent values are overridden
                  </n-text>
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="Override DJ Properties">
                  <n-checkbox v-model:checked="aiOverrideEnabled">
                    Enable
                  </n-checkbox>
                </n-form-item>
              </n-gi>

              <n-gi v-if="aiOverrideEnabled">
                <n-form-item label="Override Name">
                  <n-input v-model:value="localFormData.aiOverriding.name" 
                    placeholder=""
                    :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }" />
                </n-form-item>
              </n-gi>

              <n-gi v-if="aiOverrideEnabled">
                <n-form-item label="Additional Instructions">
                  <n-input v-model:value="localFormData.aiOverriding.prompt" 
                    type="textarea" 
                    placeholder=""
                    :autosize="{ minRows: 3, maxRows: 5 }"
                    :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }" />
                </n-form-item>
              </n-gi>

              <n-gi v-if="aiOverrideEnabled">
                <n-form-item label="Override Voice">
                  <n-select v-model:value="localFormData.aiOverriding.primaryVoice" 
                    :options="voiceOptions"
                    filterable
                    :style="{ width: isMobile ? '100%' : '30%', maxWidth: isMobile ? '100%' : '300px' }" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="script" tab="Script">
          <n-form label-placement="left" label-width="150px">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Script">
                  <n-select v-model:value="localFormData.scriptId" :options="scriptOptions" :render-label="renderScriptLabel"
                    :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }" />
                </n-form-item>
              </n-gi>
              <n-gi v-if="selectedScript">
                <n-form-item label="Description">
                  <n-anchor type="block" :show-background="false" :show-rail="true" :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }">
                    <n-anchor-link>
                      {{ selectedScript.description }}
                    </n-anchor-link>
                  </n-anchor>
                </n-form-item>
              </n-gi>
              <n-gi v-if="selectedScript?.requiredVariables?.length">
                <n-form-item label="Variables">
                  <div :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }">
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
            </n-grid>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="profile" tab="Audience">
          <n-form label-placement="left" label-width="150px">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Audience Type">
                  <n-select v-model:value="localFormData.profileId" :options="profileOptions"
                    :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }" />
                </n-form-item>
              </n-gi>
              <n-gi v-if="selectedProfile">
                <n-form-item label="Description">
                  <n-anchor type="block" :show-background="false" show-rail :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }">
                    <n-anchor-link>
                      {{ selectedProfile.description }}
                    </n-anchor-link>
                  </n-anchor>
                </n-form-item>
              </n-gi>

              <n-gi v-if="profileOverrideEnabled">
                <n-form-item label="Local Name (optional)">
                  <n-input v-model:value="localFormData.profileOverriding!.name" 
                    placeholder=""
                    :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }" />
                </n-form-item>
              </n-gi>

              <n-gi v-if="profileOverrideEnabled">
                <n-form-item label="Additional Information (optional)">
                  <n-input v-model:value="localFormData.profileOverriding!.description" 
                    type="textarea" 
                    placeholder=""
                    :autosize="{ minRows: 3, maxRows: 5 }"
                    :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="contribution" tab="Contribution">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Messaging">
                  <n-select v-model:value="localFormData.messagingPolicy" :options="referencesStore.messagingPolicyOptions"
                    :style="{ width: isMobile ? '100%' : '25%', maxWidth: isMobile ? '100%' : '300px' }" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="One-Time Stream">
                  <n-select v-model:value="localFormData.oneTimeStreamPolicy" :options="referencesStore.submissionPolicyOptions"
                    :style="{ width: isMobile ? '100%' : '25%', maxWidth: isMobile ? '100%' : '300px' }" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Song Submission">
                  <n-select v-model:value="localFormData.submissionPolicy" :options="referencesStore.submissionPolicyOptions"
                    :style="{ width: isMobile ? '100%' : '25%', maxWidth: isMobile ? '100%' : '300px' }" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="playerUi" tab="Player UI">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi v-if="stationTitlePreview">
                <n-form-item label="Preview">
                  <n-anchor type="block" :show-background="false" :show-rail="true" :style="{ width: isMobile ? '100%' : '50%', maxWidth: isMobile ? '100%' : '600px' }">
                    <n-anchor-link>
                      <div :style="{ fontFamily: localFormData.titleFont || undefined, fontSize: isMobile ? '24px' : '34px', lineHeight: 1.1 }">
                        {{ stationTitlePreview }}
                      </div>
                    </n-anchor-link>
                  </n-anchor>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Title Font">
                  <n-select v-model:value="localFormData.titleFont" :options="stationFontOptions"
                    :style="{ width: isMobile ? '100%' : '25%', maxWidth: isMobile ? '100%' : '300px' }" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Color">
                  <n-color-picker v-model:value="localFormData.color" style="width: 200px;" />
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
import { defineComponent, onMounted, onUnmounted, reactive, ref, computed, watch, nextTick, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NButton,
  NButtonGroup,
  NCard,
  NCheckbox,
  NCheckboxGroup,
  NColorPicker,
  NAnchor,
  NAnchorLink,
  NDynamicInput,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NInputNumber,
  NPageHeader,
  NRate,
  NSelect,
  NSlider,
  NSpace,
  NSwitch,
  NTabPane,
  NTabs,
  NText,
  NUpload,
  NIcon,
  NTag,
  UploadFileInfo,
  useLoadingBar,
  useMessage
} from "naive-ui";
import { Copy, HandRock } from '@vicons/tabler';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import CodeMirror from 'vue-codemirror6';
import {
  RadioStation,
  BrandStatus,
  RadioStationSave,
  ManagedBy,
  AiAgentMode
} from "../../../types/kneoBroadcasterTypes";
import { useRadioStationStore } from "../../../stores/kneo/radioStationStore";
import { useAiAgentStore } from "../../../stores/kneo/aiAgentStore";
import { useProfileStore } from "../../../stores/kneo/profileStore";
import { useScriptStore } from "../../../stores/kneo/scriptStore";
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { handleFormSaveError, getErrorMessage } from '../../../utils/errorHandling';
import AclTable from '../../common/AclTable.vue';

export default defineComponent( {
  name: "BrandForm",
  components: {
    NPageHeader,
    NButtonGroup,
    NCard,
    NCheckbox,
    NCheckboxGroup,
    NColorPicker,
    NAnchor,
    NAnchorLink,
    NDynamicInput,
    NForm,
    NFormItem,
    NInput,
    NRate,
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
    HandRock,
    CodeMirror,
    AclTable
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useRadioStationStore();
    const aiAgentStore = useAiAgentStore();
    const profileStore = useProfileStore();
    const scriptStore = useScriptStore();
    const referencesStore = useReferencesStore();
    const route = useRoute();
    const activeTab = ref( "properties" );
    const fileList = ref<UploadFileInfo[]>( [] );
    const lang = ref( html() );
    const profileOverrideEnabled = ref( false );
    const aiOverrideEnabled = ref( false );
    const userVariables = ref<Record<string, any>>( {} );
    const isMobile = ref(window.innerWidth < 768);
    

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
    const currentTime = ref( new Date() );
    const clockIntervalId = ref<number | null>( null );
    const managedByOptions = [
      { value: ManagedBy.ITSELF, label: "Itself" },
      /*{ value: ManagedBy.AI_AGENT, label: "AI Agent" },*/
      { value: ManagedBy.MIX, label: "AI DJ" }
    ];

    const stationFonts = [
      'Goldman',
      'Digital Play Italic St',
      'Airborne',
      'AncientGod',
      'Apollo',
      'Cubic',
      'DigitalPlay',
      'Drexs',
      'Elias',
      'FutureSallow',
      'Goodtime',
      'GameOfSquids',
      'Glypic',
      'Icklips',
      'Moto',
      'MontereyPopsicle',
      'PolenticalNeon',
      'Venta',
      'Conthrax',
      'Kaylon',
      'Nsecthin',
      'Yonder'
    ];

    const stationFontOptions = stationFonts.map( f => ( {
      label: f,
      value: f
    } ) );




    const targetOptions = [
      { value: "default", label: "default" }
    ];

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
      aiOverriding: { name: "", prompt: "", primaryVoice: "" },
      profileOverriding: { name: "", description: "" }
    } );

    const localizedNameArray = ref<{ language: string; name: string }[]>( [] );

    const stationTitlePreview = computed( () => {
      const ln: any = (localFormData as any).localizedName;
      if ( ln && typeof ln === 'object' ) {
        const en = ln.en;
        if ( en ) return String( en );
        for ( const v of Object.values( ln ) ) {
          if ( v ) return String( v );
        }
      }
      return '';
    } );

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

    watch( selectedScript, ( newScript ) => {
      userVariables.value = {};
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

    const startClockUpdate = () => {
      if ( !clockIntervalId.value ) {
        clockIntervalId.value = window.setInterval( () => {
          currentTime.value = new Date();
        }, 1000 ); // Update every second for real-time display
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
        message.success( "Radio Station saved successfully" );
        
        const fromStation = router.options.history.state.back?.toString().includes('/outline/station/');
        if (!fromStation) {
          await router.push( "/outline/brands" );
        }
      } catch ( error ) {
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const handleArchive = () => {
      message.info( "Archive functionality not implemented yet" );
    };

    const goBack = () => {
      router.push( "/outline/brands" );
    };

    const fetchAclData = async () => {
      const id = route.params.id as string;
      if ( !id || id === 'new' ) {
        aclData.value = [];
        return;
      }

      try {
        aclLoading.value = true;
        const response = await store.fetchAccessList( id );
        aclData.value = response.accessList || [];
      } catch ( error ) {
        console.error( 'Failed to fetch ACL data:', error );
        message.error( getErrorMessage(error) );
        aclData.value = [];
      } finally {
        aclLoading.value = false;
      }
    };

    watch( activeTab, ( newTab ) => {
      if ( newTab === 'acl' && localFormData.id ) {
        fetchAclData();
      }
    } );

    const loadFormData = async () => {
      const id = route.params.id as string;
      try {
        loadingBar.start();
        await aiAgentStore.fetchAllUnsecured( 1, 100 );
        await profileStore.fetchAllUnsecured( 1, 100 );
        await scriptStore.fetchAllShared( 1, 100 );
        await referencesStore.fetchVoices();
        await store.fetch( id );
        await nextTick();
        const currentData = store.getCurrent;
        Object.assign( localFormData, currentData );
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

        if ((currentData as any).scripts && Array.isArray((currentData as any).scripts) && (currentData as any).scripts.length > 0) {
          const firstScript = (currentData as any).scripts[0];
          if (typeof firstScript === 'object' && firstScript.scriptId) {
            (localFormData as any).scriptId = firstScript.scriptId;
            userVariables.value = firstScript.userVariables || {};
          } else {
            (localFormData as any).scriptId = firstScript;
          }
        }

        if ( localFormData.localizedName ) {
          localizedNameArray.value = Object.entries( localFormData.localizedName ).map( ( [language, name] ) => ( {
            language,
            name: name || ""
          } ) );
        }

      } catch ( error ) {
        console.error( "Failed to fetch data:", error );
        message.error( getErrorMessage(error) );
      } finally {
        loadingBar.finish();
      }
    };

    const handleResize = () => {
      isMobile.value = window.innerWidth < 768;
    };

    watch(() => route.params.id, async (newId, oldId) => {
      if (newId && newId !== oldId) {
        await loadFormData();
      }
    });

    onMounted( async () => {
      startClockUpdate();
      await loadFormData();
      window.addEventListener('resize', handleResize);
    } );

    onUnmounted( () => {
      stopClockUpdate();
      window.removeEventListener('resize', handleResize);
    } );

    return {
      store,
      localFormData,
      handleSave,
      handleArchive,
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
      openUrl,
      goBack,
      aclData,
      aclLoading,
      timezones: referencesStore.timezones,
      managedByOptions,
      stationFontOptions,
      stationTitlePreview,
      targetOptions,
      referencesStore,
      getCurrentTimeInTimezone,
      startClockUpdate,
      stopClockUpdate,
      profileOverrideEnabled,
      aiOverrideEnabled,
      voiceOptions,
      userVariables,
      formatVariableName,
      isMobile
    };
  }
} );
</script>
<style scoped>
</style>