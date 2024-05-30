import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:38707/api/kneox',
    withCredentials: false,
});

export const setupApiClient = (token: string) => {
    apiClient.interceptors.request.use(async (config) => {
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
};

export const fetchProjects = async (page: number, pageSize: number): Promise<any> => {
    const response = await apiClient.get(`/projects?page=${page}&size=${pageSize}`);
    if (response.data) {
        return response.data;
    } else {
        throw new Error('Invalid API response structure');
    }
};

export const fetchProjectById = async (projectId: string): Promise<any> => {
    const response = await apiClient.get(`/projects/${projectId}`);
    if (response.data) {
        return response.data;
    } else {
        throw new Error('Invalid API response structure');
    }
};

export const saveProject = async (projectId: string, projectData: any): Promise<any> => {
    return await apiClient.put(`/projects/${projectId}`, projectData);
};

export default apiClient;
