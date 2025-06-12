import { computed, h } from 'vue';
import { NTag } from 'naive-ui';
import DesktopRow from "./DesktopRow.vue";
import MobileRow from "./MobileRow.vue";

// Define type for NTag component's type prop
type NTagType = 'success' | 'warning' | 'error' | 'default' | 'info';

// Define all possible radio station statuses
type RadioStationStatus =
    | 'ON_LINE'
    | 'ON_LINE_WELL'
    | 'WARMING_UP'
    | 'WAITING_FOR_CURATOR'
    | 'IDLE'
    | 'SYSTEM_ERROR'
    | 'OFF_LINE';

// Define structure for status information
interface StatusInfo {
    text: string;
    type: NTagType;
}

// Define structure for managed by information
interface ManagedByInfo {
    text: string;
    type: NTagType;
}

// Define the row data structure
interface StationRow {
    status: RadioStationStatus;
    managedBy: 'ITSELF' | 'AI_AGENT' | string;
    brandName: string;
    aliveTimeInHours: number;
    [key: string]: any; // Allow additional properties
}

export const useStationColumns = (
    dashboardStore: {
        getStationDetails: (row: StationRow) => StationRow | undefined;
    },
    isMobile: { value: boolean }
) => {
    // Helper function to get status information
    const getStatusInfo = (status: RadioStationStatus): StatusInfo => {
        switch (status) {
            case 'ON_LINE':
                return { text: 'Online', type: 'success' };
            case 'ON_LINE_WELL':
                return { text: 'Online (Well)', type: 'success' };
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

    // Helper function to get managed by information
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

    return computed(() => {
        const baseColumns = [
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
                        const stationDetails = dashboardStore.getStationDetails(row) || row;
                        const statusInfo = getStatusInfo(row.status);
                        const managedByInfo = getManagedByInfo(row.managedBy);

                        return h(MobileRow, {
                            row: {
                                ...row,
                                statusInfo,
                                managedByInfo,
                                playlistManagerStats: stationDetails.playlistManagerStats || {}
                            }
                        });
                    }
                }
            ];
        }

        return baseColumns;
    });
};