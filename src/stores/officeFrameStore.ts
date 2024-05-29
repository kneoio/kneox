import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {setupApiClient} from '../apiClient';
import {ViewPage} from "../types";
import {MessageApiInjection} from 'naive-ui/lib/message/src/MessageProvider';
import {LoadingBarApiInjection} from 'naive-ui/lib/loading-bar/src/LoadingBarProvider';
import {fetchEmpl} from "../components/api/officeFrameApiClient";

interface Rl {
    reader: string;
    accessLevel: string;
}

interface Project {
    docData: {
        id: string;
        name: string;
        status: string;
        finishDate: string;
        manager: string;
        coder: string;
        tester: string;
        rls: Rl[];
    };
}

export const useOfficeFrameStore = defineStore('officeFrameStore', () => {
    const ofPage = ref<ViewPage | null>(null);
    const ofDocument = ref<Project | null>(null);

    const projectFields = computed(() => ofDocument.value?.docData || {
        id: '',
        name: '',
        status: '',
        finishDate: null,
        manager: '',
        coder: '',
        tester: '',
        rls: []
    });

    const fetchEmployers = async (
        page = 1,
        pageSize = 10,
        msgPopup: MessageApiInjection,
        loadingBar: LoadingBarApiInjection
    ) => {
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
            msgPopup.error('Failed to fetch projects:');
            throw error;
        } finally {
            loadingBar.finish();
        }
    };


    return {
        ofPage,
        ofDocument,
        setupApiClient,
        projectFields,
        fetchEmployers
    };
});
