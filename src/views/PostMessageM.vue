<template>
  <n-config-provider>
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
          <n-form-item label="From">
            <n-input v-model:value="form.from" placeholder="" />
          </n-form-item>
        </n-grid-item>

        <n-grid-item :span="12">
          <n-form-item label="Message">
            <n-input v-model:value="form.content" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="" />
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
          <div style="border: 1px solid #d9d9d9; border-radius: 6px; padding: 12px;">
            <div v-html="agreementHtml" style="font-size: 13px; line-height: 1.6;" />
          </div>
        </n-collapse-item>
      </n-collapse>

      <n-form-item label-width="0" style="margin-top: 4px; margin-bottom: 0;">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <n-checkbox v-model:checked="form.agree" :style="agreeHighlightStyle">
            I agree with the Message Posting Agreement (expand above to read the full agreement) and confirm that my message follows community guidelines
          </n-checkbox>
        </div>
      </n-form-item>

      <n-space justify="end" :style="{ marginTop: '8px' }">
        <n-button tertiary @click="reset" :disabled="submitting">Reset</n-button>
        <n-button type="primary" @click="handleSubmit" :disabled="submitting" :loading="submitting">
          Submit
        </n-button>
      </n-space>

      <n-alert v-if="message && messageType === 'success'" type="success" closable @close="message = ''" style="margin-top: 12px;">
        {{ message }}
      </n-alert>
      <n-alert v-if="message && messageType === 'error'" type="error" closable @close="message = ''" style="margin-top: 12px;">
        {{ message }}
      </n-alert>
    </n-form>
  </n-space>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, type Ref } from 'vue'
import { useRoute } from 'vue-router'
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
  useMessage,
  NSpace
} from 'naive-ui'
import { useSubmissionStore } from '../stores/public/submissionStore'
import { useReferencesStore } from '../stores/kneo/referencesStore'
import MarkdownIt from 'markdown-it'
 
import StationHeaderMini from '../components/public/StationHeaderMini.vue'
import EmailVerifyFields from '../components/public/EmailVerifyFields.vue'

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
  const isOk = !!form.value.agree
  return {
    border: isOk ? '1px solid transparent' : '1px solid rgb(230, 59, 67)',
    padding: '6px 8px',
    borderRadius: '6px',
    backgroundColor: isOk ? 'transparent' : '#fff1f0'
  } as Record<string, string>
})

const submitting = ref(false)
const sendingCode = ref(false)
const codeSent = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'warning' | 'info'>('success')
const policy = ref<string>('')
const stationDescription = ref<string>('')
const stationColor = ref<string>('')
const stationAvailableSongs = ref<number | null>(null)
const stationSlug = (route.query.brand as string)

const policyText = computed(() => {
  if (policy.value === 'REVIEW_REQUIRED') {
    return 'Your message will be reviewed by the AI DJ and may be considered for on-air mention. Messages may be deleted after consideration.'
  }
  if (policy.value === 'NO_RESTRICTIONS') {
    return 'Your message will be automatically considered by the AI DJ and may be mentioned on-air. Messages will be deleted after AI DJ consideration.'
  }
  return 'Your message will be considered by the AI DJ and may be mentioned on-air. Messages will be deleted after consideration.'
})

onMounted(async () => {
  try {
    if (stationSlug) {
      const station = await submissionStore.getStation(stationSlug)
      form.value.brand = (station as any)?.name || stationSlug
      policy.value = (station as any)?.submissionPolicy || ''
      stationDescription.value = (station as any)?.description || ''
      stationColor.value = (station as any)?.color || ''
      stationAvailableSongs.value = (station as any)?.availableSongs ?? 0
    } else {
      form.value.brand = ''
      policy.value = ''
      stationDescription.value = ''
      stationColor.value = ''
      stationAvailableSongs.value = null
    }
  } catch (_) {
    form.value.brand = stationSlug || ''
    policy.value = ''
    stationDescription.value = ''
    stationColor.value = ''
    stationAvailableSongs.value = null
  }
})

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email || '')
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
</script>