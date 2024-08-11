<template>
  <n-grid cols="24" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Projects</template>
        <template #footer>
          Total: {{ store.getPagination.itemCount }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi span="24">
      <n-button-group>
        <n-button @click="handleNewClick" type="primary" size="large">New</n-button>
        <n-button @click="handleArchiveClick" size="large">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="24">
      <n-data-table
          remote
          :columns="columns"
          :data="store.getEntries"
          :pagination="store.getPagination"
          :bordered="false"
          :row-props="getRowProps"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
      />
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {defineComponent, h, onMounted, ref} from 'vue';
import {
  NButton,
  NButtonGroup,
  NCheckbox,
  NDataTable,
  NGi,
  NGrid,
  NH2,
  NPageHeader,
  NPagination,
  useMessage
} from 'naive-ui';
import {useRouter} from 'vue-router';
import {useProjectStore} from '../../../stores/project/projectStore';
import {Project} from "../../../types/projectTypes";

export default defineComponent({
  components: {NPageHeader, NH2, NDataTable, NPagination, NButtonGroup, NButton, NGi, NGrid},
  setup() {
    const router = useRouter();
    const msgPopup = useMessage();
    const store = useProjectStore();
    const isMobile = ref(window.innerWidth < 768);

    onMounted(async () => {
      await store.fetchProjects(1, 10);
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
      {title: 'Status', key: 'status'},
      {title: 'Finish date', key: 'finishDate'},
      {title: 'Author', key: 'author'},
    ];

    const handlePageChange = (page: number) => {
      store.fetchProjects(page, store.getPagination.pageSize);
    };

    const handlePageSizeChange = (pageSize: number) => {
      store.fetchProjects(store.getPagination.page, pageSize);
    };

    const handleNewClick = () => {
      msgPopup.info('New button clicked');
    };

    const handleArchiveClick = () => {
      msgPopup.info('Archive button clicked');
    };

    const getRowProps = (row: Project) => {
      return {
        style: 'cursor: pointer;',
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
      store,
      columns,
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

</style>
