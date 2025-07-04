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
                <n-form-item label="Localized Names">
                  <n-dynamic-input
                      v-model:value="localizedNameArray"
                      :on-create="createLocalizedName"
                      style="width: 50%; max-width: 600px;"
                  >
                    <template #default="{ value, index }">
                      <n-space align="center" style="width: 100%;">
                        <n-select
                            v-model:value="value.language"
                            :options="languageOptions"
                            placeholder="Language"
                            style="width: 120px;"
                        />
                        <n-input
                            v-model:value="value.name"
                            placeholder="Name"
                            style="flex: 1;"
                        />
                      </n-space>
                    </template>
                  </n-dynamic-input>
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
                <n-form-item label="Description">
                  <n-input
                      v-model:value="localFormData.description"
                      type="textarea"
                      :autosize="{ minRows: 3, maxRows: 6 }"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Color">
                  <n-color-picker
                      v-model:value="localFormData.color"
                      style="width: 200px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="HLS URL">
                  <n-text style="width: 50%; max-width: 600px; font-family: monospace;">
                    {{ localFormData.hlsUrl }}
                  </n-text>
                  <n-button
                      type="primary"
                      text
                      @click="copyToClipboard(localFormData.hlsUrl)"
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
                  <n-text style="width: 50%; max-width: 600px; font-family: monospace;">
                    {{ localFormData.iceCastUrl }}
                  </n-text>
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
                <n-form-item label="Mixpla URL">
                  <n-text style="width: 50%; max-width: 600px; font-family: monospace;">
                    {{ localFormData.mixplaUrl }}
                  </n-text>
                  <n-button
                      type="primary"
                      text
                      @click="copyToClipboard(localFormData.mixplaUrl || '')"
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
        <n-tab-pane name="acl" tab="ACL">
          <AclTable :acl-data="aclData" :loading="aclLoading" />
        </n-tab-pane>
      </n-tabs>
    </n-gi>
</n-grid>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NButton,
  NButtonGroup,
  NCheckbox,
  NColorPicker,
  NDynamicInput,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NPageHeader,
  NSelect,
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
  AiAgent,
  Profile
} from "../../../types/kneoBroadcasterTypes";
import { useRadioStationStore } from "../../../stores/kneo/radioStationStore";
import { useAiAgentStore } from "../../../stores/kneo/aiAgentStore";
import { useProfileStore } from "../../../stores/kneo/profileStore";
import { useReferencesStore } from "../../../stores/kneo/referencesStore";
import AclTable from '../../common/AclTable.vue';

export default defineComponent({
  name: "RadioStationForm",
  components: {
    NPageHeader,
    NButtonGroup,
    NColorPicker,
    NDynamicInput,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NSpace,
    NText,
    NUpload,
    NTabs,
    NTabPane,
    NGrid,
    NGi,
    NSelect,
    NCheckbox,
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
    const activeTab = ref("properties");
    const fileList = ref<UploadFileInfo[]>([]);
    const lang = ref(html());

    const editorExtensions = computed(() => [
      EditorView.lineWrapping
    ]);

    const aclData = ref([]);
    const aclLoading = ref(false);

    const localFormData = reactive<Partial<RadioStation>>({
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
      color: "#FF9800",
      hlsUrl: "",
      iceCastUrl: "",
      mixplaUrl: "",
      aiAgentId: undefined,
      profileId: undefined
    });

    const localizedNameArray = computed({
      get: () => {
        if (!localFormData.localizedName) return [];
        return Object.entries(localFormData.localizedName).map(([language, name]) => ({
          language,
          name
        }));
      },
      set: (value) => {
        localFormData.localizedName = {};
        value.forEach(item => {
          if (item.language && localFormData.localizedName) {
            localFormData.localizedName[item.language] = item.name || "";
          }
        });
      }
    });

    const createLocalizedName = () => ({
      language: "",
      name: ""
    });

    const selectedAgent = computed(() => {
      if (!localFormData.aiAgentId) return null;
      return aiAgentStore.getEntries.find(a => a.id === localFormData.aiAgentId);
    });

    const selectedProfile = computed(() => {
      if (!localFormData.profileId) return null;
      return profileStore.getEntries.find(p => p.id === localFormData.profileId);
    });



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
          localizedName: localFormData.localizedName || {},
          country: localFormData.country || "",
          description: localFormData.description || "",
          color: localFormData.color || "#FF9800",
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

    const fetchAclData = async () => {
      const id = localFormData.id;
      if (id) {
        try {
          aclLoading.value = true;
          const data = await store.fetchAccessList(id);
          aclData.value = data;
        } catch (error) {
          console.error('Failed to fetch ACL data:', error);
          message.error('Failed to fetch ACL data');
        } finally {
          aclLoading.value = false;
        }
      }
    };

    watch(activeTab, (newTab) => {
      if (newTab === 'acl' && localFormData.id) {
        fetchAclData();
      }
    });

    onMounted(async () => {
      const id = route.params.id as string;

      try {
        loadingBar.start();
        await aiAgentStore.fetchAll(1, 100);
        await profileStore.fetchAll(1, 100);

        if (id && id !== 'new') {
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);

          if (!localFormData.localizedName || Object.keys(localFormData.localizedName).length === 0) {
            localFormData.localizedName = { en: "" };
          }
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
      fileList,
      lang,
      editorExtensions,
      localizedNameArray,
      createLocalizedName,
      countryOptions: referencesStore.countryOptions,
      languageOptions: referencesStore.languageOptions,
      agentOptions,
      profileOptions,
      selectedAgent,
      selectedProfile,
      copyToClipboard,
      goBack,
      aclData,
      aclLoading
    };
  }
});
</script>