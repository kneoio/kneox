import {computed, h} from 'vue';
import {NTag} from 'naive-ui';
import DesktopRow from "./DesktopRow.vue";
import MobileRow from "./MobileRow.vue";

export const useStationColumns = (dashboardStore: any, isMobile: any) => {
    return computed(() => {
        const baseColumns = [
            {
                title: 'State',
                key: 'state',
                width: 150,
                render(row: any) {
                    const statusText = row.status === 'ON_LINE' ? 'Online' :  row.status === 'ON_LINE_WELL' ? 'Online, fed' :
                        row.status === 'WARMING_UP' ? 'Warming up' :
                            row.status;
                    const managedByText = row.managedBy === 'ITSELF' ? 'Self-managed' :
                        row.managedBy === 'AI_AGENT' ? 'AI-managed' :
                            row.managedBy;
                    const managedByType = row.managedBy === 'AI_AGENT' ? 'info' : 'default';

                    return h('div', {
                            style: {
                                display: 'flex',
                                'flex-direction': 'column',
                                gap: '4px'
                            }
                        },
                        [
                            h('div', {
                                style: {
                                    'font-weight': 'bold',
                                    'font-size': '1.1rem'
                                }
                            }, row.brandName),
                            h(NTag, {
                                type: row.status === 'ON_LINE' ? 'success' : 'warning',
                                size: 'small',
                                style: 'margin: 0; width: fit-content;'
                            }, {default: () => statusText}),
                            h(NTag, {
                                type: managedByType,
                                size: 'small',
                                style: 'margin: 0; width: fit-content;',
                                bordered: false
                            }, {default: () => managedByText}),
                            h('div', {
                                style: {
                                    'font-size': '0.8rem',
                                    'color': '#555'
                                }
                            }, `Alive: ${row.aliveTimeInHours}`),
                            h('div', {
                                style: {
                                    'font-size': '0.8rem',
                                    'color': '#555'
                                }
                            }, `Last slide: ${row.lastSlide}`),
                        ]);
                }
            },
            {
                title: 'Playlist manager / HLS Player',
                key: 'currentFragment',
                render(row: any) {
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
                    render: (row: any) => {
                        const stationDetails = dashboardStore.getStationDetails(row) || row;
                        return h(MobileRow, {
                            row: {
                                ...row,
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