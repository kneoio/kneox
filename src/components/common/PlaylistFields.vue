<template>
  <n-form label-placement="left" label-width="auto">
    <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
      <n-gi>
        <n-form-item label="Source">
          <n-radio-group
              :value="modelValue?.sourcing"
              @update:value="updateField('sourcing', $event)"
              name="radiobuttongroup1"
          >
            <n-radio-button value="RANDOM" label="Random" />
            <n-radio-button v-if="!hideStaticList" value="STATIC_LIST" label="Static List" />
            <n-radio-button value="QUERY" label="Query" />
          </n-radio-group>
        </n-form-item>
      </n-gi>

      <!-- RANDOM: Show info text only -->
      <n-gi v-if="modelValue?.sourcing === 'RANDOM'">
        <n-text depth="3">Server will randomly select songs from the brand's available sound fragments.</n-text>
      </n-gi>

      <!-- STATIC_LIST: Show multi-select for specific sound fragments -->
      <n-gi v-if="modelValue?.sourcing === 'STATIC_LIST'">
        <n-form-item label="Sound Fragments">
          <n-select
              :value="modelValue?.staticList"
              @update:value="updateField('staticList', $event)"
              :options="soundFragmentOptions"
              multiple
              filterable
              placeholder="Select sound fragments"
              :loading="loadingFragments"
              style="width: 80%; max-width: 800px;"
          />
        </n-form-item>
      </n-gi>

      <!-- QUERY: Show filter fields -->
      <template v-if="modelValue?.sourcing === 'QUERY'">
        <n-gi>
          <n-form-item label="Search" label-width="80">
            <n-input
                :value="modelValue?.searchTerm"
                @update:value="updateField('searchTerm', $event)"
                placeholder="Search by title, artist..."
                clearable
                style="width: 50%; max-width: 600px;"
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="Genres" label-width="80">
            <n-select
                :value="modelValue?.genres"
                @update:value="updateField('genres', $event)"
                :options="genreOptions"
                multiple
                filterable
                placeholder="Select genres"
                clearable
                style="width: 50%; max-width: 600px;"
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="Labels" label-width="80">
            <n-select
                :value="modelValue?.labels"
                @update:value="updateField('labels', $event)"
                :options="labelOptions"
                multiple
                filterable
                placeholder="Select labels"
                clearable
                style="width: 50%; max-width: 600px;"
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="Type" label-width="80">
            <n-select
                :value="modelValue?.type"
                @update:value="updateField('type', $event)"
                :options="referencesStore.fragmentTypeOptions"
                multiple
                placeholder="Select types"
                clearable
                style="width: 30%; max-width: 300px;"
            />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="Source" label-width="80">
            <n-select
                :value="modelValue?.source"
                @update:value="updateField('source', $event)"
                :options="referencesStore.fragmentSourceOptions"
                multiple
                placeholder="Select sources"
                clearable
                style="width: 30%; max-width: 300px;"
            />
          </n-form-item>
        </n-gi>
      </template>
    </n-grid>
  </n-form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { NForm, NFormItem, NInput, NSelect, NGrid, NGi, NRadioGroup, NRadioButton, NText } from 'naive-ui';
import { useReferencesStore } from '../../stores/kneo/referencesStore';
import { useSoundFragmentStore } from '../../stores/kneo/soundFragmentStore';

interface PlaylistData {
  sourcing?: string;
  searchTerm?: string;
  genres?: string[];
  labels?: string[];
  type?: string[];
  source?: string[];
  staticList?: string[];
}

const props = defineProps<{
  modelValue: PlaylistData;
  brandId?: string;
  genreOptions: Array<{label: string, value: string}>;
  labelOptions: Array<{ label: string; value: string; color?: string; fontColor?: string }>;
  hideStaticList?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: PlaylistData];
}>();

const referencesStore = useReferencesStore();
const soundFragmentStore = useSoundFragmentStore();
const loadingFragments = ref(false);
const brandSoundFragments = ref<Array<{ id: string; title: string; artist?: string }>>([]);

const soundFragmentOptions = computed(() => {
  return brandSoundFragments.value.map(sf => ({
    label: sf.artist ? `${sf.title} - ${sf.artist}` : sf.title,
    value: sf.id
  }));
});

const updateField = (field: keyof PlaylistData, value: any) => {
  emit('update:modelValue', {
    ...(props.modelValue || {}),
    [field]: value
  });
};

const fetchBrandSoundFragments = async () => {
  if (!props.brandId) {
    brandSoundFragments.value = [];
    return;
  }
  
  loadingFragments.value = true;
  try {
    await soundFragmentStore.fetchAvailableSoundFragments(props.brandId, 1, 500);
    const entries = soundFragmentStore.getAvailableSoundFragments;
    brandSoundFragments.value = entries.map((entry: any) => ({
      id: entry.soundfragment?.id || entry.id,
      title: entry.soundfragment?.title || entry.title || 'Untitled',
      artist: entry.soundfragment?.artist || entry.artist
    }));
  } catch (error) {
    console.error('Failed to fetch sound fragments:', error);
    brandSoundFragments.value = [];
  } finally {
    loadingFragments.value = false;
  }
};

watch(() => props.brandId, (newBrandId) => {
  if (newBrandId && props.modelValue?.sourcing === 'STATIC_LIST') {
    fetchBrandSoundFragments();
  }
}, { immediate: true });

watch(() => props.modelValue?.sourcing, (newSourcing) => {
  if (newSourcing === 'STATIC_LIST' && props.brandId) {
    fetchBrandSoundFragments();
  }
});

onMounted(async () => {
  await referencesStore.fetchGenres();
  await referencesStore.fetchLabels();
});
</script>
