<template>
  <n-layout-footer :inverted="inverted" bordered class="p-4">
    <n-grid :x-gap="12" :cols="4">
      <n-gi></n-gi>
      <n-gi :offset="2" class="w-32 mt-1 mr-1 justify-end">
        <n-select v-model="selectedLanguage" :options="languageOptions" default-value="en"/>
      </n-gi>
    </n-grid>
  </n-layout-footer>
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue';
import {NGi, NGrid, NLayoutFooter, NSelect} from 'naive-ui';

const selectedLanguage = ref('en');

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Portuguese', value: 'pt' },
];

export default defineComponent({
  components: {
    NLayoutFooter,
    NGrid,
    NGi,
    NSelect,
  },
  setup() {
    return {
      selectedLanguage,
      languageOptions,
      inverted: ref(false),
    };
  },
});
</script>

<style scoped>
/* Add any additional styles if necessary */
</style>
