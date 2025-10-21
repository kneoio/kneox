import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient, { setupApiClient } from '../../api/apiClient';
import { ApiFormResponse, ApiViewPageResponse } from "../../types";
import { BroadcastPrompt, BroadcastPromptSave } from "../../types/kneoBroadcasterTypes";

export const usePromptStore = defineStore('promptStore', () => {
  const apiViewResponse = ref<ApiViewPageResponse<BroadcastPrompt> | null>(null);
  const apiFormResponse = ref<ApiFormResponse<BroadcastPrompt> | null>(null);

  const getEntries = computed(() => apiViewResponse.value?.viewData.entries || []);

  const getCurrent = computed(() => {
    const def = {
      id: '',
      author: '',
      regDate: '',
      lastModifier: '',
      lastModifiedDate: '',
      enabled: false,
      prompt: '',
      promptType: '',
      languageCode: '',
      isMaster: false,
      locked: false
    } as BroadcastPrompt;
    return apiFormResponse.value?.docData || def;
  });

  const getPagination = computed(() => {
    if (!apiViewResponse.value) {
      return {
        page: 1,
        pageSize: 10,
        itemCount: 0,
        pageCount: 1,
        showSizePicker: true,
        pageSizes: [10, 20, 30, 40]
      };
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

  const fetchAll = async (page = 1, pageSize = 10) => {
    const response = await apiClient.get(`/prompts?page=${page}&size=${pageSize}`, {});
    if (response?.data?.payload) apiViewResponse.value = response.data.payload;
    else throw new Error('Invalid API response structure');
  };

  const fetch = async (id: string) => {
    const response = await apiClient.get(`/prompts/${id}`);
    if (response?.data?.payload) apiFormResponse.value = response.data.payload;
    else throw new Error('Invalid API response structure');
  };

  const updateCurrent = (data: BroadcastPrompt, actions: any = {}) => {
    apiFormResponse.value = { docData: data, actions };
  };

  const save = async (data: BroadcastPromptSave, id: string | null) => {
    const response = await apiClient.post(`/prompts/${id || ''}`, data);
    if (response?.data) {
      const { docData } = response.data;
      updateCurrent(docData, {});
      return docData;
    }
    throw new Error('Invalid API response structure');
  };

  const deletePrompt = async (id: string) => {
    await apiClient.delete(`/prompts/${id}`);
  };

  const fetchAccessList = async (id: string) => {
    const response = await apiClient.get(`/prompts/${id}/access`);
    if (!response?.data) throw new Error('Invalid API response');
    return response.data;
  };

  return {
    apiViewResponse,
    apiFormResponse,
    setupApiClient,
    fetchAll,
    fetch,
    save,
    deletePrompt,
    fetchAccessList,
    getEntries,
    getPagination,
    getCurrent,
  };
});
