<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header subtitle="Sound Fragment" @back="goBack">
        <template #title>{{ store.getCurrent.title }}</template>
        <template #footer>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{ store.getCurrent.lastModifiedDate }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button
            type="primary"
            @click="handleSave"
            size="large"
        >
          Save
        </n-button>
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
                  <n-input
                      v-model:value="localFormData.title"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Artist">
                  <n-input
                      v-model:value="localFormData.artist"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Genre">
                  <n-input
                      v-model:value="localFormData.genre"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Upload File">
                  <n-upload
                      ref="upload"
                      :default-upload="false"
                      multiple
                      @change="handleChange"
                  >
                    <n-button>Select File</n-button>
                  </n-upload>
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
import { defineComponent, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NButtonGroup,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NPageHeader,
  NUpload,
  NTabs,
  NTabPane,
  useLoadingBar,
  useMessage,
  UploadFileInfo,
  UploadInst
} from "naive-ui";
import { useSoundFragmentStore } from "../../../stores/kneo/soundFragmentsStore";
import {
  SoundFragment,
  FragmentStatus,
  FragmentType,
  SoundFragmentSave
} from "../../../types/kneoBroadcasterTypes";

export default defineComponent({
  name: "SoundFragmentForm",
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
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useSoundFragmentStore();

    const activeTab = ref("properties");
    const fileList = ref([]);
    const fileListLength = ref(0);
    const uploadRef = ref<UploadInst | null>(null)
    const fileListLengthRef = ref(0)

    const localFormData = reactive<SoundFragment>({
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      status: FragmentStatus.UNDEFINED,
      type: FragmentType.SONG,
      title: "",
      artist: "",
      genre: "",
      album: "",
      uploadedFile: null
    });

    const handleChange = (data: { fileList: UploadFileInfo[] }) => {
      fileListLengthRef.value = data.fileList.length

    /*  // Optional: Convert files to base64 and add to the payload
      data.fileList.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          localFormData.fileUri = reader.result as string;
        };
        reader.readAsDataURL(file.file);
      });*/
    };

    const handleSave = async () => {
      try {
        loadingBar.start();
        const saveDTO: SoundFragmentSave = {
          status: localFormData.status,
          type: localFormData.type,
          title: localFormData.title,
          artist: localFormData.artist,
          genre: localFormData.genre,
          album: localFormData.album,
          uploadedFile: localFormData.uploadedFile,
        };
        await store.save(saveDTO, localFormData.id);
        message.success("Sound Fragment saved successfully");
        await router.push("/soundfragments");
      } catch (error) {
        console.error("Error saving Sound Fragment:", error);
        message.error("Failed to save Sound Fragment");
      } finally {
        loadingBar.finish();
      }
    };

    const handleArchive = () => {
      message.info("Archive functionality not implemented yet");
    };

    const goBack = () => {
      router.push("/soundfragments");
    };

    return {
      store,
      localFormData,
      handleSave,
      handleArchive,
      activeTab,
      goBack,
      handleChange,
      fileList,
      fileListLength,
      uploadRef,
    };
  },
});
</script>
