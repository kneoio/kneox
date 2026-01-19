<template>
  <n-grid :cols="1" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <router-view />
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import {
  NButton,
  NCard,
  NGi,
  NGrid,
  NPageHeader,
  NSpace,
  NIcon
} from 'naive-ui';
import { Clock, PlayerPlay } from '@vicons/tabler';

export default defineComponent({
  name: 'Scenes',
  components: {
    NPageHeader,
    NButton,
    NCard,
    NGi,
    NGrid,
    NSpace,
    NIcon,
    Clock,
    PlayerPlay
  },
  setup() {
    const router = useRouter();
    
    const goToAbsoluteTimeScenes = () => {
      router.push({ name: 'AbsoluteTimeScenes' });
    };
    
    const goToRelativeTimeScenes = () => {
      router.push({ name: 'RelativeTimeScenes' });
    };
    
    return {
      goToAbsoluteTimeScenes,
      goToRelativeTimeScenes
    };
  }
});
</script>

<style scoped>
.n-card {
  margin-top: 20px;
}

.n-button {
  width: 200px;
  height: 60px;
}
</style>
