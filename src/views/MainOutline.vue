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
            <n-h6 style="font-size: small">manager v.1.8.15</n-h6>
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
      <div class="drawer-content" style="overflow-y: auto; max-height: calc(100vh - 80px);">
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
  MenuOption,
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
  Calendar,
  User,
  FileText,
  Prompt,
  Ripple,
  PictureInPictureTop,
  Tent,
  BuildingSkyscraper,
  Fall,
  ToiletPaper,
  Gauge,
  Tornado
} from '@vicons/tabler';
import { LayersLinked } from '@vicons/tabler';
import keycloakInst from '../keycloakFactory.js';
import SoundFragments from '../components/lists/kneo/SoundFragments.vue';
import Songs from '../components/lists/kneo/Songs.vue';
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
    NTree,
    NSelect,
    NIcon,
    NH2,
    NH3,
    NH6,
    NSpace,
    NSwitch,
    SoundFragments,
    Songs,
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
    const lumisonicSlug = 'lumisonic';

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
      if (route.name === 'Streams') return 'streams';
      if (route.name === 'Songs') return 'songs';
      if (route.name === 'SoundFragments') return 'fragments';
      if (route.name === 'Events') return 'events';
      if (route.name === 'AiAgents') return 'ai_agents';
      if (route.name === 'Scripts') return 'scripts';
      if (route.name === 'Scenes') return 'scenes';
      if (route.name === 'AbsoluteTimeScenes' || route.name === 'AbsoluteTimeSceneForm') return 'scenes-absolute-time';
      if (route.name === 'RelativeTimeScenes' || route.name === 'RelativeTimeSceneForm') return 'scenes-relative-time';
      if (route.name === 'Prompts') {
        if (route.query.promptType === 'SONG') return 'prompts-song';
        if (route.query.promptType === 'ADVERTISEMENT') return 'prompts-advertisement';
        if (route.query.promptType === 'REMINDER') return 'prompts-reminder';
        if (route.query.promptType === 'GENERATOR') return 'prompts-generator';
        return 'prompts';
      }
      if (route.name === 'PromptForm') return 'prompts';
      if (route.name === 'Drafts') return 'drafts';
      if (route.name === 'EnvironmentProfiles') return 'environment_profiles';
      if (route.name === 'Listeners') return 'listeners';
      if (route.name === 'DocumentTree') return 'document-tree';
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
      } else if (key === 'brands') {
        await router.push({name: 'Brands'});
      } else if (key === 'streams') {
        await router.push({name: 'Streams'});
      } else if (key === 'songs') {
        await router.push({name: 'Songs'});
      } else if (key === 'listeners') {
        await router.push({name: 'Listeners'});
      } else if (key === 'home') {
        await router.push({name: 'Welcome'});
      } else if (key === 'profile') {
        await router.push({name: 'Profile'});
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
      } else if (key === 'events') {
        await router.push({name: 'Events'});
      } else if (key === 'ai_agents') {
        await router.push({name: 'AiAgents'});
      } else if (key === 'scripts') {
        await router.push({name: 'Scripts'});
      } else if (key === 'scenes') {
        // Do nothing - parent item is not clickable, user must choose a category
      } else if (key === 'scenes-absolute-time') {
        await router.push({name: 'AbsoluteTimeScenes'});
      } else if (key === 'scenes-relative-time') {
        await router.push({name: 'RelativeTimeScenes'});
      } else if (key === 'prompts') {
        // Do nothing - parent item is not clickable, user must choose a category
      } else if (key === 'prompts-song') {
        await router.push({ name: 'Prompts', query: { promptType: 'SONG' } });
      } else if (key === 'prompts-advertisement') {
        await router.push({ name: 'Prompts', query: { promptType: 'ADVERTISEMENT' } });
      } else if (key === 'prompts-reminder') {
        await router.push({ name: 'Prompts', query: { promptType: 'REMINDER' } });
      } else if (key === 'prompts-generator') {
        await router.push({ name: 'Prompts', query: { promptType: 'GENERATOR' } });
      } else if (key === 'drafts') {
        await router.push({name: 'Drafts'});
      } else if (key === 'environment_profiles') {
        await router.push({name: 'EnvironmentProfiles'});
      } else if (key === 'document-tree') {
        await router.push({name: 'DocumentTree'});
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

    onMounted(() => {
      window.addEventListener('resize', updateDrawerState);
      updateDrawerState();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateDrawerState);
    });

    const drawerStyle = computed(() => ({
      backgroundColor: themeVars.value.baseColor
    }));

    // Tree data structure
    const treeData = computed(() => [
      {
        key: `radiostation-${lumisonicSlug}`,
        label: 'Lumisonic',
        children: [
          { key: `station-${lumisonicSlug}-dashboard`, label: 'Dashboard' },
          { key: `station-${lumisonicSlug}-playlist`, label: 'Playlist' },
          { key: `station-${lumisonicSlug}-listeners`, label: 'Listeners' },
          { key: `station-${lumisonicSlug}-chat`, label: 'Chat' }
        ]
      },
      { key: 'brands', label: 'Brands' },
      { key: 'streams', label: 'Streams' },
      { key: 'songs', label: 'Songs' },
      { key: 'listeners', label: 'Listeners' },
      { key: 'fragments', label: 'Sound Fragments' },
      { key: 'environment_profiles', label: 'Environment Profiles' },
      { key: 'events', label: 'Events' },
      { key: 'ai_agents', label: 'AiAgents' },
      { key: 'document-tree', label: 'Flows' },
      { key: 'scripts', label: 'Scripts' },
      {
        key: 'scenes',
        label: 'Scenes',
        children: [
          { key: 'scenes-absolute-time', label: 'Absolute Time Scenes' },
          { key: 'scenes-relative-time', label: 'Relative Time Scenes' }
        ]
      },
      {
        key: 'prompts',
        label: 'Prompts',
        children: [
          { key: 'prompts-song', label: 'Song' },
          { key: 'prompts-advertisement', label: 'Advertisement' },
          { key: 'prompts-reminder', label: 'Reminder' },
          { key: 'prompts-generator', label: 'Generator' }
        ]
      },
      { key: 'drafts', label: 'Drafts' },
      { key: 'home', label: 'Home' },
      { key: 'profile', label: 'Profile' },
      { key: 'logout', label: 'Logout' }
    ]);

    const defaultExpandedKeys = computed(() => [
      `radiostation-${lumisonicSlug}`,
      'scenes',
      'prompts'
    ]);

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

      // Add icons for other nodes
      let iconComponent = null;
      if (option.key === 'home') iconComponent = h(NIcon, { size: 25 }, () => h(BuildingSkyscraper));
      else if (option.key === 'brands') iconComponent = h(NIcon, { size: 25 }, () => h(PictureInPictureTop));
      else if (option.key === 'streams') iconComponent = h(NIcon, { size: 25 }, () => h(Ripple));
      else if (option.key === 'songs') iconComponent = h(NIcon, { size: 25 }, () => h(Music));
      else if (option.key === 'listeners') iconComponent = h(NIcon, { size: 25 }, () => h(Headphones));
      else if (option.key === 'fragments') iconComponent = h(NIcon, { size: 25 }, () => h(Music));
      else if (option.key === 'events') iconComponent = h(NIcon, { size: 25 }, () => h(Calendar));
      else if (option.key === 'ai_agents') iconComponent = h(NIcon, { size: 25 }, () => h(Robot));
      else if (option.key === 'document-tree') iconComponent = h(NIcon, { size: 25 }, () => h(Tornado));
      else if (option.key === 'scripts') iconComponent = h(NIcon, { size: 25 }, () => h(LayersLinked));
      else if (option.key === 'scenes') iconComponent = h(NIcon, { size: 25 }, () => h(Gauge));
      else if (option.key === 'prompts') iconComponent = h(NIcon, { size: 25 }, () => h(Prompt));
      else if (option.key === 'drafts') iconComponent = h(NIcon, { size: 25 }, () => h(ToiletPaper));
      else if (option.key === 'environment_profiles') iconComponent = h(NIcon, { size: 25 }, () => h(BrandAirtable));
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

