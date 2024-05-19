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
        :value="selectedMenuKey"
    />
  </n-layout-sider>
  <button class="sidebar-toggle" @click="toggleSidebar" v-show="isMobile">&#9776;</button>
  <n-layout class="layout-content-expand">
    <n-grid cols="24" x-gap="12" y-gap="12" class="p-4">
      <n-gi span="24">
        <n-button-group>
          <n-button @click="handleNewClick" class="mr-2">New</n-button>
          <n-button @click="handleArchiveClick">Archive</n-button>
        </n-button-group>
      </n-gi>
      <n-gi span="24">
        <n-data-table
            :columns="columns"
            :data="currentPageData"
            :pagination="false"
            :bordered="false"
            row-class-name="cursor-pointer"
            :row-props="getRowProps"
        />
      </n-gi>
      <n-gi span="24">
        <n-pagination
            v-model:page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :item-count="projects.length"
            show-size-picker
            :page-sizes="[10, 20, 30, 50]"
            :show-quick-jumper="true"
            :show-total="true"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
        />
      </n-gi>
    </n-grid>
  </n-layout>
</template>

<script lang="ts">
import {computed, defineComponent, h, inject, onMounted, ref} from "vue";
import axios from 'axios';
import {
  DataTableColumns,
  NButton,
  NButtonGroup,
  NCheckbox,
  NDataTable,
  NGi,
  NGrid,
  NLayout,
  NLayoutSider,
  NMenu,
  NPagination,
  useLoadingBar,
  useMessage
} from "naive-ui";
import {ProjectOutlined, UserOutlined} from "@vicons/antd";
import {useRoute, useRouter} from 'vue-router';
import IconWrapper from "./IconWrapper.vue";
import {KeycloakInstance} from "keycloak-js";

interface Project {
  id: string;
  name: string;
  status: string;
  selected?: boolean;
}

export default defineComponent({
  components: { NLayoutSider, NLayout, NDataTable, NMenu, NPagination, NButtonGroup, NButton, IconWrapper, NGi, NGrid },
  setup() {
    const kc = inject<KeycloakInstance>('keycloak');
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar()
    const route = useRoute();
    const router = useRouter();

    const projects = ref<Project[]>([]);
    const allSelected = ref(false);
    const sidebarOpen = ref(false);
    const isMobile = ref(window.innerWidth < 768);
    const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };

    const apiClient = axios.create({
      baseURL: 'http://localhost:38707'
    });

    apiClient.interceptors.request.use(async (config) => {
      const token = kc?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768; });

    onMounted(() => {
      if (kc) {
        fetchProjects();
        window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768; });
      } else {
        msgPopup.error('Keycloak instance is not available');
      }
    });

    const fetchProjects = async () => {
      loadingBar.start();
      try {
        const response = await apiClient.get<{ payload: { view_data: { entries: Project[] } } }>('/projects');
        projects.value = response.data.payload.view_data.entries.map((project: Project) => ({ ...project, selected: false }));
      } catch (error: unknown) {
        loadingBar.error();
        if (error instanceof Error) {
          msgPopup.error(error.message);
        } else {
          msgPopup.error('An unknown error occurred.');
        }
      } finally {
        loadingBar.finish();
      }
    };

    const projectMenuOptions = [
      { label: 'Projects', key: '/projects_and_tasks/projects', icon: () => h('IconWrapper', { icon: ProjectOutlined }) },
      {
        label: 'Tasks', key: '/tasks', icon: () => h('IconWrapper', { icon: ProjectOutlined }),
        children: [
          { label: 'By Author', key: '/projects_and_tasks/projects/by-author', icon: () => h('IconWrapper', { icon: UserOutlined }) },
          { label: 'By project', key: '/projects_and_tasks/projects/by-project', icon: () => h('IconWrapper', { icon: ProjectOutlined }) }
        ]
      }
    ];

    const selectedMenuKey = computed(() => {
      if (route.path.startsWith('/projects_and_tasks/projects')) {
        return '/projects_and_tasks/projects';
      }
      return '';
    });

    const toggleSelectAll = () => {
      allSelected.value = !allSelected.value;
      projects.value.forEach((project: Project) => {
        project.selected = allSelected.value;
      });
    };

    const columns: DataTableColumns<Project> = [
      {
        title: () => h(NCheckbox, {
          checked: allSelected.value,
          onUpdateChecked: toggleSelectAll
        }),
        key: 'select',
        render(row: Project) {
          return h(NCheckbox, {
            checked: row.selected,
            onUpdateChecked: (checked: boolean) => { row.selected = checked; }
          });
        }
      },
      { title: 'Name', key: 'name' },
      { title: 'Status', key: 'status' }
    ];

    const pagination = ref({
      page: 1,
      pageSize: 10,
    });

    const currentPageData = computed(() => {
      const start = (pagination.value.page - 1) * pagination.value.pageSize;
      const end = start + pagination.value.pageSize;
      return projects.value.slice(start, end);
    });

    const handlePageChange = (page: number) => {
      pagination.value.page = page;
    };

    const handlePageSizeChange = (pageSize: number) => {
      pagination.value.pageSize = pageSize;
    };

    const handleNewClick = () => {
      msgPopup.info('New button clicked');
    };

    const handleArchiveClick = () => {
      msgPopup.info('Archive button clicked');
    };

    const getRowProps = (row: Project) => {
      return {
        onClick: () => {
          console.log(row);
          router.push({ name: 'KneoProjectForm', params: { id: row.id } });
        }
      };
    };


    return {
      projectMenuOptions,
      inverted: ref(false),
      expandedKeys: ref(['projects']),
      projects,
      pagination,
      columns,
      currentPageData,
      sidebarOpen,
      toggleSidebar,
      isMobile,
      allSelected,
      handlePageChange,
      handlePageSizeChange,
      handleNewClick,
      handleArchiveClick,
      selectedMenuKey,
      getRowProps,
    };
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

.cursor-pointer:hover {
  cursor: pointer;
}

</style>
