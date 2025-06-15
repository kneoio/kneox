<template>
  <div class="listeners-view p-4">
    <n-h1>Listeners</n-h1>
    <p v-if="brandName">Displaying listeners for station: {{ brandName }}</p>
    <p>Listener data will be displayed here.</p>
    <n-empty description="No listener data available yet." />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { NH1, NEmpty } from 'naive-ui';

export default defineComponent({
  name: 'ListenersView',
  components: {
    NH1,
    NEmpty
  },
  props: {
    brandName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    // Logic for fetching and displaying listeners will go here
    console.log('ListenersView for brand:', props.brandName);
    return {
      // returned data
    };
  },
});
</script>

<style scoped>
/* Add any specific styles for ListenersView here if needed */
</style>
