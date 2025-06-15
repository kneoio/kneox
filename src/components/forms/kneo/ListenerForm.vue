<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.nickName?.en || localFormData.slugName || 'New Listener' }}</template>
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
            <n-form-item label="Nickname (English)" path="nickName.en">
              <n-input v-model:value="localFormData.nickName.en" style="width: 50%; max-width: 600px;"/>
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Country" path="country">
              <n-input v-model:value="localFormData.country" style="width: 50%; max-width: 600px;"/>
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Slug Name" path="slugName">
              <n-input v-model:value="localFormData.slugName" style="width: 50%; max-width: 600px;" :disabled="!!localFormData.id"/>
            </n-form-item>
          </n-gi>
           <n-gi v-if="!localFormData.id">
            <n-form-item label="User ID" path="userId">
              <n-input-number v-model:value="localFormData.userId" style="width: 50%; max-width: 600px;" />
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
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NInputNumber,
  NPageHeader,
  useLoadingBar,
  useMessage,
} from "naive-ui";
import { useListenersStore } from "../../../stores/kneo/listenersStore";
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
  userId: number | null;
  country: string;
  nickName: LocalizedName;
  slugName: string;
  archived: number;
}

export default defineComponent({
  name: "ListenerForm",
  components: {
    NPageHeader,
    NButtonGroup,
    NForm,
    NFormItem,
    NInput,
    NInputNumber,
    NButton,
    NGrid,
    NGi,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const store = useListenersStore();
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
      userId: null,
      country: "",
      nickName: { en: "" },
      slugName: "",
      archived: 0,
    });

    const formTitle = computed(() => localFormData.id ? 'Edit Listener' : 'Create New Listener');

    watch(() => store.getCurrent, (currentListener) => {
      if (currentListener && currentListener.id) {
        Object.assign(localFormData, currentListener);
        if (!localFormData.nickName) localFormData.nickName = { en: '' }; // Ensure nickName is initialized
        if (!localFormData.localizedName) localFormData.localizedName = { en: '' };
      } else {
        // Reset for new form
        Object.assign(localFormData, {
          id: null, author: "", regDate: "", lastModifier: "", lastModifiedDate: "",
          localizedName: { en: "" }, userId: null, country: "", nickName: { en: "" },
          slugName: "", archived: 0,
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
          slugName: localFormData.slugName,
          localizedName: localFormData.localizedName, // Assuming this should also be saved
          archived: localFormData.archived,
        };
        if (!localFormData.id && localFormData.userId !== null) { // Only include userId for new entries
          dataToSave.userId = localFormData.userId;
        }

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
      if (listenerId && listenerId !== 'new') {
        loadingBar.start();
        try {
          await store.fetchListener(listenerId);
          // Data assignment is handled by the watcher
        } catch (error) {
          message.error('Failed to load listener data');
        } finally {
          loadingBar.finish();
        }
      } else {
        // Reset form for new listener, handled by watcher's initial run
        store.apiFormResponse = null; // Clear any existing form data in store
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
    };
  },
});
</script>
