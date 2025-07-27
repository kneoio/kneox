<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
        <template #title>{{ localFormData.description || 'New Event' }}</template>
        <template #footer>
          <span v-if="localFormData.id">
            Registered: {{ localFormData.regDate }}, Last Modified: {{ localFormData.lastModifiedDate }}
            <br>
            Author: {{ localFormData.author }}, Last Modifier: {{ localFormData.lastModifier }}
          </span>
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" @click="handleDelete" size="large" :disabled="!localFormData.id">Delete</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto" :model="localFormData">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Brand">
                  <n-input
                      v-model:value="localFormData.brand"
                      placeholder="Brand"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Type" required>
                  <n-input
                      v-model:value="localFormData.type"
                      placeholder="Event Type"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Timestamp" required>
                  <n-date-picker
                      v-model:value="timestampValue"
                      type="datetime"
                      placeholder="Event Timestamp"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Description" required>
                  <n-input
                      v-model:value="localFormData.description"
                      type="textarea"
                      placeholder="Event Description"
                      :autosize="{ minRows: 3, maxRows: 6 }"
                      style="width: 80%; max-width: 800px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Priority">
                  <n-select
                      v-model:value="localFormData.priority"
                      :options="priorityOptions"
                      placeholder="Select Priority"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import {
  NGrid, NGi, NPageHeader, NButton, NButtonGroup, NTabs, NTabPane,
  NForm, NFormItem, NInput, NSelect, NDatePicker
} from 'naive-ui';
import { useEventsStore } from '../../../stores/kneo/eventsStore';
import type { EventEntry, EventSave } from "../../../types/kneoBroadcasterTypes";
import { handleFormSaveError } from '../../../utils/errorHandling';

interface LocalEventFormData extends EventEntry {
  // Add any additional form-specific fields if needed
}

const route = useRoute();
const router = useRouter();
const message = useMessage();
const eventsStore = useEventsStore();

const activeTab = ref('properties');
const localFormData = reactive<LocalEventFormData>({
  id: '',
  author: '',
  regDate: '',
  lastModifier: '',
  lastModifiedDate: '',
  brand: '',
  type: '',
  timestampEvent: '',
  description: '',
  priority: '',
});

const timestampValue = ref<number | null>(null);

const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' }
];

const formTitle = computed(() => {
  return localFormData.id ? 'Edit Event' : 'New Event';
});

const goBack = () => {
  router.push({ name: 'Events' });
};

const loadFormData = () => {
  const current = eventsStore.getCurrent;
  Object.assign(localFormData, current);
  
  if (localFormData.timestampEvent) {
    timestampValue.value = new Date(localFormData.timestampEvent).getTime();
  }
};

const handleSave = async () => {
  try {
    if (!localFormData.type || !localFormData.description) {
      message.error('Type and Description are required');
      return;
    }

    if (!timestampValue.value) {
      message.error('Timestamp is required');
      return;
    }

    const saveData: EventSave = {
      brand: localFormData.brand,
      type: localFormData.type,
      timestampEvent: new Date(timestampValue.value).toISOString(),
      description: localFormData.description,
      priority: localFormData.priority,
    };

    await eventsStore.saveEvent(saveData, localFormData.id || null);
    message.success(localFormData.id ? 'Event updated successfully' : 'Event created successfully');
    goBack();
  } catch (error) {
    handleFormSaveError(error, message);
  }
};

const handleDelete = async () => {
  if (!localFormData.id) return;
  
  try {
    await eventsStore.deleteEvent(localFormData.id);
    message.success('Event deleted successfully');
    goBack();
  } catch (error) {
    console.error('Error deleting event:', error);
    message.error('Failed to delete event');
  }
};

watch(timestampValue, (newValue) => {
  if (newValue) {
    localFormData.timestampEvent = new Date(newValue).toISOString();
  }
});

onMounted(async () => {
  const id = route.params.id as string;
  if (id && id !== 'new') {
    try {
      await eventsStore.fetchEvent(id);
      loadFormData();
    } catch (error) {
      console.error('Error loading event:', error);
      message.error('Failed to load event');
    }
  }
});

</script>
