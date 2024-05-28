<template>
  <n-grid cols="1" x-gap="12" y-gap="12" class="project-details">
    <n-gi>
      <n-space>
        <n-button type="default" @click="goBack">
          <n-icon>
            <ArrowBack />
          </n-icon>
          Back
        </n-button>
        <n-button type="primary" @click="handleSaveProject">Save</n-button>
      </n-space>
    </n-gi>
    <n-gi>
      <n-timeline horizontal>
        <n-timeline-item>
          <n-icon>
            <ArrowBack />
          </n-icon>
          <span>Step 1</span>
        </n-timeline-item>
        <n-timeline-item>
          <n-icon>
            <ArrowBack />
          </n-icon>
          <span>Step 2</span>
        </n-timeline-item>
        <n-timeline-item>
          <n-icon>
            <ArrowBack />
          </n-icon>
          <span>Step 3</span>
        </n-timeline-item>
      </n-timeline>
    </n-gi>
    <n-gi>
      <n-h2>Project Details</n-h2>
    </n-gi>
    <n-gi>
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties">
          <n-form :model="projectFields" label-placement="left" label-width="auto">
            <n-grid x-gap="12" y-gap="12">
              <n-gi span="24">
                <n-form-item label="Name" class="short-field">
                  <n-input v-model:value="projectFields.name" style="width: 100%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Status" class="short-field">
                  <n-select v-model="projectFields.status" :options="statusOptions" style="width: 100%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Finish Date" class="short-field">
                  <n-date-picker v-model="projectFields.finishDate" style="width: 100%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Manager" class="short-field">
                  <n-input v-model="projectFields.manager" style="width: 100%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Coder" class="short-field">
                  <n-input v-model="projectFields.coder" style="width: 100%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Tester" class="short-field">
                  <n-input v-model="projectFields.tester" style="width: 100%; max-width: 600px;" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="rls" tab="RLS">
          <n-dynamic-input
              v-model:value="projectFields.rls"
              :key="item => item.reader"
              :on-remove="handleRemoveReader"
          >
            <template #default="{ value, onInput, onRemove }">
              <n-space align="center" style="margin-bottom: 12px;">
                <n-input v-model:value="value.reader" placeholder="Reader" />
                <n-select v-model:value="value.accessLevel" :options="accessLevelOptions" placeholder="Access Level" />
                <n-button type="error" size="small" @click="onRemove">
                  Remove
                </n-button>
              </n-space>
            </template>
          </n-dynamic-input>
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {defineComponent, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useProjectsStore} from '../../stores/projectsStore';
import {
  NButton,
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
import {ArrowBack} from '@vicons/tabler';

export default defineComponent({
  name: 'KneoProjectForm',
  components: {
    NForm, NFormItem, NInput, NSelect, NButton, NDatePicker, NDynamicInput, NIcon, NTabs, NTabPane, NSpace, NGrid, NGi, NH2, NTimeline, NTimelineItem, ArrowBack,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useProjectsStore();
    const activeTab = ref('properties');
    const statusOptions = [
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' },
      { label: 'Archived', value: 'Archived' },
    ];

    const accessLevelOptions = [
      { label: 'Read', value: 'read' },
      { label: 'Full', value: 'full' },
    ];

    const fetchProjectDetails = async () => {
      const projectId = route.params.id as string;
      await store.fetchProject(projectId);
    };

    const handleSaveProject = async () => {
      try {
        await store.saveProject();
        alert('Project saved successfully');
        router.push('/projects_and_tasks/projects');
      } catch (error) {
        console.error('Failed to save project', error);
        alert('Failed to save project');
      }
    };

    const goBack = () => {
      router.back();
    };

    const handleRemoveReader = (index: number) => {
      store.projectFields.rls.splice(index, 1);
    };

    onMounted(fetchProjectDetails);

    // Watch for changes in the projectFields and log them (for debugging purposes)
    watch(() => store.projectFields, (newVal) => {
      console.log("Project Fields Updated:", newVal);
    }, { deep: true });

    return {
      projectFields: store.projectFields,
      statusOptions,
      accessLevelOptions,
      handleSaveProject,
      activeTab,
      goBack,
      handleRemoveReader,
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
  max-width: 600px;
}

.form-field {
  margin-bottom: 16px;
}
</style>

