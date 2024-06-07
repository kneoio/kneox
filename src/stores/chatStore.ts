import { defineStore } from 'pinia';
import { ref } from 'vue';

interface Prompt {
    id: number;
    text: string;
}

interface Chat {
    id: number;
    content: string;
    prompts: Prompt[];
}

export const useChatStore = defineStore('chatStore', () => {
    const chats = ref<Chat[]>([]);
    const currentChat = ref<Chat>({
        id: Date.now(),
        content: '',
        prompts: [],
    });

    const addPrompt = (prompt: string) => {
        currentChat.value.prompts.push({ id: Date.now(), text: prompt });
    };

    const addContent = (content: string) => {
        currentChat.value.content += content;
    };

    const saveChat = () => {
        chats.value.push({ ...currentChat.value, id: Date.now() });
        currentChat.value.content = '';
        currentChat.value.prompts = [];
    };

    const dummyApiRequest = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`Bot: Response to "${prompt}"`);
            }, 1000);
        });
    };

    return {
        chats,
        currentChat,
        addPrompt,
        addContent,
        saveChat,
        dummyApiRequest,
    };
});
