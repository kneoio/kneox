import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient from '../../api/apiClient';
import type { AxiosProgressEvent } from 'axios';
import type { ApiFormResponse, ApiViewPageResponse } from "../../types";
import type { SoundFragment, SoundFragmentSave } from "../../types/kneoBroadcasterTypes";
// Local DTOs for filter usage
type SourceType = 'USER' | 'SYSTEM';
type PlaylistItemType = 'MUSIC' | 'AD' | 'JINGLE';

interface SoundFragmentFilterDTO {
    genres?: string[];
    sources?: SourceType[];
    types?: PlaylistItemType[];
    activated?: boolean;
}

function buildSoundFragmentsUrl(basePath: string, { page = 1, size = 10, q, filter }: { page?: number; size?: number; q?: string; filter?: SoundFragmentFilterDTO } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    if (q) params.set('q', q);
    if (filter && Object.keys(filter).length > 0) {
        params.set('filter', encodeURIComponent(JSON.stringify(filter)));
    }
    return `${basePath}?${params.toString()}`;
}

export const useSoundFragmentStore = defineStore('soundFragmentStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<SoundFragment> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<SoundFragment> | null>(null);
    const availableApiViewResponse = ref<ApiViewPageResponse<SoundFragment> | null>(null);
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
        source: 'USER_UPLOAD',
        artist: '',
        genres: [],
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

    const fetchSoundFragments = async (page = 1, pageSize = 10, searchQuery = '', filters: SoundFragmentFilterDTO = {}) => {
        const baseUrl = searchQuery ? '/soundfragments/search' : '/soundfragments';
        const url = buildSoundFragmentsUrl(baseUrl, {
            page,
            size: pageSize,
            q: searchQuery || undefined,
            filter: filters && Object.keys(filters).length ? filters : undefined
        });
        const response = await apiClient.get(url);
        if (!response?.data?.payload) throw new Error('Invalid API response for sound fragments');
        apiViewResponse.value = response.data.payload;
    };

    const fetchAvailableSoundFragments = async (brandName: string,  page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/soundfragments/available-soundfragments?page=${page}&size=${pageSize}&brand=${brandName}`);
        if (!response?.data?.payload?.viewData?.entries) throw new Error('Invalid API response structure for available sound fragments');

        const rawPayload = response.data.payload;

        availableApiViewResponse.value = {
            ...rawPayload,
            viewData: {
                ...rawPayload.viewData,
                entries: rawPayload.viewData.entries,
            },
        };
    };

    const fetchSoundFragment = async (id: string) => {
        const response = await apiClient.get(`/soundfragments/${id}`);
        if (!response?.data?.payload) throw new Error('Invalid API response');
        apiFormResponse.value = response.data.payload;
    };

    const startUploadSession = async (id: string, uploadId: string, startTime: number) => {
        try {
            const response = await apiClient.post(`/soundfragments/files/${id}/start?uploadId=${uploadId}&startTime=${startTime}`);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                switch (status) {
                    case 400:
                        const message = typeof errorData === 'string' ? errorData :
                            (errorData?.error?.message || errorData?.message || 'Invalid upload session request');
                        throw new Error(message);
                    case 403:
                        throw new Error('You do not have permission to upload files');
                    case 500:
                        throw new Error('Server error occurred. Please try again.');
                    default:
                        throw new Error(`Upload session failed: ${errorData?.error?.message || errorData?.message || `HTTP ${status}`}`);
                }
            } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                throw new Error('Request timeout. Please try again.');
            } else if (error.message.includes('Network Error')) {
                throw new Error('Network error. Please check your connection and try again.');
                throw new Error(`Upload session failed: ${error.message || 'Unknown error'}`);
            }
        }
    };

    const uploadFile = async (
        id: string,
        file: File,
        uploadId: string,
        onProgress?: (progress: { percent: number }) => void
    ) => {
        const maxSizeBytes = 200 * 1024 * 1024; // 200MB

        if (file.size > maxSizeBytes) {
            throw new Error(`File too large. Maximum size is ${maxSizeBytes / 1024 / 1024}MB`);
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post(`/soundfragments/files/${id}?uploadId=${uploadId}`, formData, {
                timeout: 600000, // 10 minutes
                maxContentLength: 200 * 1024 * 1024,
                maxBodyLength: 200 * 1024 * 1024,
                onUploadProgress: (evt: AxiosProgressEvent) => {
                    try {
                        const total = (evt.total ?? 0);
                        if (total > 0) {
                            const percent = Math.round((evt.loaded / total) * 100);
                            onProgress?.({ percent });
                        }
                    } catch (_) {
                        // ignore progress errors
                    }
                }
            });
            return response.data;
        } catch (error: any) {
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                switch (status) {
                    case 413:
                        throw new Error('File size exceeds server limits. Please choose a smaller file.');
                    case 415:
                        throw new Error('Unsupported file type. Only audio files are allowed.');
                    case 400:
                        const message = typeof errorData === 'string' ? errorData :
                            (errorData?.error?.message || errorData?.message || 'Invalid file upload request');
                        throw new Error(message);
                    case 403:
                        throw new Error('You do not have permission to upload files');
                    case 500:
                        throw new Error('Server error occurred during upload. Please try again.');
                    default:
                        throw new Error(`Upload failed: ${errorData?.error?.message || errorData?.message || `HTTP ${status}`}`);
                }
            } else if (error.code === 'ECONNABORTED' || (error.message || '').includes('timeout')) {
                throw new Error('Upload timeout. Please try with a smaller file or check your connection.');
            } else if ((error.message || '').includes('Network Error')) {
                throw new Error('Network error. Please check your connection and try again.');
            } else {
                throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
            }
        }
    };

    const updateCurrent = (data: SoundFragment, actions: any = {}) => {
        apiFormResponse.value = { docData: data, actions };
    };

    const save = async (data: SoundFragmentSave, id: string) => {
        const endpoint = id ? `/soundfragments/${id}` : '/soundfragments/';
        const response = await apiClient.post(endpoint, data);
        if (!response?.data) throw new Error('Invalid API response');
        apiFormResponse.value = response.data;
        return apiFormResponse.value;
    };

    const downloadFile = async (url: string, fileName?: string) => {
        try {
            const response = await apiClient.get(url, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], {
                type: response.headers['content-type'] || 'application/octet-stream'
            });
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || url.split('/').pop()?.split('?')[0] || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            return response;
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    };

    const deleteSoundFragment = async (id: string) => {
        await apiClient.delete(`/soundfragments/${id}`);
    };

    const fetchAccessList = async (id: string) => {
        const response = await apiClient.get(`/soundfragments/${id}/access`);
        if (!response?.data) throw new Error('Invalid API response');
        return response.data;
    };

    const bulkBrandUpdate = async (documentIds: string[], brands: string[], operation: 'SET' | 'UNSET') => {
        const response = await apiClient.post('/soundfragments/bulk-brand-update', {
            documentIds,
            brands,
            operation
        });
        if (!response?.data) throw new Error('Invalid API response');
        return response.data;
    };

    const archiveSoundFragment = async (id: string) => {
        const response = await apiClient.post(`/soundfragments/${id}/archive`);
        if (!response?.data) throw new Error('Invalid API response');
        return response.data;
    };

    // Centralized display mapping for source values
    const formatSource = (source?: string): string => {
        const map: Record<string, string> = {
            USER_UPLOAD: "User's Upload",
            CONTRIBUTION: 'Contribution',
            RECOVERED_FROM_SPACES: 'Recovered',
            ORPHAN_RECOVERY: 'Recovered',
            SUNO_PROMPT: 'Generative prompt',
            TEXT_FOR_TTS: 'Text to Speech'
        };
        return source ? (map[source] ?? source) : '';
    };

    return {
        apiViewResponse,
        apiFormResponse,
        availableApiViewResponse,
        getEntries,
        getAvailableSoundFragments,
        getCurrent,
        getPagination,
        getAvailablePagination,
        fetchAll: fetchSoundFragments,
        fetchAvailableSoundFragments,
        fetch: fetchSoundFragment,
        save,
        delete: deleteSoundFragment,
        uploadFile,
        startUploadSession,
        updateCurrent,
        downloadFile,
        fetchAccessList,
        bulkBrandUpdate,
        archive: archiveSoundFragment,
        formatSource
    };
});