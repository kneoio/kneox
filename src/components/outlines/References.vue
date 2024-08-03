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
        :options="menuOptions"
        :value="selectedMenuKey"
        :expanded-keys="defaultOpenKeys"
        @update:value="handleMenuSelect"
    />
  </n-layout-sider>
  <button class="sidebar-toggle" @click="toggleSidebar" v-show="isMobile">&#9776;</button>
  <n-layout class="layout-content-expand">
    <router-view></router-view>
  </n-layout>
</template>

<script lang="ts">
import {computed, defineComponent, h, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {ProjectOutlined, UserOutlined} from '@vicons/antd';
import IconWrapper from "../helpers/IconWrapper.vue";
import {NLayout, NLayoutSider, NMenu} from "naive-ui";

export default defineComponent({
  components: { IconWrapper, NMenu, NLayout, NLayoutSider },
  setup() {
    const defaultOpenKeys = ref(['/references/lookups']);
    const route = useRoute();
    const router = useRouter();
    const sidebarOpen = ref(false);
    const isMobile = ref(window.innerWidth < 768);

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    window.addEventListener('resize', () => {
      isMobile.value = window.innerWidth < 768;
    });

    const menuOptions = [
      { label: 'Organizations', key: '/references/organizations', icon: () => h('IconWrapper', { icon: ProjectOutlined }) },
      { label: 'Employees', key: '/references/employees', icon: () => h('IconWrapper', { icon: ProjectOutlined }) },
      {
        label: 'Lookups', key: '/references/lookups', icon: () => h('IconWrapper', { icon: ProjectOutlined }),
        children: [
          {
            label: 'Languages',
            key: '/references/lookups/languages',
            icon: () => h('IconWrapper', { icon: UserOutlined })
          },
          {
            label: 'Labels',
            key: '/references/lookups/labels',
            icon: () => h('IconWrapper', { icon: ProjectOutlined })
          },
          {
            label: 'Organization categories',
            key: '/references/lookups/org-category',
            icon: () => h('IconWrapper', { icon: ProjectOutlined })
          },
          {
            label: 'Positions',
            key: '/references/lookups/positions',
            icon: () => h('IconWrapper', { icon: ProjectOutlined })
          },
          {
            label: 'Task types',
            key: '/references/lookups/task-types',
            icon: () => h('IconWrapper', { icon: ProjectOutlined })
          }
        ]
      }
    ];

    const selectedMenuKey = computed(() => route.path);

    const handleMenuSelect = (key: string) => {
      router.push(key);
    };

    return {
      menuOptions,
      defaultOpenKeys,
      inverted: ref(false),
      sidebarOpen,
      toggleSidebar,
      isMobile,
      selectedMenuKey,
      handleMenuSelect
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
