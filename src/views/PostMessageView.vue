<template>
  <div
      style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 15px; flex-direction: column;">
    <div style="width: 100%; max-width: 720px; margin: 0 auto 16px;">
      <router-link to="/" class="inline-block">
        <n-button>← Back</n-button>
      </router-link>
    </div>
    <n-config-provider :theme-overrides="localThemeOverrides">
      <n-card style="max-width: 720px; width: 100%;" title="">
        <n-form :model="form" ref="formRef" label-placement="top">
          <n-grid cols="24" x-gap="16" y-gap="8">
            <n-grid-item :span="24">
              <n-form-item label-width="0" :style="{ borderLeft: stationColor ? ('4px solid ' + stationColor) : '', paddingLeft: stationColor ? '8px' : '', borderRadius: '4px', marginBottom: '8px' }">
                <div style="display: flex; align-items: center; gap: 12px; width: 100%; min-width: 0;">
                  <n-ellipsis style="max-width: 70%; min-width: 120px;">
                    <n-h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; line-height: 1.2;">{{ form.brand }}</n-h2>
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
              <n-form-item label="Confirmation Code">
                <n-input v-model:value="form.confirmationCode" placeholder="" />
              </n-form-item>
            </n-grid-item>
          </n-grid>

          <div style="display:flex; gap: 12px; justify-content: flex-end; margin-top: 8px;">
            <n-button tertiary @click="reset" :disabled="submitting">Reset</n-button>
            <n-button type="primary" @click="handleSubmit" :disabled="submitting" :loading="submitting">
              Submit
            </n-button>
          </div>
        </n-form>
      </n-card>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton,
  NCard,
  NConfigProvider,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NH2,
  NEllipsis,
  useMessage
} from 'naive-ui'
import { useSubmissionStore } from '../stores/public/submissionStore'

const formRef = ref<any|null>(null)
const submissionStore = useSubmissionStore()
const nMessage = useMessage()
const route = useRoute()

const form = ref({
  brand: '',
  from: '',
  content: '',
  email: '',
  confirmationCode: ''
})

const submitting = ref(false)
const sendingCode = ref(false)
const codeSent = ref(false)
const stationColor = ref<string>('')
const stationSlug = (route.query.brand as string)
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
        }
      }
      : {}
})

onMounted(async () => {
  try {
    if (stationSlug) {
      const station = await submissionStore.getStation(stationSlug)
      form.value.brand = (station as any)?.name || stationSlug
      stationColor.value = (station as any)?.color || ''
    } else {
      form.value.brand = ''
    }
  } catch (_) {
    form.value.brand = stationSlug || ''
    stationColor.value = ''
  }
})

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
  return null
}

async function handleSubmit() {
  const validationError = validateForm()
  if (validationError) {
    nMessage.error(validationError)
    return
  }

  submitting.value = true
  try {
    const payload = {
      confirmationCode: form.value.confirmationCode,
      from: form.value.from,
      content: form.value.content,
      email: form.value.email,
      agreedAt: new Date().toISOString(),
      userAgent: navigator.userAgent
    }

    await submissionStore.postMessage(stationSlug, payload as any)
    nMessage.success('Thanks! Your message was sent.')
    reset()
  } catch (e: any) {
    const errorMessage = e?.response?.data?.message || e?.response?.data || e?.message || 'Submission failed'
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
    confirmationCode: ''
  }
}
</script>

<style scoped>
</style>
