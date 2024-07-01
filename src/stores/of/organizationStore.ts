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

            if (response && response.data && response.data.payload) {
                apiFormResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            console.error('Fetch error:', error);
            msgPopup.error(`Failed to fetch: ${error.message || 'Unknown error'}`);
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    const updateCurrent = (data: Organization, actions: any = {}) => {
        apiFormResponse.value = {
            docData: data,
            actions: actions
        };
    };

    const save = async (data: Organization) => {
        try {
            loadingBar.start();
            const response = await apiClient.post('/orgs', data);

            if (response && response.data && response.data.payload) {
                const { docData, actions } = response.data.payload;
                updateCurrent(docData, actions);
                msgPopup.success('Organization saved successfully');
                return docData;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to save organization: ' + (error.message || 'Unknown error'));
            throw error;
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