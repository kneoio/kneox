<template>
  <n-config-provider :theme="darkTheme">
    <n-space vertical :style="{ maxWidth: '720px', margin: '0 auto', padding: '16px' }">
      <StationHeaderMini
        :brand="brandName"
        :description="stationDescription"
        :available-songs="stationAvailableSongs"
        :color="stationColor"
      />

      <n-form v-if="!isAuthenticated" :model="form" label-placement="top">
        <n-grid cols="12" x-gap="16" y-gap="8">
          <n-grid-item :span="12">
            <n-form-item label="Nickname (optional)">
              <n-input v-model:value="form.nickname" placeholder="Your display name" />
            </n-form-item>
          </n-grid-item>

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
  </n-config-provider>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton,
  NConfigProvider,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NSpace,
  useMessage,
  darkTheme
} from 'naive-ui'

import StationHeaderMini from '../components/public/StationHeaderMini.vue'
import EmailVerifyFields from '../components/public/EmailVerifyFields.vue'
import PublicChatForm from '../components/forms/public/PublicChatForm.vue'
import { useSubmissionStore } from '../stores/public/submissionStore'
import { usePublicChatStore } from '../stores/public/publicChatStore'

const submissionStore = useSubmissionStore()
const publicChatStore = usePublicChatStore()
const nMessage = useMessage()
const route = useRoute()

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

const brandName = ref('')
const stationDescription = ref('')
const stationColor = ref('')
const stationAvailableSongs = ref<number | null>(null)

const stationSlug = computed(() => (route.query.brand as string) || '')

const canRegister = computed(() => {
  return (
    isValidEmail(form.value.email) &&
    form.value.confirmationCode.trim().length > 0
  )
})

onMounted(async () => {
  try {
    if (stationSlug.value) {
      const station = await submissionStore.getStation(stationSlug.value)
      brandName.value = (station as any)?.name || stationSlug.value
      stationDescription.value = (station as any)?.description || ''
      stationColor.value = (station as any)?.color || ''
      stationAvailableSongs.value = (station as any)?.availableSongs ?? 0
    }
  } catch (_) {
    brandName.value = stationSlug.value || ''
  }

  try {
    const savedToken = window.localStorage.getItem('chatToken')
    if (savedToken) {
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
    }
  } catch (_) {
    // ignore token validation errors on load
  }
})

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email || '')
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
