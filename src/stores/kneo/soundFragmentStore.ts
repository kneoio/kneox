import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient from '../../api/apiClient';
import type { ApiFormResponse, ApiViewPageResponse } from "../../types";
import type { SoundFragment, SoundFragmentSave } from "../../types/kneoBroadcasterTypes";
import {downloadSoundFragmentWithProgress } from "../../utils/downloadService"

export const useSoundFragmentStore = defineStore('soundFragmentStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<SoundFragment> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<SoundFragment> | null>(null);
    const availableApiViewResponse = ref<ApiViewPageResponse<SoundFragment> | null>(null);
    const genreOptions = ref<Array<{label: string, value: string}>>([]);

    const getEntries = computed(() => apiViewResponse.value?.viewData.entries || []);
    const getAvailableSoundFragments = computed(() => availableApiViewResponse.value?.viewData.entries || []);
    const getCurrent = computed(() => apiFormResponse.value?.docData || {
        id: '',
        slugName: '',
        author: '',
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
        if (!response?.data?.payload) throw new Error('Invalid API response for sound fragments');
        apiViewResponse.value = response.data.payload;
    };

    const fetchAvailableSoundFragments = async (brand: string, page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/soundfragments/available-soundfragments?brand=${brand}&page=${page}&size=${pageSize}`);
        if (!response?.data?.payload?.viewData?.entries) throw new Error('Invalid API response structure for available sound fragments');

        const rawPayload = response.data.payload;
        const transformedEntries = rawPayload.viewData.entries.map((entry: any) => entry.soundfragment);

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

    const uploadFile = async (id: string, file: File, onProgress?: (percentage: number) => void) => {
        const maxSizeBytes = 100 * 1024 * 1024; // 100MB

        if (file.size > maxSizeBytes) {
            throw new Error(`File too large. Maximum size is ${maxSizeBytes / 1024 / 1024}MB`);
        }

        const formData = new FormData();
        formData.append('file', file);

        // Start upload and get uploadId
        const response = await apiClient.post('/soundfragments/files/' + id, formData, {
            timeout: 600000, // 10 minutes
            maxContentLength: 120 * 1024 * 1024,
            maxBodyLength: 120 * 1024 * 1024,
        });

        const uploadData = response.data;
        const uploadId = uploadData.id;

        // Start polling for progress if we have an uploadId and callback
        if (uploadId && onProgress) {
            pollUploadProgress(uploadId, onProgress);
        }

        return uploadData;
    };

    const pollUploadProgress = async (uploadId: string, onProgress: (percentage: number) => void) => {
        const pollInterval = setInterval(async () => {
            try {
                const progressResponse = await apiClient.get(`/soundfragments/upload-progress/${uploadId}`);
                const progress = progressResponse.data;

                // Update progress
                onProgress(progress.percentage);

                // Stop polling when completed or failed
                if (progress.status === 'completed' || progress.status === 'failed') {
                    clearInterval(pollInterval);

                    if (progress.status === 'failed') {
                        throw new Error(progress.errorMessage || 'Upload failed');
                    }
                }
            } catch (error) {
                clearInterval(pollInterval);
                console.error('Progress polling failed:', error);
            }
        }, 1000); // Poll every second
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

    const downloadFileWithProgress = async (id: string, fileId: string, fileName?: string, onProgress?: (percentage: number) => void) => {
        return await downloadSoundFragmentWithProgress(id, fileId, fileName, onProgress);
    };

    const deleteSoundFragment = async (id: string) => {
        await apiClient.delete(`/soundfragments/${id}`);
    };

    fetchGenres();

    return {
        apiViewResponse,
        apiFormResponse,
        availableApiViewResponse,
        getEntries,
        getAvailableSoundFragments,
        getCurrent,
        getPagination,
        getAvailablePagination,
        genreOptions,
        fetchAll: fetchSoundFragments,
        fetchAvailable: fetchAvailableSoundFragments,
        fetch: fetchSoundFragment,
        save,
        delete: deleteSoundFragment,
        uploadFile,
        updateCurrent,
        downloadFile,
        downloadFileWithProgress,
        fetchGenres
    };
});