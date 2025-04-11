import { computed, h } from 'vue';
import { NTag } from 'naive-ui';
import DesktopRow from "./DesktopRow.vue";
import SegmentsChart from "./SegmentsChart.vue";
import MobileRow from "./MobileRow.vue";

export const useStationColumns = (dashboardStore: any, isMobile: any) => {
    return computed(() => {
        const baseColumns = [
            {
                title: 'Brand',
                key: 'brandName',
                width: 150,
                render(row: any) {
                    // Get the full station details from the store
                    const stationDetails = dashboardStore.getStationDetails(row.brandName) || row;

                    const statusText = stationDetails.status === 'ON_LINE' ? 'Online' :
                        stationDetails.status === 'WARMING_UP' ? 'Warming up' :
                            stationDetails.status;

                    const managedByText = stationDetails.managedBy === 'ITSELF' ? 'Self-managed' :
                        stationDetails.managedBy === 'AI_AGENT' ? 'AI-managed' :
                            stationDetails.managedBy;

                    const managedByType = stationDetails.managedBy === 'AI_AGENT' ? 'info' : 'default';

                    return h('div', {
                        style: {
                            display: 'flex',
                            'flex-direction': 'column',
                            gap: '4px'
                        }
                    }, [
                        h('div', {
                            style: {
                                'font-weight': 'bold',
                                'font-size': '1.1rem'
                            }
                        }, stationDetails.brandName),
                        h(
                            NTag,
                            {
                                type: stationDetails.status === 'ON_LINE' ? 'success' : 'warning',
                                size: 'small',
                                style: 'margin: 0; width: fit-content;'
                            },
                            { default: () => statusText }
                        ),
                        h(
                            NTag,
                            {
                                type: managedByType,
                                size: 'small',
                                style: 'margin: 0; width: fit-content;',
                                bordered: false
                            },
                            { default: () => managedByText }
                        )
                    ]);
                }
            },
            {
                title: 'Segments',
                key: 'segmentsSize',
                width: 220,
                render(row: any) {
                    // Get the full station details from the store
                    const stationDetails = dashboardStore.getStationDetails(row.brandName) || row;
                    const minSegments = dashboardStore.stats.minimumSegments || 280;

                    return h('div', {
                        style: {
                            display: 'flex',
                            'flex-direction': 'column',
                            gap: '4px'
                        }
                    }, [
                        h('div', {
                            style: {
                                'font-weight': 'bold',
                                'text-align': 'center',
                                color: stationDetails.segmentsSize >= minSegments
                                    ? '#18a058'
                                    : '#2080f0'
                            }
                        }, `${stationDetails.segmentsSize || 0}/${minSegments}`),

                        h(SegmentsChart, {
                            history: stationDetails.segmentSizeHistory || [],
                            currentValue: stationDetails.segmentsSize || 0,
                            minSegments: minSegments
                        })
                    ]);
                }
            },
            {
                title: 'Current Fragment / Recently Played',
                key: 'currentFragment',
                render(row: any) {
                    // Get the full station details from the store
                    const stationDetails = dashboardStore.getStationDetails(row.brandName) || row;
                    return h(DesktopRow, {
                        row: {
                            ...row,
                            ...stationDetails,
                            // Merge playlist data if available
                            playlistManagerStats: stationDetails.playlistManagerStats || {}
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
                        // Get the full station details from the store
                        const stationDetails = dashboardStore.getStationDetails(row.brandName) || row;
                        return h(MobileRow, {
                            row: {
                                ...row,
                                ...stationDetails,
                                // Merge playlist data if available
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