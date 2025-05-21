<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header subtitle="Radio Station" @back="goBack">
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
                      :default-file-list="fileList"
                      :multiple="false"
                      :max="1"
                      show-download-button
                      @change="handleChange"
                      @finish="handleFinish"
                      style="width: 50%; max-width: 600px;"
                      :accept="audioAcceptTypes"
                      :custom-request="handleUpload"
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
import {SoundFragment, SoundFragmentSave} from "../../../types/kneoBroadcasterTypes";
import {useBrandStore} from "../../../stores/kneo/brandsStore";

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
    const store = useBrandStore();
    const route = useRoute();
    const activeTab = ref("properties");
    const fileList = ref([] as UploadFileInfo[]);
    const localFormData = reactive<SoundFragment>({
      slugName: "",
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      status: 0,
      type: "SONG",
      title: "",
      artist: "",
      genre: "",
      album: "",
      url: "",
      actionUrl: "",
      uploadedFile: null,
    });

    const handleUpload = async ({ file, onFinish, onError, onProgress }: {
      file: UploadFileInfo,
      onFinish?: (file?: UploadFileInfo) => void,
      onError?: (e: Error) => void,
      onProgress?: (e: { percent: number }) => void
    }) => {
      try {
        const uploadedFile = await store.uploadFile(file.file as File);
        const newFile = {
          ...file,
          url: uploadedFile.url,
          name: uploadedFile.fileName,
          status: 'finished'
        };
        if (onFinish) onFinish(newFile);
        return newFile;
      } catch (error) {
        if (onError) onError(error as Error);
        return file;
      }
    };

    const handleChange = (options: { file: UploadFileInfo, fileList: UploadFileInfo[] }) => {
      localFormData.uploadedFile = options.fileList;
    };

    const handleFinish = ({ file }: { file: UploadFileInfo }) => {
      return file;
    };

    const handleSave = async () => {
      try {
        loadingBar.start();
        const fileNames = localFormData.uploadedFile?.map((file) => file.name) || [];

        const saveDTO: SoundFragmentSave = {
          status: localFormData.status,
          type: localFormData.type,
          title: localFormData.title,
          artist: localFormData.artist,
          genre: localFormData.genre,
          album: localFormData.album,
          uploadedFile: fileNames,
        };

        await store.save(saveDTO, localFormData.id);
        message.success("Sound Fragment saved successfully");
        await router.push("/soundfragments");
      } catch (error) {
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

    onMounted(async () => {
      const id = route.params.id as string;
      if (id) {
        loadingBar.start();
        try {
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);
          if (store.getCurrent.url) {
            fileList.value = [{
              id: store.getCurrent.id || '',
              name: store.getCurrent.title || store.getCurrent.slugName || '',
              status: 'finished',
              url: store.getCurrent.url,
            }];
          }
        } catch (error) {
          message.error('Failed to fetch sound fragment data');
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
      fileList,
      audioAcceptTypes
    };
  },
});
</script>