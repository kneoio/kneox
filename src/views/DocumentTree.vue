<template>
  <n-grid :cols="isMobile ? 1 : 6" x-gap="12" y-gap="12" class="p-4">
    <n-gi>
      <n-page-header>
        <template #title>Documents</template>
        <template #footer>
          Total: {{ documentTreeStore.treeData.length }}
        </template>
      </n-page-header>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; margin-top: 12px; overflow-x: auto;">
        <n-button-group>
          <n-button
              type="error"
              :disabled="!hasSelection"
              @click="handleDelete"
              size="large"
          >
            Delete ({{ checkedRowKeys.length }})
          </n-button>
        </n-button-group>
      </div>
    </n-gi>

    <n-gi :span="isMobile ? 1 : 6">
      <n-tree
          :data="documentTreeStore.treeData"
          :expand-on-click="false"
          :selectable="false"
          :checkable="true"
          :checked-keys="checkedRowKeys"
          :on-update:checked-keys="handleCheckChange"
          :node-props="getNodeProps"
          key-field="key"
          label-field="label"
          children-field="children"
          @update:expanded-keys="handleExpand"
      />
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { defineComponent, onMounted, computed, ref } from 'vue';
import { NTree, NGrid, NGi, NPageHeader, NButtonGroup, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';
import { useDocumentTreeStore } from '../stores/kneo/documentTreeStore';
import { useMessage } from 'naive-ui';


export default defineComponent({
  components: {
    NTree,
    NGrid,
    NGi,
    NPageHeader,
    NButtonGroup,
    NButton
  },
  setup() {
    const router = useRouter();
    const documentTreeStore = useDocumentTreeStore();
    const message = useMessage();
    const isMobile = computed(() => window.innerWidth < 768);
    const checkedRowKeys = ref<(string | number)[]>([]);

    const hasSelection = computed(() => {
      return checkedRowKeys.value.length > 0;
    });

    const handleExpand = async (keys: Array<string | number>, option: any[], meta: any) => {
      if (meta.action === 'expand' && meta.node) {
        const node = meta.node;
        if (!node.isLeaf && (!node.children || node.children.length === 0)) {
          await documentTreeStore.loadChildren(node.key, node);
        }
      }
    };

    const getNodeProps = ({ option }: any) => {
      return {
        onClick() {
          if (option.entityId) {
            const routeTo = option.children 
              ? { name: 'ScriptForm', params: { id: option.entityId } }
              : { name: 'SceneForm', params: { id: option.entityId } };
            router.push(routeTo);
          }
        }
      };
    };

    const handleCheckChange = (keys: (string | number)[]) => {
      checkedRowKeys.value = keys;
    };

    const handleDelete = async () => {
      if (checkedRowKeys.value.length === 0) {
        message.warning('Please select items to delete.');
        return;
      }

      try {
        message.success(`${checkedRowKeys.value.length} item(s) deleted successfully.`);
        checkedRowKeys.value = [];
        await documentTreeStore.loadRootNodes();
      } catch (error) {
        console.error('Failed to delete items:', error);
        message.error('Failed to delete items.');
      }
    };

    onMounted(async () => {
      await documentTreeStore.loadRootNodes();
    });

    return {
      documentTreeStore,
      isMobile,
      hasSelection,
      handleExpand,
      getNodeProps,
      handleCheckChange,
      handleDelete,
      checkedRowKeys
    };
  }
});
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
</style>
