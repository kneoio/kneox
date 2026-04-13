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
        :style="drawerStyle"
    >
      <div class="drawer-header">
        <n-space justify="space-between" align="center">
          <n-space>
            <n-h3 style=" font-weight:bold; font-family: 'Kaylon', sans-serif; margin-top: 0; margin-bottom: 0px;">MIXPLA</n-h3>
          </n-space>
          <n-switch
              :value="isDarkTheme"
              size="small"
              @update:value="toggleTheme"
              :round="false"
              :theme-overrides="{
                  railColor: '#ccc',
                  iconColor: '#000'
              }"
          >
            <template #checked-icon>
              <n-icon><Moon/></n-icon>
            </template>
            <template #unchecked-icon>
              <n-icon><Sun/></n-icon>
            </template>
          </n-switch>


        </n-space>
      </div>
      <div class="drawer-content" style="overflow-y: auto; max-height: calc(100vh - 140px);">
        <n-tree
            :data="treeData"
            :selected-keys="activeMenuKey ? [activeMenuKey] : []"
            :default-expanded-keys="defaultExpandedKeys"
            :show-line="true"
            :block-node="true"
            :expand-on-click="true"
            :animated="true"
            @update:selected-keys="handleTreeSelect"
            style="min-width: 250px;"
            :render-label="renderTreeLabel"
        />
      </div>
      <div class="drawer-footer">
        <img src="/logo.svg" alt="Mixpla" class="drawer-logo" />
        <div class="drawer-version">manager v.1.8.17</div>
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
      <router-view/>
    </div>
  </div>
</template>

<script lang="ts">
import {
  NFlex,
  NButton,
  NDrawer,
  NDrawerContent,
  NMenu,
  NTree,
  NSelect,
  NIcon,
  NH2,
  NH3,
  NH6,
  NSpace,
  NSwitch,
  useThemeVars
} from 'naive-ui';
import {
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  computed,
  provide,
  h,
  nextTick,
  inject,
  type Ref,
} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import {
  AlignJustified,
  Radio,
  Logout,
  Headphones,
  Sun,
  Moon,
  PictureInPictureTop,
  Fall,
  Settings
} from '@vicons/tabler';
import keycloakInst from '../keycloakFactory.js';
import StationPlaylist from "../components/lists/kneo/StationPlaylist.vue";
import Listeners from "../components/lists/kneo/Listeners.vue";
import DashboardView from "./DashboardView.vue";
import { useRadioStationStore } from '../stores/kneo/radioStationStore';

export default defineComponent({
  components: {
    NFlex,
    NButton,
    NDrawer,
    NDrawerContent,
    NMenu,
    NTree,
    NSelect,
    NIcon,
    NH2,
    NH3,
    NH6,
    NSpace,
    NSwitch,
    StationPlaylist,
    Listeners,
    DashboardView,
    Moon,
    Sun
  },
  setup() {
    const themeVars = useThemeVars();

    const router = useRouter();
    const route = useRoute();
    const radioStationStore = useRadioStationStore();

    const isDarkTheme = inject<Ref<boolean>>('isDarkTheme', ref(false));
    const toggleTheme = inject<(value: boolean) => void>('toggleTheme', () => {
    });

    const isMobile = ref(window.innerWidth <= 768);
    const isDrawerOpen = ref(false);
    const drawerWidth = ref(300);
    const active = ref(window.innerWidth > 768);
    const viewTitle = ref<string | null>(null);

    provide('parentTitle', viewTitle);

    const activeMenuKey = computed(() => {
      if (route.name === 'Dashboard') return 'dashboard';
      if (route.name === 'Player') return 'player';
      if (route.name === 'Brands') return 'brands';
      if (route.name === 'Listeners') return 'listeners';
      if (route.name === 'Profile') return 'profile';

      // Fix: Change 'StationDetail' to 'StationDashboard'
      if (route.name === 'StationDashboard' && route.params.brandName) {
        return `station-${route.params.brandName}-dashboard`;
      }
      if (route.name === 'StationPlaylist' && route.params.brandName) {
        return `station-${route.params.brandName}-playlist`;
      }
      if (route.name === 'StationListeners' && route.params.brandName) {
        return `station-${route.params.brandName}-listeners`;
      }
      if (route.name === 'StationChat' && route.params.brandName) {
        return `station-${route.params.brandName}-chat`;
      }
      if (route.name === 'Brand' && route.params.id) {
        return `station-${route.params.id}-settings`;
      }
      return null;
    });

    const handleMenuSelect = async (key: string) => {
      const shouldCloseDrawer = isMobile.value;

      if (key.startsWith('station-') && key.endsWith('-dashboard')) {
        const brandName = key.replace('station-', '').replace('-dashboard', '');
        await router.push({name: 'StationDashboard', params: {brandName: brandName}});
      } else if (key.startsWith('station-') && key.endsWith('-playlist')) {
        const brandName = key.replace('station-', '').replace('-playlist', '');
        await router.push({name: 'StationPlaylist', params: {brandName: brandName}});
      } else if (key.startsWith('station-') && key.endsWith('-listeners')) {
        const brandName = key.replace('station-', '').replace('-listeners', '');
        await router.push({name: 'StationListeners', params: {brandName: brandName}});
      } else if (key.startsWith('station-') && key.endsWith('-chat')) {
        const brandName = key.replace('station-', '').replace('-chat', '');
        await router.push({name: 'StationChat', params: {brandName: brandName}});
      } else if (key.startsWith('station-') && key.endsWith('-settings')) {
        const brandName = key.replace('station-', '').replace('-settings', '');
        await router.push({name: 'Brand', params: {id: brandName}});
      } else if (key === 'brands') {
        await router.push({name: 'Brands'});
      } else if (key === 'listeners') {
        await router.push({name: 'Listeners'});
      } else if (key === 'profile') {
        await router.push({name: 'Profile'});
      } else if (key === 'logout') {
        keycloakInst.logout({redirectUri: window.location.origin});
      } else if (key === 'dashboard') {
        await router.push({name: 'Dashboard'});
      } else if (key === 'player') {
        await router.push({name: 'Player'});
      }

      await nextTick();
      if (shouldCloseDrawer) {
        isDrawerOpen.value = false;
      }
      viewTitle.value = route.name?.toString() || '';
    };

    const handleContentClick = () => {
      if (isMobile.value && isDrawerOpen.value) {
        isDrawerOpen.value = false;
      }
    };

    const updateDrawerState = () => {
      const newIsMobile = window.innerWidth <= 768;
      isMobile.value = newIsMobile;

      isDrawerOpen.value = !newIsMobile;
    };

    const toggleDrawer = () => {
      isDrawerOpen.value = !isDrawerOpen.value;
    }

    onMounted(async () => {
      window.addEventListener('resize', updateDrawerState);
      updateDrawerState();
      await radioStationStore.fetchAll(1, 100);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateDrawerState);
    });

    const drawerStyle = computed(() => ({
      backgroundColor: themeVars.value.baseColor
    }));

    // Tree data structure
    const treeData = computed(() => [
      ...radioStationStore.getEntries.map(station => ({
        key: `radiostation-${station.slugName}`,
        label: station.slugName,
        children: [
          { key: `station-${station.slugName}-dashboard`, label: 'Dashboard' },
          { key: `station-${station.slugName}-playlist`, label: 'Playlist' },
          { key: `station-${station.slugName}-listeners`, label: 'Listeners' },
          { key: `station-${station.slugName}-settings`, label: 'Settings' }
        ]
      })),
      { key: 'brands', label: 'Brands' },
      { key: 'listeners', label: 'Listeners' },
      { key: 'profile', label: 'Profile' },
      { key: 'logout', label: 'Logout' }
    ]);

    const defaultExpandedKeys = computed(() => []);

    const handleTreeSelect = async (keys: Array<string | number>) => {
      const key = keys[0] as string;
      if (key) {
        await handleMenuSelect(key);
      }
    };

    const renderTreeLabel = ({ option }: { option: any }) => {
      if (option.key?.startsWith('radiostation-')) {
        return h('div', {
          style: 'display: flex; align-items: center; gap: 8px; width: 100%;'
        }, [
          h(NIcon, { size: 20 }, () => h(Radio)),
          h('span', {}, option.label)
        ]);
      }

      // Add icon for Settings option in station submenu
      if (option.key?.endsWith('-settings')) {
        return h('div', {
          style: 'display: flex; align-items: center; gap: 8px; width: 100%;'
        }, [
          h(NIcon, { size: 16 }, () => h(Settings)),
          h('span', {}, option.label)
        ]);
      }

      // Add icons for other nodes
      let iconComponent = null;
      if (option.key === 'brands') iconComponent = h(NIcon, { size: 25 }, () => h(PictureInPictureTop));
      else if (option.key === 'listeners') iconComponent = h(NIcon, { size: 25 }, () => h(Headphones));
      else if (option.key === 'profile') iconComponent = h(NIcon, { size: 25 }, () => h(Fall));
      else if (option.key === 'logout') iconComponent = h(NIcon, { size: 25 }, () => h(Logout));
      
      return h('div', {
        style: 'display: flex; align-items: center; gap: 8px; width: 100%;'
      }, [
        iconComponent,
        h('span', {}, option.label)
      ]);
    };

    return {
      active,
      treeData,
      defaultExpandedKeys,
      toggleDrawer,
      isMobile,
      viewTitle,
      isDrawerOpen,
      activeMenuKey,
      handleMenuSelect,
      handleTreeSelect,
      handleContentClick,
      drawerWidth,
      AlignJustified,
      drawerStyle,
      isDarkTheme,
      toggleTheme,
      Sun,
      Moon,
      renderTreeLabel
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
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.1);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 1000;
}

.drawer.drawer-open {
  transform: translateX(0);
}

.drawer-header {
  padding: 16px;
  border-bottom: 1px solid #9336f7;
}

.drawer-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.drawer-content {
  padding: 16px;
}

.drawer-footer {
  padding: 12px 16px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid #9336f7;
}

.drawer-logo {
  height: 22px;
  width: auto;
  display: block;
}

.drawer-version {
  font-size: 12px;
  opacity: 0.7;
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

.content h1 {
  margin: 0 0 1rem 0;
  font-size: 2rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .content {
    margin-left: 0 !important;
    padding: 8px;
  }
}
</style>

