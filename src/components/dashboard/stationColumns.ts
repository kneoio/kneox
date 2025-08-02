import { computed, h, ref } from 'vue';
import { NTag, NButton, NSpace } from 'naive-ui';
import DesktopRow from "./DesktopRow.vue";
import MobileRow from "./MobileRow.vue";
import type { StationDetails } from '../../types/dashboard';

type NTagType = 'success' | 'warning' | 'error' | 'default' | 'info';

//dublicated
type RadioStationStatus =
    | 'ON_LINE'
    | 'QUEUE_SATURATED'
    | 'WARMING_UP'
    | 'WAITING_FOR_CURATOR'
    | 'IDLE'
    | 'SYSTEM_ERROR'
    | 'OFF_LINE';

interface StatusInfo {
    text: string;
    type: NTagType;
}

interface ManagedByInfo {
    text: string;
    type: NTagType;
}

interface StationRow {
    status: RadioStationStatus;
    managedBy: 'ITSELF' | 'AI_AGENT' | string;
    brandName: string;
    aliveTimeInHours: number;
    [key: string]: any;
}

export const useStationColumns = (
    dashboardStore: {
        getStationDetails: (brandName: string) => StationDetails | null;
    },
    isMobile: { value: boolean },
    sendCommand: (brandName: string, command: string) => Promise<void>
) => {
    const loadingStates = ref<Record<string, { feed: boolean; stop: boolean }>>({});
    const getStatusInfo = (status: RadioStationStatus): StatusInfo => {
        switch (status) {
            case 'ON_LINE':
                return { text: 'Online', type: 'success' };          
            case 'QUEUE_SATURATED':
                return { text: 'Queue Saturated', type: 'warning' };
            case 'WARMING_UP':
                return { text: 'Warming Up', type: 'warning' };
            case 'WAITING_FOR_CURATOR':
                return { text: 'Waiting for Curator', type: 'warning' };
            case 'IDLE':
                return { text: 'Idle', type: 'error' };
            case 'SYSTEM_ERROR':
                return { text: 'System Error', type: 'error' };
            case 'OFF_LINE':
            default:
                return { text: 'Offline', type: 'default' };
        }
    };
    const getManagedByInfo = (managedBy: string): ManagedByInfo => {
        switch (managedBy) {
            case 'AI_AGENT':
                return { text: 'AI-managed', type: 'info' };
            case 'ITSELF':
                return { text: 'Self-managed', type: 'default' };
            default:
                return { text: managedBy, type: 'default' };
        }
    };
    const disabledStates = ref<Record<string, { feed: boolean; stop: boolean }>>({});
    const handleCommand = async (brandName: string, command: 'feed' | 'stop') => {
        if (!loadingStates.value[brandName]) {
            loadingStates.value[brandName] = { feed: false, stop: false };
        }
        if (!disabledStates.value[brandName]) {
            disabledStates.value[brandName] = { feed: false, stop: false };
        }

        loadingStates.value[brandName][command] = true;

        try {
            await sendCommand(brandName, command);

            if (command === 'stop') {
                disabledStates.value[brandName].stop = true;
            }
        } finally {
            loadingStates.value[brandName][command] = false;
        }
    };

    return computed(() => {
        const baseColumns = [
            {
                title: 'Actions',
                key: 'actions',
                width: 120,
                render(row: StationRow) {
                    const stationLoading = loadingStates.value[row.brandName] || { feed: false, stop: false };
                    const stationDisabled = disabledStates.value[row.brandName] || { feed: false, stop: false };

                    return h(NSpace, {
                        size: 'small',
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }
                    }, {
                        default: () => [
                            h(NButton, {
                                size: 'small',
                                type: 'default',
                                secondary: true,
                                loading: stationLoading.feed,
                                disabled: stationDisabled.feed,
                                onClick: () => handleCommand(row.brandName, 'feed'),
                                style: 'width: 100%; background-color: #fef3c7; border-color: #f59e0b; color: #92400e;'
                            }, { default: () => 'Feed' }),
                            h(NButton, {
                                size: 'small',
                                type: 'default',
                                secondary: true,
                                loading: stationLoading.stop,
                                disabled: stationDisabled.stop,
                                onClick: () => handleCommand(row.brandName, 'stop'),
                                style: 'width: 100%; background-color: #fee2e2; border-color: #ef4444; color: #dc2626;'
                            }, { default: () => 'Stop' })
                        ]
                    });
                }
            },
            {
                title: 'State',
                key: 'state',
                width: 150,
                render(row: StationRow) {
                    const statusInfo = getStatusInfo(row.status);
                    const managedByInfo = getManagedByInfo(row.managedBy);

                    return h('div', {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }
                    }, [
                        h('div', {
                            style: {
                                fontWeight: 'bold',
                                fontSize: '1.1rem'
                            }
                        }, row.brandName),
                        h(NTag, {
                            type: statusInfo.type,
                            size: 'small',
                            style: 'margin: 0; width: fit-content;'
                        }, { default: () => statusInfo.text }),
                        h(NTag, {
                            type: managedByInfo.type,
                            size: 'small',
                            style: 'margin: 0; width: fit-content;',
                            bordered: false
                        }, { default: () => managedByInfo.text }),
                        h('div', {
                            style: {
                                fontSize: '0.8rem',
                                color: '#555'
                            }
                        }, `Alive: ${row.aliveTimeInHours}`)
                    ]);
                }
            },
            {
                title: 'Playlist manager / HLS Player',
                key: 'currentFragment',
                render(row: StationRow) {
                    return h(DesktopRow, {
                        row: {
                            ...row,
                        }
                    });
                }
            }
        ];

        if (isMobile.value) {
            return [
                {
                    title: 'Station',
                    key: 'combined',
                    render: (row: StationRow) => {
                        const details = dashboardStore.getStationDetails(row.brandName);
                        const stationDataForMobileRow = details ? { ...row, ...details } : { ...row };
                        const statusInfo = getStatusInfo(row.status);
                        const managedByInfo = getManagedByInfo(row.managedBy);
                        const stationLoading = loadingStates.value[row.brandName] || { feed: false, stop: false };
                        const stationDisabled = disabledStates.value[row.brandName] || { feed: false, stop: false };

                        return h(MobileRow, {
                            row: {
                                ...stationDataForMobileRow,
                                statusInfo,
                                managedByInfo,
                                // playlistManagerStats should now be part of stationDataForMobileRow if details were found
                            },
                            onFeed: () => handleCommand(row.brandName, 'feed'),
                            onStop: () => handleCommand(row.brandName, 'stop'),
                            loading: stationLoading,
                            disabled: stationDisabled
                        });
                    }
                }
            ];
        }

        return baseColumns;
    });
};