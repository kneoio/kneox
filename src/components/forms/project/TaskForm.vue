<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header subtitle="Task" @back="goBack">
        <template #title> {{ store.getCurrent.regNumber }}</template>
        <template #footer>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{ store.getCurrent.lastModifiedDate }}
        </template>
        <template #extra>
          <n-space style="margin-right: 50px">
            <n-tag :type="store.statusTypeMap[store.getCurrent.status]">
              {{ store.statusTypeMap[store.getCurrent.status] }}
            </n-tag>
          </n-space>
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" disabled @click="handleArchive" size="large">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="6" x-gap="12" y-gap="12" class="m-3">
              <n-gi span="6">
                <n-form-item label="Title">
                  <n-input v-model:value="localFormData.title"
                           placeholder="The task title"
                           style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi span="6">
                <n-form-item label="Project">
                  <n-select
                      v-model:value="localFormData.project.id"
                      :options="projectStore.getOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi span="6">
                <n-form-item label="Assignee">
                  <n-select
                      v-model:value="localFormData.assignee.id"
                      :options="employeeStore.getOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi span="6">
                <n-form-item label="Task type">
                  <n-select
                      v-model:value="localFormData.taskType.identifier"
                      :options="taskTypeStore.getOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi span="6">
                <n-form-item label="Dates">
                  <n-space>
                    <n-date-picker
                        v-model:formatted-value="localFormData.startDate"
                        value-format="dd.MM.yyyy"
                        clearable
                        style="width: 100%; max-width: 300px;"/>
                    <n-date-picker
                        v-model:formatted-value="localFormData.targetDate"
                        value-format="dd.MM.yyyy"
                        clearable
                        style="width: 100%; max-width: 300px;"/>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi span="3">
                <n-form-item label="Priority">
                  <n-slider v-model:value="localFormData.priority"
                            step="mark"
                            :marks="marks"
                            style="width: 100%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi span="6">
                <n-form-item label="Labels">
                  <n-select
                      v-model:value="localFormData.labels"
                      multiple
                      :render-tag="renderTag"
                      :options="labelStore.getOptions"
                      style="width: 50%; max-width: 600px;"
                  />
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
import {defineComponent, h, onMounted, reactive, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {
  NButton,
  NButtonGroup, NDatePicker,
  NDynamicTags,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NPageHeader,
  NSelect,
  NSlider,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  useLoadingBar,
  useMessage,
} from 'naive-ui';
import type {SelectRenderTag} from 'naive-ui'
import {Task, TaskSave} from '../../../types/projectTypes';
import {useTaskStore} from '../../../stores/project/taskStore';
import {useProjectStore} from '../../../stores/project/projectStore';
import {useEmployeeStore} from '../../../stores/of/employeeStore';
import {useTaskTypeStore} from '../../../stores/of/taskTypeStore';
import {useLabelStore} from '../../../stores/of/labelStore';

export default defineComponent({
  name: 'TaskForm',
  components: {
    NDatePicker,
    NPageHeader,
    NButtonGroup,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NTabs,
    NTabPane,
    NGrid,
    NGi,
    NSpace,
    NSelect,
    NTag,
    NSlider,
    NDynamicTags,
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
    const localFormData = reactive<Task>({
      id: '',
      regDate: '',
      lastModifier: '',
      lastModifiedDate: '',
      assignee: {id: '', name: ''},
      startDate: undefined, targetDate: undefined,
      author: '',
      title: '',
      regNumber: '',
      project: {
        id: '',
        name: '',
      },
      status: 0,
      taskType: {identifier: '', name: ''},
      priority: 0,
      labels: [],
      body: ''
    });

    const handleSave = async () => {
      loadingBar.start();
      console.log(localFormData)
      try {
        const saveDTO: TaskSave = {
          title: localFormData.title,
          id: localFormData.id,
          status: localFormData.status,
          priority: localFormData.priority,
          project: {id: localFormData.project.id},
          assignee: {id: localFormData.assignee.id},
          taskType: {identifier: localFormData.taskType.identifier},
          labels: localFormData.labels,
          body: localFormData.body
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
    };

    const goBack = () => {
      router.push('/projects-and-tasks/tasks/by-author');
    };

    const renderTag: SelectRenderTag = ({option, handleClose}) => {
      const backgroundColor = option.color || '#FFFFFF';
      const luminance = getLuminance(backgroundColor);
      const textColor = luminance > 150 ? '#000000' : '#FFFFFF';

      return h(
          NTag,
          {
            closable: true,
            style: {
              backgroundColor: backgroundColor,
              color: textColor
            },
            onClose: (e) => {
              e.stopPropagation();
              handleClose();
            }
          },
          {default: () => option.label}
      );
    };

    function getLuminance(hexColor: string) {
      const rgb = parseInt(hexColor.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return 0.299 * r + 0.587 * g + 0.114 * b;
    }

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
            labelStore.fetchCategoryLabels('software_developing_task'),
          ]);
          Object.assign(localFormData, store.getCurrent);
          loadingBar.finish();
        } catch (error) {
          console.error('Failed to fetch task:', error);
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
      renderTag,
      marks: {
        0: 'low',
        30: 'normal',
        60: 'urgent',
        90: 'critical'
      }
    };
  },
});
</script>

<style scoped>
.cursor-pointer:hover {
  cursor: pointer;
}
</style>
