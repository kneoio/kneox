<template>
  <div class="m-3">
    <n-data-table
      :columns="aclColumns"
      :data="aclData"
      :loading="loading"
      :bordered="false"
      :single-line="false"
      size="small"
      style="max-width: 800px;"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { NDataTable, NIcon } from 'naive-ui';
import { Ghost } from '@vicons/tabler';
import { h } from 'vue';

export default defineComponent({
  name: 'AclTable',
  components: {
    NDataTable,
    NIcon,
  },
  props: {
    aclData: {
      type: Array,
      required: true,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const aclColumns = computed(() => [
      {
        title: 'User ID',
        key: 'userId',
        width: 100
      },
      {
        title: 'User Name',
        key: 'userLogin',
        width: 150
      },
      {
        title: 'Can Edit',
        key: 'canEdit',
        width: 100,
        render: (row: any) => row.canEdit ? 'Yes' : 'No'
      },
      {
        title: 'Can Delete',
        key: 'canDelete',
        width: 100,
        render: (row: any) => row.canDelete ? 'Yes' : 'No'
      },
      {
        title: 'Is Supervisor',
        key: 'isSu',
        width: 120,
        render: (row: any) => row.isSu ? h(NIcon, { size: 18 }, { default: () => h(Ghost) }) : ''
      }
    ]);

    return {
      aclColumns
    };
  }
});
</script>
