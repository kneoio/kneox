<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header subtitle="Radio Station" @back="goBack">
        <template #title>
          {{ store.getCurrent.country || store.getCurrent.slugName }}
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
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" disabled @click="handleArchive" size="large">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Localized Names">
                  <n-dynamic-input v-model:value="localizedNameArray" :on-create="createLocalizedName"
                    style="width: 50%; max-width: 600px;">
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
                    style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Description">
                  <n-input v-model:value="localFormData.description" type="textarea" placeholder=""
                    :autosize="{ minRows: 3, maxRows: 6 }" style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Color">
                  <n-color-picker v-model:value="localFormData.color" style="width: 200px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Time Zone">
                  <n-select v-model:value="localFormData.timeZone" :options="timezones"
                    style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Managed By">
                  <n-select v-model:value="localFormData.managedBy" :options="managedByOptions"
                    style="width: 25%; max-width: 300px;" />
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
                <n-form-item label="Icecast URL">
                  <n-text style="width: 50%; max-width: 600px; font-family: monospace; cursor: pointer; color: #1890ff;"
                    @click="openUrl( localFormData.iceCastUrl )">
                    {{ localFormData.iceCastUrl }}
                  </n-text>
                  <n-button type="primary" text @click="copyToClipboard( localFormData.iceCastUrl || '' )"
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

        <n-tab-pane name="aiAgent" tab="AI Agent">
          <n-form label-placement="left" label-width="150px">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Name">
                  <n-select v-model:value="localFormData.aiAgentId" :options="agentOptions"
                    :disabled="aiOverrideEnabled"
                    style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi v-if="selectedAgent">
                <n-form-item label="Preferred Language">
                  <n-input :value="selectedAgent.preferredLang"
                    style="width: 50%; max-width: 600px; cursor: not-allowed;" readonly
                    disabled />
                </n-form-item>
              </n-gi>
              <n-gi v-if="selectedAgent">
                <n-form-item label="Talkativity">
                  <n-slider :value="selectedAgent.talkativity" :min="0" :max="1" :step="0.05" :tooltip="false"
                    style="width: 50%; max-width: 600px;" disabled />
                  <span style="margin-left: 12px;">{{ selectedAgent.talkativity?.toFixed(2) || '0.00' }}</span>
                </n-form-item>
              </n-gi>
              <n-gi v-if="selectedAgent">
                <n-form-item label="Preferred Voice">
                  <n-select :value="selectedAgent.preferredVoice[0]?.name" 
                    :options="voiceOptions"
                    filterable
                    style="width: 30%; max-width: 300px;" 
                    disabled />
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="Override AI Agent">
                  <n-checkbox v-model:checked="aiOverrideEnabled">
                    Enable AI agent override
                  </n-checkbox>
                </n-form-item>
              </n-gi>

              <n-gi v-if="aiOverrideEnabled">
                <n-form-item label="Override Name">
                  <n-input v-model:value="localFormData.aiOverriding.name" 
                    placeholder=""
                    style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>

              <n-gi v-if="aiOverrideEnabled">
                <n-form-item label="Override Prompt">
                  <n-input v-model:value="localFormData.aiOverriding.prompt" 
                    type="textarea" 
                    placeholder=""
                    :autosize="{ minRows: 3, maxRows: 5 }"
                    style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>

              <n-gi v-if="aiOverrideEnabled">
                <n-form-item label="Override Talkativity">
                  <n-slider v-model:value="localFormData.aiOverriding.talkativity" :min="0" :max="1" :step="0.05" :tooltip="false"
                    style="width: 50%; max-width: 600px;" />
                  <span style="margin-left: 12px;">{{ localFormData.aiOverriding.talkativity }}</span>
                </n-form-item>
              </n-gi>

              <n-gi v-if="aiOverrideEnabled">
                <n-form-item label="Override Preferred Voice">
                  <n-select v-model:value="localFormData.aiOverriding.preferredVoice" 
                    :options="voiceOptions"
                    filterable
                    style="width: 30%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="profile" tab="Profile">
          <n-form label-placement="left" label-width="150px">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Name">
                  <n-select v-model:value="localFormData.profileId" :options="profileOptions"
                    :disabled="profileOverrideEnabled"
                    style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi v-if="selectedProfile">
                <n-form-item label="Description">
                  <n-input :value="selectedProfile.description" type="textarea" :autosize="{ minRows: 3, maxRows: 5 }"
                    style="width: 50%; max-width: 600px; cursor: not-allowed;" disabled />
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="Override Profile">
                  <n-checkbox v-model:checked="profileOverrideEnabled">
                    Enable profile override
                  </n-checkbox>
                </n-form-item>
              </n-gi>

              <n-gi v-if="profileOverrideEnabled">
                <n-form-item label="Override Name">
                  <n-input v-model:value="localFormData.profileOverriding.name" 
                    placeholder=""
                    style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>

              <n-gi v-if="profileOverrideEnabled">
                <n-form-item label="Override Description">
                  <n-input v-model:value="localFormData.profileOverriding.description" 
                    type="textarea" 
                    placeholder=""
                    :autosize="{ minRows: 3, maxRows: 5 }"
                    style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="schedule" tab="Schedule">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item>
                  <n-checkbox v-model:checked="localFormData.schedule.enabled">
                    Enable
                  </n-checkbox>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Scheduled Tasks">
                  <n-dynamic-input v-model:value="scheduleTasksArray" :on-create="createScheduleTask"
                    style="max-width: 800px;">
                    <template #default=" { value, index } ">
                      <n-card size="small" class="mb-3">
                        <template #header>
                          <n-text strong>Task {{ index + 1 }}</n-text>
                        </template>

                        <!-- Task Type and Target -->
                        <n-space vertical size="medium">
                          <n-space>
                            <n-form-item label="Type" style="margin-bottom: 0;">
                              <n-select v-model:value="value.type" :options="taskTypeOptions" style="width: 150px;" />
                            </n-form-item>
                            <n-form-item label="Target" style="margin-bottom: 0;">
                              <n-select v-model:value="value.target" :options="targetOptions" filterable tag
                                style="width: 150px;" />
                            </n-form-item>
                          </n-space>

                          <!-- Start Time Slider -->
                          <n-form-item label="Start Time" style="margin-bottom: 0;">
                            <n-space vertical style="width: 100%;">
                              <n-space align="center">
                                <n-button-group style="align-self: center;">
                                  <n-button size="small" @click="value.startTime = Math.max(0, value.startTime - 1)" style="margin-bottom: 16px;">
                                    -
                                  </n-button>
                                  <n-button size="small" @click="value.startTime = Math.min(1440, value.startTime + 1)" style="margin-bottom: 16px;">
                                    +
                                  </n-button>
                                </n-button-group>
                                <n-slider v-model:value="value.startTime" :marks="timeMarks" :step="15" :min="0"
                                  :max="1440" style="width: 400px;" :tooltip="false" :format-tooltip="(value) => formatMinutesToTime(value)" />
                              </n-space>
                              <n-space>
                                <n-text depth="3" style="font-size: 12px;">{{ formatMinutesToTime( value.startTime ) }}</n-text>
                              </n-space>
                            </n-space>
                          </n-form-item>

                          <!-- End Time Slider -->
                          <n-form-item label="End Time" style="margin-bottom: 0;">
                            <n-space vertical style="width: 100%;">
                              <n-space align="center">
                                <n-button-group style="align-self: center;">
                                  <n-button size="small" @click="value.endTime = Math.max(0, value.endTime - 1)" style="margin-bottom: 16px;">
                                    -
                                  </n-button>
                                  <n-button size="small" @click="value.endTime = Math.min(1440, value.endTime + 1)" style="margin-bottom: 16px;">
                                    +
                                  </n-button>
                                </n-button-group>
                                <n-slider v-model:value="value.endTime" :marks="timeMarks" :step="15" :min="0"
                                  :max="1440" style="width: 400px;" :tooltip="false" :format-tooltip="(value) => formatMinutesToTime(value)" />
                              </n-space>
                              <n-space>
                                <n-text depth="3" style="font-size: 12px;">{{ formatMinutesToTime( value.endTime ) }}</n-text>
                              </n-space>
                            </n-space>
                          </n-form-item>

                          <!-- Weekdays Checkboxes -->
                          <n-form-item label="Days" style="margin-bottom: 0;">
                            <n-checkbox-group v-model:value="value.weekdays">
                              <n-space>
                                <n-checkbox value="MONDAY" label="Mon" />
                                <n-checkbox value="TUESDAY" label="Tue" />
                                <n-checkbox value="WEDNESDAY" label="Wed" />
                                <n-checkbox value="THURSDAY" label="Thu" />
                                <n-checkbox value="FRIDAY" label="Fri" />
                                <n-checkbox value="SATURDAY" label="Sat" />
                                <n-checkbox value="SUNDAY" label="Sun" />
                              </n-space>
                            </n-checkbox-group>
                          </n-form-item>
                        </n-space>
                      </n-card>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="contribution" tab="Contribution">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Messaging Allowed">
                  <n-select v-model:value="localFormData.messagingPolicy" :options="referencesStore.messagingPolicyOptions"
                    style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Song Submission Allowed">
                  <n-select v-model:value="localFormData.submissionPolicy" :options="referencesStore.submissionPolicyOptions"
                    style="width: 25%; max-width: 300px;" />
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
import { defineComponent, onMounted, onUnmounted, reactive, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NButton,
  NButtonGroup,
  NCard,
  NCheckbox,
  NCheckboxGroup,
  NColorPicker,
  NDynamicInput,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NInputNumber,
  NPageHeader,
  NSelect,
  NSlider,
  NSpace,
  NTabPane,
  NTabs,
  NText,
  NUpload,
  NIcon,
  UploadFileInfo,
  useLoadingBar,
  useMessage
} from "naive-ui";
import { Copy } from '@vicons/tabler';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import CodeMirror from 'vue-codemirror6';
import {
  RadioStation,
  BrandStatus,
  RadioStationSave,
  ManagedBy,
  SubmissionPolicy
} from "../../../types/kneoBroadcasterTypes";
import { useRadioStationStore } from "../../../stores/kneo/radioStationStore";
import { useAiAgentStore } from "../../../stores/kneo/aiAgentStore";
import { useProfileStore } from "../../../stores/kneo/profileStore";
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { handleFormSaveError, getErrorMessage } from '../../../utils/errorHandling';
import AclTable from '../../common/AclTable.vue';

export default defineComponent( {
  name: "RadioStationForm",
  components: {
    NPageHeader,
    NButtonGroup,
    NCard,
    NCheckbox,
    NCheckboxGroup,
    NColorPicker,
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
    NIcon,
    Copy,
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
    const referencesStore = useReferencesStore();
    const route = useRoute();
    const activeTab = ref( "properties" );
    const fileList = ref<UploadFileInfo[]>( [] );
    const lang = ref( html() );
    const profileOverrideEnabled = ref( false );
    const aiOverrideEnabled = ref( false );

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



    const targetOptions = [
      { value: "default", label: "default" }
    ];

    const localFormData = reactive<Partial<RadioStation> & { schedule?: any }>( {
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
      color: "#FFFFFF",
      hlsUrl: "",
      iceCastUrl: "",
      mixplaUrl: "",
      aiAgentId: undefined,
      profileId: undefined,
      timeZone: "",
      managedBy: undefined,
      bitRate: 128000,
      submissionPolicy: undefined,
      messagingPolicy: undefined,
      aiOverriding: { name: "", prompt: "", talkativity: 0, preferredVoice: "" },
      profileOverriding: { name: "", description: "" },
      schedule: { enabled: false, tasks: [] }
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
      if ( newAgent && localFormData.aiOverriding ) {
        localFormData.aiOverriding.name = newAgent.name || "";
        localFormData.aiOverriding.talkativity = newAgent.talkativity || 0;
        localFormData.aiOverriding.preferredVoice = newAgent.preferredVoice[0]?.id || "";
      }
    } );

    const selectedProfile = computed( () => {
      if ( !localFormData.profileId ) return null;
      return profileStore.getEntries.find( p => p.id === localFormData.profileId );
    } );

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
          color: localFormData.color || "",
          aiAgentId: localFormData.aiAgentId,
          profileId: localFormData.profileId,
          timeZone: localFormData.timeZone,
          managedBy: localFormData.managedBy,
          bitRate: localFormData.bitRate,
          submissionPolicy: localFormData.submissionPolicy,
          messagingPolicy: localFormData.messagingPolicy,
          aiOverriding: aiOverrideEnabled.value ? localFormData.aiOverriding : undefined,
          profileOverriding: profileOverrideEnabled.value ? localFormData.profileOverriding : undefined,
          schedule: localFormData.schedule ? JSON.parse( JSON.stringify( localFormData.schedule ) ) : undefined
        };


        await store.save( saveDTO, localFormData.id as string );
        message.success( "Radio Station saved successfully" );
        await router.push( "/outline/radiostations" );
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
      router.push( "/outline/radiostations" );
    };

    const calculateDuration = ( startTime: string, endTime: string ): string => {
      const [startHour, startMin] = startTime.split( ':' ).map( Number );
      const [endHour, endMin] = endTime.split( ':' ).map( Number );

      let startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;

      // Handle overnight schedules
      if ( endMinutes < startMinutes ) {
        endMinutes += 24 * 60;
      }

      const durationMinutes = endMinutes - startMinutes;
      const hours = Math.floor( durationMinutes / 60 );
      const minutes = durationMinutes % 60;

      if ( hours === 0 ) {
        return `${minutes}m`;
      } else if ( minutes === 0 ) {
        return `${hours}h`;
      } else {
        return `${hours}h ${minutes}m`;
      }
    };

    const formatWeekday = ( day: string ): string => {
      const dayMap: { [key: string]: string } = {
        'MONDAY': 'Mon',
        'TUESDAY': 'Tue',
        'WEDNESDAY': 'Wed',
        'THURSDAY': 'Thu',
        'FRIDAY': 'Fri',
        'SATURDAY': 'Sat',
        'SUNDAY': 'Sun'
      };
      return dayMap[day] || day;
    };

    const formatMinutesToTime = ( minutes: number ): string => {
      const hours = Math.floor( minutes / 60 );
      const mins = minutes % 60;
      return `${hours.toString().padStart( 2, '0' )}:${mins.toString().padStart( 2, '0' )}`;
    };

    const calculateDurationFromMinutes = ( startMinutes: number, endMinutes: number ): string => {
      let duration = endMinutes - startMinutes;
      if ( duration < 0 ) {
        duration += 24 * 60; // Handle overnight schedules
      }
      const hours = Math.floor( duration / 60 );
      const minutes = duration % 60;

      if ( hours === 0 ) {
        return `${minutes}m`;
      } else if ( minutes === 0 ) {
        return `${hours}h`;
      } else {
        return `${hours}h ${minutes}m`;
      }
    };

    const timeToMinutes = ( timeStr: string ): number => {
      const [hours, minutes] = timeStr.split( ':' ).map( Number );
      return hours * 60 + minutes;
    };

    const scheduleTasksArray = ref<any[]>( [] );

    watch( scheduleTasksArray, ( newValue ) => {
      if ( !localFormData.schedule ) {
        localFormData.schedule = { enabled: false, tasks: [] };
      }

      localFormData.schedule.tasks = newValue.map( task => ( {
        type: task.type,
        target: task.target,
        triggerType: 'TIME_WINDOW',
        timeWindowTrigger: {
          startTime: formatMinutesToTime( task.startTime ),
          endTime: formatMinutesToTime( task.endTime ),
          weekdays: task.weekdays
        }
      } ) );
    }, { deep: true } );

    const createScheduleTask = () => ( {
      type: 'PROCESS_DJ_CONTROL',
      target: 'default',
      startTime: 540, // 09:00
      endTime: 600,   // 10:00
      weekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    } );



    const taskTypeOptions = [
      { label: 'DJs shift', value: 'PROCESS_DJ_CONTROL' },

    ];

    const timeMarks = {
      0: '00:00',
      360: '06:00',
      720: '12:00',
      1080: '18:00',
      1440: '24:00'
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

    onMounted( async () => {
      const id = route.params.id as string;
      startClockUpdate();

      try {
        loadingBar.start();
        await aiAgentStore.fetchAllUnsecured( 1, 100 );
        await profileStore.fetchAllUnsecured( 1, 100 );
        await referencesStore.fetchVoices();
        await store.fetch( id );
        const currentData = store.getCurrent;
        Object.assign( localFormData, currentData );

        // Normalize numeric fields to ensure sliders receive numbers
        const normalizeNumericFields = () => {
          // bitRate may arrive as a string from the server
          const br = (localFormData as any).bitRate;
          (localFormData as any).bitRate = typeof br === 'string' ? Number(br) || 128000 : (typeof br === 'number' ? br : 128000);

          // aiOverriding.talkativity may also arrive as a string
          if (localFormData.aiOverriding) {
            const t = (localFormData.aiOverriding as any).talkativity;
            (localFormData.aiOverriding as any).talkativity = typeof t === 'string' ? Number(t) || 0 : (typeof t === 'number' ? t : 0);
          }
        };
        normalizeNumericFields();


        if ( localFormData.localizedName ) {
          localizedNameArray.value = Object.entries( localFormData.localizedName ).map( ( [language, name] ) => ( {
            language,
            name: name || ""
          } ) );
        }

        if ( localFormData.schedule && localFormData.schedule.tasks?.length > 0 ) {
          scheduleTasksArray.value = localFormData.schedule.tasks.map( task => ( {
            type: task.type,
            target: task.target,
            startTime: task.timeWindowTrigger ? timeToMinutes( task.timeWindowTrigger.startTime ) : 540,
            endTime: task.timeWindowTrigger ? timeToMinutes( task.timeWindowTrigger.endTime ) : 600,
            weekdays: task.timeWindowTrigger ? task.timeWindowTrigger.weekdays : []
          } ) );
        } else {
          scheduleTasksArray.value = [];
        }

        if ( !localFormData.schedule ) {
          localFormData.schedule = {
            enabled: false,
            tasks: []
          };
        }
        // If schedule exists but lacks enabled flag, default it
        if ( localFormData.schedule && typeof localFormData.schedule.enabled === 'undefined' ) {
          localFormData.schedule.enabled = false;
        }
      } catch ( error ) {
        console.error( "Failed to fetch data:", error );
        message.error( getErrorMessage(error) );
      } finally {
        loadingBar.finish();
      }
    } );

    onUnmounted( () => {
      stopClockUpdate();
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
      selectedAgent,
      selectedProfile,
      copyToClipboard,
      openUrl,
      goBack,
      aclData,
      aclLoading,
      timezones: referencesStore.timezones,
      managedByOptions,
      targetOptions,
      referencesStore,
      scheduleTasksArray,
      createScheduleTask,
      taskTypeOptions,
      timeMarks,
      formatMinutesToTime,
      calculateDurationFromMinutes,
      timeToMinutes,
      calculateDuration,
      formatWeekday,
      getCurrentTimeInTimezone,
      startClockUpdate,
      stopClockUpdate,
      profileOverrideEnabled,
      aiOverrideEnabled,
      voiceOptions
    };
  }
} );
</script>
<style scoped>
</style>