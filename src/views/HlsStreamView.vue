<template>
  <div class="stream-view">
    <n-space vertical>
      <n-card>
        <n-form :model="formState" label-placement="left" label-width="auto">
          <n-space>
            <n-form-item label="Stream Source">
              <n-select
                  v-model:value="selectedSource"
                  :options="sourceOptions"
                  placeholder="Select stream source"
                  filterable
                  style="min-width: 400px"
                  @update:value="handleSourceChange"
              />
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
import { defineComponent, ref, inject, onMounted, computed } from 'vue';
import HlsPlayer from "../components/HlsPlayer.vue";
import { useBrandStore } from "../stores/kneo/brandsStore";
import {
  NButton,
  NSpace,
  NForm,
  NFormItem,
  NInput,
  NCard,
  NSelect
} from 'naive-ui';

export default defineComponent({
  name: 'HlsStreamView',
  components: {
    HlsPlayer,
    NButton,
    NSpace,
    NForm,
    NFormItem,
    NInput,
    NCard,
    NSelect
  },
  setup() {
    const parentTitle = inject('parentTitle', ref(''));
    const isLoading = ref(false);
    const selectedSource = ref('');
    const brandStore = useBrandStore();

    const formState = ref({
      url: ''
    });

    const sourceOptions = computed(() => {
      const brandOptions = brandStore.getEntries.map(brand => ({
        label: brand.slugName,
        value: `brand:${brand.slugName}`,
        url: brand.url
      }));

      return [
        ...brandOptions,
        {
          label: 'Custom URL',
          value: 'custom',
          url: ''
        }
      ];
    });

    const handleSourceChange = (value) => {
      if (value === 'custom') {
        formState.value.url = '';
        return;
      }

      const selectedOption = sourceOptions.value.find(option => option.value === value);
      if (selectedOption) {
        formState.value.url = selectedOption.url;
      }
    };

    const loadStream = async () => {
      if (!formState.value.url) {
        return;
      }

      isLoading.value = true;

      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
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
      brandStore.fetchAll();
    });

    return {
      formState,
      loadStream,
      isLoading,
      selectedSource,
      sourceOptions,
      handleSourceChange
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