<template>
  <n-grid cols="24" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-h2>Organizations</n-h2>
    </n-gi>
    <n-gi span="24">
      <n-button-group>
        <n-button @click="handleNewClick" class="mr-2" size="large">New</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="24">
      <n-data-table
          :columns="columns"
          :data="store.getEntries"
          :pagination="store.getPagination"
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
import {defineComponent, h, onMounted, ref} from 'vue';
import {NButton, NButtonGroup, NCheckbox, NDataTable, NGi, NGrid, NH2, NPagination, useMessage} from 'naive-ui';
import {useRouter} from 'vue-router';
import {Project} from "../../types";
import {useOrganizationStore} from "../../stores/of/organizationStore";

export default defineComponent({
  components: {NH2, NDataTable, NPagination, NButtonGroup, NButton, NGi, NGrid},
  setup() {
    const router = useRouter();
    const msgPopup = useMessage();
    const store = useOrganizationStore();
    const isMobile = ref(window.innerWidth < 768);

    onMounted(async () => {
      await store.fetchOrganizations(1, 10);
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
      {title: 'Name', key: 'identifier'},
      {title: 'Registered', key: 'regDate'}
    ];

    const handlePageChange = (page: number) => {
      store.fetchOrganizations(page, store.getPagination.pageSize);
    };

    const handlePageSizeChange = (pageSize: number) => {
      store.fetchOrganizations(store.getPagination.page, pageSize);
    };

    const handleNewClick = () => {
      msgPopup.info('New button clicked');
    };

    const getRowProps = (row: Project) => {
      return {
        onClick: () => {
          const routeTo = {name: 'OrganizationForm', params: {id: row.id}};
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
