import {defineStore} from 'pinia';
import {ref, computed} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {useLoadingBar, useMessage} from "naive-ui";
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {Organization} from "../../types/officeFrameTypes";

export const useOrganizationStore = defineStore('organizationStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<Organization> | null>(null);
    const apiFormResponse = ref<ApiFormResponse | null>(null);
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar();

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const getPagination = computed(() => {
        return {
            page: apiViewResponse.value?.viewData.pageNum,
            pageSize: apiViewResponse.value?.viewData.pageSize,
            pageCount: apiViewResponse.value?.viewData.maxPage,
            itemCount: apiViewResponse.value?.viewData.count,
            showSizePicker: true,
            pageSizes: [10, 20, 50]
        }
    });

    const fetchOrganizations = async (page = 1, pageSize = 10) => {
        try {
            loadingBar.start();
            const response = await apiClient.get(`/orgs?page=${page}&size=${pageSize}`);
            if (response && response.data) {
                apiViewResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to fetch organizations: ' + (error.message || 'Unknown error'));
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    const fetch = async (id: string) => {
        try {
            loadingBar.start();
            const response = await apiClient.get(`/organizations/${id}`);
            if (response && response.data) {
                console.log(response.data);
                apiFormResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to fetch: ' + (error.message || 'Unknown error'));
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    const save = async () => {
        try {
            loadingBar.start();
            if (apiFormResponse.value) {
                const id = null;
                const response = await apiClient.put(`/organizations/${id}`, apiFormResponse.value);
                if (response && response.data.payload) {
                    apiFormResponse.value = response.data.payload.docData;
                    msgPopup.success('Project saved successfully');
                } else {
                    throw new Error('Invalid API response structure');
                }
            } else {
                throw new Error('No project data to save');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to save project: ' + (error.message || 'Unknown error'));
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    return {
        apiViewResponse,
        setupApiClient,
        fetchOrganizations,
        fetch,
        save,
        getEntries,
        getPagination
    };
});
