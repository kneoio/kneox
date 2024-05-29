import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {
    fetchProjectById,
    fetchProjects as fetchProjectsApi,
    saveProject as saveProjectApi,
    setupApiClient
} from '../apiClient';
import {Pagination, ViewPage} from "../types";
import {MessageApiInjection} from 'naive-ui/lib/message/src/MessageProvider';
import {LoadingBarApiInjection} from 'naive-ui/lib/loading-bar/src/LoadingBarProvider';

interface Rl {
    reader: string;
    accessLevel: string;
}

interface Project {
    docData: {
        id: string;
        name: string;
        status: string;
        finishDate: string;
        manager: string;
        coder: string;
        tester: string;
        rls: Rl[];
    };
}

export const useProjectStore = defineStore('projectsStore', () => {
    const projectsPage = ref<ViewPage | null>(null);
    const project = ref<Project | null>(null);

    const projectFields = computed(() => project.value?.docData || {
        id: '',
        name: '',
        status: '',
        finishDate: null,
        manager: '',
        coder: '',
        tester: '',
        rls: []
    });

    const fetchProjects = async (
        page = 1,
        pageSize = 10,
        pagination: Pagination,
        msgPopup: MessageApiInjection,
        loadingBar: LoadingBarApiInjection
    ) => {
        try {
            loadingBar.start();
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
            loadingBar.error();
            msgPopup.error('Failed to fetch projects:');
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    const fetchProject = async (projectId: string,
                                msgPopup: MessageApiInjection,
                                loadingBar: LoadingBarApiInjection) => {
        try {
            loadingBar.start();
            const response = await fetchProjectById(projectId);
            if (response) {
                project.value = response.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error) {
            loadingBar.error();
            msgPopup.error('Failed to fetch projects:');
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    const saveProject = async () => {
        try {
            if (project.value) {
                await saveProjectApi(project.value.docData.id, project.value);
            } else {
                throw new Error('No project data to save');
            }
        } catch (error) {
            console.error('Failed to save project:', error);
            throw error;
        }
    };

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
