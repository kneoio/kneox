import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient from '../../api/apiClient';
import type { ApiFormResponse, ApiViewPageResponse } from "../../types";
import type { SoundFragment, SoundFragmentSave } from "../../types/kneoBroadcasterTypes";

export const useSoundFragmentStore = defineStore('soundFragmentStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<SoundFragment> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<SoundFragment> | null>(null);
    const availableApiViewResponse = ref<ApiViewPageResponse<SoundFragment> | null>(null); // New ref for paginated available fragments
    const genreOptions = ref<Array<{label: string, value: string}>>([]);

    const getEntries = computed(() => apiViewResponse.value?.viewData.entries || []);
    // Updated to derive from availableApiViewResponse, assuming API returns ApiViewPageResponse<SoundFragment>
    const getAvailableSoundFragments = computed(() => availableApiViewResponse.value?.viewData.entries || []);
    const getCurrent = computed(() => apiFormResponse.value?.docData || {
        id: '',
        slugName: '',
        author: 0,
        regDate: '',
        lastModifier: '',
        lastModifiedDate: '',
        title: '',
        type: 'SONG',
        source: 'USERS_UPLOAD',
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

    // New pagination computed for available sound fragments
    const getAvailablePagination = computed(() => {
        if (!availableApiViewResponse.value?.viewData) return {
            page: 1,
            pageSize: 10,
            itemCount: 0,
            pageCount: 1,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };

        return {
            page: availableApiViewResponse.value.viewData.pageNum,
            pageSize: availableApiViewResponse.value.viewData.pageSize,
            itemCount: availableApiViewResponse.value.viewData.count,
            pageCount: availableApiViewResponse.value.viewData.maxPage,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };
    });

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
        // Expects flat structure, as it was working before for SoundFragments.vue
        if (!response?.data?.payload) throw new Error('Invalid API response for sound fragments');
        apiViewResponse.value = response.data.payload;
    };

    // Updated to accept pagination parameters and store in availableApiViewResponse
    const fetchAvailableSoundFragments = async (brand: string, page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/soundfragments/available-soundfragments?brand=${brand}&page=${page}&size=${pageSize}`);
        if (!response?.data?.payload?.viewData?.entries) throw new Error('Invalid API response structure for available sound fragments');

        const rawPayload = response.data.payload;
        // Each entry in this response is { id, soundFragmentDTO, playedByBrandCount, lastTimePlayedByBrand }
        // We are primarily interested in soundFragmentDTO for the table display as SoundFragment
        // If playedByBrandCount etc. are needed directly on SoundFragment, the type and mapping would need adjustment.
        const transformedEntries = rawPayload.viewData.entries.map((entry: any) => entry.soundFragmentDTO);

        availableApiViewResponse.value = {
            ...rawPayload,
            viewData: {
                ...rawPayload.viewData,
                entries: transformedEntries,
            },
        };
    };

    const fetchSoundFragment = async (id: string) => {
        const response = await apiClient.get(`/soundfragments/${id}`);
        if (!response?.data?.payload) throw new Error('Invalid API response');
        apiFormResponse.value = response.data.payload;
    };

    const uploadFile = async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/soundfragments/files/' + id, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    };

    const updateCurrent = (data: SoundFragment, actions: any = {}) => {
        apiFormResponse.value = { docData: data, actions };
    };

    const save = async (data: SoundFragmentSave, id: string | null) => {
        const response = await apiClient.post(`/soundfragments/${id || ''}`, data);
        if (!response?.data) throw new Error('Invalid API response');
        apiFormResponse.value = response.data;
        return apiFormResponse.value;
    };

    const downloadFile = async (id: string, fileId: string) => {
        return await apiClient.get(`/soundfragments/files/${id}/${fileId}`, {
            responseType: 'blob'
        });
    };

    const deleteSoundFragment = async (id: string) => {
        await apiClient.delete(`/soundfragments/${id}`);
    };

    fetchGenres();

    return {
        apiViewResponse,
        apiFormResponse,
        availableApiViewResponse, // Expose new response object
        getEntries,
        getAvailableSoundFragments, // Updated computed
        getCurrent,
        getPagination,
        getAvailablePagination, // New computed for available items pagination
        genreOptions,
        fetchAll: fetchSoundFragments,
        fetchAvailable: fetchAvailableSoundFragments, // Alias points to updated function
        fetch: fetchSoundFragment,
        save,
        delete: deleteSoundFragment,
        uploadFile,
        updateCurrent,
        downloadFile,
        fetchGenres
    };
});