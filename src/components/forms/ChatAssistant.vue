<template>
  <n-grid cols="1" x-gap="12" y-gap="12" class="project-details">
    <n-gi>
      <n-button-group>
        <n-button type="default" @click="goBack" size="large">
          <n-icon>
            <ArrowBigLeft/>
          </n-icon>
          &nbsp;Back
        </n-button>
        <n-button type="primary" @click="handleSaveChat" size="large">Save</n-button>
      </n-button-group>
    </n-gi>
    <n-gi>
      <n-h2>Project Chat</n-h2>
    </n-gi>
    <n-gi span="24" class="chat-section">
      <n-grid x-gap="12" y-gap="12" class="chat-grid">
        <n-gi span="24" class="chat-messages">
          <n-space vertical>
            <n-card v-for="msg in chatStore.currentChat.messages" :key="msg.id" size="small" :title="msg.sender">
              {{ msg.text }}
            </n-card>
            <n-card v-if="isTyping" size="small" title="Assistant">
              <span class="typing-animation">{{ typingText }}</span>
            </n-card>
          </n-space>
        </n-gi>
        <n-gi span="24" class="chat-input">
          <n-input v-model:value="message" placeholder="Type your message" style="width: 100%; max-width: 600px;"/>
          <n-button @click="sendMessage" type="primary" size="large" :disabled="isTyping">
            <n-icon>
              <ArrowBigLeft/>
            </n-icon>
          </n-button>
        </n-gi>
      </n-grid>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {defineComponent, ref, onMounted, nextTick} from 'vue';
import {useRouter} from 'vue-router';
import {
  NButton,
  NButtonGroup,
  NIcon,
  NInput,
  NGrid,
  NGi,
  NH2,
  NCard,
  NSpace,
  NScrollbar
} from 'naive-ui';
import {ArrowBigLeft} from '@vicons/tabler';
import {useChatStore} from '../../stores/chatStore';

export default defineComponent({
  name: 'ChatAssistant',
  components: {
    NButtonGroup,
    NInput,
    NButton,
    NIcon,
    NGrid,
    NGi,
    NH2,
    NCard,
    NSpace,
    NScrollbar,
    ArrowBigLeft,
  },
  setup() {
    const router = useRouter();
    const message = ref('');
    const chatStore = useChatStore();
    const isTyping = ref(false);
    const typingText = ref('');

    const handleSaveChat = () => {
      chatStore.saveChat();
    };

    const goBack = () => {
      router.push('/dashboard');
    };

    const simulateTyping = async (text: string) => {
      isTyping.value = true;
      typingText.value = '';
      for (let i = 0; i < text.length; i++) {
        typingText.value += text[i];
        await new Promise(resolve => setTimeout(resolve, 30)); // Adjust typing speed here
      }
      isTyping.value = false;
    };

    const sendMessage = async () => {
      if (message.value.trim() && !isTyping.value) {
        const userMessage = message.value;
        chatStore.addMessage('You', userMessage);

        const response = await chatStore.sendChatRequest(userMessage);
        await simulateTyping(response);
        chatStore.addMessage('Assistant', response);

        message.value = '';

        // Scroll to the bottom after adding new messages
        await nextTick(() => {
          const chatMessages = document.querySelector('.chat-messages');
          if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        });
      }
    };

    onMounted(() => {
      // Scroll to the bottom when component is mounted
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    });

    return {
      handleSaveChat,
      goBack,
      sendMessage,
      message,
      chatStore,
      isTyping,
      typingText,
    };
  },
});
</script>

<style scoped>
.project-details {
  padding: 20px;
}

.project-details h2 {
  margin-bottom: 20px;
}

.n-button {
  margin-bottom: 20px;
}

.chat-grid {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #dcdcdc;
  padding: 10px;
  margin-bottom: 10px;
}

.chat-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.typing-animation::after {
  content: '|';
  animation: blink 0.7s infinite;
}

@keyframes blink {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>