import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { setupApiClient } from '../apiClient';
import {fetchEmpl, fetchOrgs} from "../api/officeFrameApiClient";
import { useLoadingBar, useMessage } from "naive-ui";
import {Employer, ViewPage} from "../types/ofTypes";

export const useOfficeFrameStore = defineStore('officeFrameStore', () => {
    const organizationPage = ref<ViewPage | null>(null);
    const ofPage = ref<ViewPage | null>(null);
    const ofDocument = ref<Employer | null>(null);
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar();

    const fields = computed(() => ofDocument.value?.docData || {
        id: '',
        name: ''
    });

    const fetchOrganizations = async (page = 1, pageSize = 10) => {
        try {
            loadingBar.start();
            const response = await fetchOrgs(page, pageSize);
            if (response && response.payload) {
                console.log(response.payload);
                organizationPage.value = response.payload;
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

    // New getter to return employee options
    const employeeOptions = computed(() => {
        return ofPage.value?.viewData?.entries.map(entry => ({
            label: entry.name,
            value: entry.userId
        })) || [];
    });

    return {
        organizationPage,
        ofPage,
        ofDocument,
        setupApiClient,
        fields,
        fetchOrganizations,
        fetchEmployers,
        employeeOptions  // Returning the new getter
    };
});
