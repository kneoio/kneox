import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {Organization, Position, PositionSave} from "../../types/officeFrameTypes";

export const usePositionStore = defineStore('positionStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<Position> | null>(null);
    const apiFormResponse = ref<ApiFormResponse | null>(null);

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const getCurrent = computed(() => {
        const defaultData = {
            regDate: '',
            lastModifiedDate: '',
            identifier: ''
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

    const getOptions = computed(() => {
        return getEntries.value.map(position => ({
            label: position.localizedName.ENG,
            value: position.id
        }));
    });

    const fetchPositions = async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/positions?page=${page}&size=${pageSize}`);
        if (response && response.data && response.data.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchPosition = async (id: string) => {
        const response = await apiClient.get(`/positions/${id}`);
        if (response && response.data && response.data.payload) {
            apiFormResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const updateCurrent = (data: Organization, actions: any = {}) => {
        apiFormResponse.value = {
            docData: data,
            actions: actions
        };
    };

    const save = async (data: PositionSave, id?: string) => {
        const response = await apiClient.post(`/positions/${id}`, data);
        if (response && response.data) {
            const { docData } = response.data;
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
        getOptions,
        fetchAll: fetchPositions,
        fetch: fetchPosition,
        save,
        getEntries,
        getPagination,
        getCurrent
    };
});