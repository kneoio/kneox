<template>
  <transition name="fade">
    <div v-if="visible" class="gdpr-banner" :class="{ dark: isDark }">
      <div class="gdpr-content">
        <span :style="{ color: isDark ? '#e0e0e0 !important' : '#333 !important' }">
          We use necessary cookies to run this site. See the About page for details.
        </span>
        <div class="gdpr-actions">
          <a class="learn-more" href="/about" :style="{ color: isDark ? '#e0e0e0 !important' : '#333 !important' }">Learn more</a>
          <n-button type="primary" size="small" @click="accept">Accept</n-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { NButton } from 'naive-ui'

const visible = ref(false)
const isDarkRef = inject('isDarkTheme', ref(false))
const isDark = computed(() => !!(isDarkRef && 'value' in isDarkRef ? isDarkRef.value : isDarkRef))

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

function setCookie(name, value, days = 365) {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

function accept() {
  setCookie('cookie_consent', 'accepted', 365 * 5)
  visible.value = false
}

onMounted(() => {
  visible.value = getCookie('cookie_consent') !== 'accepted'
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.gdpr-banner {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: #ffffff;
  color: #333;
  border-top: 1px solid #e0e0e0;
}
.gdpr-banner.dark {
  background: #1f1f1f;
  color: #ffffff;
  border-top: 1px solid #333;
}
.gdpr-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.gdpr-actions { display: flex; gap: 12px; align-items: center; }
.learn-more { text-decoration: underline; }


@media (max-width: 640px) {
  .gdpr-content { flex-direction: column; align-items: flex-start; }
}
</style>
