<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.title || 'New Sound Fragment' }}</template>
        <template #footer>
          Source: {{ sourceDisplayValue }}
          <br>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{ store.getCurrent.lastModifiedDate }}
          <br>
          Author: {{ store.getCurrent.author }}, Last Modifier: {{ store.getCurrent.lastModifier }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" :disabled="!localFormData.id" @click="handleArchive" size="large">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Title">
                  <n-input v-model:value="localFormData.title" style="width: 50%; max-width: 600px;" placeholder=""/>
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="Artist">
                  <n-input v-model:value="localFormData.artist" style="width: 50%; max-width: 600px;" placeholder=""/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Type">
                  <n-select v-model:value="localFormData.type" :options="typeOptions" 
                            style="width: 25%; max-width: 300px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Genres">
                  <n-select v-model:value="localFormData.genres" :options="referencesStore.genreOptions"
                            multiple filterable style="width: 25%; max-width: 300px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Album">
                  <n-input v-model:value="localFormData.album" style="width: 50%; max-width: 600px;" placeholder=""/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Assign To">
                  <n-select v-model:value="localFormData.representedInBrands" :options="radioStationOptions" filterable
                            multiple style="width: 50%; max-width: 600px;"/>
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
                      :show-remove-button="true">
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
  type UploadFileInfo,
  type UploadCustomRequestOptions
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
    const originalUploadedFileNames = ref<string[]>([]); // NEW: Store EXACT uploaded filenames
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
      genres: [],
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

    const typeOptions = [
      { label: 'Song', value: 'SONG' },
      { label: 'Advertisement', value: 'ADVERTISEMENT' }      
    ];

    const sourceDisplayValue = computed(() => {
      const sourceMap: Record<string, string> = {
        'USERS_UPLOAD': 'Users Upload',
        'RECOVERED_FROM_SPACES': 'Recovered from Spaces',
        'ORPHAN_RECOVERY': 'Orphan Recovery',
        'SUNO_PROMPT': 'Suno Prompt',
        'TEXT_FOR_TTS': 'Text for TTS'
      };
      return sourceMap[localFormData.source] || localFormData.source;
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

    const SIMULATION_TARGET_PROGRESS = 70;
    const SIMULATION_UPDATE_INTERVAL_MS = 200;
    const SIMULATION_DURATION_MULTIPLIER = 2.5;

    const uploadProgress = (
        estimatedDurationSeconds: number,
        onProgressUpdate: (progress: number) => void,
        onComplete: () => void
    ): (() => void) => {
      let simulationActive = true;
      let simulationProgress = 0;
      const targetProgress = SIMULATION_TARGET_PROGRESS;
      const updateIntervalMs = SIMULATION_UPDATE_INTERVAL_MS;
      const adjustedDuration = estimatedDurationSeconds * SIMULATION_DURATION_MULTIPLIER;
      const totalUpdates = (adjustedDuration * 1000) / updateIntervalMs;
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
      // Handle genre(s) from metadata with backward compatibility
      const normalizeToArray = (value: any): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean);
        return [value];
      };
      const metaGenres: string[] = normalizeToArray(metadata.genres || metadata.genre);
      if (metaGenres.length) {
        const validValues = new Set(
          referencesStore.genreOptions.map((o: any) => o.value)
        );
        const labelToValue = new Map(
          referencesStore.genreOptions.map((o: any) => [o.label, o.value])
        );
        const resolved = metaGenres
          .map(g => (validValues.has(g) ? g : (labelToValue.get(g) || null)))
          .filter((g): g is string => !!g);
        // Only apply if form doesn't have user-provided genres yet
        if (!localFormData.genres || localFormData.genres.length === 0) {
          localFormData.genres = Array.from(new Set(resolved));
        }
      }
    };

    const handleUpload = async ({file, onFinish, onError}: UploadCustomRequestOptions) => {
      try {
        resetProgressState();

        const entityId = localFormData.id || "temp";
        const uploadId = crypto.randomUUID();
        const startTime = Date.now();
        const originalFileName = file.name;
        logWithTimestamp(`Start upload session, uploadId: ${uploadId}, originalFileName: ${originalFileName}`);
        
        const sessionData = await store.startUploadSession(entityId, uploadId, startTime);
        globalProgressState.stopSimulation = uploadProgress(
            sessionData.estimatedDurationSeconds,
            (progress) => {
              if (fileList.value[0]) {
                fileList.value[0].percentage = progress;
              }
            },
            () => {
             // logWithTimestamp('Simulation phase completed');
            }
        );
        logWithTimestamp(`Starting upload: ${originalFileName}, Estimated: ${sessionData.estimatedDurationSeconds}`);
        if (!file.file) {
          throw new Error('No file content to upload');
        }
        await store.uploadFile(entityId, file.file, uploadId);
        connectSSE(uploadId, originalFileName); // Pass original filename to SSE

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
        const original = (localFormData.uploadedFiles || []).find((f: any) => f.name === file.name);
        const resolvedUrl = original?.url || file.url || "";
        await store.downloadFile(resolvedUrl, file.name);
        loadingBar.finish();
        message.success('Download completed');
      } catch (error) {
        console.error('Download failed:', error);
        message.error(`Download failed: ${getErrorMessage(error)}`);
        loadingBar.error();
      }
      // prevent default anchor behavior
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
      originalUploadedFileNames.value = originalUploadedFileNames.value.filter(name =>
          currentFileNames.includes(name)
      );
      
    };

    const handleRemove = (file: UploadFileInfo) => {
      uploadedFileNames.value = uploadedFileNames.value.filter(name => name !== file.name);
      originalUploadedFileNames.value = originalUploadedFileNames.value.filter(name => name !== file.name);
      
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
        const filesToSend = originalUploadedFileNames.value.length > 0 
          ? originalUploadedFileNames.value 
          : uploadedFileNames.value;
        
        
        const saveDTO: SoundFragmentSave = {
          type: localFormData.type,
          title: localFormData.title,
          artist: localFormData.artist,
          genres: localFormData.genres || [],
          album: localFormData.album,
          representedInBrands: localFormData.representedInBrands,
          newlyUploaded: filesToSend // Use original filenames
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

    const handleArchive = async () => {
      if (!localFormData.id) {
        message.warning("Cannot archive a new sound fragment. Please save it first.");
        return;
      }

      try {
        loadingBar.start();
        await store.archive(localFormData.id);
        message.success("Sound fragment archived successfully");
        if (route.params.brandName) {
          await router.push({name: 'StationSoundFragments', params: {brandName: route.params.brandName}});
        } else {
          await router.push("/outline/soundfragments");
        }
      } catch (error: unknown) {
        message.error(`Archive failed: ${getErrorMessage(error)}`);
      } finally {
        loadingBar.finish();
      }
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

    const connectSSE = (uploadId: string, originalFileName: string) => {
      const eventSource = new EventSource(`${apiServer}/soundfragments/upload-progress/${uploadId}/stream`);
      globalProgressState.eventSource = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

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
              // Use the filename from metadata if present; fallback to browser-provided
              const correctFileName = data.metadata?.fileName || originalFileName;
              

              if (correctFileName && !originalUploadedFileNames.value.includes(correctFileName)) {
                originalUploadedFileNames.value.push(correctFileName);
                
              }

              // Also update the legacy array for backward compatibility
              if (correctFileName && !uploadedFileNames.value.includes(correctFileName)) {
                uploadedFileNames.value.push(correctFileName);
              }

              fileList.value[0] = {
                ...fileList.value[0],
                name: correctFileName, // Ensure the display name matches the stored filename
                percentage: 100,
                status: 'finished',
                id: data.fileId || data.id || currentFile.id
              };
              globalProgressState.currentProgress = 100;
              eventSource.close();
              resetProgressState();

              if (data.metadata) {
                applyMetadata(data.metadata);
              }
              message.success(`File "${correctFileName}" uploaded successfully`);
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

    watch(activeTab, (newTab) => {
      if (newTab === 'acl') {
        fetchAclData();
      }
    });

    onMounted(async () => {
      const id = route.params.id as string;
      // Load option sources first so selects can resolve labels for values
      try {
        await Promise.all([
          radioStationStore.fetchAll(1, 100),
          referencesStore.fetchGenres()
        ]);
      } catch (error) {
        console.error("Failed to preload references:", error);
      }

      const mapLegacyGenreLabelsToValues = () => {
        if (!Array.isArray(localFormData.genres)) return;
        const opts = referencesStore.genreOptions || [];
        const valuesSet = new Set(opts.map((o: any) => o.value));
        const labelToValue = new Map(opts.map((o: any) => [o.label, o.value]));
        localFormData.genres = (localFormData.genres || []).map((g: string) =>
          valuesSet.has(g) ? g : (labelToValue.get(g) || g)
        );
      };

      if (id && id !== 'new') {
        try {
          loadingBar.start();
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);
          // Backward compatibility: convert single genre to genres[] if needed
          const anyCurrent: any = store.getCurrent as any;
          if (!localFormData.genres || !Array.isArray(localFormData.genres)) {
            const single = anyCurrent.genre;
            localFormData.genres = single ? [single] : [];
          }
          // Map legacy labels to UUID values now that options are loaded
          mapLegacyGenreLabelsToValues();

          if (localFormData.uploadedFiles?.length) {
            // Do not expose direct URLs in the upload list; rely on @preview/@download handlers
            fileList.value = localFormData.uploadedFiles.map(f => ({
              id: f.name,
              name: f.name,
              status: 'finished' as const
            }));
            // For existing files, populate both arrays with the same values
            uploadedFileNames.value = localFormData.uploadedFiles.map(f => f.name);
            originalUploadedFileNames.value = localFormData.uploadedFiles.map(f => f.name);
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
        // Ensure genres array exists for new form as well; handle legacy default
        const anyCurrent: any = store.getCurrent as any;
        if (!localFormData.genres || !Array.isArray(localFormData.genres)) {
          const single = anyCurrent.genre;
          localFormData.genres = single ? [single] : [];
        }
        // Map legacy labels to UUID values for new forms as well
        mapLegacyGenreLabelsToValues();
        
        // Clear default "Please Input" values for new forms
        if (localFormData.title === 'Please Input') localFormData.title = '';
        if (localFormData.artist === 'Please Input') localFormData.artist = '';
        if (localFormData.album === 'Please Input') localFormData.album = '';
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
      typeOptions,
      sourceDisplayValue,
      formTitle,
      referencesStore,
      aclData,
      aclLoading,
      backendProgress,
      originalUploadedFileNames // Add this to the return
    };
  },
});
</script>