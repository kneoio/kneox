<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.name || 'New Profile' }}</template>
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
        <n-button type="default" disabled @click="handleArchive" size="large">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Name">
                  <n-input v-model:value="localFormData.name" style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Description">
                  <n-input
                      v-model:value="localFormData.description"
                      type="textarea"
                      :autosize="{ minRows: 3, maxRows: 5 }"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Explicit Content">
                  <n-checkbox v-model:checked="localFormData.explicitContent" />
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
import { defineComponent, onMounted, reactive, ref, computed, watch } from "vue";
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
  NTabs,
  NTabPane,
  useLoadingBar,
  useMessage
} from "naive-ui";
import AclTable from '../../common/AclTable.vue';
import { Profile } from "../../../types/kneoBroadcasterTypes";
import { useProfileStore, ProfileDTO } from "../../../stores/kneo/profileStore";

export default defineComponent({
  name: "ProfileForm",
  components: {
    NPageHeader,
    NButtonGroup,
    NForm,
    NFormItem,
    NInput,
    NGrid,
    NGi,
    NCheckbox,
    NButton,
    NTabs,
    NTabPane,
    AclTable
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useProfileStore();
    const route = useRoute();
    const activeTab = ref('properties');
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);

    const formTitle = computed(() => localFormData.id ? 'Edit Profile' : 'Create New Profile');

    const localFormData = reactive<Partial<Profile>>({
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      name: "",
      description: "",
      explicitContent: false
    });

    const handleSave = async () => {
      try {
        loadingBar.start();
        await store.save(localFormData as ProfileDTO, localFormData.id as string);
        message.success("Profile saved successfully");
        await router.push("/outline/profiles");
      } catch (error) {
        message.error("Failed to save Profile");
      } finally {
        loadingBar.finish();
      }
    };
    
    const handleArchive = () => {
      message.info("Archive functionality not implemented yet");
    };

    const goBack = () => {
      router.push("/outline/profiles");
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
        message.error('Failed to fetch access control list');
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
        try {
          loadingBar.start();
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          message.error('Failed to fetch profile');
        } finally {
          loadingBar.finish();
        }
      }
    });

    return {
      localFormData,
      formTitle,
      handleSave,
      handleArchive,
      goBack,
      activeTab,
      aclData,
      aclLoading
    };
  }
});
</script>
