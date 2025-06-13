<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header subtitle="Radio Station" @back="goBack">
        <template #title>{{ store.getCurrent.country || store.getCurrent.slugName }}</template>
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
                <n-form-item label="Title">
                  <n-input v-model:value="localFormData.slugName" style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Country">
                  <n-select
                      v-model:value="localFormData.country"
                      :options="countryOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Stream URL">
                  <n-input
                      v-model:value="localFormData.url"
                      style="width: 50%; max-width: 600px;"
                      readonly
                  />
                  <n-button
                      type="primary"
                      text
                      @click="copyToClipboard(localFormData.url)"
                      style="margin-left: 8px;"
                  >
                    <template #icon>
                      <n-icon><Copy /></n-icon>
                    </template>
                  </n-button>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Icecast URL">
                  <n-input
                      v-model:value="localFormData.iceCastUrl"
                      style="width: 50%; max-width: 600px;"
                      readonly
                  />
                  <n-button
                      type="primary"
                      text
                      @click="copyToClipboard(localFormData.iceCastUrl)"
                      style="margin-left: 8px;"
                  >
                    <template #icon>
                      <n-icon><Copy/></n-icon>
                    </template>
                  </n-button>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Action URL">
                  <n-input
                      v-model:value="localFormData.actionUrl"
                      style="width: 50%; max-width: 600px;"
                      readonly
                  />
                  <n-button
                      type="primary"
                      text
                      @click="copyToClipboard(localFormData.actionUrl)"
                      style="margin-left: 8px;"
                  >
                    <template #icon>
                      <n-icon><Copy /></n-icon>
                    </template>
                  </n-button>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="aiAgent" tab="AI Agent">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Name">
                  <n-select
                      v-model:value="localFormData.aiAgent.name"
                      :options="agentOptions"
                      style="width: 50%; max-width: 600px;"
                      @update:value="updateSelectedAgent"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Preferred Language">
                  <n-input
                      v-model:value="localFormData.aiAgent.preferredLang"
                      style="width: 50%; max-width: 600px; background-color: #f5f5f5; cursor: not-allowed;"
                      readonly
                      disabled
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Main Prompt">
                  <CodeMirror
                      v-model="localFormData.aiAgent.mainPrompt"
                      basic
                      :lang="lang"
                      :style="{
                        width: '60%',
                        height: '200px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '3px',
                        backgroundColor: '#f5f5f5',
                        opacity: '0.6',
                        cursor: 'not-allowed'
                      }"
                      :extensions="editorExtensions"
                      :editable="false"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Preferred Voice">
                  <n-input
                      v-model:value="localFormData.aiAgent.preferredVoice[0].name"
                      style="width: 50%; max-width: 600px; background-color: #f5f5f5; cursor: not-allowed;"
                      readonly
                      disabled
                  />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="profile" tab="Profile">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Name">
                  <n-select
                      v-model:value="localFormData.profile.name"
                      :options="profileNameOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Description">
                  <n-input
                      v-model:value="localFormData.profile.description"
                      type="textarea"
                      style="width: 100%; max-width: 800px; background-color: #f5f5f5; cursor: not-allowed;"
                      :autosize="{ minRows: 3, maxRows: 5 }"
                      readonly
                      disabled
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Announcement Frequency">
                  <n-select
                      v-model:value="localFormData.profile.announcementFrequency"
                      :options="announcementFrequencyOptions"
                      style="width: 50%; max-width: 600px; background-color: #f5f5f5; cursor: not-allowed;"
                      disabled
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Explicit Content">
                  <n-checkbox
                      v-model:checked="localFormData.profile.explicitContent"
                      :disabled="true"
                  />
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
import {defineComponent, onMounted, reactive, ref, computed} from "vue";
import {useRoute, useRouter} from "vue-router";
import {
  NButton,
  NButtonGroup,
  NCheckbox,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NPageHeader,
  NSelect,
  NTabPane,
  NTabs,
  NUpload,
  NIcon,
  UploadFileInfo,
  useLoadingBar,
  useMessage
} from "naive-ui";
import {Copy} from '@vicons/tabler';
import {html} from '@codemirror/lang-html';
import {EditorView} from '@codemirror/view';
import CodeMirror from 'vue-codemirror6';
import {
  RadioStation, BrandStatus,
} from "../../../types/kneoBroadcasterTypes";
import {useRadioStationStore} from "../../../stores/kneo/radioStationStore";
import {useAiAgentStore} from "../../../stores/kneo/aiAgentStore";

export default defineComponent({
  name: "RadioStationForm",
  components: {
    NPageHeader,
    NButtonGroup,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NUpload,
    NTabs,
    NTabPane,
    NGrid,
    NGi,
    NSelect,
    NCheckbox,
    NIcon,
    Copy,
    CodeMirror
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useRadioStationStore();
    const aiAgentStore = useAiAgentStore();
    const route = useRoute();
    const activeTab = ref("properties");
    const fileList = ref([] as UploadFileInfo[]);
    const lang = ref(html());

    const editorExtensions = computed(() => [
      EditorView.lineWrapping
    ]);

    const countryOptions = [
      { label: 'France', value: 'FR' },
      { label: 'Portugal', value: 'PT' },
      { label: 'Kazakhstan', value: 'KZ' },
      { label: 'Spain', value: 'ES' },
      { label: 'China', value: 'CN' },
      { label: 'Japan', value: 'JP' }
    ];

    const profileNameOptions = [
      { label: 'Default Radio Profile', value: 'Default Radio Profile' },
      { label: 'Music Station Profile', value: 'Music Station Profile' },
      { label: 'News Station Profile', value: 'News Station Profile' },
      { label: 'Talk Radio Profile', value: 'Talk Radio Profile' }
    ];

    const languageOptions = [
      { label: 'Portuguese', value: 'POR' },
      { label: 'English', value: 'ENG' },
      { label: 'Spanish', value: 'ESP' },
      { label: 'French', value: 'FRA' },
      { label: 'Russian', value: 'RUS' },
      { label: 'Chinese', value: 'CHI' },
      { label: 'Japanese', value: 'JPN' }
    ];

    const announcementFrequencyOptions = [
      { label: 'Very Low', value: 'very_low' },
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'Medium High', value: 'medium_high' },
      { label: 'High', value: 'high' }
    ];

    const voiceOptions = [
      { label: 'Paulo', value: 'aLFUti4k8YKvtQGXv0UO' },
      { label: 'Ana', value: 'bGFUti5k9ZKwtRHXw1VP' },
      { label: 'Carlos', value: 'cMFVuj5l9ALxtSGYv2WQ' }
    ];

    const agentOptions = computed(() => {
      return aiAgentStore.getEntries.map(agent => ({
        label: agent.name,
        value: agent.id,
        preferredLang: agent.preferredLang,
        mainPrompt: agent.mainPrompt,
        preferredVoice: agent.preferredVoice.length > 0
            ? agent.preferredVoice[0]
            : { id: '', name: '' }
      }));
    });

    const localFormData = reactive<RadioStation>({
      slugName: "",
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      status: BrandStatus.OFF_LINE,
      url: "",
      country: "",
      iceCastUrl: "",
      actionUrl: "",
      aiAgent: {
        id: "",
        name: "",
        preferredLang: "",
        mainPrompt: "",
        preferredVoice: [{ id: "", name: "" }],
        enabledTools: []
      },
      profile: {
        id: "",
        name: "",
        description: "",
        announcementFrequency: "medium",
        explicitContent: false
      }
    });

    const updateSelectedAgent = (value: string) => {
      const selectedAgent = aiAgentStore.getEntries.find(agent => agent.id === value);
      if (selectedAgent) {
        localFormData.aiAgent.name = selectedAgent.name;
        localFormData.aiAgent.preferredLang = selectedAgent.preferredLang;
        localFormData.aiAgent.mainPrompt = selectedAgent.mainPrompt;
        localFormData.aiAgent.preferredVoice = selectedAgent.preferredVoice.length > 0
            ? [...selectedAgent.preferredVoice]
            : [{ id: '', name: '' }];
      }
    };

    const updatePreferredVoice = (value: string) => {
      const selectedVoice = voiceOptions.find(voice => voice.value === value);
      if (selectedVoice) {
        localFormData.aiAgent.preferredVoice[0] = {
          id: selectedVoice.value,
          name: selectedVoice.label
        };
      }
    };

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text)
          .then(() => message.success('Copied to clipboard!'))
          .catch(() => message.error('Failed to copy'));
    };

    const handleSave = async () => {
      try {
        loadingBar.start();
        const saveDTO: RadioStation = {
          id: localFormData.id,
          author: localFormData.author,
          regDate: localFormData.regDate,
          lastModifier: localFormData.lastModifier,
          lastModifiedDate: localFormData.lastModifiedDate,
          status: localFormData.status,
          country: localFormData.country,
          slugName: localFormData.slugName,
          url: localFormData.url,
          iceCastUrl: localFormData.iceCastUrl,
          actionUrl: localFormData.actionUrl,
          aiAgent: localFormData.aiAgent,
          profile: localFormData.profile
        };

        await store.save(saveDTO, localFormData.id);
        message.success("Radio Station saved successfully");
        await router.push("/outline/radiostations");
      } catch (error) {
        message.error("Failed to save Radio Station");
      } finally {
        loadingBar.finish();
      }
    };

    const handleArchive = () => {
      message.info("Archive functionality not implemented yet");
    };

    const goBack = () => {
      router.push("/outline/radiostations");
    };

    onMounted(async () => {
      const id = route.params.id as string;

      try {
        loadingBar.start();
        // Fetch AI agents first
        await aiAgentStore.fetchAll(1, 100); // Fetch first page with 100 items

        if (id) {
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);

          if (!localFormData.aiAgent.preferredVoice || localFormData.aiAgent.preferredVoice.length === 0) {
            localFormData.aiAgent.preferredVoice = [{ id: "", name: "" }];
          }
          if (!localFormData.iceCastUrl) {
            localFormData.iceCastUrl = "";
          }
          if (!localFormData.actionUrl) {
            localFormData.actionUrl = "";
          }
          if (!localFormData.aiAgent) {
            localFormData.aiAgent = {
              id: "",
              name: "",
              preferredLang: "",
              mainPrompt: "",
              preferredVoice: [{ id: "", name: "" }],
              enabledTools: []
            };
          }
          if (!localFormData.profile) {
            localFormData.profile = {
              id: "",
              name: "",
              description: "",
              announcementFrequency: "medium",
              explicitContent: false
            };
          }
        }
      } catch (error) {
        message.error('Failed to fetch data');
      } finally {
        loadingBar.finish();
      }
    });

    return {
      store,
      localFormData,
      handleSave,
      handleArchive,
      activeTab,
      goBack,
      fileList,
      countryOptions,
      profileNameOptions,
      languageOptions,
      announcementFrequencyOptions,
      voiceOptions,
      agentOptions,
      updateSelectedAgent,
      updatePreferredVoice,
      copyToClipboard,
      lang,
      editorExtensions
    };
  },
});
</script>