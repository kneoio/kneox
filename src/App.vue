<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-loading-bar-provider>
          <router-view/>
        </n-loading-bar-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script>
import {NConfigProvider, NLoadingBarProvider, NMessageProvider} from 'naive-ui';

const themeOverrides = {
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

export default {
  name: 'App',
  components: {
    NConfigProvider,
    NLoadingBarProvider,
    NMessageProvider,
  },
  setup() {
    return {
      themeOverrides
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
