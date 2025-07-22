<template>
  <div class="flex flex-col min-h-screen">
    <n-layout-footer :inverted="inverted" bordered class="p-4" :style="footerStyle">
      <n-grid :x-gap="12" :cols="4">
        <n-gi></n-gi>
        <n-gi :offset="2" class="w-32 mt-1 mr-1 justify-end">
          <n-select v-model="selectedLanguage" :options="languageOptions" default-value="en"/>
        </n-gi>
      </n-grid>
    </n-layout-footer>
  </div>
</template>

<script lang="ts">
import {defineComponent, ref, computed} from 'vue';
import {NGi, NGrid, NLayoutFooter, NSelect, useThemeVars} from 'naive-ui';

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
    const themeVars = useThemeVars();
    
    const footerStyle = computed(() => ({
      backgroundColor: themeVars.value.baseColor
    }));

    return {
      selectedLanguage,
      languageOptions,
      inverted: ref(false),
      footerStyle,
    };
  },
});
</script>
