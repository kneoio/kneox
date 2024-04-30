<template>
  <div class="home">
    <div class="top-middle-section">
      <div class="top-section">
        <n-h1 class="title">Kneox</n-h1>
        <p v-if="userData.profile && userData.profile.username">Hello, {{ userData.profile.username }}</p>
        <n-button v-if="userData.profile" @click="logout">Logout</n-button>
      </div>
    </div>
    <div class="bottom-section">
      <div class="language-select">
        <n-select v-model:value="selectedLanguage" :options="languageOptions" />
      </div>
      <div class="links">
        <n-button text>license</n-button>&nbsp;&nbsp;&nbsp;
        <n-button text>about</n-button>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { defineComponent, ref, inject } from 'vue';
import { NButton, NSelect, NH1 } from 'naive-ui';
import { KeycloakInstance } from 'keycloak-js';

export default defineComponent({
  components: {
    NButton,
    NSelect,
    NH1
  },
  setup() {
    const selectedLanguage = ref('en');
    const languageOptions = [
      { label: 'English', value: 'en' },
      { label: 'Portuguese', value: 'pt' },
    ];

    const kc = inject<KeycloakInstance>('keycloak');
    const userData = inject<any>('userData');

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
      selectedLanguage,
      languageOptions,
      logout,
      userData
    };
  },
});
</script>


<style scoped>
.home {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
}

.top-middle-section {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex-grow: 1;
}

.top-section {
  text-align: center;
  margin-right: 40px;
}

.title {
  font-size: 48px;
  font-weight: bold;
}

.middle-section {
  display: flex;
  justify-content: center;
}

.login-card {
  width: 300px;
}

.bottom-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.language-select {
  width: 150px;
  margin-bottom: 10px;
}

.links {
  display: flex;
  justify-content: center;
}

@media (max-width: 600px) {
  .top-middle-section {
    flex-direction: column;
    align-items: center;
  }

  .top-section {
    margin-right: 0;
    margin-bottom: 20px;
  }

  .login-card {
    width: 100%;
  }
}
</style>