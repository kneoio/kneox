import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {Memory} from "../../types/kneoBroadcasterTypes";

export const useMemoryStore = defineStore('memoryStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<Memory> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<Memory> | null>(null);

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const getBrandOptions = computed(() => {
        const entries = apiViewResponse.value?.viewData.entries || [];
        const uniqueBrands = [...new Set(entries.map(entry => entry.brand).filter(brand => brand && brand.trim() !== ''))];
        
        // Add some common fallback brands if no data exists
        const fallbackBrands = ['mixpla', 'radio', 'podcast', 'music'];
        const allBrands = [...new Set([...uniqueBrands, ...fallbackBrands])];
        
        return allBrands.map(brand => ({ label: brand, value: brand }));
    });

    const getCurrent = computed(() => {
        const defaultData: Memory = {
            id: '',
            author: 0,
            regDate: '',
            lastModUser: 0,
            lastModifiedDate: '',
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


    const deleteMemory = async (id: string) => {
        await apiClient.delete(`/memories/${id}`);
    };

    const fetchAccessList = async (id: string) => {
        const response = await apiClient.get(`/memories/${id}/access`);
        if (!response?.data) throw new Error('Invalid API response');
        return response.data;
    };

    async function initListenersMemory(brand: string) {
        const response = await apiClient.post(`/api/memories/listeners/${brand}`);
        apiFormResponse.value = response.data;
        return response.data;
    }

    async function triggerEvent(brand: string, content: any, memoryType: string) {
        const response = await apiClient.post('/memories/events', {
            brand,
            content,
            memoryType
        });
        return response.data;
    };

    async function saveMemory(data: any, id?: string) {
        const response = await apiClient.post(`/memories/${id || ''}`, data);
        if (response?.data?.payload) {
            apiFormResponse.value = response.data.payload;
        }
        return response.data;
    }

    return {
        apiViewResponse,
        apiFormResponse,
        setupApiClient,
        getEntries,
        getBrandOptions,
        getCurrent,
        getPagination,
        fetchAll: fetchMemories,
        fetchMemory,
        deleteMemory,
        fetchAccessList,
        initListenersMemory,
        triggerEvent,
        save: saveMemory
    };
});