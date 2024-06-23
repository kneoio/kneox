<template>
    <n-layout>
      <kneo-header/>
      <kneo-top-menu/>
      <n-layout has-sider class="layout-content-expand">
        <router-view/>
      </n-layout>
      <kneo-footer :inverted="inverted" />
    </n-layout>

</template>

<script lang="ts">
import {defineComponent, inject, ref} from 'vue'
import {
  NButton,
  NDataTable,
  NGi,
  NGrid,
  NH1,
  NH6,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutFooter,
  NLayoutHeader,
  NLayoutSider,
  NList,
  NListItem,
  NMenu,
  NSelect,
  NSpace
} from 'naive-ui'
import KneoHeader from "../components/common/KneoHeader.vue";
import KneoTopMenu from "../components/KneoTopMenu.vue";
import KneoProjectsOutline from "../components/outlines/ProjectAndTasks.vue";
import KneoFooter from "../components/common/KneoFooter.vue";

const selectedLanguage = ref('en');

const languageOptions = [
  {label: 'English', value: 'en'},
  {label: 'Portuguese', value: 'pt'},
];

export default defineComponent({
  components: {
    KneoFooter,
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
