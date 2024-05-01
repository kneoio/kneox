<template>
  <div class="layout">
    <n-layout has-sider>
      <n-layout-sider bordered :collapsed-width="0" :width="240" :collapsed="collapsed" class="sidebar">
        <div class="toggle-button" @click="toggleSidebar">
          <n-icon size="24" :component="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined" />
        </div>
        <n-menu :options="menuOptions" :collapsed="collapsed" />
      </n-layout-sider>
      <n-layout>
        <n-layout-header bordered>
          <div class="header-content">
            <n-h1 class="title">Kneox</n-h1>
            <div class="user-info" v-if="userData.profile">
              <span>Hello, {{ userData.profile.username }}</span>
              <n-button @click="logout">Logout</n-button>
            </div>
            <n-button v-else @click="login">Login</n-button>
          </div>
        </n-layout-header>
        <n-layout-content>
          <div class="document-list">
            <n-list>
              <n-list-item v-for="document in documents" :key="document.id">
                {{ document.title }}
              </n-list-item>
            </n-list>
          </div>
        </n-layout-content>
        <n-layout-footer bordered>
          <div class="footer-content">
            <div class="language-select">
              <n-select v-model:value="selectedLanguage" :options="languageOptions" />
            </div>
            <div class="links">
              <router-link to="/license"><n-button text>license</n-button></router-link>&nbsp;&nbsp;&nbsp;
              <router-link to="/about"><n-button text>about</n-button></router-link>
            </div>
          </div>
        </n-layout-footer>
      </n-layout>
    </n-layout>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, inject } from 'vue';
import {  NIcon, NGrid, NGi , NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NLayoutFooter, NMenu, NButton, NList, NListItem, NSelect, NH1 } from 'naive-ui';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@vicons/antd';
import { KeycloakInstance } from 'keycloak-js';

export default defineComponent({
  components: {
    NLayout,
    NIcon,
    NLayoutSider,
    NLayoutHeader,
    NLayoutContent,
    NLayoutFooter,
    NMenu,
    NButton,
    NList,
    NListItem,
    NSelect,
    NH1,
    NGrid,
    NGi,
  },
  setup() {
    const menuOptions = [
      {
        label: 'Home',
        key: 'home',
      },
      {
        label: 'Documents',
        key: 'documents',
      },
      {
        label: 'Settings',
        key: 'settings',
      },
    ];

    const documents = ref([
      { id: 1, title: 'Document 1' },
      { id: 2, title: 'Document 2' },
      { id: 3, title: 'Document 3' },
    ]);

    const selectedLanguage = ref('en');
    const languageOptions = [
      { label: 'English', value: 'en' },
      { label: 'Portuguese', value: 'pt' },
    ];

    const kc = inject<KeycloakInstance>('keycloak');
    const userData = inject<any>('userData');


    const login = async () => {
      if (kc) {
        try {
          await kc.login();
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
        } catch (error) {
          console.error('Logout failed', error);
        }
      } else {
        console.error('Keycloak instance is not available');
      }
    };

    const collapsed = ref(false);

    const toggleSidebar = () => {
      collapsed.value = !collapsed.value;
    };


    return {
      menuOptions,
      toggleSidebar,
      MenuFoldOutlined,
      MenuUnfoldOutlined,
      collapsed,
      documents,
      selectedLanguage,
      languageOptions,
      login,
      logout,
      userData,
    };
  },
});
</script>

<style scoped>
.layout {
  height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-info span {
  margin-right: 10px;
}

.document-list {
  padding: 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  padding: 0 20px;
}

.language-select {
  justify-self: start;
}

.links {
  justify-self: end;
}

.sidebar {
  position: relative;
  transition: width 0.3s ease;
}

.toggle-button {
  position: absolute;
  top: 20px;
  right: -12px;
  width: 24px;
  height: 24px;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  transition: transform 0.3s ease;
}

.toggle-button:hover {
  transform: scale(1.1);
}


@media (max-width: 600px) {
  .n-layout-sider {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .n-layout-sider.n-layout-sider--collapsed {
    transform: translateX(0);
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .title {
    margin-bottom: 10px;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .language-select,
  .links {
    justify-self: center;
  }
}


</style>