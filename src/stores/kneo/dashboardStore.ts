import { defineStore } from 'pinia';
import { computed, ref, nextTick } from 'vue';
import apiClient from '../../api/apiClient';
import keycloak from '../../keycloakFactory';
import {DashboardResponse, StationEntry, StationResponse} from "../../types/dashboard";

export const useDashboardStore = defineStore('dashboardStore', () => {
    const globalDashboardResponse = ref<DashboardResponse | null>(null);
    const stationResponse = ref<Record<string, StationResponse>>({});
    const globalWebsocket = ref<WebSocket | null>(null);
    const stationWebsockets = ref<Record<string, WebSocket>>({});
    const isGlobalConnected = ref(false);
    const globalLastUpdate = ref<Date | null>(null);
    const stationLastUpdate = ref<Record<string, Date>>({});
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

    const connectGlobal = () => {
        if (isWebSocketActive(globalWebsocket.value)) return;

        globalWebsocket.value = new WebSocket(buildWebSocketUrl('dashboard'));
        Object.assign(globalWebsocket.value, createWebSocketHandlers({
            type: 'dashboard',
            onMessage: (data) => {
                nextTick(() => {
                    globalDashboardResponse.value = data;
                    globalLastUpdate.value = new Date();
                });
            },
            onConnect: fetchGlobalDashboard
        }));
    };

    const disconnectGlobal = () => {
        if (globalWebsocket.value) {
            globalWebsocket.value.close();
            globalWebsocket.value = null;
            isGlobalConnected.value = false;
        }
    };

    const connectStation = (brandName: string) => {
        if (isWebSocketActive(stationWebsockets.value[brandName])) return;

        stationWebsockets.value[brandName] = new WebSocket(buildWebSocketUrl(`dashboard/station/${brandName}`));
        Object.assign(stationWebsockets.value[brandName], createWebSocketHandlers({
            type: 'station',
            brandName,
            onMessage: (data) => {
                if (data.payload?.station?.brandName) {
                    stationResponse.value = {
                        ...stationResponse.value,
                        [data.payload.station.brandName]: data
                    };
                    stationLastUpdate.value[data.payload.station.brandName] = new Date();
                }
            },
            onConnect: () => fetchStation(brandName)
        }));
    };

    const disconnectStation = (brandName: string) => {
        if (stationWebsockets.value[brandName]) {
            stationWebsockets.value[brandName].close();
            delete stationWebsockets.value[brandName];
            delete stationLastUpdate.value[brandName];
        }
    };

    const ensureStationConnected = (brandName: string) => {
        if (!stationWebsockets.value[brandName] ||
            stationWebsockets.value[brandName].readyState !== WebSocket.OPEN) {
            connectStation(brandName);
        }
        return stationResponse.value[brandName];
    };

    const fetchGlobalDashboard = () => {
        if (globalWebsocket.value?.readyState === WebSocket.OPEN) {
            globalWebsocket.value.send(JSON.stringify({ action: 'getDashboard' }));
        }
    };

    const fetchStation = (brandName: string) => {
        if (stationWebsockets.value[brandName]?.readyState === WebSocket.OPEN) {
            stationWebsockets.value[brandName].send(JSON.stringify({ action: 'getStation' }));
        }
    };

    const globalStats = computed(() => {
        return globalDashboardResponse.value?.payload.stats || {
            totalStations: 0,
            onlineStations: 0,
            minimumSegments: 0,
            warmingStations: 0,
            offlineStations: 0,
            slidingWindowSize: 0,
            fileMaintenanceStats: {
                totalSpaceBytes: 0,
                availableSpaceBytes: 0,
                spaceFreedBytes: 0,
                filesDeleted: 0,
                directoriesDeleted: 0
            },
            stations: [],
            timelines: [],
            configurationStats: {
                configDetails: {}
            }
        };
    });

    const globalStationsList = computed<StationEntry[]>(() => {
        return globalStats.value.stations || [];
    });

    const globalVersion = computed(() => {
        return globalDashboardResponse.value?.payload.kneobroadcaster?.[0] || '';
    });

    const getStationDetails = (brandName: string) => {
        return stationResponse.value[brandName]?.payload.station || null;
    };

    const getGlobalLastUpdate = () => {
        return globalLastUpdate.value;
    };

    const getStationLastUpdate = (brandName: string) => {
        return stationLastUpdate.value[brandName] || null;
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
                    isGlobalConnected.value = true;
                }
                options.onConnect?.();
            },
            onmessage: (event: MessageEvent) => {
                try {
                    const data = JSON.parse(event.data);
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
                    isGlobalConnected.value = false;
                }

                if ([1000, 1001, 1006].includes(event.code)) {
                    console.log(`Reconnecting ${options.type} ${options.brandName || ''} in 3s...`);
                    setTimeout(() => {
                        if (options.type === 'dashboard') {
                            connectGlobal();
                        } else if (options.brandName) {
                            connectStation(options.brandName);
                        }
                    }, 3000);
                }
            },
            onerror: (error: Event) => {
                console.error(`${options.type} ${options.brandName || ''} error:`, error);
                if (options.type === 'dashboard') {
                    isGlobalConnected.value = false;
                }
            }
        };
    };

    return {
        // Global dashboard
        globalDashboardResponse,
        globalWebsocket,
        isGlobalConnected,
        globalLastUpdate,
        globalStats,
        globalStationsList,
        globalVersion,
        connectGlobal,
        disconnectGlobal,
        fetchGlobalDashboard,
        getGlobalLastUpdate,

        // Station-specific
        stationResponse,
        stationWebsockets,
        stationLastUpdate,
        connectStation,
        disconnectStation,
        ensureStationConnected,
        fetchStation,
        getStationDetails,
        getStationLastUpdate,

        // Shared
        isStartingBroadcast,
        triggerBroadcastAction
    };
});