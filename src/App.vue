<template>
  <n-config-provider :font-size="20">
    <n-loading-bar-provider>
      <router-view/>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script>
import {NConfigProvider} from 'naive-ui';

export default {
  name: 'App',
  components: {
    NConfigProvider
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