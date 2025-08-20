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
            <n-h2>MixpL^</n-h2>
            <n-h6 style="color:#6c757d; font-size: small">manager v.1.8.9</n-h6>
          </n-space>
          <n-switch
              :value="isDarkTheme"
              size="small"
              @update:value="toggleTheme"
              :round="false"
          >
            <template #checked-icon>
              <n-icon color="#0e7a0d">
                <Moon/>
              </n-icon>
            </template>
            <template #unchecked-icon>
              <n-icon>
                <Sun/>
              </n-icon>
            </template>
          </n-switch>
        </n-space>
      </div>
      <div class="drawer-content" style="overflow-y: auto; max-height: calc(100vh - 80px);">
        <n-menu
            :options="dynamicMenuOptions"
            :value="activeMenuKey"
            @update:value="handleMenuSelect"
            style="min-width: 250px;"
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
  NSelect,
  NIcon,
  NH2,
  NH6,
  NSpace,
  MenuOption,
  useThemeVars,
  NSwitch
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
  watchEffect,
  inject,
  type Ref,
} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import {
  AlignJustified,
  List,
  Music,
  Dashboard,
  Robot,
  Grain,
  Radio,
  Logout,
  BrandAirtable,
  Headphones,
  Sun,
  Moon,
  Calendar
} from '@vicons/tabler';
import {useRadioStationStore} from "../stores/kneo/radioStationStore";
import {RadioStation, BrandStatus} from "../types/kneoBroadcasterTypes";
import keycloakInst from '../keycloakFactory.js';
import SoundFragments from '../components/lists/kneo/SoundFragments.vue';
import StationPlaylist from "../components/lists/kneo/StationPlaylist.vue";
import Listeners from "../components/lists/kneo/Listeners.vue";
import DashboardView from "./DashboardView.vue";

export default defineComponent({
  components: {
    NFlex,
    NButton,
    NDrawer,
    NDrawerContent,
    NMenu,
    NSelect,
    NIcon,
    NH2,
    NH6,
    NSpace,
    NSwitch,
    SoundFragments,
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

    const getStatusColor = (status: BrandStatus) => {
      switch (status) {
        case BrandStatus.ON_LINE:
          return '#00aa00';
        case BrandStatus.QUEUE_SATURATED:
          return '#00aa00';
        case BrandStatus.WARMING_UP:
          return '#ffa500';
        case BrandStatus.WAITING_FOR_CURATOR:
          return '#ff69b4';
        case BrandStatus.IDLE:
          return '#bd621c';
        case BrandStatus.SYSTEM_ERROR:
          return '#ff0000';
        case BrandStatus.OFF_LINE:
        default:
          return '#5a5a5a';
      }
    };

    const dynamicMenuOptions = computed<MenuOption[]>(() => {
      const userRoles = keycloakInst.tokenParsed?.realm_access?.roles || [];
      const isSupervisor = userRoles.includes('supervisor');

      const radioStationOptions: MenuOption[] = radioStations.value.map((station: RadioStation) => ({
        label: () => h('div', {
          style: 'display: flex; align-items: center; gap: 8px;'
        }, [
          h('div', {
            style: `width: 8px; height: 8px; border-radius: 50%; background-color: ${getStatusColor(station.status)};`
          }),
          h('span', {}, station.localizedName.en),
          h('span', {
            style: 'font-size: 0.75rem; color: #666; margin-left: auto;'
          }, station.country || '')
        ]),
        key: `radiostation-${station.slugName}`,
        icon: () => h(Radio, {size: 16}),
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
        label: 'All Radiostations',
        key: 'radiostations',
        icon: () => h(List)
      };

      const logoutOption: MenuOption = {
        label: () => h('div', {style: 'display: flex; flex-direction: column;'}, [
          h('div', 'Logout'),
          h('div', {
            style: 'font-size: 0.75rem; color: #666; margin-top: 2px;',
            title: keycloakInst.tokenParsed?.email || keycloakInst.tokenParsed?.preferred_username || ''
          }, keycloakInst.tokenParsed?.preferred_username || '')
        ]),
        key: 'logout',
        icon: () => h(Logout)
      };

      if (!isSupervisor) {
        return [
          ...radioStationOptions,
          {
            key: 'divider-2',
            type: 'divider',
            props: {
              style: {
                marginLeft: '32px',
                marginBottom: '10px',
                color: '#ffb700',
              }
            }
          },
          allStationsOption,
          {
            type: 'divider',
            key: 'd1'
          },
          logoutOption
        ];
      }

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

      const remainingOptions: MenuOption[] = [
        {
          label: 'Listeners',
          key: 'listeners',
          icon: () => h(Headphones)
        },
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
          label: 'Events',
          key: 'events',
          icon: () => h(Calendar)
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
          label: () => h('div', {style: 'display: flex; flex-direction: column;'}, [
            h('div', 'Logout'),
            h('div', {
              style: 'font-size: 0.75rem; color: #666; margin-top: 2px;',
              title: keycloakInst.tokenParsed?.email || keycloakInst.tokenParsed?.preferred_username || ''
            }, keycloakInst.tokenParsed?.preferred_username || '')
          ]),
          key: 'logout',
          icon: () => h(Logout)
        }
      ];

      return [
        ...baseOptions,
        ...radioStationOptions,
        {
          key: 'divider-2',
          type: 'divider',
          props: {
            style: {
              marginLeft: '32px',
              marginBottom: '10px',
              color: '#ffb700',
            }
          }
        },
        allStationsOption,
        ...remainingOptions
      ];
    });

    const activeMenuKey = computed(() => {
      if (route.name === 'Dashboard') return 'dashboard';
      if (route.name === 'Player') return 'player';
      if (route.name === 'RadioStations') return 'radiostations';
      if (route.name === 'SoundFragments') return 'fragments';
      if (route.name === 'Memories') return 'memories';
      if (route.name === 'Events') return 'events';
      if (route.name === 'AiAgents') return 'ai_agents';
      if (route.name === 'EnvironmentProfiles') return 'environment_profiles';
      if (route.name === 'Listeners') return 'listeners';

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
      return null;
    });

    const handleMenuSelect = async (key: string) => {
      if (isMobile.value) {
        isDrawerOpen.value = false;
      }

      if (key.startsWith('station-') && key.endsWith('-dashboard')) {
        const brandName = key.replace('station-', '').replace('-dashboard', '');
        await router.push({name: 'StationDashboard', params: {brandName: brandName}});
      } else if (key.startsWith('station-') && key.endsWith('-playlist')) {
        const brandName = key.replace('station-', '').replace('-playlist', '');
        await router.push({name: 'StationPlaylist', params: {brandName: brandName}});
      } else if (key.startsWith('station-') && key.endsWith('-listeners')) {
        const brandName = key.replace('station-', '').replace('-listeners', '');
        await router.push({name: 'StationListeners', params: {brandName: brandName}});
      } else if (key === 'radiostations') {
        await router.push({name: 'RadioStations'});
      } else if (key === 'listeners') {
        await router.push({name: 'Listeners'});
      } else if (key === 'logout') {
        keycloakInst.logout({redirectUri: window.location.origin});
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
      } else if (key === 'events') {
        await router.push({name: 'Events'});
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

    const drawerStyle = computed(() => ({
      backgroundColor: themeVars.value.baseColor
    }));

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
      isLoadingStations,
      drawerStyle,
      isDarkTheme,
      toggleTheme,
      Sun,
      Moon

    };
  }
});
</script>

<style>
/* Global theme styles for the protected area */
.theme-provider {
  color: #333;
}

.theme-provider[style*="background-color: rgb(248, 248, 248)"] {
  color: #333 !important;
}

.theme-provider[style*="background-color: rgb(248, 248, 248)"] *:not(.n-button):not(.n-button *) {
  color: inherit !important;
}

.theme-provider[style*="background-color: rgb(26, 26, 26)"] {
  color: #f0f0f0 !important;
}

.theme-provider[style*="background-color: rgb(26, 26, 26)"] *:not(.n-button):not(.n-button *) {
  color: inherit !important;
}
</style>

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