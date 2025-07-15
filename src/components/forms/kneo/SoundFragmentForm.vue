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
                  <n-input v-model:value="localFormData.title" style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Artist">
                  <n-input v-model:value="localFormData.artist" style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Genre">
                  <n-select v-model:value="localFormData.genre" :options="referencesStore.genreOptions" filterable
                    placeholder="Select Genre" style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Album">
                  <n-input v-model:value="localFormData.album" style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Represented In">
                  <n-select v-model:value="localFormData.representedInBrands" :options="radioStationOptions" filterable
                    multiple placeholder="Select Radio Stations" style="width: 50%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Upload File">
                  <n-upload v-model:file-list="fileList" :multiple="false" :max="1" :show-download-button="true"
                    :disabled="false" @change="handleChange" @finish="handleFinish" @download="handleDownload"
                    @preview="handleDownload" style="width: 50%; max-width: 600px;" :accept="audioAcceptTypes"
                    :custom-request="handleUpload" :show-remove-button="true">
                    <n-button>Select File</n-button>
                    <template #file=" { file } ">
                      <div class="upload-file" @click.stop.prevent="handleDownload( file )">
                        {{ file.name }}
                        <n-progress v-if=" file.status === 'uploading' " :percentage="file.percentage || 0"
                          :show-indicator="true" style="margin-top: 8px;" />
                      </div>
                    </template>
                  </n-upload>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="acl" tab="ACL">
          <acl-table :acl-data="aclData" :loading="aclLoading" />
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref, watch, computed } from "vue";
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
  NProgress,
  NSelect,
  NTabPane,
  NTabs,
  NUpload,
  useLoadingBar,
  useMessage,
  type UploadFileInfo
} from "naive-ui";
import AclTable from '../../common/AclTable.vue';
import { useSoundFragmentStore } from "../../../stores/kneo/soundFragmentStore";
import { useRadioStationStore } from "../../../stores/kneo/radioStationStore";
import { useReferencesStore } from "../../../stores/kneo/referencesStore";
import { FragmentType, SoundFragment, SoundFragmentSave } from "../../../types/kneoBroadcasterTypes";
import {
  isErrorWithResponse,
  capitalizeFirstLetter,
  getErrorMessage
} from '../../helpers/errorHandling';

export default defineComponent( {
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
    const activeTab = ref( "properties" );
    const fileList = ref<UploadFileInfo[]>( [] );
    const uploadedFileNames = ref<string[]>( [] );
    const tempFileIds = ref<string[]>( [] );

    const aclData = ref<any[]>( [] );
    const aclLoading = ref( false );

    const localFormData = reactive<SoundFragment>( {
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
    } );

    const radioStationOptions = computed( () => {
      return radioStationStore.getEntries.map( station => ( {
        label: station.slugName,
        value: station.id
      } ) );
    } );

    const formTitle = computed( () => localFormData.id ? 'Edit Sound Fragment' : 'Create New Sound Fragment' );

    watch(
      () => store.getCurrent?.uploadedFiles,
      ( files ) => {
        fileList.value = files || [];
      },
      { immediate: true }
    );


    const handleUpload = async ( { file, onFinish, onError, onProgress }: {
      file: UploadFileInfo,
      onFinish?: ( file?: UploadFileInfo ) => void,
      onError?: ( e: Error ) => void,
      onProgress?: ( e: { percent: number } ) => void,
    } ) => {
      try {
        const entityId = localFormData.id || "temp";

        file.status = 'uploading';
        file.percentage = 0;

        // Start the upload (this returns immediately with uploadId)
        const uploadResponse = await store.uploadFile( entityId, file.file as File );
        const uploadId = uploadResponse.id;

        if ( uploadId ) {
          // Now poll for progress updates
          const pollProgress = async () => {
            try {
              const finalData = await store.pollUploadProgress( uploadId, ( percentage: number ) => {
                if ( onProgress ) {
                  onProgress( { percent: percentage } );
                }
                file.percentage = percentage;
              } );

              // Auto-populate form fields from metadata if available
              if ( finalData.metadata ) {
                const metadata = finalData.metadata;

                if ( metadata.title && !localFormData.title ) {
                  localFormData.title = metadata.title;
                }

                if ( metadata.artist && !localFormData.artist ) {
                  localFormData.artist = metadata.artist;
                }

                if ( metadata.album && !localFormData.album ) {
                  localFormData.album = metadata.album;
                }

                if ( metadata.genre && !localFormData.genre ) {
                  const genreExists = referencesStore.genreOptions.some(
                    option => option.value === metadata.genre || option.label === metadata.genre
                  );
                  if ( genreExists ) {
                    localFormData.genre = metadata.genre;
                  }
                }
              }

              uploadedFileNames.value.push( file.name );

              const newFile = {
                ...file,
                id: finalData.id || file.name,
                url: finalData.url || finalData.fileUrl,
                status: 'finished' as const,
                percentage: 100
              };

              if ( onFinish ) onFinish( newFile );
              message.success( `File "${file.name}" uploaded successfully` );

            } catch ( pollError: any ) {
              console.error( 'Progress polling failed:', pollError );
              file.status = 'error';
              file.percentage = 0;
              message.error( `Upload processing failed: ${pollError.message}` );
              if ( onError ) onError( pollError as Error );
            }
          };

          // Start polling asynchronously
          pollProgress();

        } else {
          // Fallback if no uploadId is returned
          uploadedFileNames.value.push( file.name );
          const newFile = {
            ...file,
            id: uploadResponse.id || file.name,
            url: uploadResponse.fileUrl || uploadResponse.url,
            status: 'finished' as const,
            percentage: 100
          };

          if ( onFinish ) onFinish( newFile );
          message.success( `File "${file.name}" uploaded successfully` );
        }

      } catch ( error: any ) {
        file.status = 'error';
        file.percentage = 0;

        const errorMessage = error.message || 'Upload failed';
        message.error( errorMessage );
        console.error( 'Upload error:', error );

        if ( onError ) onError( error as Error );
        throw error;
      }
    };


    const handleDownload = async ( file: UploadFileInfo ) => {
      try {
        const entityId = localFormData.id || "temp";
        const fileKey = file.id || file.name || 'download';
        const fileName = file.name; // Pass the original filename

        loadingBar.start();

        await store.downloadFileWithProgress(
          entityId,
          fileKey,
          fileName,
          ( percentage: number ) => {
            // loadingBar progress indication ??
          }
        );

        loadingBar.finish();
        message.success( 'Download completed' );
      } catch ( error ) {
        console.error( 'Download failed:', error );
        message.error( `Download failed: ${getErrorMessage( error )}` );
        loadingBar.error();
      }
      return false;
    };

    const handleChange = ( data: {
      file: UploadFileInfo;
      fileList: UploadFileInfo[];
    } ) => {
      fileList.value = data.fileList;
    };

    const handleFinish = ( { file }: {
      file: UploadFileInfo;
    } ) => {
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
          tempFileIds: tempFileIds.value
        };

        await store.save( saveDTO, localFormData.id );
        message.success( "Saved successfully" );
        if ( route.params.brandName ) {
          await router.push( "/outline/station/" + route.params.brandName + "/soundfragments" );
        } else {
          await router.push( "/outline/soundfragments" );
        }
      } catch ( error: unknown ) {
        if ( isErrorWithResponse( error ) && error.response?.status === 400 ) {
          const errorData = error.response.data as ErrorResponse;

          if ( errorData.errors?.length ) {
            errorData.errors.forEach( err => {
              message.error( `${capitalizeFirstLetter( err.field )}: ${err.message}` );
            } );
          } else {
            message.error( errorData.message || "Validation failed" );
          }
        } else {
          message.error( `Save failed: ${getErrorMessage( error )}` );
        }
      } finally {
        loadingBar.finish();
      }
    };

    const handleArchive = () => {
      message.info( "Archive functionality not implemented yet" );
    };

    const goBack = () => {
      router.back();
    };

    const fetchAclData = async () => {
      const id = route.params.id as string;
      if ( !id || id === 'new' ) {
        aclData.value = [];
        return;
      }

      try {
        aclLoading.value = true;
        const response = await store.fetchAccessList( id );
        aclData.value = response.accessList || [];
      } catch ( error ) {
        console.error( 'Failed to fetch ACL data:', error );
        message.error( 'Failed to fetch access control list' );
        aclData.value = [];
      } finally {
        aclLoading.value = false;
      }
    };

    // Watch for tab changes to load ACL data
    watch( activeTab, ( newTab ) => {
      if ( newTab === 'acl' ) {
        fetchAclData();
      }
    } );

    onMounted( async () => {
      const id = route.params.id as string;
      if ( id && id !== 'new' ) {
        try {
          loadingBar.start();
          await store.fetch( id );
          Object.assign( localFormData, store.getCurrent );

          if ( localFormData.uploadedFiles?.length ) {
            fileList.value = localFormData.uploadedFiles.map( f => ( {
              id: f.name,
              name: f.name,
              status: 'finished' as const,
              url: f.url
            } ) );
            uploadedFileNames.value = localFormData.uploadedFiles.map( f => f.name );
          }
        } catch ( error ) {
          console.error( "Failed to fetch sound fragment:", error );
          message.error( 'Failed to fetch sound fragment' );
        } finally {
          loadingBar.finish();
        }
      } else {
        await store.fetch( id );
        Object.assign( localFormData, store.getCurrent );
      }

      try {
        await radioStationStore.fetchAll( 1, 100 );
        await referencesStore.fetchGenres();
      } catch ( error ) {
        console.error( "Failed to fetch data:", error );
      }
    } );



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
      audioAcceptTypes: referencesStore.audioAcceptTypes,
      radioStationOptions,
      formTitle,
      referencesStore,
      aclData,
      aclLoading
    };
  },
} );
</script>