import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {Label, LabelSave} from "../../types/officeFrameTypes";

export const useLabelStore = defineStore('labelStore', () => {
        const apiViewResponse = ref<ApiViewPageResponse<Label> | null>(null);
        const apiViewResponseCategory = ref<ApiViewPageResponse<Label> | null>(null);
        const apiFormResponse = ref<ApiFormResponse | null>(null);
        const categories = [
            {label: 'Common', value: 'common'},
            {label: 'Programming task', value: 'software_developing_task'},
        ];

        const getEntries = computed(() => {
            return apiViewResponse.value?.viewData.entries || [];
        });

        const getCategoryEntries = computed(() => {
            return apiViewResponseCategory.value?.viewData.entries || [];
        });

        const getOptions = computed(() => {
            return getCategoryEntries.value.map(doc => ({
                label: doc.localizedName.ENG,
                value: doc.id,
                color: doc.color
            }));
        });

        const getCurrent = computed(() => {
            const defaultData = {
                id: '',
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

        const fetchCategoryLabels = async (group: string) => {
            const response = await apiClient.get(`/labels/only/category/${group}`);
            if (response && response.data && response.data.payload) {
                apiViewResponseCategory.value = response.data.payload;
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
            apiViewResponseCategory,
            setupApiClient,
            getEntries,
            categories,
            fetchAll: fetchLabels,
            fetch: fetchLabel,
            fetchCategoryLabels,
            save,
            getOptions,
            getPagination,
            getCurrent
        };
    })
;