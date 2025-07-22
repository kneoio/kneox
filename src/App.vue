<template>
  <n-loading-bar-provider>
    <n-message-provider>
      <n-config-provider
          :theme="currentTheme"
          :theme-overrides="currentThemeOverrides"
          :style="{ backgroundColor: isDarkTheme ? '#1a1a1a' : '#f8f8f8', minHeight: '100vh' }"
          class="theme-provider"
      >
        <n-switch
            v-model:value="isDarkTheme"
            size="large"
            style="position: fixed; top: 20px; right: 20px; z-index: 1000;"
            @update:value="saveThemePreference"
        >
          <template #checked-icon>
            <n-icon :component="Moon"/>
          </template>
          <template #unchecked-icon>
            <n-icon :component="Sun"/>
          </template>
        </n-switch>
        <router-view/>
      </n-config-provider>
    </n-message-provider>
  </n-loading-bar-provider>
</template>

<script setup>
import {NConfigProvider, NSwitch, NIcon, darkTheme, NLoadingBarProvider, NMessageProvider} from 'naive-ui'
import {ref, computed, onMounted} from 'vue'
import {Sun, Moon} from '@vicons/tabler'

const isDarkTheme = ref(false)

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
    primaryColor: '#4CAF50',
    primaryColorHover: '#66BB6A',
    primaryColorPressed: '#388E3C',
    primaryColorSuppl: '#66BB6A',
    infoColor: '#2196F3',
    infoColorHover: '#42A5F5',
    infoColorPressed: '#1E88E5',
    infoColorSuppl: '#42A5F5',
    warningColor: '#FFC107',
    warningColorHover: '#FFCA28',
    warningColorPressed: '#FFB300',
    warningColorSuppl: '#FFCA28',
    errorColor: '#F44336',
    errorColorHover: '#EF5350',
    errorColorPressed: '#E53935',
    errorColorSuppl: '#EF5350',
    successColor: '#8BC34A',
    successColorHover: '#9CCC65',
    successColorPressed: '#7CB342',
    successColorSuppl: '#9CCC65',

    bodyColor: '#1a1a1a',
    textColorBase: '#f0f0f0',
    textColor1: '#f0f0f0',
    textColor2: '#d0d0d0',
    textColor3: '#b0b0b0',
    textColorDisabled: '#666',
    placeholderColor: '#888',
    placeholderColorDisabled: '#555',
    iconColor: '#d0d0d0',
    iconColorHover: '#f0f0f0',
    iconColorPressed: '#b0b0b0',
    iconColorDisabled: '#666',
    opacity1: '0.82',
    opacity2: '0.72',
    opacity3: '0.38',
    opacity4: '0.24',
    opacity5: '0.18',
    dividerColor: '#333',
    borderColor: '#333',
    closeIconColor: '#d0d0d0',
    closeIconColorHover: '#f0f0f0',
    closeIconColorPressed: '#b0b0b0',
    closeColorHover: 'rgba(255, 255, 255, .09)',
    closeColorPressed: 'rgba(255, 255, 255, .13)',
    clearColor: '#d0d0d0',
    clearColorHover: '#f0f0f0',
    clearColorPressed: '#b0b0b0',
    scrollbarColor: 'rgba(255, 255, 255, .2)',
    scrollbarColorHover: 'rgba(255, 255, 255, .3)',
    scrollbarWidth: '5px',
    scrollbarHeight: '5px',
    scrollbarBorderRadius: '5px',
    progressRailColor: '#333',
    railColor: '#333',
    popoverColor: '#2a2a2a',
    tableColor: '#1a1a1a',
    cardColor: '#2a2a2a',
    modalColor: '#2a2a2a',
    baseColor: '#1a1a1a',
    inputColor: '#2a2a2a',
    inputColorDisabled: '#1a1a1a',
    actionColor: '#333',
    tableHeaderColor: '#2a2a2a',
    hoverColor: 'rgba(255, 255, 255, 0.09)',
    tableColorHover: 'rgba(255, 255, 255, 0.09)',
    tableColorStriped: 'rgba(255, 255, 255, 0.05)',
    pressedColor: 'rgba(255, 255, 255, 0.13)'
  },
  PageHeader: {
    titleTextColor: '#f0f0f0',
    subtitleTextColor: '#d0d0d0',
    footerTextColor: '#d0d0d0'
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, days = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function saveThemePreference() {
  setCookie('theme-preference', isDarkTheme.value ? 'dark' : 'light');
}

onMounted(() => {
  const savedTheme = getCookie('theme-preference');
  if (savedTheme) {
    isDarkTheme.value = savedTheme === 'dark';
  }
});

const currentTheme = computed(() => {
  return isDarkTheme.value ? darkTheme : null
})

const currentThemeOverrides = computed(() => {
  return isDarkTheme.value ? darkThemeOverrides : lightThemeOverrides
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

.theme-provider[style*="background-color: rgb(248, 248, 248)"] *:not(.n-button):not(.n-button *) {
  color: inherit !important;
}

.theme-provider[style*="background-color: rgb(26, 26, 26)"] {
  color: #f0f0f0 !important;
}

.theme-provider[style*="background-color: rgb(26, 26, 26)"] *:not(.n-button):not(.n-button *) {
  color: inherit !important;
}
</style>