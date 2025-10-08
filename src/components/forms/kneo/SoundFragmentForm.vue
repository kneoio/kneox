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
                <n-grid :cols="2" x-gap="12">
                  <n-gi>
                    <n-form-item label="Genres">
                      <n-select
                        v-model:value="localFormData.genres"
                        :options="referencesStore.genreOptions"
                        multiple
                        filterable
                        style="width: 50%; max-width: 600px;"
                      />
                    </n-form-item>
                    <n-form-item label="Labels">
                      <n-select
                        v-model:value="localFormData.labels"
                        :options="referencesStore.labelOptions"
                        multiple
                        filterable
                        style="width: 50%; max-width: 600px;"                           
                      />
                    </n-form-item>
                  </n-gi>                  
                </n-grid>
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
        <n-tab-pane name="description" tab="Description">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Description">
                  <n-input
                      v-model:value="localFormData.description"
                      type="textarea"
                      :rows="8"
                      style="width: 100%; max-width: 800px;"
                      placeholder=""
                  />
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
import { defineComponent, onMounted, reactive, ref, watch, computed, h } from "vue";
import { useRoute, useRouter } from "vue-router";
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
  NTag,
  NTabPane,
  NTabs,
  NUpload,
  useLoadingBar,
  useMessage,
  type UploadFileInfo,
  type UploadCustomRequestOptions
} from "naive-ui";
import AclTable from '../../common/AclTable.vue';
import { useSoundFragmentStore } from "../../../stores/kneo/soundFragmentStore";
import { useRadioStationStore } from "../../../stores/kneo/radioStationStore";
import { useReferencesStore } from "../../../stores/kneo/referencesStore";
import { FragmentType, SoundFragment, SoundFragmentSave } from "../../../types/kneoBroadcasterTypes";
import { isErrorWithResponse, capitalizeFirstLetter, getErrorMessage } from '../../helpers/errorHandling';
import { apiServer } from "../../../api/apiClient";
import { uploadProgress, connectSSEProgress } from "../../../utils/fileUpload";
import { handleFormSaveError } from "../../../utils/errorHandling";

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
    NTag,
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
    const originalUploadedFileNames = ref<string[]>([]);
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
      labels: [],
      album: "",
      description: "",
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
        'USER_UPLOAD': 'User Upload',
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

    const renderLabelTag = ({ option, handleClose }: any) => {
      const bg = option?.color || '#e5e7eb';
      const fg = option?.fontColor || '#111827';
      return h(
        NTag as any,
        {
          closable: true,
          onClose: handleClose,
          style: {
            backgroundColor: bg,
            color: fg,
            border: 'none'
          }
        },
        { default: () => option?.label || '' }
      );
    };

    const renderLabel = (option: any) => {
      return h('span', null, option?.label as string);
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
            globalProgressState,
            sessionData.estimatedDurationSeconds,
            (progress) => {
              if (fileList.value[0]) {
                fileList.value = [{
                  ...fileList.value[0],
                  percentage: progress,
                  status: 'uploading'
                }];
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
        logWithTimestamp(`Upload error: ${getErrorMessage(error)}`);
        message.error(getErrorMessage(error));
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

    const handleRemove = ({ file, fileList, index }: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; index: number }) => {
      uploadedFileNames.value = uploadedFileNames.value.filter(name => name !== file.name);
      originalUploadedFileNames.value = originalUploadedFileNames.value.filter(name => name !== file.name);

      if (globalProgressState.isSimulationActive || globalProgressState.hasSSEStarted) {
        resetProgressState();
      }

      logWithTimestamp(`Removed file: ${file.name} (index: ${index}, list size: ${fileList?.length ?? 0})`);
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
          labels: localFormData.labels || [],
          album: localFormData.album,
          description: localFormData.description,
          representedInBrands: localFormData.representedInBrands,
          newlyUploaded: filesToSend // Use original filenames
        };

        await store.save(saveDTO, localFormData.id);
        message.success("Saved successfully");
        if (route.query.returnTo === 'StationPlaylist' && route.params.brandName) {
          await router.push({ name: 'StationPlaylist', params: { brandName: route.params.brandName } });
        } else if (route.params.brandName) {
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
        if (route.query.returnTo === 'StationPlaylist' && route.params.brandName) {
          await router.push({ name: 'StationPlaylist', params: { brandName: route.params.brandName } });
        } else if (route.params.brandName) {
          await router.push({name: 'StationSoundFragments', params: {brandName: route.params.brandName}});
        } else {
          await router.push("/outline/soundfragments");
        }
      } catch (error: unknown) {
        handleFormSaveError(error, message);
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
        message.error(getErrorMessage(error));
        aclData.value = [];
      } finally {
        aclLoading.value = false;
      }
    };

    const connectSSE = (uploadId: string, originalFileName: string) => {
      const url = `${apiServer}/soundfragments/upload-progress/${uploadId}/stream`;
      const es = connectSSEProgress(
          globalProgressState,
          url,
          {
            onDisplayProgress: (progress) => {
              if (fileList.value[0]) {
                const current = fileList.value[0];
                fileList.value = [{ ...current, percentage: progress, status: 'uploading' }];
              }
            },
            onFinished: ({ fileName, fileId, metadata }) => {
              const correctFileName = fileName || originalFileName;

              if (correctFileName && !originalUploadedFileNames.value.includes(correctFileName)) {
                originalUploadedFileNames.value.push(correctFileName);
              }
              if (correctFileName && !uploadedFileNames.value.includes(correctFileName)) {
                uploadedFileNames.value.push(correctFileName);
              }

              if (fileList.value[0]) {
                fileList.value[0] = {
                  ...fileList.value[0],
                  name: correctFileName,
                  percentage: 100,
                  status: 'finished',
                  id: fileId || fileList.value[0].id
                };
              }
              globalProgressState.currentProgress = 100;
              resetProgressState();

              if (metadata) {
                applyMetadata(metadata);
              }
              message.success(`File "${correctFileName}" uploaded successfully`);
            },
            onError: () => {
              const currentFile = fileList.value[0];
              if (globalProgressState.isSimulationActive && currentFile) {
                setTimeout(() => {
                  if (fileList.value[0] && ((fileList.value[0].percentage ?? 0) < 100)) {
                    fileList.value[0] = { ...fileList.value[0], percentage: 100, status: 'finished' };
                    globalProgressState.currentProgress = 100;
                    resetProgressState();
                  }
                }, 2000);
              }
            },
            onRawData: (data) => {
              const serverProgress = data?.percentage || 0;
              backendProgress.value = serverProgress;
            }
          }
      );
      globalProgressState.eventSource = es;
      return es;
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
          referencesStore.fetchGenres(),
          referencesStore.fetchLabels()
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
          handleFormSaveError(error, message);
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
        if (localFormData.description === 'Please Input') localFormData.description = '';
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
      renderLabelTag,
      renderLabel,
      originalUploadedFileNames // Add this to the return
    };
  },
});
</script>