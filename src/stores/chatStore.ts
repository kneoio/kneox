import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../api/apiClient'; // Assuming you have this set up similarly to the organizationStore example

interface Message {
    id: number;
    sender: string;
    text: string;
}

interface Chat {
    id: number;
    messages: Message[];
}

export const useChatStore = defineStore('chatStore', () => {
    const chats = ref<Chat[]>([]);
    const currentChat = ref<Chat>({
        id: Date.now(),
        messages: [],
    });

    const addMessage = (sender: string, text: string) => {
        currentChat.value.messages.push({
            id: Date.now(),
            sender,
            text,
        });
    };

    const saveChat = () => {
        chats.value.push({ ...currentChat.value });
        currentChat.value = {
            id: Date.now(),
            messages: [],
        };
    };

    const sendChatRequest = async (prompt: string): Promise<string> => {
        try {
            const response = await apiClient.post('/ai/chat', {
                promptText: prompt
            });

            if (response && response.data) {
                return response.data; // Assuming the API returns the response text directly
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error) {
            console.error('Error sending chat request:', error);
            throw error;
        }
    };

    return {
        chats,
        currentChat,
        addMessage,
        saveChat,
        sendChatRequest,
    };
});