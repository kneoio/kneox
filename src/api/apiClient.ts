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

// SSE Connection interface
interface SSEConnection {
    close: () => void;
    eventSource: EventSource;
}

// SSE Options interface
interface SSEOptions {
    withCredentials?: boolean;
    timeout?: number;
    onMessage: (data: any) => void;
    onError?: (error: Error) => void;
    onComplete?: (data: any) => void;
    onOpen?: () => void;
}

// SSE Client class
class SSEClient {
    private baseURL: string;
    private defaultOptions: Partial<SSEOptions>;

    constructor(baseURL: string, defaultOptions: Partial<SSEOptions> = {}) {
        this.baseURL = baseURL;
        this.defaultOptions = {
            withCredentials: true,
            timeout: 10 * 60 * 1000, // 10 minutes default
            ...defaultOptions
        };
    }

    /**
     * Create an SSE connection to the specified endpoint
     */
    connect(endpoint: string, options: SSEOptions): SSEConnection {
        const mergedOptions = { ...this.defaultOptions, ...options };
        const fullUrl = `${this.baseURL}/api${endpoint}`;
        
        console.log('Creating SSE connection to:', fullUrl);
        
        const eventSource = new EventSource(fullUrl, {
            withCredentials: mergedOptions.withCredentials
        });
        
        let timeoutId: NodeJS.Timeout | null = null;
        let isConnected = false;
        
        // Set up timeout if specified
        if (mergedOptions.timeout) {
            timeoutId = setTimeout(() => {
                if (!isConnected) {
                    console.warn('SSE connection timeout');
                    eventSource.close();
                    mergedOptions.onError?.(new Error('Connection timeout'));
                }
            }, mergedOptions.timeout);
        }
        
        const cleanup = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            if (eventSource.readyState !== EventSource.CLOSED) {
                eventSource.close();
            }
        };
        
        // Handle connection open
        eventSource.onopen = () => {
            isConnected = true;
            console.log('SSE connection established');
            mergedOptions.onOpen?.();
        };
        
        // Handle messages
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                mergedOptions.onMessage(data);
                
                // Check for completion status
                if (data.status === 'finished' || data.status === 'completed') {
                    cleanup();
                    mergedOptions.onComplete?.(data);
                } else if (data.status === 'error' || data.status === 'failed') {
                    cleanup();
                    mergedOptions.onError?.(new Error(data.error || data.message || 'Operation failed'));
                }
            } catch (error) {
                console.error('Failed to parse SSE data:', error, 'Raw data:', event.data);
                mergedOptions.onError?.(new Error('Invalid server response format'));
            }
        };
        
        // Handle errors
        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            
            // Only call onError if we haven't successfully connected yet
            // or if this is an unexpected disconnection
            if (!isConnected || eventSource.readyState === EventSource.CLOSED) {
                cleanup();
                mergedOptions.onError?.(new Error('SSE connection failed or lost'));
            }
        };
        
        return {
            close: cleanup,
            eventSource
        };
    }

    /**
     * Convenient method for monitoring upload progress
     */
    monitorUploadProgress(uploadId: string, onProgress: (percentage: number) => void): Promise<any> {
        return new Promise((resolve, reject) => {
            let lastProgress = -1;
            
            const connection = this.connect(`/soundfragments/upload-progress/${uploadId}/stream`, {
                onMessage: (progress) => {
                    console.log('Upload progress update:', progress);
                    
                    if (typeof progress.percentage === 'number' && progress.percentage !== lastProgress) {
                        lastProgress = progress.percentage;
                        onProgress(Math.max(0, Math.min(100, progress.percentage)));
                    }
                },
                onComplete: (data) => {
                    console.log('Upload monitoring completed:', data);
                    resolve(data);
                },
                onError: (error) => {
                    console.error('Upload monitoring error:', error);
                    reject(error);
                },
                onOpen: () => {
                    console.log('Upload progress monitoring started for:', uploadId);
                }
            });
        });
    }

    /**
     * Generic method for streaming data from any endpoint
     */
    stream<T = any>(endpoint: string, onData: (data: T) => void, onComplete?: (data: T) => void): Promise<T> {
        return new Promise((resolve, reject) => {
            const connection = this.connect(endpoint, {
                onMessage: onData,
                onComplete: (data) => {
                    onComplete?.(data);
                    resolve(data);
                },
                onError: reject
            });
        });
    }
}

// Create SSE client instance
const sseClient = new SSEClient(apiServer, {
    withCredentials: true,
    timeout: 10 * 60 * 1000
});

// Existing interceptors setup
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
};

(apiClient as any).sse = sseClient;
(apiClient as any).monitorUploadProgress = (uploadId: string, onProgress: (percentage: number) => void) => 
    sseClient.monitorUploadProgress(uploadId, onProgress);
(apiClient as any).streamData = <T = any>(endpoint: string, onData: (data: T) => void, onComplete?: (data: T) => void) =>
    sseClient.stream(endpoint, onData, onComplete);

export { unsecuredClient, sseClient, SSEClient };
export type { SSEConnection, SSEOptions };
export default apiClient;