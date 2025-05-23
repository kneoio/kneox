import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient from '../../api/apiClient';
import type { ApiFormResponse, ApiViewPageResponse } from "../../types";
import type { SoundFragment, SoundFragmentSave } from "../../types/kneoBroadcasterTypes";

export const useSoundFragmentStore = defineStore('soundFragmentStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<SoundFragment> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<SoundFragment> | null>(null);
    const genreOptions = ref<Array<{label: string, value: string}>>([]);

    const getEntries = computed(() => apiViewResponse.value?.viewData.entries || []);
    const getCurrent = computed(() => apiFormResponse.value?.docData || {
        id: '',
        slugName: '',
        author: 0,
        regDate: '',
        lastModifier: '',
        lastModifiedDate: '',
        title: '',
        status: 0,
        type: 'SONG',
        source: 'LOCAL_DISC',
        artist: '',
        genre: '',
        album: '',
        url: '',
        actionUrl: '',
        uploadedFiles: [],
    });

    const getPagination = computed(() => {
        if (!apiViewResponse.value) return {
            page: 1,
            pageSize: 10,
            itemCount: 0,
            pageCount: 1,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };

        return {
            page: apiViewResponse.value.viewData.pageNum,
            pageSize: apiViewResponse.value.viewData.pageSize,
            itemCount: apiViewResponse.value.viewData.count,
            pageCount: apiViewResponse.value.viewData.maxPage,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };
    });

    const statusTypeMap = {
        0: 'default',
        100: 'info',
        101: 'warning',
        102: 'success',
        103: 'success',
        104: 'default',
        105: 'error'
    };

    const getTypeOptions = computed(() => [
        { label: "song", value: "SONG" },
        { label: "podcast", value: "PODCAST" },
        { label: "audiobook", value: "AUDIOBOOK" }
    ]);

    const fetchGenres = async () => {
        const response = await apiClient.get('/genres');
        if (!response?.data?.payload) throw new Error('Invalid API response');

        genreOptions.value = response.data.payload.viewData.entries
            .map((entry: any) => ({
                label: entry.identifier,
                value: entry.identifier
            }))
            .sort((a: {label: string}, b: {label: string}) =>
                a.label.localeCompare(b.label));
    };

    const fetchSoundFragments = async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/soundfragments?page=${page}&size=${pageSize}`);
        if (!response?.data?.payload) throw new Error('Invalid API response');
        apiViewResponse.value = response.data.payload;
    };

    const fetchSoundFragment = async (id: string) => {
        const response = await apiClient.get(`/soundfragments/${id}`);
        if (!response?.data?.payload) throw new Error('Invalid API response');
        apiFormResponse.value = response.data.payload;
    };

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/soundfragments/files', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    };

    const updateCurrent = (data: SoundFragment, actions: any = {}) => {
        apiFormResponse.value = { docData: data, actions };
    };

    const save = async (data: SoundFragmentSave, id?: string) => {
        const response = await apiClient.post(`/soundfragments/${id || ''}`, data);
        if (!response?.data?.payload) throw new Error('Invalid API response');
        apiFormResponse.value = response.data.payload;
        return apiFormResponse.value?.docData;
    };

    const downloadFile = async (id: string, fileId: string) => {
        return await apiClient.get(`/soundfragments/files/${id}/${fileId}`, {
            responseType: 'blob'
        });
    };

    fetchGenres();

    return {
        apiViewResponse,
        apiFormResponse,
        getEntries,
        getCurrent,
        getPagination,
        getTypeOptions,
        genreOptions,
        statusTypeMap,
        fetchAll: fetchSoundFragments,
        fetch: fetchSoundFragment,
        save,
        uploadFile,
        updateCurrent,
        downloadFile,
        fetchGenres
    };
});