<template>
  <div class="project-details">
    <h2>Project Details</h2>
    <n-form :model="project" label-width="120px">
      <n-form-item label="Name">
        <n-input v-model="project.name" />
      </n-form-item>
      <n-form-item label="Status">
        <n-select v-model="project.status" :options="statusOptions" />
      </n-form-item>
      <n-form-item>
        <n-button type="primary" @click="saveProject">Save</n-button>
      </n-form-item>
    </n-form>
  </div>
</template>

<script lang="ts">
import {defineComponent, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import axios from 'axios';
import {NButton, NForm, NFormItem, NInput, NSelect} from 'naive-ui';

export default defineComponent({
  name: 'KneoProjectForm',
  components: {
    NForm, NFormItem, NInput, NSelect, NButton
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const project = ref({ id: '', name: '', status: '' });
    const statusOptions = ref([
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' },
      { label: 'Archived', value: 'Archived' }
    ]);

    const fetchProjectDetails = async () => {
      const projectId = route.params.id as string;
      try {
        const response = await axios.get(`http://localhost:38707/kneox/projects/${projectId}`);
        project.value = response.data;
      } catch (error) {
        console.error('Failed to fetch project details', error);
      }
    };

    const saveProject = async () => {
      try {
        await axios.put(`http://localhost:38707/projects/${project.value.id}`, project.value);
        alert('Project saved successfully');
        router.push('/projects_and_tasks/projects'); // Navigate back to the projects list
      } catch (error) {
        console.error('Failed to save project', error);
        alert('Failed to save project');
      }
    };

    onMounted(fetchProjectDetails);

    return {
      project,
      statusOptions,
      saveProject
    };
  }
});
</script>

<style scoped>
.project-details {
  padding: 20px;
}

.project-details h2 {
  margin-bottom: 20px;
}
</style>
