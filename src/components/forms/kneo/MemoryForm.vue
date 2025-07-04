<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header subtitle="Memory" @back="goBack">
        <template #title>{{ store.getCurrent.brand || 'New Memory' }} - {{ store.getCurrent.memoryType }}</template>
        <template #footer>
          Registered: {{ new Date(store.getCurrent.regDate).toLocaleString() }}, Last Modified: {{ new Date(store.getCurrent.lastModDate).toLocaleString() }}
          <br>
          Author: {{ store.getCurrent.author }}, Last Modifier: {{ store.getCurrent.lastModUser }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" @click="handleArchive" size="large">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab" type="line" animated>
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto" class="py-4">
            <n-grid :cols="1" x-gap="12" y-gap="12">
              <n-gi>
                <n-form-item label="Brand">
                  <n-input v-model:value="localFormData.brand" placeholder="e.g., nunoscope" style="max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Memory Type">
                  <n-select
                      v-model:value="localFormData.memoryType"
                      :options="memoryTypeOptions"
                      placeholder="Select a memory type"
                      style="max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Content (JSON)">
                  <n-input
                      v-model:value="localContentString"
                      type="textarea"
                      placeholder='{ "key": "value" }'
                      :autosize="{ minRows: 5, maxRows: 20 }"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Archived">
                  <n-checkbox v-model:checked="localFormData.archived"/>
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
import {defineComponent, onMounted, reactive, ref, watch} from "vue";
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
import AclTable from '../../common/AclTable.vue';
import {Memory, MemorySave} from "../../../types/kneoBroadcasterTypes"; // Adjust path as needed
import {useMemoryStore} from "../../../stores/kneo/memoryStore"; // Adjust path as needed

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
    AclTable
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useMemoryStore();
    const route = useRoute();
    const activeTab = ref("properties");

    // Separate ref for the JSON content string to bind to the textarea
    const localContentString = ref("");
    
    // ACL-related reactive properties
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);

    // Use a reactive object for the main form data
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
        // Validate and parse the JSON content string before saving
        let contentObject: Record<string, any>;
        try {
          contentObject = JSON.parse(localContentString.value);
        } catch (e) {
          message.error("The content is not valid JSON. Please correct it.");
          loadingBar.error();
          return;
        }

        const saveDTO: MemorySave = {
          brand: localFormData.brand!,
          memoryType: localFormData.memoryType!,
          content: contentObject,
          archived: localFormData.archived
        };

        await store.save(saveDTO, localFormData.id);
        message.success("Memory saved successfully");
        await router.push("/outline/memories");
      } catch (error) {
        message.error("Failed to save memory");
        loadingBar.error();
      } finally {
        // A short delay to ensure loading bar finishes after a quick save
        setTimeout(() => loadingBar.finish(), 200);
      }
    };

    const handleArchive = () => {
      // Implement archive logic here, e.g., setting archived to true and saving
      localFormData.archived = true;
      handleSave();
      message.info("Memory has been archived.");
    };



    const goBack = () => {
      router.push("/outline/memories");
    };
    
    // ACL fetch function
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
        message.error('Failed to fetch access control list');
        aclData.value = [];
      } finally {
        aclLoading.value = false;
      }
    };
    
    // Watch for tab changes to load ACL data
    watch(activeTab, (newTab) => {
      if (newTab === 'acl') {
        fetchAclData();
      }
    });

    onMounted(async () => {
      const id = route.params.id as string;
      if (id && id !== 'new') { // Handle "new" case
        loadingBar.start();
        try {
          await store.fetch(id);
          // Update localFormData with fetched data
          Object.assign(localFormData, store.getCurrent);
          // Stringify the content object for the textarea
          localContentString.value = JSON.stringify(store.getCurrent.content, null, 2);
        } catch (error) {
          message.error('Failed to fetch memory data');
        } finally {
          loadingBar.finish();
        }
      } else {
        // Set default values for a new memory form
        localContentString.value = "{\n  \n}";
      }
    });

    return {
      store,
      localFormData,
      localContentString,
      handleSave,
      handleArchive,
      activeTab,
      goBack,
      memoryTypeOptions,
      aclData,
      aclLoading,
    };
  },
});
</script>