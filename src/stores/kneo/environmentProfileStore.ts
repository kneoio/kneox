// src/stores/kneo/environmentProfileStore.ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient, { setupApiClient } from '../../api/apiClient';
import { ApiFormResponse, ApiViewPageResponse } from "../../types";

export interface Genre {
    id: string;
    name: string;
}

export interface ProfileDTO { // Consider renaming ProfileDTO to EnvironmentProfileDTO if it's specific to this store
    id: string;
    name: string;
    description: string;
    allowedGenres: Genre[];
    explicitContent: boolean;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
}

export const useEnvironmentProfileStore = defineStore('environmentProfileStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<ProfileDTO> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<ProfileDTO> | null>(null);

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const getCurrent = computed(() => {
        const defaultData: ProfileDTO = {
            id: '',
            name: '',
            description: '',
            allowedGenres: [],
            explicitContent: false,
            author: '',
            regDate: '',
            lastModifier: '',
            lastModifiedDate: ''
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

    const fetchAllEnvironmentProfiles = async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/profiles?page=${page}&size=${pageSize}`);
        if (response?.data?.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchEnvironmentProfile = async (id: string) => {
        const response = await apiClient.get(`/profiles/${id}`);
        if (response?.data?.payload) {
            apiFormResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const updateCurrent = (data: ProfileDTO, actions: any = {}) => {
        apiFormResponse.value = {
            docData: data,
            actions: actions
        };
    };

    const saveEnvironmentProfile = async (data: ProfileDTO, id?: string) => {
        const url = id ? `/profiles/${id}` : '/profiles';
        const method = id ? 'put' : 'post';

        const response = await apiClient[method](url, data);
        if (response?.data) {
            const { docData } = response.data;
            updateCurrent(docData, {});
            return docData;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const deleteEnvironmentProfile = async (id: string) => {
        const response = await apiClient.delete(`/profiles/${id}`);
        return response?.data;
    };

    return {
        apiViewResponse,
        apiFormResponse,
        setupApiClient,
        fetchAll: fetchAllEnvironmentProfiles, // Renamed internal function for clarity
        fetch: fetchEnvironmentProfile,       // Renamed internal function for clarity
        save: saveEnvironmentProfile,         // Renamed internal function for clarity
        delete: deleteEnvironmentProfile,     // Renamed internal function for clarity
        getEntries,
        getPagination,
        getCurrent,
        updateCurrent
    };
});
