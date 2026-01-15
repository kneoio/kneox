<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.listener?.localizedName?.en || 'New Brand Listener' }}</template>
        <template #footer>
          <span v-if="localFormData.listener?.id">
            Registered: {{ localFormData.listener?.regDate }}, Last Modified: {{ localFormData.listener?.lastModifiedDate }}
            <br>
            Author: {{ localFormData.listener?.author }}, Last Modifier: {{ localFormData.listener?.lastModifier }}
          </span>
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" @click="handleArchive" size="large" :disabled="!localFormData.listener?.id">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto" :model="localFormData.listener">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Listener Type">
                  <n-select
                      v-model:value="localFormData.listenerType"
                      :options="listenerTypeOptions"
                      style="width: 25%; max-width: 300px;"
                      disabled
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Localized Names">
                  <n-dynamic-input
                      v-model:value="localizedNameArray"
                      :on-create="createLocalizedName"
                      style="width: 50%; max-width: 600px;"
                  >
                    <template #default="{ value }">
                      <n-space align="center" style="width: 100%;">
                        <n-select
                            v-model:value="value.language"
                            :options="referencesStore.localizedLanguageOptions"
                            style="width: 120px;"
                        />
                        <n-input v-model:value="value.name" style="flex: 2;" placeholder=""/>
                      </n-space>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Nick Names">
                  <n-dynamic-input
                      v-model:value="nickNameArray"
                      :on-create="createNickName"
                      style="width: 50%; max-width: 600px;"
                  >
                    <template #default="{ value }">
                      <n-space align="center" style="width: 100%;">
                        <n-select
                            v-model:value="value.language"
                            :options="referencesStore.localizedLanguageOptions"
                            style="width: 120px;"
                        />
                        <n-dynamic-input
                            v-model:value="value.names"
                            :on-create="() => ''"
                            placeholder="Enter nickname"
                            style="flex: 1;"
                        />
                      </n-space>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="User Data">
                  <n-dynamic-input
                      v-model:value="userDataArray"
                      :on-create="createUserData"
                      style="width: 50%; max-width: 600px;"
                  >
                    <template #default="{ value }">
                      <n-space align="center" style="width: 100%;">
                        <n-input
                            v-model:value="value.key"
                            placeholder="Field name"
                            style="width: 200px;"
                        />
                        <n-input
                            v-model:value="value.value"
                            placeholder="Field value"
                            style="flex: 1;"
                        />
                      </n-space>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Listener of" path="listenerOf">
                  <n-select v-model:value="localFormData.listener.listenerOf" :options="radioStationOptions" filterable
                            multiple style="width: 50%; max-width: 600px;" />
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
  NDynamicInput,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NInputNumber,
  NPageHeader,
  NSelect,
  NSpace,
  NTabs,
  NTabPane,
  useLoadingBar,
  useMessage,
} from "naive-ui";
import AclTable from '../../common/AclTable.vue';
import { useListenersStore } from "../../../stores/kneo/listenersStore";
import { useRadioStationStore } from "../../../stores/kneo/radioStationStore";
import { useReferencesStore } from "../../../stores/kneo/referencesStore";
import { ListenerSave, LocalizedName } from "../../../types/kneoBroadcasterTypes";
import { handleFormSaveError, getErrorMessage } from '../../../utils/errorHandling';

interface LocalBrandListenerFormData {
  id: string | null;
  listenerType: string;
  listener: {
    id: string | null;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    localizedName: LocalizedName;
    nickName: Record<string, string[]>;
    userData: Record<string, string>;
    archived: number;
    listenerOf: string[];
    userId?: string;
  };
}

export default defineComponent({
  name: "BrandListenerForm",
  components: {
    NPageHeader,
    NButtonGroup,
    NDynamicInput,
    NForm,
    NFormItem,
    NInput,
    NInputNumber,
    NButton,
    NGrid,
    NGi,
    NSelect,
    NSpace,
    NTabs,
    NTabPane,
    AclTable,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const store = useListenersStore();
    const radioStationStore = useRadioStationStore();
    const referencesStore = useReferencesStore();
    const message = useMessage();
    const loadingBar = useLoadingBar();
    const isSaving = ref(false);

    const localFormData = reactive<LocalBrandListenerFormData>({
      id: null,
      listenerType: "",
      listener: {
        id: null,
        author: "",
        regDate: "",
        lastModifier: "",
        lastModifiedDate: "",
        localizedName: { en: "" },
        nickName: {},
        userData: {},
        archived: 0,
        listenerOf: [],
        userId: "",
      },
    });

    const formTitle = computed(() => localFormData.id ? 'Edit Brand Listener' : 'Create New Brand Listener');

    const radioStationOptions = computed(() => {
      return radioStationStore.getEntries.map(station => ({
        label: station.slugName,
        value: station.id
      }));
    });

    const listenerTypeOptions = [
      { label: "OWNER", value: "OWNER" },
      { label: "REGULAR", value: "REGULAR" },
      { label: "CONTRIBUTOR", value: "CONTRIBUTOR" },
    ];

    const localizedNameArray = ref<{ language: string; name: string }[]>([]);
    const nickNameArray = ref<{ language: string; names: string[] }[]>([]);
    const userDataArray = ref<{ key: string; value: string }[]>([]);
    const activeTab = ref('properties');
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);

    watch(localizedNameArray, (newValue) => {
      if (localFormData.listener) {
        localFormData.listener.localizedName = {};
        newValue.forEach(item => {
          if (item.language && item.language.trim() !== '') {
            localFormData.listener.localizedName[item.language] = item.name || "";
          }
        });
      }
    }, { deep: true });

    watch(nickNameArray, (newValue) => {
      if (localFormData.listener) {
        localFormData.listener.nickName = {};
        newValue.forEach(item => {
          if (item.language && item.language.trim() !== '') {
            localFormData.listener.nickName[item.language] = item.names || [];
          }
        });
      }
    }, { deep: true });

    watch(userDataArray, (newValue) => {
      if (localFormData.listener) {
        localFormData.listener.userData = {};
        newValue.forEach(item => {
          if (item.key && item.key.trim() !== '') {
            localFormData.listener.userData[item.key] = item.value || "";
          }
        });
      }
    }, { deep: true });

    const createLocalizedName = () => ({
      language: "",
      name: ""
    });

    const createNickName = () => ({
      language: "",
      names: [""]
    });

    const createUserData = () => ({
      key: "",
      value: ""
    });

    const handleSave = async () => {
      isSaving.value = true;
      loadingBar.start();
      try {
        const dataToSave: ListenerSave = {
          nickName: localFormData.listener.nickName,
          localizedName: localFormData.listener.localizedName,
          archived: localFormData.listener.archived,
          listenerOf: localFormData.listener.listenerOf,
          userData: localFormData.listener.userData,
        };

        console.log('Data to save:', dataToSave);

        await store.saveBrandListener(dataToSave, route.params.brandName as string, localFormData.id);
        message.success("Brand listener saved successfully");
        router.push("/outline/station/" + route.params.brandName + "/listeners");
      } catch (error: any) {
        handleFormSaveError(error, message);
      } finally {
        isSaving.value = false;
        loadingBar.finish();
      }
    };

    const handleArchive = () => {
      message.info("Archive functionality not implemented yet for brand listeners.");
    };

    const goBack = () => {
      router.back();
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
      const brandName = route.params.brandName as string;
      
      try {
        loadingBar.start();
        
        if (id !== 'new') {
          await store.fetchBrandListener(brandName, id);
          watch(() => store.getCurrentBrandListener, (currentBrandListener) => {
            if (currentBrandListener && currentBrandListener.docData) {
              const data = currentBrandListener.docData;
              
              // Set top-level fields
              localFormData.listenerType = data.listenerType || '';
              
              // Set listener nested fields
              if (data.listener) {
                localFormData.id = data.listener.id || null;
                localFormData.author = data.listener.author || '';
                localFormData.regDate = data.listener.regDate || '';
                localFormData.lastModifier = data.listener.lastModifier || '';
                localFormData.lastModifiedDate = data.listener.lastModifiedDate || '';
                localFormData.localizedName = data.listener.localizedName || { en: '' };
                localFormData.nickName = data.listener.nickName || {};
                localFormData.userData = data.listener.userData || {};
                localFormData.archived = data.listener.archived || 0;
                localFormData.listener.listenerOf = data.listener.listenerOf || [];
              }

              if (localFormData.localizedName) {
                localizedNameArray.value = Object.entries(localFormData.localizedName).map(([language, name]) => ({
                  language,
                  name
                }));
              }
              if (localFormData.nickName) {
                nickNameArray.value = Object.entries(localFormData.nickName).map(([language, names]) => ({
                  language,
                  names
                }));
              }
              if (localFormData.userData) {
                userDataArray.value = Object.entries(localFormData.userData).map(([key, value]) => ({
                  key,
                  value
                }));
              }
            }
          }, { immediate: true, deep: true });
        }
      } catch (error) {
        console.error('Failed to fetch brand listener:', error);
        message.error(getErrorMessage(error));
      } finally {
        loadingBar.finish();
      }

      try {
        await radioStationStore.fetchAll();
      } catch (error) {
        console.error('Failed to fetch data:', error);
        message.error(getErrorMessage(error));
      }
    });

    return {
      store,
      localFormData,
      handleSave,
      handleArchive,
      goBack,
      formTitle,
      radioStationOptions,
      listenerTypeOptions,
      localizedNameArray,
      nickNameArray,
      userDataArray,
      createLocalizedName,
      createNickName,
      createUserData,
      referencesStore,
      activeTab,
      aclData,
      aclLoading,
    };
  },
});
</script>
