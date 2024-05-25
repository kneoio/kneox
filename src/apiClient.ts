// src/apiClient.ts
import axios from 'axios';
import {getCurrentInstance} from 'vue';
import {KeycloakInstance} from 'keycloak-js';
import {Project} from './types';

const apiClient = axios.create({
    baseURL: 'http://localhost:38707/kneox',
});

apiClient.interceptors.request.use(async (config) => {
    const instance = getCurrentInstance();
    const kc = instance?.appContext.config.globalProperties.$keycloak as KeycloakInstance;

    if (kc?.token) {
        config.headers.Authorization = `Bearer ${kc.token}`;
    }

    return config;
});

export const fetchProjects = async (): Promise<Project[]> => {
    const response = await apiClient.get<{ payload: { view_data: { entries: Project[] } } }>('/projects');
    return response.data.payload.view_data.entries;
};

export const archiveProjects = async (projectIds: string[]) => {
    return apiClient.post('/projects/archive', { ids: projectIds });
};

export default apiClient;
