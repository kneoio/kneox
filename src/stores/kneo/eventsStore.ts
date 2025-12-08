import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient from '../../api/apiClient';
import type { ApiFormResponse, ApiViewPageResponse } from "../../types";
import type { Event, EventSave } from "../../types/kneoBroadcasterTypes";

export const useEventsStore = defineStore('eventsStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<Event> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<Event> | null>(null);

    const getEntries = computed(() => apiViewResponse.value?.viewData?.entries || []);
    const getCurrent = computed(() => apiFormResponse.value?.docData || {
        id: '',
        author: '',
        regDate: '',
        lastModifier: '',
        lastModifiedDate: '',
        brandId: '',
        type: '',
        timestampEvent: '',
        description: '',
        priority: '',
        actions: [],
    } as Event);

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

    const fetchEvents = async (page = 1, pageSize = 10) => {
        try {
            const response = await apiClient.get(`/events?page=${page}&size=${pageSize}`);
            if (!response?.data?.payload) throw new Error('Invalid API response for events');
            apiViewResponse.value = response.data.payload;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    };

    const fetchEvent = async (id: string) => {
        const response = await apiClient.get(`/events/${id}`);
        if (!response?.data?.payload) throw new Error('Invalid API response for a single event');
        apiFormResponse.value = response.data.payload;
    };

    const saveEvent = async (data: EventSave, id: string | null) => {
        const response = await apiClient.post(`/events/${id || ''}`, data);
        if (!response?.data) throw new Error('Invalid API response');
        apiFormResponse.value = response.data;
        return apiFormResponse.value;
    };
   

    const deleteEvent = async (id: string) => {
        return await apiClient.delete(`/events/${id}`);
    };

    const fetchAccessList = async (id: string) => {
        const response = await apiClient.get(`/events/${id}/access`);
        if (!response?.data) throw new Error('Invalid API response');
        return response.data;
    };

    return {
        apiViewResponse,
        apiFormResponse,
        getEntries,
        getCurrent,
        getPagination,
        fetchEvents,
        fetchEvent,
        saveEvent,
        deleteEvent,
        fetchAccessList,
    };
});
