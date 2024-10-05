import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {Task, TaskSave} from "../../types/projectTypes";

export const useTaskStore = defineStore('taskStore', () => {
        const apiViewResponse = ref<ApiViewPageResponse<Task> | null>(null);
        const apiFormResponse = ref<ApiFormResponse<Task> | null>(null);

        const getEntries = computed(() => {
            return apiViewResponse.value?.viewData.entries || [];
        });

        const getCurrent = computed(() => {
            const defaultData = {
                regDate: '',
                lastModifiedDate: '',
                regNumber: '',
                identifier: '',
                labels: [],
                status: 1
            };

            const docData = apiFormResponse.value?.docData || defaultData;
            return {
                ...docData,
                labels: docData.labels.map((label) => label.id)
            };
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

    const statusTypeMap: Record<number, 'error' | 'info' | 'success' | 'warning' | 'default'> = {
        0: 'default',
        100: 'info',
        101: 'warning',
        102: 'success',
        103: 'success',
        104: 'default',
        105: 'error'
    };

    const fetchTasks = async (page = 1, pageSize = 10) => {
            const response = await apiClient.post(`/tasks?page=${page}&size=${pageSize}`, {});
            if (response && response.data && response.data.payload) {
                apiViewResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        };

        const fetchTask = async (id: string) => {
            const response = await apiClient.get(`/tasks/${id}`);
            if (response && response.data && response.data.payload) {
                apiFormResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        };

        const updateCurrent = (data: Task, actions: any = {}) => {
            apiFormResponse.value = {
                docData: data,
                actions: actions
            };
        };

        const save = async (data: TaskSave, id?: string) => {
            const response = await apiClient.post(`/tasks/${id}`, data);
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
            fetchAll: fetchTasks,
            fetch: fetchTask,
            save,
            getEntries,
            getPagination,
            getCurrent,
            statusTypeMap
        };
    })
;