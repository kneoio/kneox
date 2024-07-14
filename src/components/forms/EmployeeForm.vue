<template>
  <n-grid cols="1" x-gap="12" y-gap="12" class="m-5">
    <n-gi>
      <n-page-header subtitle="Employee" @back="goBack">
        <template #title>{{ store.getCurrent.identifier }}</template>
        <template #footer>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{ store.getCurrent.lastModifiedDate }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi>
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
      </n-button-group>
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
  NInput, NPageHeader,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
import { ArrowBigLeft } from '@vicons/tabler';

export default defineComponent({
  name: 'KneoProjectForm',
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
    const store = useEmployeeStore();
    const activeTab = ref('properties');

    const handleSaveProject = async () => {
      await store.save();
      router.push('/references/employees');
    };

    const goBack = () => {
      router.push('/references/employees');
    };

    onMounted(async () => {
      const id = route.params.id as string;
      await store.fetchEmployee(id);
    });

    return {
      store,
      handleSave: handleSaveProject,
      activeTab,
      goBack,
      store,
    };
  },
});
</script>

<style scoped>

</style>
