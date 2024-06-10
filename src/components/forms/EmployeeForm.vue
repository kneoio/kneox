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
      <n-h2>Employee: {{  }}</n-h2>
    </n-gi>
    <n-gi>
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid x-gap="12" y-gap="12">


            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="rls" tab="RLS">
        </n-tab-pane>
        <n-tab-pane name="additional" tab="Additional">
          <n-form label-placement="left" label-width="auto">
            <n-grid x-gap="12" y-gap="12">

            </n-grid>
          </n-form>
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEmployeeStore } from '../../stores/of/employeeStore';
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
import { ArrowBigLeft } from '@vicons/tabler';
import { useOfficeFrameStore } from "../../stores/officeFrameStore";

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
    const projectStore = useEmployeeStore();
    const store = useOfficeFrameStore();
    const activeTab = ref('properties');

    const statusOptions = [
      { label: 'Draft', value: 'DRAFT' },
      { label: 'Completed', value: 'COMPLETED' },
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Merged', value: 'MERGED' },
      { label: 'Paused', value: 'PAUSED' }
    ];

    const accessLevelOptions = [
      { label: 'Read', value: 'read' },
      { label: 'Full', value: 'full' },
    ];

    const handleSaveProject = async () => {
      await projectStore.saveProject();
      router.push('/references/employees');
    };

    const goBack = () => {
      router.push('/references/employees');
    };

    const handleRemoveReader = (index: number) => {
      projectStore.projectFields.rls.splice(index, 1);
    };

    onMounted(async () => {
      const projectId = route.params.id as string;
      await projectStore.fetchProject(projectId);
      await store.fetchEmployers(1, 100);
    });

    return {
      store,
      statusOptions,
      accessLevelOptions,
      handleSaveProject,
      activeTab,
      goBack,
      handleRemoveReader,
      store,
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
