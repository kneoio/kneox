import axios from 'axios';

const apiServer = import.meta.env.VITE_API_SERVER;

if (!apiServer) {
    throw new Error('VITE_API_SERVER environment variable is not set');
}

const apiClient = axios.create({
    baseURL: `${apiServer}/api/kneox`,
    withCredentials: true,
});

export const setupApiClient = (token: string) => {
    if (token) {
        apiClient.interceptors.request.use(
            async (config) => {
                config.headers.Authorization = `Bearer ${token}`;
                return config;
            },
            (error) => {
                console.error("Error in request interceptor:", error);
                return Promise.reject(error);
            }
        );
    } else {
        console.error("Keycloak token is not available");
    }
};

export const fetchProjects = async (page: number, pageSize: number): Promise<any> => {
    console.log(`Fetching projects: page=${page}, pageSize=${pageSize}`);
    try {
        const response = await apiClient.get(`/projects?page=${page}&size=${pageSize}`);
        if (response.data) {
            return response.data;
        } else {
            throw new Error('Invalid API response structure');
        }
    } catch (error) {
        console.error("Error fetching projects:", error);
        throw error;
    }
};

export const fetchProjectById = async (projectId: string): Promise<any> => {
    console.log(`Fetching project by ID: ${projectId}`);
    try {
        const response = await apiClient.get(`/projects/${projectId}`);
        if (response.data) {
            return response.data;
        } else {
            throw new Error('Invalid API response structure');
        }
    } catch (error) {
        console.error("Error fetching project by ID:", error);
        throw error;
    }
};

export const saveProject = async (projectId: string, projectData: any): Promise<any> => {
    console.log(`Saving project: ID=${projectId}, data=`, projectData);
    try {
        const response = await apiClient.put(`/projects/${projectId}`, projectData);
        console.log("Response:", response);
        return response;
    } catch (error) {
        console.error("Error saving project:", error);
        throw error;
    }
};

export default apiClient;
