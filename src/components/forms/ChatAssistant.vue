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
          <n-scrollbar style="max-height: 300px;">
            <n-space vertical>
              <n-card v-for="msg in chatStore.currentChat.messages" :key="msg.id" size="small" :title="msg.sender">
                {{ msg.text }}
              </n-card>
            </n-space>
          </n-scrollbar>
        </n-gi>
        <n-gi span="24" class="chat-input">
          <n-input v-model="message" placeholder="Type your message" style="width: 100%; max-width: 600px;"/>
          <n-button @click="sendMessage" type="primary" size="large">
            <n-icon>
              <ArrowBigLeft />
            </n-icon>
          </n-button>
        </n-gi>
      </n-grid>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
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
import { ArrowBigLeft } from '@vicons/tabler';
import { useChatStore } from '../../stores/chatStore';

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

    const handleSaveChat = () => {
      chatStore.saveChat();
    };

    const goBack = () => {
      router.push('/dashboard');
    };

    const sendMessage = async () => {
      if (message.value.trim()) {
        chatStore.addMessage('You', message.value);
        const response = await chatStore.dummyApiRequest(message.value);
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
</style>