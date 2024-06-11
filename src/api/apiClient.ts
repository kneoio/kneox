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

export default apiClient;
