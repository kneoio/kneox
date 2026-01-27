<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>
          {{ localFormData.title || 'New Sound Fragment' }}
          <n-tag v-if="localFormData.expiresAt" type="error" style="margin-left: 8px;">
            Expires at: {{ formatExpiresAt(localFormData.expiresAt) }}
          </n-tag>
        </template>
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
                  <n-text v-if="localFormData.length" style="margin-left: 12px;">{{ formatDuration(localFormData.length) }}</n-text>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Genres">
                  <n-tree-select
                    v-model:value="localFormData.genres"
                    :options="referencesStore.genreOptions"
                    multiple
                    checkable
                    filterable
                    default-expand-all
                    style="width: 50%; max-width: 600px;"
                    placeholder=""
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Labels">
                  <n-select
                    v-model:value="localFormData.labels"
                    :options="soundFragmentLabelOptions"
                    :render-tag="renderLabelTag"
                    :render-label="renderLabel"
                    multiple
                    filterable
                    style="width: 50%; max-width: 600px;"
                    placeholder=""
                  />
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
  NText,
  NTreeSelect,
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
    NText,
    NTreeSelect,
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
    const aclData = ref<any[]>([]);
    const aclLoading = ref(false);
    const soundFragmentLabelOptions = ref<Array<{ label: string; value: string; color?: string; fontColor?: string }>>([]);

    const localFormData = reactive<SoundFragment>({
      id: null,
      slugName: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      type: FragmentType.SONG,
      source: "",
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
      uploadedFiles: [],
      expiresAt: null
    });

    const radioStationOptions = computed(() => {
      return radioStationStore.getEntries.map(station => ({
        label: station.slugName,
        value: station.id
      }));
    });

    const typeOptions = [
      { label: 'Song', value: 'SONG' },
      { label: 'Advertisement', value: 'ADVERTISEMENT' },
      { label: 'Jingle', value: 'JINGLE' },
      { label: 'News', value: 'NEWS' },
      { label: 'Weather', value: 'WEATHER' }
    ];

    const sourceDisplayValue = computed(() => store.formatSource(localFormData.source));

    const formTitle = computed(() => localFormData.id ? 'Edit Sound Fragment' : 'Create New Sound Fragment');

    const formatExpiresAt = (value: string) => value.replace('T', ' ');

    const formatDuration = (duration: string | number | undefined): string => {
      if (!duration) return '';
      if (typeof duration === 'number') {
        const m = Math.floor(duration / 60);
        const s = duration % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
      }
      const parts = duration.split(':');
      if (parts.length === 3) {
        const h = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const s = parseInt(parts[2]);
        if (h > 0) {
          return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${m}:${String(s).padStart(2, '0')}`;
      }
      return duration;
    };

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

    const renderLabelTag = ({ option, handleClose }: any) => {
      const bg = option?.color;
      const fg = option?.fontColor;
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
      if (metadata.length && !localFormData.length) {
        localFormData.length = metadata.length;
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

    const handleUpload = async ({ file, onProgress, onFinish, onError }: UploadCustomRequestOptions) => {
      try {
        const entityId = localFormData.id || "temp";
        const uploadId = crypto.randomUUID();
        const originalFileName = file.name;
        //logWithTimestamp(`Start upload session, uploadId: ${uploadId}, originalFileName: ${originalFileName}`);
        if (!file.file) {
          throw new Error('No file content to upload');
        }
        if (fileList.value[0]) {
          fileList.value[0] = { ...fileList.value[0], status: 'uploading', percentage: 0 } as any;
        }
        const res = await store.uploadFile(entityId, file.file, uploadId, (p) => {
          try {
            onProgress && onProgress(p as any);
            if (fileList.value[0]) {
              fileList.value[0] = { ...fileList.value[0], status: 'uploading', percentage: p.percent } as any;
            }
          } catch (_) { /* noop */ }
        });
        onProgress && onProgress({ percent: 100 } as any);
        if (fileList.value[0]) {
          fileList.value[0] = {
            ...fileList.value[0],
            name: originalFileName,
            percentage: 100,
            status: 'finished'
          } as any;
        }

        if (originalFileName && !originalUploadedFileNames.value.includes(originalFileName)) {
          originalUploadedFileNames.value.push(originalFileName);
        }
        if (originalFileName && !uploadedFileNames.value.includes(originalFileName)) {
          uploadedFileNames.value.push(originalFileName);
        }

        const metadata = (res as any)?.metadata;
        if (metadata) {
          applyMetadata(metadata);
        }

        if (onFinish) onFinish();
        message.success(`File "${originalFileName}" uploaded successfully`);

      } catch (error: any) {
        logWithTimestamp(`Upload error: ${getErrorMessage(error)}`);
        message.error(getErrorMessage(error));
        if (onError) onError();
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

    const handleRemove = ({ file }: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; index: number }) => {
      uploadedFileNames.value = uploadedFileNames.value.filter(name => name !== file.name);
      originalUploadedFileNames.value = originalUploadedFileNames.value.filter(name => name !== file.name);
      return true;
    };

    const handleFinish = ({file}: {
      file: UploadFileInfo;
    }) => {
      return file;
    };

    const handleSave = async () => {
      const isUploading = fileList.value.some(file => file.status === 'uploading');

      if (isUploading) {
        message.warning("Please wait for the file upload to complete before saving.");
        return;
      }

      try {
        loadingBar.start();
        const filesToSend = uploadedFileNames.value;

        const lengthValue = typeof localFormData.length === 'number' 
          ? formatDuration(localFormData.length) 
          : localFormData.length;

        const saveDTO: SoundFragmentSave = {
          type: localFormData.type,
          title: localFormData.title,
          artist: localFormData.artist,
          genres: localFormData.genres || [],
          labels: localFormData.labels || [],
          album: localFormData.album,
          description: localFormData.description,
          representedInBrands: localFormData.representedInBrands,
          newlyUploaded: filesToSend.length > 0 ? filesToSend : null,
          length: lengthValue
        };

        await store.save(saveDTO, localFormData.id as string );
        message.success("Saved successfully");
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

    const goBack = async () => {
      if (route.query.returnTo === 'StationPlaylist' && route.params.brandName) {
        await router.push({ name: 'StationPlaylist', params: { brandName: route.params.brandName } });
      } else if (route.params.brandName) {
        await router.push({ name: 'StationSoundFragments', params: { brandName: route.params.brandName } });
      } else {
        await router.push('/outline/soundfragments');
      }
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

    watch(activeTab, (newTab) => {
      if (newTab === 'acl') {
        fetchAclData();
      }
    });

    onMounted(async () => {
      const id = route.params.id as string;
      try {
        await Promise.all([
          radioStationStore.fetchAll(1, 100),
          referencesStore.fetchGenres(),
          referencesStore.fetchLabelsByCategory('sound_fragment').then((opts) => {
            soundFragmentLabelOptions.value = opts;
          })
        ]);
      } catch (error) {
        console.error("Failed to preload references:", error);
      }

      if (id && id !== 'new') {
        try {
          loadingBar.start();
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);
          if (localFormData.uploadedFiles?.length) {
            fileList.value = localFormData.uploadedFiles.map(f => ({
              id: f.name,
              name: f.name,
              status: 'finished' as const
            }));
            uploadedFileNames.value = [];
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
      }
    });

    const renderGenreLabel = ({ option }: any) => {
      return h('span', {
        style: {
          paddingLeft: option.level > 0 ? `${option.level * 20}px` : '0',
          color: option.level > 0 ? '#666' : 'inherit'
        }
      }, option.label);
    };

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
      formatExpiresAt,
      referencesStore,
      soundFragmentLabelOptions,
      aclData,
      aclLoading,
      renderLabelTag,
      renderLabel,
      renderGenreLabel,
      originalUploadedFileNames,
      formatDuration
    };
  },
});
</script>