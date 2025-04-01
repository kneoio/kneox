import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {Brand, SoundFragmentSave} from "../../types/kneoBroadcasterTypes";

export const useBrandStore = defineStore('brandStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<Brand> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<Brand> | null>(null);

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const getCurrent = computed(() => {
        const defaultData = {
            id: '',
            author: 0,
            regDate: '',
            lastModifier: '',
            lastModifiedDate: '',
            title: '',
            status: 0,
            type: 'SONG',
            source: 'LOCAL_DISC'
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

    const fetchRadioStations = async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/kneo/radiostations?page=${page}&size=${pageSize}`, {});
        if (response?.data?.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchRadioStation = async (id: string) => {
        const response = await apiClient.get(`/kneo/radiostations/${id}`);
        if (response?.data?.payload) {
            apiFormResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchStatus = async () => {
        const response = await apiClient.get(`/radio/status`, {});
        if (response?.data?.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const updateCurrent = (data: Brand, actions: any = {}) => {
        apiFormResponse.value = {
            docData: data,
            actions: actions
        };
    };

    const save = async (data: SoundFragmentSave, id?: string) => {
        const response = await apiClient.post(`/soundfragments/${id}`, data);
        if (response?.data) {
            const {docData} = response.data;
            updateCurrent(docData, {});
            return docData;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    return {
        apiViewResponse,
        apiFormResponse,
        setupApiClient,
        fetchAll: fetchRadioStations,
        fetch: fetchRadioStation,
        fetchStatus,
        save,
        getEntries,
        getPagination,
        getCurrent,
    };
});