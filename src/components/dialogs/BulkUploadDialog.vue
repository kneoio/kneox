<template>
  <n-modal v-model:show="showDialog" preset="dialog" title="Bulk Upload Sound Fragments">
    <n-space vertical>
      <n-upload
        ref="uploadRef"
        :multiple="true"
        :show-file-list="true"
        :default-upload="false"
        v-model:file-list="fileList"
        :accept="'.mp3,.wav,.flac,.ogg,.m4a,.aac'"
      >
        <n-button>Choose Files</n-button>
      </n-upload>
      
      <n-space v-if="uploadProgress" vertical>
        <n-progress
          type="line"
          :percentage="uploadProgress.percentage"
          :status="uploadProgress.status === 'error' ? 'error' : uploadProgress.status === 'finished' ? 'success' : 'default'"
        />
        <n-text>{{ uploadProgress.message }}</n-text>
      </n-space>
    </n-space>
    
    <template #action>
      <n-space>
        <n-button @click="handleCancel" :disabled="isUploading">Cancel</n-button>
        <n-button type="primary" @click="handleUpload" :disabled="fileList.length === 0 || isUploading" :loading="isUploading">
          Upload
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { NModal, NUpload, NButton, NSpace, NProgress, NText, useMessage, UploadFileInfo } from 'naive-ui';
import apiClient from '../../api/apiClient';

interface UploadProgress {
  percentage: number;
  message: string;
  status: string;
}

export default defineComponent({
  name: 'BulkUploadDialog',
  components: {
    NModal,
    NUpload,
    NButton,
    NSpace,
    NProgress,
    NText,
  },
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
  },
  emits: ['update:show', 'upload-complete'],
  setup(props, { emit }) {
    const message = useMessage();
    const showDialog = ref(props.show);
    const fileList = ref<UploadFileInfo[]>([]);
    const uploadProgress = ref<UploadProgress | null>(null);
    const isUploading = ref(false);
    const uploadRef = ref();

    watch(() => props.show, (newVal) => {
      showDialog.value = newVal;
      if (!newVal) {
        fileList.value = [];
        uploadProgress.value = null;
        isUploading.value = false;
      }
    });

    watch(showDialog, (newVal) => {
      emit('update:show', newVal);
    });

    const handleCancel = () => {
      showDialog.value = false;
    };

    const handleUpload = async () => {
      if (fileList.value.length === 0) {
        message.warning('Please select files to upload');
        return;
      }

      alert('Bulk upload is not implemented yet');
      return;

      isUploading.value = true;
      const batchId = `batch-${Date.now()}`;

      try {
        const formData = new FormData();
        fileList.value.forEach((file) => {
          if (file.file) {
            formData.append('files', file.file);
          }
        });

        const eventSource = new EventSource(`${apiClient.defaults.baseURL}/soundfragments-bulk/status/${batchId}/stream`);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          uploadProgress.value = {
            percentage: data.percentage || 0,
            message: data.message || '',
            status: data.status || 'uploading',
          };

          if (data.status === 'finished') {
            eventSource.close();
            message.success('Upload completed successfully');
            isUploading.value = false;
            emit('upload-complete');
            setTimeout(() => {
              showDialog.value = false;
            }, 1000);
          } else if (data.status === 'error') {
            eventSource.close();
            message.error(data.message || 'Upload failed');
            isUploading.value = false;
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          message.error('Connection to server lost');
          isUploading.value = false;
        };

        await apiClient.post(`/soundfragments-bulk/files?batchId=${batchId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

      } catch (error: any) {
        message.error(error.response?.data?.detail || 'Upload failed');
        isUploading.value = false;
      }
    };

    return {
      showDialog,
      fileList,
      uploadProgress,
      isUploading,
      uploadRef,
      handleCancel,
      handleUpload,
    };
  },
});
</script>
