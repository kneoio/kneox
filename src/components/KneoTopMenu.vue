<template>
  <n-layout-header :inverted="inverted" bordered>
    <div class="mobile-menu-button" @click="toggleMenu" v-show="isMobile">
      <n-icon>
        <menu-outlined/>
      </n-icon>
    </div>
    <n-grid x-gap="12" :cols="1">
      <n-gi>
        <n-menu mode="horizontal"
                :expanded-keys="expandedKeys"
                :inverted="inverted"
                :options="menuOptions"
                @update:value="handleNavigate"
                v-show="!isMobile || menuOpen"
                :value="selectedKey"/>
      </n-gi>
    </n-grid>
  </n-layout-header>
</template>

<script lang="ts">
import {EuroOutlined, MenuOutlined, ProjectOutlined, RobotOutlined} from "@vicons/antd";
import {Component, defineComponent, h, onMounted, onUnmounted, ref} from "vue";
import {NGi, NGrid, NIcon, NLayoutHeader, NMenu} from "naive-ui";
import {useRoute, useRouter} from "vue-router";

export default defineComponent({
  components: {
    NLayoutHeader,
    NGrid,
    NGi,
    NIcon,
    NMenu,
    MenuOutlined
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const selectedKey = ref(route.path === '/projects' ? '/projects_and_tasks/projects' : route.path);
    const menuOptions = [
      {
        label: 'Projects and tasks',
        key: '/projects_and_tasks/projects',
        icon: renderIcon(ProjectOutlined),
        action: () => router.push('/projects_and_tasks/projects')
      },
      {label: 'Assistant bot', key: '/ai', icon: renderIcon(RobotOutlined), action: () => router.push('/ai')},
      {
        label: 'References',
        key: '/references',
        icon: renderIcon(EuroOutlined),
        action: () => router.push('/'),
        disabled: false
      },

    ];
    const menuOpen = ref(false);
    const isMobile = ref(window.innerWidth < 768);
    const toggleMenu = () => {
      menuOpen.value = !menuOpen.value;
    };

    onMounted(() => {
      window.addEventListener('resize', updateIsMobile);
      if (route.path === '/projects') {
        router.push('/projects_and_tasks/projects');
        selectedKey.value = '/projects_and_tasks/projects';
      } else {
        selectedKey.value = route.path;
      }
    });

    onUnmounted(() => window.removeEventListener('resize', updateIsMobile));

    function renderIcon(icon: Component) {
      return () => h(NIcon, null, {default: () => h(icon)});
    }

    function updateIsMobile() {
      isMobile.value = window.innerWidth < 768;
    }

    window.addEventListener('resize', updateIsMobile);

    function handleNavigate(key: string): void {
      router.push(key);
      selectedKey.value = key;
      if (isMobile.value) {
        menuOpen.value = false;
      }
    }

    return {
      menuOptions,
      handleNavigate,
      inverted: ref(false),
      expandedKeys: ref(['projects']),
      menuOpen,
      toggleMenu,
      isMobile,
      selectedKey,
      MenuOutlined
    }
  }
});
</script>


<style scoped>
.mobile-menu-button {
  display: none;
  cursor: pointer;
  font-size: 24px;
  padding: 10px;
}

@media (max-width: 768px) {
  .mobile-menu-button {
    display: block;
  }

  n-menu {
    display: none;
  }
}
</style>
