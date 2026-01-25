<template>
  <span class="separator-dot">•</span>
</template>

<style scoped>
.separator-dot {
  display: inline-block;
  animation: colorCycle 3s ease-in-out infinite;
  margin: 0 8px;
}

@keyframes colorCycle {
  0% { color: #ff6b6b; text-shadow: 0 0 8px #ff6b6b; }
  25% { color: #4ecdc4; text-shadow: 0 0 8px #4ecdc4; }
  50% { color: #45b7d1; text-shadow: 0 0 8px #45b7d1; }
  75% { color: #96ceb4; text-shadow: 0 0 8px #96ceb4; }
  100% { color: #ff6b6b; text-shadow: 0 0 8px #ff6b6b; }
}
</style>
