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
      <n-h2>Organization: {{  }}</n-h2>
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
import {useOrganizationStore} from "../../stores/of/organizationStore";

export default defineComponent({
  name: 'OrganizationForm',
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
    const store = useOrganizationStore();
    const activeTab = ref('properties');

    const handleSaveProject = async () => {
      await store.save();
      router.push('/references/organizations');
    };

    const goBack = () => {
      router.push('/references/organizations');
    };

    onMounted(async () => {
      const id = route.params.id as string;
      await store.fetch(id);
    });

    return {
      store,
      handleSaveProject,
      activeTab,
      goBack,
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
