import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {AiAgent, AiAgentSave} from "../../types/kneoBroadcasterTypes";

export const useAiAgentStore = defineStore('aiAgentStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<AiAgent> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<AiAgent> | null>(null);

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

    const fetchAiAgents = async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/aiagents?page=${page}&size=${pageSize}`, {});
        if (response?.data?.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchAiAgent = async (id: string) => {
        const response = await apiClient.get(`/aiagents/${id}`);
        if (response?.data?.payload) {
            apiFormResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const updateCurrent = (data: AiAgent, actions: any = {}) => {
        apiFormResponse.value = {
            docData: data,
            actions: actions
        };
    };

    const save = async (data: AiAgentSave, id?: string) => {
        const response = await apiClient.post(`/aiagents/${id}`, data);
        if (response?.data) {
            const {docData} = response.data;
            updateCurrent(docData, {});
            return docData;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const deleteAiAgent = async (id: string) => {
        await apiClient.delete(`/aiagents/${id}`);
    };

    return {
        apiViewResponse,
        apiFormResponse,
        setupApiClient,
        fetchAll: fetchAiAgents,
        fetch: fetchAiAgent,
        save,
        deleteAiAgent,
        getEntries,
        getPagination,
        getCurrent,
    };
});