import axios from 'axios';
import keycloak from '../keycloakFactory';

const apiServer = import.meta.env.VITE_DATANEST_SERVER;

if (!apiServer) {
    throw new Error('VITE_DATANEST_SERVER environment variable is not set');
}

const apiClient = axios.create({
    baseURL: `${apiServer}`,
    withCredentials: true,
});


export const setupApiClient = (token?: string) => {
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

        apiClient.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response && error.response.status === 401) {
                    try {
                        await keycloak.login();
                    } catch (e) {
                        console.error("Failed to re-authenticate after 401", e);
                    }
                }
                return Promise.reject(error);
            }
        );
    } else {
        console.error("Keycloak token is not available");
    }
};

export const getBaseURL = () => {
    return apiClient.defaults.baseURL;
};

export { apiServer };
export default apiClient;