import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse, Project} from "../types";
import { useLoadingBar, useMessage } from 'naive-ui';

export const useProjectStore = defineStore('projectsStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<Project> | null>(null);
    const apiFormResponse = ref<ApiFormResponse | null>(null);
    const project = ref<Project | null>(null);
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar();

    const getCurrentProject = computed(() => apiFormResponse.value?.payload.docData || {
        id: '',
        name: '',
        status: '',
        finishDate: '',
        manager: '',
        coder: '',
        tester: '',
        rls: [],
        primaryLang: ''
    });

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const fetchProjects = async (page = 1, pageSize = 10 ) => {
        try {
            loadingBar.start();
            const response = await apiClient.get(`/projects?page=${page}&size=${pageSize}`);
            if (response && response.data) {
                apiViewResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to fetch projects: ' + (error.message || 'Unknown error'));
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    const fetchProject = async (projectId: string) => {
        try {
            loadingBar.start();
            const response = await apiClient.get(`/projects/${projectId}`);
            if (response && response.data) {
                console.log(response.data);
                apiFormResponse.value = response.data.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to fetch project: ' + (error.message || 'Unknown error'));
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    const saveProject = async () => {
        try {
            loadingBar.start();
            if (apiFormResponse.value) {
                const response = await apiClient.put(`/projects/${project.value?.id}`, apiFormResponse.value);
                if (response && response.data.payload) {
                    apiFormResponse.value = response.data.payload.docData;
                    msgPopup.success('Project saved successfully');
                } else {
                    throw new Error('Invalid API response structure');
                }
            } else {
                throw new Error('No project data to save');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to save project: ' + (error.message || 'Unknown error'));
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    return {
        apiViewResponse,
        apiFormResponse,
        getEntries,
        fetchProjects,
        fetchProject,
        saveProject,
        projectFields: getCurrentProject
    };
});
