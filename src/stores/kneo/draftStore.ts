import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient, { setupApiClient } from '../../api/apiClient';
import { ApiFormResponse, ApiViewPageResponse } from "../../types";
import { Draft, DraftSave } from "../../types/kneoBroadcasterTypes";

export const useDraftStore = defineStore('draftStore', () => {
  const apiViewResponse = ref<ApiViewPageResponse<Draft> | null>(null);
  const apiFormResponse = ref<ApiFormResponse<Draft> | null>(null);

  const getEntries = computed(() => apiViewResponse.value?.viewData.entries || []);

  const getCurrent = computed(() => {
    const def = {
      id: '',
      author: '',
      regDate: '',
      lastModifier: '',
      lastModifiedDate: '',
      title: '',
      content: '',
      draftType: '',
      languageCode: '',
      archived: 0
    } as Draft;
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
    const response = await apiClient.get(`/drafts?page=${page}&size=${pageSize}`, {});
    if (response?.data?.payload) apiViewResponse.value = response.data.payload;
    else throw new Error('Invalid API response structure');
  };

  const fetch = async (id: string) => {
    const response = await apiClient.get(`/drafts/${id}`);
    if (response?.data?.payload) apiFormResponse.value = response.data.payload;
    else throw new Error('Invalid API response structure');
  };

  const updateCurrent = (data: Draft, actions: any = {}) => {
    apiFormResponse.value = { docData: data, actions };
  };

  const save = async (data: DraftSave, id: string | null) => {
    const response = await apiClient.post(`/drafts/${id || ''}`, data);
    if (response?.data) {
      const { docData } = response.data;
      updateCurrent(docData, {});
      return docData;
    }
    throw new Error('Invalid API response structure');
  };

  const deleteDraft = async (id: string) => {
    await apiClient.delete(`/drafts/${id}`);
  };

  const fetchAccessList = async (id: string) => {
    const response = await apiClient.get(`/drafts/${id}/access`);
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
    deleteDraft,
    fetchAccessList,
    getEntries,
    getPagination,
    getCurrent,
  };
});
