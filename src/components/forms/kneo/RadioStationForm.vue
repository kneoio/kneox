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
                      @click="copyToClipboard(localFormData.iceCastUrl || '')"
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
                      @click="copyToClipboard(localFormData.actionUrl || '')"
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
                      v-model:value="localFormData.aiAgentId"
                      :options="agentOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi v-if="selectedAgent">
                <n-form-item label="Preferred Language">
                  <n-input
                      :value="selectedAgent.preferredLang"
                      style="width: 50%; max-width: 600px; background-color: #f5f5f5; cursor: not-allowed;"
                      readonly
                      disabled
                  />
                </n-form-item>
              </n-gi>
              <n-gi v-if="selectedAgent">
                <n-form-item label="Main Prompt">
                  <CodeMirror
                      :modelValue="selectedAgent.mainPrompt"
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
                      :disabled="true"
                  />
                </n-form-item>
              </n-gi>
              <n-gi v-if="selectedAgent">
                <n-form-item label="Preferred Voice">
                  <n-input
                      :value="selectedAgent.preferredVoice[0]?.name"
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
                      v-model:value="localFormData.profileId"
                      :options="profileOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi v-if="selectedProfile">
                <n-form-item label="Description">
                  <n-input
                      :value="selectedProfile.description"
                      type="textarea"
                      :autosize="{ minRows: 3, maxRows: 5 }"
                      style="width: 50%; max-width: 600px; background-color: #f5f5f5; cursor: not-allowed;"
                      disabled
                  />
                </n-form-item>
              </n-gi>

              <n-gi v-if="selectedProfile">
                <n-form-item label="Explicit Content">
                  <n-checkbox
                      :checked="selectedProfile.explicitContent"
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
import { defineComponent, onMounted, reactive, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
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
import { Copy } from '@vicons/tabler';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import CodeMirror from 'vue-codemirror6';
import {
  RadioStation,
  BrandStatus,
  RadioStationSave,
  AiAgent,
  Profile
} from "../../../types/kneoBroadcasterTypes";
import { useRadioStationStore } from "../../../stores/kneo/radioStationStore";
import { useAiAgentStore } from "../../../stores/kneo/aiAgentStore";
import { useProfileStore } from "../../../stores/kneo/profileStore";

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
    const profileStore = useProfileStore();
    const route = useRoute();
    const activeTab = ref("properties");
    const fileList = ref<UploadFileInfo[]>([]);
    const lang = ref(html());

    const editorExtensions = computed(() => [
      EditorView.lineWrapping
    ]);

    const localFormData = reactive<Partial<RadioStation>>({
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      status: BrandStatus.OFF_LINE,
      country: "",
      slugName: "",
      url: "",
      iceCastUrl: "",
      actionUrl: "",
      aiAgentId: undefined,
      profileId: undefined
    });

    const selectedAgent = computed(() => {
      if (!localFormData.aiAgentId) return null;
      return aiAgentStore.getEntries.find(a => a.id === localFormData.aiAgentId);
    });

    const selectedProfile = computed(() => {
      if (!localFormData.profileId) return null;
      return profileStore.getEntries.find(p => p.id === localFormData.profileId);
    });

    const countryOptions = [
      { label: "United States", value: "US" },
      { label: "United Kingdom", value: "GB" },
      { label: "Germany", value: "DE" },
      { label: "France", value: "FR" }
    ];

    const agentOptions = computed(() => {
      return aiAgentStore.getEntries.map(agent => ({
        label: agent.name,
        value: agent.id
      }));
    });

    const profileOptions = computed(() => {
      return profileStore.getEntries.map(profile => ({
        label: profile.name,
        value: profile.id
      }));
    });



    const copyToClipboard = (text: string | undefined) => {
      if (!text) {
        message.error('Nothing to copy');
        return;
      }
      navigator.clipboard.writeText(text)
          .then(() => message.success('Copied to clipboard!'))
          .catch(() => message.error('Failed to copy'));
    };

    const handleSave = async () => {
      try {
        loadingBar.start();
        const saveDTO: RadioStationSave = {
          country: localFormData.country || "",
          slugName: localFormData.slugName || "",
          url: localFormData.url || "",    
          aiAgentId: localFormData.aiAgentId,
          profileId: localFormData.profileId
        };

        await store.save(saveDTO, localFormData.id as string);
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
        await aiAgentStore.fetchAll(1, 100);
        await profileStore.fetchAll(1, 100);

        if (id && id !== 'new') {
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
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
      agentOptions,
      profileOptions,
      selectedAgent,
      selectedProfile,
      copyToClipboard,
      lang,
      editorExtensions
    };
  }
});
</script>