<template>
  <n-config-provider :font-size="20">
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

export default {
  name: 'App',
  components: {
    NConfigProvider,
    NLoadingBarProvider,
    NMessageProvider,
  }
}

</script>

<style>

/* In your global CSS file or within a style tag in App.vue */
:root {
  --n-primary-color: #ffa500; /* Orange color */
}


body {
  margin: 20px;
}

@media (min-width: 768px) {
  body {
    margin: 10px;
  }
}

</style>