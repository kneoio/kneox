import axios from 'axios';

console.log('VITE_API_SERVER:', import.meta.env.VITE_API_SERVER);

const apiServer = import.meta.env.VITE_API_SERVER;

if (!apiServer) {
    throw new Error('VITE_API_SERVER environment variable is not set');
}

const apiClient = axios.create({
    baseURL: `${apiServer}/api/kneox`,
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
