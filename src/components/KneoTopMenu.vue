<template>
  <n-layout-header :inverted="inverted" bordered>
    <div class="mobile-menu-button" @click="toggleMenu" v-show="isMobile">
      <!-- Simple hamburger icon -->
      <n-icon><menu-outlined /></n-icon>
    </div>
    <n-grid x-gap="12" :cols="1">
      <n-gi>
        <n-menu mode="horizontal" :expanded-keys="expandedKeys" :inverted="inverted"
                :options="menuOptions" @update:value="handleNavigate" v-show="!isMobile || menuOpen" />
      </n-gi>
    </n-grid>
  </n-layout-header>
</template>

<script lang="ts">
import {
  EuroOutlined,
  ProjectOutlined,
  RobotOutlined,
  MenuOutlined
} from "@vicons/antd";
import {Component, defineComponent, h, ref, onMounted, onUnmounted} from "vue";
import {NGrid, NGi, NIcon, NMenu, NLayoutHeader} from "naive-ui";
import { useRouter } from "vue-router";

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
    const menuOptions = [
      { label: 'Projects and tasks', key: '/projects', icon: renderIcon(ProjectOutlined), action: () => router.push('/projects') },
      { label: 'Debts', key: '/money', icon: renderIcon(EuroOutlined), action: () => router.push('/money'), disabled: true },
      { label: 'Assistant bot', key: '/ai', icon: renderIcon(RobotOutlined), action: () => router.push('/ai') }
    ];

    function renderIcon(icon: Component) {
      return () => h(NIcon, null, {default: () => h(icon)});
    }

    const menuOpen = ref(false);
    const isMobile = ref(window.innerWidth < 768);
    const toggleMenu = () => { menuOpen.value = !menuOpen.value; };

    function updateIsMobile() {
      isMobile.value = window.innerWidth < 768;
    }

    window.addEventListener('resize', updateIsMobile);
    onMounted(() => window.addEventListener('resize', updateIsMobile));
    onUnmounted(() => window.removeEventListener('resize', updateIsMobile));

    function handleNavigate(key: string): void {
      console.log("Navigating to:", key);
      router.push(key);
      if (isMobile.value) {
        menuOpen.value = false;  // Automatically close the menu on selection
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
      MenuOutlined
    }
  }
});
</script>

<style scoped>
.mobile-menu-button {
  display: none; /* Hide by default */
  cursor: pointer;
  font-size: 24px;
  padding: 10px;
}

@media (max-width: 768px) {
  .mobile-menu-button {
    display: block; /* Show hamburger menu on small screens */
  }

  n-menu {
    display: none; /* Initially hide menu */
  }
}
</style>
