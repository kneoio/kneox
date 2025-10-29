<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>
          <span>{{ localFormData.id ? 'Prompt' : 'New Prompt' }}</span>
          <n-tag v-if="localFormData.master" type="success" size="small" class="ml-2">MASTER</n-tag>
        </template>
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
        <n-button type="default" :disabled="!localFormData.master" @click="handleReplicateClick" size="large">Replicate</n-button>
      </n-button-group>
    </n-gi>

    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Title">
                  <n-input v-model:value="localFormData.title" style="width: 50%; max-width: 600px;" placeholder=""/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Prompt Type">
                  <n-select v-model:value="localFormData.promptType" :options="promptTypeOptions" style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Language">
                  <n-select v-model:value="localFormData.languageCode" :options="langOptions" style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <div style="display: flex; align-items: center; gap: 16px;">
                  <n-checkbox v-model:checked="localFormData.enabled">Enabled</n-checkbox>
                  <n-checkbox v-model:checked="localFormData.master">Master</n-checkbox>
                  <n-checkbox v-model:checked="localFormData.locked">Locked</n-checkbox>
                  <n-checkbox v-model:checked="localFormData.podcast">Podcast</n-checkbox>
                </div>
              </n-gi>
              <n-gi>
                <n-form-item label="Prompt">
                  <CodeMirror
                    :model-value="localFormData.prompt"
                    @update:model-value="(val) => (localFormData.prompt = typeof val === 'string' ? val : (((val as any)?.data) ?? ''))"
                    basic
                    :disabled="localFormData.locked"
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
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="acl" tab="ACL">
          <acl-table :acl-data="aclData" :loading="aclLoading" />
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>

  <n-modal v-model:show="showReplicateDialog" preset="dialog" title="Replicate Prompt">
    <n-space vertical>
      <n-text>Select languages to replicate this prompt:</n-text>
      <n-grid :cols="3" x-gap="12" y-gap="8">
        <n-gi v-for="lang in langOptions" :key="lang.value">
          <n-checkbox 
            :checked="selectedLanguages.includes(lang.value)" 
            @update:checked="(checked) => toggleLanguage(lang.value, checked)"
          >
            {{ lang.label }}
          </n-checkbox>
        </n-gi>
      </n-grid>
    </n-space>
    <template #action>
      <n-space>
        <n-button @click="showReplicateDialog = false">Cancel</n-button>
        <n-button type="primary" @click="handleReplicate" :disabled="selectedLanguages.length === 0">Replicate</n-button>
      </n-space>
    </template>
  </n-modal>
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
  NPageHeader,
  NTabs,
  NTabPane,
  NSelect,
  NSwitch,
  NTag,
  NModal,
  NSpace,
  NText,
  NCheckbox,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import { EditorView } from '@codemirror/view';
import { handlebarsLanguage } from '@xiechao/codemirror-lang-handlebars';
import CodeMirror from 'vue-codemirror6';
import { BroadcastPrompt, BroadcastPromptSave } from '../../../types/kneoBroadcasterTypes';
import { usePromptStore } from '../../../stores/kneo/promptStore';
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import AclTable from '../../common/AclTable.vue';

export default defineComponent({
  name: 'PromptForm',
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
    NSwitch,
    NTag,
    NModal,
    NSpace,
    NText,
    NCheckbox,
    CodeMirror,
    AclTable
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = usePromptStore();
    const referencesStore = useReferencesStore();
    const route = useRoute();

    const activeTab = ref('properties');
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);
    const showReplicateDialog = ref(false);
    const selectedLanguages = ref<string[]>([]);

    const editorExtensions = computed(() => [handlebarsLanguage, EditorView.lineWrapping]);

    const formTitle = computed(() => (localFormData.id ? 'Edit Prompt' : 'Create New Prompt'));

    const localFormData = reactive<BroadcastPrompt>({
      id: '',
      author: '',
      regDate: '',
      lastModifier: '',
      lastModifiedDate: '',
      title: '',
      enabled: false,
      prompt: '',
      promptType: '',
      languageCode: '',
      master: false,
      locked: false,
      podcast: false
    });

    const handleSave = async () => {
      try {
        loadingBar.start();
        const saveData: BroadcastPromptSave = {
          title: localFormData.title,
          enabled: localFormData.enabled,
          prompt: localFormData.prompt,
          promptType: localFormData.promptType,
          languageCode: localFormData.languageCode,
          master: localFormData.master,
          locked: localFormData.locked,
          podcast: localFormData.podcast,
        };
        const id = localFormData.id ? localFormData.id : null;
        await store.save(saveData, id);
        message.success('Prompt saved successfully');
        await router.push('/outline/prompts');
      } catch (error: any) {
        console.error('Failed to save Prompt:', error);
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const goBack = () => {
      router.push('/outline/prompts');
    };

    const handleReplicateClick = () => {
      selectedLanguages.value = (referencesStore as any).languageOptions.map((lang: any) => lang.value);
      showReplicateDialog.value = true;
    };

    const handleReplicate = async () => {
      try {
        loadingBar.start();
        message.info(`Replicating prompt to ${selectedLanguages.value.length} language(s)...`);
        showReplicateDialog.value = false;
      } catch (error: any) {
        console.error('Failed to replicate prompt:', error);
        message.error('Failed to replicate prompt.');
      } finally {
        loadingBar.finish();
      }
    };

    const toggleLanguage = (langValue: string, checked: boolean) => {
      if (checked) {
        if (!selectedLanguages.value.includes(langValue)) {
          selectedLanguages.value.push(langValue);
        }
      } else {
        selectedLanguages.value = selectedLanguages.value.filter(l => l !== langValue);
      }
    };

    onMounted(async () => {
      try {
        loadingBar.start();
        try { await (referencesStore as any).fetchLanguages?.(); } catch {}
        const id = route.params.id as string;
        if (id) {
          await store.fetch(id);
          const data = { ...store.getCurrent } as BroadcastPrompt;
          Object.assign(localFormData, data);
        }
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        const data = error?.response?.data;
        if (data?.message) {
          message.error(String(data.message));
        } else {
          message.error(getErrorMessage(error));
        }
        if (route.params.id) {
          router.push('/outline/prompts');
        }
      } finally {
        loadingBar.finish();
      }
    });

    const fetchAclData = async () => {
      const id = route.params.id as string;
      if (!id || id === 'new') {
        aclData.value = [];
        return;
      }
      try {
        aclLoading.value = true;
        const response = await store.fetchAccessList(id);
        aclData.value = response.accessList || [];
      } catch (error: any) {
        const data = error?.response?.data;
        if (data?.message) {
          message.error(String(data.message));
        } else {
          message.error(getErrorMessage(error));
        }
        aclData.value = [];
      } finally {
        aclLoading.value = false;
      }
    };

    watch(activeTab, (newTab) => {
      if (newTab === 'acl') {
        fetchAclData();
      }
    });

    return {
      localFormData,
      formTitle,
      handleSave,
      goBack,
      activeTab,
      editorExtensions,
      langOptions: (referencesStore as any).languageOptions,
      promptTypeOptions: (referencesStore as any).promptTypeOptions,
      aclData,
      aclLoading,
      showReplicateDialog,
      selectedLanguages,
      handleReplicateClick,
      handleReplicate,
      toggleLanguage
    };
  }
});
</script>
