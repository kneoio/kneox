<template>
  <div class="main-outline">
    <!-- Menu Section -->
    <n-grid x-gap="12" y-gap="12" cols="24" class="grid-layout">
      <!-- Left Section for Menu -->
      <n-gi :span="isMobile ? (menuCollapsed ? 0 : 24) : 4" class="left-section">
        <n-text class="menu-title">Menu</n-text>
        <router-link to="/outline/dashboard" class="menu-item" active-class="active-link">
          <n-button text>Dashboard</n-button>
        </router-link><br />
        <router-link to="/outline/queue" class="menu-item" active-class="active-link">
          <n-button text>Track queue</n-button>
        </router-link><br />
        <n-button v-if="isAuthenticated" @click="logout" class="logout-btn">Logout</n-button>
        <n-button v-else @click="login" class="logout-btn">Login</n-button>
        <div v-if="isAuthenticated" :class="['user-info-language', { 'mobile-user-info-language': isMobile }]">
          <n-space vertical>
            <n-h6 class="user-info">Hello, {{ userData?.profile?.username }}</n-h6>
            <n-select v-model:value="selectedLanguage" :options="languageOptions" class="language-select" />
            <n-select v-model:value="selectedTheme" :options="themeOptions" class="theme-select" />
          </n-space>
        </div>
      </n-gi>

      <!-- Right Section for Main Content -->
      <n-gi :span="menuCollapsed && isMobile ? 24 : 20" class="right-section">
        <!-- Toggle Menu Button for Mobile -->
        <n-button v-if="isMobile" @click="menuCollapsed = !menuCollapsed" class="menu-toggle-btn">
          {{ menuCollapsed ? 'Open Menu' : 'Close Menu' }}
        </n-button>

        <!-- Render Child Route Components Here -->
        <router-view />
      </n-gi>
    </n-grid>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted } from 'vue';
import { NButton, NText, NGrid, NGi, NSpace, NH6, NSelect } from 'naive-ui';
import { KeycloakInstance } from 'keycloak-js';

export default defineComponent({
  components: {
    NButton,
    NText,
    NGrid,
    NGi,
    NSpace,
    NH6,
    NSelect
  },
  setup() {
    const kc = inject<KeycloakInstance>('keycloak');
    const userData = inject<any>('userData');
    const isAuthenticated = ref(kc?.authenticated ?? false);

    const isMobile = ref(window.innerWidth <= 800);
    const menuCollapsed = ref(isMobile.value);

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
      if (!isMobile.value) {
        menuCollapsed.value = false; // Show menu on larger screens
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

    return { isMobile, menuCollapsed, login, logout, userData, isAuthenticated, selectedLanguage, languageOptions, selectedTheme, themeOptions };
  }
});
</script>

<style scoped>
.main-outline {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.grid-layout {
  width: 90%;
  margin: auto;
  height: 100%;
}

.left-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  background-color: #f9f9f9;
  border-right: 1px solid #e0e0e0;
  position: relative;
  height: 100%;
}

.user-info-language {
  position: absolute;
  bottom: 20px;
  width: calc(100% - 40px);
  padding-left: 20px;
}

.mobile-user-info-language {
  position: static;
  width: 100%;
  padding: 10px 0;
}

.user-info {
  margin-bottom: 10px;
}

.right-section {
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;
}

.menu-toggle-btn {
  margin-bottom: 10px;
}

.mt-2 {
  margin-top: 0.5rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.ml-4 {
  margin-left: 1rem;
}

.logout-btn {
  margin-top: 20px;
}

.language-select, .theme-select {
  width: 150px;
  margin-bottom: 10px;
}
</style>