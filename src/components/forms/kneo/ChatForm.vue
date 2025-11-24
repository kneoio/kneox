<template>
  <div class="chat-wrapper">
    <div class="chat-container">
      <div class="chat-header">
        <h2>Station Chat</h2>
        <n-select v-model:value="selectedModel" :options="modelOptions" style="width: 280px;" size="medium" />
      </div>

      <div class="chat-messages">
        <n-scrollbar ref="scrollbarRef">
          <div class="messages-inner">
            <div v-if=" chatMessages.length === 0 " class="empty-state">
              <n-text depth="3">No messages yet. Start a conversation!</n-text>
            </div>
            <div v-for=" m in chatMessages " :key="m.id" class="chat-message" :class="`chat-message-${m.role}`">
              <div class="message-header">
                <n-text depth="3" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                  {{ m.role === 'user' ? 'You' : ( m.role === 'assistant' ? 'Assistant' : 'System' ) }}
                </n-text>
              </div>
              <div class="chat-bubble">
                {{ m.text }}
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>

      <div class="chat-input-area">
        <n-input v-model:value="chatInput" type="textarea" :autosize="{ minRows: 1, maxRows: 6 }"
          placeholder="Type your message..." :disabled="isChatSending" @keydown.enter.exact.prevent="handleSendChat" />
        <n-button type="primary" :loading="isChatSending" @click="handleSendChat" :disabled="!chatInput.trim()"
          size="large">
          Send
        </n-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, nextTick, watch } from 'vue';
import { useStationChatStore } from '../../../stores/kneo/stationChatStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import {
  NButton,
  NText,
  NInput,
  NSelect,
  NScrollbar
} from 'naive-ui';

export default defineComponent( {
  name: 'ChatForm',
  components: {
    NButton, NText, NInput, NSelect, NScrollbar
  },
  props: {
    brandName: {
      type: String,
      required: true
    }
  },
  setup( props ) {
    const chatStore = useStationChatStore();
    const referencesStore = useReferencesStore();

    const chatInput = ref( '' );
    const selectedModel = ref( 'CLAUDE' );
    const scrollbarRef = ref();
    const modelOptions = referencesStore.llmTypeOptions;

    const chatMessages = computed( () => chatStore.getMessages( props.brandName ) );
    const isChatSending = computed( () => chatStore.state.isSending );

    const scrollToBottom = async () => {
      await nextTick();
      if ( scrollbarRef.value ) {
        scrollbarRef.value.scrollTo( { top: 999999, behavior: 'smooth' } );
      }
    };

    watch( chatMessages, () => {
      scrollToBottom();
    }, { deep: true } );

    const handleSendChat = async () => {
      const text = chatInput.value;
      if ( !text || !text.trim() ) {
        return;
      }
      await chatStore.sendChat( props.brandName, text, selectedModel.value );
      chatInput.value = '';
      scrollToBottom();
    };

    return {
      chatInput,
      selectedModel,
      modelOptions,
      chatMessages,
      isChatSending,
      handleSendChat,
      scrollbarRef
    };
  }
} );
</script>

<style scoped>
.chat-wrapper {
  height: calc(100vh - 60px);
  padding: 0 24px;
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
  font-size: 24px;
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

.chat-message-system {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  background: linear-gradient(135deg, #18a058 0%, #16a34a 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-message-assistant .chat-bubble {
  background: rgba(64, 158, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-bottom-left-radius: 4px;
}

.chat-message-system .chat-bubble {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
  font-style: italic;
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
</style>
