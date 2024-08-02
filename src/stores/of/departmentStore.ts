import { defineStore } from 'pinia';
import {computed, ref} from 'vue';
import apiClient, { setupApiClient } from '../../api/apiClient';
import {PaginationInfo, useLoadingBar, useMessage} from "naive-ui";
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {EmployeeSave, Organization} from "../../types/officeFrameTypes";

export const useDepartmentStore = defineStore('departmentStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse | null>(null);
    const apiFormResponse = ref<ApiFormResponse | null>(null);
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar();

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
            name: '',
            userId: '',
            position: {},
            rank: 0,
            phone: ''
        };
        return apiFormResponse.value?.docData || defaultData;
    });

    const getPagination = computed<PaginationInfo>(() => {
        const page = apiViewResponse.value?.viewData.pageNum ?? 1;
        const pageSize = apiViewResponse.value?.viewData.pageSize ?? 10;
        const itemCount = apiViewResponse.value?.viewData.count;
        const pageCount = apiViewResponse.value?.viewData.maxPage ?? 1;

        return {
            startIndex: 0,
            endIndex: 0,
            page,
            pageSize,
            pageCount,
            itemCount,
        };
    });

    const getOptions = computed(() => {
        return getEntries.value.map(position => ({
            label: position.localizedName.ENG,
            value: position.id
        }));
    });

    const fetchDepartments = async (page = 1, pageSize = 10) => {
        try {
            loadingBar.start();
            const response = await apiClient.get(`/departments?page=${page}&size=${pageSize}`);
            if (response && response.data) {
                console.log(response.data);
                apiViewResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to fetch employees: ' + (error.message || 'Unknown error'));
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    const fetchDepartment = async (employeeId: string) => {
        try {
            loadingBar.start();
            const response = await apiClient.get(`/departments/${employeeId}`);
            if (response && response.data) {
                apiFormResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to fetch employee: ' + (error.message || 'Unknown error'));
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    const save = async (data: EmployeeSave, id?: string) => {
        const response = await apiClient.post(`/departments/${id}`, data);
        if (response && response.data) {
            const {docData} = response.data;
            updateCurrent(docData, {});
            return docData;
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

    return {
        getEntries,
        getCurrent,
        getPagination,
        apiViewResponse,
        fetchAll: fetchDepartments,
        fetch: fetchDepartment,
        getOptions,
        save,
        setupApiClient,
    };
});
