import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {Label, LabelSave} from "../../types/officeFrameTypes";

export const useLabelStore = defineStore('labelStore', () => {
        const apiViewResponse = ref<ApiViewPageResponse<Label> | null>(null);
        const apiFormResponse = ref<ApiFormResponse | null>(null);
        const categories = [
            {label: 'Mandarin', value: 'CHN'},
            {label: 'Spanish', value: 'SPA'},
            {label: 'English', value: 'ENG'},
            {label: 'Hindi', value: 'HIN'},
            {label: 'Bengali', value: 'BEN'},
        ];

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

        const fetchLabels = async (page = 1, pageSize = 10) => {
            const response = await apiClient.get(`/labels?page=${page}&size=${pageSize}`);
            if (response && response.data && response.data.payload) {
                apiViewResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        };

        const fetchLabel = async (id: string) => {
            const response = await apiClient.get(`/labels/${id}`);
            if (response && response.data && response.data.payload) {
                apiFormResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        };

        const updateCurrent = (data: Label, actions: any = {}) => {
            apiFormResponse.value = {
                docData: data,
                actions: actions
            };
        };

        const save = async (data: LabelSave, id?: string) => {
            const response = await apiClient.post(`/labels/${id}`, data);
            if (response && response.data) {
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
            categories,
            fetchAll: fetchLabels,
            fetch: fetchLabel,
            save,
            getEntries,
            getPagination,
            getCurrent
        };
    })
;