import axios from 'axios';
import keycloak from '../keycloakFactory';

const apiServer = import.meta.env.VITE_API_SERVER;

if (!apiServer) {
    throw new Error('VITE_API_SERVER environment variable is not set');
}

const unsecuredClient = axios.create({
    baseURL: apiServer,
    withCredentials: false,
});

const apiClient = axios.create({
    baseURL: `${apiServer}/api`,
    withCredentials: true,
});

unsecuredClient.interceptors.request.use(
    (config) => {
        config.headers['X-Client-ID'] = 'mixpla-web';
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

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
}

export const getRadioStations = async () => {
    try {
        const response = await unsecuredClient.get('/radio/all-stations');
        return response.data;
    } catch (error) {
        console.error('Error fetching radio stations:', error);
        throw error;
    }
};

export { unsecuredClient };
export default apiClient;