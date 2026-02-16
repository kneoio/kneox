<template>
  <n-grid cols="1 s:2" responsive="screen" x-gap="12" y-gap="8">
    <n-grid-item>
      <n-form-item label="Email">
        <n-input-group>
          <n-input 
            :value="email" 
            @update:value="onEmail" 
            placeholder="" 
            aria-label="Email"
          />
          <n-button size="small" @click="$emit('send-code')" :loading="sendingCode" :disabled="sendingCode || !canSend">
            {{ codeSent ? 'Resend code' : 'Send code' }}
          </n-button>
        </n-input-group>
      </n-form-item>
    </n-grid-item>
    <n-grid-item>
      <n-form-item label="Confirmation Code">
        <n-input 
          :value="confirmationCode" 
          @update:value="onCode" 
          placeholder="" 
          aria-label="Confirmation Code"
        />
      </n-form-item>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem, NFormItem, NInputGroup, NInput, NButton } from 'naive-ui'

const props = defineProps<{
  email: string
  confirmationCode: string
  sendingCode: boolean
  codeSent: boolean
  canSend: boolean
}>()

const emit = defineEmits<{
  (e: 'update:email', v: string): void
  (e: 'update:confirmationCode', v: string): void
  (e: 'send-code'): void
}>()

function onEmail(v: string) {
  emit('update:email', v)
}

function onCode(v: string) {
  emit('update:confirmationCode', v)
}
</script>

<style scoped></style>
