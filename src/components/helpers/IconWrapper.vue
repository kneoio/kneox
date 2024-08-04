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
    onMounted(() => {
      console.log('Icon loaded:', props.icon);
    });
  }
});
</script>
