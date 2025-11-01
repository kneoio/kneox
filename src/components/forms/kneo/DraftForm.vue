<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5" v-bind="$attrs">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>
          <span>{{ localFormData.id ? 'Draft' : 'New Draft' }}</span>
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
      </n-button-group>
    </n-gi>

    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Title">
                  <n-input v-model:value="localFormData.title" style="width: 50%; max-width: 600px;"
                           placeholder=""/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Draft Type">
                  <n-select v-model:value="localFormData.draftType" :options="draftTypeOptions"
                            style="width: 25%; max-width: 300px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Language">
                  <n-select v-model:value="localFormData.languageCode" :options="langOptions"
                            style="width: 25%; max-width: 300px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Content">
                  <CodeMirror
                      :model-value="localFormData.content"
                      @update:model-value="(val) => (localFormData.content = typeof val === 'string' ? val : (((val as any)?.data) ?? ''))"
                      basic
                      :style="{
                        width: '1200px',
                        height: '600px',
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
          <acl-table :acl-data="aclData" :loading="aclLoading"/>
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, reactive, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
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
  useLoadingBar,
  useMessage
} from 'naive-ui';
import {EditorView} from '@codemirror/view';
import {StreamLanguage} from '@codemirror/language';
import {kotlin} from '@codemirror/legacy-modes/mode/clike';
import CodeMirror from 'vue-codemirror6';
import {Draft, DraftSave} from '../../../types/kneoBroadcasterTypes';
import {useDraftStore} from '../../../stores/kneo/draftStore';
import {getErrorMessage, handleFormSaveError} from '../../../utils/errorHandling';
import {useReferencesStore} from '../../../stores/kneo/referencesStore';
import AclTable from '../../common/AclTable.vue';

export default defineComponent({
  name: 'DraftForm',
  inheritAttrs: false,
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
    CodeMirror,
    AclTable
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useDraftStore();
    const referencesStore = useReferencesStore();
    const route = useRoute();
    const activeTab = ref('properties');
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);
    const editorExtensions = computed(() => [StreamLanguage.define(kotlin), EditorView.lineWrapping]);
    const formTitle = computed(() => (localFormData.id ? 'Edit Draft' : 'Create New Draft'));
    const draftTypeOptions = [
      {label: 'General', value: 'general'},
      {label: 'Script', value: 'script'},
      {label: 'Prompt', value: 'prompt'},
      {label: 'Note', value: 'note'}
    ];
    const localFormData = reactive<Draft>({
      id: '',
      author: '',
      regDate: '',
      lastModifier: '',
      lastModifiedDate: '',
      title: '',
      content: '',
      draftType: '',
      languageCode: '',
      archived: 0
    });

    const handleSave = async () => {
      try {
        loadingBar.start();
        const saveData: DraftSave = {
          title: localFormData.title,
          content: localFormData.content,
          draftType: localFormData.draftType,
          languageCode: localFormData.languageCode,
          archived: localFormData.archived,
        };
        const id = localFormData.id ? localFormData.id : null;
        await store.save(saveData, id);
        message.success('Draft saved successfully');
        await router.push('/outline/drafts');
      } catch (error: any) {
        console.error('Failed to save Draft:', error);
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const goBack = () => {
      router.push('/outline/drafts');
    };

    onMounted(async () => {
      try {
        loadingBar.start();
        try {
          await (referencesStore as any).fetchLanguages?.();
        } catch {
        }
        const id = route.params.id as string;
        if (id) {
          await store.fetch(id);
          const data = {...store.getCurrent} as Draft;
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
          router.push('/outline/drafts');
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
      draftTypeOptions,
      aclData,
      aclLoading
    };
  }
});
</script>
