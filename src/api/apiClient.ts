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

interface SSEConnection {
    close: () => void;
    eventSource: EventSource;
}

interface SSEOptions {
    withCredentials?: boolean;
    timeout?: number;
    onMessage: (data: any) => void;
    onError?: (error: Error) => void;
    onComplete?: (data: any) => void;
    onOpen?: () => void;
}

class SSEClient {
    private readonly baseURL: string;
    private readonly defaultOptions: Partial<SSEOptions>;

    constructor(baseURL: string, defaultOptions: Partial<SSEOptions> = {}) {
        this.baseURL = baseURL;
        this.defaultOptions = {
            withCredentials: true,
            timeout: 10 * 60 * 1000,
            ...defaultOptions
        };
    }

    private getTimestamp(): string {
        const now = new Date();
        return now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');
    }

    private logWithTimestamp(message: string): void {
        console.log(`[${this.getTimestamp()}] ${message}`);
    }

    connect(endpoint: string, options: SSEOptions): SSEConnection {
        const mergedOptions = { ...this.defaultOptions, ...options };
        let fullUrl = `${this.baseURL}/api${endpoint}`;
        
        // Add authorization token to URL if available
        const token = keycloak.token;
        if (token) {
            const separator = fullUrl.includes('?') ? '&' : '?';
            fullUrl += `${separator}access_token=${encodeURIComponent(token)}`;
        }
        
        this.logWithTimestamp(`Creating SSE connection to: ${fullUrl.replace(/access_token=[^&]+/, 'access_token=***')}`);
        
        const eventSource = new EventSource(fullUrl, {
            withCredentials: mergedOptions.withCredentials
        });
        
        let timeoutId: NodeJS.Timeout | null = null;
        let isConnected = false;
        
        if (mergedOptions.timeout) {
            timeoutId = setTimeout(() => {
                if (!isConnected) {
                    this.logWithTimestamp('SSE connection timeout');
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
        
        eventSource.onopen = () => {
            isConnected = true;
            this.logWithTimestamp('SSE connection established');
            mergedOptions.onOpen?.();
        };
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                mergedOptions.onMessage(data);
                
                if (data.status === 'finished' || data.status === 'completed') {
                    cleanup();
                    mergedOptions.onComplete?.(data);
                } else if (data.status === 'error' || data.status === 'failed') {
                    cleanup();
                    mergedOptions.onError?.(new Error(data.error || data.message || 'Operation failed'));
                }
            } catch (error) {
                this.logWithTimestamp(`Failed to parse SSE data: ${error}, Raw data: ${event.data}`);
                mergedOptions.onError?.(new Error('Invalid server response format'));
            }
        };
        
        eventSource.onerror = (error) => {
            this.logWithTimestamp(`SSE connection error: ${error}`);
            
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

    monitorUploadProgress(uploadId: string, onProgress: (percentage: number) => void): Promise<any> {
        return new Promise((resolve, reject) => {
            let lastProgress = -1;
            this.connect(`/soundfragments/upload-progress/${uploadId}/stream`, {
                onMessage: (progress) => {
                    this.logWithTimestamp(`Upload progress update: ${JSON.stringify(progress)}`);

                    if (typeof progress.percentage === 'number' && progress.percentage !== lastProgress) {
                        lastProgress = progress.percentage;
                        onProgress(Math.max(0, Math.min(100, progress.percentage)));
                    }
                },
                onComplete: (data) => {
                    this.logWithTimestamp(`Upload monitoring completed: ${JSON.stringify(data)}`);
                    resolve(data);
                },
                onError: (error) => {
                    this.logWithTimestamp(`Upload monitoring error: ${error}`);
                    reject(error);
                },
                onOpen: () => {
                    this.logWithTimestamp(`Upload progress monitoring started for: ${uploadId}`);
                }
            });
        });
    }

    stream<T = any>(endpoint: string, onData: (data: T) => void, onComplete?: (data: T) => void): Promise<T> {
        return new Promise((resolve, reject) => {
            this.connect(endpoint, {
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

const sseClient = new SSEClient(apiServer, {
    withCredentials: true,
    timeout: 10 * 60 * 1000
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
};

(apiClient as any).sse = sseClient;
(apiClient as any).monitorUploadProgress = (uploadId: string, onProgress: (percentage: number) => void) => 
    sseClient.monitorUploadProgress(uploadId, onProgress);
(apiClient as any).streamData = <T = any>(endpoint: string, onData: (data: T) => void, onComplete?: (data: T) => void) =>
    sseClient.stream(endpoint, onData, onComplete);

export { unsecuredClient, sseClient, SSEClient };
export type { SSEConnection, SSEOptions };
export default apiClient;