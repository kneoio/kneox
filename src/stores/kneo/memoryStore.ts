import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {Memory, MemorySave} from "../../types/kneoBroadcasterTypes";

export const useMemoryStore = defineStore('memoryStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<Memory> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<Memory> | null>(null);

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const getCurrent = computed(() => {
        const defaultData: Memory = {
            id: '',
            author: 0,
            regDate: '',
            lastModUser: 0,
            lastModDate: '',
            brand: '',
            memoryType: '',
            content: {},
            archived: false
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

    const fetchMemories = async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/memories?page=${page}&size=${pageSize}`, {});
        if (response?.data?.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchMemory = async (id: string) => {
        const response = await apiClient.get(`/memories/${id}`);
        if (response?.data?.payload) {
            apiFormResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const updateCurrent = (data: Memory, actions: any = {}) => {
        apiFormResponse.value = {
            docData: data,
            actions: actions
        };
    };

    const deleteMemory = async (id: string) => {
        await apiClient.delete(`/memories/${id}`);
    };

    const fetchAccessList = async (id: string) => {
        const response = await apiClient.get(`/memories/${id}/access`);
        if (!response?.data) throw new Error('Invalid API response');
        return response.data;
    };

    const initListenersMemory = async (brand: string) => {
        const response = await apiClient.put(`/memories/init-listeners/${brand}`);
        if (!response?.data) throw new Error('Invalid API response');
        return response.data;
    };

    return {
        apiViewResponse,
        apiFormResponse,
        setupApiClient,
        fetchAll: fetchMemories,
        fetch: fetchMemory,
        delete: deleteMemory,
        getEntries,
        getPagination,
        getCurrent,
        fetchAccessList,
        initListenersMemory,
    };
});