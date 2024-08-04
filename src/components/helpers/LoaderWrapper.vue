<template>
  <svg
      class="spinner"
      width="50px"
      height="50px"
      viewBox="0 0 50 50"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
  >
    <circle
        class="path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke-width="5"
    ></circle>
  </svg>
</template>

<script lang="ts">
export default {
  name: "MyLoaderIcon",
};
</script>

<style scoped>
.spinner {
  animation: rotate 2s linear infinite;
}

.path {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  transform-origin: center;
  animation: dash 1.5s ease-in-out infinite, color 6s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

@keyframes color {
  100%,
  0% {
    stroke: #4285f4;
  }
  40% {
    stroke: #34a853;
  }
  66% {
    stroke: #fbbc05;
  }
  80%,
  90% {
    stroke: #ea4335;
  }
}
</style>
