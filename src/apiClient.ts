import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:38707/api/kneox',
    withCredentials: false
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
        console.log(response.data);
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
