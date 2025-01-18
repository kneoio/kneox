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
                      :action="uploadUrl"
                      :default-file-list="fileList"
                      show-download-button
                      @change="handleChange"
                      @finish="handleFinish"
                      style="width: 50%; max-width: 600px;"
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
import {defineComponent, ref, reactive, onMounted, toRaw} from "vue";
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
    const route = useRoute();
    const activeTab = ref("properties");
    const fileList = ref([] as UploadFileInfo[]);
    const fileListLength = ref(0);
    const uploadRef = ref<UploadInst | null>(null)
    const uploadUrl = ref("http://localhost:38707/api/kneo/soundfragments/files");
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
      uploadedFile: [],
    });

    const updateFileList = (updatedFileList: UploadFileInfo[]) => {
      fileList.value = updatedFileList;
      fileListLength.value = updatedFileList.length;
    };

    const handleChange = (fileList: UploadFileInfo[]) => {
      localFormData.uploadedFile = fileList;
      fileListLength.value = fileList.length;
    };


    const handleSave = async () => {
      try {
        loadingBar.start();

        // Check and log the uploaded files
        console.log("Before saving, uploadedFile:", localFormData.uploadedFile);

        const uploadedFileNames = Array.isArray(toRaw(localFormData.uploadedFile))
            ? toRaw(localFormData.uploadedFile).map((file: UploadFileInfo) => file.name)
            : null;

        const saveDTO: SoundFragmentSave = {
          status: localFormData.status,
          type: localFormData.type,
          title: localFormData.title,
          artist: localFormData.artist,
          genre: localFormData.genre,
          album: localFormData.album,
          uploadedFile: uploadedFileNames,
        };

        console.log("SaveDTO:", saveDTO);
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

    const handleFinish = ({ file, event }: { file: UploadFileInfo, event?: ProgressEvent }) => {
      const xhr = event?.target as XMLHttpRequest;
      const responseText = xhr.responseText;
      console.log("Raw response:", responseText);
      if (responseText && responseText !== "undefined") {
        try {
          const resp = JSON.parse(responseText);
          console.log("Parsed response:", resp);
          if (resp && resp.fileName && resp.url) {
            file.name = resp.fileName;
            file.url = resp.url;
          }
        } catch (e) {
          console.error("Failed to parse response as JSON:", e);
        }
      }
      return file;
    };

    const handleArchive = () => {
      message.info("Archive functionality not implemented yet");
    };

    const goBack = () => {
      router.push("/soundfragments");
    };

    onMounted(async () => {
      const id = route.params.id as string;
      if (id) {
        loadingBar.start();
        try {
          await Promise.all([
            store.fetch(id),
          ]);
          Object.assign(localFormData, store.getCurrent);
          loadingBar.finish();
        } catch (error) {
          console.error('Failed to fetch: ', error);
          message.error('Failed to fetch');
          loadingBar.error();
        }
      }
    });

    const audioAcceptTypes = [
      '.mp3',
      '.wav',
      '.ogg',
      '.flac',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/x-wav',
      'audio/mp4',
    ].join(',');

    return {
      store,
      localFormData,
      handleSave,
      handleArchive,
      activeTab,
      goBack,
      uploadUrl,
      handleChange,
      updateFileList,
      handleFinish,
      fileList,
      fileListLength,
      uploadRef,
      audioAcceptTypes
    };
  },
});
</script>
