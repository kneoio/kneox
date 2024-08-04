import {defineStore} from 'pinia';
import {ref, computed} from 'vue';
import apiClient from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {PaginationInfo, useLoadingBar, useMessage} from 'naive-ui';
import {Project} from "../../types/projectTypes";

export const useProjectStore = defineStore('projectStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<Project> | null>(null);
    const apiFormResponse = ref<ApiFormResponse | null>(null);
    const project = ref<Project | null>(null);
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar();

    const getCurrent = computed(() => {
        const defaultData = {
            regDate: '',
            lastModifiedDate: '',
            id: '',
            name: '',
            status: '',
            finishDate: '',
            manager: '',
            coder: '',
            tester: '',
            rls: [],
            primaryLang: ''
        };
        return apiFormResponse.value?.docData || defaultData;
    });

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
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
        return getEntries.value.map(doc => ({
            label: doc.name,
            value: doc.id
        }));
    });

    const fetchProjects = async (page = 1, pageSize = 10) => {
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
        getOptions,
        getPagination,
        getCurrent,
        fetchProjects,
        fetchProject,
        saveProject
    };
});
