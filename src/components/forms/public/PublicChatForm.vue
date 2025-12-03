<template>
  <div class="chat-wrapper">
    <div class="chat-container">
      <div class="chat-header">
        <h2>Chat</h2>
        <n-text v-if="!isConnected" depth="3" type="warning" style="font-size: 12px;">
          Connecting...
        </n-text>
        <n-text v-else depth="3" type="success" style="font-size: 12px;">
          ● Connected
        </n-text>
      </div>

      <div class="chat-messages">
        <n-scrollbar ref="scrollbarRef">
          <div class="messages-inner">
            <div v-if="chatMessages.length === 0" class="empty-state">
              <n-text depth="3">No messages yet. Start a conversation!</n-text>
            </div>

            <div
              v-for="m in chatMessages.filter(msg => msg.type !== 'PROCESSING')"
              :key="m.id"
              class="chat-message"
              :class="m.type === 'BOT'
                       ? 'chat-message-assistant'
                       : m.type === 'WAITING'
                           ? 'chat-message-waiting'
                           : 'chat-message-user'"
            >
              <div class="message-header">
                <n-text depth="3" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                  {{ m.type === 'WAITING' ? 'Waiting…' : m.username }}
                </n-text>
              </div>
              <div class="chat-bubble">
                {{ m.content }}
              </div>
            </div>

            <div v-if="isStreaming" class="chat-message chat-message-assistant">
              <div class="message-header">
                <n-text depth="3" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                  {{ streamingUsername }}
                </n-text>
              </div>
              <div class="chat-bubble streaming">
                {{ streamingMessage }}<span class="typing-cursor">|</span>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>

      <div class="chat-input-area">
        <transition name="processing-fade">
          <n-text v-if="processingMessage" depth="3" style="font-size: 12px; margin-bottom: 8px; display: block;">
            {{ processingMessage }}
          </n-text>
        </transition>
        <n-input
          v-model:value="chatInput"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 6 }"
          placeholder="Type your message..."
          :disabled="!isConnected"
          @keydown.enter.exact.prevent="handleSendChat"
        />
        <n-button
          type="primary"
          :loading="isChatSending"
          @click="handleSendChat"
          :disabled="!chatInput.trim() || !isConnected"
          size="large"
        >
          Send
        </n-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { usePublicChatWebSocketStore } from '../../../stores/public/publicChatWebSocketStore'
import { NButton, NText, NInput, NScrollbar, useThemeVars } from 'naive-ui'

export default defineComponent({
  name: 'PublicChatForm',
  components: {
    NButton,
    NText,
    NInput,
    NScrollbar
  },
  props: {
    stationSlug: {
      type: String,
      required: true
    },
    userToken: {
      type: String,
      required: true
    },
    nickname: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const chatStore = usePublicChatWebSocketStore()
    const themeVars = useThemeVars()

    const chatInput = ref('')
    const scrollbarRef = ref()

    const chatMessages = computed(() => chatStore.messages)
    const isChatSending = computed(() => chatStore.isSending)
    const isConnected = computed(() => chatStore.isConnected)
    const streamingMessage = computed(() => chatStore.streamingMessage)
    const streamingUsername = computed(() => chatStore.streamingUsername)
    const isStreaming = computed(() => chatStore.isStreaming)
    const processingMessage = computed(() => {
      const processingMsg = chatStore.messages.find(m => m.type === 'PROCESSING')
      return processingMsg ? processingMsg.content : ''
    })

    const scrollToBottom = async () => {
      await nextTick()
      if (scrollbarRef.value) {
        scrollbarRef.value.scrollTo({ top: 999999, behavior: 'smooth' })
      }
    }

    watch(chatMessages, scrollToBottom, { deep: true })
    watch(streamingMessage, scrollToBottom)

    const handleSendChat = () => {
      const text = chatInput.value
      if (!text || !text.trim()) return

      chatStore.sendMessage(text, props.stationSlug, props.nickname)
      chatInput.value = ''
      scrollToBottom()
    }

    onMounted(() => {
      chatStore.clearMessages()
      chatStore.connect(props.userToken)
      scrollToBottom()
    })

    onUnmounted(() => {
      chatStore.disconnect()
    })

    return {
      chatInput,
      chatMessages,
      isChatSending,
      isConnected,
      streamingMessage,
      streamingUsername,
      isStreaming,
      processingMessage,
      handleSendChat,
      scrollbarRef,
      themeVars
    }
  }
})
</script>

<style scoped>
.chat-wrapper {
  height: calc(100vh - 300px);
  min-height: 400px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 1200px;
}

.chat-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.chat-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.chat-messages {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.messages-inner {
  padding: 24px;
  min-height: 100%;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.5;
}

.chat-message {
  margin-bottom: 20px;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-header {
  margin-bottom: 6px;
}

.chat-message-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.chat-message-assistant {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.chat-message-processing {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.chat-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  max-width: 70%;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 14px;
}

.chat-message-user .chat-bubble {
  background: v-bind('themeVars.primaryColor');
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chat-message-assistant .chat-bubble {
  background: rgba(64, 158, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-bottom-left-radius: 4px;
}

.chat-message-processing .chat-bubble {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-bottom-left-radius: 4px;
}

.chat-input-area {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.2);
}

.chat-input-area :deep(.n-input) {
  flex: 1;
}

.typing-cursor {
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.processing-fade-enter-active,
.processing-fade-leave-active {
  transition: all 0.3s ease;
}

.processing-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.processing-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.chat-bubble.streaming {
  opacity: 0.9;
}
</style>
