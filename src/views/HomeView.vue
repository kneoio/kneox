<template>
  <n-layout>
    <kneo-header :isAuthenticated="isAuthenticated" @logout="logout" />
    <kneo-top-menu :isAuthenticated="isAuthenticated" />
    <n-layout has-sider class="layout-content-expand">
      <router-view />
    </n-layout>
    <kneo-footer :inverted="inverted" />
  </n-layout>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted } from 'vue';
import { NLayout } from 'naive-ui';
import KneoHeader from "../components/common/KneoHeader.vue";
import KneoTopMenu from "../components/KneoTopMenu.vue";
import KneoFooter from "../components/common/KneoFooter.vue";
import { KeycloakInstance } from 'keycloak-js';  // Import KeycloakInstance type

export default defineComponent({
  components: {
    KneoFooter,
    KneoTopMenu,
    KneoHeader,
    NLayout,
  },
  setup() {
    const kc = inject<KeycloakInstance>('keycloak');  // Inject with type KeycloakInstance
    const userData = inject<any>('userData');
    const isAuthenticated = ref(false);

    const checkAuthentication = () => {
      if (kc && kc.authenticated) {
        isAuthenticated.value = true;
      } else {
        isAuthenticated.value = false;
      }
    };

    const logout = async () => {
      if (kc) {
        try {
          await kc.logout();
          isAuthenticated.value = false;
        } catch (error) {
          console.error("Logout failed", error);
        }
      } else {
        console.error("Keycloak instance is not available");
      }
    };

    onMounted(() => {
      checkAuthentication();
    });

    return {
      userData,
      inverted: ref(false),
      isAuthenticated,
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

.layout-content-expand {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) { /* Adjustments for tablets and below */
  .layout-full-height {
    flex-direction: column;
  }

  .layout-content-expand {
    flex-direction: column; /* Stack elements vertically on smaller screens */
  }

  n-layout-footer {
    padding: 12px 20px; /* Reduce padding on smaller screens */
  }

  .n-gi {
    flex-basis: 100%; /* Stack grid items vertically */
    margin-top: 10px;
    justify-content: center; /* Center content */
  }

  n-select {
    width: 100%; /* Full width for select boxes */
  }
}

@media (max-width: 480px) { /* Adjustments for phones */
  .layout-content-expand {
    padding: 0 10px; /* Reduce padding on very small screens */
  }

  kneo-top-menu,
  kneo-header {
    display: none; /* Optionally hide top menu and header on very small screens */
  }
}
</style>
