<template>

  <n-layout class="welcome-layout">
    <n-layout-content class="welcome-container">
      <n-space vertical :size="24" align="center">
        <n-h1 class="welcome-title">Your Personal AI Radio Station</n-h1>
        <n-text depth="3" class="welcome-subtitle">
          Create, customize, and share your perfect audio stream.
        </n-text>

        <n-grid :cols="3" :x-gap="24" :y-gap="24" responsive="screen">
          <n-gi v-for="feature in features" :key="feature.title">
            <n-card hoverable class="feature-card">
              <n-h3 prefix="bar" align-text>
                {{ feature.title }}
              </n-h3>
              <n-text depth="2" class="feature-description">
                {{ feature.description }}
              </n-text>
            </n-card>
          </n-gi>
        </n-grid>

        <n-button
            type="primary"
            size="large"
            @click="login"
            class="login-button"
        >
          <template #icon>
            <n-icon :component="LoginIcon"/>
          </template>
          Login to Build Your Station
        </n-button>
      </n-space>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import {inject} from 'vue';
import {useRouter} from 'vue-router';
import {
  NLayout,
  NLayoutContent,
  NH1,
  NText,
  NSpace,
  NGrid,
  NGi,
  NCard,
  NH3,
  NButton,
  NIcon
} from 'naive-ui';
import {Login as LoginIcon} from '@vicons/tabler'; // Assuming Login icon is appropriate

const keycloak = inject('keycloak'); // Keep Keycloak injection for login
const router = useRouter(); // Keep router for navigation

// Updated features to reflect advanced capabilities
const features = [
  {
    title: 'Personal AI DJ',
    description: 'Let our AI curate the perfect music mix just for you, or take control yourself.'
  },
  {
    title: 'Create Unique Tracks',
    description: 'Generate personalized songs and audio experiences on demand.'
  },
  {
    title: 'Share with Friends',
    description: 'Broadcast your station or share favorite tracks and playlists with your network.'
  }
];

const login = async () => {
  try {
    //await keycloak.login();
    router.push('/outline/dashboard');

  } catch (error) {
    console.error('Login failed:', error);
  }
};
</script>

<style scoped>
.welcome-layout {
  height: 100vh;
  display: flex;
  background-color: var(--n-color);
}

.welcome-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.welcome-title {
  text-align: center;
  margin-bottom: 0;
  color: var(--n-text-color);
}

.welcome-subtitle {
  text-align: center;
  font-size: 1.25rem;
}

.feature-card {
  height: 100%;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-description {
  display: block;
  margin-top: 0.5rem;
}

.login-button {
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .welcome-container {
    padding: 1.5rem;
  }

  .welcome-title {
    font-size: 1.75rem;
  }

  .welcome-subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .welcome-container {
    padding: 1rem;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  n-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>