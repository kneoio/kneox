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
    try {
        const response = await apiClient.get(`/projects?page=${page}&size=${pageSize}`);
        if (response.data) {
            return response.data;
        } else {
            throw new Error('Invalid API response structure');
        }
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
};

export const fetchProjectById = async (projectId: string): Promise<any> => {
    try {
        const response = await apiClient.get(`/projects/${projectId}`);
        if (response.data) {
            return response.data;
        } else {
            throw new Error('Invalid API response structure');
        }
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
};

export const saveProject = async (projectId: string, projectData: any): Promise<any> => {
    try {
        const response = await apiClient.put(`/projects/${projectId}`, projectData);
        if (response.data) {
            return response.data;
        } else {
            throw new Error('Invalid API response structure');
        }
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
};

export default apiClient;
