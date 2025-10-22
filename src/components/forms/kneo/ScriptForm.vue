<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.name || 'New Script' }}</template>
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
                <n-form-item label="Name">
                  <n-input v-model:value="localFormData.name" style="width: 50%; max-width: 600px;" placeholder=""/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Description">
                  <n-input
                    v-model:value="localFormData.description"
                    type="textarea"
                    :autosize="{ minRows: 3, maxRows: 6 }"
                    style="width: 50%; max-width: 600px;"
                    placeholder="Enter script description..."
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Labels">
                  <n-select
                    v-model:value="localFormData.labels"
                    :options="scriptLabelOptions"
                    multiple
                    filterable
                    style="width: 25%; max-width: 300px;"
                    placeholder="Select labels..."
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
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
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
  NText,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import { useScriptStore } from '../../../stores/kneo/scriptStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { Script, ScriptSave, ScriptScene } from '../../../types/kneoBroadcasterTypes';
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';
import { EditorView } from "@codemirror/view";
import { json } from "@codemirror/lang-json";
import CodeMirror from 'vue-codemirror6';
import AclTable from '../../common/AclTable.vue';

export default defineComponent({
  name: "ScriptForm",
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
    NText,
    CodeMirror,
    AclTable
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useScriptStore();
    const referencesStore = useReferencesStore();
    const scriptLabelOptions = ref<Array<{ label: string; value: string; color?: string; fontColor?: string }>>([]);
    const route = useRoute();

    const activeTab = ref("properties");
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);

    const editorExtensions = computed(() => [
      json(),
      EditorView.lineWrapping
    ]);

    const formTitle = computed(() => localFormData.id ? 'Edit Script' : 'Create New Script');

    const localFormData = reactive<Script>({
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      name: "",
      description: "",
      labels: []
    });


    const handleSave = async () => {
      try {
        loadingBar.start();

        const saveData: ScriptSave = {
          name: localFormData.name || '',
          description: localFormData.description || '',
          labels: localFormData.labels || []
        };

        const id = localFormData.id ? localFormData.id : null;
        await store.save(saveData, id);
        message.success("Script saved successfully");
        await router.push("/outline/scripts");
      } catch (error: any) {
        console.error('Failed to save Script:', error);
        handleFormSaveError(error, message);
      } finally {
        loadingBar.finish();
      }
    };

    const goBack = () => {
      router.push("/outline/scripts");
    };

    onMounted(async () => {
      try {
        loadingBar.start();
        // Load category-specific label options for scripts
        scriptLabelOptions.value = await referencesStore.fetchLabelsByCategory('script');
        
        const id = route.params.id as string;
        if (id && id !== 'new') {
          await store.fetch(id);
          const scriptData = { ...store.getCurrent } as Script;
          Object.assign(localFormData, scriptData);
        }
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        const data = error?.response?.data;
        if (data?.message) {
          message.error(String(data.message));
        } else {
          message.error(getErrorMessage(error));
        }
        if (route.params.id) {
          router.push("/outline/scripts");
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
      } catch (e: any) {
        const data = e?.response?.data;
        if (data?.message) message.error(String(data.message)); else message.error(getErrorMessage(e));
        aclData.value = [];
      } finally {
        aclLoading.value = false;
      }
    };

    watch(activeTab, async (tab) => {
      if (tab === 'acl') {
        await fetchAclData();
      }
    });

    return {
      localFormData,
      formTitle,
      handleSave,
      goBack,
      activeTab,
      referencesStore,
      editorExtensions,
      aclData,
      aclLoading,
      scriptLabelOptions,
    };
  },
});
</script>
