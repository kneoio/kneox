<template>
  <n-loading-bar-provider>
    <n-message-provider>
      <n-config-provider
          :theme="currentTheme"
          :theme-overrides="currentThemeOverrides"
          :style="{ backgroundColor: currentBackgroundColor, minHeight: '100vh' }"
          class="theme-provider"
      >
        <router-view/>
        <GdprBanner />
      </n-config-provider>
    </n-message-provider>
  </n-loading-bar-provider>
</template>

<script setup>
import GdprBanner from './components/common/GdprBanner.vue'
import {NConfigProvider, NLoadingBarProvider, NMessageProvider, darkTheme} from 'naive-ui'
import {ref, computed, onMounted, provide} from 'vue'
import {useRoute} from 'vue-router'

const route = useRoute()
const isDarkTheme = ref(false)

provide('isDarkTheme', isDarkTheme)
provide('toggleTheme', (newValue) => {
  isDarkTheme.value = newValue
  saveThemePreference()
})

const lightThemeOverrides = {
  common: {
    primaryColor: '#003f5c',
    primaryColorHover: '#004f6d',
    primaryColorPressed: '#002e4b',
    primaryColorSuppl: '#004f6d',
    infoColor: '#58508d',
    infoColorHover: '#68609d',
    infoColorPressed: '#47407d',
    infoColorSuppl: '#68609d',
    warningColor: '#ffa600',
    warningColorHover: '#ffb700',
    warningColorPressed: '#ff9500',
    warningColorSuppl: '#ffb700',
    errorColor: '#ff6361',
    errorColorHover: '#ff7371',
    errorColorPressed: '#ff5251',
    errorColorSuppl: '#ff7371',
    successColor: '#5e9e15',
    successColorHover: '#9CCC65',
    successColorPressed: '#7CB342',
    successColorSuppl: '#9CCC65',

    bodyColor: '#f8f8f8',
    textColorBase: '#333',
    borderColor: '#e0e0e0',

    color: '#f8f8f8',
    textColor: '#333',

  }
}

const darkThemeOverrides = {
  common: {
    primaryColor: '#2196F3',
    primaryColorHover: '#42A5F5',
    primaryColorPressed: '#1E88E5',
    primaryColorSuppl: '#42A5F5',
    bodyColor: '#1a1a1a',
    textColorBase: '#f0f0f0',
    textColor1: '#f0f0f0',
    textColor2: '#d0d0d0',
    textColor3: '#b0b0b0',
    textColorDisabled: '#666',
    placeholderColor: '#888',
    iconColor: '#d0d0d0',
    iconColorHover: '#f0f0f0',
    dividerColor: '#333',
    borderColor: '#333',
    baseColor: '#1a1a1a',
    inputColor: '#2a2a2a',
    cardColor: '#2a2a2a',
    modalColor: '#2a2a2a',
    popoverColor: '#2a2a2a',
    tableColor: '#1a1a1a',
    tableHeaderColor: '#2a2a2a',
    hoverColor: 'rgba(255, 255, 255, 0.09)',
    tableColorHover: 'rgba(255, 255, 255, 0.09)',
    pressedColor: 'rgba(255, 255, 255, 0.13)'
  },
  PageHeader: {
    titleTextColor: '#f0f0f0',
    subtitleTextColor: '#d0d0d0',
    footerTextColor: '#d0d0d0'
  }
}

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

function saveThemePreference() {
  setCookie('theme', isDarkTheme.value ? 'dark' : 'light')
}

// Check route scopes
const isProtectedArea = computed(() => route.path.startsWith('/outline'))
const allowPublicDark = computed(() => route.path === '/about')

// Apply dark theme in protected area and About page
const currentTheme = computed(() => {
  return (isProtectedArea.value || allowPublicDark.value) && isDarkTheme.value ? darkTheme : null
})

const currentThemeOverrides = computed(() => {
  if ((isProtectedArea.value || allowPublicDark.value) && isDarkTheme.value) {
    return darkThemeOverrides
  }
  return lightThemeOverrides
})

const currentBackgroundColor = computed(() => {
  if ((isProtectedArea.value || allowPublicDark.value) && isDarkTheme.value) {
    return '#1a1a1a'
  }
  return '#f8f8f8'
})

// Initialize from cookie or OS preference
const initTheme = () => {
  const savedTheme = getCookie('theme')
  if (savedTheme) {
    isDarkTheme.value = savedTheme === 'dark'
  } else if (window.matchMedia) {
    // Default to light theme when no preference is saved
    isDarkTheme.value = false
  }
}

initTheme()

// Removed auto-switching with OS preference to keep light as default when no cookie

onMounted(() => {
  initTheme()
})
</script>

<style>
body {
  margin: 20px;
}

@media (min-width: 768px) {
  body {
    margin: 10px;
  }
}

.theme-provider {
  color: #333;
}

.theme-provider[style*="background-color: rgb(248, 248, 248)"] {
  color: #333 !important;
}

.theme-provider[style*="background-color: rgb(248, 248, 248)"] *:not(.n-button):not(.n-button *):not(.n-upload *):not(.n-upload-file-list *):not(.gdpr-banner):not(.gdpr-banner *) {
  color: inherit !important;
}

.theme-provider[style*="background-color: rgb(26, 26, 26)"] {
  color: #e0e0e0 !important;
}

.theme-provider[style*="background-color: rgb(26, 26, 26)"] *:not(.n-button):not(.n-button *):not(.n-upload *):not(.n-upload-file-list *):not(.gdpr-banner):not(.gdpr-banner *) {
  color: inherit !important;
}
</style>