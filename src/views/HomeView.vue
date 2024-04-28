<template>
  <div class="home">
    <div class="top-middle-section">
      <div class="top-section">
        <n-h1 class="title">Kneox</n-h1>
      </div>
      <div class="middle-section">
        <n-card title="Login" class="login-card">
          <n-form>
            <n-form-item label="Username">
              <n-input v-model:value="username" placeholder="Enter your username" />
            </n-form-item>
            <n-form-item label="Password">
              <n-input
                  v-model:value="password"
                  type="password"
                  placeholder="Enter your password"
              />
            </n-form-item>
            <n-form-item>
              <n-button type="primary" @click="login" block>Login</n-button>
            </n-form-item>
          </n-form>
        </n-card>
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
import { NCard, NForm, NFormItem, NInput, NButton, NSelect, NH1 } from 'naive-ui';
import { KeycloakInstance } from 'keycloak-js';

export default defineComponent({
  components: {
    NCard,
    NForm,
    NFormItem,
    NInput,
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
    const username = ref('');
    const password = ref('');

    const login = async () => {
      if (kc) {
        try {
          await kc.login({
            username: username.value,
            password: password.value,
          });
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
      username,
      password,
      selectedLanguage,
      languageOptions,
      login,
      logout,
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