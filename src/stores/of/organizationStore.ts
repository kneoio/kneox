import {defineStore} from 'pinia';
import {ref, computed} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import { useLoadingBar, useMessage} from "naive-ui";
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

    const getCurrent = computed(() => {
        const defaultData = {
            regDate: '',
            lastModifiedDate: '',
            identifier: '',
            bizID: '',
            localizedName: {},
            orgCategory: {
                localizedName: ''
            },
            status: '',
            rank: 0
        };
        return apiFormResponse.value?.docData || defaultData;
    });

    const getPagination = computed(() => {
        if (!apiViewResponse.value) {
            return {
                page: 1,
                pageSize: 10,
                itemCount: 0,
                pageCount: 1,
                showSizePicker: true,
                pageSizes: [10, 20, 30, 40]
            };
        }

        const { viewData } = apiViewResponse.value;
        return {
            page: viewData.pageNum,
            pageSize: viewData.pageSize,
            itemCount: viewData.count,
            pageCount: viewData.maxPage,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };
    });

    const fetchOrganizations = async (page = 1, pageSize = 10) => {
        try {
            loadingBar.start();
            const response = await apiClient.get(`/orgs?page=${page}&size=${pageSize}`);
            if (response && response.data && response.data.payload) {
                apiViewResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to fetch organizations: ' + (error.message || 'Unknown error'));
        } finally {
            loadingBar.finish();
        }
    };

    const fetchOrg = async (id: string) => {
        try {
            loadingBar.start();
            const response = await apiClient.get(`/orgs/${id}`);

            if (response && response.data) {
                console.log('API Response:', response.data);

                if (response.data.payload) {
                    apiFormResponse.value = response.data.payload;
                    console.log('apiFormResponse.value set to:', apiFormResponse.value);
                } else {
                    throw new Error('Missing payload in API response');
                }
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();

            if (error instanceof Error) {
                console.error('Fetch error:', error.message);
                msgPopup.error(`Failed to fetch: ${error.message}`);
            } else {
                console.error('Unknown fetch error:', error);
                msgPopup.error('Failed to fetch: Unknown error');
            }

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
                const response = await apiClient.put(`/orgs/${id}`, apiFormResponse.value);
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
        } finally {
            loadingBar.finish();
        }
    };

    return {
        apiViewResponse,
        apiFormResponse,
        setupApiClient,
        fetchOrganizations,
        fetch: fetchOrg,
        save,
        getEntries,
        getPagination,
        getCurrent
    };
});