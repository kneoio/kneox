<template>
  <n-grid cols="1" x-gap="12" y-gap="12" class="m-5">
    <n-gi>
      <n-page-header subtitle="Task" @back="goBack">
        <template #title> {{ store.getCurrent.regNumber }}</template>
        <template #footer>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{ store.getCurrent.lastModifiedDate }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" disabled @click="handleArchive" size="large">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi>
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Project">
                  <n-select
                      v-model:value="localFormData.project.id"
                      :options="projectStore.getOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Assignee">
                  <n-select
                      v-model:value="localFormData.assignee.id"
                      :options="employeeStore.getOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Task type">
                  <n-select
                      v-model:value="localFormData.taskType.identifier"
                      :options="taskTypeStore.getOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="Labels">
                  <n-input v-model:value="localFormData.body"
                           style="width: 30%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="rls" tab="RLS" class="p-4">
        </n-tab-pane>
        <n-tab-pane name="additional" tab="Additional" class="p-4">
          <n-form label-placement="left" label-width="auto">
            <n-grid x-gap="12" y-gap="12">
              <!-- Additional form items can go here -->
            </n-grid>
          </n-form>
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {defineComponent, onMounted, reactive, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {
  NButton,
  NButtonGroup,
  NDatePicker,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NH2,
  NIcon,
  NInput,
  NInputNumber,
  NPageHeader,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import {ArrowBigLeft} from '@vicons/tabler';
import {Task, TaskSave} from "../../../types/projectTypes";
import {useTaskStore} from "../../../stores/project/taskStore";
import {useProjectStore} from "../../../stores/project/projectStore";
import {useEmployeeStore} from "../../../stores/of/employeeStore";
import {useTaskTypeStore} from "../../../stores/of/taskTypeStore";
import {useLabelStore} from "../../../stores/of/labelStore";

export default defineComponent({
  name: 'TaskForm',
  components: {
    NPageHeader, NButtonGroup, NForm, NDatePicker, NFormItem, NInput, NInputNumber, NButton, NIcon,
    NTabs, NTabPane, NGrid, NGi, NH2, NSpace, ArrowBigLeft, NSelect
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const route = useRoute();
    const router = useRouter();
    const store = useTaskStore();
    const projectStore = useProjectStore();
    const employeeStore = useEmployeeStore();
    const taskTypeStore = useTaskTypeStore();
    const labelStore = useLabelStore();
    const activeTab = ref('properties');
    const departmentOptions = ref([]);
    const localFormData = reactive<Task>({
      labels: [],
      assignee: {id: "", name: ""},
      id: '',
      author: '',
      regDate: '',
      lastModifier: '',
      lastModifiedDate: '',
      regNumber: '',
      project: {
        id: '',
        name: ''
      },
      status: 0, taskType: {identifier: "", name: ""},
      priority: 0,
      body: ''
    });

    const handleSave = async () => {
      loadingBar.start();
      try {
        const saveDTO: TaskSave = {
          labels: [],
          assignee: {id: ""}, taskType: {identifier: ""},
          body: "", priority: 0, project: {id: ""}, status: 0
        };
        await store.save(saveDTO, localFormData.id);
        message.success('Task saved successfully');
        router.push('/projects-and-tasks/tasks/by-author');
      } catch (error) {
        console.error('Failed to save: ', error);
        message.error('Failed to save');
        loadingBar.error();
      } finally {
        loadingBar.finish();
      }
    };

    const handleArchive = async () => {
      message.info('Archive functionality not implemented yet');
    }

    const goBack = () => {
      router.push('/projects-and-tasks/tasks/by-author');
    };


    onMounted(async () => {
      const id = route.params.id as string;
      if (id) {
        loadingBar.start();
        try {
          await Promise.all([
            store.fetch(id),
            projectStore.fetchProjects(),
            employeeStore.fetchEmployees(),
            taskTypeStore.fetchAll(),
            labelStore.fetchAll()
          ]);
          Object.assign(localFormData, store.getCurrent);
          loadingBar.finish();
        } catch (error) {
          console.error('Failed to fetch employee:', error);
          message.error('Failed to fetch');
          loadingBar.error();
        }
      }
    });

    return {
      store,
      projectStore,
      employeeStore,
      taskTypeStore,
      labelStore,
      localFormData,
      handleSave,
      handleArchive,
      activeTab,
      goBack,
      departmentOptions,
    };
  },
});
</script>

<style scoped>
</style>
