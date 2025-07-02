<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.nickName?.en || 'New Listener' }}</template>
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
        <n-button type="primary" @click="handleSave" size="large" :loading="isSaving">Save</n-button>
        <n-button type="default" @click="handleArchive" size="large" :disabled="!localFormData.id">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
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
                        style="flex: 1;"
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
  useLoadingBar,
  useMessage,
} from "naive-ui";
import { useListenersStore } from "../../../stores/kneo/listenersStore";
import { useRadioStationStore } from "../../../stores/kneo/radioStationStore";
import { useReferencesStore } from "../../../stores/kneo/referencesStore";
import { ListenerSave, LocalizedName } from "../../../types/kneoBroadcasterTypes";
import {
  isErrorWithResponse,
  capitalizeFirstLetter,
  getErrorMessage
} from '../../helpers/errorHandling';

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

    const nickNameArray = computed({
      get: () => {
        if (!localFormData.nickName) return [];
        return Object.entries(localFormData.nickName).map(([language, name]) => ({
          language,
          name
        }));
      },
      set: (value) => {
        localFormData.nickName = {};
        value.forEach(item => {
          if (item.language && localFormData.nickName) {
            localFormData.nickName[item.language] = item.name || "";
          }
        });
      }
    });

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
        if (!localFormData.nickName) localFormData.nickName = { en: '' }; // Ensure nickName is initialized
        if (!localFormData.localizedName) localFormData.localizedName = { en: '' };
      } else {
        // Reset for new form
        Object.assign(localFormData, {
          id: null, author: "", regDate: "", lastModifier: "", lastModifiedDate: "",
          localizedName: { en: "" }, country: "", nickName: { en: "" },
          archived: 0, listenerOf: [],
        });
      }
    }, { immediate: true, deep: true });

    const handleSave = async () => {
      isSaving.value = true;
      loadingBar.start();
      try {
        const dataToSave: ListenerSave = {
          nickName: localFormData.nickName,
          country: localFormData.country,
          localizedName: localFormData.localizedName, // Assuming this should also be saved
          archived: localFormData.archived,
          listenerOf: localFormData.listenerOf,
        };

        await store.saveListener(dataToSave, localFormData.id);
        message.success("Listener saved successfully");
        router.push("/outline/station/" + route.params.brandName + "/listeners"); // Adjust as needed
      } catch (error: unknown) {
         if (isErrorWithResponse(error) && error.response?.status === 400) {
          const errorData = error.response.data as { message?: string; errors?: { field: string; message: string }[] };
          if (errorData.errors?.length) {
            errorData.errors.forEach(err => {
              message.error(`${capitalizeFirstLetter(err.field)}: ${err.message}`);
            });
          } else {
            message.error(errorData.message || "Validation failed");
          }
        } else {
          message.error(`Save failed: ${getErrorMessage(error)}`);
        }
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

    onMounted(async () => {
      const listenerId = route.params.listenerId as string;
      loadingBar.start();
      try {
        // Always fetch radio stations for the dropdown
        await radioStationStore.fetchAll();
        
        if (listenerId && listenerId !== 'new') {
          await store.fetchListener(listenerId);
          // Data assignment is handled by the watcher
        } else {
          // Reset form for new listener, handled by watcher's initial run
          store.apiFormResponse = null; // Clear any existing form data in store
        }
      } catch (error) {
        message.error('Failed to load data');
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
      isSaving,
      radioStationOptions,
      localizedNameArray,
      nickNameArray,
      createLocalizedName,
      createNickName,
      languageOptions: referencesStore.languageOptions,
      countryOptions: referencesStore.countryOptions,
    };
  },
});
</script>
