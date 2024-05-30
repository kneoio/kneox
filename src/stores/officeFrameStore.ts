import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {setupApiClient} from '../apiClient';
import {ViewPage} from "../types";
import {fetchEmpl} from "../components/api/officeFrameApiClient";
import {useLoadingBar, useMessage} from "naive-ui";

interface Employer {
    docData: {
        id: string;
        author: string;
        regDate: string;
        lastModifier: string;
        lastModifiedDate: string;
        name: string;
        userId: number;
        position: {};
        rank: number;
        phone: string;
    };
}

export const useOfficeFrameStore = defineStore('officeFrameStore', () => {
    const ofPage = ref<ViewPage | null>(null);
    const ofDocument = ref<Employer | null>(null);

    const fields = computed(() => ofDocument.value?.docData || {
        id: '',
        name: ''
    });

    const fetchEmployers = async (
        page = 1,
        pageSize = 10
    ) => {
        const msgPopup = useMessage();
        const loadingBar = useLoadingBar();
        try {
            loadingBar.start();
            const response = await fetchEmpl(page, pageSize);
            if (response && response.payload) {
                ofPage.value = response.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error) {
            loadingBar.error();
            msgPopup.error('Failed to fetch employers:');
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    return {
        ofPage,
        ofDocument,
        setupApiClient,
        fields,
        fetchEmployers
    };
});
