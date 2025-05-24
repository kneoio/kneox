import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient from '../../api/apiClient';
import keycloak from '../../keycloakFactory';
import {DashboardResponse, StationEntry, StationResponse} from "../../types/dashboard";

export const useDashboardStore = defineStore('dashboardStore', () => {
    const response = ref<DashboardResponse | null>(null);
    const stationResponse = ref<Record<string, StationResponse>>({});
    const websocket = ref<WebSocket | null>(null);
    const stationWebsockets = ref<Record<string, WebSocket>>({});
    const isConnected = ref(false);
    const lastUpdate = ref<Date | null>(null);
    const isStartingBroadcast = ref(false);

    const buildWebSocketUrl = (endpoint: string): string => {
        const baseUrl = apiClient.defaults.baseURL || '';
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const urlObject = new URL(baseUrl);
        const host = urlObject.host;
        const wsUrl = `${wsProtocol}//${host}/api/ws/${endpoint}`;
        const token = keycloak.token;
        return token ? `${wsUrl}?token=${token}` : wsUrl;
    };

    const isWebSocketActive = (ws: WebSocket | null | undefined): boolean => {
        return ws !== null && ws !== undefined &&
            (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING);
    };


    const connect = () => {
        if (isWebSocketActive(websocket.value)) return;

        websocket.value = new WebSocket(buildWebSocketUrl('dashboard'));
        Object.assign(websocket.value, createWebSocketHandlers({
            type: 'dashboard',
            onMessage: (data) => {
                response.value = data;
                lastUpdate.value = new Date();
            },
            onConnect: fetchDashboard
        }));
    };

    const disconnect = () => {
        if (websocket.value) {
            websocket.value.close();
            websocket.value = null;
            isConnected.value = false;
        }
    };

    const connectStation = (brandName: string) => {
        if (isWebSocketActive(stationWebsockets.value[brandName])) return;

        stationWebsockets.value[brandName] = new WebSocket(buildWebSocketUrl(`dashboard/station/${brandName}`));
        Object.assign(stationWebsockets.value[brandName], createWebSocketHandlers({
            type: 'station',
            brandName,
            onMessage: (data) => {
                //console.log(data);
                if (data.payload?.station?.brandName) {
                    stationResponse.value = {
                        ...stationResponse.value,
                        [data.payload.station.brandName]: data
                    };
                }
            },
            onConnect: () => fetchStation(brandName)
        }));
    };

    const disconnectStation = (brandName: string) => {
        if (stationWebsockets.value[brandName]) {
            stationWebsockets.value[brandName].close();
            delete stationWebsockets.value[brandName];
        }
    };

    const ensureStationConnected = (brandName: string) => {
        if (!stationWebsockets.value[brandName] ||
            stationWebsockets.value[brandName].readyState !== WebSocket.OPEN) {
            connectStation(brandName);
        }
        return stationResponse.value[brandName];
    };

    const fetchDashboard = () => {
        if (websocket.value?.readyState === WebSocket.OPEN) {
            websocket.value.send(JSON.stringify({ action: 'getDashboard' }));
        }
    };

    const fetchStation = (brandName: string) => {
        if (stationWebsockets.value[brandName]?.readyState === WebSocket.OPEN) {
            stationWebsockets.value[brandName].send(JSON.stringify({ action: 'getStation' }));
        }
    };

    const stats = computed(() => {
        return response.value?.payload.stats || {
            totalStations: 0,
            onlineStations: 0,
            minimumSegments: 0,
            slidingWindowSize: 0,
            stations: [],
            timelines: []
        };
    });

    const stationsList = computed<StationEntry[]>(() => {
        return stats.value.stations || [];
    });

    const version = computed(() => {
        return response.value?.payload.kneobroadcaster?.[0] || '';
    });

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
            return response.status === 200;
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


    const createWebSocketHandlers = (options: {
        type: 'dashboard' | 'station',
        brandName?: string,
        onMessage: (data: any) => void,
        onConnect?: () => void
    }) => {
        return {
            onopen: () => {
                console.log(`${options.type} ${options.brandName || ''} WebSocket opened`);
                if (options.type === 'dashboard') {
                    isConnected.value = true;
                }
                options.onConnect?.();
            },
            onmessage: (event: MessageEvent) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log(data);
                    if (data.error) {
                        console.error(`${options.brandName || ''} error:`, data.error);
                        return;
                    }
                    options.onMessage(data);
                } catch (error) {
                    console.error(`Error parsing ${options.type} message:`, error, event.data);
                }
            },
            onclose: (event: CloseEvent) => {
                console.log(`${options.type} ${options.brandName || ''} closed:`, event.code, event.reason);
                if (options.type === 'dashboard') {
                    isConnected.value = false;
                }

                if ([1000, 1001, 1006].includes(event.code)) {
                    console.log(`Reconnecting ${options.type} ${options.brandName || ''} in 3s...`);
                    setTimeout(() => {
                        if (options.type === 'dashboard') {
                            connect();
                        } else if (options.brandName) {
                            connectStation(options.brandName);
                        }
                    }, 3000);
                }
            },
            onerror: (error: Event) => {
                console.error(`${options.type} ${options.brandName || ''} error:`, error);
                if (options.type === 'dashboard') {
                    isConnected.value = false;
                }
            }
        };
    };

    return {
        response,
        stationResponse,
        isConnected,
        lastUpdate,
        isStartingBroadcast,
        stats,
        stationsList,
        version,
        connect,
        disconnect,
        connectStation,
        disconnectStation,
        ensureStationConnected,
        fetchDashboard,
        fetchStation,
        getStationDetails,
        triggerBroadcastAction,
        setupPeriodicRefresh
    };
});