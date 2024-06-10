<template>
  <n-layout class="layout-full-height">
    <n-layout-sider bordered :width="300">
      <!-- Placeholder for any sidebar content or menu -->
    </n-layout-sider>
    <n-layout>
      <n-layout-header>
        <n-h1>ChatGPT Interface</n-h1>
      </n-layout-header>
      <n-layout-content class="chat-container">
        <div class="message-area">
          <div v-for="(message, index) in messages" :key="index" class="message" :class="{ 'user': message.user, 'bot': !message.user, 'typing': message.typing }">
            {{ message.text }}
          </div>
        </div>
        <div class="input-area">
          <n-input v-model="input" placeholder="Type your message..." @keyup.enter="sendMessage" />
          <n-button @click="sendMessage">Send</n-button>
        </div>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { NButton, NH1, NInput, NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu } from "naive-ui";
import IconWrapper from "./helpers/IconWrapper.vue";

interface Message {
  text: string;
  user: boolean;
  typing: boolean;
}


export default defineComponent({
  components: { NLayoutSider, NLayout, NLayoutHeader, NLayoutContent, NMenu, NButton, NInput, NH1, IconWrapper },
  setup() {
    const input = ref('');
    const messages = ref<Message[]>([]);

    function sendMessage() {
      if (input.value.trim()) {
        messages.value.push({ text: input.value, user: true, typing: false });
        input.value = '';
        simulateBotResponse();
      }
    }

    function simulateBotResponse() {
      const typingMessage = { text: '...', user: false, typing: true };
      messages.value.push(typingMessage);

      setTimeout(() => {
        messages.value.pop(); // Remove typing indicator
        messages.value.push({ text: 'Echo: ' + input.value, user: false, typing: false });
      }, 1000); // Simulate typing delay
    }

    return {
      input,
      messages,
      sendMessage
    };
  }
})
</script>

<style scoped>
.layout-full-height {
  height: 100vh;
  display: flex;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}

.message-area {
  flex-grow: 1;
  overflow-y: auto;
}

.message {
  margin-bottom: 8px;
  padding: 10px;
  border-radius: 8px;
  background-color: #f0f0f0;
}

.message.user {
  align-self: end;
  background-color: #d1e7dd;
}

.message.bot {
  align-self: start;
  background-color: #f8d7da;
}

.message.typing {
  font-style: italic;
}

.input-area {
  display: flex;
  gap: 10px;
}
</style>
