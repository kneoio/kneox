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
          </n-radio-group>
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="Title">
          <n-input
              :value="modelValue?.title"
              @update:value="updateField('title', $event)"
              placeholder=""
              style="width: 50%; max-width: 600px;"
          />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="Artist">
          <n-input
              :value="modelValue?.artist"
              @update:value="updateField('artist', $event)"
              placeholder=""
              style="width: 50%; max-width: 600px;"
          />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="Genres">
          <n-select
              :value="modelValue?.genres"
              @update:value="updateField('genres', $event)"
              :options="genreOptions"
              multiple
              filterable
              placeholder="Select genres"
              style="width: 50%; max-width: 600px;"
          />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="Labels">
          <n-select
              :value="modelValue?.labels"
              @update:value="updateField('labels', $event)"
              :options="labelOptions"
              multiple
              filterable
              placeholder="Select labels"
              style="width: 50%; max-width: 600px;"
          />
        </n-form-item>
      </n-gi>
    </n-grid>
  </n-form>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { NForm, NFormItem, NInput, NSelect, NGrid, NGi, NRadioGroup, NRadioButton } from 'naive-ui';
import { useReferencesStore } from '../../stores/kneo/referencesStore';

interface PlaylistData {
  sourcing?: string;
  title?: string;
  artist?: string;
  genres?: string[];
  labels?: string[];
}

const props = defineProps<{
  modelValue: PlaylistData;
  genreOptions: Array<{label: string, value: string}>;
  labelOptions: Array<{ label: string; value: string; color?: string; fontColor?: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: PlaylistData];
}>();

const referencesStore = useReferencesStore();

const updateField = (field: keyof PlaylistData, value: any) => {
  emit('update:modelValue', {
    ...(props.modelValue || {}),
    [field]: value
  });
};

onMounted(async () => {
  await referencesStore.fetchGenres();
  await referencesStore.fetchLabels();
});
</script>
