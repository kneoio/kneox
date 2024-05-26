import {defineStore} from 'pinia';
import {ref} from 'vue';
import {Pagination, ViewPage} from '../types';
import {fetchProjects as fetchProjectsApi, setupApiClient} from '../apiClient';

export const useProjectsStore = defineStore('projectsStore', () => {
    const projectsPage = ref<ViewPage | null>(null);

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

    return {
        projectsPage,
        fetchProjects,
        setupApiClient
    };
});
