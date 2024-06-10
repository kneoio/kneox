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
        :expanded-keys="defaultOpenKeys"
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
import {ProjectOutlined, UserOutlined} from '@vicons/antd';
import IconWrapper from "../helpers/IconWrapper.vue";
import {NLayout, NLayoutSider, NMenu,} from "naive-ui";

export default defineComponent({
  components: { IconWrapper, NMenu, NLayout, NLayoutSider },
  setup() {
    const defaultOpenKeys = ref(['/tasks']);
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
      { label: 'Projects', key: '/projects_and_tasks/projects', icon: () => h('IconWrapper', { icon: ProjectOutlined }) },
      {
        label: 'Tasks', key: '/tasks', icon: () => h('IconWrapper', { icon: ProjectOutlined }),
        children: [
          {
            label: 'By Author',
            key: '/projects_and_tasks/projects/by-author',
            icon: () => h('IconWrapper', { icon: UserOutlined })
          },
          {
            label: 'By project',
            key: '/projects_and_tasks/projects/by-project',
            icon: () => h('IconWrapper', { icon: ProjectOutlined })
          }
        ]
      }
    ];

    const selectedMenuKey = computed(() => {
      if (route.path.startsWith('/projects_and_tasks/projects')) {
        return '/projects_and_tasks/projects';
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
      defaultOpenKeys
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
