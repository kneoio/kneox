<template>
  <n-config-provider :theme-overrides="localThemeOverrides">
    <div :style="{ minHeight: '100vh', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
    <div style="max-width: 720px; width: 100%;">
      <n-grid cols="24" x-gap="16" y-gap="16">
        <n-grid-item :span="24" v-if="!hideBack">
          <router-link to="/" class="inline-block">
            <n-button>← Back</n-button>
          </router-link>
        </n-grid-item>
        
        <n-grid-item :span="24">
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
                        <n-text
                          depth="3"
                          :class="flashSongs ? 'flash-pulse' : ''"
                          :style="`margin-top: 10px; text-align: center; font-family: Goldman, sans-serif; color: ${stationColorCss || 'inherit'} !important;`"
                        >
                          <n-number-animation :from="0" :to="stationAvailableSongs" @finish="onSongsAnimationFinish" />
                        </n-text>
                      </div>
                      <n-divider v-if="stationDescription" vertical />
                      <n-ellipsis v-if="stationDescription" :line-clamp="2" style="max-width: 58%;">
                        <n-text depth="3" style="font-size: 12px;">{{ stationDescription }}</n-text>
                      </n-ellipsis>
                    </div>
                  </n-form-item>
                </n-grid-item>

                <n-grid-item :span="24">
                  <n-form-item label="From">
                    <n-input v-model:value="form.from" placeholder="" />
                  </n-form-item>
                </n-grid-item>

                <n-grid-item :span="24">
                  <n-form-item label="Message">
                    <n-input v-model:value="form.content" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="" />
                  </n-form-item>
                </n-grid-item>

                <n-grid-item :span="12">
                  <n-form-item label="Email">
                    <div style="display:flex; gap:8px; align-items:center; min-width:0; width:100%;">
                      <n-input v-model:value="form.email" placeholder="" style="flex:1; min-width:0;" />
                      <n-button size="small" @click="sendCode" :loading="sendingCode"
                                :disabled="sendingCode || !isValidEmail(form.email)">
                        {{ codeSent ? 'Resend code' : 'Send code' }}
                      </n-button>
                    </div>
                  </n-form-item>
                </n-grid-item>
                <n-grid-item :span="12">
                  <n-form-item label="Confirmation Code">
                    <n-input v-model:value="form.confirmationCode" placeholder="" />
                  </n-form-item>
                </n-grid-item>
              </n-grid>

              <n-collapse v-if="policyText" style="margin-top: 8px;">
                <n-collapse-item name="message-policy">
                  <template #header>
                    <strong>Message Post Policy</strong>
                  </template>
                  <div style="border: 1px solid #d9d9d9; border-radius: 6px; padding: 12px; font-size: 13px; line-height: 1.6;">
                    {{ policyText }}
                  </div>
                </n-collapse-item>
              </n-collapse>

              <n-collapse style="margin-top: 8px;">
                <n-collapse-item name="agreement">
                  <template #header>
                    <strong>{{ referencesStore.messagePostingAgreement.title }}</strong>
                  </template>
                  <div
                      style="border: 1px solid #d9d9d9; border-radius: 6px; padding: 12px;"
                  >
                    <div v-html="agreementHtml" style="font-size: 13px; line-height: 1.6;" />
                  </div>
                </n-collapse-item>
              </n-collapse>

              <n-form-item label-width="0" style="margin-top: 4px; margin-bottom: 0;" >
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <n-checkbox v-model:checked="form.agree" :style="agreeHighlightStyle">
                    I agree with the Message Posting Agreement (expand above to read the full agreement) and confirm that my message follows community guidelines
                  </n-checkbox>
                </div>
              </n-form-item>

              <n-space justify="end" style="margin-top: 8px;">
                <n-button tertiary @click="reset" :disabled="submitting">Reset</n-button>
                <n-button type="primary" @click="handleSubmit" :disabled="submitting" :loading="submitting">
                  Submit
                </n-button>
              </n-space>

              <n-alert v-if="message && messageType === 'success'" type="success" closable @close="message = ''"
                       style="margin-top: 12px;">
                {{ message }}
              </n-alert>
              <n-alert v-if="message && messageType === 'error'" type="error" closable @close="message = ''"
                       style="margin-top: 12px;">
                {{ message }}
              </n-alert>
            </n-form>
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
const props = defineProps<{ hideBack?: boolean }>()
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NConfigProvider,
  NDivider,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NH2,
  NEllipsis,
  NNumberAnimation,
  NSpace,
  NText,
  useMessage
} from 'naive-ui'
import { useSubmissionStore } from '../stores/public/submissionStore'
import { useReferencesStore } from '../stores/kneo/referencesStore'
import MarkdownIt from 'markdown-it'

const formRef = ref<any|null>(null)
const submissionStore = useSubmissionStore()
const referencesStore = useReferencesStore()
const nMessage = useMessage()
const route = useRoute()

const form = ref({
  brand: '',
  from: '',
  content: '',
  email: '',
  confirmationCode: '',
  agree: false
})

const md = new MarkdownIt({ breaks: true })
const agreementHtml = computed(() => md.render(referencesStore.messagePostingAgreement.clause || ''))
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

const submitting = ref(false)
const sendingCode = ref(false)
const codeSent = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'warning' | 'info'>('success')
const policy = ref<string>('')
const stationColor = ref<string>('')
const stationAvailableSongs = ref<number|null>(null)
const stationDescription = ref<string>('')
const flashSongs = ref(false)
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

const policyText = computed(() => {
  if (policy.value === 'REVIEW_REQUIRED') {
    return 'Your message will be reviewed by the AI DJ and may be considered for on-air mention. Messages may be deleted after consideration.'
  }
  if (policy.value === 'NO_RESTRICTIONS') {
    return 'Your message will be automatically considered by the AI DJ and may be mentioned on-air. Messages will be deleted after AI DJ consideration.'
  }
  return 'Your message will be considered by the AI DJ and may be mentioned on-air. Messages will be deleted after consideration.'
})

const providedIsDark = inject('isDarkTheme', ref(false)) as unknown as { value: boolean }
const localThemeOverrides = computed(() => {
  return referencesStore.getLocalThemeOverrides(providedIsDark && providedIsDark.value)
})

onMounted(async () => {
  try {
    if (stationSlug) {
      const station = await submissionStore.getStation(stationSlug)
      form.value.brand = (station as any)?.name || stationSlug
      policy.value = (station as any)?.submissionPolicy || ''
      stationColor.value = (station as any)?.color || ''
      stationAvailableSongs.value = (station as any)?.availableSongs ?? 0
      stationDescription.value = (station as any)?.description || ''
    } else {
      form.value.brand = ''
      policy.value = ''
      stationColor.value = ''
      stationAvailableSongs.value = null
      stationDescription.value = ''
    }
  } catch (error) {
    console.error('Failed to load station:', error)
    form.value.brand = stationSlug || ''
    policy.value = ''
    stationColor.value = ''
    stationAvailableSongs.value = null
    stationDescription.value = ''
  }
})

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

async function sendCode() {
  if (!isValidEmail(form.value.email)) return

  try {
    sendingCode.value = true
    await submissionStore.sendCode(form.value.email)
    codeSent.value = true
    nMessage.success('Confirmation code sent to your email')
  } catch (e: any) {
    const errorMessage = e?.response?.data?.message || e?.response?.data || e?.message || 'Failed to send code'
    nMessage.error(errorMessage)
  } finally {
    sendingCode.value = false
  }
}

function validateForm(): string | null {
  if (!form.value.from?.trim()) return 'From is required'
  if (!form.value.content?.trim()) return 'Message is required'
  if (!form.value.email?.trim()) return 'Email is required'
  if (!isValidEmail(form.value.email)) return 'Enter a valid email'
  if (!form.value.confirmationCode?.trim()) return 'Confirmation code is required'
  if (!form.value.agree) return 'You must agree to the Message Posting Agreement'
  return null
}

async function handleSubmit() {
  const validationError = validateForm()
  if (validationError) {
    nMessage.error(validationError)
    return
  }

  submitting.value = true
  message.value = ''

  try {
    const termsText = `${referencesStore.messagePostingAgreement.title}\n\n${referencesStore.messagePostingAgreement.clause}`
    
    const payload = {
      confirmationCode: form.value.confirmationCode,
      from: form.value.from,
      content: form.value.content,
      email: form.value.email,
      brand: form.value.brand,
      userAgent: navigator.userAgent,
      termsText,
      agreementVersion: referencesStore.messagePostingAgreement.version
    }

    await submissionStore.postMessage(stationSlug, payload as any)
    nMessage.success('Thanks! Your message was sent.')
    reset()
  } catch (e: any) {
    const errorMessage = e?.response?.data?.message || e?.response?.data || e?.message || 'Submission failed'
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
    from: '',
    content: '',
    email: '',
    confirmationCode: '',
    agree: false
  }
  message.value = ''
  codeSent.value = false
}

const onSongsAnimationFinish = () => {
  flashSongs.value = true
}

watch(() => stationAvailableSongs.value, async (newVal, oldVal) => {
  if (newVal != null && oldVal != null && newVal !== oldVal) {
    flashSongs.value = false
    await nextTick()
    flashSongs.value = true
  }
})
</script>

<style scoped>
</style>
