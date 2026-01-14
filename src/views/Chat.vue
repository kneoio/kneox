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
          <n-form v-if="!isAuthenticated" :model="form" label-placement="top">
        <n-grid cols="12" x-gap="16" y-gap="16">
          <!-- Email + confirmation first -->
          <n-grid-item :span="12">
            <EmailVerifyFields
              :email="form.email"
              :confirmation-code="form.confirmationCode"
              :sending-code="sendingCode"
              :code-sent="codeSent"
              :can-send="isValidEmail(form.email)"
              @update:email="v => (form.email = v)"
              @update:confirmationCode="v => (form.confirmationCode = v)"
              @send-code="handleSendCode"
            />
          </n-grid-item>

          <!-- Nickname after confirmation/email -->
          <n-grid-item :span="12">
            <n-form-item label="Nickname (optional)">
              <n-input v-model:value="form.nickname" placeholder="Your display name" />
            </n-form-item>
          </n-grid-item>

          <!-- Chat rules above the button -->
          <n-grid-item :span="12">
            <div
              style="border: 1px solid #d9d9d9; border-radius: 6px; padding: 12px; font-size: 13px; line-height: 1.6; margin-top: 4px;"
            >
              <strong>Chat rules</strong>
              <div style="margin-top: 4px;">
                Please keep the chat respectful. Do not post illegal content, harassment, hate speech or spam.
              </div>
            </div>
          </n-grid-item>

          <!-- Join button last -->
          <n-grid-item :span="12">
            <n-space justify="end">
              <n-button
                type="primary"
                :loading="registering"
                :disabled="!canRegister"
                @click="handleRegister"
              >
                Join Chat
              </n-button>
            </n-space>
          </n-grid-item>
        </n-grid>
      </n-form>

      <PublicChatForm
        v-else
        :station-slug="stationSlug"
        :user-token="userToken"
        :nickname="displayNickname"
      />
        </n-space>
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
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
  NSpace,
  useMessage,
  darkTheme
} from 'naive-ui'
import { ArrowLeft, Alien } from '@vicons/tabler'

import EmailVerifyFields from '../components/public/EmailVerifyFields.vue'
import PublicChatForm from '../components/forms/public/PublicChatForm.vue'
import { usePublicChatStore } from '../stores/public/publicChatStore'
import { useSubmissionStore } from '../stores/public/submissionStore'
import GlowLine from '../components/common/GlowLine.vue'

const publicChatStore = usePublicChatStore()
const submissionStore = useSubmissionStore()
const nMessage = useMessage()
const route = useRoute()
const router = useRouter()

const form = ref({
  email: '',
  confirmationCode: '',
  nickname: ''
})

const sendingCode = ref(false)
const codeSent = ref(false)
const registering = ref(false)
const sessionToken = ref('')
const userToken = ref('')
const isAuthenticated = ref(false)
const displayNickname = ref('')
const stationColor = ref('#2196F3')

const stationSlug = computed(() => (route.query.brand as string) || (route.params.brand as string) || '')


const canRegister = computed(() => {
  return (
    isValidEmail(form.value.email) &&
    form.value.confirmationCode.trim().length > 0
  )
})

onMounted(async () => {
  if (stationSlug.value) {
    try {
      const station = await submissionStore.getStation(stationSlug.value)
      stationColor.value = (station as any)?.color || '#2196F3'
    } catch (_) {
      stationColor.value = '#2196F3'
    }
  }

  try {
    const savedToken = window.localStorage.getItem('chatToken')
    if (savedToken) {
      const loadingMessage = nMessage.loading('Checking session...', { duration: 0 })
      try {
        const result = await publicChatStore.validateToken(savedToken)
        console.debug('[Chat] validateToken result for saved chatToken:', result)
        if (result && result.success && result.valid && result.registered) {
          userToken.value = savedToken
          displayNickname.value = result.username || form.value.nickname || form.value.email
          isAuthenticated.value = true
        } else if (result && !result.valid) {
          console.warn('[Chat] saved chatToken is not valid, removing from storage')
          window.localStorage.removeItem('chatToken')
        }
      } finally {
        loadingMessage.destroy()
      }
    }
  } catch (_) {
    // ignore token validation errors on load
  }
})

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function goBack() {
  router.push(`/${stationSlug.value}`)
}

async function handleSendCode() {
  if (!isValidEmail(form.value.email)) return
  try {
    sendingCode.value = true
    await publicChatStore.sendCode(form.value.email)
    codeSent.value = true
    nMessage.success('Confirmation code sent to your email')
  } catch (e: any) {
    const errorMessage = e?.response?.data?.error || e?.response?.data || e?.message || 'Failed to send code'
    nMessage.error(errorMessage)
  } finally {
    sendingCode.value = false
  }
}

async function handleVerifyCode() {
  if (!isValidEmail(form.value.email) || !form.value.confirmationCode.trim()) return
  try {
    const result = await publicChatStore.verifyCode(form.value.email, form.value.confirmationCode)
    if (result.success && result.sessionToken) {
      sessionToken.value = result.sessionToken
      nMessage.success('Code verified')
      return true
    } else {
      nMessage.error(result.message || 'Verification failed')
      return false
    }
  } catch (e: any) {
    const errorMessage = e?.response?.data?.error || e?.response?.data || e?.message || 'Verification failed'
    nMessage.error(errorMessage)
    return false
  }
}

async function handleRegister() {
  if (!canRegister.value) return

  if (!sessionToken.value) {
    const verified = await handleVerifyCode()
    if (!verified) return
  }

  try {
    registering.value = true
    const result = await publicChatStore.registerListener(
      sessionToken.value,
      stationSlug.value,
      form.value.nickname || undefined
    )
    if (result.success && result.userToken) {
      userToken.value = result.userToken
      displayNickname.value = form.value.nickname || form.value.email
      isAuthenticated.value = true
      try {
        window.localStorage.setItem('chatToken', result.userToken)
      } catch (_) { /* ignore */ }
      nMessage.success('Joined chat successfully')
    } else {
      nMessage.error(result.message || 'Registration failed')
    }
  } catch (e: any) {
    const errorMessage = e?.response?.data?.error || e?.response?.data || e?.message || 'Registration failed'
    nMessage.error(errorMessage)
  } finally {
    registering.value = false
  }
}
</script>

<style scoped>
.neon-header {
  position: relative;
  overflow: visible;
  z-index: 1;
}
</style>
