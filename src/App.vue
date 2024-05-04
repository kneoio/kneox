<template>
  <n-config-provider :font-size="20">
    <n-loading-bar-provider>
      <n-message-provider>
        <router-view/>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script>
import {NConfigProvider, NLoadingBarProvider, NMessageProvider} from 'naive-ui';

export default {
  name: 'App',
  components: {
    NConfigProvider,
    NLoadingBarProvider,
    NMessageProvider
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