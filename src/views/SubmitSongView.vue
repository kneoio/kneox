<template>
  <div
      style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 15px; flex-direction: column;">
    <div style="width: 100%; max-width: 720px; margin: 0 auto 16px;">
      <router-link to="/" class="inline-block">
        <n-button quaternary size="small">← Back</n-button>
      </router-link>
    </div>
    <n-config-provider :theme-overrides="localThemeOverrides">
      <n-card style="max-width: 720px; width: 100%;" title="">
        <n-form :model="form" ref="formRef" label-placement="top">
          <n-grid cols="24" x-gap="16" y-gap="8">
            <n-grid-item :span="24">
              <n-form-item label-width="0" :style="{ borderLeft: stationColor ? ('4px solid ' + stationColor) : '', paddingLeft: stationColor ? '8px' : '', borderRadius: '4px', marginBottom: '8px' }">
                <div style="display: flex; align-items: center; gap: 12px; width: 100%; min-width: 0;">
                  <n-ellipsis style="max-width: 32%; min-width: 120px;">
                    <n-h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; line-height: 1.2;">{{ form.brand }}</n-h2>
                  </n-ellipsis>
                  <n-divider vertical />
                  <div v-if="stationAvailableSongs !== null" style="display:flex; flex-direction: column; line-height: 1.1; align-items: center;">
                    <n-text depth="3">songs</n-text>
                    <n-text depth="3" :style="`margin-top: 10px; text-align: center; font-family: Goldman, sans-serif; color: ${stationColorCss || 'inherit'} !important;`">{{ stationAvailableSongs }}</n-text>
                  </div>
                  <n-divider v-if="stationDescription" vertical />
                  <n-ellipsis v-if="stationDescription" :line-clamp="2" style="max-width: 58%;">
                    <n-text depth="3" style="font-size: 12px;">{{ stationDescription }}</n-text>
                  </n-ellipsis>
                </div>
              </n-form-item>
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
              <n-form-item label="Album (optional)">
                <n-input v-model:value="form.album" placeholder="" />
              </n-form-item>
            </n-grid-item>
            <n-grid-item :span="12">
              <n-form-item label="Genres">
                <n-select v-model:value="form.genres" :options="referencesStore.genreOptions" multiple filterable
                          placeholder="" />
              </n-form-item>
            </n-grid-item>
            <n-grid-item :span="12">
              <n-form-item label="Email">
                <div style="display:flex; gap:8px; align-items:center;">
                  <n-input v-model:value="form.email" placeholder="" />
                  <n-button size="small" @click="sendCode" :loading="sendingCode"
                            :disabled="sendingCode || !isValidEmail(form.email)">
                    {{ codeSent ? 'Resend code' : 'Send code' }}
                  </n-button>
                </div>
              </n-form-item>
            </n-grid-item>
            <n-grid-item :span="12">
              <n-form-item label="Confirmation Code" placeholder="">
                <n-input v-model:value="form.confirmationCode" placeholder="" />
              </n-form-item>
            </n-grid-item>
            <n-grid-item :span="24">
              <n-form-item label="Description (optional)">
                <n-input v-model:value="form.description" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }"
                         placeholder="" />
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
                    @remove="handleRemove"
                    :custom-request="handleUploadPublic"
                    :show-remove-button="true">
                  <n-button>Choose File</n-button>
                </n-upload>
              </n-form-item>

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
                  <div
                      style="border: 1px solid #d9d9d9; border-radius: 6px; padding: 12px;"
                  >
                    <div v-html="agreementHtml" style="font-size: 13px; line-height: 1.6;" />
                  </div>
                </n-collapse-item>
              </n-collapse>

              <n-form-item label-width="0" style="margin-top: 8px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <n-checkbox v-model:checked="form.agree" :style="agreeHighlightStyle">
                    I agree with the Music Upload Agreement (expand above to read the full agreement) and confirm my right to upload this
                    music
                  </n-checkbox>
                  <n-checkbox v-model:checked="form.isShareable">
                    I agree that Mixpla can share this song with other radio stations
                  </n-checkbox>
                  <n-checkbox v-model:checked="form.sendMessage">
                    Send a message to your audience (AI DJ may use it as an intro and may mention or translate it on
                    air)
                  </n-checkbox>
                </div>
              </n-form-item>

              <n-form-item label="Message to audience (used as DJ intro; may be mentioned or translated on air)"
                           v-if="form.sendMessage">
                <n-input v-model:value="form.attachedMessage" type="textarea" :autosize="{ minRows: 2, maxRows: 3 }"
                         placeholder="" />
              </n-form-item>
            </n-grid-item>
          </n-grid>

          <div style="display:flex; gap: 12px; justify-content: flex-end; margin-top: 8px;">
            <n-button tertiary @click="reset" :disabled="submitting">Reset</n-button>
            <n-button type="primary" @click="handleSubmit" :disabled="submitting || isUploading">
              Submit your song
            </n-button>
          </div>

          <n-alert v-if="message && messageType === 'error'" type="error" closable @close="message = ''"
                   style="margin-top: 12px;">
            {{ message }}
          </n-alert>
        </n-form>
      </n-card>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import {computed, inject, nextTick, onMounted, ref} from 'vue'
import {useRoute} from 'vue-router'
import type {FormInst, UploadCustomRequestOptions, UploadFileInfo} from 'naive-ui'
import {
  NAlert,
  NButton,
  NCard,
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
  NH2,
  NDivider,
  NEllipsis,
  NText,
  useMessage
} from 'naive-ui'
import {useSubmissionStore} from '../stores/public/submissionStore'
import {useReferencesStore} from '../stores/kneo/referencesStore'
import MarkdownIt from 'markdown-it'

const formRef = ref<FormInst | null>(null)
const submissionStore = useSubmissionStore()
const referencesStore = useReferencesStore()
const nMessage = useMessage()
const route = useRoute()

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
  attachedMessage: ''
})

const fileList = ref<UploadFileInfo[]>([])
const currentUploadId = ref<string | null>(null)
const uploadedFileName = ref<string>('')
const submitting = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'warning' | 'info'>('success')
const md = new MarkdownIt({ breaks: true })
//TODO do we need markdown ?
const agreementHtml = computed(() => md.render(referencesStore.musicUploadAgreement.clause || ''))
const artistInputRef = ref<any|null>(null)
const sendingCode = ref(false)
const codeSent = ref(false)
const policy = ref<string>('')
const stationColor = ref<string>('')
const stationAvailableSongs = ref<number|null>(null)
const stationDescription = ref<string>('')
const stationSlug = (route.query.brand as string)
const stationColorCss = computed(() => {
  const c = stationColor.value || ''
  const m = /^#([0-9a-fA-F]{8})$/.exec(c)
  if (m) {
    const hex = m[1]
    const r = parseInt(hex.slice(0,2), 16)
    const g = parseInt(hex.slice(2,4), 16)
    const b = parseInt(hex.slice(4,6), 16)
    const a = parseInt(hex.slice(6,8), 16) / 255
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  return c
})
const uploadStatus = ref<{ type: 'info' | 'success' | 'error', message: string } | null>(null)
const providedIsDark = inject('isDarkTheme', ref(false)) as unknown as { value: boolean }
const localThemeOverrides = computed(() => {
  return providedIsDark && providedIsDark.value
      ? {
        common: {
          cardColor: '#242424',
          modalColor: '#242424',
          popoverColor: '#242424',
          inputColor: '#2a2a2a',
          inputColorDisabled: '#2a2a2a',
          borderColor: '#4a4a4a'
        },
        Input: {
          color: '#2a2a2a',
          colorFocus: '#2a2a2a',
          borderColor: '#4a4a4a',
          borderHoverColor: '#4d4d4d',
          borderFocusColor: '#5aa2f7',
          borderColorDisabled: '#4a4a4a',
          colorDisabled: '#2a2a2a',
          textColorDisabled: '#a0a0a0',
          placeholderColorDisabled: '#777'
        },
        Select: {
          borderColor: '#4a4a4a',
          borderHoverColor: '#4d4d4d',
          borderFocusColor: '#5aa2f7'
        }
      }
      : {}
})

const agreeHighlightStyle = computed(() => {
  if (form.value.agree) return {} as Record<string, string>
  const isDark = providedIsDark && providedIsDark.value
  return {
    border: '1px solidrgb(230, 59, 67)',
    padding: '6px 8px',
    borderRadius: '6px',
    backgroundColor: isDark ? '#2b1a1a' : '#fff1f0'
  } as Record<string, string>
})

const policyText = computed( () => {
  if ( policy.value === 'REVIEW_REQUIRED' ) {
    return 'Your song will be reviewed by the station owner and published if it meets the station policy.'
  }
  if ( policy.value === 'NO_RESTRICTIONS' ) {
    return 'Your song will be queued to play automatically. The station may remove it after one or more plays.'
  }
  return ''
} )

onMounted(async () => {
  try {
    if (stationSlug) {
      const station = await submissionStore.getStation(stationSlug)
      form.value.brand = station?.name || stationSlug
      policy.value = station?.submissionPolicy || ''
      stationColor.value = station?.color || ''
      stationAvailableSongs.value = (station as any)?.availableSongs ?? 0
      stationDescription.value = (station as any)?.description || ''
    } else {
      form.value.brand = ''
    }

    try {
      await nextTick()
      artistInputRef.value?.focus?.()
    } catch (_) {
      // noop
    }
  } catch (_) {
    form.value.brand = stationSlug || ''
    policy.value = ''
    stationColor.value = ''
    stationAvailableSongs.value = null
    stationDescription.value = ''

    try {
      await nextTick()
      artistInputRef.value?.focus?.()
    } catch (_) {
      // noop
    }
  }

  try {
    await referencesStore.fetchGenres()
  } catch (e) {
    // ignore
  }
})

const isUploading = computed(() => {
  const file = fileList.value[0]
  return file && file.status === 'uploading'
})

onMounted(async () => {
  form.value.brand = (route.query.brand as string) || ''
  policy.value = (route.query.policy as string) || ''

  try {
    await referencesStore.fetchGenres()
  } catch (e) {
    console.error('Failed to fetch genres', e)
  }
} )

function onFileChange(data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  console.debug('[onFileChange]', {
    fileName: data.file?.name,
    status: data.file?.status,
    listSize: data.fileList?.length
  })

  if (data.file?.status === 'pending') {
    uploadStatus.value = null
  }
}

function handleRemove() {
  console.debug('[handleRemove] File removed')
  uploadedFileName.value = ''
  currentUploadId.value = null
  uploadStatus.value = null
  return true
}
async function handleUploadPublic({
                                    file,
                                    onProgress,
                                    onFinish,
                                    onError
                                  }: UploadCustomRequestOptions) {
  try {
    if (!file.file) {
      throw new Error('No file selected for upload');
    }

    uploadStatus.value = { type: 'info', message: 'Uploading file...' };
    const brand = form.value.brand;
    const uploadId = crypto.randomUUID();
    currentUploadId.value = uploadId;
    const originalFileName = file.name;

    console.debug('[Upload] Starting', { brand, uploadId, originalFileName });

    await submissionStore.uploadFile(
        file.file as File,
        brand,
        'temp',
        uploadId,
        (progress) => {
          onProgress(progress);
        }
    );

    console.debug('[Upload] File upload complete');
    uploadedFileName.value = originalFileName;
    onFinish();
    uploadStatus.value = { type: 'success', message: 'File uploaded' };

  } catch (e: any) {
    console.error('[Upload] Error', e);
    const errorMessage = e?.response?.data?.message || e?.message || 'Upload failed';
    uploadStatus.value = { type: 'error', message: errorMessage };
    onError();
    nMessage.error(errorMessage);
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
  console.debug('[Submit] Starting submission')

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
      confirmationCode: codeSent.value ? form.value.confirmationCode : "",
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
      attachedMessage: form.value.sendMessage && form.value.attachedMessage?.trim()
          ? form.value.attachedMessage.trim()
          : ""
    }

    console.debug('[Submit] Payload', payload)

    await submissionStore.submit(stationSlug, payload)

    nMessage.success('Thanks! Your song was submitted.')
    reset()

  } catch (e: any) {
    console.error('[Submit] Error', e)
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
    attachedMessage: ''
  }
  fileList.value = []
  uploadedFileName.value = ''
  currentUploadId.value = null
  message.value = ''
  uploadStatus.value = null
  codeSent.value = false
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
    const errorMessage = e?.response?.data?.message || 'Failed to send code'
    nMessage.error(errorMessage)
  } finally {
    sendingCode.value = false
  }
}
</script>