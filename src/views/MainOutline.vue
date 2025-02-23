<template>
  <div class="main-outline">
    <!-- Mobile Menu Toggle Button -->
    <n-button v-if="isMobile" @click="menuCollapsed = !menuCollapsed" class="menu-toggle-btn">
      {{ menuCollapsed ? 'Open Menu' : 'Close Menu' }}
    </n-button>

    <!-- Drawer for Menu -->
    <n-drawer v-model:show="menuCollapsed" :width="250" placement="left">
      <n-drawer-content>
        <n-h2 class="menu-title">Menu</n-h2>
        <router-link to="/outline/dashboard" class="menu-item" active-class="active-link">
          <n-button text>Dashboard</n-button>
        </router-link>
        <router-link to="/outline/queue" class="menu-item" active-class="active-link">
          <n-button text>Track queue</n-button>
        </router-link>
        <n-button v-if="isAuthenticated" @click="logout" class="logout-btn">Logout</n-button>
        <n-button v-else @click="login" class="logout-btn">Login</n-button>
        <div v-if="isAuthenticated" class="user-info-language">
          <n-space vertical>
            <n-h6 class="user-info">Hello, {{ userData?.profile?.username }}</n-h6>
            <n-select v-model:value="selectedLanguage" :options="languageOptions" class="language-select" />
            <n-select v-model:value="selectedTheme" :options="themeOptions" class="theme-select" />
          </n-space>
        </div>
      </n-drawer-content>
    </n-drawer>

    <!-- Main Content -->
    <div class="right-section">
      <!-- Render Child Route Components Here -->
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted } from 'vue';
import { NButton, NGrid, NGi, NSpace, NH2, NH6, NSelect, NDrawer, NDrawerContent } from 'naive-ui';
import { KeycloakInstance } from 'keycloak-js';

export default defineComponent({
  components: {
    NH2,
    NButton,
    NGrid,
    NGi,
    NSpace,
    NH6,
    NSelect,
    NDrawer,
    NDrawerContent,
  },
  setup() {
    const kc = inject<KeycloakInstance>('keycloak');
    const userData = inject<any>('userData');
    const isAuthenticated = ref(kc?.authenticated ?? false);

    const isMobile = ref(window.innerWidth <= 800);
    const menuCollapsed = ref(!isMobile.value); // Show drawer on desktop by default

    const selectedLanguage = ref('en');
    const languageOptions = [
      { label: 'English', value: 'en' },
      { label: 'Portuguese', value: 'pt' },
    ];

    const selectedTheme = ref('light');
    const themeOptions = [
      { label: 'Light', value: 'light' },
      { label: 'Dark', value: 'dark' },
    ];

    const handleResize = () => {
      isMobile.value = window.innerWidth <= 800;
      console.log('isMobile:', isMobile.value); // Debugging
      if (!isMobile.value) {
        menuCollapsed.value = true; // Show drawer on larger screens
      } else {
        menuCollapsed.value = false; // Hide drawer on mobile by default
      }
    };

    const login = async () => {
      if (kc) {
        try {
          await kc.login();
          isAuthenticated.value = kc.authenticated;
        } catch (error) {
          console.error('Login failed', error);
        }
      } else {
        console.error('Keycloak instance is not available');
      }
    };

    const logout = async () => {
      if (kc) {
        try {
          await kc.logout();
          isAuthenticated.value = kc.authenticated;
        } catch (error) {
          console.error('Logout failed', error);
        }
      } else {
        console.error('Keycloak instance is not available');
      }
    };

    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });

    return {
      isMobile,
      menuCollapsed,
      login,
      logout,
      isAuthenticated,
      userData,
      selectedLanguage,
      languageOptions,
      selectedTheme,
      themeOptions,
    };
  },
});
</script>

<style scoped>
.main-outline {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.right-section {
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;
  margin-left: 250px; /* Add margin to avoid overlapping the drawer */
}

.menu-toggle-btn {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1000;
}

.menu-item {
  display: block; /* Ensure each menu item is on a new line */
  margin-bottom: 10px; /* Add spacing between items */
}

.menu-title {
  margin-bottom: 20px; /* Add spacing below the title */
}

.logout-btn {
  margin-top: 20px; /* Add spacing above the logout button */
}

.user-info-language {
  margin-top: 20px; /* Add spacing above the user info section */
}

.language-select,
.theme-select {
  width: 100%; /* Ensure selects take full width */
  margin-bottom: 10px; /* Add spacing between selects */
}
</style>