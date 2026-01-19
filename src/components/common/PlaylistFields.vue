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
            <n-radio-button value="STATIC_LIST" label="Static List" />
            <n-radio-button value="QUERY" label="Query" />
            <n-radio-button v-if="!hideGenerated" value="GENERATED" label="Generated" />
          </n-radio-group>
        </n-form-item>
      </n-gi>

      <!-- RANDOM: Show info text only -->
      <n-gi v-if="modelValue?.sourcing === 'RANDOM'">
        <n-text depth="3">Server will randomly select songs from the brand's available sound fragments.</n-text>
      </n-gi>

      <n-gi v-if="modelValue?.sourcing === 'STATIC_LIST'">
        <n-form-item label="Sound Fragments">
          <n-select
              :value="modelValue?.soundFragments"
              @update:value="updateField('soundFragments', $event)"
              :options="soundFragmentOptions"
              multiple
              filterable
              remote
              clearable
              :loading="loadingSoundFragments"
              @search="handleSoundFragmentSearch"
              @focus="handleSoundFragmentFocus"
              placeholder=""
              style="width: 50%; max-width: 600px;"
          />
        </n-form-item>
      </n-gi>

      <!-- GENERATED: Show prompts field -->
      <n-gi v-if="modelValue?.sourcing === 'GENERATED'">
        <n-form-item label="Prompts">
          <n-dynamic-input
              :value="modelValue?.prompts || []"
              @update:value="updateField('prompts', $event)"
              :on-create="createPrompt"
              placeholder=""
              style="width: 50%; max-width: 600px;"
          >
            <template #default="{ index }">
              <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                <n-select
                    :value="(modelValue?.prompts || [])[index]?.promptId"
                    @update:value="updatePromptAt(index, $event)"
                    :options="promptOptions"
                    :render-label="renderPromptLabel"
                    placeholder=""
                    style="min-width: 600px;"
                />
              </div>
            </template>
          </n-dynamic-input>
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
            <n-tree-select
                :value="modelValue?.genres"
                @update:value="updateField('genres', $event)"
                :options="genreOptions"
                multiple
                checkable
                filterable
                default-expand-all
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
import { ref, computed, onMounted, watch, h } from 'vue';
import { NForm, NFormItem, NInput, NSelect, NGrid, NGi, NRadioGroup, NRadioButton, NText, NTreeSelect, NDynamicInput, NTag } from 'naive-ui';
import apiClient from '../../api/apiClient';
import { useReferencesStore } from '../../stores/kneo/referencesStore';
import { usePromptStore } from '../../stores/kneo/promptStore';

interface PlaylistData {
  sourcing?: string;
  searchTerm?: string;
  genres?: string[];
  labels?: string[];
  type?: string[];
  source?: string[];
  staticList?: string[];
  soundFragments?: string[];
  prompts?: Array<{ promptId: string; active?: boolean; rank?: number; weight?: number }>;
}

const props = defineProps<{
  modelValue: PlaylistData;
  brandId?: string;
  genreOptions: Array<{label: string, value: string}>;
  labelOptions: Array<{ label: string; value: string; color?: string; fontColor?: string }>;
  hideStaticList?: boolean;
  hideGenerated?: boolean;
  promptOptions?: Array<{ label: string; value: string; master?: boolean; podcast?: boolean; promptType?: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: PlaylistData];
}>();

const referencesStore = useReferencesStore();
const promptStore = usePromptStore();
const loadingSoundFragments = ref(false);
const lastSoundFragmentQuery = ref('');
const soundFragmentSearchResults = ref<Array<{ id: string; title: string; artist?: string }>>([]);
const soundFragmentCache = ref<Array<{ id: string; title: string; artist?: string }>>([]);
const generatorPrompts = ref<Array<any>>([]);

const soundFragmentOptions = computed(() => {
  const merged = new Map<string, { id: string; title: string; artist?: string }>();
  for (const sf of soundFragmentCache.value) merged.set(sf.id, sf);
  for (const sf of soundFragmentSearchResults.value) merged.set(sf.id, sf);
  return Array.from(merged.values()).map(sf => ({
    label: sf.artist ? `${sf.title} - ${sf.artist}` : sf.title,
    value: sf.id
  }));
});

const promptOptions = computed(() => {
  const allPrompts = (promptStore.getEntries || [])
    .filter((p: any) => typeof p.id === 'string' && p.id)
    .map((p: any) => ({
      label: p.title || p.description || p.prompt || p.id,
      value: p.id as string,
      master: p.master,
      podcast: p.podcast,
      promptType: p.promptType
    }));
  
  // If sourcing is GENERATED, return stored generator prompts
  if (props.modelValue?.sourcing === 'GENERATED') {
    return generatorPrompts.value.map((p: any) => ({
      label: p.title || p.description || p.prompt || p.id,
      value: p.id as string,
      master: p.master,
      podcast: p.podcast,
      promptType: p.promptType
    }));
  }
  
  return props.promptOptions || allPrompts;
});

const updateField = (field: keyof PlaylistData, value: any) => {
  emit('update:modelValue', {
    ...(props.modelValue || {}),
    [field]: value
  });
};

const updatePromptAt = (index: number, value: string) => {
  const prompts = [...(props.modelValue?.prompts || [])];
  prompts[index] = { ...prompts[index], promptId: value };
  updateField('prompts', prompts);
};

const createPrompt = () => ({
  promptId: '',
  active: true,
  rank: 0,
  weight: 0.5
});

const renderPromptLabel = (option: any) => {
  return h('span', { style: 'display: flex; align-items: center; gap: 8px;' }, [
    option.master ? h(NTag, { type: 'info', size: 'small' }, { default: () => 'Master' }) : null,
    option.podcast ? h(NTag, { type: 'warning', size: 'small' }, { default: () => 'Podcast' }) : null,
    option.promptType ? h(NTag, { type: 'success', size: 'small' }, { default: () => option.promptType }) : null,
    h('span', option.label)
  ]);
};

const fetchSoundFragments = async (q: string) => {
  loadingSoundFragments.value = true;
  lastSoundFragmentQuery.value = q;
  try {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('size', '10');
    params.set('q', q);
    const response = await apiClient.get(`/soundfragments?${params.toString()}`);
    const entries = response?.data?.payload?.viewData?.entries || [];
    if (lastSoundFragmentQuery.value !== q) return;
    soundFragmentSearchResults.value = entries.map((entry: any) => ({
      id: entry.id,
      title: entry.title,
      artist: entry.artist
    }));
  } catch (error) {
    console.error('Failed to fetch sound fragments:', error);
    if (lastSoundFragmentQuery.value === q) soundFragmentSearchResults.value = [];
  } finally {
    if (lastSoundFragmentQuery.value === q) loadingSoundFragments.value = false;
  }
};

const fetchSoundFragmentById = async (id: string) => {
  const response = await apiClient.get(`/soundfragments/${id}`);
  const docData = response?.data?.payload?.docData;
  if (!docData?.id) return;
  const existing = soundFragmentCache.value.find(sf => sf.id === docData.id);
  if (existing) return;
  soundFragmentCache.value = [
      ...soundFragmentCache.value,
      {
        id: docData.id,
        title: docData.title,
        artist: docData.artist
      }
    ];
};

const preloadSelectedSoundFragments = async () => {
  const ids = props.modelValue?.soundFragments || [];
  await Promise.all(ids.map((id) => fetchSoundFragmentById(id)));
};

const handleSoundFragmentSearch = (q: string) => {
  fetchSoundFragments(q);
};

const handleSoundFragmentFocus = () => {};

watch(() => props.modelValue?.sourcing, (newSourcing) => {
  if (newSourcing === 'STATIC_LIST') {
    fetchSoundFragments('');
  }
  if (newSourcing === 'GENERATED') {
    fetchGeneratorPrompts();
  }
});

watch(() => props.modelValue?.soundFragments, async () => {
  await preloadSelectedSoundFragments();
});

const fetchGeneratorPrompts = async () => {
  try {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('size', '100');
    params.set('filter', JSON.stringify({ promptType: 'GENERATOR' }));

    const response = await apiClient.get(`/prompts?${params.toString()}`);
    if (response?.data?.payload?.viewData?.entries) {
      generatorPrompts.value = response.data.payload.viewData.entries;
    } else {
      generatorPrompts.value = [];
    }
  } catch (error) {
    console.error('Failed to fetch generator prompts:', error);
  }
};

onMounted(async () => {
  if (!props.promptOptions) {
    await promptStore.fetchAll(1, 100, { master: true });
  }
  // If initial sourcing is GENERATED, fetch generator prompts
  if (props.modelValue?.sourcing === 'GENERATED') {
    await fetchGeneratorPrompts();
  }

  await preloadSelectedSoundFragments();
});
</script>
