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
                <n-form-item label="Represented In">
                  <n-select
                      v-model:value="localFormData.representedInBrands"
                      :options="radioStationOptions"
                      filterable
                      multiple
                      placeholder="Select Radio Stations"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Upload File">
                  <n-upload
                      v-model:file-list="fileList"
                      :multiple="false"
                      :max="1"
                      :show-download-button="true"
                      :disabled="false"
                      @change="handleChange"
                      @finish="handleFinish"
                      @download="handleDownload"
                      @preview="handleDownload"
                      style="width: 50%; max-width: 600px;"
                      :accept="audioAcceptTypes"
                      :custom-request="handleUpload"
                      :show-remove-button="true"
                  >
                    <n-button>Select File</n-button>
                    <template #file="{ file }">
                      <div class="upload-file" @click.stop.prevent="handleDownload(file, $event)">
                        {{ file.name }}
                        <n-progress
                            v-if="file.status === 'uploading'"
                            :percentage="file.percentage || 0"
                            :show-indicator="true"
                            style="margin-top: 8px;"
                        />
                      </div>
                    </template>
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
import {defineComponent, onMounted, reactive, ref, watch, computed} from "vue";
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
  NProgress,
  NSelect,
  NTabPane,
  NTabs,
  NUpload,
  useLoadingBar,
  useMessage,
  type UploadFileInfo
} from "naive-ui";
import {useSoundFragmentStore} from "../../../stores/kneo/soundFragmentStore";
import {useRadioStationStore} from "../../../stores/kneo/radioStationStore";
import {FragmentType, SoundFragment, SoundFragmentSave} from "../../../types/kneoBroadcasterTypes";
import {
  isErrorWithResponse,
  capitalizeFirstLetter,
  getErrorMessage
} from '../../helpers/errorHandling';

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
    NProgress,
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const route = useRoute();
    const store = useSoundFragmentStore();
    const radioStationStore = useRadioStationStore();
    const activeTab = ref("properties");
    const fileList = ref<UploadFileInfo[]>([]);
    const uploadedFileNames = ref<string[]>([]);
    const tempFileIds = ref<string[]>([]);

    const localFormData = reactive<SoundFragment>({
      slugName: "",
      id: null,
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      type: FragmentType.SONG,
      title: "",
      artist: "",
      genre: "",
      album: "",
      url: "",
      actionUrl: "",
      defaultBrandId: "",
      representedInBrands: [],
      uploadedFiles: []
    });

    const radioStationOptions = computed(() => {
      return radioStationStore.getEntries.map(station => ({
        label: station.slugName,
        value: station.id
      }));
    });

    watch(
        () => store.getCurrent?.uploadedFiles,
        (files) => {
          fileList.value = files || [];
        },
        {immediate: true}
    );

    const handleUpload = async ({file, onFinish, onError, onProgress}: {
      file: UploadFileInfo,
      onFinish?: (file?: UploadFileInfo) => void,
      onError?: (e: Error) => void,
      onProgress?: (e: { percent: number }) => void,
    }) => {
      try {
        const isNewFragment = !localFormData.id || localFormData.id === 'new';
        
        file.status = 'uploading';
        file.percentage = 0;

        let response;
        if (isNewFragment) {
          // Use temporary upload for new fragments
          response = await store.uploadTempFile(file.file as File, (percentage: number) => {
            if (onProgress) {
              onProgress({ percent: percentage });
            }
            file.percentage = percentage;
          });
          
          // Store temp file ID for later use when saving
          tempFileIds.value.push(response.tempFileId);
        } else {
          // Use existing upload method for existing fragments
          response = await store.uploadFile(localFormData.id!, file.file as File, (percentage: number) => {
            if (onProgress) {
              onProgress({ percent: percentage });
            }
            file.percentage = percentage;
          });
        }

        uploadedFileNames.value.push(file.name);

        const newFile = {
          ...file,
          id: response.tempFileId || response.id || file.name,
          url: response.fileUrl || response.url,
          status: 'finished' as const,
          percentage: 100
        };

        if (onFinish) onFinish(newFile);
        message.success(`File "${file.name}" uploaded successfully`);
        return newFile;
      } catch (error) {
        file.status = 'error';
        message.error(`Upload failed: ${getErrorMessage(error)}`);
        if (onError) onError(error as Error);
        throw error;
      }
    };

    const handleDownload = async (file: UploadFileInfo) => {
      try {
        const entityId = localFormData.id || "temp";
        const fileKey = file.id || file.name || 'download';
        const fileName = file.name; // Pass the original filename

        loadingBar.start();

        await store.downloadFileWithProgress(
            entityId,
            fileKey,
            fileName,
            (percentage: number) => {
              // loadingBar progress indication ??
            }
        );

        loadingBar.finish();
        message.success('Download completed');
      } catch (error) {
        console.error('Download failed:', error);
        message.error(`Download failed: ${getErrorMessage(error)}`);
        loadingBar.error();
      }
      return false;
    };

    const handleChange = (data: {
      file: UploadFileInfo;
      fileList: UploadFileInfo[];
    }) => {
      fileList.value = data.fileList;
    };

    const handleFinish = ({file}: {
      file: UploadFileInfo;
    }) => {
      return file;
    };

    const handleSave = async () => {
      try {
        loadingBar.start();
        const saveDTO: SoundFragmentSave = {
          type: localFormData.type,
          title: localFormData.title,
          artist: localFormData.artist,
          genre: localFormData.genre,
          album: localFormData.album,
          representedInBrands: localFormData.representedInBrands,
          newlyUploaded: uploadedFileNames.value,
          tempFileIds: tempFileIds.value, // Include temp file IDs for new fragments
        };

        await store.save(saveDTO, localFormData.id);
        message.success("Saved successfully");
        await router.push("/outline/soundfragments");
      } catch (error: unknown) {
        if (isErrorWithResponse(error) && error.response?.status === 400) {
          const errorData = error.response.data as ErrorResponse;

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
        loadingBar.finish();
      }
    };

    const handleArchive = () => {
      message.info("Archive functionality not implemented yet");
    };

    const goBack = () => {
      router.back();
    };

    onMounted(async () => {
      const id = route.params.id as string;
      loadingBar.start();
      try {
        await radioStationStore.fetchAll();
        if (id && id !== 'new') {
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);
          uploadedFileNames.value = [];
          tempFileIds.value = [];
        } else {
          // Reset for new fragments
          uploadedFileNames.value = [];
          tempFileIds.value = [];
        }
      } catch (error) {
        message.error('Failed to load data');
      } finally {
        loadingBar.finish();
      }
    });

    //TODO To store
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
      fileList,
      audioAcceptTypes,
      radioStationOptions
    };
  },
});
</script>