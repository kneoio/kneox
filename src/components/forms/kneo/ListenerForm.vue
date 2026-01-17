<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.slugName || localFormData.localizedName?.en || 'New Listener' }} (ID: {{ localFormData.userId }})</template>
        <template #footer>
          <span v-if="localFormData.id">
            Registered: {{ localFormData.regDate }}, Last Modified: {{ localFormData.lastModifiedDate }}
            <br>
            Author: {{ localFormData.author }}, Last Modifier: {{ localFormData.lastModifier }}
          </span>
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" @click="handleArchive" size="large" :disabled="!localFormData.id">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto" :model="localFormData">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
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
                <n-form-item label="Email">
                  <n-input v-model:value="localFormData.email" placeholder="listener@example.com" style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Listener of" path="listenerOf">
                  <n-select v-model:value="localFormData.listenerOf" :options="radioStationOptions" filterable
                            multiple style="width: 50%; max-width: 600px;" placeholder="Select brands to associate with this listener" />
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

interface LocalListenerFormData {
  id: string | null;
  author: string;
  regDate: string;
  lastModifier: string;
  lastModifiedDate: string;
  localizedName: LocalizedName;
  nickName: Record<string, string[]>;
  userData: Record<string, string>;
  archived: number;
  userId: string | number;
  slugName: string;
  email: string;
  listenerOf: string[];
}

export default defineComponent({
  name: "ListenerForm",
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

    const localFormData = reactive<LocalListenerFormData>({
      id: null,
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      localizedName: { en: "" },
      nickName: {},
      userData: {},
      archived: 0,
      userId: "",
      slugName: "",
      email: "",
      listenerOf: [],
    });

    const formTitle = computed(() => localFormData.id ? 'Edit Listener' : 'Create New Listener');

    const radioStationOptions = computed(() => {
      return radioStationStore.getEntries.map(station => ({
        label: station.slugName,
        value: station.id
      }));
    });

    const localizedNameArray = ref<{ language: string; name: string }[]>([]);
    const nickNameArray = ref<{ language: string; names: string[] }[]>([]);
    const userDataArray = ref<{ key: string; value: string }[]>([]);
    const activeTab = ref('properties');
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);

    watch(localizedNameArray, (newValue) => {
      localFormData.localizedName = {};
      newValue.forEach(item => {
        if (item.language && item.language.trim() !== '') {
          localFormData.localizedName[item.language] = item.name || "";
        }
      });
    }, { deep: true });

    watch(nickNameArray, (newValue) => {
      localFormData.nickName = {};
      newValue.forEach(item => {
        if (item.language && item.language.trim() !== '') {
          localFormData.nickName[item.language] = item.names || [];
        }
      });
    }, { deep: true });

    watch(userDataArray, (newValue) => {
      localFormData.userData = {};
      newValue.forEach(item => {
        if (item.key && item.key.trim() !== '') {
          localFormData.userData[item.key] = item.value || "";
        }
      });
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

    watch(() => store.getCurrent, (currentListener) => {
      if (currentListener && currentListener.id) {
        const listener = currentListener as any;
        localFormData.id = listener.id;
        localFormData.author = listener.author || '';
        localFormData.regDate = listener.regDate || '';
        localFormData.lastModifier = listener.lastModifier || '';
        localFormData.lastModifiedDate = listener.lastModifiedDate || '';
        localFormData.localizedName = listener.localizedName || { en: '' };
        localFormData.nickName = listener.nickName || {};
        localFormData.userData = listener.userData || {};
        localFormData.archived = listener.archived || 0;
        localFormData.userId = listener.userId || '';
        localFormData.slugName = listener.slugName || '';
        localFormData.email = listener.email || '';
        // Set listenerOf directly from payload
        if (listener.listenerOf && Array.isArray(listener.listenerOf)) {
          localFormData.listenerOf = listener.listenerOf;
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

    const handleSave = async () => {
      isSaving.value = true;
      loadingBar.start();
      try {
        // Validate email is not empty
        if (!localFormData.email || localFormData.email.trim() === '') {
          message.error('Email is required');
          return;
        }

        const dataToSave: ListenerSave = {
          nickName: localFormData.nickName,
          localizedName: localFormData.localizedName,
          archived: localFormData.archived,
          userData: localFormData.userData,
          listenerOf: localFormData.listenerOf,
          email: localFormData.email,
          userId: localFormData.userId,
        };

        console.log('Data to save:', dataToSave);

        await store.saveListener(dataToSave, localFormData.id);
        message.success("Listener saved successfully");
        if (route.params.brandName) {
          router.push("/outline/station/" + route.params.brandName + "/listeners");
        } else {
          router.push("/outline/listeners");
        }
      } catch (error: any) {
        handleFormSaveError(error, message);
      } finally {
        isSaving.value = false;
        loadingBar.finish();
      }
    };

    const handleArchive = () => {
      message.info("Archive functionality not implemented yet for listeners.");
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
      
      try {
        loadingBar.start();
        
        await store.fetchListener(id);
        const currentData = store.getCurrent;
        
        if (currentData && currentData.id) {
          const listener = currentData as any;
          localFormData.id = listener.id;
          localFormData.author = listener.author || '';
          localFormData.regDate = listener.regDate || '';
          localFormData.lastModifier = listener.lastModifier || '';
          localFormData.lastModifiedDate = listener.lastModifiedDate || '';
          localFormData.localizedName = listener.localizedName || { en: '' };
          localFormData.nickName = listener.nickName || {};
          localFormData.userData = listener.userData || {};
          localFormData.archived = listener.archived || 0;
          localFormData.userId = listener.userId || '';
          localFormData.slugName = listener.slugName || '';
          localFormData.email = listener.email || '';
          // Map listenerOf to newlyListenerOf for editing (extract UUIDs)
          if (listener.listenerOf && Array.isArray(listener.listenerOf)) {
            localFormData.newlyListenerOf = listener.listenerOf.map((item: any) => item.brandId || item.id);
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
      } catch (error) {
        console.error('Failed to fetch listener:', error);
        message.error(getErrorMessage(error));
      } finally {
        loadingBar.finish();
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