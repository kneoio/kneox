<template>
  <span class="separator-dot">•</span>
</template>

<style scoped>
.separator-dot {
  display: inline-block;
  animation: colorCycle 3s ease-in-out infinite;
  margin: 0 8px;
  filter: brightness(1.25);
}

@keyframes colorCycle {
  0% { color: #ff6b6b; text-shadow: 0 0 10px #ff6b6b, 0 0 18px rgba(255, 107, 107, 0.9), 0 0 28px rgba(255, 107, 107, 0.7); }
  25% { color: #4ecdc4; text-shadow: 0 0 10px #4ecdc4, 0 0 18px rgba(78, 205, 196, 0.9), 0 0 28px rgba(78, 205, 196, 0.7); }
  50% { color: #45b7d1; text-shadow: 0 0 10px #45b7d1, 0 0 18px rgba(69, 183, 209, 0.9), 0 0 28px rgba(69, 183, 209, 0.7); }
  75% { color: #96ceb4; text-shadow: 0 0 10px #96ceb4, 0 0 18px rgba(150, 206, 180, 0.9), 0 0 28px rgba(150, 206, 180, 0.7); }
  100% { color: #ff6b6b; text-shadow: 0 0 10px #ff6b6b, 0 0 18px rgba(255, 107, 107, 0.9), 0 0 28px rgba(255, 107, 107, 0.7); }
}
</style>
