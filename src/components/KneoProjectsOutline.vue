<template>
  <n-layout-sider
      bordered
      v-show="sidebarOpen || !isMobile"
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
  <button class="sidebar-toggle" @click="toggleSidebar" v-show="isMobile">&#9776;</button>
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
import {defineComponent, h, inject, onMounted, ref} from "vue";
import axios from 'axios';
import {DataTableColumns, NDataTable, NLayout, NLayoutSider, NMenu, useMessage} from "naive-ui";
import {ProjectOutlined, UserOutlined} from "@vicons/antd";
import IconWrapper from "./IconWrapper.vue";
import {KeycloakInstance} from "keycloak-js";

interface Project {
  id: number;
  name: string;
  status: string;
}

export default defineComponent({
  components: { NLayoutSider, NLayout, NDataTable, NMenu, IconWrapper },
  setup() {
    const kc = inject<KeycloakInstance>('keycloak');
    const msgPopup = useMessage();
    const projects = ref<Project[]>([]);
    const sidebarOpen = ref(false);
    const isMobile = ref(window.innerWidth < 768);
    const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };

    const apiClient = axios.create({
      baseURL: 'https://api.keypractica.com'
    });

    apiClient.interceptors.request.use(async (config) => {
      const token = kc?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768; });

    const fetchProjects = async () => {
      try {
        const response = await apiClient.get<Project[]>('/projects/status/ACTIVE');
        projects.value = response.data;
      } catch (error) {
        msgPopup.error('Failed to fetch projects');
        console.error(error);
      }
    };

    onMounted(() => {
      if (kc) {
        fetchProjects();
        window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768; });
      } else {
        msgPopup.error('Keycloak instance is not available');
      }
    });

    const projectMenuOptions = [
      { label: 'Projects', key: 'projects', icon: () => h('IconWrapper', { icon: ProjectOutlined }) },
      {
        label: 'Tasks', key: 'tasks', icon: () => h('IconWrapper', { icon: ProjectOutlined }),
        children: [
          { label: 'By Author', key: 'by-author', icon: () => h('IconWrapper', { icon: UserOutlined }) },
          { label: 'By project', key: 'by-project', icon: () => h('IconWrapper', { icon: ProjectOutlined }) }
        ]
      }
    ];

    const columns: DataTableColumns<Project> = [
      { title: 'ID', key: 'id' },
      { title: 'Name', key: 'name' },
      { title: 'Status', key: 'status' }
    ];

    return {
      projectMenuOptions,
      inverted: ref(false),
      expandedKeys: ref(['tasks']),
      projects,
      pagination: false as const,
      columns,
      sidebarOpen,
      toggleSidebar,
      isMobile
    }
  }
});
</script>

<style scoped>
.sidebar-toggle {
  display: none;
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}

@media (max-width: 768px) {
  .sidebar-toggle {
    display: block; /* Show toggle button on small screens */
  }

  n-layout-sider {
    display: none; /* Hide sidebar by default on small screens */
  }
}
</style>
