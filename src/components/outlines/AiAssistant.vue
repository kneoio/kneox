<template>
  <n-layout-sider
      bordered
      v-show="sidebarOpen || !isMobile"
      show-trigger
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :native-scrollbar="false"
      :inverted="inverted"
  >
    <n-menu
        :inverted="inverted"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="projectMenuOptions"
        :value="selectedMenuKey"
    />
  </n-layout-sider>
  <button class="sidebar-toggle" @click="toggleSidebar" v-show="isMobile">&#9776;</button>
  <n-layout class="layout-content-expand">
    <router-view></router-view>
  </n-layout>
</template>

<script lang="ts">
import {computed, defineComponent, h, ref} from 'vue';
import {useRoute} from 'vue-router';
import {ProjectOutlined} from '@vicons/antd';
import IconWrapper from "../helpers/IconWrapper.vue";
import {NLayout, NLayoutSider, NMenu,} from "naive-ui";

export default defineComponent({
  components: { IconWrapper, NMenu, NLayout, NLayoutSider },
  setup() {
    const route = useRoute();
    const sidebarOpen = ref(false);
    const isMobile = ref(window.innerWidth < 768);
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    window.addEventListener('resize', () => {
      isMobile.value = window.innerWidth < 768;
    });

    const projectMenuOptions = [
      { label: 'Assistant', key: '/ai/chat', icon: () => h('IconWrapper', { icon: ProjectOutlined }) }

    ];

    const selectedMenuKey = computed(() => {
      if (route.path.startsWith('/projects-and-tasks/projects')) {
        return '/projects-and-tasks/projects';
      }
      return '';
    });

    return {
      projectMenuOptions,
      inverted: ref(false),
      sidebarOpen,
      toggleSidebar,
      isMobile,
      selectedMenuKey,
    };
  }
});
</script>

<style scoped>
.sidebar-toggle {
  display: none;
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}

@media (max-width: 768px) {
  .sidebar-toggle {
    display: block;
  }

  n-layout-sider {
    display: none;
  }
}
</style>
