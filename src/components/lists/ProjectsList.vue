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
          :data="projectsStore.projectsPage?.viewData.entries"
          :pagination="pagination"
          :bordered="false"
          row-class-name="cursor-pointer"
          :row-props="getRowProps"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
      />
    </n-gi>

  </n-grid>
</template>

<script lang="ts">
import {defineComponent, h, inject, onMounted, reactive, ref} from 'vue';
import {NButton, NButtonGroup, NCheckbox, NDataTable, NGi, NGrid, NPagination, useMessage} from 'naive-ui';
import {useRouter} from 'vue-router';
import {useProjectsStore} from '../../store/projectsStore';
import {KeycloakInstance} from 'keycloak-js';
import {Project} from "../../types";

export default defineComponent({
  components: { NDataTable, NPagination, NButtonGroup, NButton, NGi, NGrid },
  setup() {
    const msgPopup = useMessage();
    const router = useRouter();
    const kc = inject<KeycloakInstance>('keycloak');
    const projectsStore = useProjectsStore();
    const isMobile = ref(window.innerWidth < 768);
    const pagination = reactive({
      page: 1,
      pageSize: 10,
      pageCount: 1,
      itemCount: 0,
      showSizePicker: true,
      pageSizes: [10, 20, 50]
    });

    onMounted(() => {
      if (kc && kc.token) {
        projectsStore.setupApiClient(kc.token);
        projectsStore.fetchProjects(1, 10, pagination);
      } else {
        msgPopup.error('Keycloak instance is not available or token is missing');
      }

      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    const columns = [
      {
        title: () => h(NCheckbox, {

        }),
        key: 'select',
        render: (row: Project) => h(NCheckbox, {
          checked: row.selected,
          onUpdateChecked: (checked) => {
            row.selected = checked;
          }
        })
      },
      { title: 'Name', key: 'name' },
      { title: 'Status', key: 'status' }
    ];

    const handlePageChange = (page: number) => {
      projectsStore.fetchProjects(page, pagination.pageSize, pagination);
    };

    const handlePageSizeChange = (pageSize: number) => {
      projectsStore.fetchProjects(pagination.page, pageSize, pagination);

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
          const routeTo = { name: 'KneoProjectForm', params: { id: row.id } };
          console.log('Navigating to:', routeTo);
          router.push(routeTo).catch(err => {
            console.error('Navigation error:', err);
          });
        }
      };
    };

    return {
      projectsStore,
      columns,
      pagination,
      isMobile,
      handlePageChange,
      handlePageSizeChange,
      handleNewClick,
      handleArchiveClick,
      getRowProps
    };
  }
});
</script>

<style scoped>
.cursor-pointer:hover {
  cursor: pointer;
}
</style>
