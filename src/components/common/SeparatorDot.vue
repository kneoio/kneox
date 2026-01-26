<template>
  <span class="separator-dot">•</span>
</template>

<style scoped>
.separator-dot {
  display: inline-block;
  animation: colorCycle 3s ease-in-out infinite;
  margin: 0 8px;
  filter:
    brightness(1.8)
    saturate(1.6)
    drop-shadow(0 0 10px currentColor)
    drop-shadow(0 0 22px currentColor)
    drop-shadow(0 0 38px currentColor);
}

@keyframes colorCycle {
  0% { color: #ff6b6b; text-shadow: 0 0 14px #ff6b6b, 0 0 28px rgba(255, 107, 107, 1), 0 0 48px rgba(255, 107, 107, 0.95), 0 0 72px rgba(255, 107, 107, 0.8); }
  25% { color: #4ecdc4; text-shadow: 0 0 14px #4ecdc4, 0 0 28px rgba(78, 205, 196, 1), 0 0 48px rgba(78, 205, 196, 0.95), 0 0 72px rgba(78, 205, 196, 0.8); }
  50% { color: #45b7d1; text-shadow: 0 0 14px #45b7d1, 0 0 28px rgba(69, 183, 209, 1), 0 0 48px rgba(69, 183, 209, 0.95), 0 0 72px rgba(69, 183, 209, 0.8); }
  75% { color: #96ceb4; text-shadow: 0 0 14px #96ceb4, 0 0 28px rgba(150, 206, 180, 1), 0 0 48px rgba(150, 206, 180, 0.95), 0 0 72px rgba(150, 206, 180, 0.8); }
  100% { color: #ff6b6b; text-shadow: 0 0 14px #ff6b6b, 0 0 28px rgba(255, 107, 107, 1), 0 0 48px rgba(255, 107, 107, 0.95), 0 0 72px rgba(255, 107, 107, 0.8); }
}
</style>
