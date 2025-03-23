<template>
  <n-card title="Active Stations" :bordered="false" class="station-list-card">
    <n-data-table
        :columns="stationColumns"
        :data="stationsList"
        :pagination="{ pageSize: 5 }"
        :row-key="row => row.brandName"
    />
  </n-card>
</template>

<script setup lang="ts">
import { defineProps, computed, h } from 'vue';
import { NCard, NDataTable, NTag, NButton } from 'naive-ui';
import { Refresh } from '@vicons/tabler';
import StationRow from './StationRow.vue'; // Import the new component

const { dashboard, isMobile, handleStationAction } = defineProps({
  dashboard: {
    type: Object,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  handleStationAction: {
    type: Function,
    required: true
  }
});

// Extract stations list from the payload
const stationsList = computed(() => {
  return Object.values(dashboard.payload.stations);
});

const stationColumns = computed(() => {
  if (isMobile) {
    return [
      {
        title: 'Station',
        key: 'combined',
        render: (row) => h(StationRow, { station: row, isMobile, handleStationAction })
      }
    ];
  }

  return [
    {
      title: 'Name',
      key: 'brandName',
      width: 150
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render(row) {
        return h(
            NTag,
            {
              type: row.status === 'ON_LINE' ? 'success' :
                  row.status === 'WARMING_UP' ? 'info' : 'warning',
              style: 'margin: 0 auto;'
            },
            { default: () => row.status === 'ON_LINE' ? 'ONLINE' : row.status }
        );
      }
    },
    {
      title: 'Segments',
      key: 'segmentsSize',
      width: 100
    },
    {
      title: 'Bitrate',
      key: 'bitrate',
      width: 100,
      render(row) {
        return row.bitrate ? `${row.bitrate} kbps` : '-';
      }
    },
    {
      title: 'Current Fragment / Recently Played',
      key: 'currentFragment',
      render(row) {
        return h(StationRow, { station: row, isMobile: false, handleStationAction });
      }
    },
    {
      title: 'Action',
      key: 'actions',
      width: 100,
      render(row) {
        return h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => handleStationAction(row),
              renderIcon: () => h(Refresh)
            },
            { default: () => 'Refresh' }
        );
      }
    }
  ];
});
</script>

<style scoped>
.station-list-card {
  width: 100%;
}

@media (max-width: 768px) {
  .station-list-card {
    border-radius: 8px;
  }

  /* Fix for mobile table display */
  :deep(.n-data-table .n-data-table-td) {
    padding: 8px 4px;
    text-align: left;
  }

  :deep(.n-data-table-th) {
    padding: 8px 4px;
    text-align: left;
  }
}
</style>