import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient, { setupApiClient } from '../../api/apiClient';
import { ApiFormResponse, ApiViewPageResponse } from "../../types";
import { Draft, DraftSave } from "../../types/kneoBroadcasterTypes";

interface DraftFilterDTO {
  languageCode?: string;
  archived?: number;
  enabled?: boolean;
  master?: boolean;
  locked?: boolean;
  activated?: boolean;
}

function buildDraftsUrl(basePath: string, { page = 1, size = 10, filter }: { page?: number; size?: number; filter?: DraftFilterDTO } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (filter && Object.keys(filter).length > 0) {
    params.set('filter', encodeURIComponent(JSON.stringify(filter)));
  }
  return `${basePath}?${params.toString()}`;
}

export const useDraftStore = defineStore('draftStore', () => {
  const apiViewResponse = ref<ApiViewPageResponse<Draft> | null>(null);
  const apiFormResponse = ref<ApiFormResponse<Draft> | null>(null);
  const draftTypeOptions = ref<Array<{ label: string; value: string }>>([
    { label: 'INTRO_DRAFT', value: 'INTRO_DRAFT' },
    { label: 'MESSAGE_DRAFT', value: 'MESSAGE_DRAFT' },
    { label: 'NEWS_INTRO_DRAFT', value: 'NEWS_INTRO_DRAFT' }
  ]);

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

  const fetchAll = async (page = 1, pageSize = 10, filters: DraftFilterDTO = {}) => {
    const url = buildDraftsUrl('/drafts', {
      page,
      size: pageSize,
      filter: filters && Object.keys(filters).length ? filters : undefined
    });
    const response = await apiClient.get(url, {});
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
    draftTypeOptions,
  };
});
