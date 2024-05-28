import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {
    fetchProjectById,
    fetchProjects as fetchProjectsApi,
    saveProject as saveProjectApi,
    setupApiClient
} from '../apiClient';
import {Pagination, ViewPage} from "../types";

interface Rl {
    reader: string;
    accessLevel: string;
}

interface Project {
    id: string;
    name: string;
    status: string;
    finishDate: string;
    manager: string;
    coder: string;
    tester: string;
    rls: Rl[];
}

export const useProjectsStore = defineStore('projectsStore', () => {
    const projectsPage = ref<ViewPage | null>(null);
    const project = ref<Project | null>(null);

    const fetchProjects = async (page = 1, pageSize = 10, pagination: Pagination) => {
        try {
            const response = await fetchProjectsApi(page, pageSize);
            if (response && response.payload) {
                projectsPage.value = response.payload;
                pagination.pageSize = response.payload.viewData.pageSize;
                pagination.itemCount = response.payload.viewData.count;
                pagination.pageCount = response.payload.viewData.pageCount;
                pagination.page = response.payload.viewData.pageNum;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            throw error;
        }
    };

    const fetchProject = async (projectId: string) => {
        try {
            const response = await fetchProjectById(projectId);
            if (response) {
                project.value = response.docData;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error) {
            console.error('Failed to fetch project:', error);
            throw error;
        }
    };

    const saveProject = async () => {
        try {
            if (project.value) {
                await saveProjectApi(project.value.id, project.value);
            } else {
                throw new Error('No project data to save');
            }
        } catch (error) {
            console.error('Failed to save project:', error);
            throw error;
        }
    };

    const projectFields = computed(() => project.value || {
        id: '',
        name: '',
        status: '',
        finishDate: '',
        manager: '',
        coder: '',
        tester: '',
        rls: []
    });

    return {
        projectsPage,
        project,
        fetchProjects,
        fetchProject,
        saveProject,
        setupApiClient,
        projectFields
    };
});
