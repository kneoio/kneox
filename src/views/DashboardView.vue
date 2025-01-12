<template>
  <div class="home">
    <!-- Main Grid Layout -->
    <n-grid x-gap="12" y-gap="12" cols="24" class="grid-layout">
      <!-- Spacer Section -->
      <n-gi span="2" class="spacer-section"></n-gi>

      <!-- Left Section for Marketing Text -->
      <n-gi span="10" class="left-section">
        <p v-if="userData.profile && userData.profile.username">
          Hello, {{ userData.profile.username }}
        </p>
        <n-text class="marketing-text">
          <strong>Simplify Your music listening experience</strong><br/><br/>
          <strong>User-Friendly:</strong> Manage you songs easy.<br/>
          <strong>AI Assistance:</strong> Smart reminders and suggestions.<br/>
          <strong>Always Accessible:</strong> Cross-platform compatibility.<br/><br/>
          Experience simplicity and efficiency. Get started now!
        </n-text>
      </n-gi>

      <!-- Right Section (Placeholder for Additional Content or Images) -->
      <n-gi span="12" class="right-section">
        <!-- Placeholder or additional content goes here -->
      </n-gi>
    </n-grid>

    <!-- Bottom Grid Layout for Language Selection and Links -->
    <n-grid x-gap="12" y-gap="12" cols="24" class="bottom-section">
      <!-- Language Selection Section -->
      <n-gi span="12" class="language-select">
        <n-select v-model:value="selectedLanguage" :options="languageOptions" />
      </n-gi>

      <!-- Links Section -->
      <n-gi span="12" class="links">
        <n-button text>License</n-button>&nbsp;&nbsp;&nbsp;
        <n-button text>About</n-button>
      </n-gi>
    </n-grid>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, inject } from 'vue';
import { NButton, NSelect, NText, NGrid, NGi } from 'naive-ui';

export default defineComponent({
  components: {
    NButton,
    NSelect,
    NText,
    NGrid,
    NGi
  },
  setup() {
    const selectedLanguage = ref('en');
    const languageOptions = [
      { label: 'English', value: 'en' },
      { label: 'Portuguese', value: 'pt' },
    ];
    const userData = inject<any>('userData');

    return {
      selectedLanguage,
      languageOptions,
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

.grid-layout {
  width: 80%;
  margin: auto;
}

.left-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
  padding: 20px;
  margin-left: 20px;
}

.right-section {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: right;
  padding: 20px;
}

.marketing-text {
  font-size: 16px;
  margin-top: 20px;
  text-align: left;
}

.bottom-section {
  width: 80%;
  margin: auto;
  margin-top: 20px;
}

.language-select {
  display: flex;
  justify-content: flex-start;
  width: 150px;
  margin-bottom: 10px;
}

.links {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 600px) {
  .grid-layout {
    flex-direction: column;
    width: 100%; /* Make grid layout full width on small screens */
  }

  .left-section {
    margin-left: 0;
    margin-bottom: 20px;
    padding: 15px;
  }

  .right-section {
    padding: 15px;
    justify-content: center; /* Center content on smaller screens */
    text-align: center;
  }

  .bottom-section {
    flex-direction: column;
    align-items: center;
  }

  .language-select {
    justify-content: center;
    margin-bottom: 20px;
  }

  .links {
    justify-content: center;
  }
}
</style>
