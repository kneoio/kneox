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
        <h3>Brand</h3>
      </div>
      <div class="drawer-content">
        <n-menu
            :options="menuOptions"
            @update:value="handleMenuSelect"
        />
      </div>
    </div>

    <div
        class="content"
        :style="{
          marginLeft: isDrawerOpen ? `${drawerWidth}px` : '0',
          filter: isDrawerOpen && isMobile ? 'blur(1px)' : 'none'
        }"
        @click="handleContentClick"
    >


      <n-h1 style="padding-left: 20%  ">The content should be here</n-h1>
      <component :is="currentComponent"/>
    </div>
  </div>

</template>

<script lang="ts">
import {NFlex, NH1, NButton, NDrawer, NDrawerContent, NMenu, NIcon, MenuOption} from 'naive-ui';
import {Component, defineComponent, onMounted, onUnmounted, ref, shallowRef, h, computed} from 'vue';
import SongsQueue from "../components/lists/kneo/SongsQueue.vue";
import SoundFragments from "../components/lists/kneo/SoundFragments.vue";
import {AlignJustified, List, Music} from '@vicons/tabler'

export default defineComponent({
  components: {
    NFlex,
    NH1,
    NButton,
    NDrawer,
    NDrawerContent,
    NMenu,
    NIcon
  },
  setup() {
    const isDrawerOpen = ref(true)
    const drawerWidth = ref(300)
    const selectedKey = ref(null)


    const selectedMenuKey = ref<string | null>(null);
    const currentComponent = shallowRef<Component | null>(null);
    const active = ref(window.innerWidth > 768);



    const menuOptions: MenuOption[] = [
      {
        key: 'divider-1',
        type: 'divider',
        props: {
          style: {
            marginLeft: '32px'
          }
        }
      },
      {
        label: 'Sound Fragments',
        key: 'sound-fragments',
        icon: () => h(Music)
      },
      {
        label: 'Track Queue',
        key: 'track-queue',
        icon: () => h(List)
      }
    ];

    const handleMenuSelect = (key: string) => {
      console.log(key);
      selectedMenuKey.value = key;
      if (window.innerWidth <= 768) {
        isDrawerOpen.value = false
      }
      if (key === 'track-queue') {
        currentComponent.value = SongsQueue;
      } else if (key === 'sound-fragments') {
        currentComponent.value = SoundFragments;
      }
    };

    const handleContentClick = () => {
      if (window.innerWidth <= 768) {
        isDrawerOpen.value = false;
      }
    };

    const isMobile = computed(() => window.innerWidth <= 768);

    const updateDrawerState = () => {
      active.value = window.innerWidth > 768;
    };

    const toggleDrawer = () => {
      isDrawerOpen.value = !isDrawerOpen.value
    }

    onMounted(() => {
      window.addEventListener('resize', updateDrawerState);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateDrawerState);
    });

    return {
      active,
      menuOptions,
      toggleDrawer,
      isMobile,
      isDrawerOpen,
      selectedKey,
      handleMenuSelect,
      handleContentClick,
      currentComponent,
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
</style>