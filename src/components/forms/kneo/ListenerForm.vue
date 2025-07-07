<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.localizedName?.en || 'New Listener' }}</template>
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
                            :options="languageOptions"
                            placeholder="Language"
                            style="width: 120px;"
                        />
                        <n-input
                            v-model:value="value.name"
                            placeholder="Name"
                            style="flex: 2;"
                        />
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
                            :options="languageOptions"
                            placeholder="Language"
                            style="width: 120px;"
                        />
                        <n-input
                            v-model:value="value.name"
                            placeholder="Nick Name"
                            style="flex: 1;"
                        />
                      </n-space>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Country" path="country">
                  <n-select
                      v-model:value="localFormData.country"
                      :options="countryOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Listener of" path="listenerOf">
                  <n-select v-model:value="localFormData.listenerOf" :options="radioStationOptions" filterable
                            multiple placeholder="Select Radio Stations" style="width: 50%; max-width: 600px;" />
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
import { handleFormSaveError } from '../../../utils/errorHandling';

interface LocalListenerFormData {
  id: string | null;
  author: string;
  regDate: string;
  lastModifier: string;
  lastModifiedDate: string;
  localizedName: LocalizedName;
  country: string;
  nickName: LocalizedName;
  archived: number;
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
      country: "",
      nickName: { en: "" },
      archived: 0,
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
    const nickNameArray = ref<{ language: string; name: string }[]>([]);
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
          localFormData.nickName[item.language] = item.name || "";
        }
      });
    }, { deep: true });

    const createLocalizedName = () => ({
      language: "",
      name: ""
    });

    const createNickName = () => ({
      language: "",
      name: ""
    });

    watch(() => store.getCurrent, (currentListener) => {
      if (currentListener && currentListener.id) {
        Object.assign(localFormData, currentListener);
        if (!localFormData.nickName) localFormData.nickName = { en: '' };
        if (!localFormData.localizedName) localFormData.localizedName = { en: '' };

        if (localFormData.localizedName) {
          localizedNameArray.value = Object.entries(localFormData.localizedName).map(([language, name]) => ({
            language,
            name
          }));
        }
        if (localFormData.nickName) {
          nickNameArray.value = Object.entries(localFormData.nickName).map(([language, name]) => ({
            language,
            name
          }));
        }
      }
    }, { immediate: true, deep: true });

    const handleSave = async () => {
      isSaving.value = true;
      loadingBar.start();
      try {
        const dataToSave: ListenerSave = {
          nickName: localFormData.nickName,
          country: localFormData.country,
          localizedName: localFormData.localizedName,
          archived: localFormData.archived,
          listenerOf: localFormData.listenerOf,
        };

        console.log('Data to save:', dataToSave);
        console.log('Current localFormData:', localFormData);
        console.log('localizedNameArray:', localizedNameArray.value);
        console.log('nickNameArray:', nickNameArray.value);

        await store.saveListener(dataToSave, localFormData.id);
        message.success("Listener saved successfully");
        if (route.params.brandName) {
          router.push("/outline/station/" + route.params.brandName + "/listeners");
        } else {
          router.push("/outline/listeners");
        }
      } catch (error: unknown) {
        handleFormSaveError(error, message, 'Save failed');
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
      
      try {
        loadingBar.start();
        
        await store.fetchListener(id);
        Object.assign(localFormData, store.getCurrent);

        if (localFormData.localizedName) {
          localizedNameArray.value = Object.entries(localFormData.localizedName).map(([language, name]) => ({
            language,
            name
          }));
        }
        if (localFormData.nickName) {
          nickNameArray.value = Object.entries(localFormData.nickName).map(([language, name]) => ({
            language,
            name
          }));
        }
      } catch (error) {
        console.error('Failed to fetch listener:', error);
        message.error('Failed to fetch listener');
      } finally {
        loadingBar.finish();
      }

      try {
        await radioStationStore.fetchAll();
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    });

    return {
      store,
      localFormData,
      handleSave,
      handleArchive,
      goBack,
      formTitle,
      isSaving,
      radioStationOptions,
      localizedNameArray,
      nickNameArray,
      createLocalizedName,
      createNickName,
      languageOptions: referencesStore.languageOptions,
      countryOptions: referencesStore.countryOptions,
      activeTab,
      aclData,
      aclLoading,
    };
  },
});
</script>