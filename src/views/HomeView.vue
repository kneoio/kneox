<template>
    <n-layout class="layout-full-height">
      <kneo-header/>
      <kneo-top-menu/>
      <n-layout has-sider class="layout-content-expand">
        <router-view/>
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
  min-height: 100vh;
  overflow: hidden;
}

.layout-content-expand {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) { /* Adjustments for tablets and below */
  .layout-full-height {
    flex-direction: column;
  }

  .layout-content-expand {
    flex-direction: column; /* Stack elements vertically on smaller screens */
  }

  n-layout-footer {
    padding: 12px 20px; /* Reduce padding on smaller screens */
  }

  .n-gi {
    flex-basis: 100%; /* Stack grid items vertically */
    margin-top: 10px;
    justify-content: center; /* Center content */
  }

  n-select {
    width: 100%; /* Full width for select boxes */
  }
}

@media (max-width: 480px) { /* Adjustments for phones */
  .layout-content-expand {
    padding: 0 10px; /* Reduce padding on very small screens */
  }

  kneo-top-menu,
  kneo-header {
    display: none; /* Optionally hide top menu and header on very small screens */
  }
}
</style>
