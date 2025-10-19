import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../../api/apiClient';
import { ApiViewPageResponse, ApiFormResponse } from '../../types';
import { ScriptScene, ScriptSceneSave } from '../../types/kneoBroadcasterTypes';

export const useScriptSceneStore = defineStore('scriptSceneStore', () => {
  const apiViewResponse = ref<ApiViewPageResponse<ScriptScene> | null>(null);
  const apiFormResponse = ref<ApiFormResponse<ScriptScene> | null>(null);

  const getEntries = computed(() => apiViewResponse.value?.viewData.entries || []);
  const getPagination = computed(() => {
    if (!apiViewResponse.value) {
      return { page: 1, pageSize: 10, itemCount: 0, pageCount: 1, showSizePicker: true, pageSizes: [10, 20, 30, 40] };
    }
    const { viewData } = apiViewResponse.value;
    return {
      page: viewData.pageNum,
      pageSize: viewData.pageSize,
      itemCount: viewData.count,
      pageCount: viewData.maxPage,
      showSizePicker: true,
      pageSizes: [10, 20, 30, 40]
    };
  });

  const fetchForScript = async (scriptId: string, page = 1, size = 10) => {
    const res = await apiClient.get(`/scripts/${scriptId}/scenes?page=${page}&size=${size}`);
    if (res?.data?.payload) {
      apiViewResponse.value = res.data.payload;
    } else {
      throw new Error('Invalid API response structure');
    }
  };

  const fetch = async (id: string) => {
    const res = await apiClient.get(`/scenes/${id}`);
    if (res?.data?.payload) {
      apiFormResponse.value = res.data.payload;
    } else {
      throw new Error('Invalid API response structure');
    }
  };

  const upsertForScript = async (scriptId: string, data: ScriptSceneSave) => {
    const res = await apiClient.post(`/scripts/${scriptId}/scenes`, data);
    if (res?.data) {
      return res.data.docData as ScriptScene;
    }
    throw new Error('Invalid API response structure');
  };

  const upsert = async (id: string, data: ScriptSceneSave) => {
    const res = await apiClient.post(`/scenes/${id}`, data);
    if (res?.data) {
      return res.data.docData as ScriptScene;
    }
    throw new Error('Invalid API response structure');
  };

  const remove = async (id: string) => {
    await apiClient.delete(`/scenes/${id}`);
  };

  return {
    apiViewResponse,
    apiFormResponse,
    getEntries,
    getPagination,
    fetchForScript,
    fetch,
    upsertForScript,
    upsert,
    remove,
  };
});
