import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {fetchProjectById, saveProject as saveProjectApi, setupApiClient} from '../../apiClient';
import {fetchEmpl} from "../../api/of/employeeApiClient";
import {ViewPage} from "../../types/ofTypes";
import {useLoadingBar, useMessage} from "naive-ui";
import {Rl} from "../../types";

interface Project {
    docData: {
        id: string;
        name: string;
        status: string;
        finishDate: string;
        manager: {
            id: number;
            name: string;
        };
        coder: {
            id: number;
            name: string;
        };
        tester: {
            id: number;
            name: string;
        };
        rls: Rl[];
        primaryLang: string;
    };
    actions: {
        actions: any[];
    };
}

export const useEmployeeStore = defineStore('store', () => {
    const organizationPage = ref<ViewPage | null>(null);
    const project = ref<Project | null>(null);
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar();

    const projectFields = computed(() => project.value?.docData || {
        id: '',
        name: '',
        status: '',
        finishDate: null,
        manager: {id: 0, name: ''},
        coder: {id: 0, name: ''},
        tester: {id: 0, name: ''},
        rls: [],
        primaryLang: ''
    });

    const fetchEmployees = async (page = 1, pageSize = 10) => {
        try {
            loadingBar.start();
            const response = await fetchEmpl(page, pageSize);
            if (response && response.payload) {
                console.log(response.payload);
                organizationPage.value = response.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to fetch employers: ' + (error.message || 'Unknown error'));
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    const fetchProject = async (projectId: string) => {
        try {
            loadingBar.start();
            const response = await fetchProjectById(projectId);
            if (response && response.payload) {
                console.log(response.payload);
                project.value = response.payload;
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
            if (project.value) {
                const response = await saveProjectApi(project.value.docData.id, project.value);
                if (response && response.payload) {
                    project.value = response.payload;
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
        organizationPage,
        projectFields,
        fetchProject,
        saveProject,
        setupApiClient,
        fetchEmployees
    };
});
