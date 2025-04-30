<template>
  <n-config-provider
      :theme="currentTheme"
      :theme-overrides="currentThemeOverrides"
      class="theme-provider"
  >
    <n-switch
        v-model:value="isDarkTheme"
        size="large"
        style="position: fixed; top: 20px; right: 20px; z-index: 1000;"
    >
      <template #checked-icon>
        <n-icon :component="Moon" />
      </template>
      <template #unchecked-icon>
        <n-icon :component="Sun" />
      </template>
    </n-switch>
    <router-view />
  </n-config-provider>
</template>

<script setup>
import { NConfigProvider, NSwitch, NIcon, darkTheme } from 'naive-ui'
import { ref, computed } from 'vue'
import { Sun, Moon } from '@vicons/tabler'

const isDarkTheme = ref(false)

// Theme overrides with all required colors
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

    // Custom colors for drawer
    bodyColor: '#f8f8f8',
    textColorBase: '#333',
    borderColor: '#e0e0e0',

    // These ensure CSS variables are generated
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

    // Custom colors for drawer
    bodyColor: '#1a1a1a',
    textColorBase: '#f0f0f0',
    borderColor: '#333',

    // These ensure CSS variables are generated
    color: '#1a1a1a',
    textColor: '#f0f0f0',

  }
}

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
</style>