<template>
  <n-layout-sider
      bordered
      show-trigger
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :native-scrollbar="false"
      :inverted="inverted"
  >
    <n-menu
        :inverted="inverted"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="projectMenuOptions"
    />
  </n-layout-sider>
  <n-layout class="layout-content-expand">
    <n-data-table
        :columns="columns"
        :data="projects"
        :pagination="pagination"
        :bordered="false"
    />
  </n-layout>
</template>

<script lang="ts">
import {defineComponent, h, onMounted, ref} from "vue";
import axios from 'axios';
import {DataTableColumns, NDataTable, NLayout, NLayoutSider, NMenu, useMessage} from "naive-ui";
import {ProjectOutlined, UserOutlined} from "@vicons/antd";
import IconWrapper from "../helpers/IconWrapper.vue";

interface Project {
  id: number;
  name: string;
  status: string;
}

export default defineComponent({
  components: { NLayoutSider, NLayout, NDataTable, NMenu, IconWrapper },

  setup() {
    const msgPopup = useMessage();
    const projects = ref<Project[]>([]);
    const apiClient = axios.create({
      baseURL: 'https://api.keypractica.com'
    });
    const fetchProjects = async () => {
      try {
        const response = await apiClient.get<Project[]>('/projects/status/ACTIVE');
        projects.value = response.data;
      } catch (error) {
        msgPopup.error('Failed to fetch projects');
        console.error(error);
      }
    };

    onMounted(fetchProjects);


    const projectMenuOptions = [
      {
        label: 'Projects',
        key: 'projects',
        icon: () => h('IconWrapper', { icon: ProjectOutlined }),
      },
      {
        label: 'Tasks',
        key: 'tasks',
        icon: () => h('IconWrapper', { icon: ProjectOutlined }),
        children: [
          {
            label: 'By Author',
            key: 'by-author',
            icon: () => h('IconWrapper', { icon: UserOutlined }),
          },
          {
            label: 'By project',
            key: 'by-project',
            icon: () => h('IconWrapper', { icon: ProjectOutlined }),
          }
        ]
      }
    ];

    const columns: DataTableColumns<Project> = [
      {
        title: 'ID',
        key: 'id'
      },
      {
        title: 'Name',
        key: 'name'
      },
      {
        title: 'Status',
        key: 'status'
      },
    ];

    return {
      projectMenuOptions,
      inverted: ref(false),
      expandedKeys: ref(['projects']),
      projects,
      pagination: false as const,
      columns
    }
  }
})
</script>

<style scoped>

</style>
