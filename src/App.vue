<template>
  <n-loading-bar-provider
      :theme-overrides="{
    colorLoading: '#9336f7',
    colorError: '#ff6361'
  }"
  >
    <n-message-provider>
      <n-config-provider
          :theme="darkTheme"
          :theme-overrides="currentThemeOverrides"
      >
        <n-global-style />
        <router-view/>
        <GdprBanner />
      </n-config-provider>
    </n-message-provider>
  </n-loading-bar-provider>

</template>

<script setup>
import GdprBanner from './components/common/GdprBanner.vue'
import {NConfigProvider, NGlobalStyle, NLoadingBarProvider, NMessageProvider, darkTheme} from 'naive-ui'
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

    bodyColor: '#f8f8f8',
    baseColor: '#f8f8f8',
    inputColor: '#fff',
    cardColor: '#fff',
    modalColor: '#fff',
    popoverColor: '#fff',
    tableColor: '#fff',
    tableHeaderColor: '#f0f0f0',
    hoverColor: 'rgba(0, 0, 0, 0.05)',
    tableColorHover: 'rgba(0, 0, 0, 0.05)',
    pressedColor: 'rgba(0, 0, 0, 0.08)',
    textColor: '#333',
    textColorBase: '#333',
    textColor1: '#333',
    textColor2: '#555',
    textColor3: '#777',
    textColorDisabled: '#aaa',
    closeIconColor: '#1e1f22',
    placeholderColor: '#999',
    iconColor: '#555',
    iconColorHover: '#222',

    dividerColor: '#e0e0e0',
    borderColor: '#e0e0e0'
  },
  PageHeader: {
    titleTextColor: '#333',
    subtitleTextColor: '#555',
    footerTextColor: '#777'
  },
  Timeline: {
    lineColor: '#777'
  }
}


const darkThemeOverrides = {
  common: {
    primaryColor: '#2196F3',
    primaryColorHover: '#42A5F5',
    primaryColorPressed: '#1E88E5',
    primaryColorSuppl: '#42A5F5',
    bodyColor: '#1a1a1a',
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
    pressedColor: 'rgba(255, 255, 255, 0.13)',
    textColor: '#f0f0f0',      
    textColorBase: '#f0f0f0',  
  },
  PageHeader: {
    titleTextColor: '#f0f0f0',
    subtitleTextColor: '#d0d0d0',
    footerTextColor: '#d0d0d0'
  },
  Checkbox: {
    border: '1px solid #888',
    borderChecked: '1px solid #60a5fa',
    borderFocus: '1px solid #60a5fa',
    colorChecked: '#60a5fa'
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

const currentThemeOverrides = computed(() => {
  if (isDarkTheme.value) {
    return darkThemeOverrides
  }
  return lightThemeOverrides
})


const initTheme = () => {
  const savedTheme = getCookie('theme')
  if (savedTheme) {
    isDarkTheme.value = savedTheme === 'dark'
  } else if (window.matchMedia) {
    isDarkTheme.value = true
  }
}

initTheme()

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

</style>