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
          <div v-for="msg in chatStore.currentChat.prompts" :key="msg.id" class="message">
            {{ msg.text }}
          </div>
          <div v-if="chatStore.currentChat.content" class="message">
            {{ chatStore.currentChat.content }}
          </div>
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
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  NButton,
  NButtonGroup,
  NIcon,
  NInput,
  NGrid,
  NGi,
  NH2,
} from 'naive-ui';
import { ArrowBigLeft } from '@vicons/tabler';
import { useChatStore } from '../../stores/chatStore';  // adjust the import path as needed

export default defineComponent({
  name: 'KneoProjectForm',
  components: {
    NButtonGroup,
    NInput,
    NButton,
    NIcon,
    NGrid,
    NGi,
    NH2,
    ArrowBigLeft,
  },
  setup() {
    const router = useRouter();
    const message = ref('');
    const chatStore = useChatStore();

    const handleSaveChat = () => {
      chatStore.saveChat();
      router.push('/ai/chat');
    };

    const goBack = () => {
      router.push('/ai/chat');
    };

    const sendMessage = async () => {
      if (message.value.trim()) {
        chatStore.addPrompt(`You: ${message.value}`);
        const response = await chatStore.dummyApiRequest(message.value);
        chatStore.addPrompt(response);  // Add bot response as a new prompt
        message.value = '';
      }
    };

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
  height: 300px;
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

.message {
  margin-bottom: 8px;
}
</style>
