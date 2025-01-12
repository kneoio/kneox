<template>
  <n-grid x-gap="12" y-gap="12" cols="24" responsive="screen">
    <n-grid-item :span="24">
      <kneo-header :isAuthenticated="isAuthenticated" @logout="logout" />
    </n-grid-item>
    <n-grid-item :span="24">
      <router-view />
    </n-grid-item>
    <n-grid-item :span="24">
      <kneo-footer :inverted="inverted" />
    </n-grid-item>
  </n-grid>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted } from 'vue';
import { NGrid, NGridItem } from 'naive-ui';
import KneoHeader from "../components/common/KneoHeader.vue";
import KneoFooter from "../components/common/KneoFooter.vue";
import { KeycloakInstance } from 'keycloak-js';

export default defineComponent({
  components: {
    KneoFooter,
    KneoHeader,
    NGrid,
    NGridItem,
  },
  setup() {
    const kc = inject<KeycloakInstance>('keycloak');
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

@media (max-width: 768px) { /* Adjustments for tablets and below */
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

@media (max-width: 480px) { /* Adjustments for phones */
  kneo-header {
    display: none; /* Hide header on very small screens */
  }

  kneo-footer {
    text-align: center;
  }
}
</style>
