<template>
  <n-layout-header :inverted="inverted" bordered>
    <n-grid x-gap="12" :cols="4">
      <n-gi>
        <n-h1 class="title">&nbsp;&nbsp;Kneox</n-h1>
      </n-gi>
      <n-gi :offset="2">
        <div class="user-info" v-if="userData.profile">
          <n-space justify="end">
            <n-h6>Hello, {{ userData.profile.username }}</n-h6>
            <n-button @click="logout">Logout</n-button>
          </n-space>
        </div>
        <n-button v-else @click="login">Login</n-button>
      </n-gi>
    </n-grid>
  </n-layout-header>
</template>

<script lang="ts">
import {NButton, NGi, NGrid, NH1, NH6, NLayoutHeader, NSpace} from "naive-ui";
import {defineComponent, inject, ref} from "vue";
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

    return {
      login,
      logout,
      userData,
      inverted: ref(false),
    }
  }
});

</script>
