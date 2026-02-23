import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../../api/apiClient';
import { ApiViewPageResponse, ApiFormResponse } from '../../types';
import { ScriptScene, ScriptSceneSave, SceneTimingMode } from '../../types/kneoBroadcasterTypes';

interface SceneFilterDTO {
  activated?: boolean;
  timingMode?: SceneTimingMode | string;
}

function normalizeFilter(filter?: SceneFilterDTO | string) {
  if (!filter) return undefined;
  if (typeof filter === 'string') {
    let val = filter;
    if (val.startsWith('%')) {
      try {
        val = decodeURIComponent(val);
      } catch {
      }
    }
    return val;
  }
  return JSON.stringify(filter);
}

function buildScenesUrl(basePath: string, { page = 1, size = 10, filter }: { page?: number; size?: number; filter?: SceneFilterDTO | string } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  const normalized = normalizeFilter(filter);
  if (normalized && normalized !== '{}') {
    params.set('filter', normalized);
  }
  return `${basePath}?${params.toString()}`;
}

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

  const fetchAll = async (page = 1, size = 10, filters: SceneFilterDTO = {}) => {
    const url = buildScenesUrl('/scenes', {
      page,
      size,
      filter: filters && Object.keys(filters).length ? filters : undefined
    });
    const res = await apiClient.get(url);
    const payload = res?.data?.payload?.payload || res?.data?.payload;
    if (payload) {
      apiViewResponse.value = payload as ApiViewPageResponse<ScriptScene>;
    } else {
      throw new Error('Invalid API response structure');
    }
  };

  const fetchForScript = async (scriptId: string, page = 1, size = 10) => {
    const res = await apiClient.get(`/scripts/${scriptId}/scenes?page=${page}&size=${size}`);
    const payload = res?.data?.payload?.payload || res?.data?.payload;
    if (payload) {
      apiViewResponse.value = payload;
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
    fetchAll,
    fetchForScript,
    fetch,
    upsertForScript,
    upsert,
    remove,
  };
});