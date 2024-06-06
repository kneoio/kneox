import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { setupApiClient } from '../apiClient';
import { ViewPage } from "../types";
import { fetchEmpl } from "../components/api/officeFrameApiClient";
import { useLoadingBar, useMessage } from "naive-ui";
import {Employer} from "../types/ofTypes";

export const useOfficeFrameStore = defineStore('officeFrameStore', () => {
    const ofPage = ref<ViewPage | null>(null);
    const ofDocument = ref<Employer | null>(null);
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar();

    const fields = computed(() => ofDocument.value?.docData || {
        id: '',
        name: ''
    });

    const fetchEmployers = async (page = 1, pageSize = 10) => {
        try {
            loadingBar.start();
            const response = await fetchEmpl(page, pageSize);
            if (response && response.payload) {
                console.log(response.payload);
                ofPage.value = response.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to fetch employers: ' + (error.message || 'Unknown error'));
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
