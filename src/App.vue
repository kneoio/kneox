<template>
  <n-loading-bar-provider>
    <n-message-provider>
      <n-config-provider 
        :theme="darkTheme"
        :theme-overrides="currentThemeOverrides"
        :hljs="hljs"
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
import hljs from 'highlight.js/lib/core'

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
    pressedColor: 'rgba(255, 255, 255, 0.13)',
    textColor: '#f0f0f0',      
    textColorBase: '#f0f0f0',  
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
    isDarkTheme.value = false
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