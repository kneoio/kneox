import { defineStore } from 'pinia';
import { ref } from 'vue';

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

    const dummyApiRequest = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`Response to "${prompt}"`);
            }, 1000);
        });
    };

    return {
        chats,
        currentChat,
        addMessage,
        saveChat,
        dummyApiRequest,
    };
});