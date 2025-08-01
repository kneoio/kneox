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
        <n-tab-pane name="schedule" tab="Schedule">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item>
                  <n-checkbox v-model:checked="localFormData.schedule!.enabled">
                    Enable
                  </n-checkbox>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Scheduled Tasks">
                  <n-dynamic-input v-model:value="scheduleTasksArray" :on-create="createScheduleTask"
                    style="max-width: 800px;">
                    <template #default="{ value, index }">
                      <n-card size="small" class="mb-3">
                        <template #header>
                          <n-text strong>Task {{ index + 1 }}</n-text>
                        </template>

                        <n-space vertical size="medium">
                          <n-space>
                            <n-form-item label="Type" style="margin-bottom: 0;">
                              <n-select v-model:value="value.type" :options="taskTypeOptions" style="width: 150px;" />
                            </n-form-item>
                            <n-form-item label="Target" style="margin-bottom: 0;">
                              <n-select v-model:value="value.target" :options="targetOptions" filterable tag
                                placeholder="Select or type target" style="width: 150px;" />
                            </n-form-item>
                          </n-space>

                          <n-form-item label="Time Range" style="margin-bottom: 0;">
                            <n-space vertical style="width: 100%;">
                              <n-space align="center">
                                <n-button-group style="align-self: center;">
                                  <n-button size="small" @click="value.timeRange[0] = Math.max(0, value.timeRange[0] - 1)" style="margin-bottom: 16px;">
                                    -
                                  </n-button>
                                  <n-button size="small" @click="value.timeRange[0] = Math.min(value.timeRange[1] - 1, value.timeRange[0] + 1)" style="margin-bottom: 16px;">
                                    +
                                  </n-button>
                                </n-button-group>
                                
                                <n-slider v-model:value="value.timeRange" range :marks="timeMarks" :step="15" :min="0"
                                  :max="1440" style="width: 400px;" />
                                
                                <n-button-group style="align-self: center;">
                                  <n-button size="small" @click="value.timeRange[1] = Math.max(value.timeRange[0] + 1, value.timeRange[1] - 1)" style="margin-bottom: 16px;">
                                    -
                                  </n-button>
                                  <n-button size="small" @click="value.timeRange[1] = Math.min(1440, value.timeRange[1] + 1)" style="margin-bottom: 16px;">
                                    +
                                  </n-button>
                                </n-button-group>
                              </n-space>
                              <n-space>
                                <n-text depth="3" style="font-size: 12px;">{{ formatMinutesToTime(value.timeRange[0]) }}</n-text>
                                <n-text depth="3" style="font-size: 12px;">to</n-text>
                                <n-text depth="3" style="font-size: 12px;">{{ formatMinutesToTime(value.timeRange[1]) }}</n-text>
                                <n-text depth="3" style="font-size: 12px;">({{ calculateDurationFromMinutes(value.timeRange[0], value.timeRange[1]) }})</n-text>
                              </n-space>
                            </n-space>
                          </n-form-item>

                          <n-form-item label="Days" style="margin-bottom: 0;">
                            <n-checkbox-group v-model:value="value.weekdays">
                              <n-space>
                                <n-checkbox value="MONDAY" label="Mon" />
                                <n-checkbox value="TUESDAY" label="Tue" />
                                <n-checkbox value="WEDNESDAY" label="Wed" />
                                <n-checkbox value="THURSDAY" label="Thu" />
                                <n-checkbox value="FRIDAY" label="Fri" />
                                <n-checkbox value="SATURDAY" label="Sat" />
                                <n-checkbox value="SUNDAY" label="Sun" />
                              </n-space>
                            </n-checkbox-group>
                          </n-form-item>
                        </n-space>
                      </n-card>
                    </template>
                  </n-dynamic-input>
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
  NForm, NFormItem, NInput, NSelect, NDatePicker, NCard, NCheckbox,
  NCheckboxGroup, NDynamicInput, NSlider, NSpace, NText
} from 'naive-ui';
import { useEventsStore } from '../../../stores/kneo/eventsStore';
import type { EventEntry, EventSave } from "../../../types/kneoBroadcasterTypes";
import { handleFormSaveError } from '../../../utils/errorHandling';

interface LocalEventFormData extends EventEntry {
  schedule?: {
    enabled?: boolean;
    tasks?: any[];
  };
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
  schedule: {
    enabled: false,
    tasks: []
  }
});

const timestampValue = ref<number | null>(null);
const scheduleTasksArray = ref<any[]>([]);

const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' }
];

const taskTypeOptions = [
  { label: 'Event Trigger', value: 'EVENT_TRIGGER' },
  { label: 'Notification', value: 'NOTIFICATION' },
  { label: 'Action', value: 'ACTION' }
];

const targetOptions = [
  { value: 'default', label: 'default' }
];

const timeMarks = {
  0: '00:00',
  360: '06:00',
  720: '12:00',
  1080: '18:00',
  1440: '24:00'
};

const formTitle = computed(() => {
  return localFormData.id ? 'Edit Event' : 'New Event';
});

const goBack = () => {
  router.push({ name: 'Events' });
};

const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const calculateDurationFromMinutes = (startMinutes: number, endMinutes: number): string => {
  let duration = endMinutes - startMinutes;
  if (duration < 0) {
    duration += 24 * 60;
  }
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const createScheduleTask = () => ({
  type: 'EVENT_TRIGGER',
  target: 'default',
  timeRange: [540, 600],
  weekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
});

const loadFormData = () => {
  const current = eventsStore.getCurrent;
  Object.assign(localFormData, current);
  
  if (localFormData.timestampEvent) {
    timestampValue.value = new Date(localFormData.timestampEvent).getTime();
  }

  if (localFormData.schedule && localFormData.schedule.tasks && localFormData.schedule.tasks.length > 0) {
    scheduleTasksArray.value = localFormData.schedule.tasks.map(task => ({
      type: task.type,
      target: task.target,
      timeRange: task.timeWindowTrigger ? [
        timeToMinutes(task.timeWindowTrigger.startTime),
        timeToMinutes(task.timeWindowTrigger.endTime)
      ] : [540, 600],
      weekdays: task.timeWindowTrigger ? task.timeWindowTrigger.weekdays : []
    }));
  } else {
    scheduleTasksArray.value = [];
  }

  if (!localFormData.schedule) {
    localFormData.schedule = {
      enabled: false,
      tasks: []
    };
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
      schedule: localFormData.schedule ? JSON.parse(JSON.stringify(localFormData.schedule)) : undefined
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

watch(scheduleTasksArray, (newValue) => {
  if (!localFormData.schedule) {
    localFormData.schedule = { enabled: false, tasks: [] };
  }

  localFormData.schedule.tasks = newValue.map(task => ({
    type: task.type,
    target: task.target,
    triggerType: 'TIME_WINDOW',
    timeWindowTrigger: {
      startTime: formatMinutesToTime(task.timeRange[0]),
      endTime: formatMinutesToTime(task.timeRange[1]),
      weekdays: task.weekdays
    }
  }));
}, { deep: true });

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
