<template>
  <n-grid cols="1" x-gap="12" y-gap="12" class="m-5">
    <n-gi>
      <n-page-header subtitle="Task" @back="goBack">
        <template #title>{{ store.getCurrent.id }}</template>
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
                      v-model:value="localFormData.id"
                      :options="organizationStore.getOptionsOfPrimaries"
                      style="width: 50%; max-width: 600px;"
                      @update:value="handleOrganizationChange"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Assignee">
                  <n-select
                      v-model:value="localFormData.id"
                      :options="departmentStore.getDepOptionsOf"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Tester">
                  <n-select
                      v-model:value="localFormData.id"
                      :options="positionStore.getOptions"
                      style="width: 50%; max-width: 600px;"
                  />
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="Identifier">
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
import {usePositionStore} from "../../../stores/of/positionStore";
import {useOrganizationStore} from "../../../stores/of/organizationStore";
import {useDepartmentStore} from "../../../stores/of/departmentStore";
import {Task, TaskSave} from "../../../types/projectTypes";
import {useTaskStore} from "../../../stores/project/taskStore";

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
    const organizationStore = useOrganizationStore();
    const departmentStore = useDepartmentStore();
    const positionStore = usePositionStore();
    const activeTab = ref('properties');
    const departmentOptions = ref([]);
    const localFormData = reactive<Task>({
      id: '',
      author: '',
      regDate: '',
      lastModifier: '',
      lastModifiedDate: '',
      body: ''
    });

    const handleSave = async () => {
      loadingBar.start();
      try {
        const saveDTO: TaskSave = {
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

    const handleOrganizationChange = async (organizationId: string) => {
      try {
        await departmentStore.fetchDepartmentsOf(organizationId);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        message.error('Failed to fetch departments');
      }
    };

    onMounted(async () => {
      const id = route.params.id as string;
      if (id) {
        loadingBar.start();
        try {
          await Promise.all([
            store.fetch(id)
          ]);
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
      positionStore,
      organizationStore,
      departmentStore,
      localFormData,
      handleSave,
      handleArchive,
      activeTab,
      goBack,
      handleOrganizationChange,
      departmentOptions,
    };
  },
});
</script>

<style scoped>
</style>
