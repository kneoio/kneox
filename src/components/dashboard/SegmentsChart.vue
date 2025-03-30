<template>
  <div class="segments-chart-container">
    <div class="chart-wrapper">
      <canvas ref="chartCanvas"></canvas>
      <div class="y-axis">
        <span>{{ yAxisMax }}</span>
        <span>{{ Math.floor(yAxisMax * 0.66) }}</span>
        <span>{{ Math.floor(yAxisMax * 0.33) }}</span>
        <span>0</span>
      </div>
    </div>
    <div class="x-axis">
      <span>150s ago</span>
      <span>now</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch, computed } from 'vue';
import { Chart, type ChartOptions, type ChartData } from 'chart.js/auto';

export default defineComponent({
  props: {
    history: {
      type: Array as () => number[],
      required: true
    },
    currentValue: {
      type: Number,
      required: true
    },
    minSegments: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const chartCanvas = ref<HTMLCanvasElement | null>(null);
    let chartInstance: Chart | null = null;

    const yAxisMax = computed(() => {
      const maxHistory = Math.max(...props.history, props.minSegments);
      return Math.ceil(maxHistory * 1.2); // 20% headroom
    });

    const createChart = () => {
      if (!chartCanvas.value) return;

      const data: ChartData = {
        labels: Array(props.history.length).fill(''),
        datasets: [
          {
            data: props.history,
            borderColor: '#2080f0',
            borderWidth: 2,
            tension: 0.3,
            fill: {
              target: 'origin',
              above: 'rgba(32, 128, 240, 0.05)'
            },
            pointRadius: 0
          },
          {
            data: [
              ...Array(props.history.length - 1).fill(null),
              props.currentValue
            ],
            borderColor: props.currentValue >= props.minSegments ? '#18a058' : '#d03050',
            borderWidth: 0,
            pointBackgroundColor: props.currentValue >= props.minSegments ? '#18a058' : '#d03050',
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            data: Array(props.history.length).fill(props.minSegments),
            borderColor: '#e0e0e0',
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }
        ]
      };

      const options: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: false,
            grid: { display: false }
          },
          y: {
            min: 0,
            max: yAxisMax.value,
            display: false,
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        animation: {
          duration: 300
        }
      };

      if (chartInstance) {
        chartInstance.data = data;
        chartInstance.options.scales!.y!.max = yAxisMax.value;
        chartInstance.update();
      } else {
        chartInstance = new Chart(chartCanvas.value, {
          type: 'line',
          data,
          options
        });
      }
    };

    onMounted(createChart);
    watch(() => [props.history, props.currentValue], createChart);

    return { chartCanvas, yAxisMax };
  }
});
</script>

<style scoped>
.segments-chart-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100px;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.chart-wrapper {
  display: flex;
  height: 70px;
  position: relative;
  margin-top: 4px;
}

canvas {
  flex-grow: 1;
  margin-left: 32px;
}

.y-axis {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #666;
  text-align: right;
  padding-right: 6px;
  border-right: 1px solid #e0e0e0;
}

.x-axis {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #666;
  padding: 6px 0 0 32px;
  margin-top: 4px;
}
</style>