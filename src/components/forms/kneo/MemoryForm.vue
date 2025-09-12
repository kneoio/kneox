<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header subtitle="Memory" @back="goBack">
        <template #title>{{ store.getCurrent.brand || 'New Memory' }} - {{ store.getCurrent.memoryType }}</template>
        <template #footer>
          Registered: {{ new Date(store.getCurrent.regDate).toLocaleString() }}, Last Modified: {{ new Date(store.getCurrent.lastModifiedDate).toLocaleString() }}
          <br>
          Author: {{ store.getCurrent.author }}, Last Modifier: {{ store.getCurrent.lastModUser }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab" type="line" animated>
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto" class="py-4">
            <n-grid :cols="1" x-gap="12" y-gap="12">
              <n-gi>
                <n-form-item label="Brand">
                  <strong>{{ localFormData.brand }}</strong>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Memory Type">
                  <strong>{{ getMemoryTypeLabel(localFormData.memoryType) }}</strong>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Content (JSON)">
                  <CodeMirror
                      v-model="localContentString"
                      basic
                      :style="{
                        width: '60%',
                        height: '400px',
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
</template>

<script lang="ts">
import {defineComponent, onMounted, reactive, ref, watch, computed} from "vue";
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
  useLoadingBar,
  useMessage
} from "naive-ui";
import {json} from "@codemirror/lang-json";
import {EditorView} from "@codemirror/view";
import CodeMirror from 'vue-codemirror6';
import AclTable from '../../common/AclTable.vue';
import {Memory, MemorySave} from "../../../types/kneoBroadcasterTypes"; 
import {useMemoryStore} from "../../../stores/kneo/memoryStore"; 
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';

export default defineComponent({
  name: "MemoryForm",
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
    NCheckbox,
    AclTable,
    CodeMirror
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useMemoryStore();
    const route = useRoute();
    const activeTab = ref("properties");
    const localContentString = ref("");
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);
    const lang = ref(json());
    const editorExtensions = computed(() => [
      json(),
      EditorView.lineWrapping
    ]);
    const localFormData = reactive<Partial<Memory>>({
      id: undefined,
      brand: "",
      memoryType: undefined,
      content: {},
      archived: false,
    });

    const memoryTypeOptions = [
      {label: "Listeners", value: "LISTENERS"},
      {label: "Audience Context", value: "AUDIENCE_CONTEXT"},
      {label: "Conversation History", value: "CONVERSATION_HISTORY"},
    ];

    const handleSave = async () => {
      loadingBar.start();
      try {
        let contentObject: Record<string, any>;
        try {
          contentObject = JSON.parse(localContentString.value);
        } catch (e) {
          message.error(getErrorMessage(e));
          loadingBar.error();
          return;
        }

        const saveDTO: MemorySave = {
          brand: localFormData.brand!,
          memoryType: localFormData.memoryType!,
          content: contentObject
        };

        await store.save(saveDTO, localFormData.id);
        message.success("Memory saved successfully");
        await router.push("/outline/memories");
      } catch (error) {
        handleFormSaveError(error, message);
        loadingBar.error();
      } finally {
        setTimeout(() => loadingBar.finish(), 200);
      }
    };

    const goBack = () => {
      router.push("/outline/memories");
    };
    
    const getMemoryTypeLabel = (value: string | undefined) => {
      if (!value) return '';
      const option = memoryTypeOptions.find(opt => opt.value === value);
      return option ? option.label : value;
    };
    
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
      } catch (error) {
        console.error('Failed to fetch ACL data:', error);
        message.error(getErrorMessage(error));
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

    onMounted(async () => {
      const id = route.params.id as string;
      if (id && id !== 'new') { 
        loadingBar.start();
        try {
          await store.fetchMemory(id);
          Object.assign(localFormData, store.getCurrent);
          localContentString.value = JSON.stringify(store.getCurrent.content, null, 2);
        } catch (error) {
          message.error(getErrorMessage(error));
        } finally {
          loadingBar.finish();
        }
      } else {
        localContentString.value = "{\n  \n}";
      }
    });

    return {
      store,
      localFormData,
      localContentString,
      handleSave,
      activeTab,
      goBack,
      memoryTypeOptions,
      aclData,
      aclLoading,
      lang,
      editorExtensions,
      getMemoryTypeLabel,
    };
  },
});
</script>