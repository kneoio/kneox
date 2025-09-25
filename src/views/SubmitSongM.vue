<template>
  <n-config-provider :theme="providedIsDark && providedIsDark.value ? darkTheme : null" :style="{ backgroundColor: (providedIsDark && providedIsDark.value) ? '#1a1a1a' : '#f8f8f8', minHeight: '100vh' }">
  <n-space vertical :style="{ maxWidth: '720px', margin: '0 auto', padding: '16px' }">
    <StationHeaderMini
      :brand="form.brand"
      :description="stationDescription"
      :available-songs="stationAvailableSongs"
      :color="stationColor"
    />

    <n-form :model="form" ref="formRef" label-placement="top">
      <n-grid cols="12" x-gap="16" y-gap="8">
        <n-grid-item :span="12">
          <n-grid cols="1 s:2" responsive="screen" x-gap="16" y-gap="8">
            <n-grid-item>
              <n-form-item label="Artist">
                <n-input ref="artistInputRef" v-model:value="form.artist" placeholder="" />
              </n-form-item>
            </n-grid-item>
            <n-grid-item>
              <n-form-item label="Title">
                <n-input v-model:value="form.title" placeholder="" />
              </n-form-item>
            </n-grid-item>
            <n-grid-item>
              <n-form-item label="Album (optional)">
                <n-input v-model:value="form.album" placeholder="" />
              </n-form-item>
            </n-grid-item>
            <n-grid-item>
              <n-form-item label="Genres">
                <n-select v-model:value="form.genres" :options="referencesStore.genreOptions" multiple filterable placeholder="" />
              </n-form-item>
            </n-grid-item>
          </n-grid>
        </n-grid-item>

        <n-grid-item :span="12">
          <n-form-item label="Description (optional)">
            <n-input v-model:value="form.description" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="" />
          </n-form-item>
        </n-grid-item>

        <!-- Responsive Email/Code: shared component -->
        <n-grid-item :span="12">
          <EmailVerifyFields
            :email="form.email"
            :confirmation-code="form.confirmationCode"
            :sending-code="sendingCode"
            :code-sent="codeSent"
            :can-send="isValidEmail(form.email)"
            @update:email="v => (form.email = v)"
            @update:confirmationCode="v => (form.confirmationCode = v)"
            @send-code="sendCode"
          />
        </n-grid-item>

        <n-grid-item :span="12">
          <n-form-item label="Audio File (mp3, wav)">
            <n-upload
              v-model:file-list="fileList"
              :multiple="false"
              :max="1"
              :show-download-button="false"
              :disabled="submitting"
              @change="onFileChange"
              @remove="handleRemove"
              :custom-request="handleUploadPublic"
              :show-remove-button="true"
            >
              <n-button>Choose File</n-button>
            </n-upload>
          </n-form-item>
          <n-alert v-if="uploadStatus && uploadStatus.type === 'success'" type="success" closable @close="uploadStatus = null">
            {{ uploadStatus.message }}
          </n-alert>
          <n-alert v-if="uploadStatus && uploadStatus.type === 'error'" type="error" closable @close="uploadStatus = null">
            {{ uploadStatus.message }}
          </n-alert>
        </n-grid-item>
      </n-grid>

      <n-collapse v-if="policyText" style="margin-top: 8px;">
        <n-collapse-item name="submission-policy">
          <template #header>
            <strong>Submission Policy</strong>
          </template>
          <div style="border: 1px solid #d9d9d9; border-radius: 6px; padding: 12px; font-size: 13px; line-height: 1.6;">
            {{ policyText }}
          </div>
        </n-collapse-item>
      </n-collapse>

      <n-collapse style="margin-top: 8px;">
        <n-collapse-item name="agreement">
          <template #header>
            <strong>{{ referencesStore.musicUploadAgreement.title }}</strong>
          </template>
          <div style="border: 1px solid #d9d9d9; border-radius: 6px; padding: 12px;">
            <div v-html="agreementHtml" style="font-size: 13px; line-height: 1.6;" />
          </div>
        </n-collapse-item>
      </n-collapse>

      <n-form-item label-width="0" style="margin-top: 4px; margin-bottom: 0;">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <n-checkbox v-model:checked="form.agree" :style="agreeHighlightStyle">
            I agree with the Music Upload Agreement (expand above to read the full agreement) and confirm my right to upload this music
          </n-checkbox>
          <n-checkbox v-model:checked="form.isShareable" style="padding: 6px 8px;">
            I agree that Mixpla can share this song with other radio stations
          </n-checkbox>
        </div>
      </n-form-item>

      <n-form-item label-width="0" v-if="form.sendMessage" style="margin-top: 0;" :show-feedback="false">
        <div style="width: 100%;">
          <n-form-item label="From">
            <n-input v-model:value="form.messageFrom" placeholder="" :show-feedback="false" />
          </n-form-item>
          <n-form-item label="Message">
            <n-input v-model:value="form.attachedMessage" type="textarea" :autosize="{ minRows: 2, maxRows: 3 }" placeholder="" />
          </n-form-item>
        </div>
      </n-form-item>

      <n-space justify="end" :style="{ marginTop: '8px' }">
        <n-button tertiary @click="reset" :disabled="submitting">Reset</n-button>
        <n-button type="primary" @click="handleSubmit" :disabled="submitting || isUploading" :loading="submitting">
          Submit
        </n-button>
      </n-space>

      <n-alert v-if="message && messageType === 'error'" type="error" closable @close="message = ''" style="margin-top: 12px;">
        {{ message }}
      </n-alert>
    </n-form>
  </n-space>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui'
import {
  NAlert,
  NButton,
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NConfigProvider,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NSelect,
  NUpload,
  useMessage,
  NSpace
} from 'naive-ui'
import { useSubmissionStore } from '../stores/public/submissionStore'
import { useReferencesStore } from '../stores/kneo/referencesStore'
import MarkdownIt from 'markdown-it'
import { darkTheme } from 'naive-ui'
import StationHeaderMini from '../components/public/StationHeaderMini.vue'
import EmailVerifyFields from '../components/public/EmailVerifyFields.vue'

const formRef = ref<any | null>(null)
const submissionStore = useSubmissionStore()
const referencesStore = useReferencesStore()
const nMessage = useMessage()
const route = useRoute()

const providedIsDark = inject('isDarkTheme', ref(false)) as unknown as { value: boolean }

const form = ref({
  brand: '',
  artist: '',
  title: '',
  genres: [] as string[],
  email: '',
  description: '',
  album: '',
  agree: false,
  confirmationCode: '',
  isShareable: false,
  sendMessage: false,
  messageFrom: '',
  attachedMessage: ''
})

function onSongsAnimationFinish() {
  flashSongs.value = false
}

const fileList = ref<UploadFileInfo[]>([])
const currentUploadId = ref<string | null>(null)
const uploadedFileName = ref<string>('')
const submitting = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'warning' | 'info'>('success')
const md = new MarkdownIt({ breaks: true })
const agreementHtml = computed(() => md.render(referencesStore.musicUploadAgreement.clause || ''))
const artistInputRef = ref<any | null>(null)
const sendingCode = ref(false)
const codeSent = ref(false)
const policy = ref<string>('')
const stationDescription = ref<string>('')
const stationColor = ref<string>('')
const stationAvailableSongs = ref<number | null>(null)
const flashSongs = ref(false)
const stationColorCss = computed(() => {
  const c = stationColor.value || ''
  const m = /^#([0-9a-fA-F]{8})$/.exec(c)
  if (m) {
    const hex = m[1]
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const a = parseInt(hex.slice(6, 8), 16) / 255
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  return c
})
const stationSlug = route.query.brand as string

const agreeHighlightStyle = computed(() => {
  const isDark = providedIsDark && (providedIsDark as any).value
  const isOk = !!form.value.agree
  return {
    border: isOk ? '1px solid transparent' : '1px solid rgb(230, 59, 67)',
    padding: '6px 8px',
    borderRadius: '6px',
    backgroundColor: isOk ? 'transparent' : (isDark ? '#2b1a1a' : '#fff1f0')
  } as Record<string, string>
})

const policyText = computed(() => {
  if (policy.value === 'REVIEW_REQUIRED') {
    return 'Your song will be reviewed by the station owner and published if it meets the station policy.'
  }
  if (policy.value === 'NO_RESTRICTIONS') {
    return 'Your song will be queued to play automatically. The station may remove it after one or more plays.'
  }
  return ''
})

watch(() => stationAvailableSongs.value, async (newVal, oldVal) => {
  if (newVal != null && oldVal != null && newVal !== oldVal) {
    flashSongs.value = false
    await nextTick()
    flashSongs.value = true
  }
})

const isUploading = computed(() => {
  const file = fileList.value[0]
  return file && file.status === 'uploading'
})

onMounted(async () => {
  try {
    if (stationSlug) {
      const station = await submissionStore.getStation(stationSlug)
      form.value.brand = station?.name || stationSlug
      policy.value = station?.submissionPolicy || ''
      stationDescription.value = (station as any)?.description || ''
      stationColor.value = (station as any)?.color || ''
      stationAvailableSongs.value = (station as any)?.availableSongs ?? 0
    } else {
      form.value.brand = ''
    }

    try {
      await nextTick()
      artistInputRef.value?.focus?.()
    } catch (_) { /* noop */ }
  } catch (_) {
    form.value.brand = stationSlug || ''
    policy.value = ''
    stationDescription.value = ''
    stationColor.value = ''
    stationAvailableSongs.value = null
  }

  try {
    await referencesStore.fetchGenres()
  } catch (_) { /* ignore */ }
})

function onFileChange(data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  if (data.file?.status === 'pending') {
    uploadStatus.value = null
  }
}

function handleRemove() {
  uploadedFileName.value = ''
  currentUploadId.value = null
  uploadStatus.value = null
  return true
}

const uploadStatus = ref<{ type: 'info' | 'success' | 'error'; message: string } | null>(null)

async function handleUploadPublic({ file, onProgress, onFinish, onError }: UploadCustomRequestOptions) {
  try {
    if (!file.file) throw new Error('No file selected for upload')

    uploadStatus.value = { type: 'info', message: 'Uploading file...' }
    const brand = form.value.brand
    const uploadId = crypto.randomUUID()
    currentUploadId.value = uploadId
    const originalFileName = file.name

    const res = await submissionStore.uploadFile(
      file.file as File,
      brand,
      'temp',
      uploadId,
      (progress) => { onProgress(progress) }
    )

    uploadedFileName.value = originalFileName
    onFinish()
    applyMetadataFromUpload(res)
    const md = (res as any)?.metadata || {}
    const title = md?.title || ''
    const artist = md?.artist || ''
    const niceName = title || originalFileName
    const composed = artist ? `${niceName} — ${artist}` : `${niceName}`
    uploadStatus.value = { type: 'success', message: `Uploaded: ${composed}` }
  } catch (e: any) {
    const errorMessage = e?.response?.data?.message || e?.message || 'Upload failed'
    uploadStatus.value = { type: 'error', message: errorMessage }
    onError()
    nMessage.error(errorMessage)
  }
}

function applyMetadataFromUpload(res: any) {
  try {
    const md = res?.metadata || null
    if (!md) return

    if (!form.value.title && md.title) form.value.title = String(md.title)
    if (!form.value.artist && md.artist) form.value.artist = String(md.artist)
    if (!form.value.album && md.album) form.value.album = String(md.album)

    const incomingGenre = md.genre
    if (Array.isArray(form.value.genres) && (!form.value.genres.length) && incomingGenre) {
      const opts = referencesStore.genreOptions || []
      const match = opts.find((o: any) => {
        const val = (o?.value ?? '').toString()
        const label = (o?.label ?? '').toString()
        const g = incomingGenre.toString()
        return val.localeCompare(g, undefined, { sensitivity: 'accent' }) === 0 ||
               label.localeCompare(g, undefined, { sensitivity: 'accent' }) === 0
      })
      if (match && match.value) {
        form.value.genres = [match.value]
      }
    }
  } catch (_) { /* noop */ }
}

function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email || '')
}

async function sendCode() {
  if (!isValidEmail(form.value.email)) return
  try {
    sendingCode.value = true
    await submissionStore.sendCode(form.value.email)
    codeSent.value = true
    nMessage.success('Confirmation code sent to your email')
  } catch (e: any) {
    const errorMessage = e?.response?.data?.message || e?.message || 'Failed to send code'
    nMessage.error(errorMessage)
  } finally {
    sendingCode.value = false
  }
}

function validateForm(): string | null {
  if (!form.value.artist?.trim()) return 'Artist is required'
  if (!form.value.title?.trim()) return 'Title is required'
  if (!form.value.email?.trim()) return 'Email is required'
  if (!isValidEmail(form.value.email)) return 'Enter a valid email'
  if (!form.value.genres?.length) return 'Select at least one genre'
  if (!fileList.value.length || !uploadedFileName.value) return 'Audio file is required'
  if (!form.value.agree) return 'You must agree to the terms'
  if (codeSent.value && !form.value.confirmationCode?.trim()) return 'Confirmation code is required'
  return null
}

async function handleSubmit() {
  const validationError = validateForm()
  if (validationError) {
    nMessage.error(validationError)
    return
  }
  if (isUploading.value) {
    nMessage.warning('Please wait for the file upload to complete')
    return
  }

  submitting.value = true
  message.value = ''

  try {
    const termsText = `${referencesStore.musicUploadAgreement.title}\n\n${referencesStore.musicUploadAgreement.clause}`
    const payload = {
      brand: form.value.brand,
      artist: form.value.artist,
      title: form.value.title,
      genres: form.value.genres,
      email: form.value.email,
      confirmationCode: codeSent.value ? form.value.confirmationCode : '',
      description: form.value.description,
      album: form.value.album || undefined,
      uploadId: currentUploadId.value || undefined,
      newlyUploaded: [uploadedFileName.value],
      contributorEmail: form.value.email,
      agreedAt: new Date().toISOString(),
      termsText,
      isShareable: form.value.isShareable,
      shareable: form.value.isShareable,
      agreementVersion: referencesStore.musicUploadAgreement.version,
      messageFrom: form.value.sendMessage && form.value.messageFrom?.trim() ? form.value.messageFrom.trim() : '',
      attachedMessage: form.value.sendMessage && form.value.attachedMessage?.trim() ? form.value.attachedMessage.trim() : ''
    }

    await submissionStore.submit(stationSlug, payload)
    nMessage.success('Thanks! Your song was submitted.')
    reset()
  } catch (e: any) {
    const errorMessage = e?.response?.data?.message || e?.message || 'Submission failed'
    message.value = errorMessage
    messageType.value = 'error'
    nMessage.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

function reset() {
  form.value = {
    brand: form.value.brand,
    artist: '',
    title: '',
    genres: [],
    email: '',
    description: '',
    album: '',
    agree: false,
    confirmationCode: '',
    isShareable: false,
    sendMessage: false,
    messageFrom: '',
    attachedMessage: ''
  }
  fileList.value = []
  uploadedFileName.value = ''
  currentUploadId.value = null
  message.value = ''
  uploadStatus.value = null
  codeSent.value = false
}
</script>

<style scoped>
</style>
