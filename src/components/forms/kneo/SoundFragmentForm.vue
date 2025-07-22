<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.title || 'New Sound Fragment' }}</template>
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
        <n-tab-pane name="properties" tab="Main properties">
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
                  <n-select v-model:value="localFormData.genre" :options="referencesStore.genreOptions" filterable
                            placeholder="Select Genre" style="width: 25%; max-width: 300px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Album">
                  <n-input v-model:value="localFormData.album" style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Represented In">
                  <n-select v-model:value="localFormData.representedInBrands" :options="radioStationOptions" filterable
                            multiple placeholder="Select Radio Stations" style="width: 50%; max-width: 600px;"/>
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
                      @remove="handleRemove"
                      style="width: 50%; max-width: 600px;"
                      :accept="audioAcceptTypes"
                      :custom-request="handleUpload"
                      :show-remove-button="true"
                      :default-upload="true">
                    <n-button>Select File</n-button>
                  </n-upload>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="acl" tab="ACL">
          <acl-table :acl-data="aclData" :loading="aclLoading"/>
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
  NDataTable,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NIcon,
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
import AclTable from '../../common/AclTable.vue';
import {useSoundFragmentStore} from "../../../stores/kneo/soundFragmentStore";
import {useRadioStationStore} from "../../../stores/kneo/radioStationStore";
import {useReferencesStore} from "../../../stores/kneo/referencesStore";
import {FragmentType, SoundFragment, SoundFragmentSave} from "../../../types/kneoBroadcasterTypes";
import {
  isErrorWithResponse,
  capitalizeFirstLetter,
  getErrorMessage
} from '../../helpers/errorHandling';
import {apiServer} from "../../../api/apiClient";

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
    NDataTable,
    NIcon,
    AclTable,
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const route = useRoute();
    const store = useSoundFragmentStore();
    const radioStationStore = useRadioStationStore();
    const referencesStore = useReferencesStore();
    const activeTab = ref("properties");
    const fileList = ref<UploadFileInfo[]>([]);
    const uploadedFileNames = ref<string[]>([]);
    const backendProgress = ref(0);

    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);

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

    const formTitle = computed(() => localFormData.id ? 'Edit Sound Fragment' : 'Create New Sound Fragment');

    watch(
        () => store.getCurrent?.uploadedFiles,
        (files) => {
          fileList.value = files || [];
        },
        {immediate: true}
    );

    const getTimestamp = () => {
      const now = new Date();
      return now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');
    };

    const logWithTimestamp = (message: string) => {
      console.log(`[${getTimestamp()}] ${message}`);
    };

    let globalProgressState = {
      isSimulationActive: false,
      hasSSEStarted: false,
      currentProgress: 0,
      stopSimulation: null as (() => void) | null,
      eventSource: null as EventSource | null
    };

    const uploadProgress = (
        estimatedDurationSeconds: number,
        onProgressUpdate: (progress: number) => void,
        onComplete: () => void
    ): (() => void) => {
      let simulationActive = true;
      let simulationProgress = 0;
      const targetProgress = 70;
      const updateIntervalMs = 200;
      const totalUpdates = (estimatedDurationSeconds * 1000) / updateIntervalMs;
      const progressIncrement = targetProgress / totalUpdates;

      globalProgressState.isSimulationActive = true;

      const updateProgress = () => {
        if (!simulationActive || globalProgressState.hasSSEStarted) {
          simulationActive = false;
          globalProgressState.isSimulationActive = false;
          onComplete();
          return;
        }

        simulationProgress = Math.min(simulationProgress + progressIncrement, targetProgress);
        globalProgressState.currentProgress = simulationProgress;

        if (fileList.value[0]) {
          fileList.value = [{
            ...fileList.value[0],
            percentage: simulationProgress,
            status: 'uploading'
          }];
        }

        onProgressUpdate(simulationProgress);

        if (simulationProgress < targetProgress) {
          setTimeout(updateProgress, updateIntervalMs);
        } else {
          //logWithTimestamp('Simulation reached 70%, waiting for SSE...');
          const waitForSSE = () => {
            if (!simulationActive || globalProgressState.hasSSEStarted) {
              simulationActive = false;
              globalProgressState.isSimulationActive = false;
              onComplete();
              return;
            }
            setTimeout(waitForSSE, 500);
          };
          setTimeout(waitForSSE, 500);
        }
      };

      setTimeout(updateProgress, 100);

      return () => {
        simulationActive = false;
        globalProgressState.isSimulationActive = false;
      };
    };

    const connectSSE = (uploadId: string) => {
      const eventSource = new EventSource(`${apiServer}/api/soundfragments/upload-progress/${uploadId}/stream`);
      globalProgressState.eventSource = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          logWithTimestamp(`SSE Progress: ${JSON.stringify(data)}`);

          if (!globalProgressState.hasSSEStarted) {
            globalProgressState.hasSSEStarted = true;

            if (globalProgressState.currentProgress < 70) {
              globalProgressState.currentProgress = 70;
              if (fileList.value[0]) {
                fileList.value[0] = {
                  ...fileList.value[0],
                  percentage: 70
                };
              }
              logWithTimestamp('Jumped to 70% as SSE started early');
            }
          }

          const serverProgress = data.percentage || 0;
          backendProgress.value = serverProgress;
          const displayProgress = 70 + (serverProgress * 0.3);
          globalProgressState.currentProgress = displayProgress;

          if (fileList.value[0] && serverProgress > 0) {
            const currentFile = fileList.value[0];
            const updatedFile = {
              ...currentFile,
              percentage: displayProgress,
              status: 'uploading'
            };

            fileList.value = [updatedFile];

            if (data.status === 'finished') {
              fileList.value[0] = {
                ...fileList.value[0],
                percentage: 100
              };
              globalProgressState.currentProgress = 100;
              eventSource.close();
              resetProgressState();
              if (data.metadata) {
                const metadata = data.metadata;
                console.log('Applying metadata:', metadata);
                applyMetadata(metadata);
              }
              message.success(`File "${currentFile.name}" uploaded successfully`);
            } else if (data.status === 'error') {
              fileList.value = [{
                ...fileList.value[0],
                status: 'error',
                percentage: undefined
              }];
              eventSource.close();
              resetProgressState();
              message.error('File processing failed');
            }
          }
        } catch (e) {
          logWithTimestamp(`SSE parse error: ${e}`);
        }
      };

      eventSource.onerror = (error) => {
        logWithTimestamp(`SSE connection error for ${uploadId}: ${error}`);
        eventSource.close();

        const currentFile = fileList.value[0];
        if (globalProgressState.isSimulationActive && currentFile) {
          setTimeout(() => {
            if (currentFile && (currentFile.percentage ?? 0) < 100) {
              fileList.value[0] = {
                ...currentFile,
                percentage: 100,
                status: 'finished'
              };
              globalProgressState.currentProgress = 100;
              resetProgressState();
            }
          }, 2000);
        }
      };

      return eventSource;
    };

    const resetProgressState = () => {
      if (globalProgressState.stopSimulation) {
        globalProgressState.stopSimulation();
      }
      if (globalProgressState.eventSource) {
        globalProgressState.eventSource.close();
      }
      globalProgressState = {
        isSimulationActive: false,
        hasSSEStarted: false,
        currentProgress: 0,
        stopSimulation: null,
        eventSource: null
      };
    };

    const applyMetadata = (metadata: any) => {
      if (!metadata) return;

      logWithTimestamp(`Applying metadata: ${JSON.stringify(metadata)}`);

      if (metadata.title && !localFormData.title) {
        localFormData.title = metadata.title;
      }
      if (metadata.artist && !localFormData.artist) {
        localFormData.artist = metadata.artist;
      }
      if (metadata.album && !localFormData.album) {
        localFormData.album = metadata.album;
      }
      if (metadata.genre && !localFormData.genre) {
        const genreExists = referencesStore.genreOptions.some(
            option => option.value === metadata.genre || option.label === metadata.genre
        );
        if (genreExists) {
          localFormData.genre = metadata.genre;
        }
      }
    };

    const handleUpload = async ({file, onFinish, onError}) => {
      try {
        resetProgressState();

        const entityId = localFormData.id || "temp";
        const uploadId = crypto.randomUUID();
        const startTime = Date.now();
        logWithTimestamp(`Start upload session, uploadId: ${uploadId}`);
        const sessionData = await store.startUploadSession(entityId, uploadId, startTime);
        globalProgressState.stopSimulation = uploadProgress(
            sessionData.estimatedDurationSeconds,
            (progress) => {
              if (fileList.value[0]) {
                fileList.value[0].percentage = progress;
               // logWithTimestamp(`SIMULATION: showing ${Math.round(progress)}% to user`);
              }
            },
            () => {
             // logWithTimestamp('Simulation phase completed');
            }
        );
        logWithTimestamp(`Starting upload: ${file.name}, Estimated: ${sessionData.estimatedDurationSeconds}`);
        store.uploadFile(entityId, file.file, uploadId);
        connectSSE(uploadId);

      } catch (error: any) {
        resetProgressState();
        logWithTimestamp(`Upload error: ${error.message}`);
        message.error(error.message || 'Upload failed');
        if (onError) onError(error as Error);
        throw error;
      }
    };

    const handleDownload = async (file: UploadFileInfo) => {
      try {
        loadingBar.start();
        await store.downloadFile(file.url || "", file.name);
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

      const currentFileNames = data.fileList.map(f => f.name);
      uploadedFileNames.value = uploadedFileNames.value.filter(name =>
          currentFileNames.includes(name)
      );
    };

    const handleRemove = (file: UploadFileInfo) => {
      uploadedFileNames.value = uploadedFileNames.value.filter(name => name !== file.name);
      if (globalProgressState.isSimulationActive || globalProgressState.hasSSEStarted) {
        resetProgressState();
      }

      logWithTimestamp(`Removed file: ${file.name}`);
      return true;
    };

    const handleFinish = ({file}: {
      file: UploadFileInfo;
    }) => {
      return file;
    };

    const handleSave = async () => {
      const isUploading = fileList.value.some(file =>
          file.status === 'uploading' || globalProgressState.isSimulationActive || globalProgressState.hasSSEStarted
      );

      if (isUploading) {
        message.warning("Please wait for the file upload to complete before saving.");
        return;
      }

      try {
        loadingBar.start();
        const saveDTO: SoundFragmentSave = {
          type: localFormData.type,
          title: localFormData.title,
          artist: localFormData.artist,
          genre: localFormData.genre,
          album: localFormData.album,
          representedInBrands: localFormData.representedInBrands,
          newlyUploaded: uploadedFileNames.value
        };

        await store.save(saveDTO, localFormData.id);
        message.success("Saved successfully");
        if (route.params.brandName) {
          await router.push({name: 'StationSoundFragments', params: {brandName: route.params.brandName}});
        } else {
          await router.push("/outline/soundfragments");
        }
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
      if (id && id !== 'new') {
        try {
          loadingBar.start();
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);

          if (localFormData.uploadedFiles?.length) {
            fileList.value = localFormData.uploadedFiles.map(f => ({
              id: f.name,
              name: f.name,
              status: 'finished' as const,
              url: f.url
            }));
            uploadedFileNames.value = localFormData.uploadedFiles.map(f => f.name);
          }
        } catch (error) {
          console.error("Failed to fetch sound fragment:", error);
          message.error('Failed to fetch sound fragment');
        } finally {
          loadingBar.finish();
        }
      } else {
        await store.fetch(id);
        Object.assign(localFormData, store.getCurrent);
      }

      try {
        await radioStationStore.fetchAll(1, 100);
        await referencesStore.fetchGenres();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    });

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
      handleRemove,
      fileList,
      audioAcceptTypes: referencesStore.audioAcceptTypes,
      radioStationOptions,
      formTitle,
      referencesStore,
      aclData,
      aclLoading,
      backendProgress
    };
  },
});
</script>