<template>
  <n-config-provider :theme="darkTheme">
    <n-layout>
      <n-layout-header class="neon-header">
        <n-space align="center" justify="space-between" :wrap="false" :style="{ maxWidth: '720px', margin: '0 auto', padding: '12px 16px' }">
          <n-button quaternary size="small" @click="goBack" :focusable="false">
            <n-icon size="16"><ArrowLeft /></n-icon>
            Back
          </n-button>
          <n-icon size="32"><Alien /></n-icon>
        </n-space>
        <GlowLine :color="stationColor" />
      </n-layout-header>

      <n-layout-content :style="{ padding: '40px 16px 24px' }">
        <n-space vertical :style="{ maxWidth: '720px', margin: '0 auto' }">
          <n-form :model="form" label-placement="top">
            <n-grid cols="12" x-gap="16" y-gap="16">
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
                <n-form-item label="Script">
                  <n-select
                    v-model:value="form.scriptId"
                    :options="scriptOptions"
                    :loading="loadingScripts"
                    placeholder="Select a script"
                    @update:value="onScriptChange"
                  />
                </n-form-item>
              </n-grid-item>

              <n-grid-item v-if="selectedScript?.requiredVariables?.length" :span="12">
                <n-grid cols="1 s:2" responsive="screen" x-gap="16" y-gap="8">
                  <n-grid-item v-for="variable in selectedScript.requiredVariables" :key="variable.name">
                    <n-form-item :label="variable.description || variable.name">
                      <n-input
                        v-model:value="form.variables[variable.name]"
                        :placeholder="variable.description || variable.name"
                      />
                    </n-form-item>
                  </n-grid-item>
                </n-grid>
              </n-grid-item>

              <n-grid-item :span="12">
                <n-checkbox v-model:checked="form.sendEmail">
                  Send email with stream link
                </n-checkbox>
              </n-grid-item>
            </n-grid>

            <n-space justify="end" :style="{ marginTop: '8px' }">
              <n-button tertiary @click="reset" :disabled="submitting">Reset</n-button>
              <n-button type="primary" @click="handleSubmit" :disabled="submitting" :loading="submitting">
                Run
              </n-button>
            </n-space>

            <n-alert v-if="message && messageType === 'error'" type="error" closable @close="message = ''" style="margin-top: 12px;">
              {{ message }}
            </n-alert>
          </n-form>
        </n-space>
      </n-layout-content>
    </n-layout>

    <n-modal v-model:show="showResultDialog" preset="dialog" title="Stream Started Successfully">
      <n-space vertical size="large">
        <n-space vertical size="small">
          <n-text strong>HLS URL</n-text>
          <n-space align="center">
            <n-text>
              <a :href="streamResult?.hlsUrl" target="_blank">{{ streamResult?.hlsUrl }}</a>
            </n-text>
            <n-button size="small" @click="copyToClipboard(streamResult?.hlsUrl, 'HLS URL')">
              Copy
            </n-button>
          </n-space>
        </n-space>

        <n-space vertical size="small">
          <n-text strong>Mixpla Player URL</n-text>
          <n-space align="center">
            <n-text>
              <a :href="streamResult?.mixplaUrl" target="_blank">{{ streamResult?.mixplaUrl }}</a>
            </n-text>
            <n-button size="small" @click="copyToClipboard(streamResult?.mixplaUrl, 'Mixpla URL')">
              Copy
            </n-button>
          </n-space>
        </n-space>

        <n-space justify="end">
          <n-button @click="showResultDialog = false">Close</n-button>
        </n-space>
      </n-space>
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCheckbox,
  NConfigProvider,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NIcon,
  NInput,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NModal,
  NSelect,
  NSpace,
  NText,
  useMessage,
  darkTheme
} from 'naive-ui'
import { ArrowLeft, Alien } from '@vicons/tabler'
import { useSubmissionStore } from '../stores/public/submissionStore'
import EmailVerifyFields from '../components/public/EmailVerifyFields.vue'
import GlowLine from '../components/common/GlowLine.vue'

const submissionStore = useSubmissionStore()
const nMessage = useMessage()
const route = useRoute()
const router = useRouter()
const stationColor = ref('#2196F3')

const form = ref({
  email: '',
  confirmationCode: '',
  scriptId: null as string | null,
  variables: {} as Record<string, string>,
  sendEmail: true
})

const submitting = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'warning' | 'info'>('success')
const sendingCode = ref(false)
const codeSent = ref(false)
const stationSlug = route.query.brand as string
const scripts = ref<any[]>([])
const loadingScripts = ref(false)
const selectedScript = ref<any | null>(null)
const station = ref<any | null>(null)
const showResultDialog = ref(false)
const streamResult = ref<any | null>(null)

function goBack() {
  router.push(`/${stationSlug}`)
}

const scriptOptions = computed(() => {
  return scripts.value.map(script => ({
    label: script.name,
    value: script.id
  }))
})

function onScriptChange(scriptId: string | null) {
  if (!scriptId) {
    selectedScript.value = null
    form.value.variables = {}
    return
  }
  selectedScript.value = scripts.value.find(s => s.id === scriptId) || null
  form.value.variables = {}
}

onMounted(async () => {
  try {
    if (stationSlug) {
      station.value = await submissionStore.getStation(stationSlug)
      stationColor.value = station.value?.color || '#2196F3'
    }
  } catch (_) {
    stationColor.value = '#2196F3'
  }

  try {
    loadingScripts.value = true
    scripts.value = await submissionStore.fetchSharedScripts()
  } catch (e: any) {
    const errorMessage = e?.response?.data?.message || e?.message || 'Failed to load scripts'
    nMessage.error(errorMessage)
  } finally {
    loadingScripts.value = false
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
    const errorMessage = e?.response?.data?.message || e?.message || 'Failed to send code'
    nMessage.error(errorMessage)
  } finally {
    sendingCode.value = false
  }
}

function validateForm(): string | null {
  if (!form.value.email?.trim()) return 'Email is required'
  if (!isValidEmail(form.value.email)) return 'Enter a valid email'
  if (codeSent.value && !form.value.confirmationCode?.trim()) return 'Confirmation code is required'
  if (!form.value.scriptId) return 'Script is required'
  if (selectedScript.value?.requiredVariables) {
    for (const variable of selectedScript.value.requiredVariables) {
      if (variable.required && !form.value.variables[variable.name]?.trim()) {
        return `${variable.description || variable.name} is required`
      }
    }
  }
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
    const payload: any = {
      scriptId: form.value.scriptId!,
      baseBrandId: station.value?.id || undefined,
      slugName: stationSlug,
      userVariables: form.value.variables
    }

    if (form.value.sendEmail) {
      payload.email = form.value.email
    }

    const result = await submissionStore.runStream(payload)
    streamResult.value = result
    showResultDialog.value = true
    nMessage.success('Stream started successfully')
    reset()
  } catch (e: any) {
    const errorMessage = e?.response?.data?.message || e?.message || 'Failed to start stream'
    message.value = errorMessage
    messageType.value = 'error'
    nMessage.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

function copyToClipboard(text: string | undefined, label: string) {
  if (!text) return
  navigator.clipboard.writeText(text)
  nMessage.success(`${label} copied to clipboard`)
}

function reset() {
  form.value = {
    email: '',
    confirmationCode: '',
    scriptId: null,
    variables: {},
    sendEmail: true
  }
  message.value = ''
  codeSent.value = false
  selectedScript.value = null
}
</script>

<style scoped>
.neon-header {
  position: relative;
  overflow: visible;
  z-index: 1;
}
</style>
