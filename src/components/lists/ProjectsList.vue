<template>
  <n-grid cols="24" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-h2>Projects</n-h2>
    </n-gi>
    <n-gi span="24">
      <n-button-group>
        <n-button @click="handleNewClick" class="mr-2" size="large">New</n-button>
        <n-button @click="handleArchiveClick" size="large">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="24">
      <n-data-table
          :columns="columns"
          :data="projectsStore.getEntries"
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
import {defineComponent, h, onMounted, reactive, ref} from 'vue';
import {NButton, NButtonGroup, NCheckbox, NDataTable, NGi, NGrid, NH2, NPagination, useMessage} from 'naive-ui';
import {useRouter} from 'vue-router';
import {useProjectStore} from '../../stores/projectStore';
import {Project} from "../../types";

export default defineComponent({
  components: {NH2, NDataTable, NPagination, NButtonGroup, NButton, NGi, NGrid},
  setup() {
    const router = useRouter();
    const msgPopup = useMessage();
    const projectsStore = useProjectStore();
    const isMobile = ref(window.innerWidth < 768);
    const pagination = reactive({
      page: 1,
      pageSize: 10,
      pageCount: 1,
      itemCount: 0,
      showSizePicker: true,
      pageSizes: [10, 20, 50]
    });

    onMounted(async () => {
      await projectsStore.fetchProjects(1, 10);
      window.addEventListener('resize', () => {
        isMobile.value = window.innerWidth < 768;
      });
    });

    const columns = [
      {
        title: () => h(NCheckbox, {}),
        key: 'select',
        render: (row: Project) => h(NCheckbox, {
          checked: row.selected,
          onUpdateChecked: (checked) => {
            row.selected = checked;
          }
        })
      },
      {title: 'Name', key: 'name'},
      {title: 'Status', key: 'status'}
    ];

    const handlePageChange = (page: number) => {
      projectsStore.fetchProjects(page, pagination.pageSize);
    };

    const handlePageSizeChange = (pageSize: number) => {
      projectsStore.fetchProjects(pagination.page, pageSize);
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
          const routeTo = {name: 'ProjectForm', params: {id: row.id}};
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
