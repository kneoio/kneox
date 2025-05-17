<template>
  <n-result
      status="404"
      title="404 Not Found"
      description="The page you're looking for doesn't exist"
  >
    <template #footer>
      <n-button @click="goHome">Take Me Home</n-button>
    </template>
  </n-result>
</template>

<script setup>
import { NResult, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';

const router = useRouter();
const goHome = () => router.push('/');
</script>