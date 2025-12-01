import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {Script, ScriptSave} from "../../types/kneoBroadcasterTypes";

export const useScriptStore = defineStore('scriptStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<Script> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<Script> | null>(null);

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const getCurrent = computed(() => {
        const defaultData: {
            id: string;
            author: string;
            regDate: string;
            lastModifier: string;
            lastModifiedDate: string
        } = {
            id: '',
            author: '',
            regDate: '',
            lastModifier: '',
            lastModifiedDate: '',
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

        const {viewData} = apiViewResponse.value;
        return {
            page: viewData.pageNum,
            pageSize: viewData.pageSize,
            itemCount: viewData.count,
            pageCount: viewData.maxPage,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };
    });

    const fetchScripts = async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/scripts?page=${page}&size=${pageSize}`, {});
        if (response?.data?.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchSharedScripts = async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/scripts/shared?page=${page}&size=${pageSize}`, {});
        if (response?.data?.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchScript = async (id: string) => {
        const response = await apiClient.get(`/scripts/${id}`);
        if (response?.data?.payload) {
            apiFormResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const updateCurrent = (data: Script, actions: any = {}) => {
        apiFormResponse.value = {
            docData: data,
            actions: actions
        };
    };

    const save = async (data: ScriptSave, id: string | null) => {
        const response = await apiClient.post(`/scripts/${id || ''}`, data);        
        if (response?.data) {
            const {docData} = response.data;
            updateCurrent(docData, {});
            return docData;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const deleteScript = async (id: string) => {
        await apiClient.delete(`/scripts/${id}`);
    };

    const fetchAvailableScripts = async (brandName: string, page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/scripts/available-scripts?brand=${brandName}&page=${page}&size=${pageSize}`);
        if (response?.data?.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchAccessList = async (id: string) => {
        const response = await apiClient.get(`/scripts/${id}/access`);
        if (!response?.data) throw new Error('Invalid API response');
        return response.data;
    };

    return {
        apiViewResponse,
        apiFormResponse,
        setupApiClient,
        fetchAll: fetchScripts,
        fetchAllShared: fetchSharedScripts,
        fetchAvailableScripts,
        fetch: fetchScript,
        save,
        deleteScript,
        fetchAccessList,
        getEntries,
        getPagination,
        getCurrent,
    };
});
