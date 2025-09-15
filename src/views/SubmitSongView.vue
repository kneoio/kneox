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
              <n-form-item label="Radio Station">
                <n-input v-model:value="form.brand" placeholder="" disabled />
              </n-form-item>
              <n-alert v-show="policyText" type="info" :bordered="false" style="margin-top: -4px; margin-bottom: 8px;">
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
                    :disabled="sendingCode || !isValidEmail( form.email )">
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
                <n-upload v-model:file-list="fileList" :multiple="false" :max="1" :show-download-button="false"
                  :disabled="submitting" @change="onFileChange" @remove="handleRemove"
                  :custom-request="handleUploadPublic" :show-remove-button="true">
                  <n-button>Choose File</n-button>
                </n-upload>
              </n-form-item>
              <!-- Progress bar removed by request -->
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
                v-if=" form.sendMessage ">
                <n-input v-model:value="form.attachedMessage" type="textarea" :autosize="{ minRows: 2, maxRows: 3 }"
                  placeholder="" />
              </n-form-item>
            </n-grid-item>
          </n-grid>
          <div style="display:flex; gap: 12px; justify-content: flex-end; margin-top: 8px;">
            <n-button tertiary @click="reset" :disabled="submitting">Reset</n-button>
            <n-button type="primary" @click="() => handleSubmit()">Submit your song</n-button>
          </div>
          <n-alert v-if=" message && messageType === 'error' " type="error" closable @close="message = ''"
            style="margin-top: 12px;">
            {{ message }}
          </n-alert>
        </n-form>
      </n-card>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NUpload,
  NButton,
  NAlert,
  NGrid,
  NGridItem,
  NCollapse,
  NCollapseItem,
  NCheckbox,
  useMessage
} from 'naive-ui'
import { NConfigProvider } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import type { UploadFileInfo, UploadCustomRequestOptions } from 'naive-ui'
import { useSubmissionStore } from '../stores/public/submissionStore'
import { useReferencesStore } from '../stores/kneo/referencesStore'
import { uploadProgress } from '../utils/fileUpload'
import MarkdownIt from 'markdown-it'

const formRef = ref<FormInst | null>( null )
const submissionStore = useSubmissionStore()
const nMessage = useMessage()

const form = ref( {
  brand: '',
  artist: '',
  title: '',
  genres: [] as string[],
  email: '',
  description: '',
  album: '',
  agree: false,
  confirmationCode: '',
  file: null as File | null,
  isShareable: false,
  sendMessage: false,
  attachedMessage: ''
} )

const file = ref<File | null>( null )
const fileList = ref<UploadFileInfo[]>( [] )
const uploadedFileNames = ref<string[]>( [] )
const originalUploadedFileNames = ref<string[]>( [] )
const submitting = ref( false )
const message = ref( '' )
const messageType = ref<'success' | 'error' | 'warning' | 'info'>( 'success' )

const referencesStore = useReferencesStore()
const md = new MarkdownIt({ breaks: true })
const agreementHtml = computed(() => md.render(referencesStore.musicUploadAgreement.clause || ''))
const route = useRoute()
const policy = ref<string>( '' )
const currentUploadId = ref<string | null>( null )
// Inherit theme state from App.vue
const providedIsDark = inject( 'isDarkTheme', ref( false ) ) as unknown as { value: boolean }
const localThemeOverrides = computed( () => {
  return providedIsDark && providedIsDark.value
    ? {
      common: {
        // Make card slightly darker than input so inputs are visible at rest
        cardColor: '#242424',
        modalColor: '#242424',
        popoverColor: '#242424',
        inputColor: '#2a2a2a',
        inputColorDisabled: '#2a2a2a',
        // Slightly lighter border for contrast on dark backgrounds
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
} )
const agreeHighlightStyle = computed(() => {
  if (form.value.agree) return {} as Record<string, string>
  const isDark = providedIsDark && providedIsDark.value
  return {
    border: '1px solid #f5222d',
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

onMounted( async () => {
  // Prefill from query params immediately to avoid UI blink
  form.value.brand = ( route.query.brand as string ) || ''
  policy.value = ( route.query.policy as string ) || ''
  try {
    await referencesStore.fetchGenres()
  } catch ( e ) {
    // ignore
  }
} )

function onFileChange( data: { file: UploadFileInfo; fileList: UploadFileInfo[] } ) {
  // Keep local fileList in sync
  fileList.value = data.fileList
  const f = data?.file?.file ?? null
  file.value = f
  form.value.file = f
  console.debug( '[SubmitSongView] onFileChange', {
    selected: !!f,
    fileName: data?.file?.name,
    fileStatus: data?.file?.status,
    listSize: data?.fileList?.length
  } )
  // Reconcile tracked arrays to current file list
  const currentFileNames = ( data.fileList || [] ).map( f => f.name )
  uploadedFileNames.value = uploadedFileNames.value.filter( name => currentFileNames.includes( name ) )
  originalUploadedFileNames.value = originalUploadedFileNames.value.filter( name => currentFileNames.includes( name ) )
  // If no file left, clear
  if ( !f && currentFileNames.length === 0 ) {
    uploadedFileNames.value = []
    originalUploadedFileNames.value = []
  }
}

function handleRemove( { file, fileList, index }: { file: Required<UploadFileInfo>; fileList: Required<UploadFileInfo>[]; index: number } ) {
  const name = file?.name
  console.debug( '[SubmitSongView] handleRemove', { name, status: file?.status, index, listSize: fileList?.length } )
  if ( name ) {
    uploadedFileNames.value = uploadedFileNames.value.filter( n => n !== name )
    originalUploadedFileNames.value = originalUploadedFileNames.value.filter( n => n !== name )
  }
  if ( globalProgressState.value.isSimulationActive || globalProgressState.value.hasSSEStarted ) {
    resetProgressState()
  }
  return true
}

const globalProgressState = ref( {
  isSimulationActive: false,
  hasSSEStarted: false,
  currentProgress: 0,
  stopSimulation: null as null | ( () => void ),
  eventSource: null as EventSource | null
} )

// Uploading state for UI (alert + button disable)
const isUploading = computed( () => {
  const f = fileList.value[0]
  return !!f && ( f.status === 'uploading' || globalProgressState.value.isSimulationActive || globalProgressState.value.hasSSEStarted )
} )

function resetProgressState() {
  const s = globalProgressState.value
  if ( s.stopSimulation ) s.stopSimulation()
  if ( s.eventSource ) s.eventSource.close()
  globalProgressState.value = {
    isSimulationActive: false,
    hasSSEStarted: false,
    currentProgress: 0,
    stopSimulation: null,
    eventSource: null
  }
}

async function handleUploadPublic( { file, onError }: UploadCustomRequestOptions ) {
  try {
    resetProgressState()
    const brand = form.value.brand
    const entityId = 'temp'
    const uploadId = crypto.randomUUID()
    currentUploadId.value = uploadId
    const startTime = Date.now()
    const originalFileName = file.name
    console.debug( '[SubmitSongView] startUploadSession', { brand, uploadId, startTime, originalFileName } )
    const session = await submissionStore.startUploadSession( brand, uploadId, startTime )
    // Disable simulation: rely on real upload transfer progress + backend SSE only
    if ( !file.file ) throw new Error( 'No file content to upload' )
    console.debug( '[SubmitSongView] uploadFile POST', { urlBrand: brand, entityId, uploadId } )
    await submissionStore.uploadFile(
      file.file,
      brand,
      entityId,
      uploadId,
      ( pct, loaded, total ) => {
        // Real file transfer progress (Phase 1)
        const mb = ( n: number ) => ( n / ( 1024 * 1024 ) ).toFixed( 1 )
        console.debug( '[SubmitSongView] UPLOAD PROGRESS', `${pct}% (${mb( loaded )}MB / ${mb( total || 0 )}MB)` )
        if ( fileList.value[0] ) {
          fileList.value = [{ ...fileList.value[0], percentage: pct, status: 'uploading' }]
        }
      }
    )
    console.debug( '[SubmitSongView] uploadFile POST done' )
    const es = submissionStore.connectPublicSSE(
      globalProgressState.value,
      brand,
      uploadId,
      originalFileName,
      {
        onDisplayProgress: ( progress ) => {
          if ( fileList.value[0] ) {
            fileList.value = [{ ...fileList.value[0], percentage: progress, status: 'uploading' }]
          }
        },
        onFinished: ( { fileName, fileId } ) => {
          const correctFileName = fileName || originalFileName
          if ( correctFileName && !originalUploadedFileNames.value.includes( correctFileName ) ) {
            originalUploadedFileNames.value.push( correctFileName )
          }
          if ( correctFileName && !uploadedFileNames.value.includes( correctFileName ) ) {
            uploadedFileNames.value.push( correctFileName )
          }
          if ( fileList.value[0] ) {
            fileList.value[0] = {
              ...fileList.value[0],
              name: correctFileName,
              percentage: 100,
              status: 'finished',
              id: fileId || fileList.value[0].id
            }
          }
          globalProgressState.value.currentProgress = 100
          resetProgressState()
        },
        onError: ( err ) => {
          const reason = typeof err === 'string'
            ? err
            : err?.errorMessage || err?.message || 'Upload failed'
          if ( fileList.value[0] ) {
            fileList.value[0] = {
              ...fileList.value[0],
              status: 'error'
            }
          }
          messageType.value = 'error'
          message.value = reason
          try { nMessage.error( reason ) } catch ( _ ) { }
          resetProgressState()
        }
      }
    )
    globalProgressState.value.eventSource = es

  } catch ( e: any ) {
    resetProgressState()
    if ( onError ) onError()
    console.error( '[SubmitSongView] handleUploadPublic error', e?.response?.data || e?.message || e )
    throw e
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
    file: null,
    isShareable: false,
    sendMessage: false,
    attachedMessage: ''
  }
  file.value = null
  currentUploadId.value = null
  message.value = ''
  codeSent.value = false
  uploadedFileNames.value = []
  originalUploadedFileNames.value = []
}

const handleSubmit = async () => {
  console.debug( '[SubmitSongView] submit() clicked' )

  const emailRe = /.+@.+\..+/
  if ( !form.value.artist?.trim() ) {
    nMessage.error( 'Artist is required' );
    return
  }
  if ( !form.value.title?.trim() ) {
    nMessage.error( 'Title is required' );
    return
  }
  if ( !form.value.email?.trim() ) {
    nMessage.error( 'Email is required' );
    return
  }
  if ( !emailRe.test( form.value.email ) ) {
    nMessage.error( 'Enter a valid email' );
    return
  }
  if ( !Array.isArray( form.value.genres ) || form.value.genres.length === 0 ) {
    nMessage.error( 'Select at least one genre' );
    return
  }
  if ( !form.value.file ) {
    nMessage.error( 'Audio file is required' );
    return
  }
  if ( codeSent.value && !( form.value.confirmationCode?.trim() ) ) {
    nMessage.error( 'Confirmation code is required' );
    return
  }

  if ( isUploading.value ) {
    console.warn( '[SubmitSongView] blocked: upload still in progress', {
      currentProgress: globalProgressState.value.currentProgress,
      hasSSEStarted: globalProgressState.value.hasSSEStarted,
      isSimulationActive: globalProgressState.value.isSimulationActive,
      fileStatus: fileList.value[0]?.status,
      filePercentage: fileList.value[0]?.percentage
    } )
    nMessage.warning( 'Please wait for the file upload to complete before submitting.' );
    return
  }

  submitting.value = true
  message.value = ''

  try {
    const filesToSend = originalUploadedFileNames.value.length > 0
      ? originalUploadedFileNames.value
      : uploadedFileNames.value

    const termsText = `${referencesStore.musicUploadAgreement.title}\n\n${referencesStore.musicUploadAgreement.clause}`

    const payload = {
      brand: form.value.brand,
      artist: form.value.artist,
      title: form.value.title,
      genres: form.value.genres,
      email: form.value.email,
      confirmationCode: "",
      description: form.value.description,
      album: form.value.album || undefined,
      uploadId: currentUploadId.value || undefined,
      newlyUploaded: filesToSend,
      contributorEmail: form.value.email,
      agreedAt: new Date().toISOString(),
      termsText,
      isShareable: form.value.isShareable,
      shareable: form.value.isShareable,
      agreementVersion: referencesStore.musicUploadAgreement.version,
      attachedMessage: ""
    }

    console.debug( '[SubmitSongView] submit payload preview', {
      brand: payload.brand,
      artist: payload.artist,
      title: payload.title,
      genresCount: payload.genres?.length,
      uploadId: payload.uploadId,
      newlyUploaded: payload.newlyUploaded,
      isShareable: payload.isShareable,
      agreementVersion: payload.agreementVersion,
      hasTermsText: !!payload.termsText,
      hasAttachedMessage: !!payload.attachedMessage
    } )

    if ( form.value.sendMessage && form.value.attachedMessage?.trim() ) {
      payload.attachedMessage = form.value.attachedMessage.trim()
    }

    if ( codeSent.value && form.value.confirmationCode ) {
      payload.confirmationCode = form.value.confirmationCode
    }

    await submissionStore.submit( payload )
    messageType.value = 'success'
    message.value = 'Thanks! Your song was submitted.'
    if ( payload.attachedMessage ) {
      try {
        nMessage.success( payload.attachedMessage as string )
      } catch ( _ ) { /* noop */ }
    }
    reset()

  } catch ( e ) {
    messageType.value = 'error'
    const errData = e?.response?.data
    const raw = errData !== undefined ? JSON.stringify( errData ) : ''
    message.value = raw

    try {
      if ( raw ) nMessage.error( raw )
    } catch ( _ ) {
      // noop
    }
  } finally {
    submitting.value = false
  }
}

const sendingCode = ref( false )
const codeSent = ref( false )

function isValidEmail( v: string ) {
  return /.+@.+\..+/.test( v || '' )
}

async function sendCode() {
  if ( !isValidEmail( form.value.email ) ) return
  try {
    sendingCode.value = true
    await submissionStore.sendCode( form.value.email )
    codeSent.value = true
    messageType.value = 'success'
    message.value = 'Confirmation code sent to your email.'
    try {
      nMessage.success( 'Confirmation code sent' )
    } catch ( _ ) { /* noop */
    }
  } catch ( e: any ) {
    messageType.value = 'error'
    const errData = e?.response?.data
    const raw = errData !== undefined ? JSON.stringify( errData ) : ''
    message.value = raw
    try {
      if ( raw ) nMessage.error( raw )
    } catch ( _ ) { /* noop */
    }
  } finally {
    sendingCode.value = false
  }
}
</script>
