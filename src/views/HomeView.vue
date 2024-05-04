<template>
    <n-layout class="layout-full-height">
      <kneo-header/>
      <kneo-top-menu/>
      <n-layout has-sider class="layout-content-expand">
        <kneo-projects-outline/>
      </n-layout>
      <n-layout-footer :inverted="inverted" bordered>
        <n-grid :x-gap="12" :cols="4">
          <n-gi>
          </n-gi>
          <n-gi :offset="2" style="margin-top: 3px; margin-right: 5px;  width: 10%; justify-self: end;">
            <n-select v-model="selectedLanguage" :options="languageOptions" default-value="en" />
          </n-gi>
        </n-grid>
      </n-layout-footer>
    </n-layout>

</template>

<script lang="ts">
import {defineComponent, ref, inject} from 'vue'
import {
  NSpace,
  NIcon,
  NLayout,
  NLayoutHeader,
  NLayoutFooter,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NButton,
  NList, NListItem, NSelect, NH1, NH6, NGrid, NGi, NDataTable
} from 'naive-ui'
import KneoHeader from "../components/KneoHeader.vue";
import KneoTopMenu from "../components/KneoTopMenu.vue";
import KneoProjectsOutline from "../components/KneoProjectsOutline.vue";

const selectedLanguage = ref('en');

const languageOptions = [
  {label: 'English', value: 'en'},
  {label: 'Portuguese', value: 'pt'},
];

export default defineComponent({
  components: {
    KneoProjectsOutline,
    KneoTopMenu,
    KneoHeader,
    NLayout,
    NSpace,
    NIcon,
    NLayoutSider,
    NLayoutHeader,
    NLayoutContent,
    NLayoutFooter,
    NMenu,
    NButton,
    NList,
    NListItem,
    NSelect,
    NDataTable,
    NH1,
    NH6,
    NGrid,
    NGi,
  },
  setup() {
    const userData = inject<any>('userData');

    return {
      userData,
      selectedLanguage,
      languageOptions,
      pagination: false as const,
      inverted: ref(false),
    }
  }
})
</script>

<style scoped>
.layout-full-height {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Change to min-height to ensure it at least covers the viewport */
  overflow: hidden; /* Add this if you want to avoid any unwanted overflow */
}

.layout-content-expand {
  flex-grow: 1; /* This will ensure it takes up all available space */
  display: flex;
  flex-direction: column; /* This ensures all child elements are aligned vertically */
}

</style>