import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient from '../../api/apiClient';
import type { ApiFormResponse, ApiViewPageResponse } from "../../types";
import type { SoundFragment, SoundFragmentSave } from "../../types/kneoBroadcasterTypes";

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

    const fetchSoundFragments = async (page = 1, pageSize = 10, searchQuery = '') => {
        let url = `/soundfragments?page=${page}&size=${pageSize}`;
        if (searchQuery) {
            url = `/soundfragments/search?q=${encodeURIComponent(searchQuery)}&page=${page}&size=${pageSize}`;
        }
        const response = await apiClient.get(url);
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

    const uploadFile = async (id: string, file: File) => {
        const maxSizeBytes = 100 * 1024 * 1024; // 100MB
    
        if (file.size > maxSizeBytes) {
            throw new Error(`File too large. Maximum size is ${maxSizeBytes / 1024 / 1024}MB`);
        }
    
        const formData = new FormData();
        formData.append('file', file);
    
        try {
            const response = await apiClient.post('/soundfragments/files/' + id, formData, {
                timeout: 600000, // 10 minutes
                maxContentLength: 120 * 1024 * 1024,
                maxBodyLength: 120 * 1024 * 1024,
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
            } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                throw new Error('Upload timeout. Please try with a smaller file or check your connection.');
            } else if (error.message.includes('Network Error')) {
                throw new Error('Network error. Please check your connection and try again.');
            } else {
                throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
            }
        }
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

    const pollUploadProgress = async (uploadId: string, onProgress: (percentage: number) => void): Promise<any> => {
        return new Promise((resolve, reject) => {
            let lastReportedProgress = -1;
            let pollCount = 0;
            let consecutiveErrors = 0;
            const maxRetries = 3;

            const pollInterval = setInterval(async () => {
                try {
                    pollCount++;
                    console.log(`Poll #${pollCount} for uploadId: ${uploadId}`);

                    const progressResponse = await apiClient.get(`/soundfragments/upload-progress/${uploadId}`);
                    const progress = progressResponse.data;

                    console.log(`Server response [${pollCount}]:`, {
                        percentage: progress.percentage,
                        status: progress.status,
                        url: progress.url ? 'present' : 'null'
                    });

                    // Reset error counter on successful response
                    consecutiveErrors = 0;

                    if (progress.percentage !== lastReportedProgress || pollCount === 1) {
                        lastReportedProgress = progress.percentage;
                        onProgress(progress.percentage);
                    }

                    if (progress.status === 'finished') {
                        clearInterval(pollInterval);
                        console.log(`Upload completed after ${pollCount} polls`);
                        resolve(progress);
                    } else if (progress.status === 'error') {
                        clearInterval(pollInterval);
                        console.error(`Upload failed after ${pollCount} polls`);
                        reject(new Error('Upload processing failed on server'));
                    }
                } catch (error: any) {
                    consecutiveErrors++;
                    console.error(`Progress polling failed on poll #${pollCount}:`, error);

                    // If it's a connection error and we haven't exceeded retries, continue
                    if (error.response?.status >= 500 || error.code === 'NETWORK_ERROR') {
                        if (consecutiveErrors <= maxRetries) {
                            console.log(`Connection error, retrying... (${consecutiveErrors}/${maxRetries})`);
                            return; // Continue polling
                        }
                    }

                    // If it's a 404, the upload session might not exist yet
                    if (error.response?.status === 404 && pollCount <= 3) {
                        console.log('Upload session not found yet, continuing...');
                        return;
                    }

                    clearInterval(pollInterval);
                    console.error(`Progress polling failed permanently after ${pollCount} polls`);
                    reject(error);
                }
            }, 500); // Poll every 500ms

            // Timeout after 10 minutes
            setTimeout(() => {
                clearInterval(pollInterval);
                console.error(`Upload timeout after ${pollCount} polls`);
                reject(new Error('Upload processing timeout'));
            }, 10 * 60 * 1000);
        });
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
        fetchAvailable: fetchAvailableSoundFragments,
        fetch: fetchSoundFragment,
        save,
        delete: deleteSoundFragment,
        uploadFile,
        pollUploadProgress,
        updateCurrent,
        downloadFile,
        fetchAccessList
    };
});