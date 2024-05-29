<template>
  <n-layout-header :inverted="inverted" bordered>
    <n-grid x-gap="12" :cols="4">
      <n-gi>
        <n-h1 class="title">&nbsp;&nbsp;Kneox</n-h1>
      </n-gi>
      <n-gi :offset="2">
        <div class="user-info" v-if="userData.profile">
          <n-space justify="end" class="mt-4 mr-4">
            <n-h6 class="mt-2 mr-2">Hello, {{ userData.profile.username }}</n-h6>
            <n-button @click="logout" class="mt-2 mr-2">Logout</n-button>
          </n-space>
        </div>
        <n-button v-else @click="login" class="mt-4 mr-4">Login</n-button>
      </n-gi>
    </n-grid>
  </n-layout-header>
</template>

<script lang="ts">
import {NButton, NGi, NGrid, NH1, NH6, NLayoutHeader, NSpace} from "naive-ui";
import {defineComponent, inject, onMounted, onUnmounted, ref} from "vue";
import {KeycloakInstance} from "keycloak-js";

export default defineComponent({
  components: {
    NH1,
    NGi,
    NH6,
    NLayoutHeader,
    NGrid,
    NButton,
    NSpace
  },
  setup() {
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

    const refreshToken = async () => {
      if (kc && kc.token) {
        try {
          const minValidity = 30; // Seconds
          const refreshed = await kc.updateToken(minValidity);
          if (refreshed) {
            console.log('Token refreshed');
          } else {
            console.warn('Token not refreshed, login required');
            await login();
          }
        } catch (error) {
          console.error('Failed to refresh token', error);
          await login();
        }
      }
    };

    onMounted(() => {
      if (kc) {
        // Periodically refresh the token
        const intervalId = setInterval(refreshToken, 5 * 60 * 1000); // Every 5 minutes

        // Clear interval on component unmount
        onUnmounted(() => {
          clearInterval(intervalId);
        });
      }
    });

    return {
      login,
      logout,
      userData,
      inverted: ref(false),
    }
  }
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
