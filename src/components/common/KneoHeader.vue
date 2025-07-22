<template>
  <n-layout-header :inverted="inverted" bordered :style="headerStyle">
    <n-grid x-gap="12" :cols="4">
      <n-gi>
        <n-h1 class="title">&nbsp;&nbsp;Mixpla</n-h1>
      </n-gi>
      <n-gi :offset="2">
        <div class="user-info" v-if="isAuthenticated">
          <n-space justify="end" class="mt-4 mr-4">
            <n-h6 class="mt-2 mr-2">Hello, {{ userData.profile.username }}</n-h6>
            <n-button @click="handleLogout" class="mt-2 mr-2">Logout</n-button>
          </n-space>
        </div>
        <n-button v-else @click="login" class="mt-4 mr-4">Login</n-button>
      </n-gi>
    </n-grid>
  </n-layout-header>
</template>

<script lang="ts">
import { defineComponent, inject, ref, computed } from "vue";
import { NButton, NGi, NGrid, NH1, NH6, NLayoutHeader, NSpace, useThemeVars } from "naive-ui";
import { KeycloakInstance } from "keycloak-js";

export default defineComponent({
  components: {
    NH1,
    NGi,
    NH6,
    NLayoutHeader,
    NGrid,
    NButton,
    NSpace,
  },
  props: {
    isAuthenticated: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const themeVars = useThemeVars();
    const kc = inject<KeycloakInstance>("keycloak");
    const userData = inject<any>("userData");

    const login = async () => {
      if (kc) {
        try {
          await kc.login();
        } catch (error) {
          console.error("Login failed", error);
        }
      } else {
        console.error("Keycloak instance is not available");
      }
    };

    const handleLogout = async () => {
      if (kc) {
        try {
          const redirectUri = `${window.location.origin}/mixpla`;
          await kc.logout({ redirectUri });
        } catch (error) {
          console.error("Logout failed", error);
        }
      } else {
        console.error("Keycloak instance is not available");
      }
    };

    const headerStyle = computed(() => ({
      backgroundColor: themeVars.value.baseColor
    }));

    return {
      login,
      handleLogout,
      userData,
      inverted: ref(false),
      headerStyle,
    };
  },
});
</script>

<style scoped>
.title {
  margin-left: 8px;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mr-4 {
  margin-right: 1rem;
}
</style>
