<template>
  <n-grid x-gap="12" y-gap="12" cols="24" responsive="screen">
    <n-grid-item :span="24">
      <kneo-header :isAuthenticated="isAuthenticated" @logout="logout" />
    </n-grid-item>
    <n-grid-item :span="24">
      <router-view v-if="authInitialized" />
      <n-spin v-else size="large" class="loading-spinner" />
    </n-grid-item>
    <n-grid-item :span="24">
      <kneo-footer :inverted="inverted" />
    </n-grid-item>
  </n-grid>
</template>

<script lang="ts">
import {defineComponent, inject, onMounted, ref, watch} from 'vue';
import {NGrid, NGridItem, NSpin} from 'naive-ui';
import KneoHeader from "../components/common/KneoHeader.vue";
import KneoFooter from "../components/common/KneoFooter.vue";
import {KeycloakInstance} from 'keycloak-js';

export default defineComponent({
  name: 'HomeView',
  components: {
    KneoFooter,
    KneoHeader,
    NGrid,
    NGridItem,
    NSpin
  },
  setup() {
    const parentTitle = inject('parentTitle', ref(''));
    const kc = inject<KeycloakInstance>('keycloak');
    const userData = inject<any>('userData');
    const isAuthenticated = ref(false);
    const authInitialized = ref(false);
    const inverted = ref(false);

    const initAuth = async () => {
      if (!kc) {
        console.error('Keycloak instance not available');
        return;
      }

      try {
        isAuthenticated.value = await kc.init({
          onLoad: 'login-required',
          checkLoginIframe: false
        });
        authInitialized.value = true;

        setInterval(async () => {
          if (kc.authenticated) {
            try {
              await kc.updateToken(30); // Refresh if token expires in <30 seconds
            } catch (error) {
              console.error('Token refresh failed:', error);
              isAuthenticated.value = false;
              await kc.login();
            }
          }
        }, 60000); // Check every minute

      } catch (error) {
        console.error('Keycloak initialization failed:', error);
        await kc.login();
      }
    };

    const logout = async () => {
      if (kc) {
        try {
          await kc.logout({ redirectUri: window.location.origin });
        } catch (error) {
          console.error("Logout failed", error);
        }
      } else {
        console.error("Keycloak instance is not available");
      }
    };

    onMounted(() => {
      if (parentTitle) {
        parentTitle.value = 'Radiostation';
      }
      initAuth();
    });

    // Watch for authentication changes
    watch(isAuthenticated, (newVal) => {
      if (!newVal && kc) {
        kc.login();
      }
    });

    return {
      userData,
      inverted,
      isAuthenticated,
      authInitialized,
      logout,
    };
  }
});
</script>

<style scoped>
.layout-full-height {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

@media (max-width: 768px) {
  kneo-header,
  kneo-footer {
    width: 100%;
  }

  .n-gi {
    flex-basis: 100%;
    margin-top: 10px;
    justify-content: center;
  }

  n-select {
    width: 100%;
  }
}

@media (max-width: 480px) {
  kneo-header {
    display: none;
  }

  kneo-footer {
    text-align: center;
  }
}
</style>