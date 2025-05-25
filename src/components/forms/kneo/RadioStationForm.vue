<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header subtitle="Radio Station" @back="goBack">
        <template #title>{{ store.getCurrent.country || store.getCurrent.slugName }}</template>
        <template #footer>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{ store.getCurrent.lastModifiedDate }}
          <br>
          Author: {{ store.getCurrent.author }}, Last Modifier: {{ store.getCurrent.lastModifier }}
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
        <n-tab-pane name="properties" tab="Properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Title">
                  <n-input v-model:value="localFormData.slugName" style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Country">
                  <n-input v-model:value="localFormData.country" style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {defineComponent, onMounted, reactive, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {
  NButton,
  NButtonGroup,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NPageHeader,
  NSelect,
  NTabPane,
  NTabs,
  NUpload,
  UploadFileInfo,
  useLoadingBar,
  useMessage
} from "naive-ui";
import {
  RadioStation, BrandStatus,
} from "../../../types/kneoBroadcasterTypes";
import {useRadioStationStore} from "../../../stores/kneo/radioStationStore";

export default defineComponent({
  name: "RadioStationForm",
  components: {
    NPageHeader,
    NButtonGroup,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NUpload,
    NTabs,
    NTabPane,
    NGrid,
    NGi,
    NSelect,
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useRadioStationStore();
    const route = useRoute();
    const activeTab = ref("properties");
    const fileList = ref([] as UploadFileInfo[]);
    const localFormData = reactive<RadioStation>({
      slugName: "",
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      status: BrandStatus.OFF_LINE,
      url: "",
      country: ""
    });

    const handleSave = async () => {
      try {
        loadingBar.start();
        const saveDTO: RadioStation = {
          id: localFormData.id,
          author: localFormData.author,
          regDate: localFormData.regDate,
          lastModifier: localFormData.lastModifier,
          lastModifiedDate: localFormData.lastModifiedDate,
          status: localFormData.status,
          country: localFormData.country,
          slugName: localFormData.slugName,
          url: localFormData.url
        };

        await store.save(saveDTO, localFormData.id);
        message.success("Radio Station saved successfully");
        await router.push("/outline/radiostations");
      } catch (error) {
        message.error("Failed to save Radio Station");
      } finally {
        loadingBar.finish();
      }
    };

    const handleArchive = () => {
      message.info("Archive functionality not implemented yet");
    };

    const goBack = () => {
      router.push("/outline/radiostations");
    };

    onMounted(async () => {
      const id = route.params.id as string;
      if (id) {
        loadingBar.start();
        try {
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);
        } catch (error) {
          message.error('Failed to fetch sound fragment data');
        } finally {
          loadingBar.finish();
        }
      }
    });

    return {
      store,
      localFormData,
      handleSave,
      handleArchive,
      activeTab,
      goBack,
      fileList
    };
  },
});
</script>