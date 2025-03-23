<template>
  <n-config-provider :theme="currentTheme" :theme-overrides="currentThemeOverrides">
    <n-button @click="toggleTheme" style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
      {{ isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme' }}
    </n-button>
    <router-view/>
  </n-config-provider>
</template>

<script>
import { NConfigProvider, NButton, darkTheme } from 'naive-ui';
import { ref, computed } from 'vue';

// Light theme overrides
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
    successColor: '#bc5090',
    successColorHover: '#cc60a0',
    successColorPressed: '#ac4070',
    successColorSuppl: '#cc60a0',
  }
};

// Dark theme overrides
const darkThemeOverrides = {
  common: {
    primaryColor: '#4CAF50', // Green for dark theme
    primaryColorHover: '#66BB6A',
    primaryColorPressed: '#388E3C',
    primaryColorSuppl: '#66BB6A',
    infoColor: '#2196F3', // Blue for dark theme
    infoColorHover: '#42A5F5',
    infoColorPressed: '#1E88E5',
    infoColorSuppl: '#42A5F5',
    warningColor: '#FFC107', // Amber for dark theme
    warningColorHover: '#FFCA28',
    warningColorPressed: '#FFB300',
    warningColorSuppl: '#FFCA28',
    errorColor: '#F44336', // Red for dark theme
    errorColorHover: '#EF5350',
    errorColorPressed: '#E53935',
    errorColorSuppl: '#EF5350',
    successColor: '#8BC34A', // Light green for dark theme
    successColorHover: '#9CCC65',
    successColorPressed: '#7CB342',
    successColorSuppl: '#9CCC65',
  }
};

export default {
  name: 'App',
  components: {
    NConfigProvider,
    NButton,
  },
  setup() {
    const isDarkTheme = ref(false);

    // Function to toggle theme
    const toggleTheme = () => {
      isDarkTheme.value = !isDarkTheme.value;
    };

    // Computed property to return the current theme
    const currentTheme = computed(() => {
      return isDarkTheme.value ? darkTheme : null; // null means light theme
    });

    // Computed property to return the current theme overrides
    const currentThemeOverrides = computed(() => {
      return isDarkTheme.value ? darkThemeOverrides : lightThemeOverrides;
    });

    return {
      currentTheme,
      currentThemeOverrides,
      isDarkTheme,
      toggleTheme,
    };
  }
}
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