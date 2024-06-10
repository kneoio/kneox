<template>
  <NIcon>
    <component :is="icon" />
  </NIcon>
</template>

<script lang="ts">
import { defineComponent, PropType, onMounted } from 'vue';
import { NIcon } from 'naive-ui';
import { Component } from '@vue/runtime-core';

export default defineComponent({
  components: {
    NIcon
  },
  props: {
    icon: {
      type: Object as PropType<Component>,
      required: true
    }
  },
  setup(props) {
    // This lifecycle hook is called after the component has been mounted,
    // which is a good time to log the props as the component has been initialized.
    onMounted(() => {
      console.log('Icon loaded:', props.icon); // Logging the icon to see what is received
    });
  }
});
</script>
