import { defineStore } from 'pinia';
import {computed, ref} from 'vue';
import apiClient, { setupApiClient } from '../../api/apiClient';
import {PaginationInfo, useLoadingBar, useMessage} from "naive-ui";
import {ApiFormResponse, ApiViewPageResponse} from "../../types";

export const useEmployeeStore = defineStore('employeeStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse | null>(null);
    const apiFormResponse = ref<ApiFormResponse | null>(null);
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar();

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const getCurrent = computed(() => {
        const defaultData = {
            regDate: '',
            lastModifiedDate: '',
            identifier: '',
            bizID: '',
            localizedName: {},
            orgCategory: {
                localizedName: ''
            },
            status: '',
            rank: 0
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

    const fetchEmployees = async (page = 1, pageSize = 10) => {
        try {
            loadingBar.start();
            const response = await apiClient.get(`/employees?page=${page}&size=${pageSize}`);
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

    const fetchEmployee = async (employeeId: string) => {
        try {
            loadingBar.start();
            const response = await apiClient.get(`/employees/${employeeId}`);
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

    const save = async () => {
        try {
            /*loadingBar.start();
            if (doc.value) {
                const response = await apiClient.put<ApiResponse>(`/employees/${doc.value.docData.id}`, doc.value.docData);
                if (response && response.payload) {
                    doc.value = response.payload;
                    msgPopup.success('Employee saved successfully');
                } else {
                    throw new Error('Invalid API response structure');
                }
            } else {
                throw new Error('No employee data to save');
            }*/
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to save employee: ' + (error.message || 'Unknown error'));
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    return {
        getEntries,
        getCurrent,
        getPagination,
        apiViewResponse,
        fetchEmployees,
        fetchEmployee,
        save,
        setupApiClient,
    };
});
