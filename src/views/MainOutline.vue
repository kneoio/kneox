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
        <n-h2>IOMIX</n-h2>
      </div>
      <div class="drawer-content">
        <n-menu
            :options="dynamicMenuOptions"
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
      <h1 style="padding-left: 20%">
        {{ viewTitle || "" }}
      </h1>
      <router-view/>
    </div>
  </div>
</template>

<script lang="ts">
import {NFlex, NButton, NDrawer, NDrawerContent, NMenu, NSelect, NIcon, NH2, MenuOption} from 'naive-ui';
import {
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  computed,
  provide,
  h,
  nextTick,
  watchEffect,
} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import { AlignJustified, List, Music, Dashboard, Robot, Grain, Radio, Users, Logout, BrandAirtable } from '@vicons/tabler';
import {useRadioStationStore} from "../stores/kneo/radioStationStore";
import {RadioStation, BrandStatus} from "../types/kneoBroadcasterTypes";
import keycloakInst from '../keycloakFactory.js';

export default defineComponent({
  components: {
    NFlex,
    NButton,
    NDrawer,
    NDrawerContent,
    NMenu,
    NSelect,
    NIcon,
    NH2
  },
  setup() {

    const router = useRouter();
    const route = useRoute();
    const radioStationStore = useRadioStationStore();

    const isMobile = ref(window.innerWidth <= 768);
    const isDrawerOpen = ref(!isMobile.value);
    const drawerWidth = ref(300);
    const active = ref(window.innerWidth > 768);
    const viewTitle = ref<string | null>(null);
    const radioStations = ref<RadioStation[]>([]);
    const isLoadingStations = ref(false);

    provide('parentTitle', viewTitle);

    const fetchRadioStations = async () => {
      try {
        isLoadingStations.value = true;
        await radioStationStore.fetchAll();
        radioStations.value = radioStationStore.getEntries || [];
      } catch (error) {
        console.error('Failed to fetch radio stations:', error);
        radioStations.value = [];
      } finally {
        isLoadingStations.value = false;
      }
    };

    const activeMenuKey = computed(() => {
      
      if (route.name === 'Dashboard') return 'dashboard';
      if (route.name === 'Player') return 'player';
      if (route.name === 'RadioStations') return 'radiostations';
      if (route.name === 'SoundFragments') return 'fragments';
      if (route.name === 'Memories') return 'memories';
      if (route.name === 'AiAgents') return 'ai_agents';
      if (route.name === 'EnvironmentProfiles') return 'environment_profiles';
      if (route.name === 'StationDetail' && route.params.brandName) {
        return `station-${route.params.brandName}-dashboard`;
      }
      if (route.name === 'StationPlaylist' && route.params.brandName) {
        return `station-${route.params.brandName}-playlist`;
      }
      if (route.name === 'StationListeners' && route.params.brandName) {
        return `station-${route.params.brandName}-listeners`;
      }
      return null;
    });

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'ON_LINE':
          return '#00aa00';
        case 'ON_LINE_WELL':
          return '#00ff00';
        case 'WARMING_UP':
          return '#ffa500';
        case 'WAITING_FOR_CURATOR':
          return '#ff69b4';
        case 'IDLE':
          return '#bd621c';
        case 'SYSTEM_ERROR':
          return '#ff0000';
        case 'OFF_LINE':
        default:
          return '#5a5a5a';
      }
    };

    const dynamicMenuOptions = computed<MenuOption[]>(() => {
      const baseOptions: MenuOption[] = [
        {
          label: 'Dashboard',
          key: 'dashboard',
          icon: () => h(Dashboard)
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
        }
      ];

      // Create individual radio station options
      const radioStationOptions: MenuOption[] = radioStations.value.map((station: RadioStation) => ({
        label: () => h('div', {
          style: 'display: flex; align-items: center; gap: 8px;'
        }, [
          h('div', {
            style: `width: 8px; height: 8px; border-radius: 50%; background-color: ${getStatusColor(BrandStatus[station.status])};`
          }),
          h('span', {}, station.slugName),
          h('span', {
            style: 'font-size: 0.75rem; color: #666; margin-left: auto;'
          }, station.country || '')
        ]),
        key: `radiostation-${station.slugName}`,
        icon: () => h(Radio, { size: 16 }),
        children: [
          {
            label: 'Dashboard',
            key: `station-${station.slugName}-dashboard`
          },
          {
            label: 'Playlist',
            key: `station-${station.slugName}-playlist`
          },
          {
            label: 'Listeners',
            key: `station-${station.slugName}-listeners`
          }
        ]
      }));

      const allStationsOption: MenuOption = {
        label: 'All Stations',
        key: 'radiostations',
        icon: () => h(List)
      };

      const remainingOptions: MenuOption[] = [
        {
          label: 'Sound Fragments',
          key: 'fragments',
          icon: () => h(Music)
        },
        {
          label: 'Environment Profiles',
          key: 'environment_profiles',
          icon: () => h(BrandAirtable)
        },
        {
          label: 'Memories',
          key: 'memories',
          icon: () => h(Grain)
        },
        {
          label: 'DJs',
          key: 'djs',
          icon: () => h(Users)
        },
        {
          label: 'AiAgents',
          key: 'ai_agents',
          icon: () => h(Robot)
        },
        {
          type: 'divider',
          key: 'd1'
        },
        {
          label: 'Logout',
          key: 'logout',
          icon: () => h(Logout)
        }
      ];

      return [
        ...baseOptions,
        ...radioStationOptions,
        ...(radioStationOptions.length > 0 ? [allStationsOption] : []),
        ...remainingOptions
      ];
    });

    const handleMenuSelect = async (key: string) => {
      if (isMobile.value) {
        isDrawerOpen.value = false;
      }

      if (key.startsWith('station-') && key.endsWith('-dashboard')) {
        const brandName = key.replace('station-', '').replace('-dashboard', '');
        await router.push({name: 'StationDetail', params: {brandName: brandName}});
      } else if (key.startsWith('station-') && key.endsWith('-playlist')) {
        const brandName = key.replace('station-', '').replace('-playlist', '');
        await router.push({ name: 'StationPlaylist', params: { brandName: brandName } });
      } else if (key.startsWith('station-') && key.endsWith('-listeners')) {
        const brandName = key.replace('station-', '').replace('-listeners', '');
        await router.push({ name: 'StationListeners', params: { brandName: brandName } });
      } else if (key === 'radiostations') {
        await router.push({name: 'RadioStations'});
      } else if (key === 'logout') {
        keycloakInst.logout({ redirectUri: window.location.origin });
      } else if (key === 'djs') {
        await router.push({name: 'EnvironmentProfiles'});
      } else if (key === 'dashboard') {
        await router.push({name: 'Dashboard'});
      } else if (key === 'player') {
        await router.push({name: 'Player'});
      } else if (key === 'fragments') {
        await router.push({name: 'SoundFragments'});
      } else if (key === 'memories') {
        await router.push({name: 'Memories'});
      } else if (key === 'ai_agents') {
        await router.push({name: 'AiAgents'});
      } else if (key === 'environment_profiles') {
        await router.push({name: 'EnvironmentProfiles'});
      }

      await nextTick();
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

      // Auto-open on desktop, auto-close on mobile
      isDrawerOpen.value = !newIsMobile;
    };

    const toggleDrawer = () => {
      isDrawerOpen.value = !isDrawerOpen.value;
    }

    onMounted(() => {
      window.addEventListener('resize', updateDrawerState);
      updateDrawerState();
      fetchRadioStations();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateDrawerState);
    });

    watchEffect(() => {
      if (radioStationStore.getEntries) {
        radioStations.value = radioStationStore.getEntries;
      }
    });

    onMounted(() => {
      const intervalId = setInterval(() => {
        if (!isLoadingStations.value) {
          fetchRadioStations();
        }
      }, 30000); // Refresh every 30 seconds

      onUnmounted(() => {
        clearInterval(intervalId);
      });
    });

    return {
      active,
      dynamicMenuOptions,
      toggleDrawer,
      isMobile,
      viewTitle,
      isDrawerOpen,
      activeMenuKey,
      handleMenuSelect,
      handleContentClick,
      drawerWidth,
      AlignJustified,
      isLoadingStations
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

.drawer-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
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

.content h1 {
  margin: 0 0 1rem 0;
  font-size: 2rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .content {
    margin-left: 0 !important;
  }
}
</style>