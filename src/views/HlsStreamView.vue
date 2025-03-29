<template>
  <div class="stream-view">
    <n-space vertical>
      <n-card>
        <n-form :model="formState" label-placement="left" label-width="auto">
          <n-space>
          <n-form-item label="Stream URL">
            <n-input v-model:value="formState.url" placeholder="Enter HLS stream URL" style="min-width: 400px" />
          </n-form-item>
          <n-form-item>
            <n-button type="primary" @click="loadStream" :loading="isLoading">
              {{ isLoading ? 'Loading...' : 'Load Stream' }}
            </n-button>
          </n-form-item>
          </n-space>
        </n-form>
      </n-card>


        <hls-player :source="formState.url" :debug="true" />



    </n-space>
  </div>
</template>

<script>
import { defineComponent, ref, inject, onMounted } from 'vue';
import HlsPlayer from "../components/HlsPlayer.vue";
import {
  NButton,
  NSpace,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NInput,
  NCard,
  NUl,
  NLi
} from 'naive-ui';

export default defineComponent({
  name: 'HlsStreamView',
  components: {
    HlsPlayer,
    NButton,
    NSpace,
    NCollapse,
    NCollapseItem,
    NForm,
    NFormItem,
    NInput,
    NCard,
    NUl,
    NLi
  },
  setup() {
    const parentTitle = inject('parentTitle', ref(''));
    const isLoading = ref(false);
    const formState = ref({
      url: 'http://localhost:38707/gill-russell/radio/stream.m3u8'
    });

    const loadStream = async () => {
      if (!formState.value.url) {
        return;
      }

      isLoading.value = true;
      showPlayer.value = false;

      // Simulate checking stream validity
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        showPlayer.value = true;
      } catch (error) {
        console.error('Error loading stream', error);
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(() => {
      if (parentTitle) {
        parentTitle.value = 'HLS Stream Tester';
      }
    });

    return {
      formState,
      loadStream,
      isLoading
    };
  }
});
</script>

<style scoped>
.stream-view {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.player-wrapper {
  margin-top: 20px;
  margin-bottom: 20px;
}

.info-section {
  line-height: 1.6;
  color: #333;
}

@media (max-width: 768px) {
  .stream-view {
    padding: 0 8px;
  }
}
</style>