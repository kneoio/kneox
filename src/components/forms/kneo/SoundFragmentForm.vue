<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header subtitle="Sound Fragment" @back="goBack">
        <template #title>{{ store.getCurrent.title || store.getCurrent.slugName }}</template>
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
                  <n-input v-model:value="localFormData.title" style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Artist">
                  <n-input v-model:value="localFormData.artist" style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Genre">
                  <n-select
                      v-model:value="localFormData.genre"
                      :options="store.genreOptions"
                      filterable
                      placeholder="Select Genre"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Album">
                  <n-input v-model:value="localFormData.album" style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Upload File">
                  <n-upload
                      v-model:file-list="fileList"
                      :multiple="false"
                      :max="1"
                      :show-download-button="true"
                      @change="handleChange"
                      @finish="handleFinish"
                      @download="handleDownload"
                      style="width: 50%; max-width: 600px;"
                      :accept="audioAcceptTypes"
                      :custom-request="handleUpload"
                      :show-remove-button="true"
                      :show-retry-button="false"
                      :show-cancel-button="false"
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
import { defineComponent, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
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
  useLoadingBar,
  useMessage,
  type UploadFileInfo
} from "naive-ui";
import { useSoundFragmentStore } from "../../../stores/kneo/soundFragmentsStore";
import { FragmentStatus, FragmentType, SoundFragment, SoundFragmentSave } from "../../../types/kneoBroadcasterTypes";

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
    NSelect,
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const route = useRoute();
    const store = useSoundFragmentStore();
    const activeTab = ref("properties");
    const fileList = ref<UploadFileInfo[]>([]);
    const localFormData = reactive<SoundFragment>({
      slugName: "",
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
      url: "",
      actionUrl: "",
      uploadedFiles: []
    });

    watch(
        () => store.getCurrent?.uploadedFiles,
        (files) => {
          fileList.value = files || [];
        },
        { immediate: true }
    );

    const handleUpload = async ({ file, onFinish, onError }: {
      file: UploadFileInfo,
      onFinish?: (file?: UploadFileInfo) => void,
      onError?: (e: Error) => void,
    }) => {
      try {
        const response = await store.uploadFile(file.file as File);
        const newFile = {
          ...file,
          ...response,
          status: 'finished'
        };
        if (onFinish) onFinish(newFile);
        return newFile;
      } catch (error) {
        if (onError) onError(error as Error);
        throw error;
      }
    };

    const triggerDownload = async (file: UploadFileInfo) => {
      console.log('Manual download triggered for:', file.name);
      try {
        await handleDownload(file);
      } catch (error) {
        message.error(`Download failed: ${error.message}`);
      }
    };

    const handleDownload = async (file: UploadFileInfo) => {
      console.group('Download Debug');
      try {
        console.log('Starting download for:', file);

        if (!file.id) {
          console.warn('No file ID, trying URL fallback');
          if (file.url) {
            window.open(file.url, '_blank');
            return false;
          }
          throw new Error('No download source available');
        }

        console.log('Fetching file via API...');
        const response = await store.downloadFile(localFormData.id, file.id);
        console.log('API response received');

        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        console.log('Created blob URL:', blobUrl);

        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = file.name || 'audio_file';
        anchor.style.display = 'none';
        document.body.appendChild(anchor);

        console.log('Triggering download...');
        anchor.click();

        setTimeout(() => {
          document.body.removeChild(anchor);
          window.URL.revokeObjectURL(blobUrl);
          console.log('Cleanup complete');
        }, 100);

        return true;
      } catch (error) {
        console.error('Download error:', error);
        message.error('Download failed');
        return false;
      } finally {
        console.groupEnd();
      }
    };

    const handleChange = (data: {
      file: UploadFileInfo;
      fileList: UploadFileInfo[];
    }) => {
      fileList.value = data.fileList;
    };

    const handleFinish = ({ file }: {
      file: UploadFileInfo;
    }) => {
      return file;
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
          filesToUpload: fileList.value.map(f => f.id),
        };
        await store.save(saveDTO, localFormData.id);
        message.success("Saved successfully");
        await router.push("/outline/soundfragments");
      } catch (error) {
        message.error("Save failed: " + error);
      } finally {
        loadingBar.finish();
      }
    };

    const handleArchive = () => {
      message.info("Archive functionality not implemented yet");
    };

    const goBack = () => {
      router.push("/outline/soundfragments");
    };

    onMounted(async () => {
      const id = route.params.id as string;
      if (id) {
        loadingBar.start();
        try {
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);
          fileList.value = store.getCurrent.uploadedFiles.map(f => ({
            id: f.id,
            name: f.name,
            type: f.type,
            thumbnailUrl: f.thumbnailUrl,
            status: 'finished',
            percentage: f.percentage,
          }))
        } catch (error) {
          message.error('Failed to load data');
        } finally {
          loadingBar.finish();
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
      handleChange,
      handleFinish,
      handleUpload,
      handleDownload,
      triggerDownload,
      fileList,
      audioAcceptTypes
    };
  },
});
</script>