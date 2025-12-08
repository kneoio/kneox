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
        <n-button type="error" @click="handleDelete" size="large" :disabled="!localFormData.id">Delete</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto" :model="localFormData">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Type">
                  <n-select
                      v-model:value="localFormData.type"
                      :options="referencesStore.eventTypeOptions"

                      style="width: 25%; max-width: 300px;"
                  />
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="Description">
                  <n-input
                      v-model:value="localFormData.description"
                      type="textarea"
                      placeholder=""
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

                      style="width: 25%; max-width: 300px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Assign To">
                  <n-select
                      v-model:value="localFormData.brandId"
                      :options="radioStationOptions"
                      filterable

                      style="width: 25%; max-width: 300px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Timezone">
                  <n-select
                      v-model:value="localFormData.timeZone"
                      :options="referencesStore.timezones"
                      filterable

                      style="width: 25%; max-width: 300px;"
                  />
                  <n-text depth="3" style="font-size: 12px; margin-top: 4px; display: block;">
                    ⚠️ Timezone should usually match the radio station location
                  </n-text>
                  <n-text v-if="getCurrentTimeInTimezone" depth="2" style="font-size: 12px; margin-top: 4px; display: block; color: #18a058;">
                    {{ getCurrentTimeInTimezone }}
                  </n-text>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Actions">
                  <n-dynamic-input
                    v-model:value="eventActions"
                    :on-create="createEventAction"
                    style="width: 80%; max-width: 800px;"
                  >
                    <template #default="{ index }">
                      <n-select
                        v-model:value="eventActions[index].promptId"
                        :options="promptOptions"
                        placeholder="Select action"
                        style="min-width: 400px;"
                      />
                    </template>
                  </n-dynamic-input>
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
                          <!-- Trigger Type Selection -->
                          <n-form-item label="Trigger Type" style="margin-bottom: 0;">
                            <n-select v-model:value="value.triggerType" :options="triggerTypeOptions" style="width: 150px;" />
                          </n-form-item>
                          
                          <!-- ONCE: Show only Timestamp field -->
                          <n-form-item v-if="value.triggerType === 'ONCE'" label="Event Time" style="margin-bottom: 0;">
                            <n-date-picker
                                v-model:value="value.timestampValue"
                                type="datetime"

                                style="width: 300px;"
                            />
                          </n-form-item>
                          
                          <!-- PERIODIC: Show type, target, startTime, endTime, interval, and weekdays -->
                          <template v-if="value.triggerType === 'PERIODIC'">
                            <n-space>
                              <n-form-item label="Type" style="margin-bottom: 0;">
                                <n-select v-model:value="value.type" :options="taskTypeOptions" style="width: 150px;" />
                              </n-form-item>
                              <n-form-item label="Target" style="margin-bottom: 0;">
                                <n-select v-model:value="value.target" :options="targetOptions" filterable tag
                                  style="width: 150px;" />
                              </n-form-item>
                            </n-space>

                            <n-form-item label="Start Time" style="margin-bottom: 0;">
                              <n-space vertical style="width: 100%;">
                                <n-space align="center">
                                  <n-button-group style="align-self: center;">
                                    <n-button size="small" @click="value.startTime = Math.max(0, value.startTime - 1)" style="margin-bottom: 16px;">
                                      -
                                    </n-button>
                                    <n-button size="small" @click="value.startTime = Math.min(1440, value.startTime + 1)" style="margin-bottom: 16px;">
                                      +
                                    </n-button>
                                  </n-button-group>
                                  
                                  <n-slider v-model:value="value.startTime" :marks="timeMarks" :step="15" :min="0"
                                    :max="1440" style="width: 400px;" :tooltip="false" :format-tooltip="(value) => formatMinutesToTime(value)" />
                                </n-space>
                                <n-space>
                                  <n-text depth="3" style="font-size: 12px;">{{ formatMinutesToTime(value.startTime) }}</n-text>
                                </n-space>
                              </n-space>
                            </n-form-item>

                            <n-form-item label="End Time" style="margin-bottom: 0;">
                              <n-space vertical style="width: 100%;">
                                <n-space align="center">
                                  <n-button-group style="align-self: center;">
                                    <n-button size="small" @click="value.endTime = Math.max(0, value.endTime - 1)" style="margin-bottom: 16px;">
                                      -
                                    </n-button>
                                    <n-button size="small" @click="value.endTime = Math.min(1440, value.endTime + 1)" style="margin-bottom: 16px;">
                                      +
                                    </n-button>
                                  </n-button-group>
                                  
                                  <n-slider v-model:value="value.endTime" :marks="timeMarks" :step="15" :min="0"
                                    :max="1440" style="width: 400px;" :tooltip="false" :format-tooltip="(value) => formatMinutesToTime(value)" />
                                </n-space>
                                <n-space>
                                  <n-text depth="3" style="font-size: 12px;">{{ formatMinutesToTime(value.endTime) }}</n-text>
                                </n-space>
                              </n-space>
                            </n-form-item>

                            <n-form-item label="Interval (minutes)" style="margin-bottom: 0;">
                              <n-input-number v-model:value="value.interval" :min="1" :max="1440" style="width: 150px;" />
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
                          </template>
                        </n-space>
                      </n-card>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="acl" tab="ACL">
          <acl-table :acl-data="aclData" :loading="aclLoading" />
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
  NCheckboxGroup, NDynamicInput, NSlider, NSpace, NText, NInputNumber
} from 'naive-ui';
import { useEventsStore } from '../../../stores/kneo/eventsStore';
import { useRadioStationStore } from '../../../stores/kneo/radioStationStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import { usePromptStore } from '../../../stores/kneo/promptStore';
import type { Event, EventAction, EventSave } from "../../../types/kneoBroadcasterTypes";
import { PromptType } from "../../../types/kneoBroadcasterTypes";
import { handleFormSaveError, getErrorMessage } from '../../../utils/errorHandling';
import AclTable from '../../common/AclTable.vue';

interface LocalEventFormData extends Event {
  triggerType?: string;
  schedule?: {
    enabled?: boolean;
    tasks?: any[];
  };
}

const route = useRoute();
const router = useRouter();
const message = useMessage();
const eventsStore = useEventsStore();
const radioStationStore = useRadioStationStore();
const referencesStore = useReferencesStore();
const promptStore = usePromptStore();

const activeTab = ref('properties');
const currentTime = ref(new Date());
const clockIntervalId = ref<number | null>(null);
const previousType = ref<string>('');

const localFormData = reactive<LocalEventFormData>({
  id: '',
  author: '',
  regDate: '',
  lastModifier: '',
  lastModifiedDate: '',
  brandId: '',
  timeZone: '',
  type: '',
  description: '',
  priority: '',
  triggerType: 'ONCE',
  actions: [],
  schedule: {
    enabled: false,
    tasks: []
  }
});

const scheduleTasksArray = ref<any[]>([]);
const eventActions = ref<EventAction[]>([]);
const aclData = ref<any[]>([]);
const aclLoading = ref(false);

const triggerTypeOptions = [
  { label: 'Once', value: 'ONCE' },
  { label: 'Periodic', value: 'PERIODIC' }
];



const radioStationOptions = computed(() => {
  return radioStationStore.getEntries.map(station => ({
    label: station.slugName,
    value: station.id
  }));
});

const promptOptions = computed(() => {
  return (promptStore.getEntries || [])
    .filter((p: any) => typeof p.id === 'string' && p.id)
    .map((p: any) => ({
      label: p.title || p.id,
      value: p.id as string
    }));
});

const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' }
];

const taskTypeOptions = [
  { label: 'Event Trigger', value: 'EVENT_TRIGGER' }  
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
  router.push('/outline/events');
};

const getCurrentTimeInTimezone = computed(() => {
  if (!localFormData.timeZone) return '';
  try {
    return `Local Time: ${currentTime.value.toLocaleString('en-GB', {
      timeZone: localFormData.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })}`;
  } catch (error) {
    return 'Invalid timezone';
  }
});

const startClockUpdate = () => {
  if (!clockIntervalId.value) {
    clockIntervalId.value = window.setInterval(() => {
      currentTime.value = new Date();
    }, 1000);
  }
};

const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const createScheduleTask = () => ({
  triggerType: 'PERIODIC',
  type: 'EVENT_TRIGGER',
  target: 'default',
  startTime: 540,
  endTime: 600,
  interval: 60,
  weekdays: []
});

const createEventAction = (): EventAction => {
  const promptType = getPromptTypeForEventType(localFormData.type);
  return {
    promptId: '',
    active: true,
    rank: 0,
    weight: 0.5,
    promptType: promptType
  };
};

// Map UI event types to backend prompt types for filtering prompts.
const getPromptTypeForEventType = (type: string): PromptType | undefined => {
  if (type === 'AD' || type === 'ADVERTISEMENT' || type === 'ADVERTISEMENTS') return PromptType.ADVERTISEMENT;
  if (type === 'REMAINDER' || type === 'REMINDER') return PromptType.REMINDER;
  return undefined;
};

const refreshPromptsForType = async (type: string) => {
  const promptType = getPromptTypeForEventType(type);
  const filter: Record<string, any> = {};
  if (promptType) filter.promptType = promptType;
  try {
    await promptStore.fetchAll(1, 100, filter);
  } catch (error) {
    console.error('Error loading prompts:', error);
  }
};

const loadFormData = () => {
  const current = eventsStore.getCurrent;
  Object.assign(localFormData, current);
  eventActions.value = Array.isArray(current.actions) ? [...current.actions] : [];
  localFormData.actions = eventActions.value;
  previousType.value = localFormData.type || '';
  


  if (localFormData.schedule && localFormData.schedule.tasks && localFormData.schedule.tasks.length > 0) {
    scheduleTasksArray.value = localFormData.schedule.tasks.map(task => {
      const mappedTask: any = {
        triggerType: task.triggerType || 'ONCE',
        type: task.type || '',
        target: task.target || '',
        startTime: 540,
        endTime: 600,
        interval: 60,
        weekdays: []
      };

      // Map ONCE trigger data
      if (task.triggerType === 'ONCE' && task.onceTrigger) {
        mappedTask.timestampValue = task.onceTrigger.timestamp ? new Date(task.onceTrigger.timestamp).getTime() : null;
      }

      // Map PERIODIC trigger data
      if (task.triggerType === 'PERIODIC' && task.periodicTrigger) {
        mappedTask.startTime = timeToMinutes(task.periodicTrigger.startTime) || 540;
        mappedTask.endTime = timeToMinutes(task.periodicTrigger.endTime) || 600;
        mappedTask.interval = task.periodicTrigger.interval || 60;
        mappedTask.weekdays = task.periodicTrigger.weekdays || [];
      }

      return mappedTask;
    });
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

const fetchAclData = async () => {
  const id = route.params.id as string;
  if (!id || id === 'new') {
    aclData.value = [];
    return;
  }

  try {
    aclLoading.value = true;
    const response = await eventsStore.fetchAccessList(id as string);
    aclData.value = (response as any).accessList || [];
  } catch (error: any) {
    console.error('Failed to fetch ACL data:', error);
    message.error(getErrorMessage(error));
    aclData.value = [];
  } finally {
    aclLoading.value = false;
  }
};

const handleSave = async () => {
  try {
    if (!localFormData.brandId) {
      message.error('Brand is required');
      return;
    }

    if (!localFormData.type) {
      message.error('Type is required');
      return;
    }

    // Prepare schedule data with tasks
    const scheduleData = {
      enabled: localFormData.schedule?.enabled || false,
      timeZone: localFormData.timeZone,
      tasks: scheduleTasksArray.value.map(task => {
        if (task.triggerType === 'PERIODIC') {
          return {
            triggerType: 'PERIODIC',
            type: task.type,
            target: task.target,
            periodicTrigger: {
              startTime: formatMinutesToTime(task.startTime),
              endTime: formatMinutesToTime(task.endTime),
              interval: task.interval,
              weekdays: task.weekdays
            }
          };
        } else {
          return {
            triggerType: task.triggerType,
            type: task.type,
            target: task.target,
            onceTrigger: {
              timestamp: task.timestampValue ? new Date(task.timestampValue).toISOString() : null
            }
          };
        }
      })
    };

    // Ensure all actions have promptType set based on event type
    const promptType = getPromptTypeForEventType(localFormData.type);
    const actionsWithPromptType = eventActions.value.map(action => ({
      ...action,
      promptType: promptType || action.promptType
    }));

    const saveData: EventSave = {
      brandId: localFormData.brandId,
      timeZone: localFormData.timeZone,
      type: localFormData.type,
      description: localFormData.description,
      priority: localFormData.priority,
      schedule: scheduleData,
      actions: actionsWithPromptType
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

watch(scheduleTasksArray, (newValue) => {
  if (!localFormData.schedule) {
    localFormData.schedule = { enabled: false, tasks: [] };
  }

  localFormData.schedule.tasks = newValue.map(task => {
    if (task.triggerType === 'PERIODIC') {
      return {
        triggerType: 'PERIODIC',
        periodicTrigger: {
          startTime: formatMinutesToTime(task.startTime),
          endTime: formatMinutesToTime(task.endTime),
          interval: task.interval,
          weekdays: task.weekdays
        }
      };
    } else {
      return {
        triggerType: task.triggerType,
        onceTrigger: {
          timestamp: task.timestampValue ? new Date(task.timestampValue).toISOString() : null
        }
      };
    }
  });
}, { deep: true });

watch(eventActions, (newValue) => {
  localFormData.actions = newValue;
}, { deep: true });

watch(() => localFormData.type, async (newType, oldType) => {
  if (newType === oldType) return;
  if (oldType && newType && oldType !== newType && eventActions.value.length > 0) {
    const confirmed = window.confirm('Changing type will reset actions. Continue?');
    if (!confirmed) {
      localFormData.type = oldType;
      return;
    }
    eventActions.value = [];
    localFormData.actions = [];
  }
  previousType.value = newType || '';
  await refreshPromptsForType(newType || '');
}, { deep: false });

watch(activeTab, (newTab) => {
  if (newTab === 'acl') {
    fetchAclData();
  }
});

onMounted(async () => {
  startClockUpdate();
  const id = route.params.id as string;
  if (id && id !== 'new') {
    try {
      await eventsStore.fetchEvent(id);
      loadFormData();
    } catch (error) {
      console.error('Error loading event:', error);
      message.error('Failed to load event');
    }
  } else {
    try {
      await eventsStore.fetchEvent('new');
      loadFormData();
    } catch (error) {
      console.error('Error loading new event template:', error);
      message.error('Failed to load new event');
    }
  }
  await refreshPromptsForType(localFormData.type || '');
});

</script>
