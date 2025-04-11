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
    timelines: PeriodicTask[];
}

export interface PeriodicTask {
    name: string;
    schedulerName: string;
    lastExecutionTime: string;
    nextExecutionTime: string;
    timeRemaining: number;
    currentProgress: number;
}

export interface DashboardResponse {
    payload: {
        kneobroadcaster: string[];
        stats: DashboardStats;
    };
}

export interface StationDetails {
    brandName: string;
    status: string;
    managedBy: string;
    segmentsSize: number;
    playlistManagerStats: {
        obtainedByHLSPlaylist: string[];
        readyToBeConsumed: string[];
        brand: string;
    };
    timelines: Array<{
        task: {
            id: string;
            name: string;
            startTime: string;
            intervalSeconds: number;
            executionCount: number;
            lastExecutionTime: string;
            nextExecutionTime: string;
            currentProgress: number;
            timeRemaining: number;
        };
    }>;
    totalBytesProcessed: number;
    bitrate: number;
    queueSize: number;
    songStatistics: Record<string, unknown>;
    segmentSizeHistory: unknown[];
}

export interface StationResponse {
    payload: {
        kneobroadcaster: string;
        station: StationDetails;
    };
}

export const useDashboardStore = defineStore('dashboardStore', () => {
    // State
    const response = ref<DashboardResponse | null>(null);
    const stationResponse = ref<Record<string, StationResponse>>({});
    const websocket = ref<WebSocket | null>(null);
    const stationWebsockets = ref<Record<string, WebSocket>>({});
    const isConnected = ref(false); // Added as you requested
    const lastUpdate = ref<Date | null>(null);
    const isStartingBroadcast = ref(false);

    // Computed
    const stats = computed(() => {
        return response.value?.payload.stats || {
            totalStations: 0,
            onlineStations: 0,
            minimumSegments: 0,
            slidingWindowSize: 0,
            stations: {},
            timelines: []
        };
    });

    const stationsList = computed(() => {
        return stats.value.stations ? Object.values(stats.value.stations) : [];
    });

    const version = computed(() => {
        return response.value?.payload.kneobroadcaster?.[0] || '';
    });

    // Methods
    const connect = () => { // Renamed from connectDashboard as you requested
        if (websocket.value &&
            (websocket.value.readyState === WebSocket.OPEN ||
                websocket.value.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const baseUrl = apiClient.defaults.baseURL || '';
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const urlObject = new URL(baseUrl);
        const host = urlObject.host;
        const wsUrl = `${wsProtocol}//${host}/api/ws/dashboard`;
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
                const data = JSON.parse(event.data);
                console.log('Parsed WebSocket message:', data);
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
        };
    };

    const disconnect = () => {
        if (websocket.value) {
            websocket.value.close();
            websocket.value = null;
            isConnected.value = false;
        }
    };

    const connectStation = (brandName: string) => {
        if (stationWebsockets.value[brandName] &&
            (stationWebsockets.value[brandName].readyState === WebSocket.OPEN ||
                stationWebsockets.value[brandName].readyState === WebSocket.CONNECTING)) {
            return;
        }

        const baseUrl = apiClient.defaults.baseURL || '';
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const urlObject = new URL(baseUrl);
        const host = urlObject.host;
        const wsUrl = `${wsProtocol}//${host}/api/ws/dashboard/station/${brandName}`;
        const token = keycloak.token;
        const url = token ? `${wsUrl}?token=${token}` : wsUrl;

        stationWebsockets.value[brandName] = new WebSocket(url);

        stationWebsockets.value[brandName].onopen = () => {
            console.log(`Station ${brandName} WebSocket connection opened successfully`);
            fetchStation(brandName);
        };

        stationWebsockets.value[brandName].onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log(`Parsed Station ${brandName} WebSocket message:`, data);
                if (data.error) {
                    console.error(`Station ${brandName} WebSocket error message:`, data.error);
                    return;
                }
                stationResponse.value = {
                    ...stationResponse.value,
                    [brandName]: data
                };
            } catch (error) {
                console.error(`Error parsing Station ${brandName} WebSocket message:`, error, event.data);
            }
        };

        stationWebsockets.value[brandName].onclose = (event) => {
            console.log(`Station ${brandName} WebSocket connection closed:`, event.code, event.reason);
            if (event.code === 1000 || event.code === 1001 || event.code === 1006) {
                console.log(`Attempting to reconnect station ${brandName} in 3 seconds...`);
                setTimeout(() => connectStation(brandName), 3000);
            } else {
                console.error(`Station ${brandName} WebSocket closed with error code:`, event.code);
            }
        };

        stationWebsockets.value[brandName].onerror = (error) => {
            console.error(`Station ${brandName} WebSocket error occurred:`, error);
        };
    };

    const disconnectStation = (brandName: string) => {
        if (stationWebsockets.value[brandName]) {
            stationWebsockets.value[brandName].close();
            delete stationWebsockets.value[brandName];
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

    const fetchStation = (brandName: string) => {
        if (stationWebsockets.value[brandName] && stationWebsockets.value[brandName].readyState === WebSocket.OPEN) {
            console.log(`Sending getStation request for ${brandName}`);
            stationWebsockets.value[brandName].send(JSON.stringify({ action: 'getStation' }));
        } else {
            console.error(`Station ${brandName} WebSocket not connected, cannot fetch station data`);
        }
    };

    const getStationDetails = (brandName: string) => {
        return stationResponse.value[brandName]?.payload.station || null;
    };

    const triggerBroadcastAction = async (brandName: string, action: string = 'start') => {
        isStartingBroadcast.value = true;
        try {
            const response = await apiClient.put(
                `/${brandName}/queue/action`,
                { action },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                console.log(`Broadcast ${action} triggered successfully for ${brandName}`);
                return true;
            } else {
                console.log(`Failed to trigger broadcast ${action} for ${brandName}`);
                return false;
            }
        } catch (error) {
            console.error(`Error triggering broadcast ${action}:`, error);
            return false;
        } finally {
            isStartingBroadcast.value = false;
        }
    };

    const setupPeriodicRefresh = (intervalMs = 10000) => {
        const intervalId = setInterval(() => {
            fetchDashboard();
            Object.keys(stationWebsockets.value).forEach(fetchStation);
        }, intervalMs);

        return () => clearInterval(intervalId);
    };

    return {
        // State
        response,
        stationResponse,
        isConnected, // Now properly exposed
        lastUpdate,
        isStartingBroadcast,

        // Computed
        stats,
        stationsList,
        version,

        // Methods
        connect, // Renamed from connectDashboard
        disconnect,
        connectStation,
        disconnectStation,
        fetchDashboard,
        fetchStation,
        getStationDetails,
        triggerBroadcastAction,
        setupPeriodicRefresh
    };
});