<template>
  <n-grid cols="1" x-gap="12" y-gap="12" class="m-5">
    <n-gi>
      <n-page-header subtitle="Project" @back="goBack">
        <template #title>{{ store.getCurrent.name }}</template>
        <template #footer>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{ store.getCurrent.lastModifiedDate }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi>
      <n-button-group>
        <n-button type="primary" @click="handleSaveProject" size="large">Save</n-button>
      </n-button-group>
    </n-gi>
    <n-gi>

    </n-gi>
    <n-gi>
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid x-gap="12" y-gap="12">
              <n-gi span="24">
                <n-form-item label="Name">
                  <n-input v-model:value="localData.name" style="width: 100%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Status">
                  <n-select v-model:value="localData.status" :options="statusOptions"
                            style="width: 100%; max-width: 300px;"/>
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Finish Date">
                  <n-date-picker
                      v-model:formatted-value="localData.finishDate"
                      value-format="yyyy-MM-dd"
                      clearable
                      style="width: 100%; max-width: 300px;"/>
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Manager">
                  <!--                  <n-select v-model:value="localData.manager.name" :options="officeFrameStore.ts.employeeOptions"
                                              style="width: 100%; max-width: 600px;"/>-->
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Coder">
                  <!--                  <n-select v-model:value="projectStore.projectFields.coder.id" :options="officeFrameStore.ts.employeeOptions"
                                              style="width: 100%; max-width: 600px;"/>-->
                </n-form-item>
              </n-gi>
              <n-gi span="24">
                <n-form-item label="Tester">
                  <!--                  <n-select v-model:value="projectStore.projectFields.tester.id" :options="employeeStore.employeeOptions"
                                              style="width: 100%; max-width: 600px;"/>-->
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="rls" tab="RLS">
          <n-dynamic-input
              v-model:value="localData.rls"
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
import {defineComponent, ref, onMounted, reactive} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useProjectStore} from '../../../stores/project/projectStore';
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
  NInput, NPageHeader,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
import {ArrowBigLeft} from '@vicons/tabler';
import {useEmployeeStore} from "../../../stores/of/employeeStore";
import {Project} from "../../../types/projectTypes";

export default defineComponent({
  name: 'ProjectForm',
  components: {
    NPageHeader,
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
    const store = useProjectStore();
    const employeeStore = useEmployeeStore();
    const activeTab = ref('properties');
    const localData = reactive<Project>({
      author: undefined, lastModifier: undefined,
      id: '',
      status: '',
      name: '',
      finishDate: undefined,
      manager: '',
      coder: '',
      tester: '',
      rls: []
    });

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
      await store.saveProject();
      router.push('/projects-and-tasks/projects');
    };

    const goBack = () => {
      router.push('/projects-and-tasks/projects');
    };

    const handleRemoveReader = (index: number) => {

    };

    onMounted(async () => {
      const projectId = route.params.id as string;
      await store.fetchProject(projectId);
      Object.assign(localData, store.getCurrent);

    });

    return {
      store,
      localData,
      employeeStore,
      statusOptions,
      accessLevelOptions,
      handleSaveProject,
      activeTab,
      goBack,
      handleRemoveReader
    };
  }
});
</script>

<style scoped>

</style>
