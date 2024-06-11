import { defineStore } from 'pinia';
import { ref} from 'vue';
import apiClient, { setupApiClient } from '../../api/apiClient';
import { useLoadingBar, useMessage } from "naive-ui";
import {ApiFormResponse, ApiViewPageResponse} from "../../types";

export const useEmployeeStore = defineStore('employeeStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse | null>(null);
    const apiFormResponse = ref<ApiFormResponse | null>(null);
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar();

   /* const employeeOptions = computed(() => {
        return employeePage.value?.data?.entries.map(entry => ({
            label: entry.name,
            value: entry.userId
        })) || [];
    });*/

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
        apiViewResponse,
        fetchEmployees,
        fetchEmployee,
        save,
        setupApiClient,
    };
});
