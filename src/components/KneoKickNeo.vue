<template>
  <n-h1>chatgpt</n-h1>
  <div class="chat-container">
    <n-h1>Chatbot Interface</n-h1>
    <div class="message-area">
      <div v-for="(message, index) in messages" :key="index" class="message" :class="{ 'user': message.user, 'bot': !message.user }">
        {{ message.text }}
      </div>
    </div>
    <div class="input-area">
      <n-input v-model="input" placeholder="Type your message..." @keyup.enter="sendMessage"/>
      <n-button @click="sendMessage">Send</n-button>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, ref} from "vue";
import {NButton, NH1, NInput, NLayout, NLayoutSider, NMenu} from "naive-ui";
import IconWrapper from "./helpers/IconWrapper.vue";

export default defineComponent({
  components: {NLayoutSider, NLayout, NMenu, NButton, NInput, NH1, IconWrapper},
  setup() {
    const input = ref('');
    const messages = ref([{ text: 'Hello! How can I assist you today?', user: false }]);

    function sendMessage() {
      if (input.value.trim()) {
        messages.value.push({ text: input.value, user: true });
        // Simulate a bot response
        setTimeout(() => {
          messages.value.push({ text: 'Thanks for your message: "' + input.value + '"', user: false });
        }, 1000);
        input.value = '';
      }
    }

    return {
      input,
      messages,
      sendMessage
    }

  }
})
</script>

<style scoped>

</style>