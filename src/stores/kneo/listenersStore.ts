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
        telegramName: '',
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
            const response = await apiClient.get(`listeners/available-listeners?brand=${brandName}&page=${page}&size=${pageSize}`);
            if (!response?.data?.payload) throw new Error('Invalid API response for listeners');
            apiViewResponse.value = response.data.payload;
        } catch (error) {
            console.error('Failed to fetch listeners:', error);
            apiViewResponse.value = null;
        }
    };

    const fetchAllListeners = async (page = 1, pageSize = 10, searchQuery = '', filters: {country?: string} = {}) => {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', pageSize.toString());
            if (searchQuery) {
                params.append('q', searchQuery);
            }
            if (filters.country) {
                params.append('country', filters.country);
            }
            const baseUrl = searchQuery ? 'listeners/search' : 'listeners';
            const url = `${baseUrl}?${params.toString()}`;
            const response = await apiClient.get(url);
            if (!response?.data?.payload) throw new Error('Invalid API response for all listeners');
            apiViewResponse.value = response.data.payload;
        } catch (error) {
            console.error('Failed to fetch all listeners:', error);
            apiViewResponse.value = null;
        }
    };

    const fetchAvailableListeners = async (brandName: string, page = 1, pageSize = 10) => {
        try {
            const response = await apiClient.get(`listeners/available-listeners?brand=${brandName}&page=${page}&size=${pageSize}`);
            if (!response?.data?.payload) throw new Error('Invalid API response for available listeners');
            apiViewResponse.value = response.data.payload;
        } catch (error) {
            console.error('Failed to fetch available listeners:', error);
            apiViewResponse.value = null;
            throw error;
        }
    };

    const fetchListener = async (id: string) => {
        const response = await apiClient.get(`listeners/${id}`);
        if (!response?.data?.payload) throw new Error('Invalid API response for a single listener');
        apiFormResponse.value = response.data.payload;
    };

    const saveListener = async (data: ListenerSave, id: string | null) => {
        const response = await apiClient.post(`listeners/${id || ''}`, data);
        if (!response?.data) throw new Error('Invalid API response');
        apiFormResponse.value = response.data;
        return apiFormResponse.value;
    };

    const deleteListener = async (id: string) => {
        await apiClient.delete(`listeners/${id}`);
    };

    const fetchAccessList = async (id: string) => {
        const response = await apiClient.get(`listeners/${id}/access`);
        if (!response?.data) throw new Error('Invalid API response');
        return response.data;
    };

    return {
        apiViewResponse,
        apiFormResponse,
        getEntries,
        getCurrent,
        getPagination,
        fetchListeners,
        fetchAllListeners,
        fetchAvailableListeners,
        fetchListener,
        saveListener,
        deleteListener,
        fetchAccessList,
    };
});
