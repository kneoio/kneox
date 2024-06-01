<template>
  <n-grid cols="1" x-gap="12" y-gap="12" class="project-details">
    <n-gi>
      <n-button-group>
        <n-button type="default" @click="goBack" size="large">
          <n-icon>
            <ArrowBigLeft/>
          </n-icon>
          &nbsp;Back
        </n-button>
        <n-button type="primary" @click="handleSaveProject" size="large">Save</n-button>
      </n-button-group>
    </n-gi>
    <n-gi>
      <n-timeline horizontal>
        <n-timeline-item color="#98FB98"> <!-- Pale Green -->
          <span>Started</span>
        </n-timeline-item>
        <n-timeline-item color="#FFB6C1"> <!-- Pale Red -->
          <span>Current point</span>
        </n-timeline-item>
        <n-timeline-item color="#ADD8E6"> <!-- Pale Blue -->
          <span>Finished</span>
        </n-timeline-item>
      </n-timeline>
    </n-gi>
    <n-gi>
      <n-h2>Project: {{ projectStore.projectFields.name }}</n-h2>
    </n-gi>
    <n-gi>
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid x-gap="12" y-gap="12">
              <n-gi span="24">
                <n-form-item label="Name" class="short-field">
                  <n-input v-model:value="projectStore.projectFields.name" style="width: 100%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Status" class="short-field">
                  <n-select v-model:value="projectStore.projectFields.status" :options="statusOptions"
                            style="width: 100%; max-width: 300px;"/>
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Finish Date" class="short-field">
                  <n-date-picker
                      v-model:formatted-value="projectStore.projectFields.finishDate"
                      value-format="yyyy-MM-dd"
                      clearable
                      style="width: 100%; max-width: 300px;"/>
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Manager" class="short-field">
                  <n-select v-model:value="projectStore.projectFields.manager" :options="employerOptions"
                            style="width: 100%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Coder" class="short-field">
                  <n-select v-model:value="projectStore.projectFields.coder" :options="employerOptions"
                            style="width: 100%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Tester" class="short-field">
                  <n-select v-model:value="projectStore.projectFields.tester" :options="employerOptions"
                            style="width: 100%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="rls" tab="RLS">
          <n-dynamic-input
              v-model:value="projectStore.projectFields.rls"

              :on-remove="handleRemoveReader"
          >
            <template #default="{ value }">
              <n-space align="center" style="margin-bottom: 12px;">
                <n-input v-model:value="value.reader" placeholder="Reader"/>
                <n-select v-model:value="value.accessLevel" :options="accessLevelOptions" placeholder="Access Level"
                          style="width: 150px;"/>
              </n-space>
            </template>
          </n-dynamic-input>
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useProjectStore} from '../../stores/projectStore';
import {
  NButton,
  NButtonGroup,
  NDatePicker,
  NDynamicInput,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NH2,
  NIcon,
  NInput,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
import {ArrowBigLeft} from '@vicons/tabler';
import {useOfficeFrameStore} from "../../stores/officeFrameStore";

export default defineComponent({
  name: 'KneoProjectForm',
  components: {
    NButtonGroup,
    NForm,
    NFormItem,
    NInput,
    NSelect,
    NButton,
    NDatePicker,
    NDynamicInput,
    NIcon,
    NTabs,
    NTabPane,
    NSpace,
    NGrid,
    NGi,
    NH2,
    NTimeline,
    NTimelineItem,
    ArrowBigLeft,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const projectStore = useProjectStore();
    const officeFrameStore = useOfficeFrameStore();
    const activeTab = ref('properties');

    const statusOptions = [
      {label: 'Draft', value: 'DRAFT'},
      {label: 'Completed', value: 'COMPLETED'},
      {label: 'Active', value: 'ACTIVE'},
      {label: 'Merged', value: 'MERGED'},
      {label: 'Paused', value: 'PAUSED'}
    ];

    const accessLevelOptions = [
      {label: 'Read', value: 'read'},
      {label: 'Full', value: 'full'},
    ];

    const handleSaveProject = async () => {
      await projectStore.saveProject();
      router.push('/projects_and_tasks/projects');
    };

    const goBack = () => {
      router.push('/projects_and_tasks/projects');
    };

    const handleRemoveReader = (index: number) => {
      projectStore.projectFields.rls.splice(index, 1);
    };

    onMounted(async () => {
      const projectId = route.params.id as string;
      try {
        await projectStore.fetchProject(projectId);
        await officeFrameStore.fetchEmployers(1, 20);
      } catch {
        // Error handling is done in the store, no need for additional error handling here
      }
    });

    const employerOptions = computed(() => {
      return officeFrameStore.ofPage?.viewData.entries.map((entry) => ({
        label: entry.name,
        value: entry.id,
      })) || [];
    });

    return {
      projectStore,
      statusOptions,
      accessLevelOptions,
      handleSaveProject,
      activeTab,
      goBack,
      handleRemoveReader,
      employerOptions,
    };
  },
});
</script>

<style scoped>
.project-details {
  padding: 20px;
}

.project-details h2 {
  margin-bottom: 20px;
}

.n-button {
  margin-bottom: 20px;
}

.form-section {
  margin-bottom: 20px;
}

.short-field .n-form-item-content {
  max-width: 300px;
  margin-right: 120px;
}

.form-field {
  margin-bottom: 16px;
}
</style>
