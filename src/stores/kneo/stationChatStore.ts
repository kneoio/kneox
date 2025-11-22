import { defineStore } from 'pinia';
import { ref } from 'vue';
import { unsecuredClient } from '../../api/apiClient';

export interface StationChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

interface StationChatState {
  messagesByBrand: Record<string, StationChatMessage[]>;
  isSending: boolean;
}

const MIXPLA_CHAT_URL = 'https://mixpla.io/introcaster/chat/invoke';
const MIXPLA_CHAT_API_KEY = 'Gf!G%vD7siwSMP';

export const useStationChatStore = defineStore('stationChatStore', () => {
  const state = ref<StationChatState>({
    messagesByBrand: {},
    isSending: false
  });

  const getMessages = (brand: string): StationChatMessage[] => {
    return state.value.messagesByBrand[brand] || [];
  };

  const appendMessage = (brand: string, message: StationChatMessage) => {
    const existing = state.value.messagesByBrand[brand] || [];
    state.value.messagesByBrand[brand] = [...existing, message];
  };

  const clearMessages = (brand: string) => {
    state.value.messagesByBrand[brand] = [];
  };

  const sendChat = async (brand: string, text: string, llm: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: StationChatMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString()
    };

    appendMessage(brand, userMessage);

    state.value.isSending = true;
    try {
      const payload = {
        chat_id: 123,
        telegram_username: 'justaidajam',
        text: trimmed,
        brand,
        llm
      };

      const response = await unsecuredClient.post(MIXPLA_CHAT_URL, payload, {
        headers: {
          'content-type': 'application/json',
          'x-api-key': MIXPLA_CHAT_API_KEY
        }
      });

      let assistantText: string;
      if (response && typeof response.data === 'string') {
        assistantText = response.data;
      } else if (response && response.data && typeof response.data === 'object' && 'text' in response.data) {
        assistantText = (response.data as any).text ?? JSON.stringify(response.data);
      } else {
        assistantText = JSON.stringify(response?.data ?? {});
      }

      const assistantMessage: StationChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: assistantText,
        timestamp: new Date().toISOString()
      };

      appendMessage(brand, assistantMessage);

      return response.data;
    } finally {
      state.value.isSending = false;
    }
  };

  return {
    state,
    getMessages,
    clearMessages,
    sendChat,
  };
});
