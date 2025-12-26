import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../../api/apiClient';

interface TreeNode {
  key: string;
  label: string;
  isLeaf?: boolean;
  children?: TreeNode[];
  openTarget?: string;
  entityId?: string;
  nodeType?: string;
}

export const useDocumentTreeStore = defineStore('documentTreeStore', () => {
  const treeData = ref<TreeNode[]>([]);

  const fetchTreeData = async (parentKey?: string): Promise<TreeNode[]> => {
    try {
      const params = parentKey ? { parentKey } : {};
      const response = await apiClient.get('/scripts/tree', { params });
      
      return response.data.map((item: any) => ({
        key: item.key,
        label: item.label,
        isLeaf: item.leaf,
        openTarget: item.openTarget,
        entityId: item.entityId,
        nodeType: item.nodeType,
        children: item.leaf ? undefined : []
      }));
    } catch (error) {
      console.error('Failed to fetch tree data:', error);
      return [];
    }
  };

  const loadRootNodes = async () => {
    treeData.value = await fetchTreeData();
  };

  const loadChildren = async (parentKey: string, parentNode: TreeNode) => {
    const children = await fetchTreeData(parentKey);
    
    const updateNodeChildren = (nodes: TreeNode[], key: string, newChildren: TreeNode[]): boolean => {
      for (const node of nodes) {
        if (node.key === key) {
          node.children = newChildren;
          return true;
        }
        if (node.children && updateNodeChildren(node.children, key, newChildren)) {
          return true;
        }
      }
      return false;
    };
    
    updateNodeChildren(treeData.value, parentKey, children);
    return children;
  };

  return {
    treeData,
    fetchTreeData,
    loadRootNodes,
    loadChildren
  };
});
