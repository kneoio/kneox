<template>
  <n-layout-header :inverted="inverted" bordered>
    <div class="mobile-menu-button" @click="toggleMenu" v-show="isMobile">
      <n-icon>
        <menu-outlined />
      </n-icon>
    </div>
    <n-grid x-gap="12" :cols="1">
      <n-gi>
        <n-menu
            mode="horizontal"
            :expanded-keys="expandedKeys"
            :inverted="inverted"
            :options="menuOptions"
            @update:value="handleNavigate"
            v-show="!isMobile || menuOpen"
            :value="selectedKey"
        />
      </n-gi>
    </n-grid>
  </n-layout-header>
</template>

<script lang="ts">
import { EuroOutlined, MenuOutlined, ProjectOutlined, RobotOutlined, LockOutlined } from "@vicons/antd";
import { defineComponent, h, ref, computed } from "vue";
import { NGi, NGrid, NIcon, NLayoutHeader, NMenu } from "naive-ui";
import { useRoute, useRouter } from "vue-router";

export default defineComponent({
  components: {
    NLayoutHeader,
    NGrid,
    NGi,
    NIcon,
    NMenu,
    MenuOutlined,
    LockOutlined,
  },
  props: {
    isAuthenticated: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const route = useRoute();
    const selectedKey = ref(route.path === '/projects' ? '/projects-and-tasks/projects' : route.path);

    const menuOptions = computed(() => [
      {
        label: 'Projects and tasks',
        key: '/projects-and-tasks/projects',
        icon: props.isAuthenticated ? renderIcon(ProjectOutlined) : renderDisabledIcon(),
        disabled: !props.isAuthenticated,
      },
      {
        label: 'Assistant bot',
        key: '/ai',
        icon: props.isAuthenticated ? renderIcon(RobotOutlined) : renderDisabledIcon(),
        disabled: !props.isAuthenticated,
      },
      {
        label: 'References',
        key: '/references/organizations',
        icon: props.isAuthenticated ? renderIcon(EuroOutlined) : renderDisabledIcon(),
        disabled: !props.isAuthenticated,
      }
    ]);

    const menuOpen = ref(false);
    const isMobile = ref(window.innerWidth < 768);

    const toggleMenu = () => {
      menuOpen.value = !menuOpen.value;
    };

    function renderIcon(icon: any) {
      return () => h(NIcon, null, { default: () => h(icon) });
    }

    function renderDisabledIcon() {
      return () => h(NIcon, null, { default: () => h(LockOutlined) });
    }

    function handleNavigate(key: string) {
      if (props.isAuthenticated) {
        router.push(key);
        selectedKey.value = key;
        if (isMobile.value) {
          menuOpen.value = false;
        }
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
      MenuOutlined,
    };
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
