<template>
  <n-modal v-model:show="showDialog" preset="dialog" :title="modalTitle" style="width: 700px;">
    <n-space vertical>
      <n-upload
        ref="uploadRef"
        :multiple="true"
        :show-file-list="false"
        v-model:file-list="fileList"
        :accept="'.mp3,.wav,.flac,.ogg,.m4a,.aac'"
        :custom-request="handleFileUpload"
        :disabled="isUploading"
      >
        <n-button :disabled="isUploading">Choose Files</n-button>
      </n-upload>

      <n-data-table
        :columns="columns"
        :data="tableData"
        :bordered="false"
        :pagination="false"
        size="small"
      />
    </n-space>

    <template #action>
      <n-space>
        <n-button v-if="!uploadCompleted" @click="handleCancel" :disabled="isUploading">Cancel</n-button>
        <n-button v-if="uploadCompleted" @click="handleCancel">Close</n-button>
        <n-button v-if="!uploadCompleted" type="primary" @click="handleUpload" :disabled="fileList.length === 0 || isUploading" :loading="isUploading">
          Upload
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.status-blink {
  animation: blink 1.5s ease-in-out infinite;
}
</style>

<script lang="ts">
import { defineComponent, ref, watch, computed, h } from 'vue'
import { NModal, NUpload, NButton, NSpace, NText, NProgress, NDataTable, useMessage } from 'naive-ui'
import apiClient from '../../api/apiClient'

export default defineComponent({
  name: 'BulkUploadDialog',
  components: {
    NModal,
    NUpload,
    NButton,
    NSpace,
    NText,
    NProgress,
    NDataTable
  },
  props: {
    show: Boolean,
    slugName: String
  },
  emits: ['update:show', 'upload-complete'],
  setup(props, { emit }) {
    const message = useMessage()
    const showDialog = ref(props.show)
    const fileList = ref([])
    const fileStatuses = ref({})
    const isUploading = ref(false)
    const uploadRef = ref()
    const totalFiles = ref(0)
    const eventSource = ref(null)
    const batchId = ref('')
    const uploadCompleted = ref(false)

    watch(() => props.show, (v) => {
      showDialog.value = v
      if (!v) {
        fileList.value = []
        fileStatuses.value = {}
        isUploading.value = false
        uploadCompleted.value = false
        totalFiles.value = 0
        if (eventSource.value) {
          eventSource.value.close()
          eventSource.value = null
        }
      }
    })

    watch(showDialog, (v) => emit('update:show', v))

    watch(fileList, (n, o) => {
      if (uploadCompleted.value && n.length > o.length) {
        fileStatuses.value = {}
        uploadCompleted.value = false
      }
    })

    const formatStatus = (s: string) => {
      const map: Record<string, string> = {
        processing: 'Processing',
        metadata_extracted: 'Metadata extracted',
        creating_entity: 'Processing ...',
        finished: 'Finished',
        error: 'Error'
      }
      return map[s] || s
    }

    const columns = [
      {
        title: 'File',
        key: 'name',
        ellipsis: { tooltip: true },
        width: 260
      },
      {
        title: 'Upload',
        key: 'upload',
        width: 50,
        render(row: any) {
          if (row.status === 'uploading') {
            return h(NProgress, {
              type: 'line',
              percentage: row.percentage || 0,
              showIndicator: true
            })
          }
          if (row.status === 'finished') {
            return h(NText, { type: 'info' }, 'Uploaded')
          }
          return null
        }
      },
      {
        title: 'Processing',
        key: 'processing',
        width: 50,
        render(row: any) {
          const st = fileStatuses.value[row.id]
          if (!st) return null
          return h(
            NText,
            {
              style: 'font-size:12px;color:#52a113',
              class: st.status === 'creating_entity' ? 'status-blink' : ''
            },
            `${formatStatus(st.status)}${st.errorMessage ? ' - ' + st.errorMessage : ''}`
          )
        }
      }
    ]

    const tableData = computed(() =>
      fileList.value.map(f => ({
        id: f.id,
        name: f.name,
        status: f.status,
        percentage: f.percentage
      }))
    )

    const uploadingCount = computed(() =>
      fileList.value.filter(f => f.status === 'uploading').length
    )

    const modalTitle = computed(() =>
      uploadingCount.value > 0
        ? `Bulk Upload Sound Fragments (${uploadingCount.value} uploading)`
        : 'Bulk Upload Sound Fragments'
    )

    const handleCancel = () => {
      if (eventSource.value) {
        eventSource.value.close()
        eventSource.value = null
      }
      showDialog.value = false
    }

    const startSSE = () => {
      if (eventSource.value) return
      
      eventSource.value = new EventSource(`${apiClient.defaults.baseURL}/soundfragments-bulk/status/${batchId.value}/stream`)

      eventSource.value.onmessage = (event) => {
          const data = JSON.parse(event.data)
          const next = { ...fileStatuses.value }
          for (const [id, fd] of Object.entries(data)) {
            next[id] = {
              fileId: id,
              fileName: fd.fileName,
              status: fd.status,
              errorMessage: fd.errorMessage
            }
          }
          fileStatuses.value = next

          const done = Object.values(next).filter((f: any) => f.status === 'finished' || f.status === 'error').length
          if (done === totalFiles.value && totalFiles.value > 0) {
            eventSource.value?.close()
            eventSource.value = null
            const errors = Object.values(next).filter((f: any) => f.status === 'error').length
            const ok = Object.values(next).filter((f: any) => f.status === 'finished').length
            if (errors > 0) message.warning(`Processing completed: ${ok} succeeded, ${errors} failed`)
            else message.success(`All ${ok} files processed successfully`)
            isUploading.value = false
            uploadCompleted.value = true
            emit('upload-complete')
          }
        }

        eventSource.value.onerror = () => {
          if (eventSource.value) {
            eventSource.value.close()
            eventSource.value = null
            if (isUploading.value) {
              message.error('Connection to server lost')
            }
            isUploading.value = false
          }
        }
    }

    const handleFileUpload = async ({ file, onProgress, onFinish, onError }) => {
      if (!file.file) {
        onError?.()
        return
      }

      if (!isUploading.value) {
        isUploading.value = true
        batchId.value = `batch-${Date.now()}`
        totalFiles.value = fileList.value.length
        fileStatuses.value = {}
      }

      try {
        const formData = new FormData()
        formData.append('file', file.file)

        await apiClient.post(
          `/soundfragments-bulk/files?batchId=${batchId.value}&brandSlug=${props.slugName}&fileId=${file.id}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const percent = e.total ? Math.round((e.loaded * 100) / e.total) : 0
              onProgress?.({ percent })
            }
          }
        )

        onFinish?.()
        startSSE()
      } catch (err: any) {
        message.error(err.response?.data?.detail || `Upload failed: ${file.name}`)
        onError?.()
      }
    }

    const handleUpload = () => {
      if (fileList.value.length === 0) message.warning('Please select files to upload')
    }

    return {
      showDialog,
      fileList,
      fileStatuses,
      isUploading,
      uploadCompleted,
      uploadRef,
      tableData,
      columns,
      formatStatus,
      handleCancel,
      handleUpload,
      handleFileUpload,
      modalTitle
    }
  }
})
</script>
