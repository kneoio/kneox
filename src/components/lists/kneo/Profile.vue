<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>User Profile</template>
        <template #footer>
          {{ userInfo.preferred_username || 'Unknown User' }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-card title="Profile Information">
        <n-descriptions :column="isMobile ? 1 : 2" bordered>
          <n-descriptions-item label="Username">
            {{ userInfo.preferred_username || 'N/A' }}
          </n-descriptions-item>
          <n-descriptions-item label="Email">
            {{ userInfo.email || 'N/A' }}
          </n-descriptions-item>
          <n-descriptions-item label="First Name">
            {{ userInfo.given_name || 'N/A' }}
          </n-descriptions-item>
          <n-descriptions-item label="Last Name">
            {{ userInfo.family_name || 'N/A' }}
          </n-descriptions-item>
          <n-descriptions-item label="Full Name">
            {{ userInfo.name || 'N/A' }}
          </n-descriptions-item>
          <n-descriptions-item label="Subject ID">
            {{ userInfo.sub || 'N/A' }}
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-card title="Roles & Permissions">
        <n-space vertical>
          <n-tag
            v-for="role in userRoles"
            :key="role"
            :type="role === 'supervisor' ? 'success' : 'default'"
            size="medium"
          >
            {{ role }}
          </n-tag>
          <n-text v-if="userRoles.length === 0" depth="3">
            No roles assigned
          </n-text>
        </n-space>
      </n-card>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-card title="Session Information">
        <n-descriptions :column="1" bordered>
          <n-descriptions-item label="Session State">
            {{ keycloakInst.authenticated ? 'Authenticated' : 'Not Authenticated' }}
          </n-descriptions-item>
          <n-descriptions-item label="Token Type">
            {{ userInfo.typ || 'N/A' }}
          </n-descriptions-item>
          <n-descriptions-item label="Issued At">
            {{ formatTimestamp(userInfo.iat) }}
          </n-descriptions-item>
          <n-descriptions-item label="Expires At">
            {{ formatTimestamp(userInfo.exp) }}
          </n-descriptions-item>
          <n-descriptions-item label="Issuer">
            {{ userInfo.iss || 'N/A' }}
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import {
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NGi,
  NGrid,
  NPageHeader,
  NSpace,
  NTag,
  NText
} from 'naive-ui';
import keycloakInst from '../../../keycloakFactory.js';

export default defineComponent({
  name: 'Profile',
  components: {
    NCard,
    NDescriptions,
    NDescriptionsItem,
    NGi,
    NGrid,
    NPageHeader,
    NSpace,
    NTag,
    NText
  },
  setup() {
    const isMobile = ref(window.innerWidth < 768);

    const userInfo = computed(() => {
      return keycloakInst.tokenParsed || {};
    });

    const userRoles = computed(() => {
      return keycloakInst.tokenParsed?.realm_access?.roles || [];
    });

    const formatTimestamp = (timestamp: number | undefined): string => {
      if (!timestamp) return 'N/A';
      return new Date(timestamp * 1000).toLocaleString();
    };

    return {
      isMobile,
      userInfo,
      userRoles,
      keycloakInst,
      formatTimestamp
    };
  }
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>
