<template>
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
  NMenu,
  NPagination,
  useLoadingBar,
  useMessage
} from "naive-ui";
import {useRouter} from 'vue-router';
import IconWrapper from "../IconWrapper.vue";
import {KeycloakInstance} from "keycloak-js";
import {fetchProjects} from "../../apiClient";

interface Project {
  id: string;
  name: string;
  status: string;
  selected?: boolean;
}

export default defineComponent({
  components: { NDataTable, NMenu, NPagination, NButtonGroup, NButton, IconWrapper, NGi, NGrid},
  setup() {
    const kc = inject<KeycloakInstance>('keycloak');
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar()
    const router = useRouter();

    const projects = ref<Project[]>([]);
    const allSelected = ref(false);
    const isMobile = ref(window.innerWidth < 768);


    const apiClient = axios.create({
      baseURL: 'http://localhost:38707/kneox'
    });

    apiClient.interceptors.request.use(async (config) => {
      const token = kc?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    window.addEventListener('resize', () => {
      isMobile.value = window.innerWidth < 768;
    });

    onMounted(() => {
      if (kc) {
        //fetchProjects();
        fetchProjectsData();
        window.addEventListener('resize', () => {
          isMobile.value = window.innerWidth < 768;
        });
      } else {
        msgPopup.error('Keycloak instance is not available');
      }
    });

   /* const fetchProjects = async () => {
      loadingBar.start();
      try {
        const response = await apiClient.get<{ payload: { view_data: { entries: Project[] } } }>('/projects');
        projects.value = response.data.payload.view_data.entries.map((project: Project) => ({
          ...project,
          selected: false
        }));
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
    };*/

    const fetchProjectsData = async () => {
      loadingBar.start();
      try {
        projects.value = await fetchProjects();
        projects.value.forEach((project: Project) => {
          project.selected = false;
        });
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
            onUpdateChecked: (checked: boolean) => {
              row.selected = checked;
            }
          });
        }
      },
      {title: 'Name', key: 'name'},
      {title: 'Status', key: 'status'}
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
          const routeTo = {name: 'KneoProjectForm', params: {id: row.id}};
          console.log('Navigating to:', routeTo);
          router.push({name: 'KneoProjectForm', params: {id: row.id}})
              .catch(err => {
                console.error('Navigation error:', err);
              });
        }
      };
    };


    return {
      inverted: ref(false),
      expandedKeys: ref(['projects']),
      projects,
      pagination,
      columns,
      currentPageData,
      isMobile,
      allSelected,
      handlePageChange,
      handlePageSizeChange,
      handleNewClick,
      handleArchiveClick,
      getRowProps,
    };
  }
});
</script>

<style scoped>

.cursor-pointer:hover {
  cursor: pointer;
}

</style>
