import { computed, h } from 'vue';
import { NTag } from 'naive-ui';
import DesktopRow from "./DesktopRow.vue";
import SegmentsChart from "./SegmentsChart.vue";
import MobileRow from "./MobileRow.vue";

export const useStationColumns = (dashboard: any, isMobile: any) => {
    return computed(() => {
        const baseColumns = [
            {
                title: 'Name',
                key: 'brandName',
                width: 150,
                render(row: any) {
                    return h('div', {
                        style: {
                            'font-weight': 'bold',
                            'font-size': '1.1rem'
                        }
                    }, row.brandName);
                }
            },
            {
                title: 'Status',
                key: 'status',
                width: 120,
                render(row: any) {
                    const statusText = row.status === 'ON_LINE' ? 'Online' :
                        row.status === 'WARMING_UP' ? 'Warming up' :
                            row.status;
                    return h(
                        NTag,
                        {
                            type: row.status === 'ON_LINE' ? 'success' : 'warning',
                            style: 'margin: 0 auto;'
                        },
                        { default: () => statusText }
                    );
                }
            },
            {
                title: 'Segments',
                key: 'segmentsSize',
                width: 220,
                render(row: any) {
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
                                color: row.segmentsSize >= (dashboard.stats.minimumSegments || 280)
                                    ? '#18a058'
                                    : '#2080f0'
                            }
                        }, `${row.segmentsSize || 0}/${dashboard.stats.minimumSegments || 280}`),

                        h(SegmentsChart, {
                            history: row.segmentSizeHistory || [],
                            currentValue: row.segmentsSize || 0,
                            minSegments: dashboard.stats.minimumSegments || 280
                        })
                    ]);
                }
            },
            {
                title: 'Bitrate',
                key: 'bitrate',
                width: 100,
                render(row: any) {
                    return row.bitrate ? `${row.bitrate} kbps` : '-';
                }
            },
            {
                title: 'Current Fragment / Recently Played',
                key: 'currentFragment',
                render(row: any) {
                    return h(DesktopRow, { row });
                }
            }
        ];

        if (isMobile.value) {
            return [
                {
                    title: 'Station',
                    key: 'combined',
                    render: (row: any) => {
                        return h(MobileRow, { row });
                    }
                }
            ];
        }

        return baseColumns;
    });
};