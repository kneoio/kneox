<template>
  <div class="home">
    <div
        v-if="!isDrawerOpen"
        class="collapsed-drawer"
        @click="toggleDrawer"
    >
      <n-icon :component="AlignJustified" size="24"/>
    </div>

    <div
        class="drawer"
        :class="{ 'drawer-open': isDrawerOpen }"
    >
      <div class="drawer-header">
        <n-h2>kneox</n-h2>
      </div>
      <div class="drawer-content">
        <n-menu
            :options="menuOptions"
            :value="activeMenuKey"
            @update:value="handleMenuSelect"
        />
      </div>
    </div>

    <div
        class="content"
        :style="{
          marginLeft: isDrawerOpen && !isMobile ? `${drawerWidth}px` : '0',
          filter: isDrawerOpen && isMobile ? 'blur(1px)' : 'none'
        }"
        @click="handleContentClick"
    >
      <n-h1 style="padding-left: 20%">
        {{ viewTitle || "" }}
      </n-h1>
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import {NFlex, NH1, NH2, NButton, NDrawer, NDrawerContent, NMenu, NSelect, NIcon, MenuOption} from 'naive-ui';
import {
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  computed,
  provide,
  h,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {AlignJustified, List, Music, Radio} from '@vicons/tabler'

export default defineComponent({
  components: {
    NFlex,
    NH1,
    NH2,
    NButton,
    NDrawer,
    NDrawerContent,
    NMenu,
    NSelect,
    NIcon
  },
  setup() {
    const router = useRouter();
    const route = useRoute();

    const isMobile = ref(window.innerWidth <= 768);
    const isDrawerOpen = ref(!isMobile.value); // Open by default on desktop, closed on mobile
    const drawerWidth = ref(300);
    const active = ref(window.innerWidth > 768);
    const viewTitle = ref<string | null>(null);

    provide('parentTitle', viewTitle);

    // Compute menu key based on current route
    const activeMenuKey = computed(() => {
      if (route.name === 'RadioStationQueue') return 'queues';
      if (route.name === 'RadioStations') return 'brands';
      if (route.name === 'SoundFragments') return 'fragments';
      return null;
    });

    // Update view title based on route
    viewTitle.value = route.name?.toString() || '';

    const menuOptions: MenuOption[] = [
      {
        label: 'Queues',
        key: 'queues',
        icon: () => h(Radio)
      },
      {
        key: 'divider-1',
        type: 'divider',
        props: {
          style: {
            marginLeft: '32px',
            marginBottom: '10px',
            color: '#ffb700',
          }
        }
      },
      {
        label: 'Sound Fragments',
        key: 'fragments',
        icon: () => h(Music)
      },
      {
        label: 'Radio Stations',
        key: 'brands',
        icon: () => h(List)
      }
    ];

    const handleMenuSelect = (key: string) => {
      if (isMobile.value) {
        isDrawerOpen.value = false;
      }

      if (key === 'brands') {
        router.push({ name: 'Brands' });
      } else if (key === 'queues') {
        router.push({ name: 'RadioStationQueue' });
      } else if (key === 'fragments') {
        router.push({ name: 'SoundFragments' });
      }
    };

    const handleContentClick = () => {
      if (isMobile.value && isDrawerOpen.value) {
        isDrawerOpen.value = false;
      }
    };

    const updateDrawerState = () => {
      const newIsMobile = window.innerWidth <= 768;
      isMobile.value = newIsMobile;

      // Auto-open on desktop, auto-close on mobile
      isDrawerOpen.value = !newIsMobile;
    };

    const toggleDrawer = () => {
      isDrawerOpen.value = !isDrawerOpen.value;
    }

    onMounted(() => {
      window.addEventListener('resize', updateDrawerState);
      updateDrawerState(); // Initialize on mount
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateDrawerState);
    });

    return {
      active,
      menuOptions,
      toggleDrawer,
      isMobile,
      viewTitle,
      isDrawerOpen,
      activeMenuKey,
      handleMenuSelect,
      handleContentClick,
      drawerWidth,
      AlignJustified
    };
  }
});
</script>

<style scoped>
.home {
  position: relative;
}

/* Drawer (Sidebar) */
.drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100vh;
  background-color: #f8f8f8;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 1000;
}

.drawer.drawer-open {
  transform: translateX(0);
}

.drawer-header {
  padding: 16px;
  border-bottom: 1px solid #ac4070;
}

.drawer-content {
  padding: 16px;
}

/* Collapsed Drawer (Mini Version) */
.collapsed-drawer {
  position: fixed;
  top: 20px;
  left: 0;
  width: 50px;
  height: 50px;
  background-color: #ffb700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  border-radius: 0 8px 8px 0;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
}

.collapsed-drawer:hover {
  background-color: #e0e0e0;
}

.content {
  padding: 20px;
  transition: margin-left 0.3s ease;
}

@media (max-width: 768px) {
  .content {
    margin-left: 0 !important;
  }
}
</style>