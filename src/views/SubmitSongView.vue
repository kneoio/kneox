<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8f8f8; padding: 15px; flex-direction: column;">
      <div style="width: 100%; max-width: 720px; margin: 0 auto 16px;">
        <router-link to="/" class="inline-block">
          <n-button quaternary size="small">← Back</n-button>
        </router-link>
      </div>
      <n-card style="max-width: 720px; width: 100%;" title="">
      <n-form :model="form" ref="formRef" label-placement="top" :disabled="submitting">
        <n-grid cols="24" x-gap="16" y-gap="8">
          <n-grid-item :span="24">
            <n-form-item label="Radio Station">
              <n-input v-model:value="form.brand" placeholder="" disabled />
            </n-form-item>
            <n-alert v-if="policyText" type="info" :bordered="false" style="margin-top: -4px; margin-bottom: 8px;">
              {{ policyText }}
            </n-alert>
          </n-grid-item>
          <n-grid-item :span="12">
            <n-form-item label="Artist">
              <n-input v-model:value="form.artist" placeholder="" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item :span="12">
            <n-form-item label="Title">
              <n-input v-model:value="form.title" placeholder="" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item :span="12">
            <n-form-item label="Genres">
              <n-select v-model:value="form.genres" :options="referencesStore.genreOptions" multiple filterable placeholder="" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item :span="12">
            <n-form-item label="Email">
              <div style="display:flex; gap:8px; align-items:center;">
                <n-input v-model:value="form.email" placeholder="" />
                <n-button size="small" @click="sendCode" :loading="sendingCode" :disabled="sendingCode || !isValidEmail(form.email)">
                  {{ codeSent ? 'Resend code' : 'Send code' }}
                </n-button>
              </div>
            </n-form-item>
          </n-grid-item>
          <n-grid-item v-if="codeSent" :span="12">
            <n-form-item label="Confirmation Code" placeholder="">
              <n-input v-model:value="form.confirmationCode" placeholder="" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item :span="24">
            <n-form-item label="Description (optional)">
              <n-input v-model:value="form.description" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item :span="24">
            <n-form-item label="Audio File (mp3, wav)">
              <n-upload
                v-model:file-list="fileList"
                :multiple="false"
                :max="1"
                :show-download-button="false"
                :disabled="submitting"
                @change="onFileChange"
                :custom-request="handleUploadPublic"
                :show-remove-button="true"
              >
                <n-button>Choose File</n-button>
              </n-upload>
              <div v-if="fileName" style="margin-top: 8px; font-size: 12px; color: #666;">Selected: {{ fileName }}</div>
            </n-form-item>
            <n-collapse style="margin-top: 8px;">
              <n-collapse-item :title="referencesStore.musicUploadAgreement.title" name="agreement">
                <div style="font-size: 13px; line-height: 1.6;">
                  <ul style="padding-left: 18px; margin: 0 0 8px 0;">
                    <li v-for="(clause, idx) in referencesStore.musicUploadAgreement.clauses" :key="idx">
                      {{ clause }}
                    </li>
                  </ul>
                </div>
              </n-collapse-item>
            </n-collapse>
            <n-form-item label-width="0" style="margin-top: 8px;">
              <n-checkbox v-model:checked="form.agree">
                I agree to these terms and confirm my right to upload this music
              </n-checkbox>
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <div style="display:flex; gap: 12px; justify-content: flex-end; margin-top: 8px;">
          <n-button tertiary @click="reset" :disabled="submitting">Reset</n-button>
          <n-button type="primary" @click="submit" :loading="submitting" :disabled="submitting || !form.agree">Submit your song</n-button>
        </div>
        <n-alert v-if="message" :type="messageType" style="margin-top: 12px;">{{ message }}</n-alert>
        </n-form>
      </n-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NSelect, NUpload, NButton, NAlert, NGrid, NGridItem, NCollapse, NCollapseItem, NCheckbox, useMessage } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import type { UploadFileInfo, UploadCustomRequestOptions } from 'naive-ui'
import { useSubmissionStore } from '../stores/public/submissionStore'
import { useReferencesStore } from '../stores/kneo/referencesStore'
import { apiServer } from '../api/apiClient'
import { uploadProgress, connectSSEProgress } from '../utils/fileUpload'

const formRef = ref<FormInst | null>(null)
const submissionStore = useSubmissionStore()
const nMessage = useMessage()

const form = ref({
  brand: '',
  artist: '',
  title: '',
  genres: [] as string[],
  email: '',
  description: '',
  agree: false,
  confirmationCode: '',
  file: null as File | null
})

const file = ref<File | null>(null)
const fileList = ref<UploadFileInfo[]>([])
const fileName = computed(() => file.value?.name ?? '')

// No path-based rules; we validate manually in submit()

const submitting = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'warning' | 'info'>('success')

const referencesStore = useReferencesStore()
const route = useRoute()
const policy = ref<string>('')
const currentUploadId = ref<string | null>(null)
const policyText = computed(() => {
  if (policy.value === 'REVIEW_REQUIRED') {
    return 'Your song will be reviewed by the station owner and published if it meets the station policy.'
  }
  if (policy.value === 'NO_RESTRICTIONS') {
    return 'Your song will be queued to play automatically. The station may remove it after one or more plays.'
  }
  return ''
})

onMounted(async () => {
  try {
    await referencesStore.fetchGenres()
  } catch (e) {
    // ignore
  }
  // Prefill from query params
  form.value.brand = (route.query.brand as string) || ''
  policy.value = (route.query.policy as string) || ''
})

function onFileChange(options: { file: { file?: File | null } }) {
  const f = options?.file?.file ?? null
  file.value = f
  form.value.file = f
}

const globalProgressState = ref({
  isSimulationActive: false,
  hasSSEStarted: false,
  currentProgress: 0,
  stopSimulation: null as null | (() => void),
  eventSource: null as EventSource | null
})

function resetProgressState() {
  const s = globalProgressState.value
  if (s.stopSimulation) s.stopSimulation()
  if (s.eventSource) s.eventSource.close()
  globalProgressState.value = {
    isSimulationActive: false,
    hasSSEStarted: false,
    currentProgress: 0,
    stopSimulation: null,
    eventSource: null
  }
}

function connectPublicSSE(brand: string, uploadId: string, originalFileName: string) {
  const root = apiServer.replace(/\/api\/?$/, '')
  const url = `${root}/radio/${encodeURIComponent(brand)}/submissions/files/${uploadId}/stream`
  const es = connectSSEProgress(
    globalProgressState.value,
    url,
    {
      onDisplayProgress: (progress) => {
        if (fileList.value[0]) {
          fileList.value = [{ ...fileList.value[0], percentage: progress, status: 'uploading' }]
        }
      },
      onFinished: ({ fileName, fileId }) => {
        const correctFileName = fileName || originalFileName
        if (fileList.value[0]) {
          fileList.value[0] = { ...fileList.value[0], name: correctFileName, percentage: 100, status: 'finished', id: fileId || fileList.value[0].id }
        }
        globalProgressState.value.currentProgress = 100
        resetProgressState()
      },
      onError: () => {
        const current = fileList.value[0]
        if (globalProgressState.value.isSimulationActive && current) {
          setTimeout(() => {
            if (fileList.value[0] && ((fileList.value[0].percentage ?? 0) < 100)) {
              fileList.value[0] = { ...fileList.value[0], percentage: 100, status: 'finished' }
              globalProgressState.value.currentProgress = 100
              resetProgressState()
            }
          }, 2000)
        }
      }
    }
  )
  globalProgressState.value.eventSource = es
  return es
}

async function handleUploadPublic({ file, onError }: UploadCustomRequestOptions) {
  try {
    resetProgressState()
    const brand = form.value.brand
    const entityId = 'temp'
    const uploadId = crypto.randomUUID()
    currentUploadId.value = uploadId
    const startTime = Date.now()
    const originalFileName = file.name
    const session = await submissionStore.startUploadSession(brand, uploadId, startTime)
    globalProgressState.value.stopSimulation = uploadProgress(
      globalProgressState.value,
      session.estimatedDurationSeconds,
      (progress) => {
        if (fileList.value[0]) {
          fileList.value = [{ ...fileList.value[0], percentage: progress, status: 'uploading' }]
        }
      },
      () => {}
    )
    if (!file.file) throw new Error('No file content to upload')
    await submissionStore.uploadFile(file.file, brand, entityId, uploadId)
    connectPublicSSE(brand, uploadId, originalFileName)
  } catch (e: any) {
    resetProgressState()
    if (onError) onError()
    throw e
  }
}

function reset() {
  form.value = { brand: form.value.brand, artist: '', title: '', genres: [], email: '', description: '', agree: false, confirmationCode: '', file: null }
  file.value = null
  currentUploadId.value = null
  message.value = ''
  codeSent.value = false
}

async function submit() {
  // Manual checks using message toasts
  const emailRe = /.+@.+\..+/
  if (!form.value.artist?.trim()) { nMessage.error('Artist is required'); return }
  if (!form.value.title?.trim()) { nMessage.error('Title is required'); return }
  if (!form.value.email?.trim()) { nMessage.error('Email is required'); return }
  if (!emailRe.test(form.value.email)) { nMessage.error('Enter a valid email'); return }
  if (!Array.isArray(form.value.genres) || form.value.genres.length === 0) { nMessage.error('Select at least one genre'); return }
  if (!form.value.file) { nMessage.error('Audio file is required'); return }
  if (codeSent.value && !(form.value.confirmationCode?.trim())) { nMessage.error('Confirmation code is required'); return }

  submitting.value = true
  message.value = ''
  try {
    const payload: any = {
      brand: form.value.brand,
      artist: form.value.artist,
      title: form.value.title,
      genres: form.value.genres,
      email: form.value.email,
      description: form.value.description,
      uploadId: currentUploadId.value || undefined
    }
    if (codeSent.value && form.value.confirmationCode) {
      payload.confirmationCode = form.value.confirmationCode
    }
    await submissionStore.submit(payload)
    messageType.value = 'success'
    message.value = 'Thanks! Your song was submitted.'
    reset()
  } catch (e: any) {
    messageType.value = 'error'
    const errData = e?.response?.data
    const raw = errData !== undefined ? JSON.stringify(errData) : ''
    message.value = raw
    try { if (raw) nMessage.error(raw) } catch (_) { /* noop */ }
  } finally {
    submitting.value = false
  }
}

// Email confirmation helpers
const sendingCode = ref(false)
const codeSent = ref(false)
function isValidEmail(v: string) {
  return /.+@.+\..+/.test(v || '')
}
async function sendCode() {
  if (!isValidEmail(form.value.email)) return
  try {
    sendingCode.value = true
    await submissionStore.sendCode(form.value.email)
    codeSent.value = true
    messageType.value = 'success'
    message.value = 'Confirmation code sent to your email.'
    try { nMessage.success('Confirmation code sent') } catch (_) { /* noop */ }
  } catch (e: any) {
    messageType.value = 'error'
    const errData = e?.response?.data
    const raw = errData !== undefined ? JSON.stringify(errData) : ''
    message.value = raw
    try { if (raw) nMessage.error(raw) } catch (_) { /* noop */ }
  } finally {
    sendingCode.value = false
  }
}
</script>
