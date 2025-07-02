import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient from '../../api/apiClient';
import type { ApiFormResponse, ApiViewPageResponse } from "../../types";
import type {  ListenerEntry, ListenerSave } from "../../types/kneoBroadcasterTypes";

export const useListenersStore = defineStore('listenersStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<ListenerEntry> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<ListenerEntry> | null>(null);

    const getEntries = computed(() => apiViewResponse.value?.viewData.entries || []);
    const getCurrent = computed(() => apiFormResponse.value?.docData || {
        id: '',
        author: '',
        regDate: '',
        lastModifier: '',
        lastModifiedDate: '',
        localizedName: { en: '' },
        userId: 0,
        country: '',
        nickName: { en: '' },
        slugName: '',
        archived: 0,
    } as ListenerEntry);

    const getPagination = computed(() => {
        if (!apiViewResponse.value?.viewData) {
            return {
                page: 1,
                pageSize: 10,
                itemCount: 0,
                pageCount: 1,
                showSizePicker: true,
                pageSizes: [10, 20, 30, 40]
            };
        }

        return {
            page: apiViewResponse.value.viewData.pageNum,
            pageSize: apiViewResponse.value.viewData.pageSize,
            itemCount: apiViewResponse.value.viewData.count,
            pageCount: apiViewResponse.value.viewData.maxPage,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };
    });

    const fetchListeners = async (brandName: string, page = 1, pageSize = 10) => {
        try {
            const response = await apiClient.get(`/listeners/available-listeners?brand=${brandName}&page=${page}&size=${pageSize}`);
            if (!response?.data?.payload) throw new Error('Invalid API response for listeners');
            apiViewResponse.value = response.data.payload;
        } catch (error) {
            console.error('Failed to fetch listeners:', error);
            apiViewResponse.value = null;
        }
    };

    const fetchAllListeners = async (page = 1, pageSize = 10) => {
        try {
            const response = await apiClient.get(`/listeners?page=${page}&size=${pageSize}`);
            if (!response?.data?.payload) throw new Error('Invalid API response for all listeners');
            apiViewResponse.value = response.data.payload;
        } catch (error) {
            console.error('Failed to fetch all listeners:', error);
            apiViewResponse.value = null;
        }
    };

    const fetchListener = async (id: string) => {
        try {
            const response = await apiClient.get(`/listeners/${id}`);
            if (!response?.data?.payload) throw new Error('Invalid API response for a single listener');
            apiFormResponse.value = response.data.payload;
        } catch (error) {
            console.error(`Failed to fetch listener ${id}:`, error);
            apiFormResponse.value = null;
        }
    };

    const saveListener = async (data: ListenerSave, id: string | null) => {
        try {
            const url = id ? `/listeners/${id}` : '/listeners';
            const response = await apiClient.post(url, data);
            if (!response?.data?.payload) throw new Error('Invalid API response when saving listener');
            apiFormResponse.value = response.data.payload;
            if (apiViewResponse.value?.viewData) {
                 await fetchListeners(apiViewResponse.value.viewData.entries[0]?.slugName || '', apiViewResponse.value.viewData.pageNum, apiViewResponse.value.viewData.pageSize);
            }
            return apiFormResponse.value;
        } catch (error) {
            console.error('Failed to save listener:', error);
            throw error;
        }
    };

    return {
        apiViewResponse,
        apiFormResponse,
        getEntries,
        getCurrent,
        getPagination,
        fetchListeners,
        fetchAllListeners,
        fetchListener,
        saveListener,
    };
});
