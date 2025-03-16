import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient from '../../api/apiClient';
import keycloak from '../../keycloakFactory';

export interface Station {
    brandName: string;
    status: string;
    segmentsSize: number;
    lastSegmentKey: number;
    lastRequested: number;
    currentFragment: string;
}

export interface DashboardStats {
    totalStations: number;
    onlineStations: number;
    minimumSegments: number;
    slidingWindowSize: number;
    stations: Record<string, Station>;

}

export interface DashboardResponse {
    payload: {
        kneobroadcaster: string[];
        stats: DashboardStats;
    };
}

export const useDashboardStore = defineStore('dashboardStore', () => {
    const response = ref<DashboardResponse | null>(null);
    const websocket = ref<WebSocket | null>(null);
    const isConnected = ref(false);
    const lastUpdate = ref<Date | null>(null);

    const stats = computed(() => {
        return response.value?.payload.stats || {
            totalStations: 0,
            onlineStations: 0,
            minimumSegments: 0,
            slidingWindowSize: 0,
            stations: {}
        };
    });

    const stationsList = computed(() => {
        return stats.value.stations ? Object.values(stats.value.stations) : [];
    });

    const version = computed(() => {
        return response.value?.payload.kneobroadcaster?.[0] || '';
    });

    const connect = () => {
        if (websocket.value &&
            (websocket.value.readyState === WebSocket.OPEN ||
                websocket.value.readyState === WebSocket.CONNECTING)) {
            return;
        }

        // Ensure we have authentication before connecting

        const baseUrl = apiClient.defaults.baseURL || '';
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        // Extract the host and path from the API baseURL
        const urlObject = new URL(baseUrl);
        const host = urlObject.host;

        // Match the path in the controller
        const wsUrl = `${wsProtocol}//${host}/api/ws/dashboard`;

        // Add token as query parameter for authentication
        const token = keycloak.token;
        const url = token ? `${wsUrl}?token=${token}` : wsUrl;

        websocket.value = new WebSocket(url);

        websocket.value.onopen = () => {
            console.log('WebSocket connection opened successfully');
            isConnected.value = true;
            fetchDashboard();
        };

        websocket.value.onmessage = (event) => {
            try {
                console.log('Raw WebSocket message:', event.data);
                const data = JSON.parse(event.data);
                console.log('Parsed WebSocket message:', data);

                // Debug payload structure
                if (data.payload) {
                    console.log('Payload found:', data.payload);
                    console.log('Stats in payload:', data.payload.stats);
                } else {
                    console.log('No payload found in message');
                }

                // Handle potential error messages
                if (data.error) {
                    console.error('WebSocket error message:', data.error);
                    return;
                }

                response.value = data;
                lastUpdate.value = new Date();
            } catch (error) {
                console.error('Error parsing WebSocket message:', error, event.data);
            }
        };

        websocket.value.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            isConnected.value = false;

            // Only attempt to reconnect for normal closures or network errors
            if (event.code === 1000 || event.code === 1001 || event.code === 1006) {
                console.log('Attempting to reconnect in 3 seconds...');
                setTimeout(connect, 3000);
            } else {
                console.error('WebSocket closed with error code:', event.code);
            }
        };

        websocket.value.onerror = (error) => {
            console.error('WebSocket error occurred:', error);
            isConnected.value = false;
            // Don't close the connection here, let the onclose handler manage it
            // as the onclose will fire after onerror
        };
    };

    const disconnect = () => {
        if (websocket.value) {
            websocket.value.close();
            websocket.value = null;
            isConnected.value = false;
        }
    };

    const fetchDashboard = () => {
        if (websocket.value && websocket.value.readyState === WebSocket.OPEN) {
            console.log('Sending getDashboard request');
            websocket.value.send(JSON.stringify({ action: 'getDashboard' }));
        } else {
            console.error('WebSocket not connected, cannot fetch dashboard');
        }
    };

    const setupPeriodicRefresh = (intervalMs = 10000) => {
        const intervalId = setInterval(() => {
            fetchDashboard();
        }, intervalMs);

        return () => clearInterval(intervalId);
    };

    return {
        response,
        stats,
        stationsList,
        version,
        isConnected,
        lastUpdate,
        connect,
        disconnect,
        fetchDashboard,
        setupPeriodicRefresh
    };
});